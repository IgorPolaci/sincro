create or replace function public.transfer_inventory(
  p_from_business_unit_id uuid,p_to_business_unit_id uuid,p_product_id uuid,p_quantity numeric,p_reason text
) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; from_row public.inventory; to_row public.inventory; transfer_id uuid:=gen_random_uuid();
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('inventory.adjust') then raise exception 'Acesso negado'; end if;
  if p_from_business_unit_id=p_to_business_unit_id then raise exception 'As unidades devem ser diferentes'; end if;
  if p_quantity<=0 or nullif(trim(p_reason),'') is null then raise exception 'Dados da transferência inválidos'; end if;
  if not public.business_unit_belongs_to_current_org(p_from_business_unit_id) or not public.business_unit_belongs_to_current_org(p_to_business_unit_id) then raise exception 'Unidade operacional inválida'; end if;
  if not exists(select 1 from public.products where id=p_product_id and organization_id=org and active and deleted_at is null) then raise exception 'Produto não encontrado'; end if;
  insert into public.inventory(organization_id,business_unit_id,product_id,quantity) values(org,p_from_business_unit_id,p_product_id,0) on conflict do nothing;
  insert into public.inventory(organization_id,business_unit_id,product_id,quantity) values(org,p_to_business_unit_id,p_product_id,0) on conflict do nothing;
  -- Stable lock order prevents opposing transfers from deadlocking.
  perform 1 from public.inventory where organization_id=org and product_id=p_product_id and business_unit_id in (p_from_business_unit_id,p_to_business_unit_id) order by business_unit_id for update;
  select * into from_row from public.inventory where organization_id=org and business_unit_id=p_from_business_unit_id and product_id=p_product_id;
  select * into to_row from public.inventory where organization_id=org and business_unit_id=p_to_business_unit_id and product_id=p_product_id;
  if from_row.quantity<p_quantity then raise exception 'Estoque insuficiente na unidade de origem'; end if;
  update public.inventory set quantity=from_row.quantity-p_quantity,updated_at=now() where id=from_row.id;
  update public.inventory set quantity=to_row.quantity+p_quantity,updated_at=now() where id=to_row.id;
  insert into public.inventory_movements(organization_id,business_unit_id,product_id,type,quantity,quantity_before,quantity_after,reference_type,reference_id,reason,created_by) values
    (org,p_from_business_unit_id,p_product_id,'EXIT',-p_quantity,from_row.quantity,from_row.quantity-p_quantity,'INVENTORY_TRANSFER',transfer_id,'Transferência: '||trim(p_reason),actor),
    (org,p_to_business_unit_id,p_product_id,'ENTRY',p_quantity,to_row.quantity,to_row.quantity+p_quantity,'INVENTORY_TRANSFER',transfer_id,'Transferência: '||trim(p_reason),actor);
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data)
  values(org,actor,'INVENTORY_TRANSFER','inventory_movements',transfer_id,jsonb_build_object('from_business_unit_id',p_from_business_unit_id,'to_business_unit_id',p_to_business_unit_id,'product_id',p_product_id,'quantity',p_quantity,'reason',trim(p_reason)));
  return transfer_id;
end $$;

create or replace function public.record_report_export(p_report text,p_filters jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid; audit_id uuid;
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('report.view') then raise exception 'Acesso negado'; end if;
  if nullif(trim(p_report),'') is null or length(p_report)>100 then raise exception 'Relatório inválido'; end if;
  insert into public.audit_logs(organization_id,user_id,action,entity,new_data)
  values(org,actor,'REPORT_EXPORT','reports',jsonb_build_object('report',trim(p_report),'filters',coalesce(p_filters,'{}'::jsonb))) returning id into audit_id;
  return audit_id;
end $$;

revoke all on function public.transfer_inventory(uuid,uuid,uuid,numeric,text) from public;
revoke all on function public.record_report_export(text,jsonb) from public;
grant execute on function public.transfer_inventory(uuid,uuid,uuid,numeric,text) to authenticated;
grant execute on function public.record_report_export(text,jsonb) to authenticated;
