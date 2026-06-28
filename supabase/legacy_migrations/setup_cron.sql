-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule the job (Updates existing job if name 'generate-daily-quiz' matches)
-- Time: 22:30 UTC = 4:00 AM IST
select cron.schedule(
  'generate-daily-quiz',
  '30 22 * * *',
  $$
    select
      net.http_post(
          url:='https://xmufhhfsaqtidszsrgfm.supabase.co/functions/v1/generate-daily-quiz',
          headers:='{"Content-Type": "application/json"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
  $$
);

-- Verify the schedule
select * from cron.job;
