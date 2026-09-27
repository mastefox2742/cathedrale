-- ════════════════════════════════════════════════════════════════════════════
-- Tests des compléments (migration 20260927) : multi-archidiocèse, parents,
-- présences, alertes, suivi des démarches, duplication, modération média,
-- données personnelles. Transaction annulée à la fin.
-- ════════════════════════════════════════════════════════════════════════════
\set ON_ERROR_STOP 1
begin;

create function pg_temp.verifier(ok boolean, message text) returns void language plpgsql as $$
begin
  if ok is not true then raise exception 'ÉCHEC : %', message; end if;
  raise notice 'OK   %', message;
end $$;

-- ── Données : deux archidiocèses ────────────────────────────────────────────
insert into public.archdioceses (nom, slug) values ('Archidiocèse de Test', 'test');
insert into public.parishes (archdiocese_id, nom, slug) values
  ((select id from public.archdioceses where slug = 'brazzaville'), 'Paroisse B', 'paroisse-b'),
  ((select id from public.archdioceses where slug = 'test'), 'Paroisse Autre Diocèse', 'paroisse-x');

insert into auth.users (id, email, raw_user_meta_data) values
  ('10000000-0000-0000-0000-000000000001', 'parent@test', '{}'),
  ('10000000-0000-0000-0000-000000000002', 'catechiste-a@test', '{}'),
  ('10000000-0000-0000-0000-000000000003', 'catechiste-b@test', '{}'),
  ('10000000-0000-0000-0000-000000000004', 'media-diocese@test', '{}'),
  ('10000000-0000-0000-0000-000000000005', 'admin-autre@test', jsonb_build_object('parish_id', (select id from public.parishes where slug = 'paroisse-x'))),
  ('10000000-0000-0000-0000-000000000006', 'securite@test', '{}'),
  ('10000000-0000-0000-0000-000000000007', 'admin-a@test', '{}'),
  ('10000000-0000-0000-0000-000000000008', 'fidele@test', '{}');

update public.profiles set role = 'responsable_media_diocesain' where id = '10000000-0000-0000-0000-000000000004';
update public.profiles set role = 'admin_diocesain' where id = '10000000-0000-0000-0000-000000000005';
update public.profiles set role = 'responsable_securite' where id = '10000000-0000-0000-0000-000000000006';
insert into public.parish_members (user_id, parish_id, role) values
  ('10000000-0000-0000-0000-000000000002', public.default_parish_id(), 'catechiste'),
  ('10000000-0000-0000-0000-000000000003', (select id from public.parishes where slug = 'paroisse-b'), 'catechiste'),
  ('10000000-0000-0000-0000-000000000007', public.default_parish_id(), 'admin_paroisse');

select pg_temp.verifier(
  (select archdiocese_id from public.profiles where id = '10000000-0000-0000-0000-000000000005') = (select id from public.archdioceses where slug = 'test'),
  'Inscription : le profil suit l''archidiocèse de la paroisse choisie');

insert into public.cours (niveau, titre, tranche, description, objectif, emoji, couleur, publie, parish_id)
values (1, 'Éveil', '6-8 ans', 'x', 'x', '🌿', '#000', true, public.default_parish_id());
insert into public.catechisme_modules (cours_id, ordre, titre, emoji, contenu, priere, publie)
select id, 1, 'Module 1', '📖', 'x', 'x', true from public.cours where titre = 'Éveil';
insert into public.seances_catechisme (cours_id, date, objectifs) select id, current_date, 'Séance 1' from public.cours where titre = 'Éveil';
insert into public.enfants (prenom, nom, parent_nom, parent_contact, parent_profile_id, parish_id, cours_id)
select 'Léa', 'A', 'Parent', '06', '10000000-0000-0000-0000-000000000001', public.default_parish_id(), id from public.cours where titre = 'Éveil';
insert into public.enfants (prenom, nom, parent_nom, parent_contact, parish_id)
values ('Autre', 'Enfant', 'X', '06', public.default_parish_id());

insert into public.annonces (titre, description, tag, date, publie, parish_id)
values ('Brouillon autre diocèse', 'x', 'Liturgie', current_date, false, (select id from public.parishes where slug = 'paroisse-x'));
insert into public.evenements (titre, description, type, platform, url, date, publie, parish_id)
values ('Vidéo paroisse A', 'x', 'replay', 'youtube', 'https://youtu.be/x', current_date, true, public.default_parish_id());

-- ── Rattachement automatique à l'archidiocèse ───────────────────────────────
select pg_temp.verifier(
  (select a.slug from public.annonces n join public.archdioceses a on a.id = n.archdiocese_id where n.titre = 'Brouillon autre diocèse') = 'test',
  'archdiocese_id suit automatiquement la paroisse');

-- ── Catéchiste A : présences et progression ─────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
insert into public.presences (seance_id, enfant_id, statut)
select s.id, e.id, 'present' from public.seances_catechisme s, public.enfants e where e.prenom = 'Léa';
insert into public.enfant_progress (enfant_id, cours_id, module_id)
select e.id, c.id, m.id from public.enfants e, public.cours c, public.catechisme_modules m where e.prenom = 'Léa' and c.titre = 'Éveil' and m.cours_id = c.id;
select pg_temp.verifier(true, 'Catéchiste A : note les présences et valide un module');
reset role;

-- ── Catéchiste B : aucune action sur les enfants de A ───────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
do $$ begin
  begin
    insert into public.presences (seance_id, enfant_id, statut)
    select s.id, e.id, 'absent' from public.seances_catechisme s, public.enfants e where e.prenom = 'Autre';
    if found then raise exception 'ÉCHEC : catéchiste B a noté une présence dans la paroisse A'; end if;
    raise notice 'OK   Catéchiste B : ne voit même pas les séances de la paroisse A';
  exception when insufficient_privilege then raise notice 'OK   Catéchiste B : ne peut pas noter les présences de la paroisse A';
  end;
end $$;
select pg_temp.verifier((select count(*) from public.presences) = 0, 'Catéchiste B : ne voit pas les présences de la paroisse A');
reset role;

-- ── Parent ──────────────────────────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select pg_temp.verifier((select count(*) from public.enfants) = 1, 'Parent : voit son enfant uniquement');
select pg_temp.verifier((select count(*) from public.presences) = 1, 'Parent : voit les présences de son enfant');
select pg_temp.verifier((select count(*) from public.enfant_progress) = 1, 'Parent : voit la progression de son enfant');
with m as (update public.presences set statut = 'absent' returning 1)
select pg_temp.verifier((select count(*) from m) = 0, 'Parent : ne peut pas modifier les présences');
reset role;

-- ── Alertes aux responsables ────────────────────────────────────────────────
insert into public.demandes_pastorales (reference, type, nom, contact, message, parish_id)
values ('SUIVI-1', 'bapteme', 'Jean', '+242 06 123 45 67', 'Demande de baptême', public.default_parish_id());
insert into public.signalements (description, parish_id) values ('Préoccupation', public.default_parish_id());

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000007', true);
select pg_temp.verifier((select count(*) from public.alertes where type = 'demarche') >= 1, 'Admin paroisse A : reçoit l''alerte de nouvelle démarche');
select pg_temp.verifier((select count(*) from public.alertes where type = 'signalement') = 0, 'Admin paroisse A : ne reçoit pas les alertes de signalement');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select pg_temp.verifier((select count(*) from public.alertes where type = 'demarche') = 0, 'Catéchiste B : ne reçoit pas les alertes de la paroisse A');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000006', true);
select pg_temp.verifier((select count(*) from public.alertes where type = 'signalement') >= 1, 'Responsable sécurité : reçoit l''alerte de signalement');
reset role;

-- ── Suivi d'une démarche sans compte ────────────────────────────────────────
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.verifier((select count(*) from public.suivre_demande('suivi-1', '+242061234567')) = 1, 'Anonyme : suit sa démarche avec la référence et le contact');
select pg_temp.verifier((select count(*) from public.suivre_demande('SUIVI-1', '0600000000')) = 0, 'Anonyme : la référence seule ne suffit pas');
reset role;

-- ── Modération média centrale ───────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
with m as (update public.evenements set publie = false where titre = 'Vidéo paroisse A' returning 1)
select pg_temp.verifier((select count(*) from m) = 1, 'Responsable média diocésain : peut masquer une vidéo de paroisse');
with m as (update public.annonces set publie = true where titre = 'Brouillon autre diocèse' returning 1)
select pg_temp.verifier((select count(*) from m) = 0, 'Responsable média : aucun droit dans un autre archidiocèse');
reset role;

-- ── Isolation entre archidiocèses ───────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', true);
select pg_temp.verifier((select count(*) from public.annonces where titre = 'Brouillon autre diocèse') = 1, 'Admin de l''autre archidiocèse : voit ses brouillons');
select pg_temp.verifier((select count(*) from public.dons where archdiocese_id = public.default_archdiocese_id()) = 0, 'Admin de l''autre archidiocèse : ne voit pas les dons de Brazzaville');
select pg_temp.verifier((select count(*) from public.enfants) = 0, 'Admin de l''autre archidiocèse : ne voit pas les enfants de Brazzaville');
do $$ begin
  begin
    insert into public.annonces (titre, description, tag, date, parish_id) values ('Intrusion', 'x', 'Liturgie', current_date, public.default_parish_id());
    raise exception 'ÉCHEC : admin d''un autre archidiocèse a publié à Brazzaville';
  exception when insufficient_privilege then raise notice 'OK   Admin de l''autre archidiocèse : ne peut pas publier à Brazzaville';
  end;
end $$;
select pg_temp.verifier((public.stats_tableau_de_bord(null) ->> 'paroisses')::int = 1, 'Statistiques : limitées à son archidiocèse');
reset role;

-- ── Duplication d'un programme de référence ─────────────────────────────────
update public.evangelization_paths set publie = true where slug = 'qui-est-jesus';
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000007', true);
select pg_temp.verifier(
  public.dupliquer_parcours((select id from public.evangelization_paths where slug = 'qui-est-jesus'), public.default_parish_id()) is not null,
  'Admin paroisse A : duplique un parcours archidiocésain dans sa paroisse');
select pg_temp.verifier(
  (select count(*) from public.path_steps s join public.evangelization_paths p on p.id = s.path_id where p.slug like 'qui-est-jesus-%') = 4,
  'Duplication : les étapes sont copiées');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
do $$ begin
  begin
    perform public.dupliquer_parcours((select id from public.evangelization_paths where slug = 'qui-est-jesus'), public.default_parish_id());
    raise exception 'ÉCHEC : catéchiste B a dupliqué dans la paroisse A';
  exception when raise_exception then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
    raise notice 'OK   Catéchiste B : ne peut pas dupliquer dans la paroisse A';
  end;
end $$;
reset role;

-- ── Données personnelles ────────────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000008', true);
select pg_temp.verifier((public.exporter_mes_donnees() -> 'profil' ->> 'email') = 'fidele@test', 'Fidèle : exporte ses données');
select public.supprimer_mon_compte();
reset role;
select pg_temp.verifier(not exists (select 1 from public.profiles where id = '10000000-0000-0000-0000-000000000008'), 'Fidèle : supprime son compte (profil effacé)');

-- ── Témoignages : « Gloire à Dieu » ─────────────────────────────────────────
insert into public.temoignages (id, auteur_nom, contenu, statut) values
  ('70000000-0000-0000-0000-000000000001', 'Test', 'Témoignage approuvé', 'approuve'),
  ('70000000-0000-0000-0000-000000000002', 'Test', 'Témoignage en attente', 'en_attente');
set local role anon;
select pg_temp.verifier(public.rendre_gloire('70000000-0000-0000-0000-000000000001') = 1, 'Visiteur : rend gloire pour un témoignage publié');
select pg_temp.verifier(public.rendre_gloire('70000000-0000-0000-0000-000000000002') is null, 'Visiteur : aucun effet sur un témoignage non publié');
do $$ begin
  begin
    update public.temoignages set nb_gloire = 999 where id = '70000000-0000-0000-0000-000000000001';
  exception when insufficient_privilege then null;
  end;
  if (select nb_gloire from public.temoignages where id = '70000000-0000-0000-0000-000000000001') = 999 then
    raise exception 'ÉCHEC : un visiteur modifie directement le compteur';
  end if;
  raise notice 'OK   Visiteur : ne peut pas modifier le compteur directement';
end $$;
reset role;

-- ── Double authentification obligatoire pour le staff ───────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', true);
select set_config('request.jwt.claim.aal', 'aal1', true);
select pg_temp.verifier(not public.is_staff(), 'Admin sans double authentification (aal1) : pas de droits de staff');
select pg_temp.verifier(public.staff_sans_mfa(), 'Admin sans double authentification : reconnu comme staff à enrôler');
select pg_temp.verifier(not public.is_admin(), 'Admin sans double authentification : is_admin() refusé');
do $$ begin
  begin
    perform public.stats_tableau_de_bord(null);
    raise exception 'ÉCHEC : statistiques lues sans double authentification';
  exception when raise_exception then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
    raise notice 'OK   Admin sans double authentification : tableau de bord refusé';
  end;
end $$;
select set_config('request.jwt.claim.aal', 'aal2', true);
select pg_temp.verifier(public.is_staff() and public.is_admin(), 'Admin avec double authentification (aal2) : droits rétablis');
select set_config('request.jwt.claim.aal', '', true);
reset role;

\echo '── Tous les tests des compléments sont passés ──'
rollback;
