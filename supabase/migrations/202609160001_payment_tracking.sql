create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profils(id) on delete cascade,
  order_id text not null unique,
  provider_reference text unique,
  amount numeric(12, 2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  provider_payload jsonb,
  paid_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.payment_transactions enable row level security;

drop policy if exists "Les utilisateurs peuvent voir leurs paiements." on public.payment_transactions;

create policy "Les utilisateurs peuvent voir leurs paiements."
  on public.payment_transactions for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.finalize_payment(
  payment_reference text,
  payment_status text,
  payment_payload jsonb
)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  payment public.payment_transactions;
begin
  select * into payment
  from public.payment_transactions
  where provider_reference = payment_reference
  for update;

  if not found or payment.status = 'completed' then
    return false;
  end if;

  update public.payment_transactions
  set status = payment_status,
      provider_payload = payment_payload,
      paid_at = case when payment_status = 'completed' then coalesce(paid_at, now()) else paid_at end,
      updated_at = now()
  where id = payment.id;

  if payment_status = 'completed' then
    update public.profils
    set solde = solde + payment.amount
    where id = payment.user_id;
  end if;

  return true;
end;
$$;

revoke all on function public.finalize_payment(text, text, jsonb) from public;

do $$
begin
  if not exists (
    select 1
    from pg_publication p
    join pg_publication_rel pr on pr.prpubid = p.oid
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'profils'
  ) then
    alter publication supabase_realtime add table public.profils;
  end if;
end
$$;
