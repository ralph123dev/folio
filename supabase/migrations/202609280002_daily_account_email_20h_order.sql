alter table public.daily_account_email_preferences
  add column if not exists last_attempt_on date;

select cron.unschedule(jobid)
from cron.job
where jobname = 'daily-account-email-africa-douala';

select cron.schedule(
  'daily-account-email-africa-douala',
  '* 19 * * *',
  $$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'daily_account_email_project_url'
        limit 1
      ) || '/functions/v1/daily-account-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'daily_account_email_cron_secret'
          limit 1
        )
      ),
      body := '{}'::jsonb
    );
  $$
);