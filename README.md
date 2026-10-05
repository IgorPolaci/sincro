# Sincro

Plataforma full-stack de gestão comercial, estoque e operações, construída em Next.js 16.3.8, React, TypeScript estrito e Supabase.

## Executar

Requisitos: Node.js 24 LTS, npm, Supabase CLI e Docker (para Supabase local).

```bash
npm install
cp .env.example .env.local
supabase start
supabase db reset
npm run dev
```

Crie um usuário no Supabase Auth e execute `bootstrap_organization` em ambiente administrativo para vincular o primeiro administrador. A função não é exposta aos papéis públicos.

## Verificação

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## Fases

O plano e os critérios de aceite estão em [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md). Migrations são separadas por fundação, catálogo, estoque, vendas, financeiro e operações. Nunca implemente fases posteriores ignorando as invariantes de segurança das anteriores.

## Estrutura

- `src/app`: rotas, layouts e páginas App Router
- `src/features`: regras, ações, formulários e testes por domínio
- `src/components`: componentes globais e tabelas
- `src/lib`: Supabase, validação e utilitários
- `supabase/migrations`: schema, RLS e funções transacionais
- `docs`: arquitetura, segurança, banco, deploy, migração e backup

## Estado desta entrega

- Base técnica, CI, autenticação SSR, layout e dashboard
- Modelo de dados completo do MVP com isolamento por organização
- CRUD inicial de clientes e produtos; estoque transacional
- Estruturas de orçamento, venda, cancelamento, pagamento e financeiro
- Auditoria, lixeira, importação, backup, relatórios e rotas administrativas
- Testes unitários das regras críticas iniciais e suíte E2E configurada

Os jobs externos de backup, o processador assíncrono de importação, credenciais reais, deploy e o teste de restauração dependem da infraestrutura do ambiente e devem ser concluídos nos respectivos marcos.
