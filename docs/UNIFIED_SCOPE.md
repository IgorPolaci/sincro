# Escopo unificado

## Decisão de produto

O cliente opera dois segmentos dentro da mesma plataforma. Eles compartilham a organização, usuários autorizados, clientes e catálogo de produtos, mas cada segmento possui estoque e caixa próprios.

## Assistência Técnica

- equipamentos, marcas, modelos e serviços;
- ordem de serviço com entrada, defeito, avarias, acessórios, fotos e check-list;
- serviços e peças com baixa no estoque da Assistência Técnica;
- status configuráveis, laudo, orçamento, aprovação, garantia e retirada;
- faturamento, múltiplos pagamentos e documentos A4/58/80 mm;
- avisos de status por WhatsApp.

## Loja e Delivery

- PDV de balcão e pedidos por delivery/retirada/local;
- catálogo público, complementos, opções, carrinho e checkout;
- múltiplos pagamentos, Pix, troco, cupom e fidelidade;
- Kanban/KDS, áreas e taxas de entrega;
- baixa no estoque da Loja e Delivery;
- impressão automática de comandas.

## Compartilhado e consolidado

- clientes e endereços;
- produtos, categorias, marcas e fornecedores;
- usuários, papéis e permissões;
- contas a receber/pagar, auditoria, relatórios e exportações;
- visão por unidade e visão consolidada, sem somar fisicamente os estoques.

## Invariantes

- `organization_id` sempre é derivado da sessão e protegido por RLS.
- IDs de unidade recebidos do navegador são validados contra a organização autenticada.
- estoque nunca é atualizado sem movimento na mesma transação.
- cada sessão e movimento de caixa pertence exatamente a uma unidade.
- operações compartilhadas preservam a unidade de origem para conciliação e auditoria.

## Limites de integração

O sistema já possui os fluxos internos e pontos de extensão. Pix automático, WhatsApp automático, mapa de raio, impressão silenciosa via QZ Tray e backup externo exigem provedores, credenciais e/ou equipamento do cliente. Até essa configuração, Pix é registrado como forma de pagamento, WhatsApp abre uma conversa manual e a impressão usa o diálogo seguro do navegador.
