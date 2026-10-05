create type public.backup_status as enum ('STARTED','SUCCESS','FAILED');
create table public.backup_logs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  type text not null check(type in ('DATABASE','STORAGE')), status public.backup_status not null default 'STARTED',
  started_at timestamptz not null default now(), finished_at timestamptz, storage_path text, size bigint, error_message text,
  created_at timestamptz not null default now()
);
create table public.import_jobs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  entity text not null check(entity in ('CUSTOMERS','PRODUCTS','SUPPLIERS','INVENTORY')), storage_path text not null,
  status text not null check(status in ('UPLOADED','VALIDATING','READY','IMPORTING','COMPLETED','FAILED')) default 'UPLOADED',
  total_rows int not null default 0, valid_rows int not null default 0, invalid_rows int not null default 0,
  errors jsonb not null default '[]', created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), finished_at timestamptz
);
alter table public.backup_logs enable row level security;
alter table public.import_jobs enable row level security;
create policy backup_select on public.backup_logs for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('settings.manage'));
create policy imports_select on public.import_jobs for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('settings.manage'));
create policy imports_insert on public.import_jobs for insert to authenticated with check(organization_id=public.current_organization_id() and public.has_permission('settings.manage'));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('imports','imports',false,52428800,array['text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict(id) do nothing;
create policy imports_storage_select on storage.objects for select to authenticated
using(bucket_id='imports' and (storage.foldername(name))[1]=public.current_organization_id()::text and public.has_permission('settings.manage'));
create policy imports_storage_insert on storage.objects for insert to authenticated
with check(bucket_id='imports' and (storage.foldername(name))[1]=public.current_organization_id()::text and public.has_permission('settings.manage'));
