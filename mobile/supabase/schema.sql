-- Schema pour le suivi personnalise des paroissiens connectes (Espace Membre).
-- Le contenu des formations reste dans Firestore (collection catechisme_cours).

create extension if not exists pgcrypto;

create table if not exists public.formation_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cours_id text not null,
  statut text not null default 'en_cours' check (statut in ('en_cours', 'termine')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, cours_id)
);

create index if not exists formation_progress_user_id_idx on public.formation_progress(user_id);

alter table public.formation_progress enable row level security;

drop policy if exists "Lecture de sa propre progression" on public.formation_progress;
create policy "Lecture de sa propre progression"
  on public.formation_progress for select
  using (auth.uid() = user_id);

drop policy if exists "Ajout de sa propre progression" on public.formation_progress;
create policy "Ajout de sa propre progression"
  on public.formation_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "Mise a jour de sa propre progression" on public.formation_progress;
create policy "Mise a jour de sa propre progression"
  on public.formation_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Suppression de sa propre progression" on public.formation_progress;
create policy "Suppression de sa propre progression"
  on public.formation_progress for delete
  using (auth.uid() = user_id);

create table if not exists public.prayer_intentions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contenu text not null check (char_length(contenu) between 3 and 500),
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists prayer_intentions_created_at_idx on public.prayer_intentions(created_at desc);

alter table public.prayer_intentions enable row level security;

drop policy if exists "Lecture des intentions publiques ou des siennes" on public.prayer_intentions;
create policy "Lecture des intentions publiques ou des siennes"
  on public.prayer_intentions for select
  using (is_public = true or auth.uid() = user_id);

drop policy if exists "Depot de sa propre intention" on public.prayer_intentions;
create policy "Depot de sa propre intention"
  on public.prayer_intentions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Suppression de sa propre intention" on public.prayer_intentions;
create policy "Suppression de sa propre intention"
  on public.prayer_intentions for delete
  using (auth.uid() = user_id);

-- ============================================================
-- MIGRATION FIREBASE -> SUPABASE
-- Module 0 : fondation auth (profiles + is_staff()/is_admin())
-- Module 1 : annonces
-- ============================================================

-- ── Profils admin (remplace la collection Firestore "users") ──────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nom text,
  role text check (role in ('admin', 'redacteur', 'catechiste')), -- null = simple membre
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_staff() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'redacteur', 'catechiste') and actif = true
  );
$$;

create or replace function public.is_admin() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and actif = true
  );
$$;

drop policy if exists "Lecture de son propre profil ou admin" on public.profiles;
create policy "Lecture de son propre profil ou admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Modification reservee admin" on public.profiles;
create policy "Modification reservee admin"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- Bypass staff pour moderation future (n'existait pas encore) --------------
drop policy if exists "Lecture staff formation_progress" on public.formation_progress;
create policy "Lecture staff formation_progress"
  on public.formation_progress for select
  using (public.is_staff());

drop policy if exists "Lecture staff prayer_intentions" on public.prayer_intentions;
create policy "Lecture staff prayer_intentions"
  on public.prayer_intentions for select
  using (public.is_staff());

-- Premier compte admin -------------------------------------------------------
insert into public.profiles (id, email, nom, role, actif)
select id, email, 'Administrateur', 'admin', true
from auth.users
where email = 'fresneilm139@gmail.com'
on conflict (id) do update set role = 'admin', actif = true;

-- ── Annonces (Module 1) ─────────────────────────────────────────────────────
create table if not exists public.annonces (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text not null,
  tag text not null check (tag in ('Liturgie', 'Formation', 'Prière', 'Événement')),
  date date not null,
  image_url text,
  image_path text,
  epingle boolean not null default false,
  publie boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.annonces enable row level security;

drop policy if exists "Lecture publique si publiee" on public.annonces;
create policy "Lecture publique si publiee"
  on public.annonces for select
  using (publie = true or public.is_staff());

drop policy if exists "Ecriture staff annonces" on public.annonces;
create policy "Ecriture staff annonces"
  on public.annonces for all
  using (public.is_staff())
  with check (public.is_staff());

-- Bucket Storage pour les images d'annonces ----------------------------------
insert into storage.buckets (id, name, public)
values ('annonces', 'annonces', true)
on conflict (id) do nothing;

drop policy if exists "Lecture publique bucket annonces" on storage.objects;
create policy "Lecture publique bucket annonces"
  on storage.objects for select
  using (bucket_id = 'annonces');

drop policy if exists "Ecriture staff bucket annonces" on storage.objects;
create policy "Ecriture staff bucket annonces"
  on storage.objects for insert
  with check (bucket_id = 'annonces' and public.is_staff());

drop policy if exists "Modification staff bucket annonces" on storage.objects;
create policy "Modification staff bucket annonces"
  on storage.objects for update
  using (bucket_id = 'annonces' and public.is_staff());

drop policy if exists "Suppression staff bucket annonces" on storage.objects;
create policy "Suppression staff bucket annonces"
  on storage.objects for delete
  using (bucket_id = 'annonces' and public.is_staff());

-- ── Homelies (Module 2) ─────────────────────────────────────────────────────
create table if not exists public.homelies (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  pretre text not null,
  date date not null,
  texte text not null,
  audio_url text,
  audio_path text,
  liturgie_ref text,
  publie boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.homelies enable row level security;
drop policy if exists "Lecture publique si publiee" on public.homelies;
create policy "Lecture publique si publiee" on public.homelies for select using (publie = true or public.is_staff());
drop policy if exists "Ecriture staff homelies" on public.homelies;
create policy "Ecriture staff homelies" on public.homelies for all using (public.is_staff()) with check (public.is_staff());

insert into storage.buckets (id, name, public) values ('homelies','homelies', true) on conflict (id) do nothing;
drop policy if exists "Lecture publique bucket homelies" on storage.objects;
create policy "Lecture publique bucket homelies" on storage.objects for select using (bucket_id = 'homelies');
drop policy if exists "Ecriture staff bucket homelies" on storage.objects;
create policy "Ecriture staff bucket homelies" on storage.objects for insert with check (bucket_id = 'homelies' and public.is_staff());
drop policy if exists "Modification staff bucket homelies" on storage.objects;
create policy "Modification staff bucket homelies" on storage.objects for update using (bucket_id = 'homelies' and public.is_staff());
drop policy if exists "Suppression staff bucket homelies" on storage.objects;
create policy "Suppression staff bucket homelies" on storage.objects for delete using (bucket_id = 'homelies' and public.is_staff());

-- ── Evenements (Module 3) ────────────────────────────────────────────────────
create table if not exists public.evenements (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text not null,
  type text not null check (type in ('live','replay','evenement')),
  platform text not null check (platform in ('youtube','facebook')),
  url text not null,
  video_id text,
  thumbnail text,
  date date not null,
  heure text,
  est_en_live boolean,
  publie boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.evenements enable row level security;
drop policy if exists "Lecture publique si publiee" on public.evenements;
create policy "Lecture publique si publiee" on public.evenements for select using (publie = true or public.is_staff());
drop policy if exists "Ecriture staff evenements" on public.evenements;
create policy "Ecriture staff evenements" on public.evenements for all using (public.is_staff()) with check (public.is_staff());

-- ── Formations / mouvements (Module 4) ──────────────────────────────────────
create table if not exists public.formations (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text not null,
  tranche text not null,
  modules int not null default 0,
  accent text not null,
  icon text not null,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.formations enable row level security;
drop policy if exists "Lecture publique formations" on public.formations;
create policy "Lecture publique formations" on public.formations for select using (true);
drop policy if exists "Ecriture staff formations" on public.formations;
create policy "Ecriture staff formations" on public.formations for all using (public.is_staff()) with check (public.is_staff());

-- ── Mediatheque (Module 5) ───────────────────────────────────────────────────
create table if not exists public.medias (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  type text not null check (type in ('photo','document','audio','video')),
  url text not null,
  storage_path text,
  taille bigint,
  categorie text not null,
  description text,
  created_at timestamptz not null default now()
);
alter table public.medias enable row level security;
drop policy if exists "Lecture staff medias" on public.medias;
create policy "Lecture staff medias" on public.medias for select using (public.is_staff());
drop policy if exists "Ecriture staff medias" on public.medias;
create policy "Ecriture staff medias" on public.medias for all using (public.is_staff()) with check (public.is_staff());

insert into storage.buckets (id, name, public) values ('medias','medias', false) on conflict (id) do nothing;
drop policy if exists "Lecture staff bucket medias" on storage.objects;
create policy "Lecture staff bucket medias" on storage.objects for select using (bucket_id = 'medias' and public.is_staff());
drop policy if exists "Ecriture staff bucket medias" on storage.objects;
create policy "Ecriture staff bucket medias" on storage.objects for insert with check (bucket_id = 'medias' and public.is_staff());
drop policy if exists "Modification staff bucket medias" on storage.objects;
create policy "Modification staff bucket medias" on storage.objects for update using (bucket_id = 'medias' and public.is_staff());
drop policy if exists "Suppression staff bucket medias" on storage.objects;
create policy "Suppression staff bucket medias" on storage.objects for delete using (bucket_id = 'medias' and public.is_staff());

-- ── Catechisme : cours + modules (Module 6) ─────────────────────────────────
create table if not exists public.cours (
  id uuid primary key default gen_random_uuid(),
  niveau int not null check (niveau in (1,2,3,4)),
  titre text not null,
  tranche text not null,
  description text not null,
  objectif text not null,
  emoji text not null,
  couleur text not null,
  total_modules int not null default 0,
  publie boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.cours enable row level security;
drop policy if exists "Lecture publique si publie" on public.cours;
create policy "Lecture publique si publie" on public.cours for select using (publie = true or public.is_staff());
drop policy if exists "Ecriture staff cours" on public.cours;
create policy "Ecriture staff cours" on public.cours for all using (public.is_staff()) with check (public.is_staff());

create table if not exists public.catechisme_modules (
  id uuid primary key default gen_random_uuid(),
  cours_id uuid not null references public.cours(id) on delete cascade,
  ordre int not null,
  titre text not null,
  sous_titre text,
  emoji text not null,
  contenu text not null,
  activite text,
  priere text not null,
  quiz jsonb not null default '[]',
  publie boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.catechisme_modules enable row level security;
drop policy if exists "Lecture publique si publie" on public.catechisme_modules;
create policy "Lecture publique si publie" on public.catechisme_modules for select using (publie = true or public.is_staff());
drop policy if exists "Ecriture staff modules" on public.catechisme_modules;
create policy "Ecriture staff modules" on public.catechisme_modules for all using (public.is_staff()) with check (public.is_staff());

-- ── Dons (Module 7) ──────────────────────────────────────────────────────────
create table if not exists public.dons (
  id uuid primary key default gen_random_uuid(),
  montant numeric not null,
  devise text not null default 'XAF',
  methode text not null check (methode in ('mtn','airtel','carte','virement')),
  type text not null check (type in ('libre','denier','messe','projet','dime')),
  intention text,
  projet_id text,
  nom_donateur text,
  email_donateur text,
  reference text not null unique,
  statut text not null default 'en_attente' check (statut in ('en_attente','confirme','echec')),
  created_at timestamptz not null default now()
);
alter table public.dons enable row level security;
drop policy if exists "Creation publique dons" on public.dons;
create policy "Creation publique dons" on public.dons for insert with check (true);
drop policy if exists "Lecture staff dons" on public.dons;
create policy "Lecture staff dons" on public.dons for select using (public.is_staff());
drop policy if exists "Modification staff dons" on public.dons;
create policy "Modification staff dons" on public.dons for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "Suppression staff dons" on public.dons;
create policy "Suppression staff dons" on public.dons for delete using (public.is_staff());

-- ── Abonnements (Module 7 bis) ───────────────────────────────────────────────
create table if not exists public.abonnements (
  id uuid primary key default gen_random_uuid(),
  canal text not null check (canal in ('email','whatsapp')),
  contact text not null,
  prefs jsonb not null default '{}',
  confirme boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.abonnements enable row level security;
drop policy if exists "Lecture publique abonnements" on public.abonnements;
create policy "Lecture publique abonnements" on public.abonnements for select using (true);
drop policy if exists "Creation publique abonnements" on public.abonnements;
create policy "Creation publique abonnements" on public.abonnements for insert with check (true);
drop policy if exists "Suppression publique abonnements" on public.abonnements;
create policy "Suppression publique abonnements" on public.abonnements for delete using (true);
drop policy if exists "Modification staff abonnements" on public.abonnements;
create policy "Modification staff abonnements" on public.abonnements for update using (public.is_staff()) with check (public.is_staff());

-- ── Notification tokens (Module 8) ──────────────────────────────────────────
create table if not exists public.notification_tokens (
  token text primary key,
  prefs jsonb not null default '{}',
  platform text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.notification_tokens enable row level security;
drop policy if exists "Ecriture publique notification_tokens" on public.notification_tokens;
create policy "Ecriture publique notification_tokens" on public.notification_tokens for insert with check (true);
drop policy if exists "Maj publique notification_tokens" on public.notification_tokens;
create policy "Maj publique notification_tokens" on public.notification_tokens for update using (true) with check (true);
drop policy if exists "Suppression publique notification_tokens" on public.notification_tokens;
create policy "Suppression publique notification_tokens" on public.notification_tokens for delete using (true);
drop policy if exists "Lecture staff notification_tokens" on public.notification_tokens;
create policy "Lecture staff notification_tokens" on public.notification_tokens for select using (public.is_staff());

-- ── Journaux d'audit (Module 9) ──────────────────────────────────────────────
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('create','update','delete')),
  resource text not null,
  resource_id text not null,
  summary text,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
drop policy if exists "Ecriture staff audit_logs" on public.audit_logs;
create policy "Ecriture staff audit_logs" on public.audit_logs for insert with check (public.is_staff());
drop policy if exists "Lecture admin audit_logs" on public.audit_logs;
create policy "Lecture admin audit_logs" on public.audit_logs for select using (public.is_admin());

-- ── Groupes et mouvements (vitrine admin, pas d'adhesion en ligne pour l'instant) ──
create table if not exists public.groupes (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text not null,
  categorie text not null,
  responsable text,
  horaire text,
  contact text,
  icon text not null,
  publie boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.groupes enable row level security;
drop policy if exists "Lecture publique si publiee" on public.groupes;
create policy "Lecture publique si publiee" on public.groupes for select using (publie = true or public.is_staff());
drop policy if exists "Ecriture staff groupes" on public.groupes;
create policy "Ecriture staff groupes" on public.groupes for all using (public.is_staff()) with check (public.is_staff());

-- ── Demarches pastorales (formulaire unique, soumission anonyme) ───────────
create table if not exists public.demandes_pastorales (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  type text not null check (type in (
    'bapteme','catechisme','mariage','obseques','certificat',
    'intention_messe','accompagnement','benevolat','info_generale'
  )),
  nom text not null,
  contact text not null,
  message text not null,
  statut text not null default 'recue' check (statut in ('recue','en_cours','traitee','archivee')),
  assigne_a uuid references public.profiles(id),
  notes_internes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.demandes_pastorales enable row level security;
drop policy if exists "Creation publique demandes" on public.demandes_pastorales;
create policy "Creation publique demandes" on public.demandes_pastorales for insert with check (true);
drop policy if exists "Lecture staff demandes" on public.demandes_pastorales;
create policy "Lecture staff demandes" on public.demandes_pastorales for select using (public.is_staff());
drop policy if exists "Modification staff demandes" on public.demandes_pastorales;
create policy "Modification staff demandes" on public.demandes_pastorales for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "Suppression staff demandes" on public.demandes_pastorales;
create policy "Suppression staff demandes" on public.demandes_pastorales for delete using (public.is_staff());

-- Elargir la lecture des profils au staff (selecteur "assigne a") -----------
drop policy if exists "Lecture de son propre profil ou admin" on public.profiles;
drop policy if exists "Lecture de son propre profil ou staff" on public.profiles;
create policy "Lecture de son propre profil ou staff" on public.profiles for select using (auth.uid() = id or public.is_staff());

-- ── Traitement pastoral des intentions de priere (meme pattern que demandes_pastorales) ──
alter table public.prayer_intentions add column if not exists est_anonyme boolean not null default false;
alter table public.prayer_intentions add column if not exists statut text not null default 'recue' check (statut in ('recue','en_cours','traitee','archivee'));
alter table public.prayer_intentions add column if not exists assigne_a uuid references public.profiles(id);
alter table public.prayer_intentions add column if not exists notes_internes text;
alter table public.prayer_intentions add column if not exists updated_at timestamptz not null default now();

drop policy if exists "Modification staff prayer_intentions" on public.prayer_intentions;
create policy "Modification staff prayer_intentions" on public.prayer_intentions for update using (public.is_staff()) with check (public.is_staff());

-- ── Projets de dons reels (remplace la liste codee en dur de DonsPage) ──────
-- dons.projet_id reste "text" (convention deja en place) et stocke l'uuid du
-- projet sous forme de chaine -- pas de FK stricte, pour rester coherent avec
-- le type de colonne existant sans operation de migration sur la table dons.
create table if not exists public.projets_dons (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text not null,
  objectif numeric not null check (objectif > 0),
  emoji text not null default '🙏',
  publie boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projets_dons enable row level security;
drop policy if exists "Lecture publique si publie" on public.projets_dons;
create policy "Lecture publique si publie" on public.projets_dons for select using (publie = true or public.is_staff());
drop policy if exists "Ecriture staff projets_dons" on public.projets_dons;
create policy "Ecriture staff projets_dons" on public.projets_dons for all using (public.is_staff()) with check (public.is_staff());

-- ── Espace catéchiste : préparation de séances (pas de données sur des enfants
-- nommément -- la protection des mineurs n'a pas encore de cadre dans l'app) ──
-- ── Rôles et permissions étendus (13 rôles) ─────────────────────────────────
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in (
  'admin','redacteur','catechiste','pretre','secretariat','tresorier',
  'responsable_groupe','animateur_jeunesse','responsable_securite','responsable_liturgie',
  'parent','benevole','membre'
));

create or replace function public.is_staff() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and actif = true and role in (
      'admin','redacteur','catechiste','pretre','secretariat','tresorier',
      'responsable_groupe','animateur_jeunesse','responsable_securite','responsable_liturgie'
    )
  );
$$;

create or replace function public.is_tresorier() returns boolean
language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'tresorier' and actif = true);
$$;

create or replace function public.is_responsable_securite() returns boolean
language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'responsable_securite' and actif = true);
$$;

create or replace function public.is_pretre() returns boolean
language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'pretre' and actif = true);
$$;

create or replace function public.is_secretariat() returns boolean
language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'secretariat' and actif = true);
$$;

create or replace function public.is_animateur_jeunesse() returns boolean
language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'animateur_jeunesse' and actif = true);
$$;

create or replace function public.is_responsable_groupe() returns boolean
language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'responsable_groupe' and actif = true);
$$;

create or replace function public.is_responsable_liturgie() returns boolean
language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'responsable_liturgie' and actif = true);
$$;

-- Ecriture financiere restreinte : admin ou tresorier uniquement (au lieu de tout le staff)
drop policy if exists "Modification staff dons" on public.dons;
create policy "Modification staff dons" on public.dons for update using (public.is_admin() or public.is_tresorier()) with check (public.is_admin() or public.is_tresorier());
drop policy if exists "Suppression staff dons" on public.dons;
create policy "Suppression staff dons" on public.dons for delete using (public.is_admin() or public.is_tresorier());

drop policy if exists "Ecriture staff projets_dons" on public.projets_dons;
create policy "Ecriture staff projets_dons" on public.projets_dons for all using (public.is_admin() or public.is_tresorier()) with check (public.is_admin() or public.is_tresorier());

-- Journaux d'audit : lecture etendue au responsable securite
drop policy if exists "Lecture admin audit_logs" on public.audit_logs;
create policy "Lecture admin audit_logs" on public.audit_logs for select using (public.is_admin() or public.is_responsable_securite());

-- ── Témoignages modérés (soumission anonyme, publication après modération) ──
create table if not exists public.temoignages (
  id uuid primary key default gen_random_uuid(),
  auteur_nom text,
  contenu text not null check (char_length(contenu) between 10 and 2000),
  statut text not null default 'en_attente' check (statut in ('en_attente','approuve','rejete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.temoignages enable row level security;
drop policy if exists "Lecture publique si approuve" on public.temoignages;
create policy "Lecture publique si approuve" on public.temoignages for select using (statut = 'approuve' or public.is_staff());
drop policy if exists "Creation publique temoignages" on public.temoignages;
create policy "Creation publique temoignages" on public.temoignages for insert with check (true);
drop policy if exists "Moderation staff temoignages" on public.temoignages;
create policy "Moderation staff temoignages" on public.temoignages for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "Suppression staff temoignages" on public.temoignages;
create policy "Suppression staff temoignages" on public.temoignages for delete using (public.is_staff());

-- ── Répertoire des services paroissiaux ─────────────────────────────────────
create table if not exists public.services_paroissiaux (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text not null,
  categorie text not null,
  contact text,
  horaire text,
  emoji text not null default '⛪',
  publie boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.services_paroissiaux enable row level security;
drop policy if exists "Lecture publique si publie" on public.services_paroissiaux;
create policy "Lecture publique si publie" on public.services_paroissiaux for select using (publie = true or public.is_staff());
drop policy if exists "Ecriture staff services_paroissiaux" on public.services_paroissiaux;
create policy "Ecriture staff services_paroissiaux" on public.services_paroissiaux for all using (public.is_staff()) with check (public.is_staff());

create table if not exists public.seances_catechisme (
  id uuid primary key default gen_random_uuid(),
  cours_id uuid not null references public.cours(id) on delete cascade,
  date date not null,
  objectifs text not null,
  notes_preparation text,
  statut text not null default 'planifiee' check (statut in ('planifiee','faite','annulee')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.seances_catechisme enable row level security;
drop policy if exists "Gestion staff seances_catechisme" on public.seances_catechisme;
create policy "Gestion staff seances_catechisme" on public.seances_catechisme for all using (public.is_staff()) with check (public.is_staff());

-- ── Leçons typées (refonte : Formation → Parcours → Modules → Leçons) ──────
-- Un Module devient un simple conteneur (titre/sous-titre/emoji) ; tout le
-- contenu réel (texte, vidéo, audio, document, activité, quiz) vit désormais
-- dans des Leçons typées, ordonnées, rattachées à un Module.
alter table public.catechisme_modules alter column contenu drop not null;
alter table public.catechisme_modules alter column priere drop not null;

create table if not exists public.lecons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.catechisme_modules(id) on delete cascade,
  ordre int not null,
  type text not null check (type in ('texte','video','audio','document','activite','quiz')),
  titre text not null,
  contenu text,
  url text,
  quiz jsonb not null default '[]',
  publie boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.lecons enable row level security;
drop policy if exists "Lecture publique si publie" on public.lecons;
create policy "Lecture publique si publie" on public.lecons for select using (publie = true or public.is_staff());
drop policy if exists "Ecriture staff lecons" on public.lecons;
create policy "Ecriture staff lecons" on public.lecons for all using (public.is_staff()) with check (public.is_staff());

-- Migration du contenu existant (tous les modules déjà en base, génériquement,
-- pas seulement Éveil à la Foi) vers des Leçons, sans rien perdre.
insert into public.lecons (module_id, ordre, type, titre, contenu, publie)
select id, 1, 'texte', 'Enseignement', contenu, publie
from public.catechisme_modules
where contenu is not null and length(trim(contenu)) > 0
  and not exists (select 1 from public.lecons l where l.module_id = catechisme_modules.id and l.ordre = 1);

insert into public.lecons (module_id, ordre, type, titre, contenu, publie)
select id, 2, 'activite', 'Activité', activite, publie
from public.catechisme_modules
where activite is not null and length(trim(activite)) > 0
  and not exists (select 1 from public.lecons l where l.module_id = catechisme_modules.id and l.ordre = 2);

insert into public.lecons (module_id, ordre, type, titre, contenu, publie)
select id, 3, 'texte', 'Prière', priere, publie
from public.catechisme_modules
where priere is not null and length(trim(priere)) > 0
  and not exists (select 1 from public.lecons l where l.module_id = catechisme_modules.id and l.ordre = 3);

insert into public.lecons (module_id, ordre, type, titre, quiz, publie)
select id, 4, 'quiz', 'Quiz', quiz, publie
from public.catechisme_modules
where jsonb_array_length(quiz) > 0
  and not exists (select 1 from public.lecons l where l.module_id = catechisme_modules.id and l.ordre = 4);

-- ── Formations (niveau au-dessus de Cours -- regroupe plusieurs Cours/Parcours) ──
create table if not exists public.formations_catechisme (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text not null,
  emoji text not null default '📚',
  ordre int not null default 0,
  publie boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.formations_catechisme enable row level security;
drop policy if exists "Lecture publique si publie" on public.formations_catechisme;
create policy "Lecture publique si publie" on public.formations_catechisme for select using (publie = true or public.is_staff());
drop policy if exists "Ecriture staff formations_catechisme" on public.formations_catechisme;
create policy "Ecriture staff formations_catechisme" on public.formations_catechisme for all using (public.is_staff()) with check (public.is_staff());

alter table public.cours add column if not exists formation_id uuid references public.formations_catechisme(id);

-- ── Progression par module (permet un "prochaine leçon" réel dans le profil,
-- au lieu du seul statut par cours de formation_progress) ──────────────────
create table if not exists public.module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cours_id uuid not null,
  module_id uuid not null,
  completed_at timestamptz not null default now(),
  unique (user_id, module_id)
);
create index if not exists module_progress_user_id_idx on public.module_progress(user_id);
alter table public.module_progress enable row level security;
drop policy if exists "Gestion de sa propre progression module" on public.module_progress;
create policy "Gestion de sa propre progression module" on public.module_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
