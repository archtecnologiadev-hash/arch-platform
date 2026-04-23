-- Make projeto_id nullable so events can exist without a specific project.
-- Also adds escritorio_id so general events (sem projeto) are still scoped to an escritório.

ALTER TABLE public.eventos ALTER COLUMN projeto_id DROP NOT NULL;

ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS escritorio_id uuid REFERENCES public.escritorios(id) ON DELETE CASCADE;

-- Backfill escritorio_id for existing events via their projeto
UPDATE public.eventos e
SET escritorio_id = p.escritorio_id
FROM public.projetos p
WHERE e.projeto_id = p.id AND e.escritorio_id IS NULL;

-- RLS: ensure full CRUD is allowed (idempotent alongside 031)
DROP POLICY IF EXISTS "eventos_select" ON public.eventos;
DROP POLICY IF EXISTS "eventos_insert" ON public.eventos;
DROP POLICY IF EXISTS "eventos_update" ON public.eventos;
DROP POLICY IF EXISTS "eventos_delete" ON public.eventos;

CREATE POLICY "eventos_select" ON public.eventos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "eventos_insert" ON public.eventos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "eventos_update" ON public.eventos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "eventos_delete" ON public.eventos FOR DELETE USING (auth.role() = 'authenticated');
