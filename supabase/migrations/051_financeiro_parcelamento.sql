-- Adiciona colunas de parcelamento à tabela transacoes_financeiras
ALTER TABLE transacoes_financeiras
  ADD COLUMN IF NOT EXISTS parcela_atual integer,
  ADD COLUMN IF NOT EXISTS total_parcelas integer,
  ADD COLUMN IF NOT EXISTS movimentacao_pai_id uuid REFERENCES transacoes_financeiras(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recorrente boolean NOT NULL DEFAULT false;

-- Índice para agrupar parcelas pelo pai
CREATE INDEX IF NOT EXISTS idx_transacoes_movimentacao_pai
  ON transacoes_financeiras(movimentacao_pai_id)
  WHERE movimentacao_pai_id IS NOT NULL;
