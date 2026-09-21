-- Public SEO fields for freelancer profile routes.
-- This migration is additive: no existing profile, rating or private account data is removed.

alter table public.freelancers
  add column if not exists slug text,
  add column if not exists localisation text,
  add column if not exists specialite_slug text,
  add column if not exists localisation_slug text,
  add column if not exists prix_a_partir_de numeric(12, 2),
  add column if not exists devise text not null default 'XAF',
  add column if not exists seo_published boolean not null default true,
  add column if not exists updated_at timestamp with time zone not null default timezone('utc'::text, now());

-- A deterministic ASCII slug keeps URLs stable and avoids depending on the
-- private `profils` table for a freelancer's public location.
create or replace function public.folio_slugify(value text)
returns text
language sql
immutable
strict
as $$
  select coalesce(
    nullif(
      trim(both '-' from regexp_replace(
        translate(lower(value),
          'àáâäãåæçèéêëìíîïñòóôöõøœùúûüýÿ',
          'aaaaaaaceeeeiiiinooooooouuuuyy'),
        '[^a-z0-9]+', '-', 'g'
      )),
      ''
    ),
    'en-ligne'
  );
$$;

create or replace function public.set_freelancer_seo_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  canonical_name text;
begin
  canonical_name := coalesce(nullif(trim(new.nom_freelancer), ''), concat_ws(' ', new.prenom, new.nom), 'freelancer');
  new.localisation := coalesce(nullif(trim(new.localisation), ''), 'En ligne');
  new.specialite_slug := public.folio_slugify(coalesce(new.activite, 'freelance'));
  new.localisation_slug := public.folio_slugify(new.localisation);

  -- The short UUID suffix guarantees uniqueness even for identical names.
  if tg_op = 'INSERT'
    or old.nom_freelancer is distinct from new.nom_freelancer
    or old.slug is null
    or btrim(old.slug) = '' then
    new.slug := public.folio_slugify(canonical_name) || '-' || left(new.id::text, 8);
  end if;

  new.devise := coalesce(nullif(upper(trim(new.devise)), ''), 'XAF');
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists set_freelancer_seo_fields on public.freelancers;
create trigger set_freelancer_seo_fields
  before insert or update of nom_freelancer, nom, prenom, activite, localisation, slug, devise
  on public.freelancers
  for each row execute function public.set_freelancer_seo_fields();

-- Backfill records before constraining and indexing the public route fields.
update public.freelancers
set localisation = coalesce(nullif(trim(localisation), ''), 'En ligne'),
    specialite_slug = public.folio_slugify(coalesce(activite, 'freelance')),
    localisation_slug = public.folio_slugify(coalesce(nullif(trim(localisation), ''), 'En ligne')),
    slug = public.folio_slugify(coalesce(nullif(trim(nom_freelancer), ''), concat_ws(' ', prenom, nom), 'freelancer')) || '-' || left(id::text, 8),
    devise = coalesce(nullif(upper(trim(devise)), ''), 'XAF'),
    updated_at = coalesce(updated_at, timezone('utc'::text, now()))
where slug is null
   or btrim(slug) = ''
   or localisation is null
   or btrim(localisation) = ''
   or specialite_slug is null
   or localisation_slug is null;

alter table public.freelancers
  alter column slug set not null,
  alter column localisation set not null,
  alter column specialite_slug set not null,
  alter column localisation_slug set not null;

create unique index if not exists freelancers_slug_key on public.freelancers (slug);
create index if not exists freelancers_seo_route_idx
  on public.freelancers (specialite_slug, localisation_slug, slug)
  where seo_published = true;
create index if not exists freelancers_seo_updated_at_idx
  on public.freelancers (updated_at desc)
  where seo_published = true;

-- The original public SELECT policy remains valid. This view deliberately
-- exposes only the fields needed by public profile pages and sitemap jobs.
create or replace view public.public_freelancer_profiles
with (security_invoker = true)
as
select
  id,
  nom,
  prenom,
  nom_freelancer,
  photo_url,
  activite,
  description,
  annees_experience,
  site_web,
  whatsapp,
  telegram,
  facebook,
  instagram,
  linkedin,
  twitter,
  slug,
  localisation,
  specialite_slug,
  localisation_slug,
  prix_a_partir_de,
  devise,
  updated_at,
  created_at
from public.freelancers
where seo_published = true;

grant select on public.public_freelancer_profiles to anon, authenticated;
