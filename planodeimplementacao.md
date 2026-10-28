# Prompt de implementação — Sincro

> **Como usar.** Salve este arquivo em `docs/PROMPT_IMPLEMENTACAO.md`. Dispare o agente com:
> **"Leia `AGENTS.md`, `docs/IMPLEMENTATION_PLAN.md` e `docs/PROMPT_IMPLEMENTACAO.md`. Execute a Fase 0 e pare para revisão."**
> Depois, uma fase por vez: **"Execute a Fase N."** Nunca execute duas fases na mesma sessão. Ao terminar cada fase, pare e entregue o relatório (Apêndice C).

## 1. Papel e objetivo

Você é engenheiro(a) full-stack sênior (Next.js, TypeScript estrito, PostgreSQL/Supabase). Vai completar o **Sincro**, uma plataforma única de gestão para um cliente que tem dois negócios: uma **assistência técnica de celulares** e uma **loja com e-commerce/delivery**. O repositório já tem uma base funcional (seção 4). Seu trabalho é **auditar, completar e endurecer** essa base, não reescrevê-la.

Princípio de trabalho: **confirme antes de construir.** Os itens marcados como "inferidos" no Apêndice B podem já existir. Verifique no código e no banco e só implemente o que de fato faltar.

## 2. Contexto de negócio

- O cliente tem dois negócios, modelados como duas **unidades de negócio** na mesma organização: **Assistência Técnica** (O.S., peças, serviços, orçamentos, PDV de balcão, caixa) e **Loja/Delivery** (catálogo online, pedidos, entrega, caixa). Estoque e caixa são independentes por segmento.
- Hoje ele opera em dois sistemas separados: o **OS System** (desktop Windows, assistência) e o **Cardápio Web** (SaaS, loja/delivery). O Apêndice A resume o que cada um faz. O Sincro deve cobrir essas funções em uma só plataforma web multiunidade, sem copiar as telas: mesma capacidade, UX web e mobile moderna, mantendo os atalhos de teclado do OS System no balcão.
- Usuários: dono/administrador, atendente, técnico, caixa/vendedor e entregador. Operam em balcão (desktop, leitor de código de barras, impressora térmica) e no celular/tablet.
- Ordem de prioridade: **correção de dinheiro e estoque > velocidade de balcão > acabamento visual.**
- As prioridades reais do cliente ainda não foram confirmadas (o áudio dos vídeos de referência não foi transcrito). Não reordene as fases por conta própria.

## 3. Stack e regras inegociáveis

**Stack:** TypeScript estrito, Next.js 16.3.8 (App Router, `proxy.ts`), React 19.2, Node.js 24 LTS, Supabase (PostgreSQL, Auth, Storage), Tailwind CSS 4, shadcn/ui, Zod 4, React Hook Form, TanStack Table, Vitest 3 + Testing Library, Playwright.

**Regras do `AGENTS.md` (valem acima de qualquer instrução deste prompt):**

1. Nunca contornar RLS nem expor chaves service-role/secret.
2. Nunca apagar fisicamente dados operacionais (arquivar, soft delete ou anonimizar).
3. Sempre escopar por organização; nunca confiar em `organization_id` vindo do navegador.
4. Nunca alterar estoque sem uma movimentação de estoque.
5. Vendas são transacionais; o cancelamento reverte o estoque corretamente.
6. Operações financeiras e exportações são auditáveis.
7. Toda mudança de banco é uma migration versionada.
8. Validar toda entrada externa com Zod.
9. Rodar lint, typecheck, testes e build antes de concluir (`npm run verify`).

**Regras adicionais deste prompt:**

10. **Este Next.js não é o que você conhece.** Antes de usar qualquer API (`params`, `cookies` e `headers` assíncronos, `proxy.ts`, Route Handlers, cache, Server Actions, CSP), leia o guia correspondente em `node_modules/next/dist/docs/`.
11. **Exceção controlada à regra 1.** Webhooks e jobs não têm sessão de usuário. Para eles, use **funções SQL `SECURITY DEFINER` mínimas** (`search_path` fixo, validação de entrada, `EXECUTE` revogado de `public` e concedido só ao papel de serviço), chamadas por **um único módulo `server-only`**. Nunca use o cliente service-role fora desse módulo. Documente cada função em `docs/SEGURANCA.md`.
12. **Dinheiro e tempo.** Sem `float`: centavos inteiros ou `numeric(14,2)`, com arredondamento definido e testado. Regras de "dia" (caixa, relatórios, garantia) usam o fuso `America/Sao_Paulo`; armazene `timestamptz`.
13. **Toda server action** segue a ordem: autentica → autoriza (permissão + unidade) → valida (Zod) → executa em transação (RPC) → audita → revalida cache. Erros previsíveis retornam estado tipado; nunca exponha mensagens de banco ao usuário.
14. **Integrações atrás de interfaces** (`PixProvider`, `MessagingProvider`, `Geocoder`, `PrintGateway`), com implementação `fake`/`static` para testes. Nunca chame provedores reais em testes ou no CI.
15. **Segredos** só em variáveis de ambiente do servidor; nunca em código, commits, logs ou documentação. Mantenha o `.env.example` sempre atualizado.
16. **Termos e legislação.** Respeite os termos de uso e a legislação aplicáveis a cada provedor (pagamento, mensageria, hospedagem). Integrações são **habilitadas por unidade de negócio** e desligáveis sem deploy. Não implemente nenhum mecanismo para ocultar ou mascarar a natureza dos produtos perante provedores.
17. **UI** em pt-BR, acessível (teclado, foco, `aria`), mobile-first nas telas de balcão e na loja pública. Dependência nova só com justificativa em `docs/DECISOES.md` (ADR curto).
18. Sem `any`, sem `@ts-ignore` e sem `eslint-disable` sem justificativa escrita.

## 4. Estado atual (não reimplementar)

Segundo o README e o inventário de arquivos de 07/10/2026 (39 páginas, 14 módulos de server actions, 9 schemas Zod):

- **Base:** auth SSR (`src/proxy.ts`, `lib/supabase/{client,server,proxy}.ts`), layout com sidebar e header, dashboard, seleção de negócio (`/selecionar-negocio`), multiunidade (`lib/business-units.ts`).
- **Cadastros:** clientes (`/clientes`, `/clientes/novo`, `/clientes/[id]`) e produtos (`/produtos`, `/produtos/novo`, `/produtos/[id]`).
- **Estoque:** `/estoque`, `/estoque/movimentacao`, `/estoque/transferencia`, com movimentações auditadas (`features/inventory/calculate.ts`).
- **O.S.:** lista, `/nova`, `/[id]` (status, histórico, serviços, peças, check-list, fotos privadas, documento, faturamento e estorno) e `/[id]/imprimir` (A4, 80 mm, 58 mm).
- **Orçamentos:** `/orcamentos`, `/novo`, `/[id]` (ações e conversão).
- **Vendas (PDV):** `/vendas`, `/nova`, `/[id]` (pagamentos combinados, cancelamento com reversão de estoque).
- **Financeiro:** `/financeiro` (contas a pagar) e `/financeiro/fluxo-de-caixa` (caixa, sangria, suprimento; `features/cash/calculate.ts`).
- **E-commerce (admin):** `/ecommerce`, `/ecommerce/produtos`, `/ecommerce/produtos/[id]`.
- **Loja pública e pedidos:** `/loja/[slug]`, `/pedido/[code]`, checkout com reserva de estoque, cupons e fidelidade, Kanban em `/pedidos`, áreas e taxas em `/delivery/configuracoes`.
- **Administração:** `/configuracoes/lixeira` (restaurar), `/configuracoes/importacao` (tela estática), `/configuracoes/backups` (somente lista), `/relatorios` e `GET /api/relatorios/vendas.csv`, `services/auth-audit.ts`.
- **Testes:** 7 arquivos unitários (cálculos de caixa, estoque e vendas; validações de cliente/produto, delivery, e-commerce e O.S.) e 1 E2E (`e2e/login.spec.ts`).
- Existem duas rotas genéricas, `(dashboard)/[section]` e `(dashboard)/[section]/[subsection]`, que renderizam `module-placeholder`.

Pendências **declaradas no README**: Pix com QR dinâmico e webhook, WhatsApp automático, mapas, impressão silenciosa (QZ Tray), jobs externos de backup, processador assíncrono de importação, deploy e teste de restauração.

## 5. Fase 0 — Auditoria obrigatória (não altera código)

**Objetivo:** confirmar o estado real do repositório e do banco antes de qualquer implementação.

**Passos:**

1. Leia `AGENTS.md`, `docs/*` e `README.md`. Rode `npm ci`, `npm run verify`, `supabase start` e `supabase db reset`. Registre o baseline: tempos, avisos e falhas.
2. **Inventário do banco** (`docs/AUDITORIA_BANCO.md`): tabelas e colunas sensíveis; RLS habilitado em **todas** as tabelas do schema público; policies por tabela; funções (`SECURITY DEFINER`? `search_path` fixo? `GRANT`/`REVOKE`?); triggers; índices; buckets e policies do Storage; extensões; seeds; tabelas sem policy; qualquer `DELETE` físico em tabela operacional.
3. **Inventário de rotas × menu:** liste todos os `href` de `app-sidebar.tsx` e o que `[section]` renderiza hoje; marque quais itens caem em placeholder.
4. **Confirme cada hipótese do Apêndice B (L-08 a L-33)**: status (OK, Parcial, Falta, N/A), evidência (arquivo:linha ou tabela), esforço (P/M/G) e risco. Registre também novas lacunas que você encontrar.
5. **Verifique as invariantes:** (a) toda alteração de estoque passa por movimentação; (b) venda e cancelamento são atômicos (função SQL); (c) faturamento e estorno de O.S. são atômicos; (d) nenhum `DELETE` físico em tabela operacional; (e) exportações e impressões gravam auditoria; (f) toda server action valida com Zod e checa permissão; (g) nenhum uso de service-role fora de um módulo `server-only`; (h) `anon` só enxerga views/RPCs públicas da loja e do acompanhamento, sem custo, estoque exato nem dados pessoais; (i) dinheiro sem `float`; (j) regras de "dia" no fuso correto.
6. Confirme o que o `tsbuildinfo` de 07/10 não mostra: arquivos criados depois, `.github/workflows`, `public/`, `supabase/functions`.
7. **Entregue** `docs/AUDITORIA_AAAA-MM-DD.md`: matriz completa dos L-xx, lista de riscos P0 com evidência, estimativa por fase e proposta de ajuste da ordem. **Não altere código** (só documentação). Pare e aguarde revisão.

**Aceite:** todos os L-xx classificados com evidência; riscos P0 listados; baseline do `verify` registrado.

## 6. Fases de implementação

Cada tarefa tem **ID**, lacuna coberta (L-xx) e **aceite**. Toda tarefa também precisa cumprir a Definição de Pronto (seção 7). Se a auditoria mostrar que um item já existe e está correto, marque como "OK, sem mudança" no relatório da fase e siga em frente. Referências a tarefas de fases posteriores (por exemplo, Pix na F4-02 e na F5-02, ou notificações na F3-05) são **pontos de extensão**: deixe a interface e o ponto de ligação prontos e conecte a integração quando a fase indicada for executada; até lá, mantenha o comportamento atual.

### Fase 1 — Fundação, segurança e qualidade (P0)

**Objetivo:** base confiável antes de novas funcionalidades. **Pré-requisito:** Fase 0 aprovada.

**F1-01 · Tipos do Supabase (L-24).** Gere `src/lib/supabase/database.types.ts` com `supabase gen types typescript --local`; crie `npm run db:types`; tipe `createServerClient<Database>` e `createBrowserClient<Database>`; corrija os erros resultantes sem `any` nem casts amplos; exporte helpers (`Tables`, `TablesInsert`, `TablesUpdate`). O CI falha se `db:types` gerar diff.
*Aceite:* `typecheck` verde com os clientes tipados; nenhuma query sem tipo de retorno; diff de tipos igual a zero no CI.

**F1-02 · Dependências e configuração (L-26).** `@types/node` para `^24`; instale `@vitest/coverage-v8` e defina limiares (por exemplo, 90% de linhas em `features/*/calculate.ts` e `lib/validations/*`); instale Prettier (com plugin do Tailwind) e crie `format` e `format:check`; reformate `vitest.config.ts` e `playwright.config.ts`; complete o `.env.example` (Apêndice D) e valide tudo em `src/lib/env.ts` com Zod, separando `serverEnv` (com `import "server-only"`) e `clientEnv`; mova para `src/lib` o tipo compartilhado que `products/actions.ts` importa de `customers/actions.ts`; exclua `supabase/functions` do `tsconfig.json`.
*Aceite:* `verify` verde; o app não sobe sem variáveis obrigatórias e diz qual falta; nenhuma variável só de servidor é importada em componente cliente (verificação automatizada).

**F1-03 · Headers de segurança (L-26).** Em `next.config.ts` e `proxy.ts` (veja nos docs do Next 16 como aplicar CSP com nonce): CSP restritiva, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (câmera só onde há captura de foto), `frame-ancestors 'none'`, `poweredByHeader: false`; `images.remotePatterns` restrito ao host do Storage. A CSP libera Turnstile, mapas e o WebSocket local do QZ (`wss://localhost:8181`) apenas quando essas integrações estiverem habilitadas.
*Aceite:* teste automatizado confere os headers em uma página pública e em uma do painel; nenhuma violação de CSP no console durante os E2E.

**F1-04 · Boundaries de erro e carregamento (L-23).** Crie `error.tsx`, `global-error.tsx`, `not-found.tsx` e `loading.tsx` (skeletons) na raiz, em `(dashboard)` e nas rotas públicas (`/loja/[slug]`, `/pedido/[code]`). Mensagens em pt-BR, botão "tentar novamente" e envio do erro à observabilidade (F1-07) com `requestId`.
*Aceite:* forçar um erro em uma página de cada grupo mostra a tela amigável, sem expor stack nem mensagem de banco.

**F1-05 · Recuperação de senha completa (L-13).** Crie o Route Handler `/auth/confirm` (trata `token_hash`/`type`, e `code` se PKCE, conforme a doc do Supabase SSR) e a página `/redefinir-senha` (nova senha com confirmação, regras mínimas, invalida sessões antigas). O pedido de redefinição usa mensagem neutra (não revela se o e-mail existe), tem rate limit (F1-06) e grava auditoria. Documente Site URL, Redirect URLs e SMTP próprio (o SMTP padrão do Supabase serve só para testes).
*Aceite:* E2E percorre pedir → abrir o link (Mailpit/Inbucket do Supabase local) → definir a senha → entrar; link expirado ou já usado mostra erro tratado.

**F1-06 · Rate limit e anti-abuso (L-28, L-21).** Implemente `rateLimit({ key, limit, windowSeconds })` com função SQL atômica e tabela com limpeza por job (ou Upstash, se o cliente já usar; decida em ADR). Aplique em: login, pedido de redefinição, checkout público, consulta de `/pedido/[code]`, webhooks, `/api/print/sign` e `/api/jobs/*`. Chave = IP confiável (de `x-forwarded-for` validado) + rota (+ e-mail ou telefone quando houver). Resposta 429 com `Retry-After`. Turnstile opcional, ativável por unidade.
*Aceite:* teste de integração bloqueia a requisição N+1 e libera após a janela.

**F1-07 · Observabilidade (L-28).** Logger estruturado (JSON) com `requestId`, `userId`, `organizationId`, rota e duração. Sentry opcional via DSN (cliente e servidor), com `beforeSend` removendo PII (CPF, telefone, e-mail, endereço, senhas, tokens). `GET /api/health` (app + `select 1`, sem detalhes sensíveis).
*Aceite:* erro forçado aparece no Sentry sem PII; o health responde 200/503 corretamente.

**F1-08 · Permissões (RBAC) centralizadas (L-10).** Audite o modelo de papéis existente e **estenda-o** (não crie um segundo). Crie `src/lib/permissions.ts` com `can(ctx, permission, { businessUnitId })` e a matriz papel × permissão. Permissões sugeridas: `customers.manage`, `products.manage`, `inventory.adjust`, `inventory.transfer`, `os.create`, `os.edit`, `os.change_status`, `os.bill`, `os.refund`, `os.view_device_secret`, `quotes.manage`, `sales.create`, `sales.discount_over_limit`, `sales.cancel`, `sales.refund`, `cash.open_close`, `cash.movement`, `finance.payables`, `finance.receivables`, `orders.manage`, `ecommerce.manage`, `delivery.settings`, `reports.view`, `reports.export`, `audit.view`, `trash.restore`, `users.manage`, `settings.manage`, `print.configure`, `integrations.manage`, `pix.confirm_manual`, `backup.manage`, `import.run`. Aplique em **toda** server action, route handler e página; reforce no banco (policies e funções) o que for sensível.
*Aceite:* teste de matriz (cada papel × cada permissão) e verificação estática que falha se uma server action não chamar `requireUser`/`can`; nenhuma checagem só no front-end.

**F1-09 · Testes de banco (L-25).** Em `supabase/tests/*.sql` (pgTAP, rodados por `supabase test db`): isolamento entre organizações em **todas** as tabelas (SELECT/INSERT/UPDATE/DELETE negados entre organizações); `anon` só acessa views/RPCs públicas; tabelas de movimentação, auditoria e lançamentos **imutáveis** (sem UPDATE/DELETE); invariantes (saldo de estoque = soma das movimentações; saldo de caixa = soma dos lançamentos; venda/cancelamento e faturamento/estorno atômicos); concorrência (duas vendas da última unidade: uma falha); funções `SECURITY DEFINER` com `search_path` fixo e `EXECUTE` revogado de `public`.
*Aceite:* suíte verde no CI; remover uma policy de propósito faz um teste falhar.

**F1-10 · CI (L-25, L-07).** GitHub Actions com jobs `lint`, `typecheck`, `test` (com cobertura) e `build`; job de banco (`supabase start`, `db reset`, `supabase test db`, drift de tipos); job E2E (Playwright com `npm run build && npm start`, projetos chromium e mobile, traces como artefato); cache de npm e Playwright; `npm audit --omit=dev` informativo; Node 24. Documente a proteção de branch.
*Aceite:* PR com falha em qualquer job não faz merge; tempo total documentado.

**F1-11 · Infra de jobs e outbox (apoio a L-05).** Tabela `job_runs` (nome, início, fim, status, resumo, erro); Route Handlers `/api/jobs/[name]` protegidos por `Authorization: Bearer ${CRON_SECRET}` (o Vercel Cron envia esse mesmo cabeçalho quando `CRON_SECRET` está definido), com rate limit e **idempotência** (lock advisory por job); registro de jobs em `src/features/jobs/registry.ts`; agendamento em `vercel.json` ou documentado para cron externo ou `pg_cron` + `pg_net`; padrão de **outbox transacional** (`outbox_events`) para efeitos externos (WhatsApp, Pix, impressão), com retentativa por backoff e dead-letter.
*Aceite:* um job de exemplo (`expire-reservations`, mínimo) roda, registra `job_runs`, é idempotente e responde 401 sem o segredo.

**F1-12 · Fixtures e seeds de E2E (L-25).** `supabase/seed.sql` determinístico (organização, 2 unidades, um usuário por papel, catálogo mínimo, formas de recebimento); helpers do Playwright com `storageState` por papel; dados de teste criados por RPC de teste (não pela UI); `.env.test`.
*Aceite:* `npm run test:e2e` roda do zero localmente e no CI; testes independentes entre si (`fullyParallel`).

**Entrega da Fase 1:** relatório (Apêndice C) + `docs/SEGURANCA.md` + ADRs. Pare.

### Fase 2 — Cadastros, edição e usuários (P0)

**Objetivo:** fechar o ciclo de cadastro (criar, ver, editar, arquivar, restaurar) e a gestão de acessos. **Pré-requisito:** Fase 1.

**F2-01 · UI kit (L-27).** Adicione via CLI do shadcn: `dialog`, `alert-dialog`, `sheet`, `tabs`, `select`, `combobox`/`command`, `popover`, `tooltip`, `dropdown-menu`, `textarea`, `checkbox`, `radio-group`, `switch`, `label`, `form`, `table`, `skeleton`, `calendar`/date-picker, `separator`, `scroll-area` (mantenha `sonner`). Crie `MoneyInput` (centavos, máscara pt-BR), `PhoneInput` (E.164 BR), `CpfCnpjInput`, `CepInput` (ViaCEP ou BrasilAPI, com cache), `DateRangePicker`, `ConfirmDialog` e `FormField`. Registre em ADR a adição do Radix.
*Aceite:* página `/dev/ui` (somente em desenvolvimento) mostra os componentes; verificação básica de acessibilidade (`@axe-core/playwright`) em 3 telas principais.

**F2-02 · Listagens padronizadas (L-19).** Padronize um `DataTable` guiado pelo servidor: paginação com limite (25/50/100), ordenação, filtros e busca por query string (parse com Zod), estados vazio e de erro, exportar a visão atual (CSV auditado, com `reports.export`). Aplique em clientes, produtos, estoque, vendas, orçamentos, O.S., pedidos, produtos do e-commerce e contas a pagar. Crie os índices correspondentes e anexe `EXPLAIN` das 3 consultas mais pesadas.
*Aceite:* com 50 mil registros de seed, cada lista responde em menos de 300 ms no banco local (documente a máquina); nenhum `select` sem `limit`.

**F2-03 · Clientes: editar e arquivar (L-08).** Edição em `/clientes/[id]` (leitura + botão Editar, ou `/clientes/[id]/editar`) reutilizando `customer-form`; arquivar (soft delete para a lixeira) com motivo. Validações: CPF; **CNPJ, incluindo o formato alfanumérico** (12 primeiras posições alfanuméricas, 2 dígitos verificadores numéricos por módulo 11 com pesos 2 a 9 e valor = código ASCII − 48; confirme a regra na Nota Técnica COCAD/SUARA/RFB nº 49/2024 no gov.br e teste com vetores oficiais); telefone BR (E.164); CEP. Unicidade por organização de CPF/CNPJ com mensagem amigável. Campos: nome/razão social, PF/PJ, documento, nascimento, telefones (com marca de WhatsApp), e-mail, endereços, observações. Filtros por nome, documento, telefone e **mês de aniversário**. A página do cliente mostra o histórico (O.S., vendas, pedidos, saldo a receber).
*Aceite:* testes de validação com vetores válidos e inválidos (incluindo CNPJ alfanumérico); E2E editar/arquivar/restaurar; auditoria com antes/depois.

**F2-04 · Produtos, peças e serviços (L-08).** Editar e arquivar; `type` (produto, peça, serviço); SKU e código de barras (EAN-8/13 com validação de dígito, único por organização); custo, preço, margem calculada, unidade, estoque mínimo, controla estoque (serviços não controlam), garantia padrão em dias, imagem, categoria, ativo/inativo. Serviços alimentam o preenchimento automático da O.S. Ações em lote (ativar/desativar, reajuste % de preço) com auditoria e histórico de preços.
*Aceite:* produto com movimentação só pode ser arquivado, nunca excluído; alterar o preço não muda documentos já emitidos (snapshot de preço na venda e na O.S.).

**F2-05 · Cadastros auxiliares (L-11).** CRUD com soft delete, auditoria e seed padrão, em `/configuracoes/<recurso>` (mantenha o padrão de menu existente): equipamentos (tipos), marcas, modelos (por marca), **formas de recebimento** (tipo: dinheiro, cartão de crédito, cartão de débito, Pix, crediário, outro; taxa %; prazo de recebimento; parcelas máximas; unidades em que vale), contas e categorias de sangria e de despesa, **situações da O.S.** (rótulo, cor, ordem, estado canônico, notifica cliente, modelo de mensagem), itens de check-list (por tipo de equipamento; obrigatório ou não), termos de garantia e modelos de documento (texto com variáveis), fornecedores. Os selects da O.S., do PDV, do financeiro e do caixa passam a usar esses cadastros (combobox com busca e "criar rápido").
*Aceite:* nenhuma lista fixa em código para esses domínios; seed idempotente; E2E criando marca → modelo → O.S.

**F2-06 · Usuários, funcionários e papéis (L-10).** `/configuracoes/usuarios`: listar membros (papel, unidades, último acesso, status); convidar por e-mail com `inviteUserByEmail` do Auth Admin, em módulo `server-only` mínimo; alterar papel e unidades; desativar e reativar (nunca excluir); forçar redefinição de senha. Guardas: não remover o último administrador, não elevar o próprio privilégio, não alterar usuário de outra organização. Tudo auditado. **Funcionários** (técnico, atendente, vendedor, entregador) são um cadastro à parte, com vínculo opcional a um usuário (técnico sem login é válido) e usados em O.S., vendas e pedidos.
*Aceite:* testes das guardas; E2E convidar → aceitar → entrar com as permissões corretas.

**F2-07 · Menu sem rota (L-12).** Extraia os itens de `app-sidebar.tsx`; cada um vira rota real ou é removido. Ao final da fase, as rotas `[section]` passam a responder `notFound()`.
*Aceite:* um teste percorre o menu de cada papel e falha se alguma rota renderizar placeholder ou 404.

**F2-08 · Tela de auditoria (L-14).** `/configuracoes/auditoria` (somente leitura, permissão `audit.view`): filtros por usuário, entidade, ação, período e unidade; diff antes/depois legível; paginação; exportação CSV auditada; campos sensíveis mascarados (senha do aparelho, tokens).
*Aceite:* E2E; a consulta usa índices (`EXPLAIN` anexado).

**F2-09 · Lixeira completa (L-08).** "Enviar para a lixeira" em todos os cadastros, com motivo; restaurar com checagem de conflito (por exemplo, CPF duplicado); lista por entidade com filtros; **sem exclusão física**; opção "anonimizar" para clientes (LGPD) preservando integridade financeira e auditoria.
*Aceite:* testes de restauração com conflito; E2E.

**Entrega da Fase 2:** relatório (Apêndice C). Pare.

### Fase 3 — Ordem de Serviço completa (P0/P1)

**Objetivo:** paridade com o OS System. **Pré-requisito:** Fase 2.

**F3-01 · Edição da entrada com concorrência otimista (L-09).** Permita editar todos os campos de entrada: cliente, equipamento/marca/modelo, IMEI/série, NF, voltagem, acessórios, defeito relatado, avarias visíveis, observações, atendente/técnico e previsão de entrega. Use **controle otimista** (`version` ou `updated_at`): se outra pessoa alterou antes, mostre o conflito e não sobrescreva. Histórico de alterações (campo, antes/depois, autor, hora). Bloqueios por estado: O.S. faturada só edita com `os.edit` e motivo.
*Aceite:* teste de edição simultânea; auditoria.

**F3-02 · Abas, laudo técnico e anotações internas (L-09).** Layout em abas (Entrada · Serviços · Peças · Laudo técnico · Saída/Faturamento · Anotações internas) com `?aba=` na URL, indicador de alterações não salvas e salvamento por aba. **Laudo técnico**: texto formatado simples, seguro contra XSS, com anexos de imagem, imprimível. **Anotações internas**: nunca impressas ao cliente, com autor e data. Mobile-first (o técnico usa celular ou tablet).
*Aceite:* E2E nas 6 abas em Pixel 7 e desktop; texto malicioso é escapado ou sanitizado.

**F3-03 · Segurança do aparelho (L-20).** Campo de senha (texto/PIN) e **desenho de padrão** (grade 3×3 por toque ou mouse; guarde a sequência), armazenados **criptografados** (AES-256-GCM em módulo `server-only`, `key_id` para rotação, chave em variável de ambiente). Exibição mascarada; revelar exige `os.view_device_secret` e grava auditoria. A impressão "com/sem desenho de padrão" segue o modelo escolhido. O valor nunca vai para WhatsApp, e-mail, logs, exportações nem para a página pública.
*Aceite:* teste de ida e volta e de rotação de chave; varredura garante que o valor não aparece em logs nem CSV.

**F3-04 · Fotos (L-09).** Compressão no cliente (lado maior ≤ 1600 px, JPEG ~0,8), captura pela câmera (`capture="environment"`), upload **direto ao Storage** com URL assinada (bucket privado, caminho `org/os/...`, policies por organização), miniaturas e URLs assinadas de curta duração, limites de quantidade e tamanho, remoção como soft delete, rótulo (entrada, saída, avaria).
*Aceite:* upload de foto de 8 MB funciona no celular; usuário de outra organização não acessa o objeto (teste de policy).

**F3-05 · Status configuráveis e transições (L-20, L-11).** **Máquina de estados canônica no banco** (transições válidas por estado), com rótulos, cores e ordem configuráveis (F2-05) e histórico (autor, hora, observação). Fluxo de referência: Orçamento Pendente → Em Orçamento → Aguardando Peça → Aguardando Aprovação → Orçamento Aprovado → Serviço Iniciado → Aguardando Retirada → Faturado; laterais: Reaberto, Cancelado, Estorno, Fechado, Garantia. Regras: "Aguardando Retirada" exige laudo e valor; "Faturado" só pelo faturamento; "Reaberto/Garantia" referencia a O.S. original. Cada mudança gera evento no outbox (F1-11) para notificações (F7-02).
*Aceite:* testes de transições válidas e inválidas no banco; E2E do fluxo completo.

**F3-06 · Garantia e reabertura (L-20).** Prazo por serviço e peça (dias, vindo de F2-04); término calculado ao faturar; selo "em garantia / vencida / vence em X dias"; "Reabrir por garantia" cria uma O.S. filha vinculada (sem cobrança dos itens cobertos) e conta como retrabalho nos relatórios; alerta "garantia: O.S. ainda não faturada" quando aplicável.
*Aceite:* testes de cálculo de prazo (virada de mês, ano e fuso); E2E.

**F3-07 · Pesquisa, filtros e prazos (L-20, L-19).** Pesquisa por número, cliente (nome, CPF, telefone), IMEI/série, status, período (mês atual ou intervalo), técnico e atrasadas. Colunas: nº, status, cliente, entrada, previsão, dias em aberto, situação. **Linhas coloridas** pela cor da situação. Atalhos "O.S. Pendentes" e "Aguardando Retirada" com contadores no menu. Alerta de atraso versus previsão. Busca rápida global.
*Aceite:* E2E dos filtros; contadores batem com a consulta; índices adequados.

**F3-08 · Impressões da O.S. (L-15).** Audite e complete a matriz **modelo × largura (A4, 80 mm, 58 mm)**: entrada (1 ou 2 vias; com ou sem desenho de padrão; com etiqueta; com termo de garantia e laudo; com check-list), orçamento (serviços e peças), faturamento, recibos (adiantamento e faturamento), documentos de garantia (termo de garantia, comprovante de prestação de serviço, termo de responsabilidade, laudo técnico) e check-lists. **Etiqueta adesiva** com nº da O.S., cliente, aparelho e QR. Cada impressão é auditada (quem, quando, modelo, vias). Os textos dos termos vêm do cadastro (F2-05).
*Aceite:* teste de snapshot do HTML por modelo × largura; conferência visual (PDF) anexada ao PR.

**F3-09 · Adiantamento (L-20).** O "valor adiantamento" na entrada gera lançamento no caixa (forma de recebimento escolhida), mostra "restante a pagar" e emite recibo de adiantamento; o faturamento desconta o adiantamento; o estorno devolve corretamente.
*Aceite:* testes de totais (serviços + peças − desconto − adiantamento) e de caixa.

**F3-10 · Atalhos de teclado (L-30, P2).** Provider global: F1 busca de cliente, F2 nova O.S., F4 salvar, F6 fluxo de caixa, F7 tela de venda, F8 imprimir, F12 busca rápida; ajuda com `?`; sem conflito com digitação; desativável.
*Aceite:* E2E dos atalhos principais.

**F3-11 · Página pública da O.S. (L-31, P2).** `/os/[token]` somente leitura (status, orçamento, fotos permitidas, previsão) com botões aprovar/recusar orçamento (registra data e hash do IP). Token de alta entropia, expirável e revogável; sem dados sensíveis (senha do aparelho, CPF completo, valores internos); rate limit; a aprovação move a O.S. para "Orçamento Aprovado".
*Aceite:* testes de token inválido, expirado e de não vazamento de dados.

**Entrega da Fase 3:** relatório (Apêndice C). Pare.

### Fase 4 — PDV, caixa e financeiro (P1)

**Objetivo:** balcão rápido e dinheiro conferível. **Pré-requisito:** Fases 1 e 2.

**F4-01 · PDV de balcão (L-17).** Foco permanente no campo de código de barras (leitor USB que age como teclado; Enter adiciona); busca por nome e SKU; multiplicador de quantidade (`*`); desconto por item e no total (% ou R$) com **limite por papel** (acima do limite exige aprovação de quem tem `sales.discount_over_limit`, por PIN ou login); cliente padrão "Consumidor"; vendedor; observação; layout touch; atalhos de teclado.
*Aceite:* E2E de venda com leitor simulado; teste do limite de desconto.

**F4-02 · Pagamentos e crediário (L-17).** Várias formas na mesma venda; troco só em dinheiro; soma dos pagamentos = total (em centavos); cartão sem TEF (bandeira e NSU opcionais); Pix QR (ponto de extensão; a integração entra na F7-01); crediário/parcelado gera parcelas (quantidade, 1ª data, intervalo, juros e multa opcionais) em contas a receber.
*Aceite:* testes de arredondamento (a última parcela absorve os centavos); transação única.

**F4-03 · Contas a receber (L-17).** Tabela de parcelas ligada a cliente, venda ou O.S.; `/financeiro/receber` com filtros (vencidas, hoje, a vencer); baixa total ou parcial (gera lançamento no caixa na forma recebida); estorno de baixa; recibo; inadimplência por cliente; permissões `finance.receivables`.
*Aceite:* testes de baixa parcial e de estorno; saldo do cliente consistente.

**F4-04 · Recibo da venda (L-15).** Recibo/cupom **não fiscal** em 58 mm, 80 mm e A4; reimpressão auditada; link ou QR para a venda; envio por WhatsApp quando habilitado (F7-02).
*Aceite:* snapshot por largura.

**F4-05 · Venda suspensa (L-17).** Guardar e retomar vendas abertas por operador, sem baixar estoque até finalizar; limpeza por job.
*Aceite:* E2E.

**F4-06 · Devolução e troca (L-17).** Parcial ou total, por item, com retorno ao estoque (movimentação), estorno por forma de pagamento (caixa; Pix pelo provedor ou pendência manual), motivo, permissão `sales.refund` e documento de devolução.
*Aceite:* testes de invariantes de estoque e caixa; E2E.

**F4-07 · Caixa com fechamento e conferência (L-17).** Abertura (saldo inicial) e **fechamento com conferência** por forma de pagamento (esperado × contado, diferença e justificativa); bloqueio de lançamentos em caixa fechado; sangria e suprimento com conta/categoria e comprovante; reabertura só com permissão e auditoria; **relatório de fechamento imprimível**; um caixa aberto por operador e por unidade; cards Entrada/Saída/Saldo com opção de ocultar valores; filtros por período e por código de caixa, venda, O.S. ou sangria.
*Aceite:* testes de conferência com diferença e da virada de dia no fuso `America/Sao_Paulo`.

**F4-08 · Contas a pagar e visão consolidada (L-17).** Complete o que já existe (recorrência, anexos, categorias, baixa ligada ao caixa e à conta) e crie a visão consolidada a pagar × a receber × saldo, por unidade e geral.
*Aceite:* E2E.

**F4-09 · Inventário e compras (L-33, P2).** Contagem de estoque (por categoria), com ajuste **somente por movimentação** do tipo `inventory_adjustment`; entrada de mercadoria com fornecedor, custo e atualização de custo médio, vinculada a contas a pagar.
*Aceite:* invariantes de estoque; auditoria.

**F4-10 · Testes de integridade monetária (L-25).** Soma de pagamentos, arredondamento, concorrência no estoque (última unidade), cancelamento e estorno **idempotentes**, fuso horário; relatórios batem com o razão (venda = movimento de caixa = lançamento financeiro).
*Aceite:* suíte no CI.

**Entrega da Fase 4:** relatório (Apêndice C). Pare.

### Fase 5 — Loja online e pedidos (P0/P1)

**Objetivo:** loja pública segura e operação de pedidos completa. **Pré-requisito:** Fases 1 e 2. Os itens F5-01, F5-02, F5-05, F5-06 e F5-07 são **P0 antes de publicar a loja**.

**F5-01 · Segurança do checkout (L-21).** Preço, taxa, desconto, cupom e total são **sempre recalculados no servidor**. `idempotency_key` gerada no cliente (UUID) com restrição de unicidade. Rate limit e Turnstile (flag por unidade). Reserva de estoque com TTL (padrão 15 min), liberada por job (F8-04) e quando o Pix expira. Cupom com limites (validade, mínimo, usos totais e por cliente). O `anon` só enxerga **views/RPCs públicas** com colunas mínimas (sem custo, sem estoque exato, sem dados de outros clientes). Mensagens de erro neutras.
*Aceite:* testes de abuso: preço adulterado, quantidade negativa ou enorme, cupom repetido, duplo clique e tentativa de enumerar pedidos.

**F5-02 · Fluxo de checkout (L-21).** Três etapas (Entrega → Pagamento → Confirmação): retirada × entrega; endereço com CEP (ViaCEP ou BrasilAPI, com cache) e validação; taxa e prazo por área (F7-03); pedido mínimo; agendamento; pagamento por Pix online (F7-01) ou na entrega (dinheiro com troco, crédito, débito); resumo claro; aceite de termos e privacidade (F5-07).
*Aceite:* E2E completo em mobile e desktop.

**F5-03 · Horário de funcionamento (L-16).** Horários por dia, feriados, pausa manual, aviso "fecha às HH:MM" no topo e bloqueio do checkout fora do horário (ou agendamento).
*Aceite:* testes por fuso e virada de dia.

**F5-04 · Pedidos no painel (L-16).** Mantenha o Kanban e acrescente: **"Novo pedido"** manual (balcão, telefone, WhatsApp); busca por cliente e número; tempo decorrido e alerta de atraso por card; som e notificação de novo pedido (Realtime filtrado por organização e unidade, respeitando RLS); painel de detalhes; atribuir entregador; cancelar com motivo (reverte estoque e pagamento); **histórico** com filtros e exportação auditada; impressão (Fase 6).
*Aceite:* E2E de ponta a ponta (cliente faz o pedido → painel recebe → muda o status → cliente acompanha).

**F5-05 · Acompanhamento público (L-21).** `/pedido/[code]` com linha do tempo, código de alta entropia, rate limit, dados mínimos e atualização em tempo real ou polling com backoff.
*Aceite:* teste de enumeração de códigos.

**F5-06 · Restrição de idade (L-22).** Flag por produto, categoria e unidade; gate de maioridade na vitrine (declaração) e data de nascimento no checkout (registrada com consentimento); a comanda traz "conferir documento na entrega" quando houver item restrito; configurável e auditável.
*Aceite:* E2E com item restrito.

**F5-07 · LGPD (L-22).** Páginas de Política de Privacidade e Termos por unidade (editáveis); consentimento no checkout (data, versão do texto, hash do IP); opt-in de WhatsApp separado (F7-02); ferramenta administrativa para exportar e **anonimizar** dados do titular (sem exclusão física); registro de acesso a dados sensíveis.
*Aceite:* fluxo de pedido do titular documentado e testado.

**F5-08 · SEO e desempenho (L-22).** `generateMetadata`, `sitemap.ts`, `robots.ts`, JSON-LD de produto, opção `noindex` por unidade e imagem OG; `next/image` com `remotePatterns`; cache do catálogo público com revalidação por tag ao publicar ou alterar produto (veja os docs de cache do Next 16).
*Aceite:* Lighthouse mobile com desempenho e SEO ≥ 90 nas páginas da loja (documente o resultado).

**F5-09 · Avaliações e regras de cupom/fidelidade (L-32, P2).** Avaliação pós-pedido (nota e comentário, com moderação); validar as regras de acúmulo, resgate e expiração de fidelidade e de cupons; painel de resultados.
*Aceite:* testes de regra.

**Entrega da Fase 5:** relatório (Apêndice C). Pare.

### Fase 6 — Impressão (P1)

**Objetivo:** documentos de balcão e pedidos impressos de forma confiável, inclusive em modo silencioso. **Pré-requisito:** Fase 1 (jobs e outbox).

**F6-01 · `PrintGateway` (L-04).** Em `src/features/printing/`: interface `PrintGateway` com providers `browser` (comportamento atual) e `qz`; tabelas `print_profiles` (unidade, tipo de documento, impressora, largura A4/80/58, cópias, imprimir automaticamente) e `print_jobs` (idempotência, status, tentativas, `printed_at`, dispositivo, erro); API única `print(document, { profile })`.
*Aceite:* o provider `browser` mantém o comportamento atual; testes do contrato.

**F6-02 · Modelos de documentos (L-15).** Componentes React para **comanda do pedido**, recibo da venda, fechamento de caixa, recibos de sangria e suprimento e etiqueta, com CSS de impressão (`@page { size: 58mm auto; margin: 0 }` e 80 mm), fonte monoespaçada, QR (`qrcode`), quebra e truncamento previsíveis. Reaproveite o que a O.S. já tem. Pré-visualização e auditoria de impressão.
*Aceite:* snapshot por largura; PDF de conferência no PR.

**F6-03 · Integração QZ Tray (L-04).** Pacote `qz-tray`; conexão WebSocket segura; descoberta de impressoras; mapeamento por perfil; **assinatura de mensagens** conforme a documentação do QZ (certificado e chave privada PKCS#8 de 2048 bits): `GET /api/print/certificate` e `POST /api/print/sign` (autenticado, com permissão, com rate limit, chave só no servidor). Documente o `override.crt`. Estados de erro (QZ offline, impressora ausente) com **fallback para `browser`** e fila de reimpressão. Opcional: abrir gaveta e cortar papel via ESC/POS.
*Aceite:* teste com impressora virtual (PDF); sem a chave, o endpoint nega; a chave nunca chega ao cliente.

**F6-04 · Impressão automática de pedidos (L-04).** No painel de Pedidos, alternância "Imprimir automaticamente" por dispositivo. Pedido novo (Realtime) cria `print_job` com **trava atômica** (um único dispositivo imprime, sem duplicatas com várias abas). Reimpressão manual e log de falhas com alerta.
*Aceite:* teste com 2 sessões simultâneas imprime uma única vez.

**F6-05 · Documentação e homologação (L-04).** `docs/IMPRESSAO.md` com instalação do QZ Tray, certificado, nomes de impressora, largura do papel, calibração e a **alternativa sem dependências** (Chrome com `--kiosk-printing` apontando para a impressora térmica padrão). Checklist de homologação com as impressoras reais do cliente (modelo a definir).
*Aceite:* checklist preenchido em hardware real antes do go-live.

**Entrega da Fase 6:** relatório (Apêndice C). Pare.

### Fase 7 — Integrações: Pix, WhatsApp e mapas (P1)

**Objetivo:** fechar as três pendências de integração do README, todas atrás de interfaces e habilitáveis por unidade. **Pré-requisitos:** Fases 1, 5 e 6. **Antes de começar, resolva as decisões pendentes (seção 8) ou implemente atrás de stub.**

**F7-01 · Pix (L-01).**

- *Modelo de dados.* `pix_charges` (organização, unidade, origem `sale`, `delivery_order` ou `service_order_payment`, `origin_id`, provedor, `provider_charge_id`, `txid` único por provedor, valor, status `pending`/`paid`/`expired`/`canceled`/`refunded`/`failed`, `brcode` copia-e-cola, `expires_at`, `paid_at`, `paid_amount`, `idempotency_key` único, `created_by`) e `payment_provider_events` (provedor, `provider_event_id` único por provedor, payload, assinatura válida, processado em, resultado, erro). RLS por organização; **sem INSERT/UPDATE direto** pelo cliente, apenas por RPC.
- *Interface `PixProvider`:* `createCharge`, `getCharge`, `refund`, `verifyWebhook`. Implementações: `StaticPixProvider` (BR Code estático para a chave do lojista, com valor e `txid`, seguindo o Manual de Padrões para Iniciação do Pix do Banco Central, CRC16/CCITT-FALSE; **sem confirmação automática**, exige confirmação manual com `pix.confirm_manual`, que registra quem, quando e o comprovante); `FakePixProvider` (testes e desenvolvimento, com endpoint de dev para simular pagamento); e **um adaptador de PSP real**, escolhido pelo cliente (stub até a decisão).
- *Webhook* `POST /api/webhooks/pix/[provider]`: ler o corpo bruto; verificar autenticidade conforme o provedor (assinatura HMAC, mTLS ou segredo + allowlist de IP); registrar o evento de forma idempotente; chamar a RPC `confirm_pix_payment` (`SECURITY DEFINER`, regra 11), que trava a cobrança (`FOR UPDATE`), confere o valor, marca `paid` e conclui a origem **na mesma transação** (venda: registra pagamento e caixa; pedido: confirma e consolida a reserva; O.S.: lança o recebimento). Valor divergente grava `paid_mismatch`, alerta e **não** conclui. Responder 2xx para duplicados; 4xx/5xx só para falha real. Rate limit.
- *Conciliação e expiração:* job consulta no provedor as cobranças `pending` antigas; outro marca `expired`, libera a reserva de estoque e permite nova cobrança.
- *UI:* componente `PixPayment` (QR via `qrcode`, botão copiar, contagem regressiva, estados), usado no checkout, no PDV (tela cheia opcional) e na O.S.; atualização em tempo real ou polling com backoff.
- *Estorno:* cancelamento de venda ou pedido com Pix pago chama `refund` no provedor quando suportado; senão cria pendência de "estorno manual" (saída de caixa) com fluxo auditável.

*Aceite:* testes com vetores de CRC16 do Banco Central; webhook duplicado é idempotente; valor divergente não conclui; corrida webhook × expiração resolvida; nenhum dado pessoal em logs; E2E do checkout com `FakePixProvider`.

**F7-02 · WhatsApp (L-02).**

- *Nível A, todas as unidades, sem API:* botão "WhatsApp" que abre `https://wa.me/55<DDD><número>?text=<mensagem codificada>` com **modelos editáveis por unidade** (variáveis `{{cliente}}`, `{{os}}`, `{{aparelho}}`, `{{status}}`, `{{valor}}`, `{{link}}`, `{{loja}}`); normalização E.164 BR; registro do uso em `notification_log`.
- *Nível B, envio automático, somente em unidades com `whatsapp_api_enabled = true`:* WhatsApp Business Platform (Cloud API **oficial**) via `MessagingProvider`; **outbox transacional** (`notification_outbox`: unidade, canal, destinatário, template, variáveis, status, tentativas, `next_attempt_at`, `provider_message_id`, erro); gatilhos da O.S. (orçamento pronto/aguardando aprovação, aguardando retirada, faturado) e, se habilitado, de pedidos; **opt-in** registrado (`customer_consents`: canal, finalidade, texto e versão, origem, data, hash do IP) e **opt-out** (palavra-chave via webhook e botão no cadastro); respeitar a janela de 24 h e usar **apenas templates aprovados** fora dela; webhook `GET/POST /api/webhooks/whatsapp` (verify token e HMAC `X-Hub-Signature-256`) para status de entrega, leitura e mensagens recebidas. Mensagens **nunca** levam a senha do aparelho nem o CPF completo; incluem o link `/os/[token]` (F3-11).
- *Política de unidades:* o envio automático fica **desligado por padrão na unidade Loja/Delivery** e é habilitável na Assistência Técnica. A tela de configuração exibe aviso de que a política do WhatsApp restringe categorias de produtos e que o uso é responsabilidade do cliente. Não use APIs não oficiais.
- *Tela* `/configuracoes/whatsapp`: status da conexão, templates (nome, categoria, idioma, aprovação), teste de envio, log de mensagens com filtros.

*Aceite:* testes de normalização de telefone, renderização de template, outbox idempotente com retentativa, opt-out, assinatura HMAC e janela de 24 h; E2E do nível A.

**F7-03 · Mapas e áreas de entrega (L-03).**

- *Banco:* extensão PostGIS; `delivery_zones` (unidade, nome, tipo `radius`/`polygon`/`neighborhood`, centro, `radius_m`, polígono, taxa, pedido mínimo, prazo, ativa, prioridade); função `resolve_delivery_zone(unit_id, lat, lng)`; índices GIST; `lat/lng`, origem e data da geocodificação nos endereços.
- *Geocodificação:* interface `Geocoder` com provedor configurável (Google, Mapbox ou outro), cache por hash do endereço normalizado, ajuste manual (pino no mapa) e **fallback por bairro/CEP** quando falhar; rate limit.
- *Admin:* tela de zonas com mapa (Leaflet com provedor de tiles de termos adequados a produção; não use os tiles públicos do OSM em produção), desenho de círculo ou polígono, faixas de taxa por distância e simulação "digite um endereço e veja a taxa".
- *Checkout:* taxa e disponibilidade calculadas **no servidor** (nunca confiar no cliente), mensagem clara fora da área, snapshot da zona e da taxa no pedido. Relatório de vendas por bairro/zona (F8-01).

*Aceite:* testes de ponto dentro, fora e na borda; zonas sobrepostas (por prioridade); falha do geocoder; taxa adulterada pelo cliente é ignorada.

**Entrega da Fase 7:** relatório (Apêndice C) + `docs/INTEGRACOES.md` (como ligar cada provedor, variáveis, riscos). Pare.

### Fase 8 — Relatórios, importação, backup e jobs (P1/P2)

**Objetivo:** visão gerencial, migração de dados e continuidade. **Pré-requisito:** Fases 1 a 5 (e a infra de jobs da F1-11).

**F8-01 · Painel e relatórios (L-18).** Dashboard por unidade e consolidado, com gráficos (adicione biblioteca leve, por exemplo `recharts`, com ADR): faturamento, ticket médio, O.S. abertas, atrasadas e aguardando retirada, estoque crítico, contas a pagar e a receber vencendo, saldo de caixa. Relatórios com filtros e exportação: vendas (período, vendedor/funcionário, forma de pagamento, categoria, produto); **vendas por bairro/zona** (faturamento, pedidos, ticket médio); desempenho por funcionário e por técnico; O.S. (por status, técnico, tempo médio de reparo, retrabalho/garantia); estoque (posição, mínimo, curva ABC, giro, ruptura, valorização); financeiro (fluxo por período, a pagar e a receber, DRE simples); clientes (aniversariantes, ranking, inativos); cupons e fidelidade. Exportação CSV (e XLSX se o cliente pedir) **auditada** (quem, filtros, quantidade de linhas, checksum). Consultas no servidor, paginadas ou em streaming, limitadas, com `reports.view` e `reports.export`, no fuso `America/Sao_Paulo`.
*Aceite:* cada relatório tem teste de consulta contra um seed conhecido; toda exportação grava auditoria.

**F8-02 · Importação assíncrona (L-06).** Fluxo **staging → validação → prévia → confirmação → processamento em lotes → relatório → rollback do lote.** Upload de CSV/XLSX em bucket privado; `import_batches` e `import_rows` (status e erros por linha); mapeamento de colunas; validação Zod por linha; deduplicação (clientes: CPF/CNPJ, depois telefone, depois e-mail; produtos: código de barras ou SKU); processamento por job idempotente e retomável; todo saldo inicial de estoque entra por **movimentação**; lote revertível (soft delete das linhas importadas). Modelos CSV para clientes, produtos/peças, serviços, saldo de estoque e contas a pagar. Importadores específicos para as exportações do OS System e do Cardápio Web (formatos a confirmar com amostras do cliente).
*Aceite:* importar 10 mil linhas com 5% inválidas gera o relatório correto sem duplicar; reexecutar o job não duplica; o rollback funciona; tudo auditado.

**F8-03 · Backup (L-05).** Exportação lógica por organização (manual e agendada) para Storage privado, com checksum, criptografia e retenção. `/configuracoes/backups` ganha ações (gerar, baixar por URL assinada de curta duração, status). **A restauração é um procedimento operacional documentado** (`docs/RESTAURACAO.md`), não um botão. Ative os backups gerenciados do Supabase (PITR conforme o plano) e documente. Um job restaura o último dump em um banco temporário e confere contagens, chaves estrangeiras e saldos (estoque e caixa).
*Aceite:* restauração testada de ponta a ponta, com evidência no PR.

**F8-04 · Jobs agendados (L-05, L-01, L-02).** Sobre a F1-11: `expire-reservations`, `reconcile-pix`, `process-outbox` (WhatsApp e impressão), `process-imports`, `backup-export`, `rate-limit-cleanup` e, opcionalmente, `birthday-notifications`. Cada job registra `job_runs`, é idempotente e alerta em caso de falha.
*Aceite:* teste por job; agenda documentada.

**Entrega da Fase 8:** relatório (Apêndice C). Pare.

### Fase 9 — Deploy e operação (P0 para o go-live)

**Objetivo:** colocar em produção com segurança e capacidade de recuperação. **Pré-requisito:** Fases anteriores aprovadas.

**F9-01 · Ambientes e Auth (L-07).** Projetos Supabase separados (dev, staging, produção); variáveis por ambiente; migrations aplicadas pelo CI com **aprovação manual** em produção; seeds só em dev e staging. Auth: Site URL, Redirect URLs, **SMTP próprio**, política de senha, MFA opcional para administradores. Confira buckets e policies do Storage.
*Aceite:* `docs/AMBIENTES.md`.

**F9-02 · Hospedagem e operação (L-07).** Decida em ADR entre **Vercel + Supabase hospedado** (recomendado) e VPS com Docker (`output: 'standalone'`). Domínio e HTTPS; `docs/DEPLOY.md` com passo a passo, rollback e checklist; monitoramento, alertas e crons configurados.
*Aceite:* deploy de staging reproduzível por uma pessoa nova seguindo o documento.

**F9-03 · Backup e restauração executados (L-05).** Defina RPO e RTO com o cliente; faça um **teste de restauração real** em staging, com evidência; agende repetição trimestral.
*Aceite:* relatório do teste anexado.

**F9-04 · Migração e treinamento (L-29).** Plano de virada para a assistência (OS System) e para a loja (Cardápio Web): exportar → importar (F8-02) → conferir (contagens, saldos de estoque e de caixa) → operar em paralelo → virar. Manual curto por papel e roteiro de treinamento (30 a 60 min); lista do "primeiro dia" (impressoras, atalhos, usuários).
*Aceite:* ensaio de migração com dados reais anonimizados.

**F9-05 · E2E completos e checklist de go-live (L-25, L-07).** Jornadas E2E (chromium e mobile): login → abrir caixa → O.S. (entrada → orçamento → aprovação → serviço → faturamento → impressão) → venda no PDV com múltiplos pagamentos → pedido na loja pública (Pix simulado) → painel → entrega → fechamento de caixa → relatório. **Checklist de go-live:** RLS e testes de banco verdes, headers, rate limit, segredos, backup testado, monitoramento, provedores configurados, plano de rollback e comunicação ao cliente.
*Aceite:* checklist 100% com evidências.

**Entrega da Fase 9:** relatório final (Apêndice C) + `docs/GO_LIVE.md`. Pare.

## 7. Definição de Pronto (vale para toda tarefa)

- Código tipado, sem `any`, e migration versionada quando houver mudança de banco (nome `AAAAMMDDHHMMSS_descricao.sql`, com notas de rollback no cabeçalho).
- Testes proporcionais ao risco: unitários para regras, **pgTAP** para RLS e funções, **E2E** para jornadas; dinheiro e estoque sempre com testes de invariantes e de concorrência.
- `npm run verify` verde (e `supabase test db` e `npm run test:e2e` quando aplicável).
- Telas com estados vazio, carregando e erro; responsivas (Pixel 7 e desktop); navegáveis por teclado.
- Auditoria nas operações financeiras, de estoque, de impressão e nas exportações.
- Documentação atualizada (README "Estado desta entrega", `docs/*`, `.env.example`) e ADR para decisões relevantes.
- Sem `TODO`/`FIXME` sem issue; sem segredos; sem dependência nova sem ADR.
- Commits no padrão Conventional Commits, em branch `feat/fN-xx-descricao`, com PR pequeno e descrição do que mudou, riscos e como testar.

## 8. Decisões pendentes (pare e pergunte, ou implemente atrás de interface com stub)

1. Provedor de Pix (conta, tipo de chave, se o provedor aceita o produto) ou uso do BR Code estático com confirmação manual.
2. Provedor de WhatsApp (API oficial ou apenas link direto) e quais unidades poderão usar o envio automático.
3. Provedor de mapas e geocodificação, e orçamento.
4. Hospedagem (Vercel + Supabase hospedado ou VPS) e domínio.
5. Modelo e largura das impressoras térmicas e se haverá QZ Tray ou impressão silenciosa pelo Chrome.
6. Necessidade de emissão fiscal (NFC-e, NF-e, NFS-e): **fora do escopo atual**; não implemente sem alinhamento.
7. RPO e RTO desejados pelo cliente.
8. Amostras de exportação do OS System e do Cardápio Web.
9. Confirmação das prioridades do cliente antes das Fases 4 a 8.

## 9. O que NÃO fazer

- Não reescrever módulos que funcionam nem executar fases não solicitadas.
- Não desabilitar RLS; não usar service-role fora do módulo `server-only` e das funções documentadas.
- Não apagar dados fisicamente; não atualizar saldo de estoque sem movimentação.
- Não chamar provedores reais em testes ou no CI; não usar APIs de WhatsApp não oficiais.
- Não colocar segredos em código, commits, logs ou documentos; não copiar valores do `.env.local` para nenhum arquivo.
- Não implementar mecanismos para ocultar ou mascarar a natureza dos produtos perante provedores de pagamento, mensageria ou hospedagem.
- Não declarar uma tarefa concluída sem `npm run verify` e os testes da própria tarefa.

---

## Apêndice A — Referência funcional (resumo dos vídeos de referência)

Os vídeos mostram dois sistemas de Maringá-PR. O resumo vem só da análise visual dos quadros; o áudio não foi transcrito. KDS e Mesas/Comandas do Cardápio Web **não se aplicam** ao Sincro.

### A.1 OS System (assistência técnica, desktop Windows)

- **Menus:** Cadastros · Ordem de Serviço · Venda · Fluxo de Caixa · Relatórios · Configurações · Ajuda. **Atalhos:** Abrir Nova O.S. (F2), Pesquisar O.S., O.S. Pendentes, Aguardando Retirada, Fluxo de Caixa (F6), Tela de Venda (F7).
- **Cadastros:** Cliente, Funcionário, Usuário, Produtos (Peça), Serviço, Equipamento, Marca, Modelo, Tipo de recebimento, Conta para sangria de caixa, Situação da O.S., Itens de check-list.
- **O.S.:** barra com Novo, Salvar (F4), Imprimir (F8), Cancelar (F7), Busca rápida (F12), Rótulos, Imagens (foto do aparelho) e Check List. Abas: **Entrada** (nº automático, data de entrada, cliente com F1 para busca, celular com link para WhatsApp, equipamento, marca, modelo, nº de série/IMEI, NF, voltagem, acessórios, defeito relatado, avarias visíveis como riscos e manchas, observações gerais como senhas, atendente/técnico, status, status de garantia), **Serviços** (descrição, quantidade, valor unitário e total, com preenchimento automático a partir do cadastro), **Peças** (mesma grade, com baixa de estoque), **Laudo técnico**, **Saída/Faturamento**, **Anotações internas**. Totais: total de serviço, total de peças, subtotal, desconto, **valor total**, valor adiantamento, **restante a pagar**.
- **Status da O.S.:** Orçamento Pendente → Em Orçamento → Aguardando Peça → Aguardando Aprovação → Orçamento Aprovado → Serviço Iniciado → Aguardando Retirada → Faturado; e Reaberto, Cancelado, Estorno, Fechado, Garantia.
- **Impressão:** A4, térmica 80 mm e 58 mm. Modelos: entrada de O.S. (com ou sem desenho de senha padrão, 1 ou 2 vias, com etiqueta, com termo de garantia e laudo, com check-list), orçamentos (serviços e peças), faturamento, recibos (adiantamento e faturamento), documentos de garantia (termo de garantia, comprovante de prestação de serviço, termo de responsabilidade, laudo técnico) e check-lists.
- **Busca de clientes:** por nome, CPF, CNPJ ou mês de aniversário; lista código, nome, nascimento, CPF/CNPJ, tipo (física/jurídica) e endereço.
- **Pesquisa de O.S.:** filtro por período (mês atual ou data inicial e final), status e número; colunas nº, status, cliente, data de entrada, previsão de entrega, dias e situação; alerta "garantia: O.S. ainda não faturada"; linhas coloridas por situação.
- **Venda (PDV de balcão):** cliente padrão "Consumidor", código de barras, produto, quantidade e valor; à vista ou parcelada (nº de parcelas e 1ª parcela). Faturamento com desconto (% ou R$), **múltiplas formas de pagamento na mesma venda** (dinheiro, cartão, Pix, venda parcelada, outras), pagamento por QR Code e troco.
- **Fluxo de caixa:** cards Entrada, Saída e Saldo (com opção de ocultar valores); filtros por período e por código de caixa, venda, O.S. ou sangria; colunas data, descrição, valor de entrada, valor de saída, tipo, situação e usuário logado; sangria e suprimento.

### A.2 Cardápio Web (loja e delivery, SaaS de delivery/PDV)

- **Menu:** Gestão de pedidos · Mesas/Comandas · KDS · Caixa · Desempenho · Histórico de pedidos · Minha empresa · Catálogo · App Store · Financeiro · Estoque · Delivery · Cupons e descontos · Fidelidade · Clientes · Avaliações · Marketing · Gerenciar WhatsApp · Suporte. No topo, o status da loja ("Fecha às 18h00"). Financeiro, Estoque e Comandas aparecem bloqueados no plano atual do cliente.
- **Gestão de pedidos (Kanban):** colunas por status, botão "+ Novo pedido", busca por cliente ou número, tempo decorrido do pedido.
- **Caixa:** lançamentos com data e hora, descrição (por exemplo "Pedido Nº 156 – Delivery" e "Saldo inicial"), valor e forma de pagamento; filtros por descrição, forma de pagamento e tipo de operação.
- **Desempenho:** vendas por funcionário (delivery, retirada, no local) e vendas por bairro (faturamento, pedidos, ticket médio).
- **Histórico de pedidos:** número e código, cliente, data de criação. **Catálogo:** abas Produtos, Complementos e Opções; categorias.
- **Áreas de entrega:** mapa com raio a partir da loja e taxas por área. **Clientes:** nome, telefone e total de pedidos.
- **Loja online do cliente final:** vitrine por categorias, carrinho e **checkout em 3 etapas** (Entrega → Pagamento → Confirmação), cupom, Pix automático (online) ou pagamento na entrega (dinheiro com troco, crédito, débito).
- **Impressão automática:** ao entrar um pedido, imprime a comanda em **impressora térmica de 58 mm** via QZ Tray.

### A.3 Escopo-alvo do Sincro (do briefing)

- **Assistência técnica (MVP):** cadastros; O.S. completa (abas, status configuráveis, fotos, check-list, garantia, senha e desenho); impressão A4 e térmica 58/80 mm com modelos; PDV com múltiplos pagamentos e Pix/QR; fluxo de caixa com sangria, suprimento, abertura e fechamento; integração com WhatsApp (avisar status e "pronto para retirada"); relatórios e painel de O.S. pendentes e aguardando retirada.
- **Loja/delivery:** catálogo online, checkout com Pix, gestão de pedidos em Kanban, áreas e taxas por mapa, impressão automática, caixa, clientes, fidelidade e cupons, WhatsApp; estoque e financeiro que o Cardápio Web bloqueia no plano atual.
- **Diferencial:** um único sistema web multiunidade que une O.S., PDV e loja online.

## Apêndice B — Lacunas a confirmar na Fase 0

Origem: **Confirmada** (README), **Verificada** (leitura de arquivo de configuração) ou **Inferida** (inventário de arquivos e grafo de imports de 07/10/2026).

| ID | Prio | Origem | O que confirmar | Fase |
|---|---|---|---|---|
| L-01 | P1 | Confirmada | Não há tabela nem rota de Pix; o checkout só aceita pagamento na entrega? | 7 |
| L-02 | P1 | Confirmada | Existe algum link `wa.me` hoje? Há tabela de templates ou outbox? | 7 |
| L-03 | P1 | Confirmada | Como as áreas são modeladas hoje (bairro, CEP, lista)? PostGIS está habilitado? | 7 |
| L-04 | P1 | Confirmada | A impressão é só `window.print()` na rota da O.S.? Existe `print_jobs`? | 6 |
| L-05 | P0 | Confirmada | O que a tabela de `/configuracoes/backups` representa? Há job ou rotina real de backup? | 8 e 9 |
| L-06 | P1 | Confirmada | `/configuracoes/importacao` é estática (não importa Supabase nem actions)? Há tabela de lotes? | 8 |
| L-07 | P0 | Confirmada | Existem `.github/workflows`, `vercel.json` ou Dockerfile? | 9 |
| L-08 | P0 | Inferida | `clientes/[id]` e `produtos/[id]` só leem (não importam os formulários)? Existem actions de update ou arquivar sem UI? Algum botão envia à lixeira? | 2 |
| L-09 | P0 | Inferida | `ordens-de-servico/[id]` renderiza `service-order-form`? Existe action de update da entrada? Os campos de laudo e anotações existem no schema e no banco? | 3 |
| L-10 | P0 | Inferida | Qual tabela guarda membros e papéis? Há RPC ou UI para convidar usuários? `bootstrap_organization` é o único caminho? | 1 e 2 |
| L-11 | P0 | Inferida | Equipamento, marca, modelo, forma de recebimento, situação, check-list e conta de sangria vêm de tabelas ou de listas e enums fixos? | 2 |
| L-12 | P0 | Inferida | Quais `href` do `app-sidebar.tsx` caem em `[section]`? | 2 |
| L-13 | P0 | Inferida | O pedido de redefinição usa `redirectTo` para qual rota? Existe `/auth/confirm` ou callback? | 1 |
| L-14 | P1 | Inferida | Estrutura da tabela de auditoria (ator, entidade, antes e depois), índices e policies | 2 |
| L-15 | P1 | Inferida | Quais tipos de documento e larguras a O.S. suporta? Existe impressão de venda, orçamento, pedido e caixa? | 3, 4 e 6 |
| L-16 | P1 | Inferida | `delivery/actions.ts` cria pedido manual? Há histórico, detalhe, entregador e horário de funcionamento? | 5 |
| L-17 | P1 | Inferida | `sale.ts` suporta parcelas? Existe tabela de recebíveis? O caixa fecha com conferência? Há devolução parcial e venda suspensa? | 4 |
| L-18 | P1 | Inferida | O que o dashboard e `/relatorios` calculam hoje? O `vendas.csv` grava auditoria? | 8 |
| L-19 | P1 | Inferida | Quais listas paginam no servidor? Há consultas sem `limit`? (O.S., orçamentos, estoque, produtos do e-commerce e pedidos não importam o componente de paginação.) | 2 |
| L-20 | P1 | Inferida | A senha do aparelho é guardada em texto puro? Existem previsão de entrega, garantia, adiantamento e os atalhos "Pendentes" e "Aguardando retirada"? | 3 |
| L-21 | P0 | Inferida | Como o `anon` lê o catálogo (view, RPC ou policy)? O servidor recalcula preço e taxa? Há idempotência, TTL de reserva e rate limit? | 5 |
| L-22 | P0 | Inferida | Existem política de privacidade, consentimento, campo de idade, `generateMetadata`, `sitemap` e `robots`? | 5 |
| L-23 | P0 | Inferida | Confirmar a ausência de `error.tsx`, `loading.tsx` e `not-found.tsx` | 1 |
| L-24 | P0 | Inferida | Confirmar a ausência de tipos gerados e de genéricos nos clientes Supabase | 1 |
| L-25 | P0 | Inferida | Cobertura atual; testes de RLS; E2E além do login; o CI roda E2E? | 1, 4 e 9 |
| L-26 | P0 | Verificada | `@types/node` ^20 × Node 24; `next.config.ts` mínimo; `.env.example` incompleto; `@vitest/coverage-v8` ausente; sem Prettier; `tsconfig` com `**/*.ts` | 1 |
| L-27 | P0 | Verificada | Só `button`, `input`, `card` e `badge` em `components/ui`; nenhum `@radix-ui/*` instalado | 2 |
| L-28 | P1 | Inferida | Há logger estruturado, Sentry, `/api/health` e rate limit? | 1 |
| L-29 | P1 | Inferida | `docs/` tem plano de migração? Quais dados legados existem e em que formato? | 9 |
| L-30 | P2 | Inferida | Existem atalhos de teclado do OS System? | 3 |
| L-31 | P2 | Inferida | Existe página pública da O.S. ou aprovação de orçamento por link? | 3 |
| L-32 | P2 | Inferida | Existe avaliação de pedido? | 5 |
| L-33 | P2 | Inferida | Existe contagem de inventário ou entrada de compra com custo? | 4 |

## Apêndice C — Modelo do relatório de cada fase

```
## Relatório da Fase N — AAAA-MM-DD

1. Resumo (até 3 linhas)
2. Tarefas: ID | Status (Feito / Parcial / Já existia / Adiado) | Evidência (PR, commit, teste)
3. Migrations criadas e o que cada uma faz
4. Decisões tomadas (ADRs) e decisões que dependem do cliente
5. Riscos e dívidas técnicas em aberto
6. Como testar manualmente (passos curtos)
7. Resultado de npm run verify, supabase test db e npm run test:e2e (resumo da saída)
8. Próxima fase sugerida e pré-requisitos
```

## Apêndice D — Variáveis de ambiente a documentar no `.env.example`

Somente nomes e comentários, nunca valores. Variáveis `NEXT_PUBLIC_*` são visíveis no navegador; as demais são **somente de servidor**.

```
# Públicas
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
NEXT_PUBLIC_SENTRY_DSN=

# Servidor — Supabase e app
SUPABASE_SERVICE_ROLE_KEY=          # ou a secret key sb_secret_* do projeto; nunca no navegador
APP_URL=http://localhost:3000
CRON_SECRET=
DEVICE_SECRET_KEY=                  # AES-256-GCM (32 bytes em base64) para a senha do aparelho
DEVICE_SECRET_KEY_ID=

# Pix
PIX_PROVIDER=static                 # static | <provedor escolhido>
PIX_STATIC_KEY=
PIX_MERCHANT_NAME=
PIX_MERCHANT_CITY=
PIX_PROVIDER_CLIENT_ID=
PIX_PROVIDER_CLIENT_SECRET=
PIX_WEBHOOK_SECRET=

# WhatsApp (Cloud API oficial; só unidades habilitadas)
WHATSAPP_PROVIDER=none              # none | cloud_api
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_VERIFY_TOKEN=

# Mapas e geocodificação
GEOCODER_PROVIDER=
MAPS_API_KEY=

# Impressão silenciosa (QZ Tray)
QZ_CERTIFICATE=
QZ_PRIVATE_KEY=                     # PKCS#8, 2048 bits

# Anti-abuso, observabilidade e backup
TURNSTILE_SECRET_KEY=
SENTRY_DSN=
BACKUP_BUCKET=
BACKUP_ENCRYPTION_KEY=
```