CREATE TABLE IF NOT EXISTS public.transacoes_financeiras (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id uuid REFERENCES public.escritorios(id) ON DELETE CASCADE NOT NULL,
  projeto_id uuid REFERENCES public.projetos(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria text,
  descricao text NOT NULL,
  valor numeric(12,2) NOT NULL,
  metodo_pagamento text CHECK (metodo_pagamento IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto', 'outro')),
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  data_vencimento date,
  data_pagamento date,
  nota_fiscal_emitida boolean DEFAULT false,
  numero_nota_fiscal text,
  observacao text,
  criado_por uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transacoes_escritorio ON public.transacoes_financeiras(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_projeto ON public.transacoes_financeiras(projeto_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON public.transacoes_financeiras(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON public.transacoes_financeiras(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_created ON public.transacoes_financeiras(created_at DESC);

CREATE OR REPLACE FUNCTION public.set_transacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transacoes_financeiras_updated_at
  BEFORE UPDATE ON public.transacoes_financeiras
  FOR EACH ROW EXECUTE FUNCTION public.set_transacoes_updated_at();

ALTER TABLE public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- Studio owner has full access
CREATE POLICY "transacoes_owner_all" ON public.transacoes_financeiras
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.escritorios e
      WHERE e.id = transacoes_financeiras.escritorio_id
        AND e.user_id = auth.uid()
    )
  );

-- Gestor members have full access
CREATE POLICY "transacoes_gestor_all" ON public.transacoes_financeiras
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.escritorio_vinculado_id = transacoes_financeiras.escritorio_id
        AND u.nivel_permissao = 'gestor'
    )
  );

-- Operacional members can only view
CREATE POLICY "transacoes_operacional_view" ON public.transacoes_financeiras
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.escritorio_vinculado_id = transacoes_financeiras.escritorio_id
        AND u.nivel_permissao = 'operacional'
    )
  );

-- Clients can view their project's transactions
CREATE POLICY "transacoes_cliente_view" ON public.transacoes_financeiras
  FOR SELECT USING (
    cliente_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.projetos p
      WHERE p.id = transacoes_financeiras.projeto_id
        AND p.cliente_id = auth.uid()
    )
  );
