-- Add avatar_url to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telefone text;

-- Fix projetos SELECT policy
DROP POLICY IF EXISTS "projetos_select" ON public.projetos;
CREATE POLICY "projetos_select" ON public.projetos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create avatares storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatares', 'avatares', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for avatares bucket
DROP POLICY IF EXISTS "avatares_select" ON storage.objects;
CREATE POLICY "avatares_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatares');

DROP POLICY IF EXISTS "avatares_insert" ON storage.objects;
CREATE POLICY "avatares_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatares' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "avatares_update" ON storage.objects;
CREATE POLICY "avatares_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatares' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "avatares_delete" ON storage.objects;
CREATE POLICY "avatares_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatares' AND auth.uid()::text = (storage.foldername(name))[1]);
