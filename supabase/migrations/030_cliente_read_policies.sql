-- Allow all authenticated users (including clients) to read project files and events.
-- Previously these policies only allowed the escritório owner (arquiteto).

-- arquivos_projeto: drop old restrictive policy, add open read for authenticated
DROP POLICY IF EXISTS "arq_proj_read" ON public.arquivos_projeto;
DROP POLICY IF EXISTS "arquivos_select" ON public.arquivos_projeto;
CREATE POLICY "arquivos_select" ON public.arquivos_projeto
  FOR SELECT USING (auth.role() = 'authenticated');

-- eventos: drop old restrictive policy, add open read for authenticated
DROP POLICY IF EXISTS "eventos_read" ON public.eventos;
DROP POLICY IF EXISTS "eventos_select" ON public.eventos;
CREATE POLICY "eventos_select" ON public.eventos
  FOR SELECT USING (auth.role() = 'authenticated');
