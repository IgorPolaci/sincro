-- E-commerce management layer. The shared product remains the fiscal/inventory
-- record; ecommerce_products controls what the consumer can see and buy.

alter table public.delivery_settings add column description text;
alter table public.delivery_settings add column accent_color text not null default '#126b50';
alter table public.delivery_settings add column logo_path text;
alter table public.delivery_settings add column banner_path text;
alter table public.delivery_settings add constraint delivery_settings_accent_color_check check(accent_color ~ '^#[0-9A-Fa-f]{6}$');

create table public.ecommerce_products (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), product_id uuid not null references public.products(id),
  category_id uuid references public.product_categories(id), display_name text not null, slug text not null,
  short_description text, description text, online_price numeric(14,2) check(online_price is null or online_price>=0),
  promotional_price numeric(14,2) check(promotional_price is null or promotional_price>=0),
  promotion_starts_at timestamptz, promotion_ends_at timestamptz,
  is_published boolean not null default false, is_featured boolean not null default false,
  available_for_delivery boolean not null default true, available_for_pickup boolean not null default true,
  max_per_order numeric(14,3) check(max_per_order is null or max_per_order>0), sort_order integer not null default 0,
  seo_title text, seo_description text, published_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(organization_id,business_unit_id,product_id), unique(organization_id,business_unit_id,slug),
  foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id),
  check(promotional_price is null or online_price is null or promotional_price<=online_price),
  check(promotion_ends_at is null or promotion_starts_at is null or promotion_ends_at>promotion_starts_at)
);

create table public.ecommerce_product_images (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  ecommerce_product_id uuid not null references public.ecommerce_products(id), storage_path text not null,
  alt_text text, position integer not null default 0, is_primary boolean not null default false,
  created_at timestamptz not null default now(), removed_at timestamptz,
  unique(organization_id,storage_path)
);

create table public.ecommerce_option_groups (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  ecommerce_product_id uuid not null references public.ecommerce_products(id), name text not null,
  minimum_selections integer not null default 0 check(minimum_selections>=0),
  maximum_selections integer not null default 1 check(maximum_selections>0),
  position integer not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(maximum_selections>=minimum_selections)
);

create table public.ecommerce_options (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  option_group_id uuid not null references public.ecommerce_option_groups(id), name text not null,
  price_delta numeric(14,2) not null default 0, position integer not null default 0,
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.online_order_item_options (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  online_order_item_id uuid not null references public.online_order_items(id), option_id uuid references public.ecommerce_options(id),
  group_name text not null, option_name text not null, price_delta numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create index ecommerce_products_unit_published_idx on public.ecommerce_products(organization_id,business_unit_id,is_published,sort_order);
create index ecommerce_images_product_idx on public.ecommerce_product_images(ecommerce_product_id,position) where removed_at is null;
create index ecommerce_groups_product_idx on public.ecommerce_option_groups(ecommerce_product_id,position) where active;
create index ecommerce_options_group_idx on public.ecommerce_options(option_group_id,position) where active;
create index online_order_item_options_item_idx on public.online_order_item_options(online_order_item_id);

do $$ declare t text; begin foreach t in array array['ecommerce_products','ecommerce_product_images','ecommerce_option_groups','ecommerce_options','online_order_item_options'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;

create policy ecommerce_products_select on public.ecommerce_products for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.view'));
create policy ecommerce_products_manage on public.ecommerce_products for all to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.manage')) with check(organization_id=public.current_organization_id() and public.has_permission('delivery.manage'));
create policy ecommerce_images_select on public.ecommerce_product_images for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.view'));
create policy ecommerce_images_manage on public.ecommerce_product_images for all to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.manage')) with check(organization_id=public.current_organization_id() and public.has_permission('delivery.manage'));
create policy ecommerce_groups_select on public.ecommerce_option_groups for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.view'));
create policy ecommerce_groups_manage on public.ecommerce_option_groups for all to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.manage')) with check(organization_id=public.current_organization_id() and public.has_permission('delivery.manage'));
create policy ecommerce_options_select on public.ecommerce_options for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.view'));
create policy ecommerce_options_manage on public.ecommerce_options for all to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.manage')) with check(organization_id=public.current_organization_id() and public.has_permission('delivery.manage'));
create policy online_order_item_options_select on public.online_order_item_options for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.view'));

create trigger ecommerce_products_updated_at before update on public.ecommerce_products for each row execute function public.set_updated_at();
create trigger ecommerce_groups_updated_at before update on public.ecommerce_option_groups for each row execute function public.set_updated_at();
create trigger ecommerce_options_updated_at before update on public.ecommerce_options for each row execute function public.set_updated_at();
create trigger ecommerce_products_audit after insert or update on public.ecommerce_products for each row execute function public.audit_row_change();
create trigger ecommerce_groups_audit after insert or update on public.ecommerce_option_groups for each row execute function public.audit_row_change();
create trigger ecommerce_options_audit after insert or update on public.ecommerce_options for each row execute function public.audit_row_change();

insert into public.ecommerce_products(organization_id,business_unit_id,product_id,category_id,display_name,slug,online_price)
select p.organization_id,bu.id,p.id,p.category_id,p.name,
  lower(trim(both '-' from regexp_replace(regexp_replace(p.name,'[^a-zA-Z0-9]+','-','g'),'-+','-','g')))||'-'||substr(replace(p.id::text,'-',''),1,6),p.sale_price
from public.products p join public.business_units bu on bu.organization_id=p.organization_id and bu.type='STORE_DELIVERY'
where p.deleted_at is null on conflict do nothing;

create or replace function public.provision_ecommerce_product()
returns trigger language plpgsql security definer set search_path='' as $$
declare unit_id uuid;
begin
  select id into unit_id from public.business_units where organization_id=new.organization_id and type='STORE_DELIVERY' limit 1;
  if unit_id is not null then
    insert into public.ecommerce_products(organization_id,business_unit_id,product_id,category_id,display_name,slug,online_price)
    values(new.organization_id,unit_id,new.id,new.category_id,new.name,
      lower(trim(both '-' from regexp_replace(regexp_replace(new.name,'[^a-zA-Z0-9]+','-','g'),'-+','-','g')))||'-'||substr(replace(new.id::text,'-',''),1,6),new.sale_price)
    on conflict do nothing;
  end if;
  return new;
end $$;
create trigger products_ecommerce_provision after insert on public.products for each row execute function public.provision_ecommerce_product();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('storefront-assets','storefront-assets',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy storefront_assets_insert on storage.objects for insert to authenticated
with check(bucket_id='storefront-assets' and (storage.foldername(name))[1]=public.current_organization_id()::text and public.has_permission('delivery.manage'));
create policy storefront_assets_update on storage.objects for update to authenticated
using(bucket_id='storefront-assets' and (storage.foldername(name))[1]=public.current_organization_id()::text and public.has_permission('delivery.manage'))
with check(bucket_id='storefront-assets' and (storage.foldername(name))[1]=public.current_organization_id()::text and public.has_permission('delivery.manage'));
create policy storefront_assets_delete on storage.objects for delete to authenticated
using(bucket_id='storefront-assets' and (storage.foldername(name))[1]=public.current_organization_id()::text and public.has_permission('delivery.manage'));

create or replace function public.get_public_catalog(p_slug text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare org uuid; unit_id uuid; settings_row public.delivery_settings; result jsonb;
begin
  select o.id,bu.id into org,unit_id from public.organizations o join public.business_units bu on bu.organization_id=o.id and bu.type='STORE_DELIVERY' and bu.active
  where o.catalog_slug=lower(trim(p_slug)) and o.active limit 1;
  if org is null then raise exception 'Loja não encontrada'; end if;
  select * into settings_row from public.delivery_settings where organization_id=org and business_unit_id=unit_id;
  select jsonb_build_object(
    'store',jsonb_build_object('name',settings_row.store_name,'slug',lower(trim(p_slug)),'description',settings_row.description,'is_open',settings_row.is_open,'minimum_order',settings_row.minimum_order,'delivery_enabled',settings_row.delivery_enabled,'pickup_enabled',settings_row.pickup_enabled,'local_enabled',settings_row.local_enabled,'whatsapp',settings_row.whatsapp,'opening_hours',settings_row.opening_hours,'accent_color',settings_row.accent_color,'logo_path',settings_row.logo_path,'banner_path',settings_row.banner_path),
    'zones',coalesce((select jsonb_agg(jsonb_build_object('id',z.id,'name',z.name,'neighborhood',z.neighborhood,'fee',z.fee,'minimum_order',z.minimum_order) order by z.name) from public.delivery_zones z where z.organization_id=org and z.business_unit_id=unit_id and z.active),'[]'::jsonb),
    'categories',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'description',c.description) order by c.name) from public.product_categories c where c.organization_id=org and c.active and c.deleted_at is null and exists(select 1 from public.ecommerce_products ep where ep.category_id=c.id and ep.business_unit_id=unit_id and ep.is_published)),'[]'::jsonb),
    'products',coalesce((select jsonb_agg(jsonb_build_object(
      'id',p.id,'listing_id',ep.id,'name',ep.display_name,'slug',ep.slug,'description',coalesce(ep.short_description,ep.description,p.description),'category_id',ep.category_id,
      'price',case when ep.promotional_price is not null and (ep.promotion_starts_at is null or ep.promotion_starts_at<=now()) and (ep.promotion_ends_at is null or ep.promotion_ends_at>now()) then ep.promotional_price else coalesce(ep.online_price,p.sale_price) end,
      'regular_price',coalesce(ep.online_price,p.sale_price),'promotional',ep.promotional_price is not null and (ep.promotion_starts_at is null or ep.promotion_starts_at<=now()) and (ep.promotion_ends_at is null or ep.promotion_ends_at>now()),
      'available',least(greatest(0,i.quantity-coalesce(r.reserved,0)),coalesce(ep.max_per_order,i.quantity)),'featured',ep.is_featured,
      'delivery',ep.available_for_delivery,'pickup',ep.available_for_pickup,
      'images',coalesce((select jsonb_agg(jsonb_build_object('path',img.storage_path,'alt',img.alt_text,'primary',img.is_primary) order by img.is_primary desc,img.position) from public.ecommerce_product_images img where img.ecommerce_product_id=ep.id and img.removed_at is null),'[]'::jsonb),
      'option_groups',coalesce((select jsonb_agg(jsonb_build_object('id',g.id,'name',g.name,'minimum',g.minimum_selections,'maximum',g.maximum_selections,'options',coalesce((select jsonb_agg(jsonb_build_object('id',op.id,'name',op.name,'price_delta',op.price_delta) order by op.position,op.name) from public.ecommerce_options op where op.option_group_id=g.id and op.active),'[]'::jsonb)) order by g.position,g.name) from public.ecommerce_option_groups g where g.ecommerce_product_id=ep.id and g.active),'[]'::jsonb)
    ) order by ep.is_featured desc,ep.sort_order,ep.display_name)
      from public.ecommerce_products ep join public.products p on p.id=ep.product_id
      join public.inventory i on i.organization_id=org and i.business_unit_id=unit_id and i.product_id=p.id
      left join lateral (select sum(ir.quantity) reserved from public.inventory_reservations ir where ir.organization_id=org and ir.business_unit_id=unit_id and ir.product_id=p.id and ir.status='ACTIVE' and ir.expires_at>now()) r on true
      where ep.organization_id=org and ep.business_unit_id=unit_id and ep.is_published and p.active and p.deleted_at is null and i.quantity-coalesce(r.reserved,0)>0),'[]'::jsonb)
  ) into result;
  return result;
end $$;

create or replace function public.create_public_order(
  p_slug text,p_customer_name text,p_customer_phone text,p_fulfillment public.fulfillment_type,
  p_delivery_zone_id uuid,p_address jsonb,p_payment_method public.payment_method,p_cash_change_for numeric,
  p_coupon_code text,p_items jsonb,p_notes text default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare org uuid; unit_id uuid; settings_row public.delivery_settings; zone_row public.delivery_zones; coupon_row public.coupons;
declare order_uuid uuid; customer_uuid uuid; item jsonb; product_row public.products; listing_row public.ecommerce_products; inventory_row public.inventory;
declare qty numeric(14,3); reserved numeric(14,3); base_price numeric(14,2); options_price numeric(14,2); line_price numeric(14,2);
declare subtotal_value numeric(14,2):=0; discount_value numeric(14,2):=0; fee_value numeric(14,2):=0; total_value numeric(14,2); order_number text;
declare selected_options jsonb; selected_count integer; group_row public.ecommerce_option_groups; option_row record; order_item_id uuid;
begin
  if length(trim(p_customer_name))<2 or length(regexp_replace(p_customer_phone,'\D','','g'))<8 then raise exception 'Dados do cliente inválidos'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 or jsonb_array_length(p_items)>100 then raise exception 'Pedido sem itens'; end if;
  select o.id,bu.id into org,unit_id from public.organizations o join public.business_units bu on bu.organization_id=o.id and bu.type='STORE_DELIVERY' and bu.active where o.catalog_slug=lower(trim(p_slug)) and o.active limit 1;
  if org is null then raise exception 'Loja não encontrada'; end if;
  select * into settings_row from public.delivery_settings where organization_id=org and business_unit_id=unit_id;
  if not found or not settings_row.is_open then raise exception 'Loja fechada'; end if;
  if (p_fulfillment='DELIVERY' and not settings_row.delivery_enabled) or (p_fulfillment='PICKUP' and not settings_row.pickup_enabled) or (p_fulfillment='LOCAL' and not settings_row.local_enabled) then raise exception 'Modalidade indisponível'; end if;
  if p_fulfillment='DELIVERY' then select * into zone_row from public.delivery_zones where id=p_delivery_zone_id and organization_id=org and business_unit_id=unit_id and active;if not found or p_address is null then raise exception 'Área ou endereço de entrega inválido'; end if;fee_value:=zone_row.fee; end if;
  for item in select * from jsonb_array_elements(p_items) loop
    qty:=(item->>'quantity')::numeric;if qty<=0 then raise exception 'Quantidade inválida'; end if;
    select * into product_row from public.products where id=(item->>'product_id')::uuid and organization_id=org and active and deleted_at is null;if not found then raise exception 'Produto indisponível'; end if;
    select * into listing_row from public.ecommerce_products where product_id=product_row.id and organization_id=org and business_unit_id=unit_id and is_published;if not found then raise exception 'Produto não publicado'; end if;
    if (p_fulfillment='DELIVERY' and not listing_row.available_for_delivery) or (p_fulfillment='PICKUP' and not listing_row.available_for_pickup) then raise exception 'Produto indisponível para esta modalidade'; end if;
    if listing_row.max_per_order is not null and qty>listing_row.max_per_order then raise exception 'Quantidade máxima excedida para %',listing_row.display_name; end if;
    select * into inventory_row from public.inventory where organization_id=org and business_unit_id=unit_id and product_id=product_row.id for update;
    select coalesce(sum(quantity),0) into reserved from public.inventory_reservations where organization_id=org and business_unit_id=unit_id and product_id=product_row.id and status='ACTIVE' and expires_at>now();
    if inventory_row.id is null or inventory_row.quantity-reserved<qty then raise exception 'Estoque insuficiente para %',listing_row.display_name; end if;
    selected_options:=coalesce(item->'option_ids','[]'::jsonb);if jsonb_typeof(selected_options)<>'array' then raise exception 'Opções inválidas'; end if;
    select count(distinct op.id),coalesce(sum(op.price_delta),0) into selected_count,options_price from jsonb_array_elements_text(selected_options) s join public.ecommerce_options op on op.id=s.value::uuid and op.active join public.ecommerce_option_groups g on g.id=op.option_group_id and g.active where g.ecommerce_product_id=listing_row.id;
    if selected_count<>jsonb_array_length(selected_options) then raise exception 'Opção de produto inválida'; end if;
    for group_row in select * from public.ecommerce_option_groups where ecommerce_product_id=listing_row.id and active loop
      select count(*) into selected_count from jsonb_array_elements_text(selected_options) s join public.ecommerce_options op on op.id=s.value::uuid and op.active where op.option_group_id=group_row.id;
      if selected_count<group_row.minimum_selections or selected_count>group_row.maximum_selections then raise exception 'Selecione corretamente %',group_row.name; end if;
    end loop;
    base_price:=case when listing_row.promotional_price is not null and (listing_row.promotion_starts_at is null or listing_row.promotion_starts_at<=now()) and (listing_row.promotion_ends_at is null or listing_row.promotion_ends_at>now()) then listing_row.promotional_price else coalesce(listing_row.online_price,product_row.sale_price) end;
    line_price:=base_price+options_price;if line_price<0 then raise exception 'Preço de produto inválido'; end if;subtotal_value:=subtotal_value+round(line_price*qty,2);
  end loop;
  if subtotal_value<greatest(settings_row.minimum_order,coalesce(zone_row.minimum_order,0)) then raise exception 'Pedido abaixo do valor mínimo'; end if;
  if nullif(upper(trim(p_coupon_code)),'') is not null then
    select * into coupon_row from public.coupons where organization_id=org and business_unit_id=unit_id and code=upper(trim(p_coupon_code)) and active for update;
    if not found or (coupon_row.starts_at is not null and coupon_row.starts_at>now()) or (coupon_row.ends_at is not null and coupon_row.ends_at<now()) or (coupon_row.usage_limit is not null and coupon_row.usage_count>=coupon_row.usage_limit) or subtotal_value<coupon_row.minimum_order then raise exception 'Cupom inválido'; end if;
    discount_value:=case when coupon_row.discount_type='PERCENT' then round(subtotal_value*coupon_row.discount_value/100,2) else coupon_row.discount_value end;discount_value:=least(discount_value,coalesce(coupon_row.maximum_discount,discount_value),subtotal_value);
  end if;
  total_value:=subtotal_value-discount_value+fee_value;if p_payment_method='CASH' and p_cash_change_for is not null and p_cash_change_for<total_value then raise exception 'Troco inválido'; end if;
  select id into customer_uuid from public.customers where organization_id=org and regexp_replace(coalesce(phone,whatsapp,''),'\D','','g')=regexp_replace(p_customer_phone,'\D','','g') and deleted_at is null limit 1;
  if customer_uuid is null then insert into public.customers(organization_id,name,phone,whatsapp) values(org,trim(p_customer_name),trim(p_customer_phone),trim(p_customer_phone)) returning id into customer_uuid; end if;
  order_number:=lpad(nextval('public.online_order_number_seq')::text,8,'0');
  insert into public.online_orders(organization_id,business_unit_id,number,customer_id,customer_name,customer_phone,fulfillment,delivery_address,delivery_zone_id,subtotal,discount,delivery_fee,total,coupon_id,payment_method,cash_change_for,notes)
  values(org,unit_id,order_number,customer_uuid,trim(p_customer_name),trim(p_customer_phone),p_fulfillment,p_address,p_delivery_zone_id,subtotal_value,discount_value,fee_value,total_value,coupon_row.id,p_payment_method,p_cash_change_for,nullif(trim(p_notes),'')) returning id into order_uuid;
  for item in select * from jsonb_array_elements(p_items) loop
    qty:=(item->>'quantity')::numeric;select * into product_row from public.products where id=(item->>'product_id')::uuid;select * into listing_row from public.ecommerce_products where product_id=product_row.id and business_unit_id=unit_id;
    selected_options:=coalesce(item->'option_ids','[]'::jsonb);select coalesce(sum(op.price_delta),0) into options_price from jsonb_array_elements_text(selected_options) s join public.ecommerce_options op on op.id=s.value::uuid;
    base_price:=case when listing_row.promotional_price is not null and (listing_row.promotion_starts_at is null or listing_row.promotion_starts_at<=now()) and (listing_row.promotion_ends_at is null or listing_row.promotion_ends_at>now()) then listing_row.promotional_price else coalesce(listing_row.online_price,product_row.sale_price) end;line_price:=base_price+options_price;
    insert into public.online_order_items(order_id,organization_id,product_id,product_name,sku,quantity,unit_price,total) values(order_uuid,org,product_row.id,listing_row.display_name,product_row.sku,qty,line_price,round(line_price*qty,2)) returning id into order_item_id;
    for option_row in select g.name group_name,op.id,op.name,op.price_delta from jsonb_array_elements_text(selected_options) s join public.ecommerce_options op on op.id=s.value::uuid join public.ecommerce_option_groups g on g.id=op.option_group_id loop
      insert into public.online_order_item_options(organization_id,online_order_item_id,option_id,group_name,option_name,price_delta) values(org,order_item_id,option_row.id,option_row.group_name,option_row.name,option_row.price_delta);
    end loop;
    insert into public.inventory_reservations(organization_id,business_unit_id,order_id,product_id,quantity) values(org,unit_id,order_uuid,product_row.id,qty);
  end loop;
  if coupon_row.id is not null then update public.coupons set usage_count=usage_count+1 where id=coupon_row.id; end if;
  insert into public.online_order_status_history(order_id,organization_id,to_status,notes) values(order_uuid,org,'NEW','Pedido criado pelo catálogo público');
  insert into public.audit_logs(organization_id,action,entity,entity_id,new_data) values(org,'ONLINE_ORDER_CREATE','online_orders',order_uuid,jsonb_build_object('number',order_number,'total',total_value,'business_unit_id',unit_id));
  return jsonb_build_object('id',order_uuid,'number',order_number,'public_code',(select public_code from public.online_orders where id=order_uuid),'total',total_value);
end $$;

revoke all on function public.get_public_catalog(text) from public;
revoke all on function public.create_public_order(text,text,text,public.fulfillment_type,uuid,jsonb,public.payment_method,numeric,text,jsonb,text) from public;
grant execute on function public.get_public_catalog(text) to anon,authenticated;
grant execute on function public.create_public_order(text,text,text,public.fulfillment_type,uuid,jsonb,public.payment_method,numeric,text,jsonb,text) to anon,authenticated;
