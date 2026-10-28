# Auditoria de implementação — 2026-10-11

## Baseline

`npm run verify` foi executado antes das alterações: lint, TypeScript, 25 testes unitários e build estavam aprovados. A suíte E2E existente cobria somente os campos da tela de login em desktop e mobile.

## Conclusões

O núcleo operacional já existe: duas unidades, estoque/caixa separados, O.S., PDV, pedidos online, catálogo, cupons, transferências, financeiro e exportação. As lacunas mais relevantes do `planodeimplementacao.md` concentram-se em endurecimento de segurança, testes de banco e E2E, operação assíncrona, cadastros avançados e integrações externas.

| Área | Situação | Evidência |
| --- | --- | --- |
| Estoque, venda e O.S. transacionais | Parcialmente concluída | Migrations de estoque, vendas e faturamento; funções SQL transacionais |
| E-commerce e checkout | Concluído no MVP | `202610070003` a `202610070009`, `features/delivery` e `features/ecommerce` |
| Recuperação de senha | Concluído nesta entrega | `/auth/confirm`, `/redefinir-senha` |
| Headers e erro/carregamento | Concluído nesta entrega | `next.config.ts`, boundaries em `src/app` |
| Anti-abuso e health check | Concluído nesta entrega | `202610110001_rate_limit_and_health.sql`, `src/lib/rate-limit.ts`, `/api/health` |
| Massa de demonstração | Concluído, acionamento por administrador | `202610110002_demo_data.sql`, `/configuracoes/demonstracao` |
| Tipos gerados do Supabase, cobertura, pgTAP e E2E de jornadas | Pendente | Não há tipos gerados, testes `supabase/tests` ou jornadas além de login |
| Gestão de usuários/funcionários, cadastros auxiliares, contas a receber, devoluções, inventário/compras | Pendente | Rotas e migrations não localizadas |
| Pix real, WhatsApp Cloud, mapas/geocodificação, QZ Tray | Dependem de credenciais/hardware | Variáveis documentadas; nenhum provedor configurado |
| Backup/restore, importação assíncrona, produção/staging | Dependem de infraestrutura | Telas atuais são apenas iniciais |

## Riscos que permanecem

- A suíte de banco/RLS e as jornadas E2E completas ainda precisam ser criadas antes de go-live.
- O módulo existente `src/services/auth-audit.ts` usa uma chave de serviço para auditar login. Ele deve ser substituído por uma RPC mínima antes de produção, para cumprir integralmente a regra de não contornar RLS.
- Integrações com provedores não foram simuladas como se fossem reais: elas exigem as respectivas credenciais e homologação do cliente.

## Massa de apresentação

Um administrador deve abrir `/configuracoes/demonstracao` e acionar **Carregar dados de demonstração**. A carga é idempotente e adiciona, sem apagar dados existentes: seis clientes, oito produtos, saldos nas duas unidades acompanhados de movimentações, catálogo publicado, cupons e áreas de entrega.
