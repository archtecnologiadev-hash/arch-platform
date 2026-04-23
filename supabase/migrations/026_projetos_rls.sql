-- Fix projetos SELECT policy so clients can read their own projects
DROP POLICY IF EXISTS "projetos_select" ON public.projetos;
CREATE POLICY "projetos_select" ON public.projetos
  FOR SELECT USING (auth.role() = 'authenticated');
