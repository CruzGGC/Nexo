-- Migration: Schedule Daily Crossword Generation
-- This creates a cron job that runs the generate-daily-crossword Edge Function
-- at midnight Portugal time (Europe/Lisbon timezone)

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the daily crossword generation
-- Runs at 00:00 (midnight) Portugal time
-- Note: Store your PROJECT_URL and ANON_KEY in Supabase Vault for security
SELECT cron.schedule(
  'generate-daily-crossword',
  '0 0 * * *', -- Every day at midnight
  $$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') 
        || '/functions/v1/generate-daily-crossword',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
      ),
      body := jsonb_build_object(
        'timestamp', NOW(),
        'timezone', 'Europe/Lisbon'
      ),
      timeout_milliseconds := 60000 -- 60 second timeout
    ) as request_id;
  $$
);

-- Verify the cron job was created
-- SELECT * FROM cron.job WHERE jobname = 'generate-daily-crossword';

-- To manually trigger the function for testing:
-- SELECT net.http_post(
--   url := 'https://your-project.supabase.co/functions/v1/generate-daily-crossword',
--   headers := '{"Content-Type":"application/json","Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
--   body := '{"test": true}'::jsonb
-- );

-- To unschedule (if needed):
-- SELECT cron.unschedule('generate-daily-crossword');
