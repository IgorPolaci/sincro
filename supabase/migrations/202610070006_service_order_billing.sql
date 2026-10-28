create table public.service_order_payments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  business_unit_id uuid not null references public.business_units(id), service_order_id uuid not null references public.service_orders(id),
  method public.payment_method not null, amount numeric(14,2) not null check(amount>0),
  status public.payment_status not null default 'PAID', reference text, cash_movement_id uuid references public.cash_movements(id),
  paid_at timestamptz not null default now(), created_by uuid not null references public.profiles(id),
  foreign key(organization_id,business_unit_id) references public.business_units(organization_id,id)
);
create index service_order_payments_order_idx on public.service_order_payments(service_order_id,paid_at);
alter table public.service_order_payments enable row level security;
create policy service_order_payments_select on public.service_order_payments for select to authenticated
using(organization_id=public.current_organization_id() and (public.has_permission('service_order.view') or public.has_permission('finance.view')));

create or replace function public.enforce_service_order_billing_workflow()
returns trigger language plpgsql set search_path='' as $$
declare old_code text; new_code text;
begin
  if old.status_id=new.status_id then return new; end if;
  select code into old_code from public.service_order_statuses where id=old.status_id;
  select code into new_code from public.service_order_statuses where id=new.status_id;
  if (new_code='FATURADO' or (old_code='FATURADO' and new_code in ('CANCELADO','ESTORNADO'))) and current_setting('sincro.service_order_billing',true)<>'allowed' then
    raise exception 'Use o fluxo de faturamento ou estorno da O.S.';
  end if;
  return new;
end $$;
create trigger service_orders_billing_workflow before update of status_id on public.service_orders
for each row execute function public.enforce_service_order_billing_workflow();

create or replace function public.bill_service_order(p_service_order_id uuid,p_payments jsonb,p_cash_session_id uuid default null)
returns void language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; order_row public.service_orders; current_status public.service_order_statuses; billed_status public.service_order_statuses;
declare part public.service_order_parts; stock_row public.inventory; payment jsonb; payment_total numeric(14,2); cash_total numeric(14,2); due_value numeric(14,2); payment_id uuid; movement_id uuid; session_row public.cash_sessions;
begin
  org:=public.current_organization_id();actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('service_order.update') or not public.has_permission('finance.manage') then raise exception 'Acesso negado'; end if;
  select * into order_row from public.service_orders where id=p_service_order_id and organization_id=org for update;
  if not found then raise exception 'Ordem de serviço não encontrada'; end if;
  select * into current_status from public.service_order_statuses where id=order_row.status_id;
  if current_status.is_final or current_status.code='FATURADO' then raise exception 'Esta O.S. não pode ser faturada'; end if;
  select * into billed_status from public.service_order_statuses where organization_id=org and business_unit_id=order_row.business_unit_id and code='FATURADO' and active;
  due_value:=round(order_row.total-order_row.advance_amount,2);
  if due_value>0 and (jsonb_typeof(p_payments)<>'array' or jsonb_array_length(p_payments)=0) then raise exception 'Informe os pagamentos'; end if;
  select coalesce(sum((x->>'amount')::numeric),0),coalesce(sum(case when x->>'method'='CASH' then (x->>'amount')::numeric else 0 end),0) into payment_total,cash_total from jsonb_array_elements(coalesce(p_payments,'[]'::jsonb)) x;
  if round(payment_total,2)<>due_value then raise exception 'Pagamentos não conferem com o valor restante'; end if;
  if exists(select 1 from jsonb_array_elements(coalesce(p_payments,'[]'::jsonb)) x where (x->>'amount')::numeric<=0) then raise exception 'Pagamento inválido'; end if;
  if cash_total>0 then
    select * into session_row from public.cash_sessions where id=p_cash_session_id and organization_id=org and business_unit_id=order_row.business_unit_id and status='OPEN' for update;
    if not found then raise exception 'Abra o caixa desta unidade para receber em dinheiro'; end if;
  end if;
  for part in select * from public.service_order_parts where service_order_id=order_row.id and removed_at is null and inventory_applied=false for update loop
    select * into stock_row from public.inventory where organization_id=org and business_unit_id=order_row.business_unit_id and product_id=part.product_id for update;
    if not found or stock_row.quantity<part.quantity then raise exception 'Estoque insuficiente para %',part.product_name; end if;
    update public.inventory set quantity=stock_row.quantity-part.quantity,updated_at=now() where id=stock_row.id;
    insert into public.inventory_movements(organization_id,business_unit_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reference_id,reason,created_by)
    values(org,order_row.business_unit_id,part.product_id,'EXIT',-part.quantity,stock_row.quantity,stock_row.quantity-part.quantity,'SERVICE_ORDER',order_row.id,'Peça aplicada na '||order_row.number,actor);
    update public.service_order_parts set inventory_applied=true where id=part.id;
  end loop;
  for payment in select * from jsonb_array_elements(coalesce(p_payments,'[]'::jsonb)) loop
    insert into public.service_order_payments(organization_id,business_unit_id,service_order_id,method,amount,reference,created_by)
    values(org,order_row.business_unit_id,order_row.id,(payment->>'method')::public.payment_method,(payment->>'amount')::numeric,nullif(trim(payment->>'reference'),''),actor) returning id into payment_id;
    if payment->>'method'='CASH' then
      insert into public.cash_movements(organization_id,business_unit_id,cash_session_id,type,amount,description,reference_type,reference_id,created_by)
      values(org,order_row.business_unit_id,p_cash_session_id,'SALE',(payment->>'amount')::numeric,'Faturamento '||order_row.number,'SERVICE_ORDER',order_row.id,actor) returning id into movement_id;
      update public.service_order_payments set cash_movement_id=movement_id where id=payment_id;
    end if;
  end loop;
  insert into public.accounts_receivable(organization_id,business_unit_id,customer_id,description,amount,due_date,status,paid_at)
  values(org,order_row.business_unit_id,order_row.customer_id,'Faturamento '||order_row.number,order_row.total,current_date,'PAID',now());
  perform set_config('sincro.service_order_billing','allowed',true);
  update public.service_orders set status_id=billed_status.id,updated_by=actor,updated_at=now() where id=order_row.id;
  insert into public.service_order_status_history(organization_id,business_unit_id,service_order_id,from_status_id,to_status_id,note,changed_by)
  values(org,order_row.business_unit_id,order_row.id,order_row.status_id,billed_status.id,'Faturamento concluído',actor);
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data) values(org,actor,'SERVICE_ORDER_BILL','service_orders',order_row.id,jsonb_build_object('total',order_row.total,'advance',order_row.advance_amount,'paid_now',due_value,'cash_session_id',p_cash_session_id));
end $$;

create or replace function public.reverse_service_order_billing(p_service_order_id uuid,p_reason text,p_cash_session_id uuid default null)
returns void language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; order_row public.service_orders; current_status public.service_order_statuses; reversed_status public.service_order_statuses; part public.service_order_parts; stock_row public.inventory; cash_total numeric(14,2); session_row public.cash_sessions;
begin
  org:=public.current_organization_id();actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('service_order.cancel') or not public.has_permission('finance.manage') then raise exception 'Acesso negado'; end if;
  if nullif(trim(p_reason),'') is null then raise exception 'Informe o motivo'; end if;
  select * into order_row from public.service_orders where id=p_service_order_id and organization_id=org for update;
  if not found then raise exception 'Ordem de serviço não encontrada'; end if;
  select * into current_status from public.service_order_statuses where id=order_row.status_id;
  if current_status.code<>'FATURADO' then raise exception 'Somente O.S. faturada pode ser estornada'; end if;
  select coalesce(sum(amount),0) into cash_total from public.service_order_payments where service_order_id=order_row.id and method='CASH' and status='PAID';
  if cash_total>0 then
    select * into session_row from public.cash_sessions where id=p_cash_session_id and organization_id=org and business_unit_id=order_row.business_unit_id and status='OPEN' for update;
    if not found then raise exception 'Abra o caixa desta unidade para registrar o estorno'; end if;
  end if;
  for part in select * from public.service_order_parts where service_order_id=order_row.id and removed_at is null and inventory_applied=true for update loop
    select * into stock_row from public.inventory where organization_id=org and business_unit_id=order_row.business_unit_id and product_id=part.product_id for update;
    update public.inventory set quantity=stock_row.quantity+part.quantity,updated_at=now() where id=stock_row.id;
    insert into public.inventory_movements(organization_id,business_unit_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reference_id,reason,created_by)
    values(org,order_row.business_unit_id,part.product_id,'RETURN',part.quantity,stock_row.quantity,stock_row.quantity+part.quantity,'SERVICE_ORDER',order_row.id,'Estorno da '||order_row.number||': '||trim(p_reason),actor);
    update public.service_order_parts set inventory_applied=false where id=part.id;
  end loop;
  if cash_total>0 then insert into public.cash_movements(organization_id,business_unit_id,cash_session_id,type,amount,description,reference_type,reference_id,created_by) values(org,order_row.business_unit_id,p_cash_session_id,'REFUND',-cash_total,'Estorno '||order_row.number,'SERVICE_ORDER',order_row.id,actor); end if;
  update public.service_order_payments set status='REFUNDED' where service_order_id=order_row.id and status='PAID';
  update public.accounts_receivable set status='CANCELLED',updated_at=now() where organization_id=org and description='Faturamento '||order_row.number and status='PAID';
  select * into reversed_status from public.service_order_statuses where organization_id=org and business_unit_id=order_row.business_unit_id and code='ESTORNADO';
  perform set_config('sincro.service_order_billing','allowed',true);
  update public.service_orders set status_id=reversed_status.id,cancelled_at=now(),cancelled_by=actor,cancellation_reason=trim(p_reason),updated_by=actor,updated_at=now() where id=order_row.id;
  insert into public.service_order_status_history(organization_id,business_unit_id,service_order_id,from_status_id,to_status_id,note,changed_by) values(org,order_row.business_unit_id,order_row.id,order_row.status_id,reversed_status.id,trim(p_reason),actor);
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,old_data,new_data) values(org,actor,'SERVICE_ORDER_REFUND','service_orders',order_row.id,jsonb_build_object('status','FATURADO'),jsonb_build_object('status','ESTORNADO','reason',trim(p_reason),'cash_refund',cash_total));
end $$;

revoke all on function public.bill_service_order(uuid,jsonb,uuid) from public;
revoke all on function public.reverse_service_order_billing(uuid,text,uuid) from public;
grant execute on function public.bill_service_order(uuid,jsonb,uuid) to authenticated;
grant execute on function public.reverse_service_order_billing(uuid,text,uuid) to authenticated;
