-- Souscription atomique des forfaits de contacts WhatsApp.
create or replace function public.subscribe_contact_boost(
  target_user_id uuid,
  target_sector text,
  contact_count integer,
  boost_cost numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  user_profile public.profils;
  expected_cost numeric(12, 2);
begin
  if auth.uid() is null or auth.uid() <> target_user_id then
    return jsonb_build_object('success', false, 'message', 'Vous n''êtes pas autorisé à effectuer cette souscription.');
  end if;

  expected_cost := case contact_count
    when 300 then 100
    when 1300 then 200
    when 15000 then 300
    when 31000 then 1000
    when 10000 then 2100
    else null
  end;

  if expected_cost is null or boost_cost <> expected_cost then
    return jsonb_build_object('success', false, 'message', 'Forfait de contacts invalide.');
  end if;

  select * into user_profile
  from public.profils
  where id = target_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Profil introuvable.');
  end if;

  if coalesce(user_profile.solde, 0) < expected_cost then
    return jsonb_build_object('success', false, 'message', format('Solde insuffisant. Il vous faut %s F CFA.', expected_cost));
  end if;

  update public.profils
  set solde = coalesce(solde, 0) - expected_cost
  where id = target_user_id;

  return jsonb_build_object('success', true, 'message', 'Forfait de contacts souscrit avec succès.', 'new_solde', user_profile.solde - expected_cost, 'sector', target_sector, 'contact_count', contact_count);
end;
$$;

revoke all on function public.subscribe_contact_boost(uuid, text, integer, numeric) from public;
grant execute on function public.subscribe_contact_boost(uuid, text, integer, numeric) to authenticated;