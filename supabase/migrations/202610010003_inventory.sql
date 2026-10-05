create type public.inventory_movement_type as enum ('INITIAL','PURCHASE','SALE','RETURN','ADJUSTMENT','ENTRY','EXIT','CANCELLATION');

create table public.inventory (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  product_id uuid not null references public.products(id), quantity numeric(14,3) not null default 0,
  updated_at timestamptz not null default now(), unique(organization_id, product_id)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  product_id uuid not null references public.products(id), type public.inventory_movement_type not null,
  quantity numeric(14,3) not null check(quantity <> 0), quantity_before numeric(14,3) not null, quantity_after numeric(14,3) not null,
  reference_type text, reference_id uuid, reason text not null, created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index inventory_org_product_idx on public.inventory(organization_id, product_id);
create index inventory_movements_org_created_idx on public.inventory_movements(organization_id, created_at desc);
create index inventory_movements_product_idx on public.inventory_movements(product_id, created_at desc);
alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;
create policy inventory_select on public.inventory for select to authenticated
using (organization_id = public.current_organization_id() and public.has_permission('inventory.view'));
create policy inventory_movements_select on public.inventory_movements for select to authenticated
using (organization_id = public.current_organization_id() and public.has_permission('inventory.view'));

create or replace function public.adjust_inventory(
  p_product_id uuid, p_quantity numeric, p_type public.inventory_movement_type, p_reason text,
  p_reference_type text default null, p_reference_id uuid default null
) returns public.inventory
language plpgsql security definer set search_path = '' as $$
declare org uuid; actor uuid; current_row public.inventory; result public.inventory;
begin
  org := public.current_organization_id(); actor := public.current_profile_id();
  if org is null or actor is null then raise exception 'Usuário inativo ou não autenticado'; end if;
  if p_quantity = 0 then raise exception 'A quantidade deve ser diferente de zero'; end if;
  if not (public.has_permission('inventory.adjust') or public.has_permission('inventory.entry')) then raise exception 'Acesso negado'; end if;
  if not exists(select 1 from public.products where id=p_product_id and organization_id=org and deleted_at is null) then raise exception 'Produto não encontrado'; end if;
  insert into public.inventory(organization_id,product_id,quantity) values(org,p_product_id,0)
  on conflict(organization_id,product_id) do nothing;
  select * into current_row from public.inventory where organization_id=org and product_id=p_product_id for update;
  if current_row.quantity + p_quantity < 0 then raise exception 'Estoque insuficiente'; end if;
  update public.inventory set quantity=current_row.quantity+p_quantity,updated_at=now() where id=current_row.id returning * into result;
  insert into public.inventory_movements(organization_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reference_id,reason,created_by)
  values(org,p_product_id,p_type,p_quantity,current_row.quantity,result.quantity,p_reference_type,p_reference_id,p_reason,actor);
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data)
  values(org,actor,case when p_quantity > 0 then 'INVENTORY_ENTRY' else 'INVENTORY_EXIT' end,'inventory',p_product_id,
    jsonb_build_object('quantity_before',current_row.quantity,'quantity_after',result.quantity,'reason',p_reason));
  return result;
end $$;
revoke all on function public.adjust_inventory(uuid,numeric,public.inventory_movement_type,text,text,uuid) from public;
grant execute on function public.adjust_inventory(uuid,numeric,public.inventory_movement_type,text,text,uuid) to authenticated;

create or replace function public.block_direct_inventory_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_setting('sincro.inventory_operation', true) <> 'allowed' then raise exception 'Use adjust_inventory para alterar estoque'; end if;
  return new;
end $$;
