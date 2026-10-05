# Deploy

Ambientes separados: development, staging e production. Next.js é publicado na Vercel e dados/Auth/Storage no Supabase. Aplique migrations primeiro em staging, execute testes RLS e smoke tests, então promova a mesma versão para produção. Node.js 24 LTS é obrigatório.

Variáveis estão documentadas em `.env.example`. Configure secrets diretamente nos provedores e nunca os grave no Git.
