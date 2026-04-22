-- ARC Platform — Fornecedores: add missing columns, fix RLS, storage bucket
-- Run in: Supabase Dashboard → SQL Editor → New query

-- ── Columns ───────────────────────────────────────────────────────────────────
ALTER TABLE public.fornecedores
  ADD COLUMN IF NOT EXISTS image_url  text,
  ADD COLUMN IF NOT EXISTS cover_url  text,
  ADD COLUMN IF NOT EXISTS instagram  text,
  ADD COLUMN IF NOT EXISTS whatsapp   text,
  ADD COLUMN IF NOT EXISTS website    text,
  ADD COLUMN IF NOT EXISTS email      text,
  ADD COLUMN IF NOT EXISTS founded    text,
  ADD COLUMN IF NOT EXISTS bio        text;

-- ── RLS — drop old catch-all, add explicit INSERT / UPDATE ────────────────────
DROP POLICY IF EXISTS "fornecedores_owner_write" ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_insert"       ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_update"       ON public.fornecedores;

CREATE POLICY "fornecedores_insert" ON public.fornecedores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "fornecedores_update" ON public.fornecedores
  FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Storage bucket ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('fornecedores', 'fornecedores', true, 10485760)
  ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

DROP POLICY IF EXISTS "fornecedores_storage_read"   ON storage.objects;
DROP POLICY IF EXISTS "fornecedores_storage_upload" ON storage.objects;
DROP POLICY IF EXISTS "fornecedores_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "fornecedores_storage_delete" ON storage.objects;

CREATE POLICY "fornecedores_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'fornecedores');

CREATE POLICY "fornecedores_storage_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fornecedores' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "fornecedores_storage_update" ON storage.objects
  FOR UPDATE
  USING      (bucket_id = 'fornecedores' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'fornecedores' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "fornecedores_storage_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'fornecedores' AND auth.uid()::text = (storage.foldername(name))[1]);
