-- Manually trigger the Daily Quiz Generation immediately
select
    net.http_post(
        url:='https://xmufhhfsaqtidszsrgfm.supabase.co/functions/v1/generate-daily-quiz',
        headers:='{"Content-Type": "application/json"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
