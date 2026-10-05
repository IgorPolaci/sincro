# Banco de dados

As migrations em `supabase/migrations` são a fonte de verdade. Chaves são UUID; valores monetários usam `numeric(14,2)`; entidades operacionais usam soft delete. Índices compostos começam por `organization_id`.

Estoque e venda não são alterados por múltiplas chamadas do cliente: funções PostgreSQL bloqueiam linhas relevantes e confirmam tudo em uma transação.
