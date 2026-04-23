-- ARC Platform — projetos: add metragem, endereco, email_cliente, tipo_contrato
-- Run in: Supabase Dashboard → SQL Editor → New query

ALTER TABLE public.projetos
  ADD COLUMN IF NOT EXISTS metragem      numeric(10,2),
  ADD COLUMN IF NOT EXISTS endereco      text,
  ADD COLUMN IF NOT EXISTS email_cliente text,
  ADD COLUMN IF NOT EXISTS tipo_contrato text;
