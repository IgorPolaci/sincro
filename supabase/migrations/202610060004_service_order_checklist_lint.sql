create or replace function public.set_service_order_checklist_item(p_item_id uuid,p_checked boolean,p_notes text default null)
returns void language plpgsql security definer set search_path='' as $$
declare org uuid; actor uuid;
begin
  org:=public.current_organization_id(); actor:=public.current_profile_id();
  if org is null or actor is null or not public.has_permission('service_order.update') then raise exception 'Acesso negado'; end if;
  perform 1 from public.service_order_checklist where id=p_item_id and organization_id=org for update;
  if not found then raise exception 'Item não encontrado'; end if;
  update public.service_order_checklist set checked=p_checked,notes=nullif(trim(p_notes),''),
    checked_by=case when p_checked then actor else null end,checked_at=case when p_checked then now() else null end where id=p_item_id;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,new_data)
  values(org,actor,'SERVICE_ORDER_CHECKLIST_UPDATE','service_order_checklist',p_item_id,jsonb_build_object('checked',p_checked,'notes',nullif(trim(p_notes),'')));
end $$;
