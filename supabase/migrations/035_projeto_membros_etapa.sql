-- 035: add etapa column to projeto_membros for stage-level assignment
ALTER TABLE public.projeto_membros
  ADD COLUMN IF NOT EXISTS etapa text;
