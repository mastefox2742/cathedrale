-- ════════════════════════════════════════════════════════════════════════════
-- Sécurité : double authentification obligatoire pour l'administration.
--
-- Tout droit de staff (rôles globaux ou paroissiaux) n'est accordé que si la
-- session a été validée par un second facteur (TOTP) : niveau d'assurance
-- « aal2 » dans le jeton Supabase. Un compte staff connecté avec son seul mot
-- de passe (aal1) a les mêmes droits qu'un simple fidèle, dans l'interface
-- comme dans l'API.
--
-- Idempotent. À appliquer APRÈS avoir déployé le site (page /admin/mfa), pour
-- que les administrateurs puissent enrôler leur application d'authentification.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.mfa_ok() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

-- Rôles globaux (admin, archevêque, responsables diocésains…)
create or replace function public.has_global_role(roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select public.mfa_ok()
     and exists (select 1 from public.profiles where id = auth.uid() and actif and role = any(roles));
$$;

create or replace function public.has_global_role_de(roles text[], a uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.mfa_ok() and exists (
    select 1 from public.profiles
    where id = auth.uid() and actif and role = any(roles) and (role = 'admin' or archdiocese_id = a)
  );
$$;

-- Rôles paroissiaux (admin de paroisse, prêtre, catéchiste…)
create or replace function public.has_parish_role(p uuid, roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select public.mfa_ok() and exists (
    select 1 from public.parish_members m join public.profiles pr on pr.id = m.user_id
    where m.user_id = auth.uid() and m.parish_id = p and pr.actif and m.role = any(roles)
  );
$$;

-- Même question, sans exiger le second facteur : sert uniquement à savoir s'il
-- faut envoyer la personne vers /admin/mfa. N'accorde aucun droit.
create or replace function public.staff_sans_mfa() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
           select 1 from public.profiles
           where id = auth.uid() and actif and role = any(array['admin','archeveque','admin_diocesain','admin_evangelisation',
             'coordinateur_catechese_diocesain','responsable_media_diocesain','responsable_securite'])
         )
      or exists (
           select 1 from public.parish_members m join public.profiles pr on pr.id = m.user_id
           where m.user_id = auth.uid() and pr.actif and m.role = any(public.parish_staff_roles())
         );
$$;

-- Accès au panneau d'administration (aussi utilisé par le stockage de fichiers).
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select public.mfa_ok() and public.staff_sans_mfa();
$$;

create or replace function public.is_protection_mineurs() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.is_responsable_securite()
      or (public.mfa_ok() and exists (select 1 from public.parish_members m where m.user_id = auth.uid()
                 and m.role in ('admin_paroisse','responsable_securite','catechiste','coordinateur_catechese','secretariat')));
$$;

create or replace function public.is_tresorier() returns boolean
language sql stable security definer set search_path = public as $$
  select public.mfa_ok() and exists (select 1 from public.parish_members where user_id = auth.uid() and role = 'tresorier');
$$;

-- Anciennes fonctions « un rôle » (schéma initial) : plus utilisées par les
-- politiques, alignées par sécurité.
create or replace function public.is_pretre() returns boolean
language sql stable security definer set search_path = public as $$
  select public.mfa_ok() and exists (select 1 from public.parish_members where user_id = auth.uid() and role = 'pretre');
$$;
create or replace function public.is_secretariat() returns boolean
language sql stable security definer set search_path = public as $$
  select public.mfa_ok() and exists (select 1 from public.parish_members where user_id = auth.uid() and role = 'secretariat');
$$;
create or replace function public.is_animateur_jeunesse() returns boolean
language sql stable security definer set search_path = public as $$
  select public.mfa_ok() and exists (select 1 from public.parish_members where user_id = auth.uid() and role = 'animateur_jeunesse');
$$;
create or replace function public.is_responsable_groupe() returns boolean
language sql stable security definer set search_path = public as $$
  select public.mfa_ok() and exists (select 1 from public.parish_members where user_id = auth.uid() and role = 'responsable_groupe');
$$;
create or replace function public.is_responsable_liturgie() returns boolean
language sql stable security definer set search_path = public as $$
  select public.mfa_ok() and exists (select 1 from public.parish_members where user_id = auth.uid() and role = 'responsable_liturgie');
$$;

grant execute on function public.mfa_ok() to anon, authenticated;
grant execute on function public.staff_sans_mfa() to authenticated;
