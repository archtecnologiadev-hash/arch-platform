-- Storage bucket for chat file attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-arquivos', 'chat-arquivos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "chat_arquivos_select" ON storage.objects;
CREATE POLICY "chat_arquivos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-arquivos');

DROP POLICY IF EXISTS "chat_arquivos_insert" ON storage.objects;
CREATE POLICY "chat_arquivos_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-arquivos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "chat_arquivos_delete" ON storage.objects;
CREATE POLICY "chat_arquivos_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'chat-arquivos' AND auth.role() = 'authenticated');

-- Make texto nullable to support pure file messages
ALTER TABLE public.mensagens ALTER COLUMN texto DROP NOT NULL;
