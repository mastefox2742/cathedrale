-- ════════════════════════════════════════════════════════════════════════════
-- Tests de sécurité (étape 7 du cahier des charges) : chaque rôle ne voit et ne
-- modifie que ce qu'il doit. Tout se passe dans une transaction annulée à la
-- fin (ROLLBACK) : aucune donnée n'est conservée.
--
-- Exécution locale : tests/sql/run.sh (base PostgreSQL de test).
-- Ne pas exécuter sur la base de production.
-- ════════════════════════════════════════════════════════════════════════════
\set ON_ERROR_STOP 1
begin;

create function pg_temp.verifier(ok boolean, message text) returns void language plpgsql as $$
begin
  if ok is not true then raise exception 'ÉCHEC : %', message; end if;
  raise notice 'OK   %', message;
end $$;

-- ── Jeu de données (en tant que postgres, sans RLS) ─────────────────────────
insert into public.parishes (archdiocese_id, nom, slug)
select id, 'Saint-Pierre-Claver', 'saint-pierre-claver' from public.archdioceses where slug = 'brazzaville';

-- Comptes : l'inscription crée profil + appartenance « membre » (trigger).
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'diocese@test', '{}'),
  ('00000000-0000-0000-0000-00000000000b', 'admin-a@test', '{}'),
  ('00000000-0000-0000-0000-00000000000c', 'catechiste-b@test', jsonb_build_object('parish_id', (select id from public.parishes where slug = 'saint-pierre-claver'))),
  ('00000000-0000-0000-0000-00000000000d', 'tresorier-a@test', '{}'),
  ('00000000-0000-0000-0000-00000000000e', 'membre@test', '{"nom":"Marie Membre"}'),
  ('00000000-0000-0000-0000-00000000000f', 'securite@test', '{}');

update public.profiles set role = 'admin_diocesain' where id = '00000000-0000-0000-0000-00000000000a';
update public.profiles set role = 'responsable_securite' where id = '00000000-0000-0000-0000-00000000000f';
insert into public.parish_members (user_id, parish_id, role) values
  ('00000000-0000-0000-0000-00000000000b', public.default_parish_id(), 'admin_paroisse'),
  ('00000000-0000-0000-0000-00000000000c', (select id from public.parishes where slug = 'saint-pierre-claver'), 'catechiste'),
  ('00000000-0000-0000-0000-00000000000d', public.default_parish_id(), 'tresorier');

insert into public.annonces (titre, description, tag, date, publie, parish_id) values
  ('Brouillon A', 'x', 'Liturgie', current_date, false, public.default_parish_id()),
  ('Brouillon B', 'x', 'Liturgie', current_date, false, (select id from public.parishes where slug = 'saint-pierre-claver')),
  ('Publiée B',   'x', 'Liturgie', current_date, true,  (select id from public.parishes where slug = 'saint-pierre-claver')),
  ('Diocésaine',  'x', 'Prière',   current_date, true,  null);
insert into public.dons (montant, methode, type, reference, parish_id) values
  (5000, 'mtn', 'libre', 'T-A', public.default_parish_id()),
  (7000, 'airtel', 'libre', 'T-B', (select id from public.parishes where slug = 'saint-pierre-claver'));
insert into public.signalements (description, parish_id) values ('Test signalement A', public.default_parish_id());
insert into public.demandes_pastorales (reference, type, nom, contact, message, user_id) values
  ('D-1', 'bapteme', 'Marie', '060000000', 'Demande de la membre', '00000000-0000-0000-0000-00000000000e'),
  ('D-2', 'mariage', 'Autre', '060000001', 'Demande d''un autre', null);
insert into public.enfants (prenom, nom, parent_nom, parent_contact, parish_id) values ('Paul', 'A', 'Parent', '06', public.default_parish_id());
insert into public.abonnements (canal, contact) values ('email', 'abonne@test');

-- ── Inscription ─────────────────────────────────────────────────────────────
select pg_temp.verifier(
  exists (select 1 from public.parish_members m join public.parishes p on p.id = m.parish_id
          where m.user_id = '00000000-0000-0000-0000-00000000000c' and p.slug = 'saint-pierre-claver' and m.principale),
  'Inscription : la paroisse choisie devient la paroisse principale');
select pg_temp.verifier(
  (select nom from public.profiles where id = '00000000-0000-0000-0000-00000000000e') = 'Marie Membre',
  'Inscription : le profil reprend le nom saisi');

-- ── Visiteur anonyme ────────────────────────────────────────────────────────
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.verifier((select count(*) from public.annonces) = 2, 'Anonyme : ne voit que les annonces publiées (paroisse + archidiocèse)');
select pg_temp.verifier((select count(*) from public.dons) = 0, 'Anonyme : ne voit aucun don');
select pg_temp.verifier((select count(*) from public.abonnements) = 0, 'Anonyme : ne lit pas la liste des abonnés');
select pg_temp.verifier((select count(*) from public.signalements) = 0, 'Anonyme : ne lit pas les signalements');
select pg_temp.verifier(public.s_abonner('email', 'nouveau@test', '{}'::jsonb) is not null, 'Anonyme : peut s''abonner via la fonction dédiée');
do $$ begin
  begin
    insert into public.parishes (archdiocese_id, nom, slug) select id, 'Pirate', 'pirate' from public.archdioceses;
    raise exception 'ÉCHEC : un anonyme a créé une paroisse';
  exception when insufficient_privilege then raise notice 'OK   Anonyme : ne peut pas créer de paroisse';
  end;
end $$;
reset role;

-- ── Membre simple ───────────────────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', true);
select pg_temp.verifier((select count(*) from public.demandes_pastorales) = 1, 'Membre : ne voit que sa propre démarche');
select pg_temp.verifier(not public.is_staff(), 'Membre : n''a pas accès à l''administration');
do $$ begin
  begin
    insert into public.parish_members (user_id, parish_id, role) values (auth.uid(), public.default_parish_id(), 'admin_paroisse');
    raise exception 'ÉCHEC : un membre s''est nommé administrateur';
  exception when insufficient_privilege then raise notice 'OK   Membre : ne peut pas s''attribuer un rôle de staff';
  end;
end $$;
update public.profiles set role = 'admin' where id = auth.uid();
reset role;
select pg_temp.verifier((select role from public.profiles where id = '00000000-0000-0000-0000-00000000000e') is null, 'Membre : ne peut pas se donner un rôle archidiocésain');

-- ── Catéchiste de la paroisse B ─────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', true);
select pg_temp.verifier(public.is_staff(), 'Catéchiste B : accède à l''administration');
select pg_temp.verifier((select count(*) from public.annonces where titre = 'Brouillon B') = 1, 'Catéchiste B : voit les brouillons de sa paroisse');
select pg_temp.verifier((select count(*) from public.annonces where titre = 'Brouillon A') = 0, 'Catéchiste B : ne voit pas les brouillons de la paroisse A');
select pg_temp.verifier((select count(*) from public.dons) = 0, 'Catéchiste B : ne voit pas les dons (trésorerie)');
select pg_temp.verifier((select count(*) from public.enfants) = 0, 'Catéchiste B : ne voit pas les enfants de la paroisse A');
select pg_temp.verifier((select count(*) from public.demandes_pastorales) = 0, 'Catéchiste B : ne voit pas les démarches de la paroisse A');
with m as (update public.annonces set titre = 'Piraté' where titre = 'Brouillon A' returning 1)
select pg_temp.verifier((select count(*) from m) = 0, 'Catéchiste B : ne peut pas modifier une annonce de la paroisse A');
do $$ begin
  begin
    perform public.stats_tableau_de_bord(public.default_parish_id());
    raise exception 'ÉCHEC : statistiques d''une autre paroisse accessibles';
  exception when raise_exception then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
    raise notice 'OK   Catéchiste B : pas de statistiques de la paroisse A';
  end;
end $$;
reset role;

-- ── Administrateur de la paroisse A ─────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
insert into public.annonces (titre, description, tag, date, parish_id) values ('Nouvelle A', 'x', 'Liturgie', current_date, public.default_parish_id());
select pg_temp.verifier(true, 'Admin paroisse A : publie dans sa paroisse');
do $$ begin
  begin
    insert into public.annonces (titre, description, tag, date, parish_id)
    values ('Intrusion', 'x', 'Liturgie', current_date, (select id from public.parishes where slug = 'saint-pierre-claver'));
    raise exception 'ÉCHEC : admin A a publié dans la paroisse B';
  exception when insufficient_privilege then raise notice 'OK   Admin paroisse A : ne peut pas publier dans la paroisse B';
  end;
  begin
    insert into public.annonces (titre, description, tag, date, parish_id) values ('Diocèse', 'x', 'Liturgie', current_date, null);
    raise exception 'ÉCHEC : admin de paroisse a publié au niveau archidiocésain';
  exception when insufficient_privilege then raise notice 'OK   Admin paroisse A : ne peut pas publier au niveau archidiocésain';
  end;
end $$;
select pg_temp.verifier((select count(*) from public.dons) = 1, 'Admin paroisse A : voit les dons de sa paroisse uniquement');
select pg_temp.verifier((select count(*) from public.signalements) = 0, 'Admin paroisse A : ne voit pas les signalements (réservés à la protection des mineurs)');
insert into public.parish_members (user_id, parish_id, role) values ('00000000-0000-0000-0000-00000000000e', public.default_parish_id(), 'benevole');
select pg_temp.verifier(true, 'Admin paroisse A : nomme un membre de son équipe');
reset role;

-- ── Trésorier de la paroisse A ──────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', true);
select pg_temp.verifier((select count(*) from public.dons) = 1, 'Trésorier A : voit les dons de sa paroisse');
with m as (update public.dons set statut = 'confirme' where reference = 'T-B' returning 1)
select pg_temp.verifier((select count(*) from m) = 0, 'Trésorier A : ne peut pas confirmer un don de la paroisse B');
reset role;

-- ── Responsable protection des mineurs (archidiocèse) ───────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', true);
select pg_temp.verifier((select count(*) from public.signalements) = 1, 'Responsable sécurité : voit les signalements');
select pg_temp.verifier((select count(*) from public.enfants) = 1, 'Responsable sécurité : voit les dossiers enfants');
reset role;

-- ── Administration diocésaine ───────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
select pg_temp.verifier((select count(*) from public.annonces where not publie) >= 2, 'Admin diocésain : voit les brouillons de toutes les paroisses');
select pg_temp.verifier((select count(*) from public.dons) = 2, 'Admin diocésain : voit tous les dons');
select pg_temp.verifier((public.stats_tableau_de_bord(null) ->> 'paroisses')::int = 2, 'Admin diocésain : statistiques de tout l''archidiocèse');
reset role;

\echo '── Tous les tests de sécurité sont passés ──'
rollback;
