-- ════════════════════════════════════════════════════════════════════════════
-- Plateforme archidiocésaine — multi-paroisses, rôles, parcours de foi,
-- médiation / TV, témoignages catégorisés, adhésions aux groupes, statistiques.
--
-- Voir docs/plateforme-archidiocesaine.md (sections 4 et 6).
-- À exécuter APRÈS mobile/supabase/schema.sql (dont la section « Sécurité :
-- fermeture de l'accès public… »). Idempotent : peut être rejoué sans risque.
--
-- Principe : on ajoute sans casser. Toutes les données existantes sont
-- rattachées à la paroisse « Cathédrale Sacré-Cœur ». parish_id = null
-- signifie « contenu archidiocésain » (visible dans toutes les paroisses).
-- ════════════════════════════════════════════════════════════════════════════


-- ── 1. Archidiocèse et paroisses ────────────────────────────────────────────

create table if not exists public.archdioceses (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.parishes (
  id uuid primary key default gen_random_uuid(),
  archdiocese_id uuid not null references public.archdioceses(id),
  nom text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text,
  cure text,
  adresse text,
  quartier text,
  ville text not null default 'Brazzaville',
  latitude double precision,
  longitude double precision,
  telephone text,
  email text,
  whatsapp text,
  -- { "messes": [{ "jour": "Dimanche", "horaires": ["07h00", "09h00"] }], "confessions": "…", "permanence": "…" }
  horaires jsonb not null default '{}',
  photo_url text,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists parishes_archdiocese_idx on public.parishes(archdiocese_id);

insert into public.archdioceses (nom, slug)
values ('Archidiocèse de Brazzaville', 'brazzaville')
on conflict (slug) do nothing;

insert into public.parishes (archdiocese_id, nom, slug, description, adresse, quartier, latitude, longitude, horaires)
select a.id, 'Cathédrale Sacré-Cœur', 'cathedrale-sacre-coeur',
  'Plus ancienne cathédrale d''Afrique centrale encore conservée, sur la Butte de l''Aiglon, depuis 1887.',
  'Avenue de la Paix, Centre-ville', 'Centre-ville', -4.2699, 15.2832,
  '{"messes":[{"jour":"Lundi – Vendredi","horaires":["07h00","18h30"]},{"jour":"Samedi","horaires":["07h00","10h00","18h30"]},{"jour":"Dimanche","horaires":["07h00","09h00","11h00","17h00"]}],"confessions":"Samedi 15h–17h · Dimanche 8h–9h45"}'::jsonb
from public.archdioceses a where a.slug = 'brazzaville'
on conflict (slug) do nothing;

-- Paroisse par défaut : sert de valeur par défaut aux colonnes parish_id, pour
-- que les anciens clients (app mobile déjà installée) continuent de fonctionner.
create or replace function public.default_parish_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.parishes where slug = 'cathedrale-sacre-coeur';
$$;


-- ── 2. Rôles : globaux (profiles.role) et paroissiaux (parish_members) ──────

create table if not exists public.parish_members (
  user_id uuid not null references public.profiles(id) on delete cascade,
  parish_id uuid not null references public.parishes(id) on delete cascade,
  role text not null check (role in (
    'admin_paroisse','pretre','secretariat','tresorier','coordinateur_catechese','catechiste',
    'staff_media','redacteur','responsable_groupe','animateur_jeunesse','responsable_liturgie',
    'responsable_securite','parent','benevole','membre'
  )),
  principale boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, parish_id, role)
);
create index if not exists parish_members_parish_idx on public.parish_members(parish_id);
create index if not exists parish_members_user_idx on public.parish_members(user_id);

alter table public.profiles add column if not exists telephone text;
alter table public.profiles add column if not exists avatar_url text;

-- Les rôles « de paroisse » stockés jusqu'ici dans profiles.role deviennent des
-- appartenances à la Cathédrale. admin et responsable_securite restent globaux.
insert into public.parish_members (user_id, parish_id, role, principale)
select id, public.default_parish_id(), role, true
from public.profiles
where role in ('redacteur','catechiste','pretre','secretariat','tresorier','responsable_groupe',
               'animateur_jeunesse','responsable_liturgie','parent','benevole','membre')
on conflict do nothing;

alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = null
where role in ('redacteur','catechiste','pretre','secretariat','tresorier','responsable_groupe',
               'animateur_jeunesse','responsable_liturgie','parent','benevole','membre');
alter table public.profiles add constraint profiles_role_check check (role in (
  'admin','archeveque','admin_diocesain','admin_evangelisation',
  'coordinateur_catechese_diocesain','responsable_media_diocesain','responsable_securite'
));

-- Tout compte existant sans profil en reçoit un ; tout profil devient membre de la Cathédrale.
insert into public.profiles (id, email, actif)
select u.id, coalesce(u.email, ''), true from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

insert into public.parish_members (user_id, parish_id, role, principale)
select p.id, public.default_parish_id(), 'membre', true from public.profiles p
where not exists (select 1 from public.parish_members m where m.user_id = p.id and m.principale)
on conflict do nothing;


-- ── 3. Fonctions de droits (utilisées par toutes les politiques RLS) ────────

create or replace function public.has_global_role(roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and actif and role = any(roles));
$$;

create or replace function public.has_parish_role(p uuid, roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parish_members m join public.profiles pr on pr.id = m.user_id
    where m.user_id = auth.uid() and m.parish_id = p and pr.actif and m.role = any(roles)
  );
$$;

create or replace function public.parish_staff_roles() returns text[]
language sql immutable as $$
  select array['admin_paroisse','pretre','secretariat','tresorier','coordinateur_catechese','catechiste',
               'staff_media','redacteur','responsable_groupe','animateur_jeunesse','responsable_liturgie',
               'responsable_securite'];
$$;

-- Administration archidiocésaine : voit et gère tout.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_global_role(array['admin','archeveque','admin_diocesain']);
$$;

create or replace function public.is_diocesan_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin();
$$;

-- Accès au panneau d'administration (au moins un rôle de staff, global ou paroissial).
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_global_role(array['admin','archeveque','admin_diocesain','admin_evangelisation',
           'coordinateur_catechese_diocesain','responsable_media_diocesain','responsable_securite'])
      or exists (
        select 1 from public.parish_members m join public.profiles pr on pr.id = m.user_id
        where m.user_id = auth.uid() and pr.actif and m.role = any(public.parish_staff_roles())
      );
$$;

create or replace function public.is_responsable_securite() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_global_role(array['responsable_securite']);
$$;

-- Gérer un contenu rattaché à la paroisse p (p = null : contenu archidiocésain).
create or replace function public.can_manage(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or (p is null and public.has_global_role(array['admin_evangelisation','responsable_media_diocesain','coordinateur_catechese_diocesain']))
      or (p is not null and public.has_parish_role(p, public.parish_staff_roles()));
$$;

create or replace function public.can_manage_dons(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.has_parish_role(p, array['admin_paroisse','tresorier']);
$$;

-- Dossiers enfants (protection des mineurs).
create or replace function public.can_protect(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.is_responsable_securite()
      or public.has_parish_role(p, array['admin_paroisse','responsable_securite','catechiste','coordinateur_catechese','secretariat']);
$$;

-- Signalements : jamais catéchistes ni secrétariat (un signalement peut les concerner).
create or replace function public.can_signalement(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.is_responsable_securite()
      or public.has_parish_role(p, array['responsable_securite']);
$$;

create or replace function public.is_protection_mineurs() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.is_responsable_securite()
      or exists (select 1 from public.parish_members m where m.user_id = auth.uid()
                 and m.role in ('admin_paroisse','responsable_securite','catechiste','coordinateur_catechese','secretariat'));
$$;

-- Anciennes fonctions « un rôle global » : conservées pour compatibilité, désormais
-- vraies si la personne a ce rôle dans au moins une paroisse.
create or replace function public.is_tresorier() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.parish_members where user_id = auth.uid() and role = 'tresorier');
$$;


-- ── 4. Rattachement des tables existantes à une paroisse ────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'annonces','homelies','evenements','formations','medias','cours','formations_catechisme',
    'groupes','projets_dons','services_paroissiaux','enfants','dons','demandes_pastorales',
    'prayer_intentions','signalements','temoignages','abonnements','notification_tokens',
    'notifications_log','audit_logs'
  ] loop
    execute format('alter table public.%I add column if not exists parish_id uuid references public.parishes(id) on delete set null', t);
    execute format('update public.%I set parish_id = public.default_parish_id() where parish_id is null', t);
    execute format('alter table public.%I alter column parish_id set default public.default_parish_id()', t);
    execute format('create index if not exists %I on public.%I(parish_id)', t || '_parish_idx', t);
  end loop;
end $$;

-- Lien avec le compte connecté (historique dans le profil).
alter table public.dons add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.demandes_pastorales add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.temoignages add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.notification_tokens add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.medias add column if not exists publie boolean not null default false;
alter table public.prayer_intentions add column if not exists nb_prieres int not null default 0;
alter table public.notifications_log add column if not exists cible jsonb not null default '{}';

-- Médiation : champs de classement des vidéos.
alter table public.evenements add column if not exists theme text;
alter table public.evenements add column if not exists intervenant text;
alter table public.evenements add column if not exists public_cible text;
alter table public.evenements add column if not exists vues int not null default 0;
alter table public.evenements add column if not exists a_la_une boolean not null default false;

create index if not exists dons_created_at_idx on public.dons(created_at desc);
create index if not exists dons_statut_idx on public.dons(statut);
create index if not exists demandes_statut_idx on public.demandes_pastorales(statut);
create index if not exists temoignages_statut_idx on public.temoignages(statut);
create index if not exists signalements_statut_idx on public.signalements(statut);
create index if not exists evenements_date_idx on public.evenements(date desc);
create index if not exists annonces_date_idx on public.annonces(date desc);

-- Fonctions utilitaires : paroisse d'un élément enfant.
create or replace function public.cours_parish(c uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select parish_id from public.cours where id = c;
$$;
create or replace function public.module_parish(m uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select c.parish_id from public.catechisme_modules mo join public.cours c on c.id = mo.cours_id where mo.id = m;
$$;
create or replace function public.enfant_parish(e uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select parish_id from public.enfants where id = e;
$$;


-- ── 5. Nouvelles tables ─────────────────────────────────────────────────────

-- Parcours de foi (évangélisation, catéchuménat, approfondissement, neuvaines,
-- retraites en ligne, formations obligatoires du staff).
create table if not exists public.evangelization_paths (
  id uuid primary key default gen_random_uuid(),
  parish_id uuid references public.parishes(id) on delete cascade,
  type text not null check (type in ('decouvrir','conversion','approfondir','neuvaine','retraite','formation_staff')),
  titre text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text not null default '',
  emoji text not null default '✝️',
  image_url text,
  duree text,
  obligatoire_pour text[] not null default '{}',
  ordre int not null default 0,
  publie boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists paths_type_idx on public.evangelization_paths(type, publie);
create index if not exists paths_parish_idx on public.evangelization_paths(parish_id);

create table if not exists public.path_steps (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.evangelization_paths(id) on delete cascade,
  ordre int not null,
  titre text not null,
  contenu text not null default '',
  video_url text,
  quiz jsonb not null default '[]',
  appel_action text not null default 'aucun'
    check (appel_action in ('aucun','parler_pretre','commencer_parcours','demarche','prier')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists path_steps_path_idx on public.path_steps(path_id, ordre);

create table if not exists public.user_path_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  step_id uuid not null references public.path_steps(id) on delete cascade,
  path_id uuid not null references public.evangelization_paths(id) on delete cascade,
  score int,
  termine_le timestamptz not null default now(),
  primary key (user_id, step_id)
);
create index if not exists user_path_progress_path_idx on public.user_path_progress(path_id);

create or replace function public.path_parish(p uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select parish_id from public.evangelization_paths where id = p;
$$;
create or replace function public.path_publie(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select publie from public.evangelization_paths where id = p), false);
$$;

-- Médiation / TV : directs programmés, playlists.
create table if not exists public.live_events (
  id uuid primary key default gen_random_uuid(),
  parish_id uuid references public.parishes(id) on delete cascade default public.default_parish_id(),
  titre text not null,
  description text not null default '',
  url text not null,
  debut timestamptz not null,
  fin timestamptz,
  statut text not null default 'programme' check (statut in ('programme','en_direct','termine')),
  intervenant text,
  theme text,
  publie boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists live_events_debut_idx on public.live_events(debut);
create index if not exists live_events_parish_idx on public.live_events(parish_id);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  parish_id uuid references public.parishes(id) on delete cascade,
  titre text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text not null default '',
  public_cible text not null default 'decouvre'
    check (public_cible in ('decouvre','conversion','baptise','prier','approfondir','jeunes','famille')),
  ordre int not null default 0,
  publie boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playlist_items (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  evenement_id uuid not null references public.evenements(id) on delete cascade,
  ordre int not null default 0,
  primary key (playlist_id, evenement_id)
);

-- Catégories de témoignages.
create table if not exists public.testimony_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  libelle text not null,
  emoji text not null default '✨',
  ordre int not null default 0
);
insert into public.testimony_categories (slug, libelle, emoji, ordre) values
  ('conversion', 'Conversion', '🕊️', 1),
  ('famille', 'Famille', '👨‍👩‍👧', 2),
  ('jeunes', 'Jeunes', '🔥', 3),
  ('engagement', 'Engagement', '🤝', 4),
  ('guerison', 'Guérison', '🙌', 5),
  ('priere-exaucee', 'Prière exaucée', '🙏', 6),
  ('vocation', 'Vocation', '⛪', 7),
  ('autre', 'Autre', '✨', 8)
on conflict (slug) do nothing;
alter table public.temoignages add column if not exists category_id uuid references public.testimony_categories(id) on delete set null;
alter table public.temoignages add column if not exists mis_en_avant boolean not null default false;

-- Adhésions aux groupes de prière et mouvements.
create table if not exists public.groupe_adhesions (
  id uuid primary key default gen_random_uuid(),
  groupe_id uuid not null references public.groupes(id) on delete cascade,
  parish_id uuid references public.parishes(id) on delete set null default public.default_parish_id(),
  user_id uuid references auth.users(id) on delete set null,
  nom text not null check (char_length(nom) between 2 and 120),
  contact text not null check (char_length(contact) between 5 and 120),
  message text check (char_length(message) <= 1000),
  statut text not null default 'nouvelle' check (statut in ('nouvelle','acceptee','refusee')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists groupe_adhesions_groupe_idx on public.groupe_adhesions(groupe_id);
create index if not exists groupe_adhesions_parish_idx on public.groupe_adhesions(parish_id, statut);


-- ── 6. Politiques RLS (réécriture complète, isolation par paroisse) ─────────

do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename = any(array[
      'profiles','formation_progress','module_progress','prayer_intentions','annonces','homelies',
      'evenements','formations','medias','cours','catechisme_modules','lecons','formations_catechisme',
      'seances_catechisme','groupes','projets_dons','services_paroissiaux','dons','demandes_pastorales',
      'temoignages','abonnements','notification_tokens','notifications_log','audit_logs','enfants',
      'consentements_parentaux','signalements','archdioceses','parishes','parish_members',
      'evangelization_paths','path_steps','user_path_progress','live_events','playlists',
      'playlist_items','testimony_categories','groupe_adhesions'
    ])
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

alter table public.archdioceses enable row level security;
alter table public.parishes enable row level security;
alter table public.parish_members enable row level security;
alter table public.evangelization_paths enable row level security;
alter table public.path_steps enable row level security;
alter table public.user_path_progress enable row level security;
alter table public.live_events enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_items enable row level security;
alter table public.testimony_categories enable row level security;
alter table public.groupe_adhesions enable row level security;

-- Référentiel
create policy "Lecture publique" on public.archdioceses for select using (true);
create policy "Gestion admin" on public.archdioceses for all using (public.is_admin()) with check (public.is_admin());

create policy "Lecture publique si active" on public.parishes for select using (actif or public.can_manage(id));
create policy "Creation admin" on public.parishes for insert with check (public.is_admin());
create policy "Modification admin ou admin paroisse" on public.parishes for update
  using (public.is_admin() or public.has_parish_role(id, array['admin_paroisse']))
  with check (public.is_admin() or public.has_parish_role(id, array['admin_paroisse']));
create policy "Suppression admin" on public.parishes for delete using (public.is_admin());

create policy "Lecture soi ou gestionnaires" on public.parish_members for select
  using (user_id = auth.uid() or public.can_manage(parish_id));
create policy "Nomination admin" on public.parish_members for insert
  with check (public.is_admin() or public.has_parish_role(parish_id, array['admin_paroisse'])
              or (user_id = auth.uid() and role = 'membre'));
create policy "Modification admin" on public.parish_members for update
  using (public.is_admin() or public.has_parish_role(parish_id, array['admin_paroisse']))
  with check (public.is_admin() or public.has_parish_role(parish_id, array['admin_paroisse']));
create policy "Retrait admin ou soi (membre)" on public.parish_members for delete
  using (public.is_admin() or public.has_parish_role(parish_id, array['admin_paroisse'])
         or (user_id = auth.uid() and role = 'membre'));

-- Profils
create policy "Lecture soi ou staff" on public.profiles for select using (auth.uid() = id or public.is_staff());
create policy "Gestion admin" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- Progression personnelle
create policy "Gestion de sa progression" on public.formation_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Lecture staff" on public.formation_progress for select using (public.is_staff());
create policy "Gestion de sa progression" on public.module_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Lecture staff" on public.module_progress for select using (public.is_staff());

-- Contenus publiés rattachés à une paroisse (ou à l'archidiocèse)
do $$
declare t text;
begin
  foreach t in array array['annonces','homelies','evenements','groupes','services_paroissiaux','cours',
                           'formations_catechisme','medias','evangelization_paths','live_events','playlists'] loop
    execute format('create policy "Lecture publique si publie" on public.%I for select using (publie or public.can_manage(parish_id))', t);
    execute format('create policy "Gestion par la paroisse" on public.%I for all using (public.can_manage(parish_id)) with check (public.can_manage(parish_id))', t);
  end loop;
end $$;

create policy "Lecture publique" on public.formations for select using (true);
create policy "Gestion par la paroisse" on public.formations for all using (public.can_manage(parish_id)) with check (public.can_manage(parish_id));

create policy "Lecture publique si publie" on public.catechisme_modules for select using (publie or public.can_manage(public.cours_parish(cours_id)));
create policy "Gestion par la paroisse" on public.catechisme_modules for all using (public.can_manage(public.cours_parish(cours_id))) with check (public.can_manage(public.cours_parish(cours_id)));
create policy "Lecture publique si publie" on public.lecons for select using (publie or public.can_manage(public.module_parish(module_id)));
create policy "Gestion par la paroisse" on public.lecons for all using (public.can_manage(public.module_parish(module_id))) with check (public.can_manage(public.module_parish(module_id)));
create policy "Gestion par la paroisse" on public.seances_catechisme for all using (public.can_manage(public.cours_parish(cours_id))) with check (public.can_manage(public.cours_parish(cours_id)));

create policy "Lecture publique si parcours publie" on public.path_steps for select using (public.path_publie(path_id) or public.can_manage(public.path_parish(path_id)));
create policy "Gestion par la paroisse" on public.path_steps for all using (public.can_manage(public.path_parish(path_id))) with check (public.can_manage(public.path_parish(path_id)));
create policy "Gestion de sa progression" on public.user_path_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Lecture gestionnaires" on public.user_path_progress for select using (public.can_manage(public.path_parish(path_id)));

create policy "Lecture publique" on public.playlist_items for select using (true);
create policy "Gestion par la paroisse" on public.playlist_items for all
  using (public.can_manage((select parish_id from public.playlists where id = playlist_id)))
  with check (public.can_manage((select parish_id from public.playlists where id = playlist_id)));

create policy "Lecture publique" on public.testimony_categories for select using (true);
create policy "Gestion admin" on public.testimony_categories for all using (public.is_admin()) with check (public.is_admin());

-- Dons (trésorerie)
create policy "Lecture publique si publie" on public.projets_dons for select using (publie or public.can_manage_dons(parish_id));
create policy "Gestion tresorerie" on public.projets_dons for all using (public.can_manage_dons(parish_id)) with check (public.can_manage_dons(parish_id));
create policy "Creation publique" on public.dons for insert with check (user_id is null or user_id = auth.uid());
create policy "Lecture tresorerie ou donateur" on public.dons for select using (public.can_manage_dons(parish_id) or user_id = auth.uid());
create policy "Modification tresorerie" on public.dons for update using (public.can_manage_dons(parish_id)) with check (public.can_manage_dons(parish_id));
create policy "Suppression tresorerie" on public.dons for delete using (public.can_manage_dons(parish_id));

-- Demandes des fidèles
create policy "Creation publique" on public.demandes_pastorales for insert with check (user_id is null or user_id = auth.uid());
create policy "Lecture gestionnaires ou demandeur" on public.demandes_pastorales for select using (public.can_manage(parish_id) or user_id = auth.uid());
create policy "Modification gestionnaires" on public.demandes_pastorales for update using (public.can_manage(parish_id)) with check (public.can_manage(parish_id));
create policy "Suppression gestionnaires" on public.demandes_pastorales for delete using (public.can_manage(parish_id));

create policy "Lecture publiques, siennes ou gestionnaires" on public.prayer_intentions for select using (is_public or auth.uid() = user_id or public.can_manage(parish_id));
create policy "Depot de sa propre intention" on public.prayer_intentions for insert with check (auth.uid() = user_id);
create policy "Modification gestionnaires" on public.prayer_intentions for update using (public.can_manage(parish_id)) with check (public.can_manage(parish_id));
create policy "Suppression soi ou gestionnaires" on public.prayer_intentions for delete using (auth.uid() = user_id or public.can_manage(parish_id));

create policy "Lecture si approuve, sien ou gestionnaires" on public.temoignages for select using (statut = 'approuve' or user_id = auth.uid() or public.can_manage(parish_id));
create policy "Creation publique" on public.temoignages for insert with check ((user_id is null or user_id = auth.uid()) and statut = 'en_attente' and not mis_en_avant);
create policy "Moderation gestionnaires" on public.temoignages for update using (public.can_manage(parish_id)) with check (public.can_manage(parish_id));
create policy "Suppression gestionnaires" on public.temoignages for delete using (public.can_manage(parish_id));

create policy "Creation publique" on public.groupe_adhesions for insert with check ((user_id is null or user_id = auth.uid()) and statut = 'nouvelle');
create policy "Lecture gestionnaires ou demandeur" on public.groupe_adhesions for select using (public.can_manage(parish_id) or user_id = auth.uid());
create policy "Modification gestionnaires" on public.groupe_adhesions for update using (public.can_manage(parish_id)) with check (public.can_manage(parish_id));
create policy "Suppression gestionnaires" on public.groupe_adhesions for delete using (public.can_manage(parish_id));

-- Abonnés et notifications (écriture publique uniquement via fonctions, voir plus bas)
create policy "Lecture gestionnaires" on public.abonnements for select using (public.can_manage(parish_id));
create policy "Modification gestionnaires" on public.abonnements for update using (public.can_manage(parish_id)) with check (public.can_manage(parish_id));
create policy "Suppression gestionnaires" on public.abonnements for delete using (public.can_manage(parish_id));
create policy "Lecture staff" on public.notification_tokens for select using (public.is_staff());
create policy "Lecture gestionnaires" on public.notifications_log for select using (public.can_manage(parish_id));
create policy "Ecriture gestionnaires" on public.notifications_log for insert with check (public.can_manage(parish_id));

-- Journal d'audit
create policy "Ecriture staff" on public.audit_logs for insert with check (public.is_staff());
create policy "Lecture admin, securite ou admin paroisse" on public.audit_logs for select
  using (public.is_admin() or public.is_responsable_securite() or public.has_parish_role(parish_id, array['admin_paroisse']));

-- Protection des mineurs
create policy "Gestion protection mineurs" on public.enfants for all using (public.can_protect(parish_id)) with check (public.can_protect(parish_id));
create policy "Gestion protection mineurs" on public.consentements_parentaux for all
  using (public.can_protect(public.enfant_parish(enfant_id))) with check (public.can_protect(public.enfant_parish(enfant_id)));
create policy "Creation publique" on public.signalements for insert with check (true);
create policy "Lecture restreinte" on public.signalements for select using (public.can_signalement(parish_id));
create policy "Modification restreinte" on public.signalements for update using (public.can_signalement(parish_id)) with check (public.can_signalement(parish_id));
create policy "Suppression restreinte" on public.signalements for delete using (public.can_signalement(parish_id));

-- Fichiers de la médiathèque publiés : lisibles par tous.
drop policy if exists "Lecture publique medias publies" on storage.objects;
create policy "Lecture publique medias publies" on storage.objects for select
  using (bucket_id = 'medias' and exists (select 1 from public.medias m where m.storage_path = name and m.publie));


-- ── 7. Création automatique du profil à l'inscription ───────────────────────

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_parish uuid;
begin
  insert into public.profiles (id, email, nom, telephone, actif)
  values (new.id, coalesce(new.email, ''),
          nullif(trim(new.raw_user_meta_data->>'nom'), ''),
          nullif(trim(new.raw_user_meta_data->>'telephone'), ''), true)
  on conflict (id) do nothing;

  begin
    v_parish := (new.raw_user_meta_data->>'parish_id')::uuid;
  exception when others then
    v_parish := null;
  end;
  if v_parish is null or not exists (select 1 from public.parishes where id = v_parish and actif) then
    v_parish := public.default_parish_id();
  end if;

  insert into public.parish_members (user_id, parish_id, role, principale)
  values (new.id, v_parish, 'membre', true)
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── 8. Fonctions appelées par le site ───────────────────────────────────────

create or replace function public.maj_mon_profil(p_nom text, p_telephone text)
returns void language sql security definer set search_path = public as $$
  update public.profiles set nom = nullif(trim(p_nom), ''), telephone = nullif(trim(p_telephone), '')
  where id = auth.uid();
$$;

create or replace function public.rejoindre_paroisse(p_parish uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  if not exists (select 1 from public.parishes where id = p_parish and actif) then raise exception 'Paroisse introuvable'; end if;
  insert into public.parish_members (user_id, parish_id, role, principale)
  values (auth.uid(), p_parish, 'membre',
          not exists (select 1 from public.parish_members where user_id = auth.uid() and principale))
  on conflict do nothing;
end $$;

create or replace function public.quitter_paroisse(p_parish uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.parish_members where user_id = auth.uid() and parish_id = p_parish and role = 'membre' and not principale;
$$;

create or replace function public.definir_paroisse_principale(p_parish uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  perform public.rejoindre_paroisse(p_parish);
  update public.parish_members set principale = (parish_id = p_parish) where user_id = auth.uid();
end $$;

-- Abonnements et jetons push : nouvelles versions avec la paroisse.
drop function if exists public.s_abonner(text, text, jsonb);
create or replace function public.s_abonner(p_canal text, p_contact text, p_prefs jsonb, p_parish uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_canal not in ('email','whatsapp') or char_length(coalesce(p_contact, '')) not between 5 and 120 then
    raise exception 'Contact invalide';
  end if;
  select id into v_id from public.abonnements where contact = p_contact limit 1;
  if v_id is not null then return v_id; end if;
  insert into public.abonnements (canal, contact, prefs, confirme, parish_id)
  values (p_canal, p_contact, coalesce(p_prefs, '{}'), p_canal = 'whatsapp', coalesce(p_parish, public.default_parish_id()))
  returning id into v_id;
  return v_id;
end $$;

drop function if exists public.enregistrer_jeton(text, jsonb, text);
create or replace function public.enregistrer_jeton(p_token text, p_prefs jsonb, p_platform text default 'web', p_parish uuid default null)
returns void language sql security definer set search_path = public as $$
  insert into public.notification_tokens (token, prefs, platform, parish_id, user_id, updated_at)
  values (p_token, coalesce(p_prefs, '{}'), coalesce(p_platform, 'web'),
          coalesce(p_parish, public.default_parish_id()), auth.uid(), now())
  on conflict (token) do update set
    prefs = excluded.prefs, platform = excluded.platform,
    parish_id = excluded.parish_id, user_id = coalesce(excluded.user_id, notification_tokens.user_id),
    updated_at = now();
$$;

grant execute on function public.s_abonner(text, text, jsonb, uuid) to anon, authenticated;
grant execute on function public.enregistrer_jeton(text, jsonb, text, uuid) to anon, authenticated;

-- Compteurs publics (sans ouvrir la lecture des tables).
create or replace function public.incrementer_vue(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.evenements set vues = vues + 1 where id = p_id and publie;
$$;

create or replace function public.prier_pour(p_id uuid)
returns int language sql security definer set search_path = public as $$
  update public.prayer_intentions set nb_prieres = nb_prieres + 1 where id = p_id and is_public
  returning nb_prieres;
$$;

create or replace function public.collecte_projets()
returns table (projet_id text, total numeric) language sql stable security definer set search_path = public as $$
  select d.projet_id, sum(d.montant) from public.dons d
  where d.type = 'projet' and d.statut = 'confirme' and d.projet_id is not null
  group by d.projet_id;
$$;

grant execute on function public.incrementer_vue(uuid) to anon, authenticated;
grant execute on function public.prier_pour(uuid) to anon, authenticated;
grant execute on function public.collecte_projets() to anon, authenticated;

-- Tableau de bord : chiffres clés d'une paroisse (p_parish) ou de tout l'archidiocèse (null).
create or replace function public.stats_tableau_de_bord(p_parish uuid default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  res jsonb;
  tout boolean := p_parish is null;
begin
  if not public.is_staff() then raise exception 'Accès refusé'; end if;
  if tout and not (public.is_admin() or public.has_global_role(array['archeveque','admin_evangelisation',
      'coordinateur_catechese_diocesain','responsable_media_diocesain','responsable_securite'])) then
    raise exception 'Accès refusé';
  end if;
  if not tout and not (public.can_manage(p_parish) or public.has_global_role(array['coordinateur_catechese_diocesain','admin_evangelisation'])) then
    raise exception 'Accès refusé';
  end if;

  select jsonb_build_object(
    'paroisses',          (select count(*) from parishes where actif and (tout or id = p_parish)),
    'fideles',            (select count(distinct user_id) from parish_members where tout or parish_id = p_parish),
    'catechistes',        (select count(distinct user_id) from parish_members where role = 'catechiste' and (tout or parish_id = p_parish)),
    'enfants',            (select count(*) from enfants where actif and (tout or parish_id = p_parish)),
    'dons_total',         (select coalesce(sum(montant), 0) from dons where statut = 'confirme' and (tout or parish_id = p_parish)),
    'dons_en_attente',    (select count(*) from dons where statut = 'en_attente' and (tout or parish_id = p_parish)),
    'intentions_recues',  (select count(*) from prayer_intentions where statut = 'recue' and (tout or parish_id = p_parish)),
    'temoignages_attente',(select count(*) from temoignages where statut = 'en_attente' and (tout or parish_id = p_parish)),
    'demandes_recues',    (select count(*) from demandes_pastorales where statut = 'recue' and (tout or parish_id = p_parish)),
    'adhesions_nouvelles',(select count(*) from groupe_adhesions where statut = 'nouvelle' and (tout or parish_id = p_parish)),
    'signalements_nouveaux', case when public.can_signalement(p_parish) or public.is_admin() or public.is_responsable_securite()
                              then (select count(*) from signalements where statut = 'nouveau' and (tout or parish_id = p_parish)) else null end,
    'videos',             (select count(*) from evenements where publie and (tout or parish_id = p_parish or parish_id is null)),
    'vues_videos',        (select coalesce(sum(vues), 0) from evenements where tout or parish_id = p_parish or parish_id is null),
    'parcours_inscrits',  (select count(distinct (user_id, path_id)) from user_path_progress),
    'abonnes',            (select count(*) from abonnements where tout or parish_id = p_parish)
  ) into res;
  return res;
end $$;

create or replace function public.stats_par_paroisse()
returns table (parish_id uuid, nom text, fideles bigint, catechistes bigint, enfants bigint,
               dons_total numeric, demandes_recues bigint, parcours_termines bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not (public.is_admin() or public.has_global_role(array['archeveque','admin_evangelisation','coordinateur_catechese_diocesain'])) then
    raise exception 'Accès refusé';
  end if;
  return query
  select p.id, p.nom,
    (select count(distinct m.user_id) from parish_members m where m.parish_id = p.id),
    (select count(distinct m.user_id) from parish_members m where m.parish_id = p.id and m.role = 'catechiste'),
    (select count(*) from enfants e where e.parish_id = p.id and e.actif),
    (select coalesce(sum(d.montant), 0) from dons d where d.parish_id = p.id and d.statut = 'confirme'),
    (select count(*) from demandes_pastorales dp where dp.parish_id = p.id and dp.statut = 'recue'),
    (select count(*) from formation_progress fp join parish_members m on m.user_id = fp.user_id and m.parish_id = p.id and m.principale
      where fp.statut = 'termine')
  from parishes p where p.actif order by p.nom;
end $$;

-- Parcours de foi : statistiques par parcours (inscrits = au moins une étape terminée).
create or replace function public.stats_parcours()
returns table (path_id uuid, inscrits bigint, termines bigint)
language sql stable security definer set search_path = public as $$
  with nb as (select path_id, count(*) n from path_steps group by path_id),
       u as (select path_id, user_id, count(*) faits from user_path_progress group by path_id, user_id)
  select p.id,
         (select count(*) from u where u.path_id = p.id),
         (select count(*) from u join nb on nb.path_id = u.path_id where u.path_id = p.id and u.faits >= nb.n)
  from evangelization_paths p
  where public.can_manage(p.parish_id);
$$;

-- Registre du staff : formations obligatoires suivies par chaque membre.
create or replace function public.registre_staff(p_parish uuid default null)
returns table (user_id uuid, nom text, email text, parish_nom text, role text,
               verifie_securite boolean, formations_requises int, formations_terminees int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not (public.is_admin() or public.is_responsable_securite()
          or public.has_global_role(array['coordinateur_catechese_diocesain'])
          or (p_parish is not null and public.has_parish_role(p_parish, array['admin_paroisse','coordinateur_catechese','responsable_securite']))) then
    raise exception 'Accès refusé';
  end if;
  return query
  select m.user_id, pr.nom, pr.email, pa.nom, m.role, pr.verifie_securite,
    (select count(*)::int from evangelization_paths ep
      where ep.type = 'formation_staff' and ep.publie and m.role = any(ep.obligatoire_pour)),
    (select count(*)::int from evangelization_paths ep
      where ep.type = 'formation_staff' and ep.publie and m.role = any(ep.obligatoire_pour)
        and (select count(*) from path_steps s where s.path_id = ep.id) > 0
        and (select count(*) from user_path_progress up where up.path_id = ep.id and up.user_id = m.user_id)
            >= (select count(*) from path_steps s where s.path_id = ep.id))
  from parish_members m
  join profiles pr on pr.id = m.user_id
  join parishes pa on pa.id = m.parish_id
  where m.role = any(public.parish_staff_roles()) and (p_parish is null or m.parish_id = p_parish)
  order by pa.nom, pr.nom;
end $$;

grant execute on function public.stats_tableau_de_bord(uuid) to authenticated;
grant execute on function public.stats_par_paroisse() to authenticated;
grant execute on function public.stats_parcours() to authenticated;
grant execute on function public.registre_staff(uuid) to authenticated;
grant execute on function public.maj_mon_profil(text, text) to authenticated;
grant execute on function public.rejoindre_paroisse(uuid) to authenticated;
grant execute on function public.quitter_paroisse(uuid) to authenticated;
grant execute on function public.definir_paroisse_principale(uuid) to authenticated;


-- ── 9. Contenus exemples (brouillons à relire puis publier depuis l'admin) ──

insert into public.evangelization_paths (parish_id, type, titre, slug, description, emoji, duree, ordre) values
  (null, 'decouvrir', 'Premiers pas : qui est Jésus ?', 'qui-est-jesus',
   'Un parcours court pour les curieux et ceux qui cherchent : découvrir la personne de Jésus, son message et ce qu''il change dans une vie.', '🌅', '4 étapes · 20 min', 1),
  (null, 'decouvrir', 'Découvrir la prière', 'decouvrir-la-priere',
   'Apprendre à parler à Dieu simplement, avec ses mots, et découvrir les grandes prières de l''Église.', '🕯️', '3 étapes · 15 min', 2),
  (null, 'conversion', 'Chemin vers le baptême', 'chemin-vers-le-bapteme',
   'Vous souhaitez devenir chrétien ? Voici les étapes du catéchuménat des adultes, de la première rencontre jusqu''aux sacrements de l''initiation.', '💧', '5 étapes · 30 min', 1),
  (null, 'approfondir', 'Le Credo, article par article', 'le-credo',
   'Redécouvrir la foi de l''Église à travers le Symbole des Apôtres, pour les baptisés qui veulent approfondir.', '📖', '4 étapes · 40 min', 1),
  (null, 'neuvaine', 'Neuvaine au Sacré-Cœur de Jésus', 'neuvaine-sacre-coeur',
   'Neuf jours de prière confiante au Cœur de Jésus, patron de notre cathédrale.', '❤️‍🔥', '9 jours', 1),
  (null, 'formation_staff', 'Protection des mineurs — formation obligatoire', 'formation-protection-mineurs',
   'Formation obligatoire pour toute personne encadrant des enfants ou des jeunes : repères, bonnes pratiques et conduite à tenir.', '🛡️', '3 étapes · 30 min', 1)
on conflict (slug) do nothing;

update public.evangelization_paths
set obligatoire_pour = array['catechiste','coordinateur_catechese','animateur_jeunesse','responsable_groupe','pretre','responsable_securite']
where slug = 'formation-protection-mineurs' and obligatoire_pour = '{}';

insert into public.path_steps (path_id, ordre, titre, contenu, quiz, appel_action)
select p.id, s.ordre, s.titre, s.contenu, s.quiz::jsonb, s.appel_action
from public.evangelization_paths p
join (values
  ('qui-est-jesus', 1, 'Un homme qui a changé l''histoire',
   E'Il y a deux mille ans, en Galilée, un homme nommé Jésus parcourt les villages. Il guérit les malades, accueille les exclus, pardonne les pécheurs.\n\nSes contemporains se posent déjà la question : **« Qui est cet homme ? »** (Marc 4, 41). Aujourd''hui encore, plus de deux milliards de personnes se réclament de lui.\n\n> « Et vous, que dites-vous ? Pour vous, qui suis-je ? » (Matthieu 16, 15)',
   '[{"question":"Dans quelle région Jésus a-t-il principalement enseigné ?","options":["En Galilée","En Égypte","À Rome"],"correct":0,"explication":"Jésus a grandi à Nazareth et a enseigné surtout en Galilée, autour du lac de Tibériade."}]', 'aucun'),
  ('qui-est-jesus', 2, 'Un message d''amour',
   E'Le cœur du message de Jésus tient en quelques mots : **Dieu est Amour**, et il aime chaque personne personnellement.\n\nJésus résume toute la loi en deux commandements : aimer Dieu de tout son cœur, et aimer son prochain comme soi-même (Marc 12, 29-31).\n\n> « Venez à moi, vous tous qui peinez sous le poids du fardeau, et moi, je vous procurerai le repos. » (Matthieu 11, 28)',
   '[{"question":"Selon Jésus, quels sont les deux plus grands commandements ?","options":["Aimer Dieu et aimer son prochain","Jeûner et prier","Obéir et travailler"],"correct":0,"explication":"Jésus unit l''amour de Dieu et l''amour du prochain (Marc 12, 29-31)."}]', 'aucun'),
  ('qui-est-jesus', 3, 'Mort et ressuscité',
   E'Jésus a été crucifié à Jérusalem. Mais le troisième jour, ses disciples le rencontrent **vivant**. C''est le cœur de la foi chrétienne : la Résurrection.\n\nPar sa mort et sa résurrection, Jésus ouvre à tous le chemin de la vie éternelle. La mort n''a pas le dernier mot.\n\n> « Je suis la résurrection et la vie. Celui qui croit en moi, même s''il meurt, vivra. » (Jean 11, 25)',
   '[{"question":"Quel événement est au cœur de la foi chrétienne ?","options":["La Résurrection de Jésus","La construction du Temple","Le déluge"],"correct":0,"explication":"Saint Paul écrit : « Si le Christ n''est pas ressuscité, notre foi est vaine » (1 Co 15, 14)."}]', 'aucun'),
  ('qui-est-jesus', 4, 'Et pour moi ?',
   E'Jésus n''est pas seulement un personnage du passé : les chrétiens croient qu''il est vivant et qu''on peut le rencontrer aujourd''hui, dans la prière, dans l''Évangile, dans les sacrements et dans la communauté.\n\nSi ces pages éveillent en vous une question ou un désir, n''hésitez pas : un prêtre ou un membre de la paroisse sera heureux de vous écouter, sans engagement.',
   '[]', 'parler_pretre'),
  ('decouvrir-la-priere', 1, 'Prier, c''est parler à Dieu',
   E'Prier, ce n''est pas réciter des formules compliquées : c''est **parler à Dieu comme à un ami**, lui dire merci, lui confier ce qui nous pèse, lui demander de l''aide.\n\nOn peut prier partout : chez soi, dans la rue, au travail. Quelques minutes de silence suffisent pour commencer.',
   '[]', 'aucun'),
  ('decouvrir-la-priere', 2, 'La prière que Jésus nous a apprise',
   E'Quand ses disciples lui ont demandé « Apprends-nous à prier », Jésus leur a donné le **Notre Père** (Luc 11, 1-4) :\n\n> Notre Père, qui es aux cieux, que ton nom soit sanctifié, que ton règne vienne, que ta volonté soit faite sur la terre comme au ciel. Donne-nous aujourd''hui notre pain de ce jour. Pardonne-nous nos offenses, comme nous pardonnons aussi à ceux qui nous ont offensés. Et ne nous laisse pas entrer en tentation, mais délivre-nous du Mal. Amen.',
   '[{"question":"Quelle prière Jésus a-t-il apprise à ses disciples ?","options":["Le Notre Père","Le Magnificat","L''Angélus"],"correct":0,"explication":"Jésus enseigne le Notre Père en Luc 11 et Matthieu 6."}]', 'aucun'),
  ('decouvrir-la-priere', 3, 'Commencer dès aujourd''hui',
   E'Essayez ce soir : prenez cinq minutes, dans le calme. Remerciez Dieu pour une chose de votre journée, confiez-lui une personne, puis dites lentement le Notre Père.\n\nVous pouvez aussi déposer une intention de prière : la communauté priera avec vous.',
   '[]', 'prier'),
  ('chemin-vers-le-bapteme', 1, 'Le désir de Dieu',
   E'Tout commence par une question, une rencontre, un désir. Peut-être avez-vous été touché par un témoignage, une célébration, une épreuve.\n\nL''Église accueille toute personne qui cherche Dieu, quel que soit son âge ou son histoire. On ne devient pas chrétien seul : on est accompagné.',
   '[]', 'aucun'),
  ('chemin-vers-le-bapteme', 2, 'Le temps de la première annonce',
   E'La première étape est une période de découverte de l''Évangile, avec un accompagnateur. On apprend à connaître Jésus et à prier.\n\nQuand le désir se confirme, a lieu l''**entrée en catéchuménat** : une célébration où la communauté vous accueille officiellement.',
   '[]', 'aucun'),
  ('chemin-vers-le-bapteme', 3, 'Le catéchuménat',
   E'Pendant environ deux ans, le catéchumène approfondit la foi (le Credo), la prière, la vie chrétienne et participe à la vie de la paroisse.\n\nAu début du Carême qui précède le baptême a lieu l''**appel décisif**, présidé par l''archevêque.',
   '[{"question":"Qui préside l''appel décisif des catéchumènes ?","options":["L''archevêque","Le catéchiste","Le parrain"],"correct":0,"explication":"L''appel décisif est célébré par l''évêque du diocèse, au début du Carême."}]', 'aucun'),
  ('chemin-vers-le-bapteme', 4, 'Les sacrements de l''initiation',
   E'Lors de la **Veillée pascale**, le catéchumène reçoit les trois sacrements de l''initiation chrétienne : le **baptême**, la **confirmation** et l''**eucharistie**.\n\nC''est une nouvelle naissance : il devient enfant de Dieu et membre de l''Église.',
   '[{"question":"Quels sont les trois sacrements de l''initiation chrétienne ?","options":["Baptême, confirmation, eucharistie","Baptême, mariage, ordre","Pénitence, onction, mariage"],"correct":0,"explication":"Baptême, confirmation et eucharistie constituent l''initiation chrétienne (CEC 1212)."}]', 'aucun'),
  ('chemin-vers-le-bapteme', 5, 'Faire le premier pas',
   E'Vous souhaitez entamer ce chemin ? Faites une demande de baptême d''adulte : l''équipe de la paroisse vous recontactera pour une première rencontre, en toute simplicité.',
   '[]', 'demarche'),
  ('le-credo', 1, 'Je crois en Dieu, le Père tout-puissant',
   E'Le Credo commence par une confiance : **« Je crois »**. Croire, c''est s''en remettre à Dieu qui se révèle.\n\nDieu est **Père** : il a tout créé par amour, le ciel et la terre, le monde visible et invisible, et il veille sur chacun.',
   '[{"question":"Par quelle affirmation commence le Credo ?","options":["Je crois en Dieu, le Père tout-puissant","Je crois en l''Église","Je crois à la résurrection de la chair"],"correct":0,"explication":"Le premier article confesse Dieu le Père créateur."}]', 'aucun'),
  ('le-credo', 2, 'Et en Jésus-Christ, son Fils unique',
   E'Le cœur du Credo confesse Jésus, **vrai Dieu et vrai homme** : conçu du Saint-Esprit, né de la Vierge Marie, crucifié, mort, ressuscité le troisième jour, monté aux cieux, d''où il viendra juger les vivants et les morts.',
   '[]', 'aucun'),
  ('le-credo', 3, 'Je crois en l''Esprit Saint',
   E'L''Esprit Saint est la troisième personne de la Trinité. Il donne la vie, inspire les Écritures, sanctifie l''Église et chaque baptisé.\n\nC''est lui qui nous fait dire « Abba, Père » (Romains 8, 15).',
   '[]', 'aucun'),
  ('le-credo', 4, 'L''Église, la communion des saints, la vie éternelle',
   E'Le Credo se termine par l''Église une, sainte, catholique et apostolique, la communion des saints, le pardon des péchés, la résurrection de la chair et la vie éternelle.\n\nNotre foi débouche sur une espérance : la vie avec Dieu pour toujours.',
   '[{"question":"Par quoi se termine le Credo ?","options":["La vie éternelle","La création du monde","La naissance de Jésus"],"correct":0,"explication":"Le Symbole des Apôtres s''achève sur « la vie éternelle. Amen »."}]', 'commencer_parcours'),
  ('neuvaine-sacre-coeur', 1, 'Jour 1 — Le Cœur qui aime',
   E'> « Venez à moi, vous tous qui peinez sous le poids du fardeau. » (Matthieu 11, 28)\n\nSeigneur Jésus, ton Cœur est ouvert à tous. Je te confie aujourd''hui mon intention. Apprends-moi à me reposer en toi.\n\n*Notre Père, Je vous salue Marie, Gloire au Père.*\n\n**Cœur Sacré de Jésus, j''ai confiance en vous.**',
   '[]', 'aucun'),
  ('neuvaine-sacre-coeur', 2, 'Jour 2 — Le Cœur doux et humble',
   E'> « Je suis doux et humble de cœur. » (Matthieu 11, 29)\n\nSeigneur, donne-moi un cœur semblable au tien, doux dans mes paroles et humble dans mes actes.\n\n*Notre Père, Je vous salue Marie, Gloire au Père.*\n\n**Cœur Sacré de Jésus, j''ai confiance en vous.**',
   '[]', 'aucun'),
  ('neuvaine-sacre-coeur', 3, 'Jour 3 — Le Cœur qui pardonne',
   E'> « Père, pardonne-leur : ils ne savent pas ce qu''ils font. » (Luc 23, 34)\n\nSeigneur, je te confie les personnes que j''ai du mal à pardonner. Guéris les blessures de mon cœur.\n\n*Notre Père, Je vous salue Marie, Gloire au Père.*\n\n**Cœur Sacré de Jésus, j''ai confiance en vous.**',
   '[]', 'aucun'),
  ('neuvaine-sacre-coeur', 4, 'Jour 4 — Le Cœur transpercé',
   E'> « Un des soldats, avec sa lance, lui perça le côté ; et aussitôt, il en sortit du sang et de l''eau. » (Jean 19, 34)\n\nSeigneur, de ton Cœur ouvert jaillit la vie de l''Église. Je te confie les malades et ceux qui souffrent.\n\n*Notre Père, Je vous salue Marie, Gloire au Père.*\n\n**Cœur Sacré de Jésus, j''ai confiance en vous.**',
   '[]', 'aucun'),
  ('neuvaine-sacre-coeur', 5, 'Jour 5 — Le Cœur du Bon Pasteur',
   E'> « Je suis le bon pasteur ; le bon pasteur donne sa vie pour ses brebis. » (Jean 10, 11)\n\nSeigneur, je te confie les prêtres de notre archidiocèse et tous ceux qui nous guident dans la foi.\n\n*Notre Père, Je vous salue Marie, Gloire au Père.*\n\n**Cœur Sacré de Jésus, j''ai confiance en vous.**',
   '[]', 'aucun'),
  ('neuvaine-sacre-coeur', 6, 'Jour 6 — Le Cœur qui console',
   E'> « Heureux ceux qui pleurent, car ils seront consolés. » (Matthieu 5, 4)\n\nSeigneur, je te confie les familles en deuil et ceux qui sont dans la peine. Sois leur consolation.\n\n*Notre Père, Je vous salue Marie, Gloire au Père.*\n\n**Cœur Sacré de Jésus, j''ai confiance en vous.**',
   '[]', 'aucun'),
  ('neuvaine-sacre-coeur', 7, 'Jour 7 — Le Cœur de la paix',
   E'> « Je vous laisse la paix, je vous donne ma paix. » (Jean 14, 27)\n\nSeigneur, je te confie notre pays, le Congo : donne-lui la paix, l''unité et la justice.\n\n*Notre Père, Je vous salue Marie, Gloire au Père.*\n\n**Cœur Sacré de Jésus, j''ai confiance en vous.**',
   '[]', 'aucun'),
  ('neuvaine-sacre-coeur', 8, 'Jour 8 — Le Cœur eucharistique',
   E'> « Ceci est mon corps, donné pour vous. » (Luc 22, 19)\n\nSeigneur, merci de te donner à nous dans l''Eucharistie. Fais grandir en moi le désir de te recevoir.\n\n*Notre Père, Je vous salue Marie, Gloire au Père.*\n\n**Cœur Sacré de Jésus, j''ai confiance en vous.**',
   '[]', 'aucun'),
  ('neuvaine-sacre-coeur', 9, 'Jour 9 — Consécration au Sacré-Cœur',
   E'Seigneur Jésus, au terme de cette neuvaine, je me consacre à ton Cœur. Je te remets ma vie, ma famille, mes joies et mes peines. Que mon cœur batte au rythme du tien.\n\n*Notre Père, Je vous salue Marie, Gloire au Père.*\n\n**Cœur Sacré de Jésus, j''ai confiance en vous.**',
   '[]', 'prier'),
  ('formation-protection-mineurs', 1, 'Pourquoi cette formation ?',
   E'Toute personne qui encadre des enfants ou des jeunes au nom de l''Église a la responsabilité de leur offrir un environnement **sûr**. Cette formation rappelle les repères de la charte de protection des mineurs de l''archidiocèse.\n\nElle est obligatoire avant toute mission auprès de mineurs.',
   '[]', 'aucun'),
  ('formation-protection-mineurs', 2, 'Les bonnes pratiques',
   E'- Ne jamais rester **seul à seul** avec un enfant dans un lieu fermé ; privilégier les lieux visibles.\n- Toujours **deux adultes** pour une activité avec des mineurs.\n- Pas de communication privée (messages, réseaux sociaux) avec un mineur sans que les parents soient informés.\n- Obtenir l''**autorisation écrite des parents** pour les sorties et le droit à l''image.\n- Respecter la pudeur et l''intimité de chacun.',
   '[{"question":"Combien d''adultes au minimum pour une activité avec des mineurs ?","options":["Deux","Un seul suffit","Aucune règle"],"correct":0,"explication":"La règle des deux adultes protège les enfants comme les encadrants."},{"question":"Que faut-il obtenir avant une sortie ?","options":["L''autorisation écrite des parents","L''accord oral de l''enfant","Rien de particulier"],"correct":0,"explication":"Les consentements parentaux sont enregistrés dans le suivi Parent-Enfant."}]', 'aucun'),
  ('formation-protection-mineurs', 3, 'Que faire en cas de doute ?',
   E'Si un enfant se confie à vous ou si vous observez une situation inquiétante :\n\n1. **Écoutez** sans interroger ni juger, et croyez la parole de l''enfant.\n2. **Ne promettez pas le secret.**\n3. **Signalez** sans délai au responsable de la protection des mineurs, via la page « Signaler » (anonymat possible).\n4. En cas de danger immédiat, alertez les autorités compétentes.\n\nNe menez jamais l''enquête vous-même.',
   '[{"question":"Un enfant vous confie une situation grave. Que faites-vous ?","options":["J''écoute et je signale sans délai","Je promets de garder le secret","Je mène ma propre enquête"],"correct":0,"explication":"On écoute, on ne promet pas le secret, et on signale au responsable."}]', 'aucun')
) as s(slug, ordre, titre, contenu, quiz, appel_action) on s.slug = p.slug
where not exists (select 1 from public.path_steps x where x.path_id = p.id and x.ordre = s.ordre);

insert into public.playlists (parish_id, titre, slug, description, public_cible, ordre) values
  (null, 'Découvrir la foi', 'decouvrir-la-foi', 'Des vidéos courtes pour ceux qui cherchent.', 'decouvre', 1),
  (null, 'Se convertir', 'se-convertir', 'Témoignages de conversion et premiers pas vers le baptême.', 'conversion', 2),
  (null, 'Prier', 'prier', 'Chapelets, adorations et temps de prière filmés.', 'prier', 3),
  (null, 'Approfondir', 'approfondir', 'Enseignements pour les baptisés qui veulent aller plus loin.', 'approfondir', 4),
  (null, 'Jeunes', 'jeunes', 'Pour les jeunes de l''archidiocèse.', 'jeunes', 5),
  (null, 'Famille', 'famille', 'Vivre la foi en famille.', 'famille', 6)
on conflict (slug) do nothing;
