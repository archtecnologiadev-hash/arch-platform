-- ARC Platform — UNIQUE constraint on escritorios.user_id
-- Required for upsert with onConflict:'user_id' to work.
-- Columns (nome_responsavel, website, especialidades) were already added in 006.
-- Run in: Supabase Dashboard → SQL Editor → New query

ALTER TABLE public.escritorios
  DROP CONSTRAINT IF EXISTS escritorios_user_id_key;

ALTER TABLE public.escritorios
  ADD CONSTRAINT escritorios_user_id_key UNIQUE (user_id);
