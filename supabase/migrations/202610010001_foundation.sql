create extension if not exists pgcrypto;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  document text,
  email text,
  phone text,
  logo_url text,
  timezone text not null default 'America/Sao_Paulo',
  currency char(3) not null default 'BRL',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  name text not null,
  email text not null,
  phone text,
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  description text,
  is_system_role boolean not null default false,
  unique (organization_id, name)
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  primary key (user_id, role_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  user_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index profiles_auth_user_idx on public.profiles(auth_user_id);
create index profiles_org_idx on public.profiles(organization_id);
create index audit_logs_org_created_idx on public.audit_logs(organization_id, created_at desc);

create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.profiles where auth_user_id = auth.uid() and active = true limit 1
$$;

create or replace function public.current_organization_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select organization_id from public.profiles where auth_user_id = auth.uid() and active = true limit 1
$$;

create or replace function public.has_permission(requested text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    join public.user_roles ur on ur.user_id = p.id
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions pm on pm.id = rp.permission_id
    where p.auth_user_id = auth.uid() and p.active and pm.code = requested
  )
$$;

revoke all on function public.current_profile_id() from public;
revoke all on function public.current_organization_id() from public;
revoke all on function public.has_permission(text) from public;
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.current_organization_id() to authenticated;
grant execute on function public.has_permission(text) to authenticated;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create trigger organizations_updated_at before update on public.organizations
for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;

create policy organizations_select on public.organizations for select to authenticated
using (id = public.current_organization_id());
create policy organizations_update on public.organizations for update to authenticated
using (id = public.current_organization_id() and public.has_permission('settings.manage'))
with check (id = public.current_organization_id());
create policy profiles_select on public.profiles for select to authenticated
using (organization_id = public.current_organization_id());
create policy profiles_manage on public.profiles for update to authenticated
using (organization_id = public.current_organization_id() and public.has_permission('user.manage'))
with check (organization_id = public.current_organization_id());
create policy roles_select on public.roles for select to authenticated
using (organization_id = public.current_organization_id());
create policy permissions_select on public.permissions for select to authenticated using (true);
create policy role_permissions_select on public.role_permissions for select to authenticated using (
  exists (select 1 from public.roles r where r.id = role_id and r.organization_id = public.current_organization_id())
);
create policy user_roles_select on public.user_roles for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = user_id and p.organization_id = public.current_organization_id())
);
create policy roles_manage_insert on public.roles for insert to authenticated
with check (organization_id = public.current_organization_id() and public.has_permission('user.manage'));
create policy roles_manage_update on public.roles for update to authenticated
using (organization_id = public.current_organization_id() and public.has_permission('user.manage'))
with check (organization_id = public.current_organization_id());
create policy role_permissions_manage on public.role_permissions for all to authenticated
using (exists(select 1 from public.roles r where r.id=role_id and r.organization_id=public.current_organization_id()) and public.has_permission('user.manage'))
with check (exists(select 1 from public.roles r where r.id=role_id and r.organization_id=public.current_organization_id()) and public.has_permission('user.manage'));
create policy user_roles_manage on public.user_roles for all to authenticated
using (exists(select 1 from public.profiles p where p.id=user_id and p.organization_id=public.current_organization_id()) and public.has_permission('user.manage'))
with check (exists(select 1 from public.profiles p where p.id=user_id and p.organization_id=public.current_organization_id()) and public.has_permission('user.manage'));
create policy audit_select on public.audit_logs for select to authenticated
using (organization_id = public.current_organization_id() and public.has_permission('audit.view'));

insert into public.permissions(code, name) values
('customer.view','Visualizar clientes'),('customer.create','Criar clientes'),('customer.update','Editar clientes'),('customer.delete','Excluir clientes'),
('product.view','Visualizar produtos'),('product.create','Criar produtos'),('product.update','Editar produtos'),('product.delete','Excluir produtos'),('product.view_cost','Visualizar custo'),
('inventory.view','Visualizar estoque'),('inventory.entry','Entrada de estoque'),('inventory.adjust','Ajustar estoque'),
('quote.view','Visualizar orçamentos'),('quote.create','Criar orçamentos'),('quote.update','Editar orçamentos'),
('sale.view','Visualizar vendas'),('sale.create','Criar vendas'),('sale.cancel','Cancelar vendas'),
('finance.view','Visualizar financeiro'),('finance.manage','Gerenciar financeiro'),('report.view','Visualizar relatórios'),
('user.manage','Gerenciar usuários'),('audit.view','Visualizar auditoria'),('settings.manage','Gerenciar configurações');
