create or replace function public.create_quote(
  p_business_unit_id uuid,p_customer_id uuid,p_items jsonb,p_discount numeric default 0,
  p_valid_until date default null,p_notes text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; quote_uuid uuid; item jsonb; product_row public.products; qty numeric(14,3); subtotal_value numeric(14,2):=0; total_value numeric(14,2);
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('quote.create') then raise exception 'Acesso negado'; end if;
  if not public.business_unit_belongs_to_current_org(p_business_unit_id) then raise exception 'Unidade operacional inválida'; end if;
  if not exists(select 1 from public.customers where id=p_customer_id and organization_id=org and active and deleted_at is null) then raise exception 'Cliente não encontrado'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'O orçamento precisa de itens'; end if;
  if p_discount<0 then raise exception 'Desconto inválido'; end if;
  for item in select * from jsonb_array_elements(p_items) loop
    qty:=(item->>'quantity')::numeric;if qty<=0 then raise exception 'Quantidade inválida'; end if;
    select * into product_row from public.products where id=(item->>'product_id')::uuid and organization_id=org and active and deleted_at is null;
    if not found then raise exception 'Produto não encontrado'; end if;
    subtotal_value:=subtotal_value+round(product_row.sale_price*qty,2);
  end loop;
  total_value:=round(subtotal_value-p_discount,2);if total_value<0 then raise exception 'Desconto maior que o subtotal'; end if;
  insert into public.quotes(organization_id,business_unit_id,number,customer_id,status,subtotal,discount,total,valid_until,notes,created_by)
  values(org,p_business_unit_id,lpad(nextval('public.quote_number_seq')::text,8,'0'),p_customer_id,'DRAFT',subtotal_value,p_discount,total_value,p_valid_until,nullif(trim(p_notes),''),actor) returning id into quote_uuid;
  for item in select * from jsonb_array_elements(p_items) loop
    qty:=(item->>'quantity')::numeric;select * into product_row from public.products where id=(item->>'product_id')::uuid;
    insert into public.quote_items(quote_id,organization_id,product_id,description,quantity,unit_price,discount,total)
    values(quote_uuid,org,product_row.id,product_row.name,qty,product_row.sale_price,0,round(product_row.sale_price*qty,2));
  end loop;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data) values(org,actor,'QUOTE_CREATE','quotes',quote_uuid,jsonb_build_object('business_unit_id',p_business_unit_id,'total',total_value));
  return quote_uuid;
end $$;

create or replace function public.set_quote_status(p_quote_id uuid,p_status public.quote_status)
returns void language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; quote_row public.quotes; allowed boolean:=false;
begin
  org:=public.current_organization_id();actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('quote.update') then raise exception 'Acesso negado'; end if;
  select * into quote_row from public.quotes where id=p_quote_id and organization_id=org and deleted_at is null for update;
  if not found then raise exception 'Orçamento não encontrado'; end if;
  allowed:=case quote_row.status when 'DRAFT' then p_status in ('SENT','APPROVED','REJECTED','CANCELLED') when 'SENT' then p_status in ('APPROVED','REJECTED','EXPIRED','CANCELLED') else false end;
  if not allowed then raise exception 'Transição inválida'; end if;
  update public.quotes set status=p_status,updated_at=now() where id=p_quote_id;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,old_data,new_data) values(org,actor,'QUOTE_STATUS','quotes',p_quote_id,jsonb_build_object('status',quote_row.status),jsonb_build_object('status',p_status));
end $$;

create or replace function public.convert_quote_to_sale(p_quote_id uuid,p_payments jsonb,p_cash_session_id uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; quote_row public.quotes; items jsonb; sale_uuid uuid;
begin
  org:=public.current_organization_id();actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('sale.create') then raise exception 'Acesso negado'; end if;
  select * into quote_row from public.quotes where id=p_quote_id and organization_id=org and deleted_at is null for update;
  if not found then raise exception 'Orçamento não encontrado'; end if;
  if quote_row.status not in ('SENT','APPROVED') then raise exception 'Aprove ou envie o orçamento antes de converter'; end if;
  select jsonb_agg(jsonb_build_object('product_id',product_id,'quantity',quantity)) into items from public.quote_items where quote_id=p_quote_id;
  sale_uuid:=public.complete_sale(quote_row.business_unit_id,quote_row.customer_id,items,p_payments,quote_row.discount,'Convertida do orçamento '||quote_row.number,p_cash_session_id);
  update public.sales set quote_id=p_quote_id where id=sale_uuid;
  update public.quotes set status='CONVERTED',updated_at=now() where id=p_quote_id;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data) values(org,actor,'QUOTE_CONVERT','quotes',p_quote_id,jsonb_build_object('sale_id',sale_uuid));
  return sale_uuid;
end $$;

revoke all on function public.create_quote(uuid,uuid,jsonb,numeric,date,text) from public;
revoke all on function public.set_quote_status(uuid,public.quote_status) from public;
revoke all on function public.convert_quote_to_sale(uuid,jsonb,uuid) from public;
grant execute on function public.create_quote(uuid,uuid,jsonb,numeric,date,text) to authenticated;
grant execute on function public.set_quote_status(uuid,public.quote_status) to authenticated;
grant execute on function public.convert_quote_to_sale(uuid,jsonb,uuid) to authenticated;
