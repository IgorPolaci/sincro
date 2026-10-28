create type public.service_order_document_type as enum ('ENTRY','QUOTE','RECEIPT','WARRANTY','TECHNICAL_REPORT');
create type public.document_paper_format as enum ('A4','THERMAL_80','THERMAL_58');

create table public.service_order_documents (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), service_order_id uuid not null references public.service_orders(id),
  type public.service_order_document_type not null, paper_format public.document_paper_format not null,
  generated_by uuid not null references public.profiles(id), generated_at timestamptz not null default now(),
  foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id)
);
create index service_order_documents_order_idx on public.service_order_documents(service_order_id,generated_at desc);
alter table public.service_order_documents enable row level security;
create policy service_order_documents_select on public.service_order_documents for select to authenticated
using(organization_id=public.current_organization_id() and public.has_permission('service_order.view'));

create or replace function public.record_service_order_document(p_service_order_id uuid,p_type public.service_order_document_type,p_paper_format public.document_paper_format)
returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; order_row public.service_orders; document_id uuid;
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('service_order.view') then raise exception 'Acesso negado'; end if;
  select * into order_row from public.service_orders where id=p_service_order_id and organization_id=org;
  if not found then raise exception 'Ordem de serviço não encontrada'; end if;
  insert into public.service_order_documents(organization_id,business_unit_id,service_order_id,type,paper_format,generated_by)
  values(org,order_row.business_unit_id,order_row.id,p_type,p_paper_format,actor) returning id into document_id;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data)
  values(org,actor,'SERVICE_ORDER_DOCUMENT_GENERATE','service_order_documents',document_id,
    jsonb_build_object('service_order_id',order_row.id,'type',p_type,'paper_format',p_paper_format));
  return document_id;
end $$;
revoke all on function public.record_service_order_document(uuid,public.service_order_document_type,public.document_paper_format) from public;
grant execute on function public.record_service_order_document(uuid,public.service_order_document_type,public.document_paper_format) to authenticated;
