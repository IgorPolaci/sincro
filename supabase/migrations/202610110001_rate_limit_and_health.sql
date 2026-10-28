create table public.rate_limit_buckets (
  key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null default 0 check(request_count>=0),
  updated_at timestamptz not null default now()
);
alter table public.rate_limit_buckets enable row level security;

create or replace function public.consume_rate_limit(p_key text,p_limit integer,p_window_seconds integer)
returns table(allowed boolean,retry_after integer)
language plpgsql security definer set search_path='' as $$
declare now_at timestamptz:=now(); bucket public.rate_limit_buckets;
begin
  if length(trim(p_key))<8 or p_limit<1 or p_limit>1000 or p_window_seconds<1 or p_window_seconds>86400 then
    raise exception 'Parâmetros de limite inválidos';
  end if;
  insert into public.rate_limit_buckets(key,window_started_at,request_count)
  values(trim(p_key),now_at,1)
  on conflict(key) do update set
    window_started_at=case when public.rate_limit_buckets.window_started_at+make_interval(secs=>p_window_seconds)<=now_at then now_at else public.rate_limit_buckets.window_started_at end,
    request_count=case when public.rate_limit_buckets.window_started_at+make_interval(secs=>p_window_seconds)<=now_at then 1 else public.rate_limit_buckets.request_count+1 end,
    updated_at=now_at
  returning * into bucket;
  allowed:=bucket.request_count<=p_limit;
  retry_after:=greatest(1,ceil(extract(epoch from (bucket.window_started_at+make_interval(secs=>p_window_seconds)-now_at)))::integer);
  return next;
end $$;

create or replace function public.rate_limit_cleanup()
returns integer language plpgsql security definer set search_path='' as $$
declare removed integer;
begin
  delete from public.rate_limit_buckets where updated_at<now()-interval '2 days';
  get diagnostics removed=row_count;
  return removed;
end $$;

create or replace function public.health_check()
returns boolean language sql stable security definer set search_path='' as $$ select true $$;

revoke all on function public.consume_rate_limit(text,integer,integer) from public;
revoke all on function public.rate_limit_cleanup() from public;
revoke all on function public.health_check() from public;
grant execute on function public.consume_rate_limit(text,integer,integer) to anon,authenticated;
grant execute on function public.health_check() to anon,authenticated;
