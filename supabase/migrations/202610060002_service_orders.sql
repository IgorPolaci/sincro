insert into public.permissions(code,name) values
('service_catalog.manage','Gerenciar cadastros técnicos'),
('service_order.secret.view','Visualizar credenciais de aparelhos')
on conflict(code) do nothing;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name='ADMIN'
on conflict do nothing;
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name='GERENTE' and p.code in ('service_catalog.manage','service_order.secret.view')
on conflict do nothing;

create table public.equipment_types (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  name text not null, active boolean not null default true, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique(organization_id,name)
);
create table public.equipment_models (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  equipment_type_id uuid not null references public.equipment_types(id), brand_id uuid references public.brands(id),
  name text not null, active boolean not null default true, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique(organization_id,equipment_type_id,brand_id,name)
);
create table public.service_catalog (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  name text not null, description text, price numeric(14,2) not null default 0 check(price>=0),
  estimated_minutes int check(estimated_minutes is null or estimated_minutes>0), warranty_days int not null default 90 check(warranty_days>=0),
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, unique(organization_id,name)
);

create table public.service_order_statuses (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), code text not null, name text not null,
  color text not null default 'slate', position int not null default 0, is_final boolean not null default false,
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(organization_id,business_unit_id,code), unique(organization_id,business_unit_id,id),
  foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id)
);

create sequence public.service_order_number_seq;
create table public.service_orders (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), number text not null,
  customer_id uuid not null references public.customers(id), status_id uuid not null,
  equipment_type_id uuid references public.equipment_types(id), equipment_model_id uuid references public.equipment_models(id),
  equipment_name text not null, brand_name text, model_name text, serial_number text, imei text, color text,
  voltage text, invoice_number text, accessories text, reported_defect text not null, visible_damage text,
  general_notes text, assigned_technician_id uuid references public.profiles(id), estimated_delivery_at timestamptz,
  is_warranty boolean not null default false, warranty_reference_id uuid references public.service_orders(id), warranty_until date,
  service_total numeric(14,2) not null default 0 check(service_total>=0),
  parts_total numeric(14,2) not null default 0 check(parts_total>=0),
  discount numeric(14,2) not null default 0 check(discount>=0),
  total numeric(14,2) not null default 0 check(total>=0),
  advance_amount numeric(14,2) not null default 0 check(advance_amount>=0),
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id), updated_at timestamptz not null default now(),
  cancelled_at timestamptz, cancelled_by uuid references public.profiles(id), cancellation_reason text,
  unique(organization_id,number),
  foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id),
  foreign key(organization_id,business_unit_id,status_id) references public.service_order_statuses(organization_id,business_unit_id,id),
  check(discount<=service_total+parts_total), check(advance_amount<=total)
);
create table public.service_order_status_history (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), service_order_id uuid not null references public.service_orders(id),
  from_status_id uuid references public.service_order_statuses(id), to_status_id uuid not null references public.service_order_statuses(id),
  note text, changed_by uuid not null references public.profiles(id), changed_at timestamptz not null default now(),
  foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id)
);
create table public.service_order_services (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), service_order_id uuid not null references public.service_orders(id),
  service_id uuid references public.service_catalog(id), description text not null, quantity numeric(14,3) not null check(quantity>0),
  unit_price numeric(14,2) not null check(unit_price>=0), discount numeric(14,2) not null default 0 check(discount>=0),
  total numeric(14,2) not null check(total>=0), warranty_days int not null default 90 check(warranty_days>=0),
  created_at timestamptz not null default now(),
  foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id)
);
create table public.service_order_parts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), service_order_id uuid not null references public.service_orders(id),
  product_id uuid not null references public.products(id), product_name text not null, sku text not null,
  quantity numeric(14,3) not null check(quantity>0), unit_price numeric(14,2) not null check(unit_price>=0),
  cost_price_snapshot numeric(14,2) not null check(cost_price_snapshot>=0), discount numeric(14,2) not null default 0 check(discount>=0),
  total numeric(14,2) not null check(total>=0), inventory_applied boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id)
);
create table public.service_order_notes (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), service_order_id uuid not null references public.service_orders(id),
  note text not null, internal boolean not null default true, created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id)
);
create table public.service_order_access_secrets (
  service_order_id uuid primary key references public.service_orders(id), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), access_instructions text not null,
  updated_by uuid not null references public.profiles(id), updated_at timestamptz not null default now(),
  foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id)
);
create table public.service_order_photos (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), service_order_id uuid not null references public.service_orders(id),
  storage_path text not null, caption text, created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
  foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id)
);
create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  equipment_type_id uuid references public.equipment_types(id), name text not null, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,name)
);
create table public.checklist_template_items (
  id uuid primary key default gen_random_uuid(), template_id uuid not null references public.checklist_templates(id) on delete cascade,
  organization_id uuid not null references public.organizations(id), label text not null, position int not null default 0,
  required boolean not null default false
);
create table public.service_order_checklist (
  id uuid primary key default gen_random_uuid(), service_order_id uuid not null references public.service_orders(id),
  organization_id uuid not null references public.organizations(id), business_unit_id uuid not null references public.business_units(id),
  template_item_id uuid references public.checklist_template_items(id), label text not null, checked boolean not null default false,
  notes text, checked_by uuid references public.profiles(id), checked_at timestamptz,
  foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id)
);

create index service_orders_org_unit_created_idx on public.service_orders(organization_id,business_unit_id,created_at desc);
create index service_orders_status_idx on public.service_orders(status_id,created_at desc);
create index service_orders_customer_idx on public.service_orders(customer_id,created_at desc);
create index service_order_history_order_idx on public.service_order_status_history(service_order_id,changed_at desc);
create index service_order_parts_order_idx on public.service_order_parts(service_order_id);
create index service_order_services_order_idx on public.service_order_services(service_order_id);

do $$ declare t text; begin
  foreach t in array array['equipment_types','equipment_models','service_catalog','service_order_statuses','service_orders','service_order_status_history','service_order_services','service_order_parts','service_order_notes','service_order_access_secrets','service_order_photos','checklist_templates','checklist_template_items','service_order_checklist'] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;

create policy equipment_types_select on public.equipment_types for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('service_order.view'));
create policy equipment_models_select on public.equipment_models for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('service_order.view'));
create policy service_catalog_select on public.service_catalog for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('service_order.view'));
create policy service_order_statuses_select on public.service_order_statuses for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('service_order.view'));
create policy service_orders_select on public.service_orders for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('service_order.view'));
create policy service_order_history_select on public.service_order_status_history for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('service_order.view'));
create policy service_order_services_select on public.service_order_services for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('service_order.view'));
create policy service_order_parts_select on public.service_order_parts for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('service_order.view'));
create policy service_order_notes_select on public.service_order_notes for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('service_order.view'));
create policy service_order_photos_select on public.service_order_photos for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('service_order.view'));
create policy service_order_secrets_select on public.service_order_access_secrets for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('service_order.secret.view'));
create policy checklist_templates_select on public.checklist_templates for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('service_order.view'));
create policy checklist_template_items_select on public.checklist_template_items for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('service_order.view'));
create policy service_order_checklist_select on public.service_order_checklist for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('service_order.view'));

do $$ declare t text; begin
  foreach t in array array['equipment_types','equipment_models','service_catalog','service_order_statuses','checklist_templates','checklist_template_items'] loop
    execute format('create policy %I on public.%I for insert to authenticated with check(organization_id=public.current_organization_id() and public.has_permission(''service_catalog.manage''))',t||'_insert',t);
    execute format('create policy %I on public.%I for update to authenticated using(organization_id=public.current_organization_id() and public.has_permission(''service_catalog.manage'')) with check(organization_id=public.current_organization_id())',t||'_update',t);
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['equipment_types','equipment_models','service_catalog','service_order_statuses','checklist_templates'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()',t||'_updated_at',t);
    execute format('create trigger %I after insert or update on public.%I for each row execute function public.audit_row_change()',t||'_audit',t);
  end loop;
end $$;
create trigger service_orders_updated_at before update on public.service_orders for each row execute function public.set_updated_at();

create or replace function public.seed_service_order_statuses(p_organization_id uuid,p_business_unit_id uuid)
returns void language sql security definer set search_path='' as $$
  insert into public.service_order_statuses(organization_id,business_unit_id,code,name,color,position,is_final)
  select p_organization_id,p_business_unit_id,v.code,v.name,v.color,v.position,v.is_final
  from (values
    ('ORCAMENTO_PENDENTE','Orçamento pendente','amber',10,false),('EM_ORCAMENTO','Em orçamento','blue',20,false),
    ('AGUARDANDO_PECA','Aguardando peça','orange',30,false),('AGUARDANDO_APROVACAO','Aguardando aprovação','violet',40,false),
    ('ORCAMENTO_APROVADO','Orçamento aprovado','emerald',50,false),('SERVICO_INICIADO','Serviço iniciado','blue',60,false),
    ('AGUARDANDO_RETIRADA','Aguardando retirada','cyan',70,false),('FATURADO','Faturado','emerald',80,false),
    ('REABERTO','Reaberto','orange',90,false),('CANCELADO','Cancelado','red',100,true),
    ('ESTORNADO','Estornado','red',110,true),('FECHADO','Fechado','slate',120,true),('GARANTIA','Garantia','violet',130,false)
  ) as v(code,name,color,position,is_final)
  on conflict(organization_id,business_unit_id,code) do nothing
$$;

select public.seed_service_order_statuses(organization_id,id)
from public.business_units where type='TECHNICAL_ASSISTANCE';

create or replace function public.seed_statuses_for_assistance_unit()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.type='TECHNICAL_ASSISTANCE' then perform public.seed_service_order_statuses(new.organization_id,new.id); end if;
  return new;
end $$;
create trigger business_units_service_order_statuses after insert on public.business_units
for each row execute function public.seed_statuses_for_assistance_unit();

create or replace function public.create_service_order(
  p_business_unit_id uuid,p_customer_id uuid,p_equipment_name text,p_reported_defect text,
  p_brand_name text default null,p_model_name text default null,p_serial_number text default null,p_imei text default null,
  p_color text default null,p_voltage text default null,p_invoice_number text default null,p_accessories text default null,
  p_visible_damage text default null,p_general_notes text default null,p_access_instructions text default null,
  p_assigned_technician_id uuid default null,p_estimated_delivery_at timestamptz default null,
  p_is_warranty boolean default false,p_warranty_reference_id uuid default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; initial_status uuid; order_id uuid;
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('service_order.create') then raise exception 'Acesso negado'; end if;
  if not exists(select 1 from public.business_units where id=p_business_unit_id and organization_id=org and type='TECHNICAL_ASSISTANCE' and active) then raise exception 'Unidade de assistência inválida'; end if;
  if not exists(select 1 from public.customers where id=p_customer_id and organization_id=org and deleted_at is null) then raise exception 'Cliente não encontrado'; end if;
  if nullif(trim(p_equipment_name),'') is null or nullif(trim(p_reported_defect),'') is null then raise exception 'Equipamento e defeito são obrigatórios'; end if;
  if p_assigned_technician_id is not null and not exists(select 1 from public.profiles where id=p_assigned_technician_id and organization_id=org and active) then raise exception 'Técnico inválido'; end if;
  if p_warranty_reference_id is not null and not exists(select 1 from public.service_orders where id=p_warranty_reference_id and organization_id=org) then raise exception 'O.S. de garantia inválida'; end if;
  select id into initial_status from public.service_order_statuses
  where organization_id=org and business_unit_id=p_business_unit_id and code='ORCAMENTO_PENDENTE' and active;
  if initial_status is null then raise exception 'Status inicial não configurado'; end if;
  insert into public.service_orders(organization_id,business_unit_id,number,customer_id,status_id,equipment_name,brand_name,model_name,
    serial_number,imei,color,voltage,invoice_number,accessories,reported_defect,visible_damage,general_notes,assigned_technician_id,
    estimated_delivery_at,is_warranty,warranty_reference_id,created_by,updated_by)
  values(org,p_business_unit_id,'OS-'||lpad(nextval('public.service_order_number_seq')::text,8,'0'),p_customer_id,initial_status,trim(p_equipment_name),
    nullif(trim(p_brand_name),''),nullif(trim(p_model_name),''),nullif(trim(p_serial_number),''),nullif(trim(p_imei),''),nullif(trim(p_color),''),
    nullif(trim(p_voltage),''),nullif(trim(p_invoice_number),''),nullif(trim(p_accessories),''),trim(p_reported_defect),nullif(trim(p_visible_damage),''),
    nullif(trim(p_general_notes),''),p_assigned_technician_id,p_estimated_delivery_at,p_is_warranty,p_warranty_reference_id,actor,actor)
  returning id into order_id;
  insert into public.service_order_status_history(organization_id,business_unit_id,service_order_id,to_status_id,note,changed_by)
  values(org,p_business_unit_id,order_id,initial_status,'Ordem de serviço aberta',actor);
  if nullif(trim(p_access_instructions),'') is not null then
    insert into public.service_order_access_secrets(service_order_id,organization_id,business_unit_id,access_instructions,updated_by)
    values(order_id,org,p_business_unit_id,trim(p_access_instructions),actor);
  end if;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data)
  values(org,actor,'SERVICE_ORDER_CREATE','service_orders',order_id,jsonb_build_object('business_unit_id',p_business_unit_id,'customer_id',p_customer_id));
  return order_id;
end $$;

create or replace function public.set_service_order_status(p_service_order_id uuid,p_status_code text,p_note text default null)
returns void language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; order_row public.service_orders; next_status public.service_order_statuses;
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('service_order.update') then raise exception 'Acesso negado'; end if;
  select * into order_row from public.service_orders where id=p_service_order_id and organization_id=org for update;
  if not found then raise exception 'Ordem de serviço não encontrada'; end if;
  select * into next_status from public.service_order_statuses where organization_id=org and business_unit_id=order_row.business_unit_id and code=p_status_code and active;
  if not found then raise exception 'Status inválido'; end if;
  if next_status.code='CANCELADO' and not public.has_permission('service_order.cancel') then raise exception 'Acesso negado'; end if;
  if next_status.code='CANCELADO' and nullif(trim(p_note),'') is null then raise exception 'Informe o motivo do cancelamento'; end if;
  if order_row.status_id=next_status.id then return; end if;
  update public.service_orders set status_id=next_status.id,updated_by=actor,
    cancelled_at=case when next_status.code='CANCELADO' then now() else cancelled_at end,
    cancelled_by=case when next_status.code='CANCELADO' then actor else cancelled_by end,
    cancellation_reason=case when next_status.code='CANCELADO' then nullif(trim(p_note),'') else cancellation_reason end
  where id=order_row.id;
  insert into public.service_order_status_history(organization_id,business_unit_id,service_order_id,from_status_id,to_status_id,note,changed_by)
  values(org,order_row.business_unit_id,order_row.id,order_row.status_id,next_status.id,nullif(trim(p_note),''),actor);
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,old_data,new_data)
  values(org,actor,'SERVICE_ORDER_STATUS','service_orders',order_row.id,jsonb_build_object('status_id',order_row.status_id),jsonb_build_object('status_id',next_status.id,'status',next_status.code,'note',nullif(trim(p_note),'')));
end $$;

revoke all on function public.seed_service_order_statuses(uuid,uuid) from public;
revoke all on function public.create_service_order(uuid,uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,uuid,timestamptz,boolean,uuid) from public;
revoke all on function public.set_service_order_status(uuid,text,text) from public;
grant execute on function public.create_service_order(uuid,uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,uuid,timestamptz,boolean,uuid) to authenticated;
grant execute on function public.set_service_order_status(uuid,text,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('service-order-photos','service-order-photos',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy service_order_photos_storage_select on storage.objects for select to authenticated
using(bucket_id='service-order-photos' and (storage.foldername(name))[1]=public.current_organization_id()::text and public.has_permission('service_order.view'));
create policy service_order_photos_storage_insert on storage.objects for insert to authenticated
with check(bucket_id='service-order-photos' and (storage.foldername(name))[1]=public.current_organization_id()::text and public.has_permission('service_order.update'));
