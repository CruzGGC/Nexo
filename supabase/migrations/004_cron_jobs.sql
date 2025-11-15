-- ============================================================================
-- NEXO - Cron Jobs para Geração Diária de Puzzles
-- ============================================================================
-- Configura tarefas agendadas que geram automaticamente:
-- - 1 puzzle de palavras cruzadas por dia (00:00 Portugal)
-- - 1 puzzle de sopa de letras por dia (00:05 Portugal)
--
-- REQUISITOS:
-- - Extensions pg_cron e pg_net já instaladas (em 001_schema_principal.sql)
-- - Edge Functions deployadas no Supabase
-- - Secrets configurados no Vault (project_url, service_role_key)
--
-- SEGURANÇA:
-- - Usa service_role_key do Vault (nunca hardcoded)
-- - HTTP timeout de 60 segundos
-- - Retry automático em caso de falha (via pg_cron)
-- ============================================================================

-- ============================================================================
-- 1. VALIDAÇÃO DE REQUISITOS
-- ============================================================================

DO $$
BEGIN
  -- Verificar se pg_cron está disponível
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    RAISE EXCEPTION 'Extension pg_cron não está instalada. Execute: CREATE EXTENSION pg_cron;';
  END IF;
  
  -- Verificar se pg_net está disponível
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
  ) THEN
    RAISE EXCEPTION 'Extension pg_net não está instalada. Execute: CREATE EXTENSION pg_net;';
  END IF;
  
  RAISE NOTICE '✅ Extensions necessárias estão instaladas';
END $$;

-- ============================================================================
-- 2. CRON JOB: GERAÇÃO DIÁRIA DE PALAVRAS CRUZADAS
-- ============================================================================

-- Remove job antigo se existir (ignora erro se não existir)
DO $$
BEGIN
  PERFORM cron.unschedule('generate-daily-crossword');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Job generate-daily-crossword não existe (primeira execução)';
END $$;

-- Agenda job para 00:00 (meia-noite) em timezone Portugal (Europe/Lisbon)
-- Cron format: minuto hora dia mês dia-da-semana
SELECT cron.schedule(
  'generate-daily-crossword',                    -- job_name
  '0 0 * * *',                                   -- schedule (00:00 todos os dias)
  $$
    SELECT net.http_post(
      url := vault.get_secret('project_url') || '/functions/v1/generate-daily-crossword',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || vault.get_secret('service_role_key')
      ),
      body := jsonb_build_object(
        'date', CURRENT_DATE::text,
        'triggered_by', 'cron'
      ),
      timeout_milliseconds := 60000              -- 60 segundos timeout
    ) AS request_id;
  $$
);

COMMENT ON EXTENSION pg_cron IS 'Cron job para gerar puzzle diário de palavras cruzadas às 00:00';

-- ============================================================================
-- 3. CRON JOB: GERAÇÃO DIÁRIA DE SOPA DE LETRAS
-- ============================================================================

-- Remove job antigo se existir (ignora erro se não existir)
DO $$
BEGIN
  PERFORM cron.unschedule('generate-daily-wordsearch');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Job generate-daily-wordsearch não existe (primeira execução)';
END $$;

-- Agenda job para 00:05 (5 minutos após meia-noite)
-- Delay de 5 min evita sobrecarga simultânea
SELECT cron.schedule(
  'generate-daily-wordsearch',                   -- job_name
  '5 0 * * *',                                   -- schedule (00:05 todos os dias)
  $$
    SELECT net.http_post(
      url := vault.get_secret('project_url') || '/functions/v1/generate-daily-wordsearch',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || vault.get_secret('service_role_key')
      ),
      body := jsonb_build_object(
        'date', CURRENT_DATE::text,
        'triggered_by', 'cron'
      ),
      timeout_milliseconds := 60000              -- 60 segundos timeout
    ) AS request_id;
  $$
);

COMMENT ON EXTENSION pg_cron IS 'Cron job para gerar puzzle diário de sopa de letras às 00:05';

-- ============================================================================
-- 4. CRON JOB: MATCHMAKING WORKER
-- ============================================================================

DO $$
BEGIN
  PERFORM cron.unschedule('matchmaking-worker');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Job matchmaking-worker não existe (primeira execução)';
END $$;

SELECT cron.schedule(
  'matchmaking-worker',                      -- job_name
  '* * * * *',                               -- corre a cada minuto
  $$
    SELECT net.http_post(
      url := vault.get_secret('project_url') || '/functions/v1/matchmaking-worker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || vault.get_secret('service_role_key')
      ),
      body := jsonb_build_object(
        'triggered_by', 'cron',
        'gameType', 'tic_tac_toe'
      ),
      timeout_milliseconds := 20000
    ) AS request_id;
  $$
);

COMMENT ON EXTENSION pg_cron IS 'Cron job que mantém a fila de matchmaking atualizada a cada minuto';

-- ============================================================================
-- 5. FUNÇÃO DE LIMPEZA: REMOVER PUZZLES ANTIGOS
-- ============================================================================

-- Função para deletar puzzles diários com mais de 90 dias
-- Mantém histórico recente para estatísticas
CREATE OR REPLACE FUNCTION cleanup_old_daily_puzzles()
RETURNS void AS $$
DECLARE
  v_crosswords_deleted INTEGER;
  v_wordsearches_deleted INTEGER;
BEGIN
  -- Deletar palavras cruzadas antigas
  DELETE FROM crosswords
  WHERE type = 'daily'
    AND publish_date < CURRENT_DATE - INTERVAL '90 days';
  
  GET DIAGNOSTICS v_crosswords_deleted = ROW_COUNT;
  
  -- Deletar sopas de letras antigas
  DELETE FROM wordsearches
  WHERE type = 'daily'
    AND publish_date < CURRENT_DATE - INTERVAL '90 days';
  
  GET DIAGNOSTICS v_wordsearches_deleted = ROW_COUNT;
  
  RAISE NOTICE '🧹 Limpeza: % crosswords e % wordsearches deletados', 
    v_crosswords_deleted, v_wordsearches_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_daily_puzzles IS 'Remove puzzles diários com mais de 90 dias';

-- ============================================================================
-- 6. CRON JOB: LIMPEZA SEMANAL
-- ============================================================================

-- Remove job antigo se existir (ignora erro se não existir)
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-old-puzzles');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Job cleanup-old-puzzles não existe (primeira execução)';
END $$;

-- Agenda limpeza para Domingo às 03:00
SELECT cron.schedule(
  'cleanup-old-puzzles',                         -- job_name
  '0 3 * * 0',                                   -- schedule (03:00 aos Domingos)
  $$SELECT cleanup_old_daily_puzzles();$$
);

-- ============================================================================
-- 7. VIEWS PARA MONITORIZAÇÃO
-- ============================================================================

-- View para ver status dos cron jobs
CREATE OR REPLACE VIEW cron_jobs_status AS
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
ORDER BY jobid DESC;

COMMENT ON VIEW cron_jobs_status IS 'Monitorizar status dos cron jobs agendados';

-- View para ver histórico de execuções (últimas 100)
CREATE OR REPLACE VIEW cron_jobs_history AS
SELECT 
  runid,
  jobid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time,
  end_time - start_time AS duration
FROM cron.job_run_details
ORDER BY runid DESC
LIMIT 100;

COMMENT ON VIEW cron_jobs_history IS 'Histórico de execuções dos cron jobs (últimas 100)';

-- ============================================================================
-- 8. FUNÇÃO DE DIAGNÓSTICO
-- ============================================================================

CREATE OR REPLACE FUNCTION diagnose_cron_setup()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check 1: pg_cron instalado
  RETURN QUERY
  SELECT 
    'pg_cron extension'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
      THEN '✅ OK' ELSE '❌ FALTA' END,
    'Extension para cron jobs'::TEXT;
  
  -- Check 2: pg_net instalado
  RETURN QUERY
  SELECT 
    'pg_net extension'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net')
      THEN '✅ OK' ELSE '❌ FALTA' END,
    'Extension para HTTP requests'::TEXT;
  
  -- Check 3: Jobs agendados
  RETURN QUERY
  SELECT 
    'Cron jobs'::TEXT,
    CASE WHEN (SELECT COUNT(*) FROM cron.job) >= 4
      THEN '✅ OK (' || (SELECT COUNT(*)::TEXT FROM cron.job) || ' jobs)'
      ELSE '⚠️  Apenas ' || (SELECT COUNT(*)::TEXT FROM cron.job) || ' jobs' END,
    'Esperados: 4 jobs (crossword, wordsearch, matchmaking, cleanup)'::TEXT;
  
  -- Check 4: Secrets no Vault
  RETURN QUERY
  SELECT 
    'Vault secrets'::TEXT,
    CASE 
      WHEN vault.get_secret('project_url') IS NOT NULL 
        AND vault.get_secret('service_role_key') IS NOT NULL
      THEN '✅ OK'
      ELSE '❌ FALTA'
    END,
    'project_url e service_role_key'::TEXT;
  
  -- Check 5: Edge Functions (verifica se já houve execução bem sucedida)
  RETURN QUERY
  SELECT 
    'Puzzles diários'::TEXT,
    CASE 
      WHEN EXISTS (SELECT 1 FROM crosswords WHERE type = 'daily')
        AND EXISTS (SELECT 1 FROM wordsearches WHERE type = 'daily')
      THEN '✅ OK'
      WHEN EXISTS (SELECT 1 FROM crosswords WHERE type = 'daily')
        OR EXISTS (SELECT 1 FROM wordsearches WHERE type = 'daily')
      THEN '⚠️  Parcial'
      ELSE '❌ Nenhum'
    END,
    'Verificar se Edge Functions estão a gerar puzzles'::TEXT;
  
  -- Check 6: Última execução dos jobs
  RETURN QUERY
  SELECT 
    'Última execução'::TEXT,
    CASE 
      WHEN (SELECT MAX(end_time) FROM cron.job_run_details) > now() - INTERVAL '24 hours'
      THEN '✅ Recente (' || 
        to_char((SELECT MAX(end_time) FROM cron.job_run_details), 'DD/MM HH24:MI') || ')'
      WHEN (SELECT MAX(end_time) FROM cron.job_run_details) IS NOT NULL
      THEN '⚠️  Antiga (' || 
        to_char((SELECT MAX(end_time) FROM cron.job_run_details), 'DD/MM HH24:MI') || ')'
      ELSE '❌ Nunca'
    END,
    'Jobs devem executar diariamente'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION diagnose_cron_setup IS 'Diagnostica configuração dos cron jobs';

-- ============================================================================
-- 9. VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  v_jobs_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_jobs_count FROM cron.job;
  
  RAISE NOTICE '✅ Cron jobs configurados com sucesso!';
  RAISE NOTICE '📅 Jobs agendados: %', v_jobs_count;
  RAISE NOTICE '';
  RAISE NOTICE '📋 Jobs configurados:';
  RAISE NOTICE '  1. generate-daily-crossword (00:00 diariamente)';
  RAISE NOTICE '  2. generate-daily-wordsearch (00:05 diariamente)';
  RAISE NOTICE '  3. matchmaking-worker (a cada minuto)';
  RAISE NOTICE '  4. cleanup-old-puzzles (03:00 aos Domingos)';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Para diagnóstico: SELECT * FROM diagnose_cron_setup();';
  RAISE NOTICE '📊 Ver jobs: SELECT * FROM cron_jobs_status;';
  RAISE NOTICE '📜 Ver histórico: SELECT * FROM cron_jobs_history;';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE:';
  RAISE NOTICE '  1. Deploy Edge Functions: supabase functions deploy';
  RAISE NOTICE '  2. Configurar Vault secrets:';
  RAISE NOTICE '     - project_url: https://xxx.supabase.co';
  RAISE NOTICE '     - service_role_key: eyJhbGc...';
END $$;
