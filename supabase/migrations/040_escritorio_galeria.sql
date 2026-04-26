-- ARC Platform — Gallery for architect public profile carousel
-- Run in: Supabase Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS public.escritorio_galeria (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id uuid REFERENCES public.escritorios(id) ON DELETE CASCADE NOT NULL,
  url         text NOT NULL,
  ordem       integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.escritorio_galeria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "galeria_select" ON public.escritorio_galeria
  FOR SELECT USING (true);

CREATE POLICY "galeria_all" ON public.escritorio_galeria
  FOR ALL USING (auth.role() = 'authenticated');
