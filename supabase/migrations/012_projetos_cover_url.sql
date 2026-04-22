-- ARC Platform — Add cover_url to projetos table
-- Run in: Supabase Dashboard → SQL Editor → New query

ALTER TABLE public.projetos ADD COLUMN IF NOT EXISTS cover_url text;
