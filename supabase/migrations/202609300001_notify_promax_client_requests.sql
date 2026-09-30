create or replace function public.notify_promax_client_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  project_url text;
  cron_secret text;
begin
  select decrypted_secret into project_url
  from vault.decrypted_secrets
  where name = 'daily_account_email_project_url'
  limit 1;

  select decrypted_secret into cron_secret
  from vault.decrypted_secrets
  where name = 'daily_account_email_cron_secret'
  limit 1;

  if project_url is null or cron_secret is null then
    raise warning 'Notification Pro Max ignorée : secrets Vault e-mail quotidien manquants.';
    return new;
  end if;

  perform net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/notify-promax-client-request',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', cron_secret
    ),
    body := jsonb_build_object('request_id', new.id)
  );

  return new;
end;
$$;

drop trigger if exists notify_promax_client_request on public.client_requests;
create trigger notify_promax_client_request
  after insert on public.client_requests
  for each row execute function public.notify_promax_client_request();