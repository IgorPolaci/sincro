# Checklist de publicação

## Itens bloqueantes

- [ ] Variáveis públicas e `APP_URL` configuradas no ambiente de produção.
- [ ] `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` configurada igualmente em todas as instâncias.
- [ ] URLs de Site e Redirect do Supabase Auth apontam para o domínio HTTPS final.
- [ ] Migrações aplicadas e conferidas com `supabase migration list --linked`.
- [ ] RLS/SQL validados com `supabase test db` em ambiente com Docker.
- [ ] `npm run verify` e `npm run test:e2e` aprovados no commit de release.
- [ ] `npm audit --omit=dev` sem vulnerabilidades de runtime.
- [ ] Backup gerenciado do Supabase habilitado e teste de restauração documentado em staging.
- [ ] Monitoramento de disponibilidade do endpoint `/api/health` configurado.

## Operação

- [ ] Administração carregou a massa de apresentação, se desejada, em `/configuracoes/demonstracao`.
- [ ] Usuários, perfis e permissões foram revisados por organização.
- [ ] Foram conferidos os saldos por unidade e não existe caixa aberto indevidamente.
- [ ] Foram treinados os fluxos de O.S., venda, pedido e fechamento de caixa.

## Fora deste deploy

Pix, WhatsApp, mapas/geocodificação e QZ Tray exigem credenciais, contratos ou hardware e permanecem deliberadamente desabilitados.
