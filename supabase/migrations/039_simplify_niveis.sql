-- ARC Platform — Simplify team permission levels: owner, gestor, operacional
-- Run in: Supabase Dashboard → SQL Editor → New query

-- ── 1. Migrate users ─────────────────────────────────────────────────────────
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_nivel_permissao_check;

UPDATE public.users
SET nivel_permissao = 'gestor'
WHERE nivel_permissao IN ('admin', 'senior', 'pleno');

UPDATE public.users
SET nivel_permissao = 'operacional'
WHERE nivel_permissao IN ('junior', 'estagiario');

ALTER TABLE public.users
ADD CONSTRAINT users_nivel_permissao_check
CHECK (nivel_permissao IN ('owner', 'gestor', 'operacional'));

-- ── 2. Migrate convites_equipe ────────────────────────────────────────────────
ALTER TABLE public.convites_equipe DROP CONSTRAINT IF EXISTS convites_equipe_nivel_permissao_check;

UPDATE public.convites_equipe
SET nivel_permissao = 'gestor'
WHERE nivel_permissao IN ('admin', 'senior', 'pleno');

UPDATE public.convites_equipe
SET nivel_permissao = 'operacional'
WHERE nivel_permissao IN ('junior', 'estagiario');

ALTER TABLE public.convites_equipe
ADD CONSTRAINT convites_equipe_nivel_permissao_check
CHECK (nivel_permissao IN ('gestor', 'operacional'));
