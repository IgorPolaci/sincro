create or replace function public.bootstrap_organization(org_name text, auth_id uuid, profile_name text, profile_email text)
returns uuid language plpgsql security definer set search_path='' as $$
declare org_id uuid; profile_id uuid; admin_role_id uuid;
begin
  if not exists(select 1 from auth.users where id=auth_id) then raise exception 'Usuário do Auth não encontrado'; end if;
  if exists(select 1 from public.profiles where auth_user_id=auth_id) then raise exception 'Usuário já provisionado'; end if;
  insert into public.organizations(name) values(org_name) returning id into org_id;
  insert into public.profiles(auth_user_id,organization_id,name,email) values(auth_id,org_id,profile_name,profile_email) returning id into profile_id;
  insert into public.roles(organization_id,name,description,is_system_role) values(org_id,'ADMIN','Administrador',true) returning id into admin_role_id;
  insert into public.roles(organization_id,name,description,is_system_role) values
    (org_id,'GERENTE','Gestão operacional',true),(org_id,'VENDEDOR','Atendimento e vendas',true),
    (org_id,'ESTOQUISTA','Produtos e estoque',true),(org_id,'FINANCEIRO','Operação financeira',true);
  insert into public.role_permissions(role_id,permission_id) select admin_role_id,id from public.permissions;
  insert into public.role_permissions(role_id,permission_id)
  select r.id,p.id from public.roles r cross join public.permissions p
  where r.organization_id=org_id and r.name='GERENTE' and p.code not in ('user.manage','settings.manage');
  insert into public.role_permissions(role_id,permission_id)
  select r.id,p.id from public.roles r cross join public.permissions p
  where r.organization_id=org_id and r.name='VENDEDOR' and p.code in ('customer.view','customer.create','customer.update','product.view','inventory.view','quote.view','quote.create','quote.update','sale.view','sale.create');
  insert into public.role_permissions(role_id,permission_id)
  select r.id,p.id from public.roles r cross join public.permissions p
  where r.organization_id=org_id and r.name='ESTOQUISTA' and (p.code like 'product.%' or p.code like 'inventory.%');
  insert into public.role_permissions(role_id,permission_id)
  select r.id,p.id from public.roles r cross join public.permissions p
  where r.organization_id=org_id and r.name='FINANCEIRO' and p.code in ('customer.view','sale.view','finance.view','finance.manage','report.view');
  insert into public.user_roles(user_id,role_id) values(profile_id,admin_role_id);
  return org_id;
end $$;
revoke all on function public.bootstrap_organization(text,uuid,text,text) from public;
