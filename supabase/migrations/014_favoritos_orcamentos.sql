-- ARC Platform — Favoritos de fornecedores e tabela de orçamentos
-- Run in: Supabase Dashboard → SQL Editor → New query

-- ── fornecedores_favoritos ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fornecedores_favoritos (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  arquiteto_id  uuid        REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  fornecedor_id uuid        REFERENCES public.fornecedores(id) ON DELETE CASCADE NOT NULL,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(arquiteto_id, fornecedor_id)
);
ALTER TABLE public.fornecedores_favoritos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favoritos_all" ON public.fornecedores_favoritos
  FOR ALL USING (auth.uid() = arquiteto_id);

-- ── orcamentos ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orcamentos (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id           uuid        REFERENCES public.projetos(id) ON DELETE CASCADE,
  fornecedor_id        uuid        REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  arquiteto_id         uuid        REFERENCES public.users(id) ON DELETE CASCADE,
  mensagem             text,
  arquivo_url          text,
  status               text        DEFAULT 'pendente',
  resposta             text,
  resposta_arquivo_url text,
  created_at           timestamptz DEFAULT now()
);
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orcamentos_all" ON public.orcamentos
  FOR ALL USING (auth.role() = 'authenticated');
