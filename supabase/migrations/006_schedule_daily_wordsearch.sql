-- Migration: 006_schedule_daily_wordsearch.sql
-- Descrição: Configura cron job para gerar puzzle diária de Sopa de Letras
-- Executa todos os dias à meia-noite (00:00) no timezone de Portugal

-- Agendar job de geração diária de wordsearch
-- IMPORTANTE: Substituir <PROJECT_URL> pela URL real do projeto Supabase
-- IMPORTANTE: Substituir <SERVICE_ROLE_KEY> pela chave service_role do Vault
SELECT cron.schedule(
  'generate-daily-wordsearch',
  '0 0 * * *', -- Todos os dias à meia-noite (Portugal time)
  $$
  SELECT
    net.http_post(
      url := '<PROJECT_URL>/functions/v1/generate-daily-wordsearch',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    ) AS request_id;
  $$
);

-- Verificar job criado:
-- SELECT * FROM cron.job WHERE jobname = 'generate-daily-wordsearch';

-- Para remover o job (se necessário):
-- SELECT cron.unschedule('generate-daily-wordsearch');

-- PASSOS PARA DEPLOYMENT:
-- 1. Deploy Edge Function: supabase functions deploy generate-daily-wordsearch
-- 2. Adicionar ao Vault: project_url e service_role_key
-- 3. Substituir placeholders neste SQL
-- 4. Executar migration no Supabase Dashboard
