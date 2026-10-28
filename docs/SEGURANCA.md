# Segurança operacional

## Princípios aplicados

- Todas as tabelas operacionais usam RLS e as operações do painel usam o cliente autenticado do Supabase.
- A organização e a unidade operacional são derivadas da sessão/RPC; nunca são aceitas como autoridade vinda do navegador.
- Venda, cancelamento, faturamento e estorno são funções transacionais no banco.
- O aplicativo web não usa `SUPABASE_SERVICE_ROLE_KEY`.

## Funções `SECURITY DEFINER`

As funções existentes no schema `public` fixam `search_path=''`, revogam acesso de `public` e liberam somente o papel necessário.

| Função | Papel autorizado | Finalidade |
| --- | --- | --- |
| `record_auth_event` | `anon`, `authenticated` | Registra eventos de login sem retornar dados do perfil. Aceita apenas ações pré-definidas. |
| `consume_rate_limit` | `anon`, `authenticated` | Consome um contador atômico de antiabuso. |
| `health_check` | `anon`, `authenticated` | Verifica disponibilidade sem expor dados. |

Nenhuma dessas funções concede leitura direta às tabelas de auditoria, perfis ou rate limit.

## Segredos e produção

- Configure `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` com valor estável e aleatório em todas as instâncias.
- Configure `APP_URL` para o domínio HTTPS definitivo e cadastre as URLs de redirecionamento no Supabase Auth.
- Mantenha chaves privilegiadas somente em ferramentas administrativas isoladas, nunca no Next.js nem no navegador.
- Rode `npx supabase db lint --linked --level warning`, `supabase test db`, `npm run verify` e `npm run test:e2e` antes de cada deploy.
