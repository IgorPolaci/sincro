-- Public catalog and delivery ordering. Anonymous callers only use narrow RPCs;
-- operational tables remain protected by RLS.

alter table public.organizations add column catalog_slug text;
update public.organizations set catalog_slug='loja-'||substr(replace(id::text,'-',''),1,10) where catalog_slug is null;
alter table public.organizations alter column catalog_slug set not null;
alter table public.organizations add constraint organizations_catalog_slug_key unique(catalog_slug);

create type public.online_order_status as enum ('NEW','CONFIRMED','PREPARING','READY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED');
create type public.fulfillment_type as enum ('DELIVERY','PICKUP','LOCAL');
create type public.inventory_reservation_status as enum ('ACTIVE','CONSUMED','RELEASED');
create sequence public.online_order_number_seq;

create table public.delivery_settings (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), store_name text not null,
  is_open boolean not null default true, delivery_enabled boolean not null default true,
  pickup_enabled boolean not null default true, local_enabled boolean not null default false,
  minimum_order numeric(14,2) not null default 0 check(minimum_order>=0), whatsapp text,
  opening_hours text, updated_at timestamptz not null default now(),
  unique(organization_id,business_unit_id),
  foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id)
);

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), name text not null,
  neighborhood text not null, fee numeric(14,2) not null default 0 check(fee>=0),
  minimum_order numeric(14,2) not null default 0 check(minimum_order>=0), active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(organization_id,business_unit_id,neighborhood),
  foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id)
);

create type public.coupon_discount_type as enum ('PERCENT','FIXED');
create table public.coupons (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), code text not null,
  discount_type public.coupon_discount_type not null, discount_value numeric(14,2) not null check(discount_value>0),
  minimum_order numeric(14,2) not null default 0 check(minimum_order>=0), maximum_discount numeric(14,2),
  starts_at timestamptz, ends_at timestamptz, usage_limit integer check(usage_limit is null or usage_limit>0),
  usage_count integer not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(organization_id,business_unit_id,code),
  foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id)
);

create table public.online_orders (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), number text not null,
  public_code text not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  customer_id uuid references public.customers(id), customer_name text not null, customer_phone text not null,
  fulfillment public.fulfillment_type not null, delivery_address jsonb, delivery_zone_id uuid references public.delivery_zones(id),
  status public.online_order_status not null default 'NEW', subtotal numeric(14,2) not null,
  discount numeric(14,2) not null default 0, delivery_fee numeric(14,2) not null default 0,
  total numeric(14,2) not null, coupon_id uuid references public.coupons(id),
  payment_method public.payment_method not null, cash_change_for numeric(14,2), notes text,
  confirmed_at timestamptz, delivered_at timestamptz, cancelled_at timestamptz, cancellation_reason text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(organization_id,number), unique(public_code),
  foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id),
  check(total>=0), check(cash_change_for is null or cash_change_for>=total)
);

create table public.online_order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.online_orders(id),
  organization_id uuid not null references public.organizations(id), product_id uuid not null references public.products(id),
  product_name text not null, sku text not null, quantity numeric(14,3) not null check(quantity>0),
  unit_price numeric(14,2) not null check(unit_price>=0), total numeric(14,2) not null check(total>=0)
);

create table public.inventory_reservations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), order_id uuid not null references public.online_orders(id),
  product_id uuid not null references public.products(id), quantity numeric(14,3) not null check(quantity>0),
  status public.inventory_reservation_status not null default 'ACTIVE', expires_at timestamptz not null default now()+interval '30 minutes',
  created_at timestamptz not null default now(),
  unique(order_id,product_id), foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id)
);

create table public.online_order_status_history (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.online_orders(id),
  organization_id uuid not null references public.organizations(id), from_status public.online_order_status,
  to_status public.online_order_status not null, notes text, changed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.loyalty_accounts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  customer_id uuid not null references public.customers(id), points integer not null default 0 check(points>=0),
  lifetime_points integer not null default 0 check(lifetime_points>=0), updated_at timestamptz not null default now(),
  unique(organization_id,customer_id)
);

create index online_orders_unit_status_idx on public.online_orders(organization_id,business_unit_id,status,created_at);
create index inventory_reservations_active_idx on public.inventory_reservations(organization_id,business_unit_id,product_id,expires_at) where status='ACTIVE';
create index online_order_items_order_idx on public.online_order_items(order_id);

do $$ declare t text; begin foreach t in array array['delivery_settings','delivery_zones','coupons','online_orders','online_order_items','inventory_reservations','online_order_status_history','loyalty_accounts'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;

create policy delivery_settings_select on public.delivery_settings for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.view'));
create policy delivery_settings_manage on public.delivery_settings for all to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.manage')) with check(organization_id=public.current_organization_id());
create policy delivery_zones_select on public.delivery_zones for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.view'));
create policy delivery_zones_manage on public.delivery_zones for all to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.manage')) with check(organization_id=public.current_organization_id());
create policy coupons_select on public.coupons for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.view'));
create policy coupons_manage on public.coupons for all to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.manage')) with check(organization_id=public.current_organization_id());
create policy online_orders_select on public.online_orders for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.view'));
create policy online_order_items_select on public.online_order_items for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.view'));
create policy online_order_history_select on public.online_order_status_history for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('delivery.view'));
create policy loyalty_select on public.loyalty_accounts for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('customer.view'));

create trigger delivery_settings_updated_at before update on public.delivery_settings for each row execute function public.set_updated_at();
create trigger delivery_zones_updated_at before update on public.delivery_zones for each row execute function public.set_updated_at();
create trigger coupons_updated_at before update on public.coupons for each row execute function public.set_updated_at();
create trigger online_orders_updated_at before update on public.online_orders for each row execute function public.set_updated_at();
create trigger loyalty_accounts_updated_at before update on public.loyalty_accounts for each row execute function public.set_updated_at();

insert into public.delivery_settings(organization_id,business_unit_id,store_name)
select bu.organization_id,bu.id,o.name from public.business_units bu join public.organizations o on o.id=bu.organization_id
where bu.type='STORE_DELIVERY' on conflict do nothing;

create or replace function public.get_public_catalog(p_slug text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare org uuid; unit_id uuid; settings_row public.delivery_settings; result jsonb;
begin
  select o.id,bu.id into org,unit_id from public.organizations o join public.business_units bu on bu.organization_id=o.id and bu.type='STORE_DELIVERY' and bu.active
  where o.catalog_slug=lower(trim(p_slug)) and o.active limit 1;
  if org is null then raise exception 'Loja não encontrada'; end if;
  select * into settings_row from public.delivery_settings where organization_id=org and business_unit_id=unit_id;
  select jsonb_build_object(
    'store',jsonb_build_object('name',settings_row.store_name,'slug',lower(trim(p_slug)),'is_open',settings_row.is_open,'minimum_order',settings_row.minimum_order,'delivery_enabled',settings_row.delivery_enabled,'pickup_enabled',settings_row.pickup_enabled,'local_enabled',settings_row.local_enabled,'whatsapp',settings_row.whatsapp,'opening_hours',settings_row.opening_hours),
    'zones',coalesce((select jsonb_agg(jsonb_build_object('id',z.id,'name',z.name,'neighborhood',z.neighborhood,'fee',z.fee,'minimum_order',z.minimum_order) order by z.name) from public.delivery_zones z where z.organization_id=org and z.business_unit_id=unit_id and z.active),'[]'::jsonb),
    'categories',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name) order by c.name) from public.product_categories c where c.organization_id=org and c.active and c.deleted_at is null),'[]'::jsonb),
    'products',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'description',p.description,'category_id',p.category_id,'price',p.sale_price,'available',greatest(0,i.quantity-coalesce(r.reserved,0))) order by p.name)
      from public.products p join public.inventory i on i.organization_id=org and i.business_unit_id=unit_id and i.product_id=p.id
      left join lateral (select sum(ir.quantity) reserved from public.inventory_reservations ir where ir.organization_id=org and ir.business_unit_id=unit_id and ir.product_id=p.id and ir.status='ACTIVE' and ir.expires_at>now()) r on true
      where p.organization_id=org and p.active and p.deleted_at is null and i.quantity-coalesce(r.reserved,0)>0),'[]'::jsonb)
  ) into result;
  return result;
end $$;

create or replace function public.create_public_order(
  p_slug text,p_customer_name text,p_customer_phone text,p_fulfillment public.fulfillment_type,
  p_delivery_zone_id uuid,p_address jsonb,p_payment_method public.payment_method,p_cash_change_for numeric,
  p_coupon_code text,p_items jsonb,p_notes text default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare org uuid; unit_id uuid; settings_row public.delivery_settings; zone_row public.delivery_zones; coupon_row public.coupons;
declare order_uuid uuid; customer_uuid uuid; item jsonb; product_row public.products; inventory_row public.inventory;
declare qty numeric(14,3); reserved numeric(14,3); subtotal_value numeric(14,2):=0; discount_value numeric(14,2):=0; fee_value numeric(14,2):=0; total_value numeric(14,2); order_number text;
begin
  if length(trim(p_customer_name))<2 or length(regexp_replace(p_customer_phone,'\D','','g'))<8 then raise exception 'Dados do cliente inválidos'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 or jsonb_array_length(p_items)>100 then raise exception 'Pedido sem itens'; end if;
  select o.id,bu.id into org,unit_id from public.organizations o join public.business_units bu on bu.organization_id=o.id and bu.type='STORE_DELIVERY' and bu.active
    where o.catalog_slug=lower(trim(p_slug)) and o.active limit 1;
  if org is null then raise exception 'Loja não encontrada'; end if;
  select * into settings_row from public.delivery_settings where organization_id=org and business_unit_id=unit_id;
  if not found or not settings_row.is_open then raise exception 'Loja fechada'; end if;
  if (p_fulfillment='DELIVERY' and not settings_row.delivery_enabled) or (p_fulfillment='PICKUP' and not settings_row.pickup_enabled) or (p_fulfillment='LOCAL' and not settings_row.local_enabled) then raise exception 'Modalidade indisponível'; end if;
  if p_fulfillment='DELIVERY' then
    select * into zone_row from public.delivery_zones where id=p_delivery_zone_id and organization_id=org and business_unit_id=unit_id and active;
    if not found or p_address is null then raise exception 'Área ou endereço de entrega inválido'; end if;
    fee_value:=zone_row.fee;
  end if;
  for item in select * from jsonb_array_elements(p_items) loop
    qty:=(item->>'quantity')::numeric; if qty<=0 then raise exception 'Quantidade inválida'; end if;
    select * into product_row from public.products where id=(item->>'product_id')::uuid and organization_id=org and active and deleted_at is null;
    if not found then raise exception 'Produto indisponível'; end if;
    select * into inventory_row from public.inventory where organization_id=org and business_unit_id=unit_id and product_id=product_row.id for update;
    select coalesce(sum(quantity),0) into reserved from public.inventory_reservations where organization_id=org and business_unit_id=unit_id and product_id=product_row.id and status='ACTIVE' and expires_at>now();
    if inventory_row.id is null or inventory_row.quantity-reserved<qty then raise exception 'Estoque insuficiente para %',product_row.name; end if;
    subtotal_value:=subtotal_value+round(product_row.sale_price*qty,2);
  end loop;
  if subtotal_value<greatest(settings_row.minimum_order,coalesce(zone_row.minimum_order,0)) then raise exception 'Pedido abaixo do valor mínimo'; end if;
  if nullif(upper(trim(p_coupon_code)),'') is not null then
    select * into coupon_row from public.coupons where organization_id=org and business_unit_id=unit_id and code=upper(trim(p_coupon_code)) and active for update;
    if not found or (coupon_row.starts_at is not null and coupon_row.starts_at>now()) or (coupon_row.ends_at is not null and coupon_row.ends_at<now()) or (coupon_row.usage_limit is not null and coupon_row.usage_count>=coupon_row.usage_limit) or subtotal_value<coupon_row.minimum_order then raise exception 'Cupom inválido'; end if;
    discount_value:=case when coupon_row.discount_type='PERCENT' then round(subtotal_value*coupon_row.discount_value/100,2) else coupon_row.discount_value end;
    discount_value:=least(discount_value,coalesce(coupon_row.maximum_discount,discount_value),subtotal_value);
  end if;
  total_value:=subtotal_value-discount_value+fee_value;
  if p_payment_method='CASH' and p_cash_change_for is not null and p_cash_change_for<total_value then raise exception 'Troco inválido'; end if;
  select id into customer_uuid from public.customers where organization_id=org and regexp_replace(coalesce(phone,whatsapp,''),'\D','','g')=regexp_replace(p_customer_phone,'\D','','g') and deleted_at is null limit 1;
  if customer_uuid is null then insert into public.customers(organization_id,name,phone,whatsapp) values(org,trim(p_customer_name),trim(p_customer_phone),trim(p_customer_phone)) returning id into customer_uuid; end if;
  order_number:=lpad(nextval('public.online_order_number_seq')::text,8,'0');
  insert into public.online_orders(organization_id,business_unit_id,number,customer_id,customer_name,customer_phone,fulfillment,delivery_address,delivery_zone_id,subtotal,discount,delivery_fee,total,coupon_id,payment_method,cash_change_for,notes)
  values(org,unit_id,order_number,customer_uuid,trim(p_customer_name),trim(p_customer_phone),p_fulfillment,p_address,p_delivery_zone_id,subtotal_value,discount_value,fee_value,total_value,coupon_row.id,p_payment_method,p_cash_change_for,nullif(trim(p_notes),'')) returning id into order_uuid;
  for item in select * from jsonb_array_elements(p_items) loop
    qty:=(item->>'quantity')::numeric; select * into product_row from public.products where id=(item->>'product_id')::uuid;
    insert into public.online_order_items(order_id,organization_id,product_id,product_name,sku,quantity,unit_price,total) values(order_uuid,org,product_row.id,product_row.name,product_row.sku,qty,product_row.sale_price,round(product_row.sale_price*qty,2));
    insert into public.inventory_reservations(organization_id,business_unit_id,order_id,product_id,quantity) values(org,unit_id,order_uuid,product_row.id,qty);
  end loop;
  if coupon_row.id is not null then update public.coupons set usage_count=usage_count+1 where id=coupon_row.id; end if;
  insert into public.online_order_status_history(order_id,organization_id,to_status,notes) values(order_uuid,org,'NEW','Pedido criado pelo catálogo público');
  insert into public.audit_logs(organization_id,action,entity,entity_id,new_data) values(org,'ONLINE_ORDER_CREATE','online_orders',order_uuid,jsonb_build_object('number',order_number,'total',total_value,'business_unit_id',unit_id));
  return jsonb_build_object('id',order_uuid,'number',order_number,'public_code',(select public_code from public.online_orders where id=order_uuid),'total',total_value);
end $$;

create or replace function public.get_public_order(p_code text)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('number',o.number,'code',o.public_code,'customer_name',o.customer_name,'status',o.status,'fulfillment',o.fulfillment,'total',o.total,'created_at',o.created_at,'updated_at',o.updated_at)
  from public.online_orders o where o.public_code=upper(trim(p_code)) limit 1
$$;

create or replace function public.transition_online_order(p_order_id uuid,p_status public.online_order_status,p_notes text default null,p_cash_session_id uuid default null)
returns void language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; order_row public.online_orders; line public.online_order_items; stock_row public.inventory; session_row public.cash_sessions; allowed boolean:=false;
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('delivery.manage') then raise exception 'Acesso negado'; end if;
  select * into order_row from public.online_orders where id=p_order_id and organization_id=org for update;
  if not found then raise exception 'Pedido não encontrado'; end if;
  allowed:=case order_row.status when 'NEW' then p_status in ('CONFIRMED','CANCELLED') when 'CONFIRMED' then p_status in ('PREPARING','CANCELLED') when 'PREPARING' then p_status in ('READY','CANCELLED') when 'READY' then p_status in ('OUT_FOR_DELIVERY','DELIVERED','CANCELLED') when 'OUT_FOR_DELIVERY' then p_status in ('DELIVERED','CANCELLED') else false end;
  if not allowed then raise exception 'Transição de status inválida'; end if;
  if p_status='CONFIRMED' then
    for line in select * from public.online_order_items where order_id=p_order_id loop
      select * into stock_row from public.inventory where organization_id=org and business_unit_id=order_row.business_unit_id and product_id=line.product_id for update;
      if not found or stock_row.quantity<line.quantity then raise exception 'Estoque insuficiente para %',line.product_name; end if;
      update public.inventory set quantity=stock_row.quantity-line.quantity,updated_at=now() where id=stock_row.id;
      insert into public.inventory_movements(organization_id,business_unit_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reference_id,reason,created_by)
      values(org,order_row.business_unit_id,line.product_id,'SALE',-line.quantity,stock_row.quantity,stock_row.quantity-line.quantity,'ONLINE_ORDER',p_order_id,'Pedido online confirmado',actor);
    end loop;
    update public.inventory_reservations set status='CONSUMED' where order_id=p_order_id and status='ACTIVE';
  elsif p_status='CANCELLED' then
    if order_row.status='NEW' then update public.inventory_reservations set status='RELEASED' where order_id=p_order_id and status='ACTIVE';
    else
      for line in select * from public.online_order_items where order_id=p_order_id loop
        select * into stock_row from public.inventory where organization_id=org and business_unit_id=order_row.business_unit_id and product_id=line.product_id for update;
        update public.inventory set quantity=stock_row.quantity+line.quantity,updated_at=now() where id=stock_row.id;
        insert into public.inventory_movements(organization_id,business_unit_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reference_id,reason,created_by)
        values(org,order_row.business_unit_id,line.product_id,'CANCELLATION',line.quantity,stock_row.quantity,stock_row.quantity+line.quantity,'ONLINE_ORDER',p_order_id,coalesce(nullif(trim(p_notes),''),'Pedido online cancelado'),actor);
      end loop;
    end if;
    if order_row.coupon_id is not null then update public.coupons set usage_count=greatest(0,usage_count-1) where id=order_row.coupon_id; end if;
  elsif p_status='DELIVERED' then
    if order_row.payment_method='CASH' then
      select * into session_row from public.cash_sessions where id=p_cash_session_id and organization_id=org and business_unit_id=order_row.business_unit_id and status='OPEN' for update;
      if not found then raise exception 'Abra o caixa desta unidade para receber em dinheiro'; end if;
      insert into public.cash_movements(organization_id,business_unit_id,cash_session_id,type,amount,description,reference_type,reference_id,created_by)
      values(org,order_row.business_unit_id,session_row.id,'SALE',order_row.total,'Pedido online '||order_row.number,'ONLINE_ORDER',order_row.id,actor);
    end if;
    insert into public.accounts_receivable(organization_id,business_unit_id,customer_id,description,amount,due_date,status,paid_at)
    values(org,order_row.business_unit_id,order_row.customer_id,'Pedido online '||order_row.number,order_row.total,current_date,'PAID',now());
    insert into public.loyalty_accounts(organization_id,customer_id,points,lifetime_points) values(org,order_row.customer_id,floor(order_row.total)::integer,floor(order_row.total)::integer)
    on conflict(organization_id,customer_id) do update set points=public.loyalty_accounts.points+excluded.points,lifetime_points=public.loyalty_accounts.lifetime_points+excluded.lifetime_points,updated_at=now();
  end if;
  update public.online_orders set status=p_status,confirmed_at=case when p_status='CONFIRMED' then now() else confirmed_at end,delivered_at=case when p_status='DELIVERED' then now() else delivered_at end,cancelled_at=case when p_status='CANCELLED' then now() else cancelled_at end,cancellation_reason=case when p_status='CANCELLED' then nullif(trim(p_notes),'') else cancellation_reason end where id=p_order_id;
  insert into public.online_order_status_history(order_id,organization_id,from_status,to_status,notes,changed_by) values(p_order_id,org,order_row.status,p_status,nullif(trim(p_notes),''),actor);
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,old_data,new_data) values(org,actor,'ONLINE_ORDER_STATUS','online_orders',p_order_id,jsonb_build_object('status',order_row.status),jsonb_build_object('status',p_status,'notes',p_notes));
end $$;

revoke all on function public.get_public_catalog(text) from public;
revoke all on function public.create_public_order(text,text,text,public.fulfillment_type,uuid,jsonb,public.payment_method,numeric,text,jsonb,text) from public;
revoke all on function public.get_public_order(text) from public;
revoke all on function public.transition_online_order(uuid,public.online_order_status,text,uuid) from public;
grant execute on function public.get_public_catalog(text) to anon,authenticated;
grant execute on function public.create_public_order(text,text,text,public.fulfillment_type,uuid,jsonb,public.payment_method,numeric,text,jsonb,text) to anon,authenticated;
grant execute on function public.get_public_order(text) to anon,authenticated;
grant execute on function public.transition_online_order(uuid,public.online_order_status,text,uuid) to authenticated;
