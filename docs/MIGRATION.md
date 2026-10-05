# Migração

Fluxo: exportar → armazenar original imutável → normalizar → validar → preview → importar em staging → reconciliar contagens e totais → importar em produção com janela aprovada. Registros inválidos nunca são ignorados; retornam linha, campo, código e mensagem.
