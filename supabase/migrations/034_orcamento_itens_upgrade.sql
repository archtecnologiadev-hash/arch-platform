-- ARC Platform — orcamento_itens: add quantidade, observacao, criado_por columns
-- Run in: Supabase Dashboard → SQL Editor → New query

ALTER TABLE public.orcamento_itens
  ADD COLUMN IF NOT EXISTS quantidade   integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS observacao   text,
  ADD COLUMN IF NOT EXISTS criado_por   uuid REFERENCES public.users(id);
