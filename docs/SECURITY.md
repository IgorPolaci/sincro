# Segurança

- RLS habilitada em todas as tabelas expostas.
- Organização derivada do usuário autenticado no banco.
- RBAC verificado por `has_permission` em policies e operações críticas.
- Service role apenas no servidor e nunca com prefixo `NEXT_PUBLIC_`.
- Entrada externa validada com Zod; mensagens internas não são exibidas ao usuário.
- Soft delete, auditoria, logs e backup preservam rastreabilidade.

Antes de produção: revisar policies com usuários de duas organizações, habilitar proteção de senhas vazadas/MFA conforme política da empresa e configurar rate limiting na borda.
