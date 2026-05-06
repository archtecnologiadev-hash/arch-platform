-- ─── PR 3: Aprendizado por escritório + status de identificação ───────────────

-- Identificações aprendidas por escritório (por hash de geometria)
CREATE TABLE IF NOT EXISTS public.componentes_aprendidos (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id    uuid REFERENCES public.escritorios(id) ON DELETE CASCADE NOT NULL,
  geometria_hash   text NOT NULL,            -- SHA256 das dimensões arredondadas
  tipo_componente  text NOT NULL,
  confirmado_por   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  confirmado_at    timestamptz DEFAULT now(),
  vezes_usado      int NOT NULL DEFAULT 1,
  created_at       timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_aprendidos_unique
  ON public.componentes_aprendidos(escritorio_id, geometria_hash);

CREATE INDEX IF NOT EXISTS idx_aprendidos_escritorio
  ON public.componentes_aprendidos(escritorio_id);

ALTER TABLE public.componentes_aprendidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aprendidos_owner_all" ON public.componentes_aprendidos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.escritorios e WHERE e.id = componentes_aprendidos.escritorio_id AND e.user_id = auth.uid())
  );

CREATE POLICY "aprendidos_gestor_all" ON public.componentes_aprendidos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.escritorio_vinculado_id = componentes_aprendidos.escritorio_id AND u.nivel_permissao = 'gestor')
  );

CREATE POLICY "aprendidos_operacional_view" ON public.componentes_aprendidos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.escritorio_vinculado_id = componentes_aprendidos.escritorio_id)
  );

-- Ampliar constraint de status_identificacao para incluir novos valores
ALTER TABLE public.detalhamento_componentes
  DROP CONSTRAINT IF EXISTS detalhamento_componentes_status_identificacao_check;

ALTER TABLE public.detalhamento_componentes
  ADD CONSTRAINT detalhamento_componentes_status_identificacao_check
  CHECK (status_identificacao IN (
    'auto', 'confirmado', 'corrigido',   -- legados
    'catalogo',                           -- PR 2: match no catálogo
    'aprendizado',                        -- PR 3A: hash match no escritório
    'heuristica',                         -- PR 3B: regras geométricas
    'vision_ai',                          -- PR 3C: Claude Vision AI
    'duvidoso'                            -- PR 3C: confiança < 0.6
  ));

-- Confiança da classificação (0.0 – 1.0)
ALTER TABLE public.detalhamento_componentes
  ADD COLUMN IF NOT EXISTS confianca numeric(4,3);

-- Raciocínio da IA (debug / transparência)
ALTER TABLE public.detalhamento_componentes
  ADD COLUMN IF NOT EXISTS raciocinio_ia text;

-- Log de chamadas Vision AI por detalhamento (controle de custo)
CREATE TABLE IF NOT EXISTS public.detalhamento_ia_log (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  detalhamento_id uuid REFERENCES public.detalhamento_projetos(id) ON DELETE CASCADE NOT NULL,
  chamadas        int NOT NULL DEFAULT 0,
  componentes_ok  int NOT NULL DEFAULT 0,
  componentes_duvida int NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.detalhamento_ia_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ialog_owner_all" ON public.detalhamento_ia_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.detalhamento_projetos dp
      JOIN public.escritorios e ON e.id = dp.escritorio_id
      WHERE dp.id = detalhamento_ia_log.detalhamento_id AND e.user_id = auth.uid()
    )
  );
