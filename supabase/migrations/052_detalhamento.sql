-- ─── Detalhamento de Projetos (parser .dae / COLLADA) ────────────────────────

CREATE TABLE IF NOT EXISTS public.detalhamento_projetos (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id     uuid REFERENCES public.projetos(id) ON DELETE CASCADE NOT NULL,
  escritorio_id  uuid REFERENCES public.escritorios(id) ON DELETE CASCADE NOT NULL,
  dae_file_path  text NOT NULL,
  dae_file_name  text,
  dae_uploaded_at timestamptz DEFAULT now(),
  status         text NOT NULL DEFAULT 'processing'
                   CHECK (status IN ('processing', 'done', 'error')),
  error_message  text,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.detalhamento_componentes (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  detalhamento_id      uuid REFERENCES public.detalhamento_projetos(id) ON DELETE CASCADE NOT NULL,
  nome_skp             text NOT NULL,
  tipo_inferido        text,
  fabricante           text,
  posicao_x            numeric(14,6),
  posicao_y            numeric(14,6),
  posicao_z            numeric(14,6),
  dimensao_x           numeric(14,6),
  dimensao_y           numeric(14,6),
  dimensao_z           numeric(14,6),
  status_identificacao text DEFAULT 'auto'
                          CHECK (status_identificacao IN ('auto', 'confirmado', 'corrigido')),
  raw_metadata         jsonb
);

CREATE TABLE IF NOT EXISTS public.detalhamento_comodos (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  detalhamento_id uuid REFERENCES public.detalhamento_projetos(id) ON DELETE CASCADE NOT NULL,
  nome            text NOT NULL,
  polygon         jsonb,
  area_m2         numeric(10,3),
  pe_direito_m    numeric(6,3)
);

CREATE INDEX IF NOT EXISTS idx_det_proj_projeto    ON public.detalhamento_projetos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_det_proj_escritorio ON public.detalhamento_projetos(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_det_comp_det        ON public.detalhamento_componentes(detalhamento_id);
CREATE INDEX IF NOT EXISTS idx_det_com_det         ON public.detalhamento_comodos(detalhamento_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.detalhamento_projetos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalhamento_componentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalhamento_comodos    ENABLE ROW LEVEL SECURITY;

-- detalhamento_projetos
CREATE POLICY "det_proj_owner_all" ON public.detalhamento_projetos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.escritorios e WHERE e.id = detalhamento_projetos.escritorio_id AND e.user_id = auth.uid())
  );

CREATE POLICY "det_proj_gestor_all" ON public.detalhamento_projetos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.escritorio_vinculado_id = detalhamento_projetos.escritorio_id AND u.nivel_permissao = 'gestor')
  );

CREATE POLICY "det_proj_operacional_view" ON public.detalhamento_projetos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.escritorio_vinculado_id = detalhamento_projetos.escritorio_id AND u.nivel_permissao = 'operacional')
  );

-- detalhamento_componentes
CREATE POLICY "det_comp_owner_all" ON public.detalhamento_componentes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.detalhamento_projetos dp JOIN public.escritorios e ON e.id = dp.escritorio_id WHERE dp.id = detalhamento_componentes.detalhamento_id AND e.user_id = auth.uid())
  );

CREATE POLICY "det_comp_gestor_all" ON public.detalhamento_componentes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.detalhamento_projetos dp JOIN public.users u ON u.escritorio_vinculado_id = dp.escritorio_id WHERE dp.id = detalhamento_componentes.detalhamento_id AND u.id = auth.uid() AND u.nivel_permissao = 'gestor')
  );

CREATE POLICY "det_comp_operacional_view" ON public.detalhamento_componentes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.detalhamento_projetos dp JOIN public.users u ON u.escritorio_vinculado_id = dp.escritorio_id WHERE dp.id = detalhamento_componentes.detalhamento_id AND u.id = auth.uid() AND u.nivel_permissao = 'operacional')
  );

-- detalhamento_comodos
CREATE POLICY "det_com_owner_all" ON public.detalhamento_comodos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.detalhamento_projetos dp JOIN public.escritorios e ON e.id = dp.escritorio_id WHERE dp.id = detalhamento_comodos.detalhamento_id AND e.user_id = auth.uid())
  );

CREATE POLICY "det_com_gestor_all" ON public.detalhamento_comodos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.detalhamento_projetos dp JOIN public.users u ON u.escritorio_vinculado_id = dp.escritorio_id WHERE dp.id = detalhamento_comodos.detalhamento_id AND u.id = auth.uid() AND u.nivel_permissao = 'gestor')
  );

CREATE POLICY "det_com_operacional_view" ON public.detalhamento_comodos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.detalhamento_projetos dp JOIN public.users u ON u.escritorio_vinculado_id = dp.escritorio_id WHERE dp.id = detalhamento_comodos.detalhamento_id AND u.id = auth.uid() AND u.nivel_permissao = 'operacional')
  );

-- ─── Storage bucket (200 MB limit) ────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'detalhamento', 'detalhamento', false, 209715200,
  ARRAY['model/vnd.collada+xml','application/xml','text/xml','application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "det_storage_owner" ON storage.objects
  FOR ALL USING (
    bucket_id = 'detalhamento' AND
    EXISTS (SELECT 1 FROM public.escritorios e WHERE e.user_id = auth.uid() AND (storage.foldername(name))[1] = e.id::text)
  );

CREATE POLICY "det_storage_member_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'detalhamento' AND
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND (storage.foldername(name))[1] = u.escritorio_vinculado_id::text)
  );
