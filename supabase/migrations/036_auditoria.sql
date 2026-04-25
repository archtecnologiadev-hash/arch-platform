-- 036: add criado_por audit column to eventos and arquivos_projeto
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS criado_por uuid REFERENCES public.users(id);

ALTER TABLE public.arquivos_projeto
  ADD COLUMN IF NOT EXISTS criado_por uuid REFERENCES public.users(id);
