-- Credit the user balance exactly once for every successful payment.
-- Safe to run more than once.

alter table public.payment_transactions
  add column if not exists balance_credited boolean not null default false;

create or replace function public.finalize_payment(
  payment_reference text,
  payment_status text,
  payment_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  payment public.payment_transactions;
  normalized_status text := lower(trim(payment_status));
begin
  select * into payment
  from public.payment_transactions
  where provider_reference = payment_reference
  for update;

  if not found then
    return false;
  end if;

  if normalized_status in ('success', 'succeeded', 'successful', 'completed', 'paid', 'payment_success') then
    normalized_status := 'completed';
  elsif normalized_status in ('failed', 'failure', 'cancelled', 'canceled', 'payment_failed') then
    normalized_status := 'failed';
  elsif normalized_status not in ('pending', 'refunded') then
    normalized_status := 'pending';
  end if;

  if normalized_status = 'completed' and not payment.balance_credited then
    update public.profils
    set solde = coalesce(solde, 0) + payment.amount
    where id = payment.user_id;

    if not found then
      raise exception 'Profil introuvable pour le paiement %', payment_reference;
    end if;

    update public.payment_transactions
    set status = 'completed',
        balance_credited = true,
        provider_payload = payment_payload,
        paid_at = coalesce(paid_at, now()),
        updated_at = now()
    where id = payment.id;
  elsif payment.status <> normalized_status or payment_payload is not null then
    update public.payment_transactions
    set status = normalized_status,
        provider_payload = coalesce(payment_payload, provider_payload),
        paid_at = case when normalized_status = 'completed' then coalesce(paid_at, now()) else paid_at end,
        updated_at = now()
    where id = payment.id;
  end if;

  return true;
end;
$$;

revoke all on function public.finalize_payment(text, text, jsonb) from public;

-- Optional repair for payments already confirmed by SasPay but still pending.
-- Review the rows first, then run the SELECT below once if needed:
-- select id, provider_reference, user_id, amount, status, balance_credited
-- from public.payment_transactions
-- where status = 'pending';
--
-- select public.finalize_payment(provider_reference, 'completed', provider_payload)
-- from public.payment_transactions
-- where id = 'REPLACE_WITH_THE_CONFIRMED_PAYMENT_ID';
