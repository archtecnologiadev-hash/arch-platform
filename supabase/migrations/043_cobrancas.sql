-- Sistema de cobranças manuais

CREATE TABLE IF NOT EXISTS public.cobrancas (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES public.users(id) ON DELETE CASCADE,
  valor         numeric(10,2) NOT NULL,
  descricao     text,
  vencimento    date NOT NULL,
  status        text DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'atrasado')),
  pix_chave     text,
  pix_qrcode_url text,
  comprovante_url text,
  pago_em       timestamptz,
  created_by    uuid REFERENCES public.users(id),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas suas próprias cobranças; admin vê todas
CREATE POLICY "cobrancas_select" ON public.cobrancas
  FOR SELECT USING (
    auth.uid() = user_id OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "cobrancas_insert" ON public.cobrancas
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "cobrancas_update" ON public.cobrancas
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "cobrancas_delete" ON public.cobrancas
  FOR DELETE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_cobrancas_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER cobrancas_updated_at
  BEFORE UPDATE ON public.cobrancas
  FOR EACH ROW EXECUTE FUNCTION public.set_cobrancas_updated_at();
