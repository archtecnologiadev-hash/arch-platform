-- ARC Platform — orcamento_itens: budget items per project category
-- Run in: Supabase Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS public.orcamento_itens (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id  uuid REFERENCES public.projetos(id) ON DELETE CASCADE,
  categoria   text NOT NULL,
  descricao   text NOT NULL,
  valor       numeric(12,2) NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orcamento_itens_all"    ON public.orcamento_itens FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "orcamento_itens_select" ON public.orcamento_itens FOR SELECT USING (true);
