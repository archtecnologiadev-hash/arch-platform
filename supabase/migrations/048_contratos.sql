CREATE TABLE IF NOT EXISTS public.contrato_modelos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id uuid REFERENCES public.escritorios(id) ON DELETE CASCADE,
  nome text NOT NULL,
  conteudo text NOT NULL,
  variaveis jsonb DEFAULT '[]'::jsonb,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contratos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_id uuid REFERENCES public.contrato_modelos(id) ON DELETE SET NULL,
  projeto_id uuid REFERENCES public.projetos(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  escritorio_id uuid REFERENCES public.escritorios(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  conteudo_final text NOT NULL,
  valor numeric(12,2),
  status text DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado', 'visualizado', 'assinado', 'cancelado')),
  enviado_em timestamptz,
  visualizado_em timestamptz,
  assinado_em timestamptz,
  assinatura_cliente text,
  assinatura_arquiteto text,
  pdf_url text,
  criado_por uuid REFERENCES public.users(id),
  ip_assinatura text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contrato_modelos_escritorio ON public.contrato_modelos(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_contratos_escritorio ON public.contratos(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_contratos_projeto ON public.contratos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON public.contratos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON public.contratos(status);

CREATE OR REPLACE FUNCTION public.set_contratos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contrato_modelos_updated_at
  BEFORE UPDATE ON public.contrato_modelos
  FOR EACH ROW EXECUTE FUNCTION public.set_contratos_updated_at();

CREATE TRIGGER contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.set_contratos_updated_at();

ALTER TABLE public.contrato_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modelos_all" ON public.contrato_modelos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "contratos_all" ON public.contratos
  FOR ALL USING (auth.role() = 'authenticated');
