-- ARC Platform — Fix projetos INSERT policy
-- FOR ALL USING (...) without WITH CHECK can silently deny INSERTs.
-- Add explicit INSERT WITH CHECK policy.
-- Run in: Supabase Dashboard → SQL Editor → New query

-- Drop existing write policy and recreate with explicit WITH CHECK
DROP POLICY IF EXISTS "projetos_escritorio_write" ON public.projetos;

-- SELECT: studio owner or assigned client
DROP POLICY IF EXISTS "projetos_read" ON public.projetos;
CREATE POLICY "projetos_read" ON public.projetos
  FOR SELECT USING (
    auth.uid() = cliente_id OR
    auth.uid() IN (SELECT user_id FROM public.escritorios WHERE id = escritorio_id)
  );

-- INSERT: studio owner
CREATE POLICY "projetos_insert" ON public.projetos
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.escritorios WHERE id = escritorio_id)
  );

-- UPDATE: studio owner
CREATE POLICY "projetos_update" ON public.projetos
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.escritorios WHERE id = escritorio_id)
  ) WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.escritorios WHERE id = escritorio_id)
  );

-- DELETE: studio owner
CREATE POLICY "projetos_delete" ON public.projetos
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.escritorios WHERE id = escritorio_id)
  );

-- Ensure tipo and descricao columns exist (from migration 003)
ALTER TABLE public.projetos
  ADD COLUMN IF NOT EXISTS tipo      text DEFAULT 'residencial'
    CHECK (tipo IN ('residencial', 'comercial', 'institucional')),
  ADD COLUMN IF NOT EXISTS descricao text;
