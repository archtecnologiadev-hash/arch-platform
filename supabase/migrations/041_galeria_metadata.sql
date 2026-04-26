-- ARC Platform — Add metadata columns to escritorio_galeria
-- Run in: Supabase Dashboard → SQL Editor → New query

ALTER TABLE public.escritorio_galeria
ADD COLUMN IF NOT EXISTS largura integer,
ADD COLUMN IF NOT EXISTS altura integer,
ADD COLUMN IF NOT EXISTS tamanho_bytes bigint,
ADD COLUMN IF NOT EXISTS eh_principal boolean DEFAULT false;

ALTER TABLE public.escritorios
ADD COLUMN IF NOT EXISTS imagem_principal_id uuid REFERENCES public.escritorio_galeria(id) ON DELETE SET NULL;
