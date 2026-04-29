-- Suporte conversas
CREATE TABLE IF NOT EXISTS public.suporte_conversas (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        REFERENCES public.users(id) ON DELETE CASCADE,
  assunto        text,
  status         text        DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_andamento', 'resolvido', 'fechado')),
  prioridade     text        DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  ultima_mensagem_em timestamptz DEFAULT now(),
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- Suporte mensagens
CREATE TABLE IF NOT EXISTS public.suporte_mensagens (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  conversa_id    uuid        REFERENCES public.suporte_conversas(id) ON DELETE CASCADE,
  remetente_id   uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  conteudo       text        NOT NULL,
  is_admin       boolean     DEFAULT false,
  lida           boolean     DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suporte_conv_user   ON public.suporte_conversas(user_id);
CREATE INDEX IF NOT EXISTS idx_suporte_conv_status ON public.suporte_conversas(status);
CREATE INDEX IF NOT EXISTS idx_suporte_msg_conv    ON public.suporte_mensagens(conversa_id);
CREATE INDEX IF NOT EXISTS idx_suporte_msg_lida    ON public.suporte_mensagens(lida);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_suporte_conv_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_suporte_conv_updated_at ON public.suporte_conversas;
CREATE TRIGGER trg_suporte_conv_updated_at
  BEFORE UPDATE ON public.suporte_conversas
  FOR EACH ROW EXECUTE FUNCTION set_suporte_conv_updated_at();

-- RLS
ALTER TABLE public.suporte_conversas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suporte_mensagens  ENABLE ROW LEVEL SECURITY;

-- Users can manage their own conversations
CREATE POLICY suporte_conv_user_all ON public.suporte_conversas
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin can see all conversations (admins have is_admin = true in users table or use email check)
CREATE POLICY suporte_conv_admin_all ON public.suporte_conversas
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Users can see messages in their own conversations
CREATE POLICY suporte_msg_user_all ON public.suporte_mensagens
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.suporte_conversas sc
      WHERE sc.id = conversa_id AND sc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suporte_conversas sc
      WHERE sc.id = conversa_id AND sc.user_id = auth.uid()
    )
  );

-- Admin can see and write all messages
CREATE POLICY suporte_msg_admin_all ON public.suporte_mensagens
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.suporte_conversas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.suporte_mensagens;
