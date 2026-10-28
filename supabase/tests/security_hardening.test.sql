begin;
select plan(5);

select has_function('public', 'record_auth_event', array['text', 'text', 'inet', 'text'], 'a RPC de auditoria de autenticação existe');
select function_returns('public', 'record_auth_event', array['text', 'text', 'inet', 'text'], 'void', 'a RPC não retorna dados de perfis');
select isnt((select proacl is null from pg_proc where oid = 'public.record_auth_event(text,text,inet,text)'::regprocedure), true, 'a RPC possui permissões explícitas');
select ok(
  (select prosecdef from pg_proc where oid = 'public.record_auth_event(text,text,inet,text)'::regprocedure),
  'a RPC usa SECURITY DEFINER controlado'
);
select ok(
  (select proconfig @> array['search_path='] from pg_proc where oid = 'public.record_auth_event(text,text,inet,text)'::regprocedure),
  'a RPC fixa search_path vazio'
);

select * from finish();
rollback;
