# Arquitetura

Aplicação modular full-stack em Next.js App Router. Server Components fazem leitura; Server Actions validam com Zod e chamam serviços de domínio; o PostgreSQL aplica a última barreira por RLS. Operações críticas são funções SQL transacionais.

```text
Browser → Next.js (RSC / Actions / Handlers) → serviços de domínio → Supabase
                                                        ├ PostgreSQL + RLS
                                                        ├ Auth
                                                        └ Storage
```

Cada feature separa schemas, queries, actions, services, components e types. O frontend nunca fornece a organização considerada confiável.
