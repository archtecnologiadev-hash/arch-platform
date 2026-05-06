-- Per-component Vision AI call log for cost auditing

CREATE TABLE IF NOT EXISTS public.vision_ai_logs (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  detalhamento_id uuid REFERENCES public.detalhamento_projetos(id) ON DELETE CASCADE NOT NULL,
  componente_id   uuid REFERENCES public.detalhamento_componentes(id) ON DELETE CASCADE,
  tokens_input    int,
  tokens_output   int,
  custo_usd       numeric(10,6),
  resposta_raw    text,
  erro            text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vision_logs_detalhamento ON public.vision_ai_logs(detalhamento_id);
CREATE INDEX IF NOT EXISTS idx_vision_logs_componente   ON public.vision_ai_logs(componente_id);

ALTER TABLE public.vision_ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vision_logs_owner_all" ON public.vision_ai_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.detalhamento_projetos dp
      JOIN public.escritorios e ON e.id = dp.escritorio_id
      WHERE dp.id = vision_ai_logs.detalhamento_id
        AND e.user_id = auth.uid()
    )
  );
