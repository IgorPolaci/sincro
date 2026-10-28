-- Store schedule, public contact data, product suggestions and atomic product creation.

alter table public.delivery_settings
  add column instagram_handle text,
  add column whatsapp_contact text,
  add column contact_email text,
  add column contact_phone text,
  add column store_description text,
  add column timezone text not null default 'America/Sao_Paulo';

create table public.store_opening_hours (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opening_time time,
  closing_time time,
  closed_all_day boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (organization_id, business_unit_id, day_of_week),
  foreign key (organization_id, business_unit_id) references public.business_units(organization_id, id),
  check (closed_all_day or (opening_time is not null and closing_time is not null and opening_time < closing_time))
);

create table public.store_closures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id),
  closure_date date not null,
  reason text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, business_unit_id, closure_date),
  foreign key (organization_id, business_unit_id) references public.business_units(organization_id, id)
);

create table public.ecommerce_product_suggestions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  ecommerce_product_id uuid not null references public.ecommerce_products(id),
  suggested_ecommerce_product_id uuid not null references public.ecommerce_products(id),
  position smallint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ecommerce_product_id, suggested_ecommerce_product_id),
  check (ecommerce_product_id <> suggested_ecommerce_product_id)
);

alter table public.store_opening_hours enable row level security;
alter table public.store_closures enable row level security;
alter table public.ecommerce_product_suggestions enable row level security;

create policy store_opening_hours_select on public.store_opening_hours for select to authenticated
  using (organization_id=public.current_organization_id() and public.has_permission('delivery.view'));
create policy store_opening_hours_manage on public.store_opening_hours for all to authenticated
  using (organization_id=public.current_organization_id() and public.has_permission('delivery.manage'))
  with check (organization_id=public.current_organization_id() and public.has_permission('delivery.manage'));
create policy store_closures_select on public.store_closures for select to authenticated
  using (organization_id=public.current_organization_id() and public.has_permission('delivery.view'));
create policy store_closures_manage on public.store_closures for all to authenticated
  using (organization_id=public.current_organization_id() and public.has_permission('delivery.manage'))
  with check (organization_id=public.current_organization_id() and public.has_permission('delivery.manage'));
create policy ecommerce_suggestions_select on public.ecommerce_product_suggestions for select to authenticated
  using (organization_id=public.current_organization_id() and public.has_permission('delivery.view'));
create policy ecommerce_suggestions_manage on public.ecommerce_product_suggestions for all to authenticated
  using (organization_id=public.current_organization_id() and public.has_permission('delivery.manage'))
  with check (organization_id=public.current_organization_id() and public.has_permission('delivery.manage'));

create trigger store_opening_hours_updated_at before update on public.store_opening_hours
  for each row execute function public.set_updated_at();
create trigger ecommerce_suggestions_updated_at before update on public.ecommerce_product_suggestions
  for each row execute function public.set_updated_at();
create trigger ecommerce_suggestions_audit after insert or update on public.ecommerce_product_suggestions
  for each row execute function public.audit_row_change();

insert into public.store_opening_hours(organization_id,business_unit_id,day_of_week,opening_time,closing_time,closed_all_day)
select ds.organization_id,ds.business_unit_id,d.day,'09:00','18:00',d.day=0
from public.delivery_settings ds cross join generate_series(0,6) d(day)
on conflict do nothing;

create or replace function public.store_operating_status(p_business_unit_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare settings_row public.delivery_settings; local_now timestamp; local_date date; local_time time; schedule_row public.store_opening_hours; currently_open boolean; next_label text;
begin
  select ds.* into settings_row from public.delivery_settings ds
  join public.business_units bu on bu.id=ds.business_unit_id and bu.active
  join public.organizations o on o.id=ds.organization_id and o.active
  where ds.business_unit_id=p_business_unit_id;
  if not found then return jsonb_build_object('is_open',false,'message','Loja indisponível'); end if;
  local_now:=now() at time zone settings_row.timezone; local_date:=local_now::date; local_time:=local_now::time;
  select * into schedule_row from public.store_opening_hours h where h.business_unit_id=p_business_unit_id and h.day_of_week=extract(dow from local_date)::integer;
  currently_open:=settings_row.is_open and schedule_row.id is not null and not schedule_row.closed_all_day
    and local_time>=schedule_row.opening_time and local_time<schedule_row.closing_time
    and not exists(select 1 from public.store_closures c where c.business_unit_id=p_business_unit_id and c.closure_date=local_date and c.active);
  if currently_open then
    return jsonb_build_object('is_open',true,'message','Aberto agora','closes_at',to_char(schedule_row.closing_time,'HH24:MI'));
  end if;
  select case when candidate_date=local_date then 'Abre hoje às ' else 'Abre '||case extract(dow from candidate_date)::int when 0 then 'domingo' when 1 then 'segunda' when 2 then 'terça' when 3 then 'quarta' when 4 then 'quinta' when 5 then 'sexta' else 'sábado' end||' às ' end||to_char(h.opening_time,'HH24:MI')
  into next_label
  from generate_series(0,7) as offsets(offset_days)
  cross join lateral (select local_date+offset_days::int candidate_date) d
  join public.store_opening_hours h on h.business_unit_id=p_business_unit_id and h.day_of_week=extract(dow from candidate_date)::int and not h.closed_all_day
  where (candidate_date>local_date or h.opening_time>local_time)
    and not exists(select 1 from public.store_closures c where c.business_unit_id=p_business_unit_id and c.closure_date=candidate_date and c.active)
  order by candidate_date,h.opening_time limit 1;
  return jsonb_build_object('is_open',false,'message',case when settings_row.is_open then coalesce(next_label,'Loja fechada') else 'Loja fechada manualmente' end,'next_opening',next_label);
end $$;

create or replace function public.get_public_store_status(p_slug text)
returns jsonb language sql stable security definer set search_path='' as $$
  select public.store_operating_status(bu.id)||jsonb_build_object('store_description',ds.store_description,'instagram_handle',ds.instagram_handle,'whatsapp_contact',ds.whatsapp_contact,'contact_email',ds.contact_email,'contact_phone',ds.contact_phone) from public.organizations o
  join public.business_units bu on bu.organization_id=o.id and bu.type='STORE_DELIVERY' and bu.active
  join public.delivery_settings ds on ds.business_unit_id=bu.id
  where o.catalog_slug=lower(trim(p_slug)) and o.active limit 1
$$;

create or replace function public.enforce_store_open_before_order()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if not coalesce((public.store_operating_status(new.business_unit_id)->>'is_open')::boolean,false) then raise exception 'Loja fechada'; end if;
  return new;
end $$;
create trigger online_orders_store_hours before insert on public.online_orders
  for each row execute function public.enforce_store_open_before_order();

create or replace function public.get_public_store_suggestions(p_slug text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare org uuid; unit_id uuid; result jsonb;
begin
  select o.id,bu.id into org,unit_id from public.organizations o join public.business_units bu on bu.organization_id=o.id and bu.type='STORE_DELIVERY' and bu.active where o.catalog_slug=lower(trim(p_slug)) and o.active limit 1;
  if org is null then raise exception 'Loja não encontrada'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('source_product_id',source.product_id,'suggested_product_id',suggested.product_id) order by s.position),'[]'::jsonb) into result
  from public.ecommerce_product_suggestions s
  join public.ecommerce_products source on source.id=s.ecommerce_product_id and source.business_unit_id=unit_id and source.is_published
  join public.ecommerce_products suggested on suggested.id=s.suggested_ecommerce_product_id and suggested.business_unit_id=unit_id and suggested.is_published
  join public.products p on p.id=suggested.product_id and p.active and p.deleted_at is null
  join public.inventory i on i.product_id=p.id and i.business_unit_id=unit_id
  where s.organization_id=org and s.active and i.quantity>(select coalesce(sum(r.quantity),0) from public.inventory_reservations r where r.product_id=p.id and r.business_unit_id=unit_id and r.status='ACTIVE' and r.expires_at>now());
  return result;
end $$;

create or replace function public.create_ecommerce_product(p_input jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_org uuid; v_actor uuid; v_unit_id uuid; v_product_id uuid; v_listing_id uuid; v_category_id uuid; v_product_name text; v_product_sku text; v_product_slug text; v_sale_price numeric; v_online_price numeric;
begin
  v_org:=public.current_organization_id(); v_actor:=public.current_profile_id(); v_unit_id:=nullif(p_input->>'business_unit_id','')::uuid;
  if v_org is null or v_actor is null or not public.has_permission('product.create') or not public.has_permission('delivery.manage') then raise exception 'Acesso negado'; end if;
  if not exists(select 1 from public.business_units where id=v_unit_id and organization_id=v_org and type='STORE_DELIVERY' and active) then raise exception 'Unidade operacional inválida'; end if;
  v_product_name:=trim(p_input->>'name'); v_product_sku:=trim(p_input->>'sku'); v_product_slug:=trim(p_input->>'slug');
  v_sale_price:=(p_input->>'sale_price')::numeric; v_online_price:=nullif(p_input->>'online_price','')::numeric; v_category_id:=nullif(p_input->>'category_id','')::uuid;
  if length(v_product_name)<3 or length(v_product_sku)<1 or v_product_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or v_sale_price<0 or v_online_price<0 then raise exception 'Dados do produto inválidos'; end if;
  insert into public.products(organization_id,sku,name,description,category_id,cost_price,sale_price,minimum_stock,unit,created_by,updated_by)
  values(v_org,v_product_sku,v_product_name,nullif(trim(p_input->>'description'),''),v_category_id,coalesce(nullif(p_input->>'cost_price','')::numeric,0),v_sale_price,coalesce(nullif(p_input->>'minimum_stock','')::numeric,0),coalesce(nullif(trim(p_input->>'unit'),''),'UN'),v_actor,v_actor)
  returning id into v_product_id;
  select ep.id into v_listing_id from public.ecommerce_products ep where ep.product_id=v_product_id and ep.business_unit_id=v_unit_id;
  if v_listing_id is null then insert into public.ecommerce_products(organization_id,business_unit_id,product_id,category_id,display_name,slug,online_price) values(v_org,v_unit_id,v_product_id,v_category_id,v_product_name,v_product_slug,coalesce(v_online_price,v_sale_price)) returning id into v_listing_id; end if;
  update public.ecommerce_products set category_id=v_category_id,display_name=coalesce(nullif(trim(p_input->>'display_name'),''),v_product_name),slug=v_product_slug,online_price=coalesce(v_online_price,v_sale_price),promotional_price=nullif(p_input->>'promotional_price','')::numeric,short_description=nullif(trim(p_input->>'short_description'),''),description=nullif(trim(p_input->>'description'),''),seo_title=nullif(trim(p_input->>'seo_title'),''),seo_description=nullif(trim(p_input->>'seo_description'),''),max_per_order=nullif(p_input->>'max_per_order','')::numeric,is_featured=coalesce((p_input->>'is_featured')::boolean,false),is_published=coalesce((p_input->>'is_published')::boolean,false),published_at=case when coalesce((p_input->>'is_published')::boolean,false) then now() else null end where id=v_listing_id;
  insert into public.inventory(organization_id,business_unit_id,product_id,quantity) values(v_org,v_unit_id,v_product_id,0) on conflict do nothing;
  return jsonb_build_object('product_id',v_product_id,'listing_id',v_listing_id);
end $$;

revoke all on function public.store_operating_status(uuid) from public;
revoke all on function public.get_public_store_status(text) from public;
revoke all on function public.get_public_store_suggestions(text) from public;
revoke all on function public.create_ecommerce_product(jsonb) from public;
grant execute on function public.get_public_store_status(text) to anon,authenticated;
grant execute on function public.get_public_store_suggestions(text) to anon,authenticated;
grant execute on function public.create_ecommerce_product(jsonb) to authenticated;

do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='online_orders') then
    alter publication supabase_realtime add table public.online_orders;
  end if;
end $$;
