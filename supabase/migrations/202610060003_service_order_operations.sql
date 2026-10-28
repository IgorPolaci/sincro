alter table public.service_order_services
  add column removed_at timestamptz,
  add column removed_by uuid references public.profiles(id),
  add column removal_reason text;
alter table public.service_order_parts
  add column removed_at timestamptz,
  add column removed_by uuid references public.profiles(id),
  add column removal_reason text;

create or replace function public.recalculate_service_order_totals(p_service_order_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare services_value numeric(14,2); parts_value numeric(14,2); order_row public.service_orders;
begin
  select * into order_row from public.service_orders where id=p_service_order_id for update;
  if not found then raise exception 'Ordem de serviço não encontrada'; end if;
  select coalesce(sum(total),0) into services_value from public.service_order_services where service_order_id=p_service_order_id and removed_at is null;
  select coalesce(sum(total),0) into parts_value from public.service_order_parts where service_order_id=p_service_order_id and removed_at is null;
  if order_row.discount>services_value+parts_value then raise exception 'Desconto maior que o subtotal'; end if;
  if order_row.advance_amount>services_value+parts_value-order_row.discount then raise exception 'O total não pode ficar abaixo do adiantamento'; end if;
  update public.service_orders set service_total=services_value,parts_total=parts_value,
    total=services_value+parts_value-discount,updated_by=public.current_profile_id(),updated_at=now()
  where id=p_service_order_id;
end $$;
revoke all on function public.recalculate_service_order_totals(uuid) from public;

create or replace function public.add_service_order_service(
  p_service_order_id uuid,p_description text,p_quantity numeric,p_unit_price numeric,
  p_discount numeric default 0,p_warranty_days int default 90,p_service_id uuid default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; order_row public.service_orders; status_code text; item_id uuid; line_total numeric(14,2);
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('service_order.update') then raise exception 'Acesso negado'; end if;
  select * into order_row from public.service_orders where id=p_service_order_id and organization_id=org for update;
  if not found then raise exception 'Ordem de serviço não encontrada'; end if;
  select code into status_code from public.service_order_statuses where id=order_row.status_id;
  if status_code in ('FATURADO','FECHADO','CANCELADO','ESTORNADO') then raise exception 'Esta O.S. não permite alterações de itens'; end if;
  if nullif(trim(p_description),'') is null or p_quantity<=0 or p_unit_price<0 or p_discount<0 or p_warranty_days<0 then raise exception 'Dados do serviço inválidos'; end if;
  line_total:=round(p_quantity*p_unit_price-p_discount,2);
  if line_total<0 then raise exception 'Desconto maior que o valor do serviço'; end if;
  if p_service_id is not null and not exists(select 1 from public.service_catalog where id=p_service_id and organization_id=org and deleted_at is null) then raise exception 'Serviço não encontrado'; end if;
  insert into public.service_order_services(organization_id,business_unit_id,service_order_id,service_id,description,quantity,unit_price,discount,total,warranty_days)
  values(org,order_row.business_unit_id,order_row.id,p_service_id,trim(p_description),p_quantity,p_unit_price,p_discount,line_total,p_warranty_days)
  returning id into item_id;
  perform public.recalculate_service_order_totals(order_row.id);
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data)
  values(org,actor,'SERVICE_ORDER_SERVICE_ADD','service_order_services',item_id,jsonb_build_object('service_order_id',order_row.id,'total',line_total));
  return item_id;
end $$;

create or replace function public.add_service_order_part(
  p_service_order_id uuid,p_product_id uuid,p_quantity numeric,p_unit_price numeric default null,p_discount numeric default 0
) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; order_row public.service_orders; status_code text; product_row public.products; stock numeric(14,3); item_id uuid; price numeric(14,2); line_total numeric(14,2);
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('service_order.update') then raise exception 'Acesso negado'; end if;
  select * into order_row from public.service_orders where id=p_service_order_id and organization_id=org for update;
  if not found then raise exception 'Ordem de serviço não encontrada'; end if;
  select code into status_code from public.service_order_statuses where id=order_row.status_id;
  if status_code in ('FATURADO','FECHADO','CANCELADO','ESTORNADO') then raise exception 'Esta O.S. não permite alterações de itens'; end if;
  if p_quantity<=0 or coalesce(p_unit_price,0)<0 or p_discount<0 then raise exception 'Dados da peça inválidos'; end if;
  select * into product_row from public.products where id=p_product_id and organization_id=org and deleted_at is null and active;
  if not found then raise exception 'Produto não encontrado'; end if;
  select quantity into stock from public.inventory where organization_id=org and business_unit_id=order_row.business_unit_id and product_id=product_row.id;
  if coalesce(stock,0)<p_quantity then raise exception 'Estoque insuficiente para esta peça'; end if;
  price:=coalesce(p_unit_price,product_row.sale_price);
  line_total:=round(p_quantity*price-p_discount,2);
  if line_total<0 then raise exception 'Desconto maior que o valor da peça'; end if;
  insert into public.service_order_parts(organization_id,business_unit_id,service_order_id,product_id,product_name,sku,quantity,unit_price,cost_price_snapshot,discount,total)
  values(org,order_row.business_unit_id,order_row.id,product_row.id,product_row.name,product_row.sku,p_quantity,price,product_row.cost_price,p_discount,line_total)
  returning id into item_id;
  perform public.recalculate_service_order_totals(order_row.id);
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data)
  values(org,actor,'SERVICE_ORDER_PART_ADD','service_order_parts',item_id,jsonb_build_object('service_order_id',order_row.id,'product_id',product_row.id,'quantity',p_quantity,'total',line_total));
  return item_id;
end $$;

create or replace function public.remove_service_order_item(p_service_order_id uuid,p_item_type text,p_item_id uuid,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; order_row public.service_orders; status_code text; affected int;
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('service_order.update') then raise exception 'Acesso negado'; end if;
  if nullif(trim(p_reason),'') is null then raise exception 'Informe o motivo da remoção'; end if;
  select * into order_row from public.service_orders where id=p_service_order_id and organization_id=org for update;
  if not found then raise exception 'Ordem de serviço não encontrada'; end if;
  select code into status_code from public.service_order_statuses where id=order_row.status_id;
  if status_code in ('FATURADO','FECHADO','CANCELADO','ESTORNADO') then raise exception 'Esta O.S. não permite alterações de itens'; end if;
  if p_item_type='SERVICE' then
    update public.service_order_services set removed_at=now(),removed_by=actor,removal_reason=trim(p_reason)
    where id=p_item_id and service_order_id=order_row.id and removed_at is null;
  elsif p_item_type='PART' then
    update public.service_order_parts set removed_at=now(),removed_by=actor,removal_reason=trim(p_reason)
    where id=p_item_id and service_order_id=order_row.id and removed_at is null and inventory_applied=false;
  else raise exception 'Tipo de item inválido'; end if;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Item não encontrado ou não removível'; end if;
  perform public.recalculate_service_order_totals(order_row.id);
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data)
  values(org,actor,'SERVICE_ORDER_ITEM_REMOVE',case when p_item_type='SERVICE' then 'service_order_services' else 'service_order_parts' end,p_item_id,
    jsonb_build_object('service_order_id',order_row.id,'reason',trim(p_reason)));
end $$;

create or replace function public.set_service_order_status(p_service_order_id uuid,p_status_code text,p_note text default null)
returns void language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; order_row public.service_orders; current_status public.service_order_statuses; next_status public.service_order_statuses; part public.service_order_parts; stock_row public.inventory;
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('service_order.update') then raise exception 'Acesso negado'; end if;
  select * into order_row from public.service_orders where id=p_service_order_id and organization_id=org for update;
  if not found then raise exception 'Ordem de serviço não encontrada'; end if;
  select * into current_status from public.service_order_statuses where id=order_row.status_id;
  select * into next_status from public.service_order_statuses where organization_id=org and business_unit_id=order_row.business_unit_id and code=p_status_code and active;
  if not found then raise exception 'Status inválido'; end if;
  if next_status.code='CANCELADO' and not public.has_permission('service_order.cancel') then raise exception 'Acesso negado'; end if;
  if next_status.code in ('CANCELADO','ESTORNADO') and nullif(trim(p_note),'') is null then raise exception 'Informe o motivo do cancelamento ou estorno'; end if;
  if current_status.is_final then raise exception 'Uma O.S. finalizada não pode mudar de status'; end if;
  if current_status.code='FATURADO' and next_status.code not in ('FECHADO','CANCELADO','ESTORNADO') then raise exception 'Uma O.S. faturada só pode ser fechada, cancelada ou estornada'; end if;
  if order_row.status_id=next_status.id then return; end if;
  if next_status.code='FATURADO' then
    for part in select * from public.service_order_parts where service_order_id=order_row.id and removed_at is null and inventory_applied=false for update loop
      select * into stock_row from public.inventory where organization_id=org and business_unit_id=order_row.business_unit_id and product_id=part.product_id for update;
      if not found or stock_row.quantity<part.quantity then raise exception 'Estoque insuficiente para %',part.product_name; end if;
      update public.inventory set quantity=stock_row.quantity-part.quantity,updated_at=now() where id=stock_row.id;
      insert into public.inventory_movements(organization_id,business_unit_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reference_id,reason,created_by)
      values(org,order_row.business_unit_id,part.product_id,'EXIT',-part.quantity,stock_row.quantity,stock_row.quantity-part.quantity,'SERVICE_ORDER',order_row.id,'Peça aplicada na '||order_row.number,actor);
      update public.service_order_parts set inventory_applied=true where id=part.id;
    end loop;
  elsif next_status.code in ('CANCELADO','ESTORNADO') then
    for part in select * from public.service_order_parts where service_order_id=order_row.id and removed_at is null and inventory_applied=true for update loop
      select * into stock_row from public.inventory where organization_id=org and business_unit_id=order_row.business_unit_id and product_id=part.product_id for update;
      update public.inventory set quantity=stock_row.quantity+part.quantity,updated_at=now() where id=stock_row.id;
      insert into public.inventory_movements(organization_id,business_unit_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reference_id,reason,created_by)
      values(org,order_row.business_unit_id,part.product_id,'RETURN',part.quantity,stock_row.quantity,stock_row.quantity+part.quantity,'SERVICE_ORDER',order_row.id,'Reversão da '||order_row.number||': '||trim(p_note),actor);
      update public.service_order_parts set inventory_applied=false where id=part.id;
    end loop;
  end if;
  update public.service_orders set status_id=next_status.id,updated_by=actor,
    cancelled_at=case when next_status.code in ('CANCELADO','ESTORNADO') then now() else cancelled_at end,
    cancelled_by=case when next_status.code in ('CANCELADO','ESTORNADO') then actor else cancelled_by end,
    cancellation_reason=case when next_status.code in ('CANCELADO','ESTORNADO') then trim(p_note) else cancellation_reason end
  where id=order_row.id;
  insert into public.service_order_status_history(organization_id,business_unit_id,service_order_id,from_status_id,to_status_id,note,changed_by)
  values(org,order_row.business_unit_id,order_row.id,order_row.status_id,next_status.id,nullif(trim(p_note),''),actor);
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,old_data,new_data)
  values(org,actor,'SERVICE_ORDER_STATUS','service_orders',order_row.id,jsonb_build_object('status',current_status.code),jsonb_build_object('status',next_status.code,'note',nullif(trim(p_note),'')));
end $$;

create or replace function public.add_service_order_checklist_item(p_service_order_id uuid,p_label text)
returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; order_row public.service_orders; item_id uuid;
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('service_order.update') then raise exception 'Acesso negado'; end if;
  if nullif(trim(p_label),'') is null then raise exception 'Informe o item'; end if;
  select * into order_row from public.service_orders where id=p_service_order_id and organization_id=org;
  if not found then raise exception 'Ordem de serviço não encontrada'; end if;
  insert into public.service_order_checklist(service_order_id,organization_id,business_unit_id,label)
  values(order_row.id,org,order_row.business_unit_id,trim(p_label)) returning id into item_id;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data)
  values(org,actor,'SERVICE_ORDER_CHECKLIST_ADD','service_order_checklist',item_id,jsonb_build_object('service_order_id',order_row.id,'label',trim(p_label)));
  return item_id;
end $$;

create or replace function public.set_service_order_checklist_item(p_item_id uuid,p_checked boolean,p_notes text default null)
returns void language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; item_row public.service_order_checklist;
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('service_order.update') then raise exception 'Acesso negado'; end if;
  select * into item_row from public.service_order_checklist where id=p_item_id and organization_id=org for update;
  if not found then raise exception 'Item não encontrado'; end if;
  update public.service_order_checklist set checked=p_checked,notes=nullif(trim(p_notes),''),
    checked_by=case when p_checked then actor else null end,checked_at=case when p_checked then now() else null end where id=p_item_id;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data)
  values(org,actor,'SERVICE_ORDER_CHECKLIST_UPDATE','service_order_checklist',p_item_id,jsonb_build_object('checked',p_checked,'notes',nullif(trim(p_notes),'')));
end $$;

create or replace function public.register_service_order_photo(p_service_order_id uuid,p_storage_path text,p_caption text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; order_row public.service_orders; photo_id uuid; expected_prefix text;
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('service_order.update') then raise exception 'Acesso negado'; end if;
  select * into order_row from public.service_orders where id=p_service_order_id and organization_id=org;
  if not found then raise exception 'Ordem de serviço não encontrada'; end if;
  expected_prefix:=org::text||'/'||order_row.business_unit_id::text||'/'||order_row.id::text||'/';
  if p_storage_path not like expected_prefix||'%' then raise exception 'Caminho de arquivo inválido'; end if;
  insert into public.service_order_photos(organization_id,business_unit_id,service_order_id,storage_path,caption,created_by)
  values(org,order_row.business_unit_id,order_row.id,p_storage_path,nullif(trim(p_caption),''),actor) returning id into photo_id;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data)
  values(org,actor,'SERVICE_ORDER_PHOTO_ADD','service_order_photos',photo_id,jsonb_build_object('service_order_id',order_row.id,'storage_path',p_storage_path));
  return photo_id;
end $$;

revoke all on function public.add_service_order_service(uuid,text,numeric,numeric,numeric,int,uuid) from public;
revoke all on function public.add_service_order_part(uuid,uuid,numeric,numeric,numeric) from public;
revoke all on function public.remove_service_order_item(uuid,text,uuid,text) from public;
revoke all on function public.add_service_order_checklist_item(uuid,text) from public;
revoke all on function public.set_service_order_checklist_item(uuid,boolean,text) from public;
revoke all on function public.register_service_order_photo(uuid,text,text) from public;
grant execute on function public.add_service_order_service(uuid,text,numeric,numeric,numeric,int,uuid) to authenticated;
grant execute on function public.add_service_order_part(uuid,uuid,numeric,numeric,numeric) to authenticated;
grant execute on function public.remove_service_order_item(uuid,text,uuid,text) to authenticated;
grant execute on function public.add_service_order_checklist_item(uuid,text) to authenticated;
grant execute on function public.set_service_order_checklist_item(uuid,boolean,text) to authenticated;
grant execute on function public.register_service_order_photo(uuid,text,text) to authenticated;

create policy service_order_photos_storage_delete on storage.objects for delete to authenticated
using(bucket_id='service-order-photos' and (storage.foldername(name))[1]=public.current_organization_id()::text and public.has_permission('service_order.update'));
