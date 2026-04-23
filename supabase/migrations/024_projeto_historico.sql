-- ARC Platform — projeto_historico: audit log for project changes
-- Run in: Supabase Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS public.projeto_historico (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id  uuid REFERENCES public.projetos(id) ON DELETE CASCADE,
  usuario_id  uuid REFERENCES public.users(id),
  acao        text NOT NULL,
  detalhe     text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.projeto_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historico_projeto_all" ON public.projeto_historico FOR ALL USING (auth.role() = 'authenticated');
