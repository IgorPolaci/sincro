-- Make point-of-sale completion and cancellation atomic with inventory and cash.

drop function if exists public.complete_sale(uuid,uuid,jsonb,jsonb,numeric,text);

create function public.complete_sale(
  p_business_unit_id uuid,
  p_customer_id uuid,
  p_items jsonb,
  p_payments jsonb,
  p_discount numeric default 0,
  p_notes text default null,
  p_cash_session_id uuid default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare
  org uuid; actor uuid; sale_uuid uuid; sale_number text; item jsonb; payment jsonb;
  product_row public.products; stock_row public.inventory; cash_session_row public.cash_sessions;
  subtotal_value numeric(14,2):=0; total_value numeric(14,2); payments_total numeric(14,2);
  cash_total numeric(14,2); line_total numeric(14,2); qty numeric(14,3); payment_uuid uuid;
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('sale.create') then raise exception 'Acesso negado'; end if;
  if not public.business_unit_belongs_to_current_org(p_business_unit_id) then raise exception 'Unidade operacional inválida'; end if;
  if p_customer_id is not null and not exists(
    select 1 from public.customers where id=p_customer_id and organization_id=org and deleted_at is null and active
  ) then raise exception 'Cliente não encontrado'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'A venda precisa de itens'; end if;
  if jsonb_typeof(p_payments)<>'array' or jsonb_array_length(p_payments)=0 then raise exception 'A venda precisa de pagamentos'; end if;
  if p_discount<0 then raise exception 'Desconto inválido'; end if;

  for item in select * from jsonb_array_elements(p_items) loop
    qty:=(item->>'quantity')::numeric;
    if qty<=0 then raise exception 'Quantidade inválida'; end if;
    select * into product_row from public.products
      where id=(item->>'product_id')::uuid and organization_id=org and deleted_at is null and active;
    if not found then raise exception 'Produto não encontrado'; end if;
    select * into stock_row from public.inventory
      where organization_id=org and business_unit_id=p_business_unit_id and product_id=product_row.id for update;
    if not found or stock_row.quantity<qty then raise exception 'Estoque insuficiente para %',product_row.name; end if;
    subtotal_value:=subtotal_value+round(product_row.sale_price*qty,2);
  end loop;

  total_value:=round(subtotal_value-p_discount,2);
  if total_value<0 then raise exception 'Desconto maior que o subtotal'; end if;
  select coalesce(sum((x->>'amount')::numeric),0),
         coalesce(sum(case when x->>'method'='CASH' then (x->>'amount')::numeric else 0 end),0)
    into payments_total,cash_total from jsonb_array_elements(p_payments) x;
  if exists(select 1 from jsonb_array_elements(p_payments) x where (x->>'amount')::numeric<=0) then
    raise exception 'Valor de pagamento inválido';
  end if;
  if round(payments_total,2)<>total_value then raise exception 'Pagamentos não conferem com o total'; end if;

  if cash_total>0 then
    if p_cash_session_id is null then raise exception 'Abra o caixa para receber em dinheiro'; end if;
    select * into cash_session_row from public.cash_sessions
      where id=p_cash_session_id and organization_id=org and business_unit_id=p_business_unit_id and status='OPEN' for update;
    if not found then raise exception 'Sessão de caixa aberta não encontrada para esta unidade'; end if;
  end if;

  sale_number:=lpad(nextval('public.sale_number_seq')::text,8,'0');
  insert into public.sales(organization_id,business_unit_id,number,customer_id,status,subtotal,discount,total,seller_id,notes)
  values(org,p_business_unit_id,sale_number,p_customer_id,'COMPLETED',subtotal_value,p_discount,total_value,actor,nullif(trim(p_notes),''))
  returning id into sale_uuid;

  for item in select * from jsonb_array_elements(p_items) loop
    qty:=(item->>'quantity')::numeric;
    select * into product_row from public.products where id=(item->>'product_id')::uuid;
    line_total:=round(product_row.sale_price*qty,2);
    insert into public.sale_items(sale_id,organization_id,product_id,product_name,sku,quantity,unit_price,discount,total,cost_price_snapshot)
    values(sale_uuid,org,product_row.id,product_row.name,product_row.sku,qty,product_row.sale_price,0,line_total,product_row.cost_price);
    select * into stock_row from public.inventory
      where organization_id=org and business_unit_id=p_business_unit_id and product_id=product_row.id for update;
    update public.inventory set quantity=stock_row.quantity-qty,updated_at=now() where id=stock_row.id;
    insert into public.inventory_movements(organization_id,business_unit_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reference_id,reason,created_by)
    values(org,p_business_unit_id,product_row.id,'SALE',-qty,stock_row.quantity,stock_row.quantity-qty,'SALE',sale_uuid,'Venda concluída',actor);
  end loop;

  for payment in select * from jsonb_array_elements(p_payments) loop
    insert into public.payments(organization_id,sale_id,method,amount,status,paid_at,reference)
    values(org,sale_uuid,(payment->>'method')::public.payment_method,(payment->>'amount')::numeric,'PAID',now(),nullif(trim(payment->>'reference'),''))
    returning id into payment_uuid;
    if payment->>'method'='CASH' then
      insert into public.cash_movements(organization_id,business_unit_id,cash_session_id,type,amount,description,payment_id,reference_type,reference_id,created_by)
      values(org,p_business_unit_id,p_cash_session_id,'SALE',(payment->>'amount')::numeric,'Venda '||sale_number,payment_uuid,'SALE',sale_uuid,actor);
    end if;
  end loop;

  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data)
  values(org,actor,'SALE_CREATE','sales',sale_uuid,jsonb_build_object(
    'business_unit_id',p_business_unit_id,'subtotal',subtotal_value,'discount',p_discount,'total',total_value,
    'cash_session_id',p_cash_session_id
  ));
  return sale_uuid;
end $$;

revoke all on function public.complete_sale(uuid,uuid,jsonb,jsonb,numeric,text,uuid) from public;
grant execute on function public.complete_sale(uuid,uuid,jsonb,jsonb,numeric,text,uuid) to authenticated;

drop function if exists public.cancel_sale(uuid,text);

create function public.cancel_sale(p_sale_id uuid,p_reason text,p_cash_session_id uuid default null)
returns void language plpgsql security definer set search_path='' as $$
declare
  org uuid; actor uuid; sale_row public.sales; line public.sale_items; stock_row public.inventory;
  cash_session_row public.cash_sessions; cash_total numeric(14,2);
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('sale.cancel') then raise exception 'Acesso negado'; end if;
  select * into sale_row from public.sales where id=p_sale_id and organization_id=org for update;
  if not found then raise exception 'Venda não encontrada'; end if;
  if sale_row.status<>'COMPLETED' then raise exception 'Somente vendas concluídas podem ser canceladas'; end if;
  if nullif(trim(p_reason),'') is null then raise exception 'Informe o motivo'; end if;

  select coalesce(sum(amount),0) into cash_total from public.payments
    where sale_id=p_sale_id and method='CASH' and status='PAID';
  if cash_total>0 then
    if p_cash_session_id is null then raise exception 'Abra o caixa para registrar o estorno em dinheiro'; end if;
    select * into cash_session_row from public.cash_sessions
      where id=p_cash_session_id and organization_id=org and business_unit_id=sale_row.business_unit_id and status='OPEN' for update;
    if not found then raise exception 'Sessão de caixa aberta não encontrada para esta unidade'; end if;
  end if;

  for line in select * from public.sale_items where sale_id=p_sale_id loop
    select * into stock_row from public.inventory
      where organization_id=org and business_unit_id=sale_row.business_unit_id and product_id=line.product_id for update;
    if not found then
      insert into public.inventory(organization_id,business_unit_id,product_id,quantity)
      values(org,sale_row.business_unit_id,line.product_id,line.quantity) returning * into stock_row;
      insert into public.inventory_movements(organization_id,business_unit_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reference_id,reason,created_by)
      values(org,sale_row.business_unit_id,line.product_id,'CANCELLATION',line.quantity,0,line.quantity,'SALE',p_sale_id,trim(p_reason),actor);
    else
      update public.inventory set quantity=stock_row.quantity+line.quantity,updated_at=now() where id=stock_row.id;
      insert into public.inventory_movements(organization_id,business_unit_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reference_id,reason,created_by)
      values(org,sale_row.business_unit_id,line.product_id,'CANCELLATION',line.quantity,stock_row.quantity,stock_row.quantity+line.quantity,'SALE',p_sale_id,trim(p_reason),actor);
    end if;
  end loop;

  if cash_total>0 then
    insert into public.cash_movements(organization_id,business_unit_id,cash_session_id,type,amount,description,reference_type,reference_id,created_by)
    values(org,sale_row.business_unit_id,p_cash_session_id,'REFUND',-cash_total,'Estorno da venda '||sale_row.number,'SALE',p_sale_id,actor);
  end if;
  update public.sales set status='CANCELLED',cancelled_at=now(),cancelled_by=actor,cancellation_reason=trim(p_reason),updated_at=now() where id=p_sale_id;
  update public.payments set status='CANCELLED' where sale_id=p_sale_id;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,old_data,new_data)
  values(org,actor,'SALE_CANCEL','sales',p_sale_id,to_jsonb(sale_row),jsonb_build_object(
    'status','CANCELLED','reason',trim(p_reason),'cash_refund',cash_total,'cash_session_id',p_cash_session_id
  ));
end $$;

revoke all on function public.cancel_sale(uuid,text,uuid) from public;
grant execute on function public.cancel_sale(uuid,text,uuid) to authenticated;
