-- 037: expand nivel_permissao to full hierarchy
-- owner / admin / senior / pleno / junior / estagiario
-- 'operacional' (legacy) → 'junior'

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_nivel_permissao_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_nivel_permissao_check
  CHECK (nivel_permissao IN ('owner', 'admin', 'senior', 'pleno', 'junior', 'estagiario'));

UPDATE public.users
  SET nivel_permissao = 'junior'
  WHERE nivel_permissao = 'operacional';

ALTER TABLE public.convites_equipe
  DROP CONSTRAINT IF EXISTS convites_equipe_nivel_permissao_check;

ALTER TABLE public.convites_equipe
  ADD CONSTRAINT convites_equipe_nivel_permissao_check
  CHECK (nivel_permissao IN ('admin', 'senior', 'pleno', 'junior', 'estagiario'));
