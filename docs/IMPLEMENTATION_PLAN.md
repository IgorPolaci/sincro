# Plano de implementação — sistema unificado

O Sincro atende, na mesma organização, dois segmentos do cliente: assistência técnica e loja/delivery. Clientes, catálogo, usuários e visão consolidada são compartilhados; estoque, vendas operacionais e caixa são sempre vinculados a uma unidade operacional. A regra norteadora é: nenhuma ação crítica pode causar perda de informação sem histórico, rastreabilidade ou recuperação.

## Unidades operacionais

- `Assistência Técnica`: ordens de serviço, equipamentos, serviços, peças, garantia, laudos e retirada.
- `Loja e Delivery`: PDV, catálogo online, pedidos, entrega, cupons e fidelidade.
- Cada unidade possui estoque e caixa independentes.
- A organização pode consolidar clientes, produtos, financeiro, auditoria e relatórios, sem misturar saldos operacionais.
- Após autenticar, o usuário escolhe o negócio que deseja operar. A navegação, o painel e os atalhos exibem somente os módulos relevantes ao segmento selecionado.

## Fases de execução

| Fase | Entrega | Critério de saída |
|---|---|---|
| 0 | Next.js, TypeScript, qualidade, Supabase, CI e documentação | aplicação compila e pipeline passa |
| 1 | organizações, unidades operacionais, perfis, autenticação e RBAC/RLS | usuário ativo acessa apenas sua organização e unidades válidas |
| 2 | clientes, endereços, fornecedores, catálogo, lixeira e auditoria | cadastros compartilhados com CRUD e recuperação |
| 3 | estoque independente por unidade e transferências | todo saldo pertence a uma unidade e toda alteração gera movimento |
| 4 | caixas independentes, abertura, suprimento, sangria e fechamento | sessões conciliáveis e auditadas por unidade |
| 5 | equipamentos, serviços, check-lists e configurações de O.S. | cadastros técnicos completos |
| 6 | O.S., fotos, peças, laudo, garantia, faturamento e retirada | ciclo técnico completo e rastreável |
| 7 | impressão A4/58/80 mm e comunicação por WhatsApp | documentos e avisos reproduzíveis e auditados |
| 8 | PDV, múltiplos pagamentos, Pix, cancelamento e estorno | venda transacional baixa o estoque da unidade correta |
| 9 | catálogo público, carrinho, checkout, Kanban e delivery | pedido online percorre o fluxo até entrega/retirada |
| 10 | cupons, fidelidade, áreas/taxas de entrega e impressão automática | operação comercial completa |
| 11 | financeiro consolidado, KPIs, relatórios e exportações | visão por unidade e consolidada, com exportação auditada |
| 12 | importação, backup, restore drill e homologação | recuperação real e cenários críticos aprovados |

## Estado em 11/10/2026

- Concluído: fundação, autenticação/RLS, unidades, cadastros principais, estoques e caixas separados.
- Concluído: O.S. operacional, fotos, check-list, peças, documentos, faturamento e estorno transacionais.
- Concluído: PDV, pagamentos combinados, cancelamento, orçamentos e conversão em venda.
- Concluído: gerenciamento do e-commerce com publicação independente do cadastro-base, categorias, conteúdo comercial, preço online, promoções agendadas, fotos, logo, banner, destaques, SEO, complementos e limites por pedido.
- Concluído: catálogo público responsivo, busca/filtros, carrinho por variação, checkout, reserva de estoque, pedidos/Kanban, áreas, taxas, cupons e fidelidade por entrega.
- Concluído: transferência entre estoques, indicadores e exportação CSV auditada.
- Concluído: recuperação de senha, headers de proteção, boundaries de erro/carregamento, health check e limite de tentativas para login, recuperação e checkout.
- Concluído: massa de demonstração idempotente e auditada, disponível em `/configuracoes/demonstracao`.
- Integrações externas pendentes de credenciais/hardware: Pix com QR dinâmico e confirmação por webhook, envio automático pela API oficial do WhatsApp, mapas/geocodificação, QZ Tray e rotina externa de backup/restore.
- Homologação pendente: cenários reais do cliente, impressoras físicas e restore drill no ambiente de produção.

## Definition of Done

Código tipado, validação, autenticação/autorização, RLS, estados de UI, erros seguros, auditoria aplicável, testes, lint, typecheck, build e documentação.

## Ordem obrigatória

Segurança → unidades operacionais → dados compartilhados → estoques/caixas separados → assistência técnica → PDV/delivery → financeiro consolidado → relatórios → automações.
