# Banco de dados

As migrations em `supabase/migrations` são a fonte de verdade. Chaves são UUID; valores monetários usam `numeric(14,2)`; entidades operacionais usam soft delete. Índices compostos começam por `organization_id`.

Estoque e caixa pertencem a uma unidade operacional (`Assistência Técnica` ou `Loja e Delivery`). Clientes e catálogo são compartilhados pela organização, mas saldos nunca são misturados entre segmentos.

Estoque, venda e faturamento de ordem de serviço não são alterados por múltiplas chamadas do cliente: funções PostgreSQL bloqueiam linhas relevantes e confirmam tudo em uma transação. Peças de O.S. são baixadas no faturamento e devolvidas pela mesma transação em cancelamentos ou estornos.

Pedidos públicos não recebem acesso direto às tabelas: RPCs de catálogo e checkout expõem somente os campos necessários. O checkout cria reservas temporárias; a confirmação converte a reserva em movimento de estoque, e o cancelamento faz a reversão apropriada.

O cadastro fiscal de `products` permanece compartilhado, enquanto `ecommerce_products` é a camada de publicação da unidade Loja/Delivery. Ela controla nome comercial, slug, conteúdo, preço online, promoção, disponibilidade por modalidade e limite por pedido. Imagens e identidade visual ficam no bucket público `storefront-assets`; a escrita exige usuário autenticado da organização com permissão de delivery. Grupos e opções são validados novamente dentro da função transacional de checkout e gravados como snapshot no item do pedido.

Vendas, delivery, O.S. e contas a pagar registram movimentos de caixa apenas para numerário físico. Transferências entre unidades geram um movimento de saída e outro de entrada com a mesma referência. Exportações de relatório registram filtros e usuário em `audit_logs`.
