-- ARC Platform — Fix storage policies for upsert support
-- upsert:true in Supabase Storage runs INSERT ON CONFLICT DO UPDATE,
-- which requires the UPDATE policy to have WITH CHECK (not just USING).
-- Also ensures bucket exists with file-size limit.
-- Run in: Supabase Dashboard → SQL Editor → New query

-- ── Ensure bucket exists and is public ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('escritorios', 'escritorios', true, 10485760)
  ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

-- ── Ensure image columns exist on escritorios ─────────────────────────────────
ALTER TABLE public.escritorios
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS cover_url text;

-- ── Drop old policies (from migrations 005 and 006) ───────────────────────────
DROP POLICY IF EXISTS "escritorios_storage_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "escritorios_storage_owner_upload"  ON storage.objects;
DROP POLICY IF EXISTS "escritorios_storage_owner_update"  ON storage.objects;
DROP POLICY IF EXISTS "escritorios_storage_owner_delete"  ON storage.objects;

-- ── Recreate with WITH CHECK on UPDATE ───────────────────────────────────────
CREATE POLICY "escritorios_storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'escritorios');

CREATE POLICY "escritorios_storage_owner_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'escritorios'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- WITH CHECK required so upsert (INSERT ON CONFLICT DO UPDATE) is allowed
CREATE POLICY "escritorios_storage_owner_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'escritorios'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'escritorios'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "escritorios_storage_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'escritorios'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
