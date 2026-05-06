-- ─── PR 4: Pontos técnicos + pranchas PDF ─────────────────────────────��──────

CREATE TABLE IF NOT EXISTS public.detalhamento_pontos (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  detalhamento_id      uuid REFERENCES public.detalhamento_projetos(id) ON DELETE CASCADE NOT NULL,
  comodo_id            uuid REFERENCES public.detalhamento_comodos(id) ON DELETE SET NULL,
  componente_origem_id uuid REFERENCES public.detalhamento_componentes(id) ON DELETE SET NULL,
  disciplina           text NOT NULL CHECK (disciplina IN ('hidraulica','eletrica','gas','mobiliario')),
  tipo_ponto           text NOT NULL,
  posicao_x            numeric NOT NULL,
  posicao_y            numeric NOT NULL,
  altura_cm            int NOT NULL DEFAULT 0,
  status               text NOT NULL DEFAULT 'novo' CHECK (status IN ('existente','reposicionar','novo')),
  descricao_tecnica    text,
  dados_extras         jsonb,
  created_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pontos_det     ON public.detalhamento_pontos(detalhamento_id);
CREATE INDEX IF NOT EXISTS idx_pontos_disc    ON public.detalhamento_pontos(detalhamento_id, disciplina);
CREATE INDEX IF NOT EXISTS idx_pontos_comodo  ON public.detalhamento_pontos(comodo_id);

ALTER TABLE public.detalhamento_pontos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pontos_owner_all" ON public.detalhamento_pontos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.detalhamento_projetos dp
      JOIN public.escritorios e ON e.id = dp.escritorio_id
      WHERE dp.id = detalhamento_pontos.detalhamento_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "pontos_gestor_all" ON public.detalhamento_pontos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.detalhamento_projetos dp
      JOIN public.users u ON u.escritorio_vinculado_id = dp.escritorio_id
      WHERE dp.id = detalhamento_pontos.detalhamento_id
        AND u.id = auth.uid() AND u.nivel_permissao = 'gestor'
    )
  );

CREATE POLICY "pontos_operacional_view" ON public.detalhamento_pontos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.detalhamento_projetos dp
      JOIN public.users u ON u.escritorio_vinculado_id = dp.escritorio_id
      WHERE dp.id = detalhamento_pontos.detalhamento_id AND u.id = auth.uid()
    )
  );

-- ─── Pranchas geradas ──────────────���───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.detalhamento_pranchas (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  detalhamento_id uuid REFERENCES public.detalhamento_projetos(id) ON DELETE CASCADE NOT NULL,
  disciplina      text NOT NULL,
  numero_prancha  text NOT NULL,
  pdf_path        text NOT NULL,
  gerado_em       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pranchas_det ON public.detalhamento_pranchas(detalhamento_id);

ALTER TABLE public.detalhamento_pranchas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pranchas_owner_all" ON public.detalhamento_pranchas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.detalhamento_projetos dp
      JOIN public.escritorios e ON e.id = dp.escritorio_id
      WHERE dp.id = detalhamento_pranchas.detalhamento_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "pranchas_gestor_all" ON public.detalhamento_pranchas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.detalhamento_projetos dp
      JOIN public.users u ON u.escritorio_vinculado_id = dp.escritorio_id
      WHERE dp.id = detalhamento_pranchas.detalhamento_id
        AND u.id = auth.uid() AND u.nivel_permissao = 'gestor'
    )
  );

CREATE POLICY "pranchas_operacional_view" ON public.detalhamento_pranchas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.detalhamento_projetos dp
      JOIN public.users u ON u.escritorio_vinculado_id = dp.escritorio_id
      WHERE dp.id = detalhamento_pranchas.detalhamento_id AND u.id = auth.uid()
    )
  );
