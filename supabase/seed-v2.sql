-- =============================================================
-- ARC Platform — Seed v2 (mínimo)
-- 5 arquitetos + escritórios, 3 fornecedores, 2 clientes
-- Senha: senha123   Emails: *@arc-test.local
-- Limpeza: SELECT remover_seed_v2();
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Limpeza
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.remover_seed_v2()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE n integer;
BEGIN
  DELETE FROM auth.users WHERE email LIKE '%@arc-test.local';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN 'Removidos ' || n || ' usuários de teste (seed-v2)';
END; $$;

-- ─────────────────────────────────────────────────────────────
-- Dados
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  -- UUIDs — arquitetos
  ua1 uuid := gen_random_uuid();
  ua2 uuid := gen_random_uuid();
  ua3 uuid := gen_random_uuid();
  ua4 uuid := gen_random_uuid();
  ua5 uuid := gen_random_uuid();
  -- UUIDs — fornecedores
  uf1 uuid := gen_random_uuid();
  uf2 uuid := gen_random_uuid();
  uf3 uuid := gen_random_uuid();
  -- UUIDs — clientes
  uc1 uuid := gen_random_uuid();
  uc2 uuid := gen_random_uuid();
  -- UUIDs — escritórios
  e1 uuid := gen_random_uuid();
  e2 uuid := gen_random_uuid();
  e3 uuid := gen_random_uuid();
  e4 uuid := gen_random_uuid();
  e5 uuid := gen_random_uuid();
  -- UUIDs — fornecedores (registro)
  f1 uuid := gen_random_uuid();
  f2 uuid := gen_random_uuid();
  f3 uuid := gen_random_uuid();

BEGIN

-- ── auth.users ────────────────────────────────────────────────

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  aud, role,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES
  -- arquitetos
  (ua1, '00000000-0000-0000-0000-000000000000', 'arq1@arc-test.local',
   crypt('senha123', gen_salt('bf')), now(), now(), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"nome":"Ana Oliveira","tipo":"arquiteto"}'::jsonb,
   '', '', '', ''),
  (ua2, '00000000-0000-0000-0000-000000000000', 'arq2@arc-test.local',
   crypt('senha123', gen_salt('bf')), now(), now(), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"nome":"Bruno Menezes","tipo":"arquiteto"}'::jsonb,
   '', '', '', ''),
  (ua3, '00000000-0000-0000-0000-000000000000', 'arq3@arc-test.local',
   crypt('senha123', gen_salt('bf')), now(), now(), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"nome":"Carla Drummond","tipo":"arquiteto"}'::jsonb,
   '', '', '', ''),
  (ua4, '00000000-0000-0000-0000-000000000000', 'arq4@arc-test.local',
   crypt('senha123', gen_salt('bf')), now(), now(), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"nome":"Diego Fonseca","tipo":"arquiteto"}'::jsonb,
   '', '', '', ''),
  (ua5, '00000000-0000-0000-0000-000000000000', 'arq5@arc-test.local',
   crypt('senha123', gen_salt('bf')), now(), now(), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"nome":"Elena Rocha","tipo":"arquiteto"}'::jsonb,
   '', '', '', ''),
  -- fornecedores
  (uf1, '00000000-0000-0000-0000-000000000000', 'forn1@arc-test.local',
   crypt('senha123', gen_salt('bf')), now(), now(), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"nome":"Marmoraria Belo","tipo":"fornecedor"}'::jsonb,
   '', '', '', ''),
  (uf2, '00000000-0000-0000-0000-000000000000', 'forn2@arc-test.local',
   crypt('senha123', gen_salt('bf')), now(), now(), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"nome":"Iluminação Certa","tipo":"fornecedor"}'::jsonb,
   '', '', '', ''),
  (uf3, '00000000-0000-0000-0000-000000000000', 'forn3@arc-test.local',
   crypt('senha123', gen_salt('bf')), now(), now(), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"nome":"Madeiras do Sul","tipo":"fornecedor"}'::jsonb,
   '', '', '', ''),
  -- clientes
  (uc1, '00000000-0000-0000-0000-000000000000', 'cli1@arc-test.local',
   crypt('senha123', gen_salt('bf')), now(), now(), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"nome":"Felipe Barros","tipo":"cliente"}'::jsonb,
   '', '', '', ''),
  (uc2, '00000000-0000-0000-0000-000000000000', 'cli2@arc-test.local',
   crypt('senha123', gen_salt('bf')), now(), now(), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"nome":"Gabriela Nunes","tipo":"cliente"}'::jsonb,
   '', '', '', '');

-- ── public.users ──────────────────────────────────────────────

INSERT INTO public.users (id, email, nome, tipo) VALUES
  (ua1, 'arq1@arc-test.local', 'Ana Oliveira',     'arquiteto'),
  (ua2, 'arq2@arc-test.local', 'Bruno Menezes',    'arquiteto'),
  (ua3, 'arq3@arc-test.local', 'Carla Drummond',   'arquiteto'),
  (ua4, 'arq4@arc-test.local', 'Diego Fonseca',    'arquiteto'),
  (ua5, 'arq5@arc-test.local', 'Elena Rocha',      'arquiteto'),
  (uf1, 'forn1@arc-test.local','Marmoraria Belo',  'fornecedor'),
  (uf2, 'forn2@arc-test.local','Iluminação Certa', 'fornecedor'),
  (uf3, 'forn3@arc-test.local','Madeiras do Sul',  'fornecedor'),
  (uc1, 'cli1@arc-test.local', 'Felipe Barros',    'cliente'),
  (uc2, 'cli2@arc-test.local', 'Gabriela Nunes',   'cliente')
ON CONFLICT (id) DO NOTHING;

-- ── escritórios ───────────────────────────────────────────────

INSERT INTO public.escritorios (id, user_id, nome, cidade, estado, estilo, bio, slug, rating, nome_responsavel, especialidades) VALUES
  (e1, ua1, 'Oliveira Arquitetura',  'São Paulo',       'SP', 'Contemporâneo',
   'Escritório focado em residências de alto padrão com linguagem contemporânea.',
   'oliveira-arq', 4.8, 'Ana Oliveira',  ARRAY['Residencial','Alto padrão']),
  (e2, ua2, 'Menezes Studio',        'Rio de Janeiro',  'RJ', 'Minimalista',
   'Projetos minimalistas que equilibram funcionalidade e estética.',
   'menezes-studio', 4.6, 'Bruno Menezes', ARRAY['Minimalismo','Comercial']),
  (e3, ua3, 'Drummond & Cia',        'Belo Horizonte',  'MG', 'Orgânico',
   'Arquitetura orgânica integrada à natureza e aos materiais regionais.',
   'drummond-cia', 4.7, 'Carla Drummond', ARRAY['Orgânico','Sustentável']),
  (e4, ua4, 'Fonseca Projetos',      'Curitiba',        'PR', 'Industrial',
   'Especialistas em requalificação de espaços industriais e lofts.',
   'fonseca-projetos', 4.5, 'Diego Fonseca', ARRAY['Industrial','Loft']),
  (e5, ua5, 'Rocha Atelier',         'Porto Alegre',    'RS', 'Bioclimático',
   'Design bioclimático com foco em eficiência energética e conforto térmico.',
   'rocha-atelier', 4.9, 'Elena Rocha', ARRAY['Bioclimático','Residencial'])
ON CONFLICT (slug) DO NOTHING;

-- ── fornecedores ──────────────────────────────────────────────

INSERT INTO public.fornecedores (id, user_id, nome, segmento, cidade, bio, slug) VALUES
  (f1, uf1, 'Marmoraria Belo',  'Pedras e Mármores', 'São Paulo',
   'Fornecedor premium de mármores, granitos e quartzitos para projetos de luxo.',
   'marmoraria-belo'),
  (f2, uf2, 'Iluminação Certa', 'Iluminação',        'São Paulo',
   'Soluções completas de iluminação técnica e decorativa para arquitetos.',
   'iluminacao-certa'),
  (f3, uf3, 'Madeiras do Sul',  'Madeira e Pisos',   'Porto Alegre',
   'Madeiras nobres certificadas e pisos de madeira maciça para projetos residenciais.',
   'madeiras-do-sul')
ON CONFLICT (slug) DO NOTHING;

END $$;
