create type public.business_unit_type as enum ('TECHNICAL_ASSISTANCE','STORE_DELIVERY');

create table public.business_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  type public.business_unit_type not null,
  code text not null,
  name text not null,
  active boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, type),
  unique (organization_id, code)
);

insert into public.business_units(organization_id,type,code,name)
select id,'TECHNICAL_ASSISTANCE'::public.business_unit_type,'ASSISTENCIA','Assistência Técnica' from public.organizations
union all
select id,'STORE_DELIVERY'::public.business_unit_type,'LOJA','Loja e Delivery' from public.organizations;

create index business_units_org_idx on public.business_units(organization_id,active);
alter table public.business_units enable row level security;
create policy business_units_select on public.business_units for select to authenticated
using(organization_id=public.current_organization_id());
create policy business_units_manage on public.business_units for update to authenticated
using(organization_id=public.current_organization_id() and public.has_permission('settings.manage'))
with check(organization_id=public.current_organization_id());
create trigger business_units_updated_at before update on public.business_units
for each row execute function public.set_updated_at();
create trigger business_units_audit after insert or update on public.business_units
for each row execute function public.audit_row_change();

create or replace function public.business_unit_belongs_to_current_org(p_business_unit_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.business_units
    where id=p_business_unit_id
      and organization_id=public.current_organization_id()
      and active=true
  )
$$;
revoke all on function public.business_unit_belongs_to_current_org(uuid) from public;
grant execute on function public.business_unit_belongs_to_current_org(uuid) to authenticated;

insert into public.permissions(code,name) values
('cash.view','Visualizar caixas'),
('cash.manage','Abrir, movimentar e fechar caixas'),
('service_order.view','Visualizar ordens de serviço'),
('service_order.create','Criar ordens de serviço'),
('service_order.update','Editar ordens de serviço'),
('service_order.cancel','Cancelar ordens de serviço'),
('delivery.view','Visualizar pedidos de delivery'),
('delivery.manage','Gerenciar pedidos de delivery')
on conflict(code) do nothing;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name='ADMIN'
on conflict do nothing;
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name='GERENTE' and p.code in ('cash.view','cash.manage','service_order.view','service_order.create','service_order.update','service_order.cancel','delivery.view','delivery.manage')
on conflict do nothing;
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name='VENDEDOR' and p.code in ('cash.view','service_order.view','service_order.create','service_order.update','delivery.view','delivery.manage')
on conflict do nothing;
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name='FINANCEIRO' and p.code in ('cash.view','cash.manage')
on conflict do nothing;

alter table public.inventory add column business_unit_id uuid references public.business_units(id);
update public.inventory i set business_unit_id=(
  select bu.id from public.business_units bu
  where bu.organization_id=i.organization_id and bu.type='STORE_DELIVERY'
);
alter table public.inventory alter column business_unit_id set not null;
alter table public.inventory add constraint inventory_org_unit_fk foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id);
alter table public.inventory drop constraint inventory_organization_id_product_id_key;
alter table public.inventory add constraint inventory_org_unit_product_key unique(organization_id,business_unit_id,product_id);
drop index public.inventory_org_product_idx;
create index inventory_org_unit_product_idx on public.inventory(organization_id,business_unit_id,product_id);

alter table public.inventory_movements add column business_unit_id uuid references public.business_units(id);
update public.inventory_movements m set business_unit_id=(
  select bu.id from public.business_units bu
  where bu.organization_id=m.organization_id and bu.type='STORE_DELIVERY'
);
alter table public.inventory_movements alter column business_unit_id set not null;
alter table public.inventory_movements add constraint inventory_movements_org_unit_fk foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id);
drop index public.inventory_movements_org_created_idx;
create index inventory_movements_org_unit_created_idx on public.inventory_movements(organization_id,business_unit_id,created_at desc);

drop function public.adjust_inventory(uuid,numeric,public.inventory_movement_type,text,text,uuid);
create or replace function public.adjust_inventory(
  p_business_unit_id uuid, p_product_id uuid, p_quantity numeric,
  p_type public.inventory_movement_type, p_reason text,
  p_reference_type text default null, p_reference_id uuid default null
) returns public.inventory
language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; current_row public.inventory; result public.inventory;
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null then raise exception 'Usuário inativo ou não autenticado'; end if;
  if not public.business_unit_belongs_to_current_org(p_business_unit_id) then raise exception 'Unidade operacional inválida'; end if;
  if p_quantity=0 then raise exception 'A quantidade deve ser diferente de zero'; end if;
  if not (public.has_permission('inventory.adjust') or public.has_permission('inventory.entry')) then raise exception 'Acesso negado'; end if;
  if not exists(select 1 from public.products where id=p_product_id and organization_id=org and deleted_at is null) then raise exception 'Produto não encontrado'; end if;
  insert into public.inventory(organization_id,business_unit_id,product_id,quantity)
  values(org,p_business_unit_id,p_product_id,0)
  on conflict(organization_id,business_unit_id,product_id) do nothing;
  select * into current_row from public.inventory
  where organization_id=org and business_unit_id=p_business_unit_id and product_id=p_product_id for update;
  if current_row.quantity+p_quantity<0 then raise exception 'Estoque insuficiente'; end if;
  update public.inventory set quantity=current_row.quantity+p_quantity,updated_at=now()
  where id=current_row.id returning * into result;
  insert into public.inventory_movements(organization_id,business_unit_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reference_id,reason,created_by)
  values(org,p_business_unit_id,p_product_id,p_type,p_quantity,current_row.quantity,result.quantity,p_reference_type,p_reference_id,p_reason,actor);
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data)
  values(org,actor,case when p_quantity>0 then 'INVENTORY_ENTRY' else 'INVENTORY_EXIT' end,'inventory',p_product_id,
    jsonb_build_object('business_unit_id',p_business_unit_id,'quantity_before',current_row.quantity,'quantity_after',result.quantity,'reason',p_reason));
  return result;
end $$;
revoke all on function public.adjust_inventory(uuid,uuid,numeric,public.inventory_movement_type,text,text,uuid) from public;
grant execute on function public.adjust_inventory(uuid,uuid,numeric,public.inventory_movement_type,text,text,uuid) to authenticated;

alter table public.quotes add column business_unit_id uuid references public.business_units(id);
alter table public.sales add column business_unit_id uuid references public.business_units(id);
alter table public.accounts_receivable add column business_unit_id uuid references public.business_units(id);
alter table public.accounts_payable add column business_unit_id uuid references public.business_units(id);

update public.quotes q set business_unit_id=(select id from public.business_units where organization_id=q.organization_id and type='STORE_DELIVERY');
update public.sales s set business_unit_id=(select id from public.business_units where organization_id=s.organization_id and type='STORE_DELIVERY');
update public.accounts_receivable a set business_unit_id=(select id from public.business_units where organization_id=a.organization_id and type='STORE_DELIVERY');
update public.accounts_payable a set business_unit_id=(select id from public.business_units where organization_id=a.organization_id and type='STORE_DELIVERY');

alter table public.quotes alter column business_unit_id set not null;
alter table public.sales alter column business_unit_id set not null;
alter table public.accounts_receivable alter column business_unit_id set not null;
alter table public.accounts_payable alter column business_unit_id set not null;
alter table public.quotes add constraint quotes_org_unit_fk foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id);
alter table public.sales add constraint sales_org_unit_fk foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id);
alter table public.accounts_receivable add constraint receivable_org_unit_fk foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id);
alter table public.accounts_payable add constraint payable_org_unit_fk foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id);
create index quotes_org_unit_created_idx on public.quotes(organization_id,business_unit_id,created_at desc) where deleted_at is null;
create index sales_org_unit_created_idx on public.sales(organization_id,business_unit_id,created_at desc);
create index receivable_org_unit_due_idx on public.accounts_receivable(organization_id,business_unit_id,due_date,status);
create index payable_org_unit_due_idx on public.accounts_payable(organization_id,business_unit_id,due_date,status) where deleted_at is null;

drop function public.complete_sale(uuid,jsonb,jsonb,numeric,text);
create or replace function public.complete_sale(
  p_business_unit_id uuid,p_customer_id uuid,p_items jsonb,p_payments jsonb,
  p_discount numeric default 0,p_notes text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; sale_uuid uuid; item jsonb; payment jsonb; product_row public.products; stock_row public.inventory;
declare subtotal_value numeric(14,2):=0; total_value numeric(14,2); line_total numeric(14,2); qty numeric(14,3);
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('sale.create') then raise exception 'Acesso negado'; end if;
  if not public.business_unit_belongs_to_current_org(p_business_unit_id) then raise exception 'Unidade operacional inválida'; end if;
  if p_customer_id is not null and not exists(select 1 from public.customers where id=p_customer_id and organization_id=org and deleted_at is null) then raise exception 'Cliente não encontrado'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'A venda precisa de itens'; end if;
  if p_discount<0 then raise exception 'Desconto inválido'; end if;
  for item in select * from jsonb_array_elements(p_items) loop
    qty:=(item->>'quantity')::numeric;
    if qty<=0 then raise exception 'Quantidade inválida'; end if;
    select * into product_row from public.products where id=(item->>'product_id')::uuid and organization_id=org and deleted_at is null;
    if not found then raise exception 'Produto não encontrado'; end if;
    select * into stock_row from public.inventory where organization_id=org and business_unit_id=p_business_unit_id and product_id=product_row.id for update;
    if not found or stock_row.quantity<qty then raise exception 'Estoque insuficiente para %',product_row.name; end if;
    subtotal_value:=subtotal_value+round(product_row.sale_price*qty,2);
  end loop;
  total_value:=subtotal_value-p_discount;
  if total_value<0 then raise exception 'Desconto maior que o subtotal'; end if;
  if coalesce((select sum((x->>'amount')::numeric) from jsonb_array_elements(p_payments) x),0)<>total_value then raise exception 'Pagamentos não conferem com o total'; end if;
  insert into public.sales(organization_id,business_unit_id,number,customer_id,status,subtotal,discount,total,seller_id,notes)
  values(org,p_business_unit_id,lpad(nextval('public.sale_number_seq')::text,8,'0'),p_customer_id,'COMPLETED',subtotal_value,p_discount,total_value,actor,p_notes)
  returning id into sale_uuid;
  for item in select * from jsonb_array_elements(p_items) loop
    qty:=(item->>'quantity')::numeric;
    select * into product_row from public.products where id=(item->>'product_id')::uuid;
    line_total:=round(product_row.sale_price*qty,2);
    insert into public.sale_items(sale_id,organization_id,product_id,product_name,sku,quantity,unit_price,discount,total,cost_price_snapshot)
    values(sale_uuid,org,product_row.id,product_row.name,product_row.sku,qty,product_row.sale_price,0,line_total,product_row.cost_price);
    select * into stock_row from public.inventory where organization_id=org and business_unit_id=p_business_unit_id and product_id=product_row.id for update;
    update public.inventory set quantity=stock_row.quantity-qty,updated_at=now() where id=stock_row.id;
    insert into public.inventory_movements(organization_id,business_unit_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reference_id,reason,created_by)
    values(org,p_business_unit_id,product_row.id,'SALE',-qty,stock_row.quantity,stock_row.quantity-qty,'SALE',sale_uuid,'Venda concluída',actor);
  end loop;
  for payment in select * from jsonb_array_elements(p_payments) loop
    insert into public.payments(organization_id,sale_id,method,amount,status,paid_at,reference)
    values(org,sale_uuid,(payment->>'method')::public.payment_method,(payment->>'amount')::numeric,'PAID',now(),payment->>'reference');
  end loop;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data)
  values(org,actor,'SALE_CREATE','sales',sale_uuid,jsonb_build_object('business_unit_id',p_business_unit_id,'total',total_value));
  return sale_uuid;
end $$;
revoke all on function public.complete_sale(uuid,uuid,jsonb,jsonb,numeric,text) from public;
grant execute on function public.complete_sale(uuid,uuid,jsonb,jsonb,numeric,text) to authenticated;

create or replace function public.cancel_sale(p_sale_id uuid,p_reason text) returns void language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; sale_row public.sales; line public.sale_items; stock_row public.inventory;
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if not public.has_permission('sale.cancel') then raise exception 'Acesso negado'; end if;
  select * into sale_row from public.sales where id=p_sale_id and organization_id=org for update;
  if not found then raise exception 'Venda não encontrada'; end if;
  if sale_row.status<>'COMPLETED' then raise exception 'Somente vendas concluídas podem ser canceladas'; end if;
  if nullif(trim(p_reason),'') is null then raise exception 'Informe o motivo'; end if;
  for line in select * from public.sale_items where sale_id=p_sale_id loop
    select * into stock_row from public.inventory
    where organization_id=org and business_unit_id=sale_row.business_unit_id and product_id=line.product_id for update;
    update public.inventory set quantity=stock_row.quantity+line.quantity,updated_at=now() where id=stock_row.id;
    insert into public.inventory_movements(organization_id,business_unit_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reference_id,reason,created_by)
    values(org,sale_row.business_unit_id,line.product_id,'CANCELLATION',line.quantity,stock_row.quantity,stock_row.quantity+line.quantity,'SALE',p_sale_id,p_reason,actor);
  end loop;
  update public.sales set status='CANCELLED',cancelled_at=now(),cancelled_by=actor,cancellation_reason=p_reason,updated_at=now() where id=p_sale_id;
  update public.payments set status='CANCELLED' where sale_id=p_sale_id;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,old_data,new_data)
  values(org,actor,'SALE_CANCEL','sales',p_sale_id,to_jsonb(sale_row),jsonb_build_object('status','CANCELLED','reason',p_reason));
end $$;

create or replace function public.sync_sale_receivable() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' and new.status='COMPLETED' then
    insert into public.accounts_receivable(organization_id,business_unit_id,customer_id,sale_id,description,amount,due_date,status,paid_at)
    values(new.organization_id,new.business_unit_id,new.customer_id,new.id,'Venda '||new.number,new.total,current_date,'PAID',now());
  elsif tg_op='UPDATE' and new.status='CANCELLED' and old.status<>'CANCELLED' then
    update public.accounts_receivable set status='CANCELLED',updated_at=now() where sale_id=new.id;
  end if;
  return new;
end $$;

create type public.cash_session_status as enum ('OPEN','CLOSED');
create type public.cash_movement_type as enum ('OPENING','SALE','SUPPLY','WITHDRAWAL','REFUND');

create table public.cash_registers (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), name text not null, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(organization_id,business_unit_id,name),
  foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id)
);
create table public.cash_sessions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), cash_register_id uuid not null references public.cash_registers(id),
  status public.cash_session_status not null default 'OPEN', opened_by uuid not null references public.profiles(id), opened_at timestamptz not null default now(),
  opening_balance numeric(14,2) not null default 0 check(opening_balance>=0), closed_by uuid references public.profiles(id), closed_at timestamptz,
  expected_balance numeric(14,2), closing_balance numeric(14,2), difference numeric(14,2), notes text
  ,foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id)
);
create table public.cash_movements (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), cash_session_id uuid not null references public.cash_sessions(id),
  type public.cash_movement_type not null, amount numeric(14,2) not null check(amount<>0), description text not null,
  payment_id uuid references public.payments(id), reference_type text, reference_id uuid,
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
  ,foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id)
);
create unique index cash_sessions_one_open_idx on public.cash_sessions(cash_register_id) where status='OPEN';
create index cash_sessions_org_unit_idx on public.cash_sessions(organization_id,business_unit_id,opened_at desc);
create index cash_movements_org_unit_idx on public.cash_movements(organization_id,business_unit_id,created_at desc);

insert into public.cash_registers(organization_id,business_unit_id,name)
select organization_id,id,'Caixa principal' from public.business_units;

alter table public.cash_registers enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.cash_movements enable row level security;
create policy cash_registers_select on public.cash_registers for select to authenticated
using(organization_id=public.current_organization_id() and public.has_permission('cash.view'));
create policy cash_sessions_select on public.cash_sessions for select to authenticated
using(organization_id=public.current_organization_id() and public.has_permission('cash.view'));
create policy cash_movements_select on public.cash_movements for select to authenticated
using(organization_id=public.current_organization_id() and public.has_permission('cash.view'));

create trigger cash_registers_updated_at before update on public.cash_registers
for each row execute function public.set_updated_at();

create or replace function public.open_cash_session(p_business_unit_id uuid,p_cash_register_id uuid,p_opening_balance numeric default 0)
returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; session_id uuid;
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('cash.manage') then raise exception 'Acesso negado'; end if;
  if p_opening_balance<0 then raise exception 'Saldo inicial inválido'; end if;
  if not exists(select 1 from public.cash_registers where id=p_cash_register_id and organization_id=org and business_unit_id=p_business_unit_id and active) then raise exception 'Caixa inválido'; end if;
  insert into public.cash_sessions(organization_id,business_unit_id,cash_register_id,opened_by,opening_balance)
  values(org,p_business_unit_id,p_cash_register_id,actor,p_opening_balance) returning id into session_id;
  if p_opening_balance>0 then
    insert into public.cash_movements(organization_id,business_unit_id,cash_session_id,type,amount,description,created_by)
    values(org,p_business_unit_id,session_id,'OPENING',p_opening_balance,'Saldo inicial',actor);
  end if;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data)
  values(org,actor,'CASH_OPEN','cash_sessions',session_id,jsonb_build_object('business_unit_id',p_business_unit_id,'opening_balance',p_opening_balance));
  return session_id;
exception when unique_violation then raise exception 'Este caixa já possui uma sessão aberta';
end $$;

create or replace function public.record_cash_movement(p_cash_session_id uuid,p_type public.cash_movement_type,p_amount numeric,p_description text)
returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; session_row public.cash_sessions; movement_id uuid; signed_amount numeric;
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('cash.manage') then raise exception 'Acesso negado'; end if;
  if p_type not in ('SUPPLY','WITHDRAWAL') then raise exception 'Tipo de movimentação manual inválido'; end if;
  if p_amount<=0 or nullif(trim(p_description),'') is null then raise exception 'Dados da movimentação inválidos'; end if;
  select * into session_row from public.cash_sessions where id=p_cash_session_id and organization_id=org and status='OPEN' for update;
  if not found then raise exception 'Sessão de caixa aberta não encontrada'; end if;
  signed_amount:=case when p_type='WITHDRAWAL' then -p_amount else p_amount end;
  insert into public.cash_movements(organization_id,business_unit_id,cash_session_id,type,amount,description,created_by)
  values(org,session_row.business_unit_id,session_row.id,p_type,signed_amount,trim(p_description),actor) returning id into movement_id;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data)
  values(org,actor,'CASH_MOVEMENT','cash_movements',movement_id,jsonb_build_object('type',p_type,'amount',signed_amount,'business_unit_id',session_row.business_unit_id));
  return movement_id;
end $$;

create or replace function public.close_cash_session(p_cash_session_id uuid,p_closing_balance numeric,p_notes text default null)
returns public.cash_sessions language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; session_row public.cash_sessions; expected numeric(14,2); result public.cash_sessions;
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('cash.manage') then raise exception 'Acesso negado'; end if;
  if p_closing_balance<0 then raise exception 'Saldo final inválido'; end if;
  select * into session_row from public.cash_sessions where id=p_cash_session_id and organization_id=org and status='OPEN' for update;
  if not found then raise exception 'Sessão de caixa aberta não encontrada'; end if;
  select coalesce(sum(amount),0) into expected from public.cash_movements where cash_session_id=session_row.id;
  update public.cash_sessions set status='CLOSED',closed_by=actor,closed_at=now(),expected_balance=expected,
    closing_balance=p_closing_balance,difference=p_closing_balance-expected,notes=nullif(trim(p_notes),'')
  where id=session_row.id returning * into result;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data)
  values(org,actor,'CASH_CLOSE','cash_sessions',result.id,jsonb_build_object('business_unit_id',result.business_unit_id,'expected_balance',expected,'closing_balance',p_closing_balance,'difference',result.difference));
  return result;
end $$;

revoke all on function public.open_cash_session(uuid,uuid,numeric) from public;
revoke all on function public.record_cash_movement(uuid,public.cash_movement_type,numeric,text) from public;
revoke all on function public.close_cash_session(uuid,numeric,text) from public;
grant execute on function public.open_cash_session(uuid,uuid,numeric) to authenticated;
grant execute on function public.record_cash_movement(uuid,public.cash_movement_type,numeric,text) to authenticated;
grant execute on function public.close_cash_session(uuid,numeric,text) to authenticated;

create or replace function public.provision_default_business_units()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.business_units(organization_id,type,code,name) values
    (new.id,'TECHNICAL_ASSISTANCE','ASSISTENCIA','Assistência Técnica'),
    (new.id,'STORE_DELIVERY','LOJA','Loja e Delivery');
  insert into public.cash_registers(organization_id,business_unit_id,name)
  select new.id,id,'Caixa principal' from public.business_units where organization_id=new.id;
  return new;
end $$;
create trigger organizations_default_business_units after insert on public.organizations
for each row execute function public.provision_default_business_units();
