-- ARC Platform — fornecedor_produtos e fornecedor_produto_imagens
-- Run in: Supabase Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS public.fornecedor_produtos (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id uuid        REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  nome         text        NOT NULL,
  descricao    text,
  tipo         text        DEFAULT 'produto',
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fornecedor_produto_imagens (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id uuid        REFERENCES public.fornecedor_produtos(id) ON DELETE CASCADE,
  url        text        NOT NULL,
  ordem      integer     DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.fornecedor_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedor_produto_imagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produtos_select"   ON public.fornecedor_produtos        FOR SELECT USING (true);
CREATE POLICY "produtos_all"      ON public.fornecedor_produtos        FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "produto_img_select" ON public.fornecedor_produto_imagens FOR SELECT USING (true);
CREATE POLICY "produto_img_all"   ON public.fornecedor_produto_imagens FOR ALL    USING (auth.role() = 'authenticated');
