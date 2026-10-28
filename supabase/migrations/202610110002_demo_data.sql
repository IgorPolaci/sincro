create or replace function public.populate_demo_data()
returns jsonb language plpgsql security definer set search_path='' as $$
declare org uuid:=public.current_organization_id(); actor uuid:=public.current_profile_id(); store_unit uuid; tech_unit uuid; category_accessories uuid; category_food uuid; brand_id uuid; type_id uuid; model_id uuid; status_id uuid; customer_id uuid; product_id uuid; item record; inserted_count integer; service_order_id uuid;
begin
  if org is null or actor is null or not public.has_permission('settings.manage') then raise exception 'Acesso negado'; end if;
  if exists(select 1 from public.audit_logs where organization_id=org and action='DEMO_DATA_SEEDED') then
    return jsonb_build_object('created',false,'message','A massa de demonstração já foi carregada nesta organização.');
  end if;
  select id into store_unit from public.business_units where organization_id=org and type='STORE_DELIVERY';
  select id into tech_unit from public.business_units where organization_id=org and type='TECHNICAL_ASSISTANCE';
  if store_unit is null or tech_unit is null then raise exception 'Unidades operacionais não encontradas'; end if;

  insert into public.product_categories(organization_id,name,description) values(org,'Demo · Acessórios','Acessórios para demonstração') on conflict(organization_id,name) do update set description=excluded.description returning id into category_accessories;
  insert into public.product_categories(organization_id,name,description) values(org,'Demo · Conveniência','Itens para a loja online') on conflict(organization_id,name) do update set description=excluded.description returning id into category_food;
  insert into public.brands(organization_id,name) values(org,'DemoTech') on conflict(organization_id,name) do update set active=true returning id into brand_id;
  insert into public.suppliers(organization_id,name,email,phone,created_by) values(org,'Demo Distribuidora','contato@demo.local','11999990000',actor) on conflict(organization_id,document) do nothing;
  insert into public.equipment_types(organization_id,name) values(org,'Smartphone') on conflict(organization_id,name) do update set active=true returning id into type_id;
  insert into public.equipment_models(organization_id,equipment_type_id,brand_id,name) values(org,type_id,brand_id,'DemoPhone X') on conflict(organization_id,equipment_type_id,brand_id,name) do update set active=true returning id into model_id;
  insert into public.service_catalog(organization_id,name,description,price,estimated_minutes,warranty_days) values
    (org,'Troca de tela','Substituição de display com garantia',279.90,90,90),
    (org,'Limpeza técnica','Higienização e revisão preventiva',89.90,45,30)
  on conflict(organization_id,name) do nothing;

  for item in select * from jsonb_to_recordset('[
    {"name":"Mariana Oliveira","phone":"11987654321","email":"mariana.oliveira@demo.local"},
    {"name":"Rafael Santos","phone":"11987654322","email":"rafael.santos@demo.local"},
    {"name":"Camila Ferreira","phone":"11987654323","email":"camila.ferreira@demo.local"},
    {"name":"João Pedro Lima","phone":"11987654324","email":"joao.lima@demo.local"},
    {"name":"Beatriz Costa","phone":"11987654325","email":"beatriz.costa@demo.local"},
    {"name":"Lucas Almeida","phone":"11987654326","email":"lucas.almeida@demo.local"}
  ]'::jsonb) as x(name text,phone text,email text) loop
    insert into public.customers(organization_id,name,phone,whatsapp,email,created_by,updated_by)
    values(org,item.name,item.phone,item.phone,item.email,actor,actor)
    on conflict(organization_id,document) do nothing;
  end loop;

  for item in select * from jsonb_to_recordset('[
    {"sku":"DEMO-CABO-01","name":"Cabo USB-C trançado 1m","cost":18.50,"price":39.90,"stock":35,"category":"ACCESS"},
    {"sku":"DEMO-CAPA-02","name":"Capa transparente DemoPhone X","cost":12.00,"price":29.90,"stock":24,"category":"ACCESS"},
    {"sku":"DEMO-FONE-03","name":"Fone Bluetooth compacto","cost":42.00,"price":99.90,"stock":18,"category":"ACCESS"},
    {"sku":"DEMO-CARREG-04","name":"Carregador rápido 20W","cost":35.00,"price":79.90,"stock":16,"category":"ACCESS"},
    {"sku":"DEMO-PEL-05","name":"Película premium 3D","cost":8.00,"price":24.90,"stock":40,"category":"ACCESS"},
    {"sku":"DEMO-AGUA-06","name":"Água mineral 500 ml","cost":2.20,"price":5.50,"stock":48,"category":"FOOD"},
    {"sku":"DEMO-REFRI-07","name":"Refrigerante lata 350 ml","cost":3.80,"price":8.50,"stock":36,"category":"FOOD"},
    {"sku":"DEMO-SNACK-08","name":"Snack crocante 45 g","cost":4.50,"price":10.90,"stock":28,"category":"FOOD"}
  ]'::jsonb) as x(sku text,name text,cost numeric,price numeric,stock numeric,category text) loop
    insert into public.products(organization_id,sku,name,category_id,brand_id,cost_price,sale_price,minimum_stock,unit,active,created_by,updated_by)
    values(org,item.sku,item.name,case when item.category='ACCESS' then category_accessories else category_food end,brand_id,item.cost,item.price,5,'UN',true,actor,actor)
    on conflict(organization_id,sku) do update set name=excluded.name,sale_price=excluded.sale_price,updated_by=actor
    returning id into product_id;
    insert into public.inventory(organization_id,business_unit_id,product_id,quantity)
    values(org,store_unit,product_id,item.stock) on conflict(organization_id,business_unit_id,product_id) do nothing;
    get diagnostics inserted_count=row_count;
    if inserted_count>0 then
      insert into public.inventory_movements(organization_id,business_unit_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reason,created_by)
      values(org,store_unit,product_id,'INITIAL',item.stock,0,item.stock,'DEMONSTRATION','Carga inicial para demonstração',actor);
    end if;
    insert into public.inventory(organization_id,business_unit_id,product_id,quantity)
    values(org,tech_unit,product_id,greatest(2,item.stock/4)) on conflict(organization_id,business_unit_id,product_id) do nothing;
    get diagnostics inserted_count=row_count;
    if inserted_count>0 then
      insert into public.inventory_movements(organization_id,business_unit_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reason,created_by)
      values(org,tech_unit,product_id,'INITIAL',greatest(2,item.stock/4),0,greatest(2,item.stock/4),'DEMONSTRATION','Carga inicial para demonstração',actor);
    end if;
  end loop;

  update public.ecommerce_products set is_published=true,is_featured=slug in ('cabo-usb-c-trancado-1m','fone-bluetooth-compacto','refrigerante-lata-350-ml'),published_at=coalesce(published_at,now())
  where organization_id=org and business_unit_id=store_unit and product_id in (select id from public.products where organization_id=org and sku like 'DEMO-%');
  insert into public.delivery_zones(organization_id,business_unit_id,name,neighborhood,fee,minimum_order) values
    (org,store_unit,'Centro','Centro',5.00,20.00),(org,store_unit,'Jardins','Jardins',8.00,30.00),(org,store_unit,'Vila Nova','Vila Nova',10.00,35.00)
  on conflict(organization_id,business_unit_id,neighborhood) do nothing;
  insert into public.coupons(organization_id,business_unit_id,code,discount_type,discount_value,minimum_order,usage_limit) values
    (org,store_unit,'BEMVINDO10','PERCENT',10,30,100),(org,store_unit,'DEMO15','FIXED',15,80,50)
  on conflict(organization_id,business_unit_id,code) do nothing;

  select id into customer_id from public.customers where organization_id=org and email='mariana.oliveira@demo.local' limit 1;
  select id into status_id from public.service_order_statuses where organization_id=org and business_unit_id=tech_unit and code='ORCAMENTO_PENDENTE';
  if customer_id is not null and status_id is not null then
    insert into public.service_orders(organization_id,business_unit_id,number,customer_id,status_id,equipment_type_id,equipment_model_id,equipment_name,brand_name,model_name,imei,reported_defect,visible_damage,general_notes,estimated_delivery_at,created_by,updated_by)
    values(org,tech_unit,'DEMO-OS-001',customer_id,status_id,type_id,model_id,'Smartphone','DemoTech','DemoPhone X','351234567890123','Tela sem imagem após queda','Pequeno risco na tampa traseira','Cliente autorizou orçamento por WhatsApp',now()+interval '2 days',actor,actor)
    on conflict(organization_id,number) do nothing returning id into service_order_id;
    if service_order_id is not null then insert into public.service_order_status_history(organization_id,business_unit_id,service_order_id,to_status_id,note,changed_by) values(org,tech_unit,service_order_id,status_id,'O.S. criada para demonstração',actor); end if;
  end if;
  insert into public.audit_logs(organization_id,user_id,action,entity,new_data) values(org,actor,'DEMO_DATA_SEEDED','demonstration',jsonb_build_object('products',8,'customers',6,'service_orders',1));
  return jsonb_build_object('created',true,'customers',6,'products',8,'service_orders',1,'message','Massa de demonstração carregada.');
end $$;
revoke all on function public.populate_demo_data() from public;
grant execute on function public.populate_demo_data() to authenticated;
