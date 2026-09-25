-- ════════════════════════════════════════════════════════════════════════════
-- Cahier des charges — compléments (à exécuter APRÈS 20260926000000_…).
--
--  1. archdiocese_id sur toutes les tables (multi-archidiocèse), droits limités
--     à l'archidiocèse de la personne, audit « où » complet
--  2. Présences aux séances et progression par enfant (vue parent)
--  3. Histoire de l'archidiocèse, chartes (média, protection des mineurs)
--  4. Alertes aux responsables à chaque nouvelle demande
--  5. Temps de visionnage des vidéos, modération média centrale
--  6. Démarches : formulaires détaillés + suivi sans compte
--  7. Programmes de référence : duplication dans une paroisse
--  8. Données personnelles : export et suppression du compte
--  9. Contenus exemples complémentaires (brouillons)
--
-- Idempotent : peut être rejoué sans risque.
-- ════════════════════════════════════════════════════════════════════════════


-- ── 1. archdiocese_id partout ───────────────────────────────────────────────

create or replace function public.default_archdiocese_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.archdioceses where slug = 'brazzaville';
$$;

alter table public.profiles add column if not exists archdiocese_id uuid references public.archdioceses(id);
update public.profiles set archdiocese_id = public.default_archdiocese_id() where archdiocese_id is null;
alter table public.profiles alter column archdiocese_id set default public.default_archdiocese_id();

create or replace function public.mon_archidiocese() returns uuid
language sql stable security definer set search_path = public as $$
  select archdiocese_id from public.profiles where id = auth.uid();
$$;

create or replace function public.parish_arch(p uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select archdiocese_id from public.parishes where id = p;
$$;

-- Rattachement automatique : l'archidiocèse suit la paroisse ; un contenu sans
-- paroisse appartient à l'archidiocèse de la personne qui le crée.
create or replace function public.sync_archdiocese() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.parish_id is not null then
    new.archdiocese_id := public.parish_arch(new.parish_id);
  elsif tg_op = 'INSERT' then
    new.archdiocese_id := coalesce(public.mon_archidiocese(), new.archdiocese_id, public.default_archdiocese_id());
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'annonces','homelies','evenements','formations','medias','cours','formations_catechisme',
    'groupes','projets_dons','services_paroissiaux','enfants','dons','demandes_pastorales',
    'prayer_intentions','signalements','temoignages','abonnements','notification_tokens',
    'notifications_log','audit_logs','evangelization_paths','live_events','playlists','groupe_adhesions'
  ] loop
    execute format('alter table public.%I add column if not exists archdiocese_id uuid references public.archdioceses(id)', t);
    execute format('update public.%I x set archdiocese_id = coalesce(public.parish_arch(x.parish_id), public.default_archdiocese_id()) where archdiocese_id is null', t);
    execute format('alter table public.%I alter column archdiocese_id set default public.default_archdiocese_id()', t);
    execute format('alter table public.%I alter column archdiocese_id set not null', t);
    execute format('create index if not exists %I on public.%I(archdiocese_id)', t || '_arch_idx', t);
    execute format('drop trigger if exists sync_archdiocese on public.%I', t);
    execute format('create trigger sync_archdiocese before insert or update of parish_id on public.%I for each row execute function public.sync_archdiocese()', t);
  end loop;
end $$;

-- Rôles archidiocésains : « admin » = administrateur de la plateforme (tous les
-- archidiocèses) ; archevêque et rôles diocésains = leur archidiocèse seulement.
create or replace function public.has_global_role_de(roles text[], a uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and actif and role = any(roles) and (role = 'admin' or archdiocese_id = a)
  );
$$;

create or replace function public.is_admin_de(a uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_global_role(array['admin'])
      or public.has_global_role_de(array['archeveque','admin_diocesain'], a);
$$;

create or replace function public.can_manage(p uuid, a uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin_de(a)
      or (p is null and public.has_global_role_de(array['admin_evangelisation','responsable_media_diocesain','coordinateur_catechese_diocesain'], a))
      or (p is not null and public.has_parish_role(p, public.parish_staff_roles()));
$$;

-- Version à un argument (appels depuis le site et la fonction Edge).
create or replace function public.can_manage(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.can_manage(p, coalesce(public.parish_arch(p), public.mon_archidiocese()));
$$;

-- Modération centrale : le responsable média diocésain intervient aussi sur les contenus des paroisses.
create or replace function public.can_moderer_media(p uuid, a uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.can_manage(p, a) or public.has_global_role_de(array['responsable_media_diocesain'], a);
$$;

create or replace function public.can_manage_dons(p uuid, a uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin_de(a) or public.has_parish_role(p, array['admin_paroisse','tresorier']);
$$;

create or replace function public.can_protect(p uuid, a uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin_de(a) or public.has_global_role_de(array['responsable_securite'], a)
      or public.has_parish_role(p, array['admin_paroisse','responsable_securite','catechiste','coordinateur_catechese','secretariat']);
$$;

create or replace function public.can_signalement(p uuid, a uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin_de(a) or public.has_global_role_de(array['responsable_securite'], a)
      or public.has_parish_role(p, array['responsable_securite']);
$$;

-- Aides pour les tables « enfants » d'une autre table.
create or replace function public.can_manage_cours(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select public.can_manage(parish_id, archdiocese_id) from public.cours where id = c), false);
$$;
create or replace function public.can_manage_module(m uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select public.can_manage_cours(cours_id) from public.catechisme_modules where id = m), false);
$$;
create or replace function public.can_manage_path(pa uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select public.can_manage(parish_id, archdiocese_id) from public.evangelization_paths where id = pa), false);
$$;
create or replace function public.can_manage_playlist(pl uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select public.can_moderer_media(parish_id, archdiocese_id) from public.playlists where id = pl), false);
$$;
create or replace function public.can_protect_enfant(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select public.can_protect(parish_id, archdiocese_id) from public.enfants where id = e), false);
$$;
create or replace function public.est_parent_de(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.enfants where id = e and parent_profile_id = auth.uid());
$$;

-- Le profil suit l'archidiocèse de la paroisse choisie à l'inscription.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_parish uuid;
begin
  begin
    v_parish := (new.raw_user_meta_data->>'parish_id')::uuid;
  exception when others then
    v_parish := null;
  end;
  if v_parish is null or not exists (select 1 from public.parishes where id = v_parish and actif) then
    v_parish := public.default_parish_id();
  end if;

  insert into public.profiles (id, email, nom, telephone, actif, archdiocese_id)
  values (new.id, coalesce(new.email, ''),
          nullif(trim(new.raw_user_meta_data->>'nom'), ''),
          nullif(trim(new.raw_user_meta_data->>'telephone'), ''), true,
          coalesce(public.parish_arch(v_parish), public.default_archdiocese_id()))
  on conflict (id) do nothing;

  insert into public.parish_members (user_id, parish_id, role, principale)
  values (new.id, v_parish, 'membre', true)
  on conflict do nothing;
  return new;
end $$;


-- ── 2. Présences et progression par enfant ──────────────────────────────────

create table if not exists public.presences (
  id uuid primary key default gen_random_uuid(),
  seance_id uuid not null references public.seances_catechisme(id) on delete cascade,
  enfant_id uuid not null references public.enfants(id) on delete cascade,
  statut text not null check (statut in ('present','absent','excuse')),
  note text,
  saisi_par uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seance_id, enfant_id)
);
create index if not exists presences_enfant_idx on public.presences(enfant_id);

create table if not exists public.enfant_progress (
  id uuid primary key default gen_random_uuid(),
  enfant_id uuid not null references public.enfants(id) on delete cascade,
  cours_id uuid not null references public.cours(id) on delete cascade,
  module_id uuid not null references public.catechisme_modules(id) on delete cascade,
  statut text not null default 'valide' check (statut in ('en_cours','valide')),
  note text,
  saisi_par uuid references public.profiles(id) default auth.uid(),
  date date not null default current_date,
  unique (enfant_id, module_id)
);
create index if not exists enfant_progress_enfant_idx on public.enfant_progress(enfant_id);


-- ── 3. Histoire de l'archidiocèse, chartes ──────────────────────────────────

alter table public.archdioceses add column if not exists presentation text;
alter table public.archdioceses add column if not exists histoire text;
alter table public.archdioceses add column if not exists histoire_maj timestamptz;

update public.archdioceses set
  presentation = coalesce(presentation, 'L''Archidiocèse de Brazzaville rassemble les paroisses de la capitale congolaise autour de la Cathédrale Sacré-Cœur, son église mère.'),
  histoire = coalesce(histoire, E'## Les origines\n\nEn août 1887, le père Hippolyte Carrié obtient une concession sur la Butte de l''Aiglon pour y installer la Mission du Saint-Esprit. Le père Prosper Augouard pose en 1892 la première pierre de l''église qui deviendra la cathédrale, consacrée en 1894.\n\n## Un archidiocèse\n\nLe 14 septembre 1955, le vicariat apostolique de Brazzaville est érigé en archidiocèse.\n\n## Le Cardinal Émile Biayenda\n\nArchevêque de Brazzaville à partir de 1971, créé cardinal par le pape Paul VI en 1973, Émile Biayenda est le premier cardinal congolais. Assassiné le 22 mars 1977, il repose dans la cathédrale ; sa cause de béatification est ouverte depuis 1995.\n\n> Texte provisoire, repris de la page Histoire du site : à compléter par l''archevêché (paroisses, archevêques successifs, grandes étapes).')
where slug = 'brazzaville';

create table if not exists public.chartes (
  id uuid primary key default gen_random_uuid(),
  archdiocese_id uuid not null references public.archdioceses(id) default public.default_archdiocese_id(),
  slug text not null check (slug in ('media','protection-mineurs')),
  titre text not null,
  contenu text not null default '',
  version int not null default 1,
  publie boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (archdiocese_id, slug)
);

insert into public.chartes (slug, titre, contenu) values
  ('media', 'Charte média de l''archidiocèse', E'> **PROJET — à relire et adopter par l''archevêché avant publication.**\n\n## 1. Objet\n\nCette charte encadre les contenus publiés au nom de l''archidiocèse et de ses paroisses : vidéos, directs, photos, textes et publications sur les réseaux sociaux.\n\n## 2. Fidélité à l''Église\n\n- Les enseignements publiés sont conformes à la foi et à la doctrine de l''Église catholique.\n- Les homélies et enseignements sont publiés avec l''accord de leur auteur.\n- Un contenu engageant l''archidiocèse est validé par le responsable média diocésain.\n\n## 3. Respect des personnes\n\n- Aucune image d''un mineur n''est publiée sans le consentement écrit de ses parents (voir la charte de protection des mineurs).\n- Les fidèles filmés pendant une célébration en sont informés ; ceux qui ne le souhaitent pas peuvent se placer hors champ.\n- Les témoignages ne sont publiés qu''avec l''accord de leur auteur et après relecture pastorale.\n\n## 4. Droits d''auteur\n\n- Les textes liturgiques proviennent de l''AELF ; musiques, images et vidéos de tiers ne sont utilisées qu''avec autorisation.\n\n## 5. Directs\n\n- Chaque direct est annoncé dans le programme de la chaîne.\n- La personne responsable du direct veille à la dignité de la célébration à l''écran.\n\n## 6. Modération\n\n- Le responsable média diocésain peut retirer ou masquer tout contenu contraire à cette charte, dans toutes les paroisses.\n\nDate d''adoption : ______________'),
  ('protection-mineurs', 'Charte de protection des mineurs', E'> **PROJET — document de travail, à relire, adapter et adopter avant publication.**\n\n## 1. Objet et champ d''application\n\nCette charte a pour but de protéger les enfants et les jeunes mineurs qui participent aux activités des paroisses (catéchisme, groupes de jeunesse, mouvements, sorties, célébrations) et de donner aux adultes qui les encadrent un cadre clair de comportement et de vigilance. Elle s''applique à toute personne majeure encadrant, même occasionnellement, une activité réunissant des mineurs.\n\n## 2. Principes généraux\n\n- Le bien-être et la sécurité de l''enfant priment sur toute autre considération.\n- La vigilance est l''affaire de tous : chaque adulte encadrant signale une situation qui l''inquiète, même sans certitude.\n- Aucune situation de signalement ne doit être minimisée ou traitée seul.\n- La confidentialité protège l''enfant et la personne qui signale, jamais un comportement problématique.\n\n## 3. Code de conduite\n\n- **Règle des deux adultes** : un adulte ne se retrouve jamais seul avec un mineur hors de la vue d''autres personnes.\n- **Communication** : les échanges avec un mineur passent par un canal partagé avec les parents ou un autre adulte.\n- **Contact physique** : limité au nécessaire et à l''approprié, jamais en privé.\n- **Discipline** : aucune sanction physique, humiliation ou intimidation.\n- **Images** : aucune photo ou vidéo d''un mineur publiée sans consentement parental.\n- **Transport** : un enfant n''est transporté seul par un adulte qu''avec l''accord explicite des parents.\n\n## 4. Consentement parental\n\nLe consentement écrit d''un parent est requis avant toute participation régulière, toute sortie et toute utilisation de l''image de l''enfant. Il peut être retiré à tout moment.\n\n## 5. Signalement\n\nToute personne peut signaler une préoccupation, avec ou sans donner son identité, sur la page « Signaler ». Le signalement est traité par le responsable de la protection des mineurs, n''est jamais visible par la personne concernée, et la personne qui signale de bonne foi est protégée.\n\n## 6. Vérification des encadrants\n\nAvant une mission régulière auprès de mineurs, le parcours de l''encadrant est vérifié ; la formation « Protection des mineurs » est obligatoire.\n\n## 7. Données\n\nLes données d''un enfant sont limitées au strict nécessaire et accessibles aux seules personnes qui en ont besoin.\n\nDate d''adoption : ______________')
on conflict (archdiocese_id, slug) do nothing;


-- ── 4. Alertes aux responsables ─────────────────────────────────────────────

create table if not exists public.alertes (
  id uuid primary key default gen_random_uuid(),
  archdiocese_id uuid not null references public.archdioceses(id),
  parish_id uuid references public.parishes(id) on delete cascade,
  type text not null check (type in ('demarche','intention','temoignage','adhesion','signalement','don')),
  titre text not null,
  lien text not null,
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists alertes_scope_idx on public.alertes(archdiocese_id, parish_id, created_at desc);

create table if not exists public.alertes_lues (
  user_id uuid not null references auth.users(id) on delete cascade,
  alerte_id uuid not null references public.alertes(id) on delete cascade,
  lue_le timestamptz not null default now(),
  primary key (user_id, alerte_id)
);

create or replace function public.creer_alerte() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_type text; v_titre text; v_lien text;
begin
  case tg_table_name
    when 'demandes_pastorales' then v_type := 'demarche';  v_titre := 'Nouvelle démarche : ' || new.type; v_lien := '/admin/demarches';
    when 'prayer_intentions'   then v_type := 'intention'; v_titre := 'Nouvelle intention de prière';     v_lien := '/admin/intentions';
    when 'temoignages'         then v_type := 'temoignage';v_titre := 'Témoignage à modérer';             v_lien := '/admin/temoignages';
    when 'groupe_adhesions'    then v_type := 'adhesion';  v_titre := 'Demande d''adhésion : ' || new.nom; v_lien := '/admin/groupes';
    when 'signalements'        then v_type := 'signalement'; v_titre := 'Nouveau signalement (protection des mineurs)'; v_lien := '/admin/signalements';
    when 'dons'                then v_type := 'don';       v_titre := 'Don à vérifier : ' || new.montant || ' XAF'; v_lien := '/admin/dons';
  end case;
  insert into public.alertes (archdiocese_id, parish_id, type, titre, lien, ref_id)
  values (new.archdiocese_id, new.parish_id, v_type, v_titre, v_lien, new.id);
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['demandes_pastorales','prayer_intentions','temoignages','groupe_adhesions','signalements','dons'] loop
    execute format('drop trigger if exists alerte_nouvelle_demande on public.%I', t);
    execute format('create trigger alerte_nouvelle_demande after insert on public.%I for each row execute function public.creer_alerte()', t);
  end loop;
end $$;


-- ── 5. Médiation : temps de visionnage ──────────────────────────────────────

alter table public.evenements add column if not exists secondes_vues bigint not null default 0;

create or replace function public.ajouter_visionnage(p_id uuid, p_secondes int)
returns void language sql security definer set search_path = public as $$
  update public.evenements set secondes_vues = secondes_vues + least(greatest(p_secondes, 0), 14400)
  where id = p_id and publie;
$$;
grant execute on function public.ajouter_visionnage(uuid, int) to anon, authenticated;


-- ── 6. Démarches : détails par type + suivi sans compte ─────────────────────

alter table public.demandes_pastorales add column if not exists details jsonb not null default '{}';

-- Suivi par référence : il faut aussi le contact saisi (évite qu'une référence seule suffise).
create or replace function public.suivre_demande(p_reference text, p_contact text)
returns table (type text, statut text, created_at timestamptz, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select d.type, d.statut, d.created_at, d.updated_at from public.demandes_pastorales d
  where d.reference = upper(trim(p_reference))
    and regexp_replace(lower(d.contact), '[^a-z0-9@.]', '', 'g') = regexp_replace(lower(p_contact), '[^a-z0-9@.]', '', 'g');
$$;
grant execute on function public.suivre_demande(text, text) to anon, authenticated;


-- ── 7. Programmes de référence : duplication dans une paroisse ──────────────

create or replace function public.dupliquer_cours(p_cours uuid, p_parish uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_new uuid; m record; v_mod uuid;
begin
  if not public.can_manage(p_parish) then raise exception 'Accès refusé'; end if;
  if not exists (select 1 from public.cours where id = p_cours and (publie or public.can_manage(parish_id, archdiocese_id))) then
    raise exception 'Cours introuvable';
  end if;
  insert into public.cours (niveau, titre, tranche, description, objectif, emoji, couleur, total_modules, publie, formation_id, parish_id)
  select niveau, titre, tranche, description, objectif, emoji, couleur, total_modules, false, formation_id, p_parish
  from public.cours where id = p_cours returning id into v_new;
  for m in select * from public.catechisme_modules where cours_id = p_cours order by ordre loop
    insert into public.catechisme_modules (cours_id, ordre, titre, sous_titre, emoji, contenu, activite, priere, quiz, publie)
    values (v_new, m.ordre, m.titre, m.sous_titre, m.emoji, m.contenu, m.activite, m.priere, m.quiz, m.publie)
    returning id into v_mod;
    insert into public.lecons (module_id, ordre, type, titre, contenu, url, quiz, publie)
    select v_mod, ordre, type, titre, contenu, url, quiz, publie from public.lecons where module_id = m.id;
  end loop;
  return v_new;
end $$;

create or replace function public.dupliquer_parcours(p_path uuid, p_parish uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_new uuid; v_slug text;
begin
  if not public.can_manage(p_parish) then raise exception 'Accès refusé'; end if;
  if not exists (select 1 from public.evangelization_paths where id = p_path and (publie or public.can_manage(parish_id, archdiocese_id))) then
    raise exception 'Parcours introuvable';
  end if;
  select slug || '-' || (select slug from public.parishes where id = p_parish) into v_slug from public.evangelization_paths where id = p_path;
  if v_slug is null then raise exception 'Parcours introuvable'; end if;
  insert into public.evangelization_paths (parish_id, type, titre, slug, description, emoji, image_url, duree, obligatoire_pour, ordre, publie)
  select p_parish, type, titre, left(v_slug, 120), description, emoji, image_url, duree, obligatoire_pour, ordre, false
  from public.evangelization_paths where id = p_path returning id into v_new;
  insert into public.path_steps (path_id, ordre, titre, contenu, video_url, quiz, appel_action)
  select v_new, ordre, titre, contenu, video_url, quiz, appel_action from public.path_steps where path_id = p_path;
  return v_new;
end $$;

grant execute on function public.dupliquer_cours(uuid, uuid) to authenticated;
grant execute on function public.dupliquer_parcours(uuid, uuid) to authenticated;


-- ── 8. Données personnelles ─────────────────────────────────────────────────

create or replace function public.exporter_mes_donnees()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'exporte_le', now(),
    'profil', (select to_jsonb(p) - 'verifie_par' from public.profiles p where p.id = auth.uid()),
    'paroisses', (select coalesce(jsonb_agg(jsonb_build_object('paroisse', pa.nom, 'role', m.role, 'principale', m.principale)), '[]')
                  from public.parish_members m join public.parishes pa on pa.id = m.parish_id where m.user_id = auth.uid()),
    'intentions', (select coalesce(jsonb_agg(to_jsonb(i) - 'notes_internes' - 'assigne_a'), '[]') from public.prayer_intentions i where i.user_id = auth.uid()),
    'demarches', (select coalesce(jsonb_agg(to_jsonb(d) - 'notes_internes' - 'assigne_a'), '[]') from public.demandes_pastorales d where d.user_id = auth.uid()),
    'dons', (select coalesce(jsonb_agg(to_jsonb(d)), '[]') from public.dons d where d.user_id = auth.uid()),
    'temoignages', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from public.temoignages t where t.user_id = auth.uid()),
    'parcours', (select coalesce(jsonb_agg(to_jsonb(u)), '[]') from public.user_path_progress u where u.user_id = auth.uid()),
    'catechese', (select coalesce(jsonb_agg(to_jsonb(f)), '[]') from public.formation_progress f where f.user_id = auth.uid()),
    'adhesions', (select coalesce(jsonb_agg(to_jsonb(g)), '[]') from public.groupe_adhesions g where g.user_id = auth.uid())
  );
$$;

-- Supprime le compte et les données personnelles liées. Les dons et démarches
-- sont conservés sans lien avec le compte (obligations comptables et pastorales).
create or replace function public.supprimer_mon_compte()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  delete from auth.users where id = auth.uid();
end $$;

grant execute on function public.exporter_mes_donnees() to authenticated;
grant execute on function public.supprimer_mon_compte() to authenticated;


-- ── 9. Politiques RLS (réécriture complète avec l'archidiocèse) ─────────────

alter table public.presences enable row level security;
alter table public.enfant_progress enable row level security;
alter table public.chartes enable row level security;
alter table public.alertes enable row level security;
alter table public.alertes_lues enable row level security;

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
      'playlist_items','testimony_categories','groupe_adhesions','presences','enfant_progress',
      'chartes','alertes','alertes_lues'
    ])
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Référentiel
create policy "Lecture publique" on public.archdioceses for select using (true);
create policy "Gestion admin de l'archidiocese" on public.archdioceses for update using (public.is_admin_de(id)) with check (public.is_admin_de(id));
create policy "Creation admin plateforme" on public.archdioceses for insert with check (public.has_global_role(array['admin']));

create policy "Lecture publique si active" on public.parishes for select using (actif or public.can_manage(id, archdiocese_id));
create policy "Creation admin" on public.parishes for insert with check (public.is_admin_de(archdiocese_id));
create policy "Modification admin ou admin paroisse" on public.parishes for update
  using (public.is_admin_de(archdiocese_id) or public.has_parish_role(id, array['admin_paroisse']))
  with check (public.is_admin_de(archdiocese_id) or public.has_parish_role(id, array['admin_paroisse']));
create policy "Suppression admin" on public.parishes for delete using (public.is_admin_de(archdiocese_id));

create policy "Lecture soi ou gestionnaires" on public.parish_members for select
  using (user_id = auth.uid() or public.can_manage(parish_id));
create policy "Nomination" on public.parish_members for insert
  with check (public.is_admin_de(public.parish_arch(parish_id)) or public.has_parish_role(parish_id, array['admin_paroisse'])
              or (user_id = auth.uid() and role = 'membre'));
create policy "Modification" on public.parish_members for update
  using (public.is_admin_de(public.parish_arch(parish_id)) or public.has_parish_role(parish_id, array['admin_paroisse']))
  with check (public.is_admin_de(public.parish_arch(parish_id)) or public.has_parish_role(parish_id, array['admin_paroisse']));
create policy "Retrait" on public.parish_members for delete
  using (public.is_admin_de(public.parish_arch(parish_id)) or public.has_parish_role(parish_id, array['admin_paroisse'])
         or (user_id = auth.uid() and role = 'membre'));

-- Profils : les administrateurs gèrent les comptes de leur archidiocèse.
create policy "Lecture soi ou staff" on public.profiles for select using (auth.uid() = id or public.is_staff());
create policy "Gestion admin" on public.profiles for all using (public.is_admin_de(archdiocese_id)) with check (public.is_admin_de(archdiocese_id));

-- Progression personnelle
create policy "Gestion de sa progression" on public.formation_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Lecture staff" on public.formation_progress for select using (public.is_staff());
create policy "Gestion de sa progression" on public.module_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Lecture staff" on public.module_progress for select using (public.is_staff());

-- Contenus publiés
do $$
declare t text;
begin
  foreach t in array array['annonces','homelies','groupes','services_paroissiaux','cours','formations_catechisme','evangelization_paths'] loop
    execute format('create policy "Lecture publique si publie" on public.%I for select using (publie or public.can_manage(parish_id, archdiocese_id))', t);
    execute format('create policy "Gestion par la paroisse" on public.%I for all using (public.can_manage(parish_id, archdiocese_id)) with check (public.can_manage(parish_id, archdiocese_id))', t);
  end loop;
  -- Médias : modération centrale possible par le responsable média diocésain.
  foreach t in array array['evenements','medias','live_events','playlists'] loop
    execute format('create policy "Lecture publique si publie" on public.%I for select using (publie or public.can_moderer_media(parish_id, archdiocese_id))', t);
    execute format('create policy "Gestion media" on public.%I for all using (public.can_moderer_media(parish_id, archdiocese_id)) with check (public.can_moderer_media(parish_id, archdiocese_id))', t);
  end loop;
end $$;

create policy "Lecture publique" on public.formations for select using (true);
create policy "Gestion par la paroisse" on public.formations for all using (public.can_manage(parish_id, archdiocese_id)) with check (public.can_manage(parish_id, archdiocese_id));

create policy "Lecture publique si publie" on public.catechisme_modules for select using (publie or public.can_manage_cours(cours_id));
create policy "Gestion par la paroisse" on public.catechisme_modules for all using (public.can_manage_cours(cours_id)) with check (public.can_manage_cours(cours_id));
create policy "Lecture publique si publie" on public.lecons for select using (publie or public.can_manage_module(module_id));
create policy "Gestion par la paroisse" on public.lecons for all using (public.can_manage_module(module_id)) with check (public.can_manage_module(module_id));
create policy "Gestion par la paroisse" on public.seances_catechisme for all using (public.can_manage_cours(cours_id)) with check (public.can_manage_cours(cours_id));

create policy "Lecture publique si parcours publie" on public.path_steps for select using (public.path_publie(path_id) or public.can_manage_path(path_id));
create policy "Gestion par la paroisse" on public.path_steps for all using (public.can_manage_path(path_id)) with check (public.can_manage_path(path_id));
create policy "Gestion de sa progression" on public.user_path_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Lecture gestionnaires" on public.user_path_progress for select using (public.can_manage_path(path_id));

create policy "Lecture publique" on public.playlist_items for select using (true);
create policy "Gestion media" on public.playlist_items for all using (public.can_manage_playlist(playlist_id)) with check (public.can_manage_playlist(playlist_id));

create policy "Lecture publique" on public.testimony_categories for select using (true);
create policy "Gestion admin" on public.testimony_categories for all using (public.is_admin()) with check (public.is_admin());

-- Dons
create policy "Lecture publique si publie" on public.projets_dons for select using (publie or public.can_manage_dons(parish_id, archdiocese_id));
create policy "Gestion tresorerie" on public.projets_dons for all using (public.can_manage_dons(parish_id, archdiocese_id)) with check (public.can_manage_dons(parish_id, archdiocese_id));
create policy "Creation publique" on public.dons for insert with check (user_id is null or user_id = auth.uid());
create policy "Lecture tresorerie ou donateur" on public.dons for select using (public.can_manage_dons(parish_id, archdiocese_id) or user_id = auth.uid());
create policy "Modification tresorerie" on public.dons for update using (public.can_manage_dons(parish_id, archdiocese_id)) with check (public.can_manage_dons(parish_id, archdiocese_id));
create policy "Suppression tresorerie" on public.dons for delete using (public.can_manage_dons(parish_id, archdiocese_id));

-- Demandes des fidèles
create policy "Creation publique" on public.demandes_pastorales for insert with check (user_id is null or user_id = auth.uid());
create policy "Lecture gestionnaires ou demandeur" on public.demandes_pastorales for select using (public.can_manage(parish_id, archdiocese_id) or user_id = auth.uid());
create policy "Modification gestionnaires" on public.demandes_pastorales for update using (public.can_manage(parish_id, archdiocese_id)) with check (public.can_manage(parish_id, archdiocese_id));
create policy "Suppression gestionnaires" on public.demandes_pastorales for delete using (public.can_manage(parish_id, archdiocese_id));

create policy "Lecture publiques, siennes ou gestionnaires" on public.prayer_intentions for select using (is_public or auth.uid() = user_id or public.can_manage(parish_id, archdiocese_id));
create policy "Depot de sa propre intention" on public.prayer_intentions for insert with check (auth.uid() = user_id);
create policy "Modification gestionnaires" on public.prayer_intentions for update using (public.can_manage(parish_id, archdiocese_id)) with check (public.can_manage(parish_id, archdiocese_id));
create policy "Suppression soi ou gestionnaires" on public.prayer_intentions for delete using (auth.uid() = user_id or public.can_manage(parish_id, archdiocese_id));

create policy "Lecture si approuve, sien ou moderateurs" on public.temoignages for select using (statut = 'approuve' or user_id = auth.uid() or public.can_moderer_media(parish_id, archdiocese_id));
create policy "Creation publique" on public.temoignages for insert with check ((user_id is null or user_id = auth.uid()) and statut = 'en_attente' and not mis_en_avant);
create policy "Moderation" on public.temoignages for update using (public.can_moderer_media(parish_id, archdiocese_id)) with check (public.can_moderer_media(parish_id, archdiocese_id));
create policy "Suppression moderateurs" on public.temoignages for delete using (public.can_moderer_media(parish_id, archdiocese_id));

create policy "Creation publique" on public.groupe_adhesions for insert with check ((user_id is null or user_id = auth.uid()) and statut = 'nouvelle');
create policy "Lecture gestionnaires ou demandeur" on public.groupe_adhesions for select using (public.can_manage(parish_id, archdiocese_id) or user_id = auth.uid());
create policy "Modification gestionnaires" on public.groupe_adhesions for update using (public.can_manage(parish_id, archdiocese_id)) with check (public.can_manage(parish_id, archdiocese_id));
create policy "Suppression gestionnaires" on public.groupe_adhesions for delete using (public.can_manage(parish_id, archdiocese_id));

-- Abonnés et notifications
create policy "Lecture gestionnaires" on public.abonnements for select using (public.can_manage(parish_id, archdiocese_id));
create policy "Modification gestionnaires" on public.abonnements for update using (public.can_manage(parish_id, archdiocese_id)) with check (public.can_manage(parish_id, archdiocese_id));
create policy "Suppression gestionnaires" on public.abonnements for delete using (public.can_manage(parish_id, archdiocese_id));
create policy "Lecture staff" on public.notification_tokens for select using (public.is_staff());
create policy "Lecture gestionnaires" on public.notifications_log for select using (public.can_manage(parish_id, archdiocese_id));
create policy "Ecriture gestionnaires" on public.notifications_log for insert with check (public.can_manage(parish_id, archdiocese_id));

-- Journal d'audit (qui, quoi, quand, où)
create policy "Ecriture staff" on public.audit_logs for insert with check (public.is_staff());
create policy "Lecture admin, securite ou admin paroisse" on public.audit_logs for select
  using (public.is_admin_de(archdiocese_id) or public.has_global_role_de(array['responsable_securite'], archdiocese_id)
         or public.has_parish_role(parish_id, array['admin_paroisse']));

-- Protection des mineurs
create policy "Gestion protection mineurs" on public.enfants for all using (public.can_protect(parish_id, archdiocese_id)) with check (public.can_protect(parish_id, archdiocese_id));
create policy "Lecture par le parent" on public.enfants for select using (parent_profile_id = auth.uid());
create policy "Gestion protection mineurs" on public.consentements_parentaux for all using (public.can_protect_enfant(enfant_id)) with check (public.can_protect_enfant(enfant_id));
create policy "Lecture par le parent" on public.consentements_parentaux for select using (public.est_parent_de(enfant_id));
create policy "Creation publique" on public.signalements for insert with check (true);
create policy "Lecture restreinte" on public.signalements for select using (public.can_signalement(parish_id, archdiocese_id));
create policy "Modification restreinte" on public.signalements for update using (public.can_signalement(parish_id, archdiocese_id)) with check (public.can_signalement(parish_id, archdiocese_id));
create policy "Suppression restreinte" on public.signalements for delete using (public.can_signalement(parish_id, archdiocese_id));

create policy "Gestion equipe" on public.presences for all using (public.can_protect_enfant(enfant_id)) with check (public.can_protect_enfant(enfant_id));
create policy "Lecture par le parent" on public.presences for select using (public.est_parent_de(enfant_id));
create policy "Gestion equipe" on public.enfant_progress for all using (public.can_protect_enfant(enfant_id)) with check (public.can_protect_enfant(enfant_id));
create policy "Lecture par le parent" on public.enfant_progress for select using (public.est_parent_de(enfant_id));

-- Chartes et histoire
create policy "Lecture publique si publiee" on public.chartes for select using (publie or public.is_admin_de(archdiocese_id)
  or (slug = 'media' and public.has_global_role_de(array['responsable_media_diocesain'], archdiocese_id))
  or (slug = 'protection-mineurs' and public.has_global_role_de(array['responsable_securite'], archdiocese_id)));
create policy "Redaction" on public.chartes for update
  using (public.is_admin_de(archdiocese_id)
    or (slug = 'media' and public.has_global_role_de(array['responsable_media_diocesain'], archdiocese_id))
    or (slug = 'protection-mineurs' and public.has_global_role_de(array['responsable_securite'], archdiocese_id)))
  with check (public.is_admin_de(archdiocese_id)
    or (slug = 'media' and public.has_global_role_de(array['responsable_media_diocesain'], archdiocese_id))
    or (slug = 'protection-mineurs' and public.has_global_role_de(array['responsable_securite'], archdiocese_id)));

-- Alertes : chacun voit celles qui relèvent de ses droits.
create policy "Lecture selon les droits" on public.alertes for select using (
  case type
    when 'signalement' then public.can_signalement(parish_id, archdiocese_id)
    when 'don' then public.can_manage_dons(parish_id, archdiocese_id)
    else public.can_manage(parish_id, archdiocese_id)
  end);
create policy "Gestion de ses lectures" on public.alertes_lues for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Fichiers publiés de la médiathèque
drop policy if exists "Lecture publique medias publies" on storage.objects;
create policy "Lecture publique medias publies" on storage.objects for select
  using (bucket_id = 'medias' and exists (select 1 from public.medias m where m.storage_path = name and m.publie));


-- ── 10. Statistiques limitées à l'archidiocèse ──────────────────────────────

create or replace function public.stats_tableau_de_bord(p_parish uuid default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  res jsonb;
  tout boolean := p_parish is null;
  a uuid := coalesce(public.parish_arch(p_parish), public.mon_archidiocese());
begin
  if not public.is_staff() then raise exception 'Accès refusé'; end if;
  if tout and not (public.is_admin_de(a) or public.has_global_role_de(array['archeveque','admin_evangelisation',
      'coordinateur_catechese_diocesain','responsable_media_diocesain','responsable_securite'], a)) then
    raise exception 'Accès refusé';
  end if;
  if not tout and not (public.can_manage(p_parish, a) or public.has_global_role_de(array['coordinateur_catechese_diocesain','admin_evangelisation'], a)) then
    raise exception 'Accès refusé';
  end if;

  select jsonb_build_object(
    'paroisses',          (select count(*) from parishes where actif and archdiocese_id = a and (tout or id = p_parish)),
    'fideles',            (select count(distinct m.user_id) from parish_members m join parishes pa on pa.id = m.parish_id where pa.archdiocese_id = a and (tout or m.parish_id = p_parish)),
    'catechistes',        (select count(distinct m.user_id) from parish_members m join parishes pa on pa.id = m.parish_id where m.role = 'catechiste' and pa.archdiocese_id = a and (tout or m.parish_id = p_parish)),
    'enfants',            (select count(*) from enfants where actif and archdiocese_id = a and (tout or parish_id = p_parish)),
    'dons_total',         (select coalesce(sum(montant), 0) from dons where statut = 'confirme' and archdiocese_id = a and (tout or parish_id = p_parish)),
    'dons_en_attente',    (select count(*) from dons where statut = 'en_attente' and archdiocese_id = a and (tout or parish_id = p_parish)),
    'intentions_recues',  (select count(*) from prayer_intentions where statut = 'recue' and archdiocese_id = a and (tout or parish_id = p_parish)),
    'temoignages_attente',(select count(*) from temoignages where statut = 'en_attente' and archdiocese_id = a and (tout or parish_id = p_parish)),
    'demandes_recues',    (select count(*) from demandes_pastorales where statut = 'recue' and archdiocese_id = a and (tout or parish_id = p_parish)),
    'adhesions_nouvelles',(select count(*) from groupe_adhesions where statut = 'nouvelle' and archdiocese_id = a and (tout or parish_id = p_parish)),
    'signalements_nouveaux', case when public.can_signalement(p_parish, a)
                              then (select count(*) from signalements where statut = 'nouveau' and archdiocese_id = a and (tout or parish_id = p_parish)) else null end,
    'videos',             (select count(*) from evenements where publie and archdiocese_id = a and (tout or parish_id = p_parish or parish_id is null)),
    'vues_videos',        (select coalesce(sum(vues), 0) from evenements where archdiocese_id = a and (tout or parish_id = p_parish or parish_id is null)),
    'heures_visionnage',  (select round(coalesce(sum(secondes_vues), 0) / 3600.0, 1) from evenements where archdiocese_id = a and (tout or parish_id = p_parish or parish_id is null)),
    'parcours_inscrits',  (select count(distinct (u.user_id, u.path_id)) from user_path_progress u join evangelization_paths ep on ep.id = u.path_id where ep.archdiocese_id = a),
    'abonnes',            (select count(*) from abonnements where archdiocese_id = a and (tout or parish_id = p_parish)),
    'presence_moyenne',   (select round(100.0 * count(*) filter (where pr.statut = 'present') / nullif(count(*), 0))
                           from presences pr join enfants e on e.id = pr.enfant_id where e.archdiocese_id = a and (tout or e.parish_id = p_parish))
  ) into res;
  return res;
end $$;

create or replace function public.stats_par_paroisse()
returns table (parish_id uuid, nom text, fideles bigint, catechistes bigint, enfants bigint,
               dons_total numeric, demandes_recues bigint, parcours_termines bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare a uuid := public.mon_archidiocese();
begin
  if not (public.is_admin_de(a) or public.has_global_role_de(array['archeveque','admin_evangelisation','coordinateur_catechese_diocesain'], a)) then
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
  from parishes p where p.actif and p.archdiocese_id = a order by p.nom;
end $$;

create or replace function public.stats_parcours()
returns table (path_id uuid, inscrits bigint, termines bigint)
language sql stable security definer set search_path = public as $$
  with nb as (select path_id, count(*) n from path_steps group by path_id),
       u as (select path_id, user_id, count(*) faits from user_path_progress group by path_id, user_id)
  select p.id,
         (select count(*) from u where u.path_id = p.id),
         (select count(*) from u join nb on nb.path_id = u.path_id where u.path_id = p.id and u.faits >= nb.n)
  from evangelization_paths p
  where public.can_manage(p.parish_id, p.archdiocese_id);
$$;

create or replace function public.registre_staff(p_parish uuid default null)
returns table (user_id uuid, nom text, email text, parish_nom text, role text,
               verifie_securite boolean, formations_requises int, formations_terminees int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare a uuid := coalesce(public.parish_arch(p_parish), public.mon_archidiocese());
begin
  if not (public.is_admin_de(a) or public.has_global_role_de(array['responsable_securite','coordinateur_catechese_diocesain'], a)
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
  where m.role = any(public.parish_staff_roles()) and pa.archdiocese_id = a and (p_parish is null or m.parish_id = p_parish)
  order by pa.nom, pr.nom;
end $$;


-- ── 11. Contenus exemples complémentaires (brouillons) ──────────────────────

insert into public.evangelization_paths (parish_id, type, titre, slug, description, emoji, duree, ordre) values
  (null, 'approfondir', 'Lire la Bible', 'lire-la-bible',
   'Comment la Bible est organisée, comment l''Église la lit, et comment prier avec la Parole de Dieu.', '📜', '4 étapes · 40 min', 2),
  (null, 'approfondir', 'La vie spirituelle', 'la-vie-spirituelle',
   'Prière personnelle, sacrements, discernement : les piliers d''une vie avec Dieu au quotidien.', '🕊️', '4 étapes · 40 min', 3),
  (null, 'approfondir', 'S''engager en chrétien', 's-engager-en-chretien',
   'Doctrine sociale de l''Église, service de la paroisse et témoignage dans la société congolaise.', '🤝', '4 étapes · 40 min', 4),
  (null, 'retraite', 'Retraite en ligne : cinq jours avec l''Évangile', 'retraite-cinq-jours',
   'Une retraite à vivre chez soi : un texte d''Évangile, une méditation et une résolution par jour.', '⛰️', '5 jours', 1)
on conflict (slug) do nothing;

insert into public.path_steps (path_id, ordre, titre, contenu, quiz, appel_action)
select p.id, s.ordre, s.titre, s.contenu, s.quiz::jsonb, s.appel_action
from public.evangelization_paths p
join (values
  ('lire-la-bible', 1, 'Une bibliothèque de 73 livres',
   E'La Bible n''est pas un livre, mais une **bibliothèque** : 46 livres pour l''Ancien Testament et 27 pour le Nouveau, écrits sur plus de mille ans.\n\nOn y trouve des récits, des lois, des prophéties, des poèmes (les Psaumes), des lettres et quatre Évangiles.\n\n> « Toute l''Écriture est inspirée par Dieu. » (2 Timothée 3, 16)',
   '[{"question":"Combien de livres compte la Bible catholique ?","reponses":["73","66","27"],"bonneReponse":0,"explication":"46 livres dans l''Ancien Testament et 27 dans le Nouveau."}]', 'aucun'),
  ('lire-la-bible', 2, 'Lire avec l''Église',
   E'L''Église lit l''Écriture « dans l''Esprit où elle a été écrite » : en tenant compte du genre littéraire, de l''unité de toute la Bible et de la Tradition vivante.\n\nLe Christ est la clé de lecture : l''Ancien Testament prépare sa venue, le Nouveau l''annonce.',
   '[]', 'aucun'),
  ('lire-la-bible', 3, 'Prier avec la Parole : la lectio divina',
   E'1. **Lire** lentement un passage court.\n2. **Méditer** : quel mot me touche ?\n3. **Prier** : répondre à Dieu avec ses mots.\n4. **Contempler** : rester en silence devant Lui.',
   '[{"question":"Par quoi commence la lectio divina ?","reponses":["La lecture lente d''un passage","Un chant","Une résolution"],"bonneReponse":0,"explication":"On lit d''abord, lentement, un passage court de l''Écriture."}]', 'aucun'),
  ('lire-la-bible', 4, 'Chaque jour, un Évangile',
   E'La liturgie propose chaque jour des lectures. Prendre dix minutes pour lire l''Évangile du jour est le meilleur moyen de commencer.', '[]', 'prier'),
  ('la-vie-spirituelle', 1, 'La prière personnelle',
   E'La prière est une relation. Un moment régulier, même court, chaque jour, vaut mieux qu''une longue prière occasionnelle.', '[]', 'aucun'),
  ('la-vie-spirituelle', 2, 'Les sacrements',
   E'Les sept sacrements sont des signes efficaces de la grâce : baptême, confirmation, eucharistie, pénitence et réconciliation, onction des malades, ordre et mariage.\n\nL''**eucharistie** du dimanche est « la source et le sommet » de la vie chrétienne.',
   '[{"question":"Combien y a-t-il de sacrements ?","reponses":["Sept","Trois","Dix"],"bonneReponse":0,"explication":"L''Église célèbre sept sacrements (CEC 1113)."}]', 'aucun'),
  ('la-vie-spirituelle', 3, 'La réconciliation',
   E'Le sacrement de pénitence rend la paix du cœur. On peut le recevoir aux heures de confession de sa paroisse.', '[]', 'aucun'),
  ('la-vie-spirituelle', 4, 'Discerner',
   E'Discerner, c''est chercher la volonté de Dieu dans ses choix, avec la prière, la Parole et l''aide d''un accompagnateur spirituel.', '[]', 'parler_pretre'),
  ('s-engager-en-chretien', 1, 'La dignité de toute personne',
   E'Chaque personne est créée à l''image de Dieu : c''est le fondement de la doctrine sociale de l''Église.', '[]', 'aucun'),
  ('s-engager-en-chretien', 2, 'Le bien commun et la solidarité',
   E'Le bien commun est l''ensemble des conditions qui permettent à chacun de s''épanouir. La solidarité nous rend responsables les uns des autres.',
   '[{"question":"Sur quoi repose la doctrine sociale de l''Église ?","reponses":["La dignité de la personne humaine","La richesse","Le pouvoir"],"bonneReponse":0,"explication":"La dignité de toute personne, créée à l''image de Dieu, en est le fondement."}]', 'aucun'),
  ('s-engager-en-chretien', 3, 'Servir dans sa paroisse',
   E'Chorale, catéchèse, accueil, visite des malades, jeunesse : chaque paroisse a besoin de bénévoles.', '[]', 'aucun'),
  ('s-engager-en-chretien', 4, 'Témoigner dans la société',
   E'Au travail, en famille, dans la vie publique : le chrétien est appelé à être « sel de la terre et lumière du monde » (Matthieu 5, 13-14).', '[]', 'commencer_parcours'),
  ('retraite-cinq-jours', 1, 'Jour 1 — L''appel (Marc 1, 16-20)', E'Jésus appelle Simon et André au bord du lac. **Méditation** : à quoi le Seigneur m''appelle-t-il aujourd''hui ?\n\n**Résolution** : un temps de silence de dix minutes.', '[]', 'aucun'),
  ('retraite-cinq-jours', 2, 'Jour 2 — La confiance (Matthieu 6, 25-34)', E'« Ne vous inquiétez pas. » **Méditation** : quelle inquiétude puis-je remettre à Dieu ?\n\n**Résolution** : confier cette inquiétude dans la prière.', '[]', 'aucun'),
  ('retraite-cinq-jours', 3, 'Jour 3 — Le pardon (Luc 15, 11-32)', E'Le père court au-devant du fils prodigue. **Méditation** : ai-je besoin de recevoir ou de donner un pardon ?\n\n**Résolution** : faire un pas de réconciliation.', '[]', 'aucun'),
  ('retraite-cinq-jours', 4, 'Jour 4 — Le service (Jean 13, 1-15)', E'Jésus lave les pieds de ses disciples. **Méditation** : qui puis-je servir concrètement ?\n\n**Résolution** : rendre un service discret.', '[]', 'aucun'),
  ('retraite-cinq-jours', 5, 'Jour 5 — La mission (Matthieu 28, 16-20)', E'« Allez, de toutes les nations faites des disciples. » **Méditation** : à qui puis-je parler de ma foi ?\n\n**Résolution** : partager ce que cette retraite m''a apporté.', '[]', 'prier')
) as s(slug, ordre, titre, contenu, quiz, appel_action) on s.slug = p.slug
where not exists (select 1 from public.path_steps x where x.path_id = p.id and x.ordre = s.ordre);

-- Témoignages types : non publiés, clairement marqués comme exemples.
insert into public.temoignages (auteur_nom, contenu, statut, category_id)
select 'Exemple', e.contenu, 'en_attente', (select id from public.testimony_categories where slug = e.cat)
from (values
  ('conversion', '[EXEMPLE — à remplacer par un vrai témoignage] Je ne croyais en rien. Un ami m''a invité à une veillée de prière à la cathédrale ; j''ai commencé le parcours « Qui est Jésus ? », puis le catéchuménat. J''ai été baptisé à Pâques.'),
  ('famille', '[EXEMPLE — à remplacer par un vrai témoignage] Depuis que nous prions le chapelet en famille le soir, nos disputes se sont apaisées et nos enfants posent des questions sur Dieu.'),
  ('jeunes', '[EXEMPLE — à remplacer par un vrai témoignage] Grâce au groupe de jeunes, j''ai trouvé des amis qui partagent ma foi et je me suis engagé dans la chorale.')
) as e(cat, contenu)
where not exists (select 1 from public.temoignages t where t.contenu = e.contenu);
