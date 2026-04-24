-- 033: Team/subconta system

-- 1. Extend users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS escritorio_vinculado_id uuid REFERENCES public.escritorios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS nivel_permissao text DEFAULT 'owner' CHECK (nivel_permissao IN ('owner', 'admin', 'pleno', 'operacional')),
  ADD COLUMN IF NOT EXISTS cargo text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Backfill: all existing users are owners
UPDATE public.users SET nivel_permissao = 'owner' WHERE nivel_permissao IS NULL;

-- 2. Add max_membros to escritorios
ALTER TABLE public.escritorios ADD COLUMN IF NOT EXISTS max_membros integer DEFAULT 3;

-- 3. convites_equipe
CREATE TABLE IF NOT EXISTS public.convites_equipe (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id uuid REFERENCES public.escritorios(id) ON DELETE CASCADE,
  email text NOT NULL,
  nome text NOT NULL,
  cargo text,
  nivel_permissao text DEFAULT 'operacional' CHECK (nivel_permissao IN ('admin', 'pleno', 'operacional')),
  token text UNIQUE DEFAULT gen_random_uuid()::text,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'cancelado')),
  convidado_por uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  aceito_em timestamptz
);

ALTER TABLE public.convites_equipe ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "convites_all" ON public.convites_equipe;
DROP POLICY IF EXISTS "convites_select_public" ON public.convites_equipe;
CREATE POLICY "convites_all" ON public.convites_equipe FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "convites_select_public" ON public.convites_equipe FOR SELECT USING (true);

-- 4. projeto_membros
CREATE TABLE IF NOT EXISTS public.projeto_membros (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id uuid REFERENCES public.projetos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  papel text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(projeto_id, user_id)
);

ALTER TABLE public.projeto_membros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projeto_membros_all" ON public.projeto_membros;
CREATE POLICY "projeto_membros_all" ON public.projeto_membros FOR ALL USING (auth.role() = 'authenticated');
