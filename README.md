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
- Modelo multiunidade com Assistência Técnica e Loja/Delivery na mesma organização
- Estoque e caixa independentes por segmento, com movimentações auditadas
- CRUD inicial de clientes e produtos; estoque transacional
- Ordem de serviço com entrada, status, histórico, serviços, peças, check-list e fotos privadas
- Faturamento e estorno de O.S. com pagamentos, caixa, financeiro e peças na mesma transação
- Documentos auditados de O.S. em A4, térmica 80 mm e térmica 58 mm
- PDV com pagamentos combinados, venda/cancelamento transacionais e conversão de orçamentos
- Gerenciamento de e-commerce com publicação, conteúdo, preço online, promoções, imagens, identidade visual, destaques, SEO e complementos
- Catálogo público responsivo com busca, filtros, carrinho por variação, checkout, reserva de estoque, Kanban de pedidos, áreas/taxas, cupons e fidelidade
- Transferência auditada entre estoques, indicadores e exportação CSV auditada
- Auditoria, lixeira, importação, backup e rotas administrativas
- Testes unitários das regras críticas iniciais e suíte E2E configurada

Pix com QR dinâmico/webhook, integração automática com WhatsApp, mapas, impressão silenciosa via QZ Tray, jobs externos de backup, processador assíncrono de importação, deploy e teste de restauração dependem de provedores, credenciais ou infraestrutura e permanecem nos próximos marcos.
