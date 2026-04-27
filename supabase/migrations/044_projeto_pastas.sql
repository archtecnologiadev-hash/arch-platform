-- Project folder system
CREATE TABLE IF NOT EXISTS public.projeto_pastas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  pasta_pai_id uuid REFERENCES public.projeto_pastas(id) ON DELETE CASCADE,
  criado_por uuid REFERENCES public.users(id),
  ordem int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.arquivos_projeto
  ADD COLUMN IF NOT EXISTS pasta_id uuid REFERENCES public.projeto_pastas(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE public.projeto_pastas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage folders of their projects"
  ON public.projeto_pastas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos p
      JOIN public.escritorios e ON e.id = p.escritorio_id
      WHERE p.id = projeto_pastas.projeto_id
        AND (e.owner_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.projeto_membros pm WHERE pm.projeto_id = p.id AND pm.user_id = auth.uid()
        ))
    )
  );

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_projeto_pastas_projeto ON public.projeto_pastas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_projeto_pastas_pai ON public.projeto_pastas(pasta_pai_id);
