-- Segurança operacional: elimina o uso de chave service-role no aplicativo.
-- Rollback: revoke execute on public.record_auth_event(text,text,inet,text) from anon, authenticated;

create or replace function public.record_auth_event(
  p_email text,
  p_action text,
  p_ip_address inet default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_profile public.profiles;
begin
  if p_action not in ('LOGIN', 'LOGIN_FAILED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_CHANGED') then
    raise exception 'Ação de auditoria inválida';
  end if;

  select * into target_profile
  from public.profiles
  where lower(email) = lower(trim(p_email))
  limit 1;

  if target_profile.id is null then
    return;
  end if;

  insert into public.audit_logs(organization_id, user_id, action, entity, ip_address, user_agent, new_data)
  values (
    target_profile.organization_id,
    target_profile.id,
    p_action,
    'auth',
    p_ip_address,
    left(coalesce(p_user_agent, ''), 512)::text,
    jsonb_build_object('email', lower(trim(p_email)))
  );
end;
$$;

revoke all on function public.record_auth_event(text,text,inet,text) from public;
grant execute on function public.record_auth_event(text,text,inet,text) to anon, authenticated;

-- A função de rate limit é pública por necessidade de rotas anônimas. Não deve
-- expor a tabela nem permitir operações diretas sobre ela.
revoke all on table public.rate_limit_buckets from anon, authenticated;
