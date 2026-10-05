create type public.receivable_status as enum ('PENDING','PAID','PARTIAL','OVERDUE','CANCELLED');
create type public.payable_status as enum ('PENDING','PAID','PARTIAL','OVERDUE','CANCELLED');

create table public.accounts_receivable (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  customer_id uuid references public.customers(id), sale_id uuid references public.sales(id), description text not null,
  amount numeric(14,2) not null check(amount>=0), due_date date not null, paid_at timestamptz,
  status public.receivable_status not null default 'PENDING', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.accounts_payable (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  supplier_id uuid references public.suppliers(id), description text not null, category text,
  amount numeric(14,2) not null check(amount>=0), due_date date not null, paid_at timestamptz,
  status public.payable_status not null default 'PENDING', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_by uuid references public.profiles(id)
);
create index receivable_org_due_idx on public.accounts_receivable(organization_id,due_date,status);
create index payable_org_due_idx on public.accounts_payable(organization_id,due_date,status) where deleted_at is null;
alter table public.accounts_receivable enable row level security;
alter table public.accounts_payable enable row level security;
create policy receivable_select on public.accounts_receivable for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('finance.view'));
create policy payable_select on public.accounts_payable for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('finance.view'));
create policy payable_insert on public.accounts_payable for insert to authenticated with check(organization_id=public.current_organization_id() and public.has_permission('finance.manage'));
create policy payable_update on public.accounts_payable for update to authenticated using(organization_id=public.current_organization_id() and public.has_permission('finance.manage')) with check(organization_id=public.current_organization_id());

create or replace function public.sync_sale_receivable() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' and new.status='COMPLETED' then
    insert into public.accounts_receivable(organization_id,customer_id,sale_id,description,amount,due_date,status,paid_at)
    values(new.organization_id,new.customer_id,new.id,'Venda '||new.number,new.total,current_date,'PAID',now());
  elsif tg_op='UPDATE' and new.status='CANCELLED' and old.status<>'CANCELLED' then
    update public.accounts_receivable set status='CANCELLED',updated_at=now() where sale_id=new.id;
  end if;
  return new;
end $$;
create trigger sales_finance after insert or update of status on public.sales for each row execute function public.sync_sale_receivable();
create trigger receivable_updated_at before update on public.accounts_receivable for each row execute function public.set_updated_at();
create trigger payable_updated_at before update on public.accounts_payable for each row execute function public.set_updated_at();
create trigger payable_audit after insert or update on public.accounts_payable for each row execute function public.audit_row_change();
