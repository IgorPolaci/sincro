create type public.quote_status as enum ('DRAFT','SENT','APPROVED','REJECTED','EXPIRED','CONVERTED','CANCELLED');
create type public.sale_status as enum ('OPEN','COMPLETED','CANCELLED','REFUNDED');
create type public.payment_method as enum ('CASH','PIX','CREDIT_CARD','DEBIT_CARD','BANK_TRANSFER','BOLETO','OTHER');
create type public.payment_status as enum ('PENDING','PAID','CANCELLED','REFUNDED');
create sequence public.quote_number_seq;
create sequence public.sale_number_seq;

create table public.quotes (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  number text not null, customer_id uuid references public.customers(id), status public.quote_status not null default 'DRAFT',
  subtotal numeric(14,2) not null default 0, discount numeric(14,2) not null default 0, total numeric(14,2) not null default 0,
  valid_until date, notes text, created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz, unique(organization_id,number)
);
create table public.quote_items (
  id uuid primary key default gen_random_uuid(), quote_id uuid not null references public.quotes(id), organization_id uuid not null references public.organizations(id),
  product_id uuid references public.products(id), description text not null, quantity numeric(14,3) not null check(quantity>0),
  unit_price numeric(14,2) not null check(unit_price>=0), discount numeric(14,2) not null default 0, total numeric(14,2) not null check(total>=0),
  created_at timestamptz not null default now()
);
create table public.sales (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), number text not null,
  customer_id uuid references public.customers(id), status public.sale_status not null default 'OPEN', subtotal numeric(14,2) not null,
  discount numeric(14,2) not null default 0, total numeric(14,2) not null, seller_id uuid not null references public.profiles(id),
  quote_id uuid references public.quotes(id), notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  cancelled_at timestamptz, cancelled_by uuid references public.profiles(id), cancellation_reason text, unique(organization_id,number)
);
create table public.sale_items (
  id uuid primary key default gen_random_uuid(), sale_id uuid not null references public.sales(id), organization_id uuid not null references public.organizations(id),
  product_id uuid not null references public.products(id), product_name text not null, sku text not null, quantity numeric(14,3) not null check(quantity>0),
  unit_price numeric(14,2) not null, discount numeric(14,2) not null default 0, total numeric(14,2) not null,
  cost_price_snapshot numeric(14,2) not null, created_at timestamptz not null default now()
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), sale_id uuid not null references public.sales(id),
  method public.payment_method not null, amount numeric(14,2) not null check(amount>0), status public.payment_status not null default 'PENDING',
  paid_at timestamptz, reference text, created_at timestamptz not null default now()
);

create index quotes_org_created_idx on public.quotes(organization_id,created_at desc) where deleted_at is null;
create index sales_org_created_idx on public.sales(organization_id,created_at desc);
create index sale_items_sale_idx on public.sale_items(sale_id);
do $$ declare t text; begin foreach t in array array['quotes','quote_items','sales','sale_items','payments'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;
create policy quotes_select on public.quotes for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('quote.view'));
create policy quote_items_select on public.quote_items for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('quote.view'));
create policy sales_select on public.sales for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('sale.view'));
create policy sale_items_select on public.sale_items for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('sale.view'));
create policy payments_select on public.payments for select to authenticated using(organization_id=public.current_organization_id() and (public.has_permission('sale.view') or public.has_permission('finance.view')));

create or replace function public.complete_sale(p_customer_id uuid,p_items jsonb,p_payments jsonb,p_discount numeric default 0,p_notes text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; sale_uuid uuid; item jsonb; payment jsonb; product_row public.products; stock_row public.inventory;
declare subtotal_value numeric(14,2):=0; total_value numeric(14,2); line_total numeric(14,2); qty numeric(14,3);
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('sale.create') then raise exception 'Acesso negado'; end if;
  if p_customer_id is not null and not exists(select 1 from public.customers where id=p_customer_id and organization_id=org and deleted_at is null) then raise exception 'Cliente não encontrado'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'A venda precisa de itens'; end if;
  if p_discount<0 then raise exception 'Desconto inválido'; end if;
  for item in select * from jsonb_array_elements(p_items) loop
    qty:=(item->>'quantity')::numeric;
    if qty<=0 then raise exception 'Quantidade inválida'; end if;
    select * into product_row from public.products where id=(item->>'product_id')::uuid and organization_id=org and deleted_at is null;
    if not found then raise exception 'Produto não encontrado'; end if;
    select * into stock_row from public.inventory where organization_id=org and product_id=product_row.id for update;
    if not found or stock_row.quantity<qty then raise exception 'Estoque insuficiente para %',product_row.name; end if;
    subtotal_value:=subtotal_value+round(product_row.sale_price*qty,2);
  end loop;
  total_value:=subtotal_value-p_discount; if total_value<0 then raise exception 'Desconto maior que o subtotal'; end if;
  if coalesce((select sum((x->>'amount')::numeric) from jsonb_array_elements(p_payments) x),0)<>total_value then raise exception 'Pagamentos não conferem com o total'; end if;
  insert into public.sales(organization_id,number,customer_id,status,subtotal,discount,total,seller_id,notes)
  values(org,lpad(nextval('public.sale_number_seq')::text,8,'0'),p_customer_id,'COMPLETED',subtotal_value,p_discount,total_value,actor,p_notes) returning id into sale_uuid;
  for item in select * from jsonb_array_elements(p_items) loop
    qty:=(item->>'quantity')::numeric; select * into product_row from public.products where id=(item->>'product_id')::uuid;
    line_total:=round(product_row.sale_price*qty,2);
    insert into public.sale_items(sale_id,organization_id,product_id,product_name,sku,quantity,unit_price,discount,total,cost_price_snapshot)
    values(sale_uuid,org,product_row.id,product_row.name,product_row.sku,qty,product_row.sale_price,0,line_total,product_row.cost_price);
    select * into stock_row from public.inventory where organization_id=org and product_id=product_row.id for update;
    update public.inventory set quantity=stock_row.quantity-qty,updated_at=now() where id=stock_row.id;
    insert into public.inventory_movements(organization_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reference_id,reason,created_by)
    values(org,product_row.id,'SALE',-qty,stock_row.quantity,stock_row.quantity-qty,'SALE',sale_uuid,'Venda concluída',actor);
  end loop;
  for payment in select * from jsonb_array_elements(p_payments) loop
    insert into public.payments(organization_id,sale_id,method,amount,status,paid_at,reference)
    values(org,sale_uuid,(payment->>'method')::public.payment_method,(payment->>'amount')::numeric,'PAID',now(),payment->>'reference');
  end loop;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data) values(org,actor,'SALE_CREATE','sales',sale_uuid,jsonb_build_object('total',total_value));
  return sale_uuid;
end $$;
revoke all on function public.complete_sale(uuid,jsonb,jsonb,numeric,text) from public;
grant execute on function public.complete_sale(uuid,jsonb,jsonb,numeric,text) to authenticated;

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
    select * into stock_row from public.inventory where organization_id=org and product_id=line.product_id for update;
    update public.inventory set quantity=stock_row.quantity+line.quantity,updated_at=now() where id=stock_row.id;
    insert into public.inventory_movements(organization_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reference_id,reason,created_by)
    values(org,line.product_id,'CANCELLATION',line.quantity,stock_row.quantity,stock_row.quantity+line.quantity,'SALE',p_sale_id,p_reason,actor);
  end loop;
  update public.sales set status='CANCELLED',cancelled_at=now(),cancelled_by=actor,cancellation_reason=p_reason,updated_at=now() where id=p_sale_id;
  update public.payments set status='CANCELLED' where sale_id=p_sale_id;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,old_data,new_data)
  values(org,actor,'SALE_CANCEL','sales',p_sale_id,to_jsonb(sale_row),jsonb_build_object('status','CANCELLED','reason',p_reason));
end $$;
revoke all on function public.cancel_sale(uuid,text) from public;
grant execute on function public.cancel_sale(uuid,text) to authenticated;
