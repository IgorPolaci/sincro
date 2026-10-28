-- Replace the initial loader with identifiers that cannot conflict with table columns.
create or replace function public.populate_demo_data()
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_org uuid:=public.current_organization_id(); v_actor uuid:=public.current_profile_id();
  v_store_unit uuid; v_tech_unit uuid; v_category uuid; v_brand uuid; v_product uuid; v_inserted integer; v_item record;
begin
  if v_org is null or v_actor is null or not public.has_permission('settings.manage') then raise exception 'Acesso negado'; end if;
  if exists(select 1 from public.audit_logs where organization_id=v_org and action='DEMO_DATA_SEEDED') then
    return jsonb_build_object('created',false,'message','A massa de demonstração já foi carregada nesta organização.');
  end if;
  select id into v_store_unit from public.business_units where organization_id=v_org and type='STORE_DELIVERY';
  select id into v_tech_unit from public.business_units where organization_id=v_org and type='TECHNICAL_ASSISTANCE';
  if v_store_unit is null or v_tech_unit is null then raise exception 'Unidades operacionais não encontradas'; end if;
  insert into public.product_categories(organization_id,name,description) values(v_org,'Demo · Produtos','Produtos para apresentação')
  on conflict(organization_id,name) do update set description=excluded.description returning id into v_category;
  insert into public.brands(organization_id,name) values(v_org,'DemoTech') on conflict(organization_id,name) do update set active=true returning id into v_brand;
  for v_item in select * from jsonb_to_recordset('[
    {"name":"Mariana Oliveira","phone":"11987654321","email":"mariana.oliveira@demo.local"},
    {"name":"Rafael Santos","phone":"11987654322","email":"rafael.santos@demo.local"},
    {"name":"Camila Ferreira","phone":"11987654323","email":"camila.ferreira@demo.local"},
    {"name":"João Pedro Lima","phone":"11987654324","email":"joao.lima@demo.local"},
    {"name":"Beatriz Costa","phone":"11987654325","email":"beatriz.costa@demo.local"},
    {"name":"Lucas Almeida","phone":"11987654326","email":"lucas.almeida@demo.local"}
  ]'::jsonb) as x(name text,phone text,email text) loop
    insert into public.customers(organization_id,name,phone,whatsapp,email,created_by,updated_by)
    values(v_org,v_item.name,v_item.phone,v_item.phone,v_item.email,v_actor,v_actor);
  end loop;
  for v_item in select * from jsonb_to_recordset('[
    {"sku":"DEMO-CABO-01","name":"Cabo USB-C trançado 1m","cost":18.50,"price":39.90,"stock":35},
    {"sku":"DEMO-CAPA-02","name":"Capa transparente DemoPhone X","cost":12.00,"price":29.90,"stock":24},
    {"sku":"DEMO-FONE-03","name":"Fone Bluetooth compacto","cost":42.00,"price":99.90,"stock":18},
    {"sku":"DEMO-CARREG-04","name":"Carregador rápido 20W","cost":35.00,"price":79.90,"stock":16},
    {"sku":"DEMO-PEL-05","name":"Película premium 3D","cost":8.00,"price":24.90,"stock":40},
    {"sku":"DEMO-AGUA-06","name":"Água mineral 500 ml","cost":2.20,"price":5.50,"stock":48},
    {"sku":"DEMO-REFRI-07","name":"Refrigerante lata 350 ml","cost":3.80,"price":8.50,"stock":36},
    {"sku":"DEMO-SNACK-08","name":"Snack crocante 45 g","cost":4.50,"price":10.90,"stock":28}
  ]'::jsonb) as x(sku text,name text,cost numeric,price numeric,stock numeric) loop
    insert into public.products(organization_id,sku,name,category_id,brand_id,cost_price,sale_price,minimum_stock,unit,active,created_by,updated_by)
    values(v_org,v_item.sku,v_item.name,v_category,v_brand,v_item.cost,v_item.price,5,'UN',true,v_actor,v_actor)
    on conflict(organization_id,sku) do update set name=excluded.name,sale_price=excluded.sale_price,updated_by=v_actor returning id into v_product;
    insert into public.inventory(organization_id,business_unit_id,product_id,quantity) values(v_org,v_store_unit,v_product,v_item.stock) on conflict(organization_id,business_unit_id,product_id) do nothing;
    get diagnostics v_inserted=row_count;
    if v_inserted>0 then insert into public.inventory_movements(organization_id,business_unit_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reason,created_by) values(v_org,v_store_unit,v_product,'INITIAL',v_item.stock,0,v_item.stock,'DEMONSTRATION','Carga inicial para demonstração',v_actor); end if;
    insert into public.inventory(organization_id,business_unit_id,product_id,quantity) values(v_org,v_tech_unit,v_product,greatest(2,v_item.stock/4)) on conflict(organization_id,business_unit_id,product_id) do nothing;
    get diagnostics v_inserted=row_count;
    if v_inserted>0 then insert into public.inventory_movements(organization_id,business_unit_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reason,created_by) values(v_org,v_tech_unit,v_product,'INITIAL',greatest(2,v_item.stock/4),0,greatest(2,v_item.stock/4),'DEMONSTRATION','Carga inicial para demonstração',v_actor); end if;
  end loop;
  update public.ecommerce_products set is_published=true,published_at=coalesce(published_at,now()) where organization_id=v_org and business_unit_id=v_store_unit and product_id in (select id from public.products where organization_id=v_org and sku like 'DEMO-%');
  insert into public.delivery_zones(organization_id,business_unit_id,name,neighborhood,fee,minimum_order) values(v_org,v_store_unit,'Centro','Centro',5,20),(v_org,v_store_unit,'Jardins','Jardins',8,30),(v_org,v_store_unit,'Vila Nova','Vila Nova',10,35) on conflict(organization_id,business_unit_id,neighborhood) do nothing;
  insert into public.coupons(organization_id,business_unit_id,code,discount_type,discount_value,minimum_order,usage_limit) values(v_org,v_store_unit,'BEMVINDO10','PERCENT',10,30,100),(v_org,v_store_unit,'DEMO15','FIXED',15,80,50) on conflict(organization_id,business_unit_id,code) do nothing;
  insert into public.audit_logs(organization_id,user_id,action,entity,new_data) values(v_org,v_actor,'DEMO_DATA_SEEDED','demonstration',jsonb_build_object('products',8,'customers',6));
  return jsonb_build_object('created',true,'customers',6,'products',8,'message','Massa de demonstração carregada.');
end $$;
revoke all on function public.populate_demo_data() from public;
grant execute on function public.populate_demo_data() to authenticated;
