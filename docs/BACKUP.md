# Backup e restauração

Banco e Storage exigem rotinas separadas. Produção deve reter cópias diárias, semanais e mensais em destino externo, registrar cada execução em `backup_logs`, alertar falhas e executar restore drill periódico em ambiente isolado. A UI apenas consulta o histórico; não restaura produção.
