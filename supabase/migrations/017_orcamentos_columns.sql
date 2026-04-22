-- ARC Platform — orcamentos: add arquivo_nome, updated_at
-- Run in: Supabase Dashboard → SQL Editor → New query

ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS arquivo_nome         text,
  ADD COLUMN IF NOT EXISTS updated_at           timestamptz DEFAULT now();
