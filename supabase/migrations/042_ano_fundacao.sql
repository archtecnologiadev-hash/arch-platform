-- ARC Platform — Add ano_fundacao to escritorios
-- Run in: Supabase Dashboard → SQL Editor → New query

ALTER TABLE public.escritorios
ADD COLUMN IF NOT EXISTS ano_fundacao integer;
