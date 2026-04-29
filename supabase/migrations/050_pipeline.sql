-- Subtarefas por etapa do projeto
CREATE TABLE IF NOT EXISTS public.projeto_subtarefas (
  id             uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id     uuid    REFERENCES public.projetos(id) ON DELETE CASCADE,
  etapa          text    NOT NULL,
  titulo         text    NOT NULL,
  descricao      text,
  concluida      boolean DEFAULT false,
  responsavel_id uuid    REFERENCES public.users(id) ON DELETE SET NULL,
  data_limite    date,
  ordem          integer DEFAULT 0,
  criado_por     uuid    REFERENCES public.users(id) ON DELETE SET NULL,
  created_at     timestamptz DEFAULT now(),
  concluida_em   timestamptz
);

-- Rastreamento de tempo por etapa
CREATE TABLE IF NOT EXISTS public.projeto_etapa_tempo (
  id             uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id     uuid    REFERENCES public.projetos(id) ON DELETE CASCADE,
  etapa          text    NOT NULL,
  iniciado_em    timestamptz DEFAULT now(),
  finalizado_em  timestamptz,
  dias_na_etapa  integer
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subtarefas_proj  ON public.projeto_subtarefas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_subtarefas_etapa ON public.projeto_subtarefas(etapa);
CREATE INDEX IF NOT EXISTS idx_etapa_tempo_proj ON public.projeto_etapa_tempo(projeto_id);

-- RLS
ALTER TABLE public.projeto_subtarefas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_etapa_tempo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subtarefas_all" ON public.projeto_subtarefas
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "etapa_tempo_all" ON public.projeto_etapa_tempo
  FOR ALL USING (auth.role() = 'authenticated');
