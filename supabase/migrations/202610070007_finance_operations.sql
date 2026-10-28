alter table public.accounts_payable add column payment_method public.payment_method;
alter table public.accounts_payable add column cash_movement_id uuid references public.cash_movements(id);
alter table public.accounts_payable add column paid_by uuid references public.profiles(id);

create or replace function public.create_account_payable(
  p_business_unit_id uuid,p_supplier_id uuid,p_description text,p_category text,p_amount numeric,p_due_date date
) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; payable_id uuid;
begin
  org:=public.current_organization_id();actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('finance.manage') then raise exception 'Acesso negado'; end if;
  if not public.business_unit_belongs_to_current_org(p_business_unit_id) then raise exception 'Unidade operacional inválida'; end if;
  if p_supplier_id is not null and not exists(select 1 from public.suppliers where id=p_supplier_id and organization_id=org and active and deleted_at is null) then raise exception 'Fornecedor não encontrado'; end if;
  if nullif(trim(p_description),'') is null or p_amount<=0 or p_due_date is null then raise exception 'Dados da conta inválidos'; end if;
  insert into public.accounts_payable(organization_id,business_unit_id,supplier_id,description,category,amount,due_date)
  values(org,p_business_unit_id,p_supplier_id,trim(p_description),nullif(trim(p_category),''),p_amount,p_due_date) returning id into payable_id;
  return payable_id;
end $$;

create or replace function public.settle_account_payable(p_payable_id uuid,p_payment_method public.payment_method,p_cash_session_id uuid default null)
returns void language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; payable_row public.accounts_payable; session_row public.cash_sessions; movement_id uuid;
begin
  org:=public.current_organization_id();actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('finance.manage') then raise exception 'Acesso negado'; end if;
  select * into payable_row from public.accounts_payable where id=p_payable_id and organization_id=org and deleted_at is null for update;
  if not found then raise exception 'Conta não encontrada'; end if;
  if payable_row.status not in ('PENDING','PARTIAL','OVERDUE') then raise exception 'Esta conta não pode ser quitada'; end if;
  if p_payment_method='CASH' then
    select * into session_row from public.cash_sessions where id=p_cash_session_id and organization_id=org and business_unit_id=payable_row.business_unit_id and status='OPEN' for update;
    if not found then raise exception 'Abra o caixa desta unidade para pagar em dinheiro'; end if;
    insert into public.cash_movements(organization_id,business_unit_id,cash_session_id,type,amount,description,reference_type,reference_id,created_by)
    values(org,payable_row.business_unit_id,p_cash_session_id,'WITHDRAWAL',-payable_row.amount,'Pagamento: '||payable_row.description,'ACCOUNT_PAYABLE',payable_row.id,actor) returning id into movement_id;
  end if;
  update public.accounts_payable set status='PAID',paid_at=now(),paid_by=actor,payment_method=p_payment_method,cash_movement_id=movement_id,updated_at=now() where id=p_payable_id;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,old_data,new_data)
  values(org,actor,'ACCOUNT_PAYABLE_SETTLE','accounts_payable',p_payable_id,to_jsonb(payable_row),jsonb_build_object('status','PAID','payment_method',p_payment_method,'cash_session_id',p_cash_session_id));
end $$;

create or replace function public.cancel_account_payable(p_payable_id uuid,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; payable_row public.accounts_payable;
begin
  org:=public.current_organization_id();actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('finance.manage') then raise exception 'Acesso negado'; end if;
  if nullif(trim(p_reason),'') is null then raise exception 'Informe o motivo'; end if;
  select * into payable_row from public.accounts_payable where id=p_payable_id and organization_id=org and deleted_at is null for update;
  if not found or payable_row.status not in ('PENDING','PARTIAL','OVERDUE') then raise exception 'Esta conta não pode ser cancelada'; end if;
  update public.accounts_payable set status='CANCELLED',updated_at=now() where id=p_payable_id;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,old_data,new_data)
  values(org,actor,'ACCOUNT_PAYABLE_CANCEL','accounts_payable',p_payable_id,to_jsonb(payable_row),jsonb_build_object('status','CANCELLED','reason',trim(p_reason)));
end $$;

revoke all on function public.create_account_payable(uuid,uuid,text,text,numeric,date) from public;
revoke all on function public.settle_account_payable(uuid,public.payment_method,uuid) from public;
revoke all on function public.cancel_account_payable(uuid,text) from public;
grant execute on function public.create_account_payable(uuid,uuid,text,text,numeric,date) to authenticated;
grant execute on function public.settle_account_payable(uuid,public.payment_method,uuid) to authenticated;
grant execute on function public.cancel_account_payable(uuid,text) to authenticated;
