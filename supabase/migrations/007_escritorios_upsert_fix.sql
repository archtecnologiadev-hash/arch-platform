-- ARC Platform — Fix escritorios: missing columns + unique constraint on user_id
-- Run in: Supabase Dashboard → SQL Editor → New query

-- Add columns that the perfil page sends but that didn't exist in the schema
ALTER TABLE public.escritorios
  ADD COLUMN IF NOT EXISTS nome_responsavel text,
  ADD COLUMN IF NOT EXISTS website          text,
  ADD COLUMN IF NOT EXISTS especialidades   text[];

-- Unique constraint so upsert on user_id works (1 user = 1 escritório)
ALTER TABLE public.escritorios
  DROP CONSTRAINT IF EXISTS escritorios_user_id_key;

ALTER TABLE public.escritorios
  ADD CONSTRAINT escritorios_user_id_key UNIQUE (user_id);
