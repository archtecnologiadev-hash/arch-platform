-- ARC Platform — Plan feature gates: storage tracking, marketplace ordering, certificate badge
-- Run in: Supabase Dashboard → SQL Editor → New query

-- ── 1. Add tamanho column to image tables ─────────────────────────────────────
ALTER TABLE public.portfolio_imagens
  ADD COLUMN IF NOT EXISTS tamanho bigint DEFAULT 0;

ALTER TABLE public.fornecedor_produto_imagens
  ADD COLUMN IF NOT EXISTS tamanho bigint DEFAULT 0;

-- ── 2. Add marketplace ordering to escritorios ────────────────────────────────
ALTER TABLE public.escritorios
  ADD COLUMN IF NOT EXISTS destaque_marketplace text DEFAULT 'nenhum';

-- ── 3. Add marketplace ordering + certificate badge to fornecedores ───────────
ALTER TABLE public.fornecedores
  ADD COLUMN IF NOT EXISTS destaque_marketplace text DEFAULT 'nenhum',
  ADD COLUMN IF NOT EXISTS selo_certificado     boolean DEFAULT false;

-- ── 4. Add analytics flag to planos (if not already present) ─────────────────
ALTER TABLE public.planos
  ADD COLUMN IF NOT EXISTS analytics           boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS suporte_prioritario boolean DEFAULT false;

-- Set analytics = true for profissional and escritorio plans
UPDATE public.planos SET analytics = true
  WHERE slug IN ('arquiteto-profissional', 'arquiteto-escritorio',
                 'fornecedor-profissional', 'fornecedor-destaque');

-- Set suporte_prioritario = true for escritorio/destaque plans
UPDATE public.planos SET suporte_prioritario = true
  WHERE slug IN ('arquiteto-escritorio', 'fornecedor-destaque');

-- ── 5. Storage calculation function ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.calcular_armazenamento_usado(p_user_id uuid)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  total_bytes bigint := 0;
  subtotal    bigint := 0;
  esc_id      uuid;
  forn_id     uuid;
BEGIN
  SELECT id INTO esc_id  FROM public.escritorios  WHERE user_id = p_user_id;
  SELECT id INTO forn_id FROM public.fornecedores WHERE user_id = p_user_id;

  IF esc_id IS NOT NULL THEN
    -- arquivos_projeto (client project files)
    SELECT COALESCE(SUM(ap.tamanho), 0) INTO subtotal
      FROM public.arquivos_projeto ap
      JOIN public.projetos p ON p.id = ap.projeto_id
     WHERE p.escritorio_id = esc_id;
    total_bytes := total_bytes + subtotal;

    -- portfolio_imagens
    SELECT COALESCE(SUM(pi.tamanho), 0) INTO subtotal
      FROM public.portfolio_imagens pi
      JOIN public.projetos_portfolio pp ON pp.id = pi.projeto_portfolio_id
     WHERE pp.escritorio_id = esc_id;
    total_bytes := total_bytes + subtotal;
  END IF;

  IF forn_id IS NOT NULL THEN
    -- fornecedor_produto_imagens
    SELECT COALESCE(SUM(fpi.tamanho), 0) INTO subtotal
      FROM public.fornecedor_produto_imagens fpi
      JOIN public.fornecedor_produtos fp ON fp.id = fpi.produto_id
     WHERE fp.fornecedor_id = forn_id;
    total_bytes := total_bytes + subtotal;
  END IF;

  RETURN total_bytes;
END;
$$;

-- Grant execute to authenticated users (function uses SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION public.calcular_armazenamento_usado(uuid) TO authenticated;
