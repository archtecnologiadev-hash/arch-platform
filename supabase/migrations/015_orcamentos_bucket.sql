-- ARC Platform — orcamentos storage bucket
-- Run in: Supabase Dashboard → SQL Editor → New query

INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('orcamentos', 'orcamentos', true, 20971520)
  ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 20971520;

DROP POLICY IF EXISTS "orcamentos_storage_read"   ON storage.objects;
DROP POLICY IF EXISTS "orcamentos_storage_upload" ON storage.objects;

CREATE POLICY "orcamentos_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'orcamentos');

CREATE POLICY "orcamentos_storage_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'orcamentos' AND auth.role() = 'authenticated');
