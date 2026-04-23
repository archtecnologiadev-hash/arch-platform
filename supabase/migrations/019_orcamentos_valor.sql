-- ARC Platform — orcamentos: add titulo, valor_orcado, valor_fechado
-- Run in: Supabase Dashboard → SQL Editor → New query

ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS titulo         text,
  ADD COLUMN IF NOT EXISTS valor_orcado   numeric(12,2),
  ADD COLUMN IF NOT EXISTS valor_fechado  numeric(12,2);
