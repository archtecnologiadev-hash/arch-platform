-- ARC Platform — curtidas e comentarios por produto do fornecedor
-- Run in: Supabase Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS public.curtidas_fornecedor (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id uuid REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  produto_id   uuid REFERENCES public.fornecedor_produtos(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES public.users(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(produto_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.comentarios_fornecedor (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id   uuid REFERENCES public.fornecedor_produtos(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES public.users(id) ON DELETE CASCADE,
  texto        text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.curtidas_fornecedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios_fornecedor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "curtidas_all"    ON public.curtidas_fornecedor    FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "curtidas_select" ON public.curtidas_fornecedor    FOR SELECT USING (true);
CREATE POLICY "comentarios_all" ON public.comentarios_fornecedor FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "comentarios_select" ON public.comentarios_fornecedor FOR SELECT USING (true);
