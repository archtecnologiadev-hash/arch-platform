-- ARC Platform — Arquivos, anotações e solicitações de orçamento
-- Run in: Supabase Dashboard → SQL Editor → New query

-- ── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.arquivos_projeto (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id     uuid        REFERENCES public.projetos(id) ON DELETE CASCADE NOT NULL,
  nome           text        NOT NULL,
  url            text        NOT NULL,
  tipo           text,
  tamanho        bigint,
  enviado_por    uuid        REFERENCES auth.users(id),
  enviado_por_nome text,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.anotacoes_projeto (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id uuid        REFERENCES public.projetos(id) ON DELETE CASCADE NOT NULL,
  texto      text        NOT NULL,
  autor_id   uuid        REFERENCES auth.users(id),
  autor_nome text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.solicitacoes_orcamento (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id      uuid        REFERENCES public.projetos(id) ON DELETE CASCADE NOT NULL,
  fornecedor_slug text        NOT NULL,
  fornecedor_nome text,
  descricao       text        NOT NULL,
  data_prevista   text,
  arquivo_url     text,
  solicitante_id  uuid        REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.arquivos_projeto      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anotacoes_projeto     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_orcamento ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user the owner of the escritório that owns this project?
-- arquivos_projeto
CREATE POLICY "arq_proj_read" ON public.arquivos_projeto FOR SELECT USING (
  projeto_id IN (
    SELECT p.id FROM public.projetos p
    JOIN public.escritorios e ON e.id = p.escritorio_id
    WHERE e.user_id = auth.uid()
  )
);
CREATE POLICY "arq_proj_insert" ON public.arquivos_projeto FOR INSERT WITH CHECK (
  projeto_id IN (
    SELECT p.id FROM public.projetos p
    JOIN public.escritorios e ON e.id = p.escritorio_id
    WHERE e.user_id = auth.uid()
  )
);
CREATE POLICY "arq_proj_delete" ON public.arquivos_projeto FOR DELETE USING (
  projeto_id IN (
    SELECT p.id FROM public.projetos p
    JOIN public.escritorios e ON e.id = p.escritorio_id
    WHERE e.user_id = auth.uid()
  )
);

-- anotacoes_projeto
CREATE POLICY "anot_proj_read" ON public.anotacoes_projeto FOR SELECT USING (
  projeto_id IN (
    SELECT p.id FROM public.projetos p
    JOIN public.escritorios e ON e.id = p.escritorio_id
    WHERE e.user_id = auth.uid()
  )
);
CREATE POLICY "anot_proj_insert" ON public.anotacoes_projeto FOR INSERT WITH CHECK (
  projeto_id IN (
    SELECT p.id FROM public.projetos p
    JOIN public.escritorios e ON e.id = p.escritorio_id
    WHERE e.user_id = auth.uid()
  )
);

-- solicitacoes_orcamento
CREATE POLICY "sol_orc_insert" ON public.solicitacoes_orcamento FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "sol_orc_read"   ON public.solicitacoes_orcamento FOR SELECT USING (solicitante_id = auth.uid());

-- ── Storage buckets ───────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('projetos',   'projetos',   true, 52428800)
  ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('orcamentos', 'orcamentos', true, 52428800)
  ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

-- ── Storage policies — projetos ───────────────────────────────────────────────
DROP POLICY IF EXISTS "projetos_storage_owner_read"   ON storage.objects;
DROP POLICY IF EXISTS "projetos_storage_owner_upload" ON storage.objects;
DROP POLICY IF EXISTS "projetos_storage_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "projetos_storage_owner_delete" ON storage.objects;

CREATE POLICY "projetos_storage_owner_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'projetos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "projetos_storage_owner_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'projetos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "projetos_storage_owner_update" ON storage.objects
  FOR UPDATE
  USING      (bucket_id = 'projetos' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'projetos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "projetos_storage_owner_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'projetos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── Storage policies — orcamentos ─────────────────────────────────────────────
DROP POLICY IF EXISTS "orcamentos_storage_owner_read"   ON storage.objects;
DROP POLICY IF EXISTS "orcamentos_storage_owner_upload" ON storage.objects;
DROP POLICY IF EXISTS "orcamentos_storage_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "orcamentos_storage_owner_delete" ON storage.objects;

CREATE POLICY "orcamentos_storage_owner_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'orcamentos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "orcamentos_storage_owner_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'orcamentos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "orcamentos_storage_owner_update" ON storage.objects
  FOR UPDATE
  USING      (bucket_id = 'orcamentos' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'orcamentos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "orcamentos_storage_owner_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'orcamentos' AND auth.uid()::text = (storage.foldername(name))[1]);
