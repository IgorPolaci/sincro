# Plano de implementação

Este projeto implementa a especificação mestre fornecida para a plataforma Sincro. A regra norteadora é: nenhuma ação crítica pode causar perda de informação sem histórico, rastreabilidade ou recuperação.

## Fases de execução

| Fase | Entrega | Critério de saída |
|---|---|---|
| 0 | Next.js, TypeScript, qualidade, Supabase, CI e documentação | aplicação compila e pipeline passa |
| 1 | organizações, perfis, autenticação, RBAC/RLS e shell | usuário ativo acessa apenas sua organização |
| 2 | clientes, endereços, busca, lixeira e auditoria | CRUD com soft delete e restauração |
| 3 | fornecedores, categorias, marcas, produtos e imagens | catálogo íntegro e isolado por organização |
| 4 | saldo e movimentos de estoque | toda alteração é atômica e rastreável |
| 5 | orçamentos, itens e conversão | preços históricos preservados |
| 6 | vendas, itens, pagamentos e cancelamento | conclusão/cancelamento são transacionais |
| 7 | contas a receber/pagar e fluxo de caixa | financeiro conciliável e auditável |
| 8 | KPIs, relatórios e exportações | consultas paginadas e exportações auditadas |
| 9 | importação e migração | preview, validação e relatório de erros |
| 10 | backup de banco/storage, logs e restore drill | restauração real documentada e testada |
| 11 | homologação ponta a ponta e produção | cenários críticos aprovados |

## Definition of Done

Código tipado, validação, autenticação/autorização, RLS, estados de UI, erros seguros, auditoria aplicável, testes, lint, typecheck, build e documentação.

## Ordem obrigatória

Segurança → dados → clientes → produtos → estoque → orçamento → vendas → financeiro → relatórios → automações.
