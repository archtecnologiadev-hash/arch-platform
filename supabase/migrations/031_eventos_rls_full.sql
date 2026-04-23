-- Full CRUD RLS for eventos table.
-- Previously only SELECT was allowed; INSERT/UPDATE/DELETE were blocked.

DROP POLICY IF EXISTS "eventos_select" ON public.eventos;
DROP POLICY IF EXISTS "eventos_insert" ON public.eventos;
DROP POLICY IF EXISTS "eventos_update" ON public.eventos;
DROP POLICY IF EXISTS "eventos_delete" ON public.eventos;
DROP POLICY IF EXISTS "eventos_read" ON public.eventos;
DROP POLICY IF EXISTS "Eventos visíveis por todos autenticados" ON public.eventos;
DROP POLICY IF EXISTS "Arquiteto pode inserir eventos" ON public.eventos;
DROP POLICY IF EXISTS "Arquiteto pode atualizar eventos" ON public.eventos;
DROP POLICY IF EXISTS "Arquiteto pode deletar eventos" ON public.eventos;

CREATE POLICY "eventos_select" ON public.eventos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "eventos_insert" ON public.eventos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "eventos_update" ON public.eventos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "eventos_delete" ON public.eventos
  FOR DELETE USING (auth.role() = 'authenticated');
