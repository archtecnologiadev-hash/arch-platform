-- Add Asaas fields to assinaturas
ALTER TABLE public.assinaturas
  ADD COLUMN IF NOT EXISTS asaas_customer_id text,
  ADD COLUMN IF NOT EXISTS asaas_subscription_id text,
  ADD COLUMN IF NOT EXISTS card_last4 text,
  ADD COLUMN IF NOT EXISTS card_brand text;

-- Payments table synced from Asaas webhooks
CREATE TABLE IF NOT EXISTS public.cobrancas_asaas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assinatura_id uuid REFERENCES public.assinaturas(id) ON DELETE SET NULL,
  asaas_payment_id text NOT NULL UNIQUE,
  valor numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  vencimento date,
  pago_em timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cobrancas_asaas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own cobrancas_asaas"
  ON public.cobrancas_asaas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assinaturas a
      WHERE a.id = cobrancas_asaas.assinatura_id
        AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "admin all cobrancas_asaas"
  ON public.cobrancas_asaas FOR ALL
  USING (is_admin());
