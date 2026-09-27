-- Imitation minimale de l'environnement Supabase, pour tester le schéma et les
-- politiques RLS sur un PostgreSQL local (JAMAIS à exécuter sur Supabase).
create extension if not exists pgcrypto;
do $$ begin
  create role anon nologin;
exception when duplicate_object then null; end $$;
do $$ begin
  create role authenticated nologin;
exception when duplicate_object then null; end $$;
do $$ begin
  create role service_role nologin bypassrls;
exception when duplicate_object then null; end $$;

create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb not null default '{}',
  created_at timestamptz not null default now()
);
-- auth.uid() lit l'identifiant simulé de la session (set_config('request.jwt.claim.sub', …)).
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

-- auth.jwt() : jeton simulé. Niveau d'assurance lu dans request.jwt.claim.aal
-- (« aal2 » par défaut : les tests de droits supposent un staff passé par la
-- double authentification ; les tests MFA posent « aal1 » explicitement).
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object(
    'sub', nullif(current_setting('request.jwt.claim.sub', true), ''),
    'aal', coalesce(nullif(current_setting('request.jwt.claim.aal', true), ''), 'aal2'))
$$;

create schema if not exists storage;
create table if not exists storage.buckets (id text primary key, name text, public boolean default false);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid,
  created_at timestamptz default now()
);
alter table storage.objects enable row level security;

grant usage on schema public, auth, storage to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated;
grant execute on function auth.jwt() to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
