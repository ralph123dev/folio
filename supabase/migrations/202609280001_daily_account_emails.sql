create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.daily_account_email_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  opted_in boolean not null default false,
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  last_sent_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daily_account_email_preferences enable row level security;
grant select on public.daily_account_email_preferences to authenticated;

drop policy if exists "Users can read their daily email preference" on public.daily_account_email_preferences;
create policy "Users can read their daily email preference"
  on public.daily_account_email_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.set_daily_account_email_preference(p_opted_in boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.';
  end if;

  insert into public.daily_account_email_preferences (user_id, opted_in)
  values (auth.uid(), p_opted_in)
  on conflict (user_id) do update
    set opted_in = excluded.opted_in,
        updated_at = now();
end;
$$;

revoke all on function public.set_daily_account_email_preference(boolean) from public;
grant execute on function public.set_daily_account_email_preference(boolean) to authenticated;

select cron.unschedule(jobid)
from cron.job
where jobname = 'daily-account-email-africa-douala';

select cron.schedule(
  'daily-account-email-africa-douala',
  '31 18 * * *',
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