-- ARC Platform — Chat: conversas + mensagens
-- Run in: Supabase Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS public.conversas (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  arquiteto_id   uuid REFERENCES public.users(id) ON DELETE CASCADE,
  participante_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  tipo           text NOT NULL CHECK (tipo IN ('cliente', 'fornecedor')),
  fornecedor_id  uuid REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  created_at     timestamptz DEFAULT now(),
  UNIQUE(arquiteto_id, participante_id)
);

CREATE TABLE IF NOT EXISTS public.mensagens (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversa_id  uuid REFERENCES public.conversas(id) ON DELETE CASCADE,
  remetente_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  texto        text,
  arquivo_url  text,
  arquivo_nome text,
  lida         boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversas_all" ON public.conversas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "mensagens_all" ON public.mensagens FOR ALL USING (auth.role() = 'authenticated');
