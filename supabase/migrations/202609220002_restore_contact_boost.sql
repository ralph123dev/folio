-- Permet au dashboard de restaurer le dernier forfait contacts de l'utilisateur.
create or replace function public.get_my_contact_boost_subscription()
returns table (sector text, contact_count integer)
language sql
security definer
set search_path = public
as $$
  select s.sector, s.contact_count
  from public.contact_boost_subscriptions s
  where s.user_id = auth.uid()
  order by s.created_at desc
  limit 1;
$$;

revoke all on function public.get_my_contact_boost_subscription() from public;
grant execute on function public.get_my_contact_boost_subscription() to authenticated;
