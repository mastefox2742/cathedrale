-- ════════════════════════════════════════════════════════════════
-- Témoignages : compteur « Gloire à Dieu » (écran Témoignages de Foi
-- de l'application). Idempotent.
-- ════════════════════════════════════════════════════════════════

alter table public.temoignages add column if not exists nb_gloire int not null default 0;

-- Incrément anonyme, limité aux témoignages publiés (pas d'UPDATE direct
-- ouvert au public : la RLS réserve la modification aux gestionnaires).
create or replace function public.rendre_gloire(p_id uuid)
returns int language sql security definer set search_path = public as $$
  update public.temoignages set nb_gloire = nb_gloire + 1 where id = p_id and statut = 'approuve'
  returning nb_gloire;
$$;

revoke all on function public.rendre_gloire(uuid) from public;
grant execute on function public.rendre_gloire(uuid) to anon, authenticated;
