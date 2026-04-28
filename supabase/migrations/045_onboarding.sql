ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_passos_completos jsonb DEFAULT '[]'::jsonb;

-- Mark all existing users as having completed onboarding
UPDATE public.users
SET onboarding_completo = true,
    onboarding_passos_completos = '["perfil","projeto","equipe","pagamento"]'::jsonb
WHERE created_at < now() - interval '1 day';
