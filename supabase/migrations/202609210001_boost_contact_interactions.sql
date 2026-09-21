-- Mémorise les contacts WhatsApp déjà utilisés par chaque utilisateur.
-- Cette migration ajoute uniquement une nouvelle table : aucune donnée existante n'est modifiée ou supprimée.
create table if not exists public.boost_contact_interactions (
  user_id uuid not null references public.profils(id) on delete cascade,
  contact_key text not null,
  used_at timestamp with time zone not null default timezone('utc'::text, now()),
  primary key (user_id, contact_key),
  constraint boost_contact_interactions_contact_key_not_empty check (char_length(trim(contact_key)) > 0)
);

create index if not exists boost_contact_interactions_user_used_at_idx
  on public.boost_contact_interactions (user_id, used_at desc);

alter table public.boost_contact_interactions enable row level security;
grant select, insert, update on table public.boost_contact_interactions to authenticated;

drop policy if exists "Les utilisateurs peuvent voir leurs contacts boost utilisés." on public.boost_contact_interactions;
create policy "Les utilisateurs peuvent voir leurs contacts boost utilisés."
  on public.boost_contact_interactions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Les utilisateurs peuvent ajouter leurs contacts boost utilisés." on public.boost_contact_interactions;
create policy "Les utilisateurs peuvent ajouter leurs contacts boost utilisés."
  on public.boost_contact_interactions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Les utilisateurs peuvent mettre à jour leurs contacts boost utilisés." on public.boost_contact_interactions;
create policy "Les utilisateurs peuvent mettre à jour leurs contacts boost utilisés."
  on public.boost_contact_interactions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
