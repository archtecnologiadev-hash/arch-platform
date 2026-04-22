-- ARC Platform — orcamento_historico: stage movement log
-- Run in: Supabase Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS public.orcamento_historico (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id    uuid        REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  etapa_anterior  text,
  etapa_nova      text,
  usuario_id      uuid        REFERENCES public.users(id),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.orcamento_historico ENABLE ROW LEVEL SECURITY;

-- WITH CHECK needed for INSERT to work under RLS
CREATE POLICY "historico_select" ON public.orcamento_historico
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "historico_insert" ON public.orcamento_historico
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
