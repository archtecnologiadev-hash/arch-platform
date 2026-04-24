-- =============================================================
-- ARC Platform — Dados de Teste v2
-- 20 arquitetos + portfólio, 10 fornecedores + produtos, 5 clientes
-- Imagens: Unsplash (arquitetura real)
-- Para remover: SELECT public.remover_dados_teste();
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Funções auxiliares
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.criar_usuario_ficticio(
  p_email text, p_nome text, p_tipo text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE novo_id uuid; BEGIN
  novo_id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    aud, role, raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    novo_id, '00000000-0000-0000-0000-000000000000', p_email,
    crypt('senha123', gen_salt('bf')),
    now(), now(), now(), 'authenticated', 'authenticated',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nome', p_nome, 'tipo', p_tipo),
    '', '', '', ''
  );
  INSERT INTO public.users (id, email, nome, tipo)
  VALUES (novo_id, p_email, p_nome, p_tipo);
  RETURN novo_id;
EXCEPTION WHEN unique_violation THEN
  SELECT id INTO novo_id FROM public.users WHERE email = p_email;
  RETURN novo_id;
END; $$;

CREATE OR REPLACE FUNCTION public.remover_dados_teste()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE uid uuid; n integer := 0; BEGIN
  FOR uid IN SELECT id FROM auth.users WHERE email LIKE '%@arc-test.local' LOOP
    DELETE FROM auth.users WHERE id = uid;
    n := n + 1;
  END LOOP;
  RETURN 'Removidos ' || n || ' usuários de teste';
END; $$;

CREATE OR REPLACE VIEW public.dados_teste_view AS
SELECT u.id, u.nome, u.email, u.tipo, 'senha123'::text AS senha_padrao, u.created_at
FROM public.users u WHERE u.email LIKE '%@arc-test.local'
ORDER BY u.tipo, u.nome;

GRANT SELECT ON public.dados_teste_view TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- Bloco principal de dados
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  -- Arquitetos
  uid1  uuid; uid2  uuid; uid3  uuid; uid4  uuid; uid5  uuid;
  uid6  uuid; uid7  uuid; uid8  uuid; uid9  uuid; uid10 uuid;
  uid11 uuid; uid12 uuid; uid13 uuid; uid14 uuid; uid15 uuid;
  uid16 uuid; uid17 uuid; uid18 uuid; uid19 uuid; uid20 uuid;
  -- Escritório IDs
  eid1  uuid; eid2  uuid; eid3  uuid; eid4  uuid; eid5  uuid;
  eid6  uuid; eid7  uuid; eid8  uuid; eid9  uuid; eid10 uuid;
  eid11 uuid; eid12 uuid; eid13 uuid; eid14 uuid; eid15 uuid;
  eid16 uuid; eid17 uuid; eid18 uuid; eid19 uuid; eid20 uuid;
  -- Fornecedores
  fuid1 uuid; fuid2 uuid; fuid3  uuid; fuid4  uuid; fuid5  uuid;
  fuid6 uuid; fuid7 uuid; fuid8  uuid; fuid9  uuid; fuid10 uuid;
  fid1  uuid; fid2  uuid; fid3   uuid; fid4   uuid; fid5   uuid;
  fid6  uuid; fid7  uuid; fid8   uuid; fid9   uuid; fid10  uuid;
  -- Clientes
  cuid1 uuid; cuid2 uuid; cuid3 uuid; cuid4 uuid; cuid5 uuid;
  -- Portfolio / produto temp IDs
  pp uuid; prod uuid; conv uuid;
  -- Image constants
  B text := 'https://images.unsplash.com/photo-';
  C text := '?w=800&h=400&fit=crop&q=80';   -- cover
  P text := '?w=900&h=600&fit=crop&q=80';   -- portfolio
  S text := '?w=300&h=300&fit=crop&q=80';   -- square/produto
BEGIN

-- ══════════════════════════════════════════════════════════════
-- USUÁRIOS ARQUITETOS
-- ══════════════════════════════════════════════════════════════
uid1  := public.criar_usuario_ficticio('teste_escritorio_1@arc-test.local',  'Carlos Schmitt',    'arquiteto');
uid2  := public.criar_usuario_ficticio('teste_escritorio_2@arc-test.local',  'Ana Bäumer',        'arquiteto');
uid3  := public.criar_usuario_ficticio('teste_escritorio_3@arc-test.local',  'Luís Ritter',       'arquiteto');
uid4  := public.criar_usuario_ficticio('teste_escritorio_4@arc-test.local',  'Fernanda Müller',   'arquiteto');
uid5  := public.criar_usuario_ficticio('teste_escritorio_5@arc-test.local',  'Rodrigo Alves',     'arquiteto');
uid6  := public.criar_usuario_ficticio('teste_escritorio_6@arc-test.local',  'Heinrich Fischer',  'arquiteto');
uid7  := public.criar_usuario_ficticio('teste_escritorio_7@arc-test.local',  'Beatriz Cunha',     'arquiteto');
uid8  := public.criar_usuario_ficticio('teste_escritorio_8@arc-test.local',  'Paulo Hoffmann',    'arquiteto');
uid9  := public.criar_usuario_ficticio('teste_escritorio_9@arc-test.local',  'Marina Torres',     'arquiteto');
uid10 := public.criar_usuario_ficticio('teste_escritorio_10@arc-test.local', 'Gerhardt Neumann',  'arquiteto');
uid11 := public.criar_usuario_ficticio('teste_escritorio_11@arc-test.local', 'Camila Santos',     'arquiteto');
uid12 := public.criar_usuario_ficticio('teste_escritorio_12@arc-test.local', 'Klaus Weber',       'arquiteto');
uid13 := public.criar_usuario_ficticio('teste_escritorio_13@arc-test.local', 'Paulo Melo',        'arquiteto');
uid14 := public.criar_usuario_ficticio('teste_escritorio_14@arc-test.local', 'Sandra Klein',      'arquiteto');
uid15 := public.criar_usuario_ficticio('teste_escritorio_15@arc-test.local', 'Rafael Oliveira',   'arquiteto');
uid16 := public.criar_usuario_ficticio('teste_escritorio_16@arc-test.local', 'Thomas Becker',     'arquiteto');
uid17 := public.criar_usuario_ficticio('teste_escritorio_17@arc-test.local', 'Aline Bremer',      'arquiteto');
uid18 := public.criar_usuario_ficticio('teste_escritorio_18@arc-test.local', 'Otto Schulz',       'arquiteto');
uid19 := public.criar_usuario_ficticio('teste_escritorio_19@arc-test.local', 'Vera Wittmann',     'arquiteto');
uid20 := public.criar_usuario_ficticio('teste_escritorio_20@arc-test.local', 'Heiko Krause',      'arquiteto');

-- ══════════════════════════════════════════════════════════════
-- ESCRITÓRIOS — com imagens Unsplash de arquitetura real
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.escritorios
  (user_id, nome, nome_responsavel, cidade, estado, telefone, instagram, bio, especialidades, image_url, cover_url, slug)
VALUES
(uid1,  'Schmitt & Corrêa Arquitetura',    'Carlos Schmitt',    'Blumenau',           'SC', '(47) 99201-3847', '@schmitt.arquitetura',
  'Escritório com 12 anos de experiência em projetos residenciais de alto padrão. Especializados em soluções que integram o estilo europeu com a arquitetura contemporânea brasileira. Atuamos em toda a região do Vale do Itajaí.',
  ARRAY['Residencial','Interiores'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=SchmittCorrea',
  B||'1600585154340-be6161a56a0c'||C, 'schmitt-correa-arquitetura'),

(uid2,  'Atelier Bäumer Design',           'Ana Bäumer',        'Pomerode',           'SC', '(47) 99342-5610', '@atelie.baumer',
  'Design de interiores e arquitetura com influência da herança alemã de Pomerode. Criamos ambientes únicos que contam histórias. Mais de 200 projetos entregues na região.',
  ARRAY['Interiores','Comercial'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=AtelierBaumer',
  B||'1600607687939-ce8a6f349abc'||C, 'atelier-baumer-design'),

(uid3,  'Ritter Projetos Arquitetônicos',  'Luís Ritter',       'Gaspar',             'SC', '(47) 99455-7823', '@ritter.projetos',
  'Especialistas em arquitetura residencial e corporativa para Gaspar e municípios vizinhos. Projetos sustentáveis com foco em eficiência energética e conforto térmico.',
  ARRAY['Residencial','Corporativo'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=RitterProjetos',
  B||'1600585154526-990dced4db0d'||C, 'ritter-projetos-arquitetonicos'),

(uid4,  'Müller Arquitetura Sustentável',  'Fernanda Müller',   'Blumenau',           'SC', '(47) 99567-2190', '@muller.sustentavel',
  'Arquitetura bioclimática e paisagismo integrado. Desenvolvemos projetos que respeitam o meio ambiente e valorizam o bem-estar dos moradores. Certificação LEED para projetos comerciais.',
  ARRAY['Residencial','Paisagismo'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=MullerSust',
  B||'1600596542815-ffad4c1539a9'||C, 'muller-arquitetura-sustentavel'),

(uid5,  'Atelier Vale do Itajaí',          'Rodrigo Alves',     'Indaial',            'SC', '(47) 99618-4532', '@atelie.vale',
  'Escritório de arquitetura e design de interiores com foco em projetos residenciais modernos. Atendemos clientes em toda a região com projetos personalizados e dentro do prazo.',
  ARRAY['Residencial','Interiores'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=AtelierVale',
  B||'1600047509807-ba8f99d2cdde'||C, 'atelier-vale-do-itajai'),

(uid6,  'Fischer & Krauss Arquitetura',    'Heinrich Fischer',  'Blumenau',           'SC', '(47) 99723-8901', '@fischer.krauss',
  'Reconhecidos pela excelência em projetos corporativos e comerciais em Blumenau. Nossa equipe multidisciplinar entrega soluções completas, do projeto executivo ao acompanhamento de obra.',
  ARRAY['Corporativo','Comercial'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=FischerKrauss',
  B||'1600566753376-12c8ab7fb75b'||C, 'fischer-krauss-arquitetura'),

(uid7,  'Estúdio Itajaí Contemporâneo',   'Beatriz Cunha',     'Itajaí',             'SC', '(47) 99834-6274', '@studio.itajai',
  'Design de interiores e arquitetura residencial em Itajaí e região portuária. Projetos que valorizam a vista para o mar e o lifestyle costeiro catarinense.',
  ARRAY['Interiores','Residencial'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=EstudioItajai',
  B||'1600210492486-724fe5c67fb0'||C, 'estudio-itajai-contemporaneo'),

(uid8,  'Hoffmann Arquitetura Criativa',   'Paulo Hoffmann',    'Timbó',              'SC', '(47) 99945-1837', '@hoffmann.arq',
  'Arquitetura residencial e design de interiores com identidade única. Combinamos criatividade e funcionalidade para criar espaços que inspiram. Atendimento personalizado desde a concepção até a entrega.',
  ARRAY['Residencial','Interiores'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=HoffmannArq',
  B||'1600573472550-8090b5e0745e'||C, 'hoffmann-arquitetura-criativa'),

(uid9,  'Estúdio Formas Urbanas',          'Marina Torres',     'Blumenau',           'SC', '(47) 99012-5493', '@formas.urbanas',
  'Especialistas em arquitetura comercial e projetos de uso misto em ambiente urbano. Desenvolvemos conceitos que transformam espaços em experiências memoráveis.',
  ARRAY['Comercial','Corporativo'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=FormasUrbanas',
  B||'1600566753190-17f0baa2a6c3'||C, 'estudio-formas-urbanas'),

(uid10, 'Neumann Arquitetura e Urbanismo', 'Gerhardt Neumann',  'Pomerode',           'SC', '(47) 99156-7802', '@neumann.urbanismo',
  'Projetos residenciais e de urbanismo com forte influência do modernismo europeu. Diferencial na integração entre arquitetura, paisagismo e planejamento urbano.',
  ARRAY['Residencial','Paisagismo'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=NeumannUrb',
  B||'1600585154363-67eb9e2e2099'||C, 'neumann-arquitetura-e-urbanismo'),

(uid11, 'Atelier Sul Design',              'Camila Santos',     'Brusque',            'SC', '(47) 99267-9341', '@atelie.suldesign',
  'Design de interiores residencial e comercial em Brusque e região. Nossa equipe cria ambientes sofisticados com atenção a cada detalhe.',
  ARRAY['Interiores','Residencial'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=AtelierSul',
  B||'1558618666-fcd25c85cd64'||C, 'atelier-sul-design'),

(uid12, 'Weber & Associados Arquitetura',  'Klaus Weber',       'Gaspar',             'SC', '(47) 99378-2658', '@weber.associados',
  'Consultoria e projetos de arquitetura corporativa e comercial. Atendemos empresas de todos os setores com projetos que maximizam a funcionalidade do espaço.',
  ARRAY['Corporativo','Comercial'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=WeberAssoc',
  B||'1571091718767-18b5b1457add'||C, 'weber-associados-arquitetura'),

(uid13, 'Estúdio Rio do Sul Design',      'Paulo Melo',        'Rio do Sul',         'SC', '(47) 99489-3917', '@riodesul.design',
  'Escritório de arquitetura e design com presença consolidada em Rio do Sul. Projetos residenciais, comerciais e de interiores com foco em qualidade e inovação.',
  ARRAY['Residencial','Interiores'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=RioSulDesign',
  B||'1416331108676-a22ccb276e35'||C, 'estudio-rio-do-sul-design'),

(uid14, 'Klein Arquitetura Corporativa',   'Sandra Klein',      'Jaraguá do Sul',     'SC', '(47) 99590-4206', '@klein.corporativo',
  'Líderes em projetos corporativos e industriais na região de Jaraguá do Sul. Experiência em plantas industriais e escritórios corporativos.',
  ARRAY['Corporativo','Comercial'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=KleinArq',
  B||'1564078516393-cf04bd966897'||C, 'klein-arquitetura-corporativa'),

(uid15, 'Atelier Balneário Projetos',      'Rafael Oliveira',   'Balneário Camboriú', 'SC', '(47) 99601-8745', '@atelie.balneario',
  'Arquitetura residencial de alto padrão em Balneário Camboriú. Apartamentos, coberturas e casas de praia são nossa especialidade.',
  ARRAY['Residencial','Interiores'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=AtelierBalneario',
  B||'1502672260266-1c1ef2d93688'||C, 'atelier-balneario-projetos'),

(uid16, 'Becker Arquitetura Contemporânea','Thomas Becker',     'Blumenau',           'SC', '(47) 99712-5184', '@becker.contemporaneo',
  'Arquitetura e design com identidade contemporânea. Base em Blumenau, atendendo toda Santa Catarina com projetos que equilibram forma e função.',
  ARRAY['Residencial','Corporativo'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=BeckerContemp',
  B||'1505691938895-1758d7feb511'||C, 'becker-arquitetura-contemporanea'),

(uid17, 'Estúdio Bremer & Figueiredo',    'Aline Bremer',      'Indaial',            'SC', '(47) 99823-6473', '@bremer.figueiredo',
  'Design de interiores residencial em Indaial e região. Criamos ambientes que traduzem a personalidade dos clientes com elegância e funcionalidade.',
  ARRAY['Interiores','Residencial'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=BremerFig',
  B||'1560448204-444da2e9ddc3'||C, 'estudio-bremer-e-figueiredo'),

(uid18, 'Schulz Projetos e Espaços',      'Otto Schulz',       'Timbó',              'SC', '(47) 99934-7862', '@schulz.projetos',
  'Projetos residenciais e paisagismo integrado em Timbó e região. Acreditamos que um bom projeto respeita o entorno natural e cria harmonia com o verde.',
  ARRAY['Residencial','Paisagismo'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=SchulzProj',
  B||'1533779183-a4d2afe7ffe3'||C, 'schulz-projetos-e-espacos'),

(uid19, 'Atelier Wittmann Design',         'Vera Wittmann',     'Blumenau',           'SC', '(47) 99045-9151', '@wittmann.design',
  'Design de interiores e arquitetura comercial em Blumenau. Transformamos espaços comerciais em ambientes que potencializam os negócios dos clientes.',
  ARRAY['Interiores','Comercial'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=WittmannDesign',
  B||'1556028888-0c54de1c1b66'||C, 'atelier-wittmann-design'),

(uid20, 'Krause Arquitetura e Paisagismo', 'Heiko Krause',      'Blumenau',           'SC', '(47) 99156-0420', '@krause.paisagismo',
  'Paisagismo e arquitetura residencial com olhar sensível para o meio ambiente. Integramos jardins e áreas verdes aos projetos arquitetônicos.',
  ARRAY['Paisagismo','Residencial'],
  'https://api.dicebear.com/7.x/shapes/svg?seed=KrausePais',
  B||'1570129477492-45c003edd2be'||C, 'krause-arquitetura-e-paisagismo');

-- Captura IDs dos escritórios inseridos
SELECT id INTO eid1  FROM public.escritorios WHERE user_id = uid1;
SELECT id INTO eid2  FROM public.escritorios WHERE user_id = uid2;
SELECT id INTO eid3  FROM public.escritorios WHERE user_id = uid3;
SELECT id INTO eid4  FROM public.escritorios WHERE user_id = uid4;
SELECT id INTO eid5  FROM public.escritorios WHERE user_id = uid5;
SELECT id INTO eid6  FROM public.escritorios WHERE user_id = uid6;
SELECT id INTO eid7  FROM public.escritorios WHERE user_id = uid7;
SELECT id INTO eid8  FROM public.escritorios WHERE user_id = uid8;
SELECT id INTO eid9  FROM public.escritorios WHERE user_id = uid9;
SELECT id INTO eid10 FROM public.escritorios WHERE user_id = uid10;
SELECT id INTO eid11 FROM public.escritorios WHERE user_id = uid11;
SELECT id INTO eid12 FROM public.escritorios WHERE user_id = uid12;
SELECT id INTO eid13 FROM public.escritorios WHERE user_id = uid13;
SELECT id INTO eid14 FROM public.escritorios WHERE user_id = uid14;
SELECT id INTO eid15 FROM public.escritorios WHERE user_id = uid15;
SELECT id INTO eid16 FROM public.escritorios WHERE user_id = uid16;
SELECT id INTO eid17 FROM public.escritorios WHERE user_id = uid17;
SELECT id INTO eid18 FROM public.escritorios WHERE user_id = uid18;
SELECT id INTO eid19 FROM public.escritorios WHERE user_id = uid19;
SELECT id INTO eid20 FROM public.escritorios WHERE user_id = uid20;

-- ══════════════════════════════════════════════════════════════
-- PORTFÓLIO — 3 projetos por escritório, 3 imagens cada
-- ══════════════════════════════════════════════════════════════

-- ── Escritório 1 (Schmitt) ────────────────────────────────────
INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid1, 'Residência Vale do Rio', 'Casa de 280m² com integração entre área interna e jardim. Projeto minimalista com grandes painéis de vidro e materiais naturais nobres.', 'Residencial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600585154340-be6161a56a0c'||P, 0),
  (pp, B||'1600566753376-12c8ab7fb75b'||P, 1),
  (pp, B||'1600573472550-8090b5e0745e'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid1, 'Apartamento Centro Blumenau', 'Reforma completa de apartamento 140m². Conceito open space com cozinha integrada, home office e varanda ampliada.', 'Interiores') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600607687939-ce8a6f349abc'||P, 0),
  (pp, B||'1600596542815-ffad4c1539a9'||P, 1),
  (pp, B||'1600047509807-ba8f99d2cdde'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid1, 'Loja Conceito Blumenau', 'Projeto comercial 200m² com identidade forte para marca de moda. Uso de madeira, concreto e iluminação focal para criação de atmosfera única.', 'Comercial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600566753190-17f0baa2a6c3'||P, 0),
  (pp, B||'1564078516393-cf04bd966897'||P, 1),
  (pp, B||'1502672260266-1c1ef2d93688'||P, 2);

-- ── Escritório 2 (Bäumer) ─────────────────────────────────────
INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid2, 'Loft Contemporâneo Pomerode', 'Design de interiores de loft 85m² com referências à arquitetura europeia. Móveis sob medida em carvalho natural e acabamentos premium.', 'Interiores') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600607687939-ce8a6f349abc'||P, 0),
  (pp, B||'1505691938895-1758d7feb511'||P, 1),
  (pp, B||'1560448204-444da2e9ddc3'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid2, 'Casa Enxaimel Contemporânea', 'Residência que dialoga com a arquitetura típica de Pomerode. Fachada enxaimel renovada com interior totalmente contemporâneo.', 'Residencial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600585154526-990dced4db0d'||P, 0),
  (pp, B||'1600585154340-be6161a56a0c'||P, 1),
  (pp, B||'1570129477492-45c003edd2be'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid2, 'Restaurante Würzburg', 'Projeto gastronômico 180m² com temática alemã reinterpretada de forma contemporânea. Ambientação sofisticada que atrai turistas e moradores.', 'Comercial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1556028888-0c54de1c1b66'||P, 0),
  (pp, B||'1533779183-a4d2afe7ffe3'||P, 1),
  (pp, B||'1416331108676-a22ccb276e35'||P, 2);

-- ── Escritório 3 (Ritter) ─────────────────────────────────────
INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid3, 'Centro Empresarial Gaspar', 'Projeto corporativo 400m² para empresa de tecnologia. Espaços colaborativos abertos, salas de reunião com tecnologia integrada e lounge criativo.', 'Corporativo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600566753190-17f0baa2a6c3'||P, 0),
  (pp, B||'1571091718767-18b5b1457add'||P, 1),
  (pp, B||'1600210492486-724fe5c67fb0'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid3, 'Residência Alto Gaspar', 'Casa 320m² em terreno inclinado com aproveitamento da topografia. Piscina de borda infinita com vista para o vale e solário integrado.', 'Residencial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600585154363-67eb9e2e2099'||P, 0),
  (pp, B||'1596522354895-6bda26e96893'||P, 1),
  (pp, B||'1600585154526-990dced4db0d'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid3, 'Clínica Odontológica Gaspar', 'Clínica 220m² projetada para transmitir acolhimento e profissionalismo. Circulação fluida, cores neutras e luz natural integrada ao tratamento acústico.', 'Corporativo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1564078516393-cf04bd966897'||P, 0),
  (pp, B||'1502672260266-1c1ef2d93688'||P, 1),
  (pp, B||'1600607687939-ce8a6f349abc'||P, 2);

-- ── Escritório 4 (Müller) ─────────────────────────────────────
INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid4, 'Casa Bioclimática Blumenau', 'Residência 320m² com telhado verde, painéis solares integrados e captação de água pluvial. Projeto certificado com eficiência energética classe A.', 'Residencial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600585154340-be6161a56a0c'||P, 0),
  (pp, B||'1600585154363-67eb9e2e2099'||P, 1),
  (pp, B||'1570129477492-45c003edd2be'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid4, 'Jardim Sensorial Itoupava', 'Paisagismo residencial 1200m² com jardim sensorial, horta orgânica integrada, pomar e espelho d''água. Projeto premiado em sustentabilidade.', 'Paisagismo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1596522354895-6bda26e96893'||P, 0),
  (pp, B||'1600585154526-990dced4db0d'||P, 1),
  (pp, B||'1416331108676-a22ccb276e35'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid4, 'Condomínio Verde Blumenau', 'Projeto de paisagismo para condomínio 50 unidades. Áreas comuns integradas à mata nativa preservada, trilhas ecológicas e playground natural.', 'Paisagismo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1558618666-fcd25c85cd64'||P, 0),
  (pp, B||'1600566753376-12c8ab7fb75b'||P, 1),
  (pp, B||'1533779183-a4d2afe7ffe3'||P, 2);

-- ── Escritório 5 (Atelier Vale) ───────────────────────────────
INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid5, 'Residência Indaial Valley', 'Casa térrea 260m² em condomínio fechado. Integração total entre sala, cozinha e varanda gourmet. Piscina aquecida e jardim projetado.', 'Residencial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600047509807-ba8f99d2cdde'||P, 0),
  (pp, B||'1600596542815-ffad4c1539a9'||P, 1),
  (pp, B||'1600573472550-8090b5e0745e'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid5, 'Apartamento Moderno Indaial', 'Apartamento 110m² renovado com conceito minimalista. Cozinha americana integrada à sala, dois banheiros reformados e dormitório master ampliado.', 'Interiores') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600607687939-ce8a6f349abc'||P, 0),
  (pp, B||'1556028888-0c54de1c1b66'||P, 1),
  (pp, B||'1560448204-444da2e9ddc3'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid5, 'Sede Cooperativa Vale', 'Sede administrativa 600m² para cooperativa regional. Projeto que equilibra funcionalidade operacional com espaços de representação e atendimento ao público.', 'Corporativo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1571091718767-18b5b1457add'||P, 0),
  (pp, B||'1600210492486-724fe5c67fb0'||P, 1),
  (pp, B||'1564078516393-cf04bd966897'||P, 2);

-- ── Escritórios 6-10 ─────────────────────────────────────────
INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid6, 'Torre Corporativa Blumenau', 'Projeto executivo de 8 andares com 3.200m². Fachada em vidro reflexivo, lobbies de representação e lajes livres para locação modular.', 'Corporativo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1571091718767-18b5b1457add'||P, 0), (pp, B||'1600210492486-724fe5c67fb0'||P, 1), (pp, B||'1533779183-a4d2afe7ffe3'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid6, 'Shopping Galeria Hering', 'Reforma e expansão de galeria comercial 1.800m². Atualização da identidade visual, nova praça de alimentação e adequação às normas de acessibilidade.', 'Comercial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600566753376-12c8ab7fb75b'||P, 0), (pp, B||'1505691938895-1758d7feb511'||P, 1), (pp, B||'1502672260266-1c1ef2d93688'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid6, 'Sede Administrativa Blumenau', 'Headquarters de 1.200m² para empresa de médio porte. Open office, 3 salas de reunião, auditório e rooftop com área de convivência.', 'Corporativo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600566753190-17f0baa2a6c3'||P, 0), (pp, B||'1564078516393-cf04bd966897'||P, 1), (pp, B||'1416331108676-a22ccb276e35'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid7, 'Cobertura Duplex Itajaí', 'Cobertura 280m² com terraço e piscina aquecida. Vista panorâmica para o porto e o mar. Acabamentos premium e automação residencial completa.', 'Residencial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1596522354895-6bda26e96893'||P, 0), (pp, B||'1600585154363-67eb9e2e2099'||P, 1), (pp, B||'1600047509807-ba8f99d2cdde'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid7, 'Boutique Hotel Itajaí', 'Hotel boutique 20 suítes com design inspirado na cultura marítima. Materiais naturais, tons de azul e branco, spa e restaurante integrados.', 'Comercial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600607687939-ce8a6f349abc'||P, 0), (pp, B||'1558618666-fcd25c85cd64'||P, 1), (pp, B||'1560448204-444da2e9ddc3'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid7, 'Loft Industrial Chic', 'Conversão de armazém portuário em 6 lofts exclusivos. Estrutura de aço aparente, pé-direito duplo, grandes janelas e terraços privativos.', 'Interiores') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1505691938895-1758d7feb511'||P, 0), (pp, B||'1533779183-a4d2afe7ffe3'||P, 1), (pp, B||'1570129477492-45c003edd2be'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid8, 'Casa de Campo Timbó', 'Residência de campo 380m² com estilo moderno rural. Estrutura mista de madeira e concreto, jardim nativo e integração com arroio natural.', 'Residencial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600585154340-be6161a56a0c'||P, 0), (pp, B||'1570129477492-45c003edd2be'||P, 1), (pp, B||'1416331108676-a22ccb276e35'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid8, 'Master Bedroom Suite', 'Projeto de interiores para suíte master 45m². Walk-in closet planejado, banheiro spa com banheira freestanding e sacada privativa.', 'Interiores') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600573472550-8090b5e0745e'||P, 0), (pp, B||'1560448204-444da2e9ddc3'||P, 1), (pp, B||'1600047509807-ba8f99d2cdde'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid8, 'Condomínio Residencial Timbó', 'Projeto arquitetônico de condomínio 18 casas. Tipologias variadas, áreas comuns com piscina, academia e playground. Entrega 2024.', 'Residencial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1596522354895-6bda26e96893'||P, 0), (pp, B||'1600585154526-990dced4db0d'||P, 1), (pp, B||'1558618666-fcd25c85cd64'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid9, 'Galeria de Arte Blumenau', 'Galeria contemporânea 500m² com pé-direito de 6m. Iluminação técnica museológica, paredes versáteis e espaço para instalações de grande porte.', 'Comercial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600566753376-12c8ab7fb75b'||P, 0), (pp, B||'1502672260266-1c1ef2d93688'||P, 1), (pp, B||'1505691938895-1758d7feb511'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid9, 'Coworking Rio Itajaí', 'Espaço de coworking 350m² com 80 estações de trabalho, salas privativas, estúdio de podcast e área de convivência com cozinha compartilhada.', 'Corporativo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600566753190-17f0baa2a6c3'||P, 0), (pp, B||'1564078516393-cf04bd966897'||P, 1), (pp, B||'1571091718767-18b5b1457add'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid9, 'Fachada Ativa Rua XV', 'Projeto de retrofit de edifício comercial com fachada ativa no térreo. Integração dos usos da rua com o interior e criação de praça de convivência pública.', 'Comercial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600210492486-724fe5c67fb0'||P, 0), (pp, B||'1533779183-a4d2afe7ffe3'||P, 1), (pp, B||'1416331108676-a22ccb276e35'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid10, 'Residência Neoclássica Pomerode', 'Casa 420m² com referências à arquitetura germânica reinterpretada. Jardim formal, pérgola e adegas vinícola integrada ao projeto.', 'Residencial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600585154340-be6161a56a0c'||P, 0), (pp, B||'1596522354895-6bda26e96893'||P, 1), (pp, B||'1570129477492-45c003edd2be'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid10, 'Praça do Imigrante', 'Projeto de revitalização de praça pública 2.000m² em Pomerode. Preservação das árvores centenárias, novo mobiliário urbano e espaço para eventos culturais.', 'Paisagismo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1600585154363-67eb9e2e2099'||P, 0), (pp, B||'1558618666-fcd25c85cd64'||P, 1), (pp, B||'1600585154526-990dced4db0d'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria)
VALUES (eid10, 'Sede Associação Comercial', 'Sede institucional 800m² para associação comercial regional. Auditório 200 lugares, salões de reunião, área expositiva e espaço gastronômico.', 'Corporativo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES
  (pp, B||'1564078516393-cf04bd966897'||P, 0), (pp, B||'1502672260266-1c1ef2d93688'||P, 1), (pp, B||'1600607687939-ce8a6f349abc'||P, 2);

-- ── Escritórios 11-20 ────────────────────────────────────────
INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid11, 'Casa de Praia Guabiruba', 'Residência 220m² a 800m do mar. Acabamentos com madeira de demolição, cores terrosas e ventilação natural cruzada maximizada.', 'Residencial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600585154340-be6161a56a0c'||P, 0), (pp, B||'1600047509807-ba8f99d2cdde'||P, 1), (pp, B||'1596522354895-6bda26e96893'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid11, 'Spa Urbano Brusque', 'Centro de bem-estar 300m² com tratamentos estéticos e terapêuticos. Circuito de água, sauna, salas de massagem e espaço de meditação.', 'Comercial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600607687939-ce8a6f349abc'||P, 0), (pp, B||'1560448204-444da2e9ddc3'||P, 1), (pp, B||'1505691938895-1758d7feb511'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid11, 'Apartamento Garden Brusque', 'Apartamento 180m² com jardim privativo de 120m². Integração entre a área íntima e o jardim com piscina rasa para crianças e espaço gourmet.', 'Interiores') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600566753376-12c8ab7fb75b'||P, 0), (pp, B||'1600585154363-67eb9e2e2099'||P, 1), (pp, B||'1558618666-fcd25c85cd64'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid12, 'Fábrica Têxtil Gaspar', 'Ampliação industrial 4.000m² com modernização de layout produtivo. Melhoria das condições de trabalho, ventilação industrial e áreas de descanso para colaboradores.', 'Corporativo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1571091718767-18b5b1457add'||P, 0), (pp, B||'1533779183-a4d2afe7ffe3'||P, 1), (pp, B||'1600210492486-724fe5c67fb0'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid12, 'Centro Logístico Vale', 'Galpão logístico 6.000m² com escritório integrado, doca com 8 portas, área de triagem e vestiários. Certificação de qualidade ISO 9001.', 'Corporativo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600566753190-17f0baa2a6c3'||P, 0), (pp, B||'1416331108676-a22ccb276e35'||P, 1), (pp, B||'1570129477492-45c003edd2be'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid12, 'Showroom Automóveis Gaspar', 'Concessionária 1.200m² com exposição para 25 veículos, escritório de vendas, oficina e área de entrega de veículos com iluminação especial.', 'Comercial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1564078516393-cf04bd966897'||P, 0), (pp, B||'1502672260266-1c1ef2d93688'||P, 1), (pp, B||'1600596542815-ffad4c1539a9'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid13, 'Residência Contemporânea Rio do Sul', 'Casa 300m² em terreno de 1.500m² com vista panorâmica para a Serra. Piscina com deck, churrasqueira integrada e automação completa.', 'Residencial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1596522354895-6bda26e96893'||P, 0), (pp, B||'1600585154526-990dced4db0d'||P, 1), (pp, B||'1600573472550-8090b5e0745e'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid13, 'Consultório Médico Rio do Sul', 'Clínica multiespecialidade 350m² com 8 consultórios, sala de espera humanizada, receção e farmácia interna. Projeto acessível e acolhedor.', 'Corporativo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600607687939-ce8a6f349abc'||P, 0), (pp, B||'1558618666-fcd25c85cd64'||P, 1), (pp, B||'1505691938895-1758d7feb511'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid13, 'Hotel Pousada Serra Catarinense', 'Pousada 18 quartos com café colonial incluso. Projeto de integração com a paisagem da Serra, materiais locais e conforto contemporâneo.', 'Comercial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1416331108676-a22ccb276e35'||P, 0), (pp, B||'1560448204-444da2e9ddc3'||P, 1), (pp, B||'1533779183-a4d2afe7ffe3'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid14, 'Campus Industrial Jaraguá', 'Campus corporativo 8.000m² com três edifícios interligados. Área de P&D, centro de treinamento, restaurante corporativo e área de lazer.', 'Corporativo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1571091718767-18b5b1457add'||P, 0), (pp, B||'1600210492486-724fe5c67fb0'||P, 1), (pp, B||'1564078516393-cf04bd966897'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid14, 'Escritório Corporativo Moderno', 'Retrofit de escritório 600m² para empresa de engenharia. Planta livre, sala de projetos com mesa técnica integrada, biblioteca e auditório 80 lugares.', 'Corporativo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600566753190-17f0baa2a6c3'||P, 0), (pp, B||'1502672260266-1c1ef2d93688'||P, 1), (pp, B||'1416331108676-a22ccb276e35'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid14, 'Centro de Inovação Jaraguá', 'Hub de inovação 1.000m² para incubação de startups. Espaços flexíveis, laboratório maker, sala de prototipagem e área de pitch.', 'Corporativo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1533779183-a4d2afe7ffe3'||P, 0), (pp, B||'1570129477492-45c003edd2be'||P, 1), (pp, B||'1558618666-fcd25c85cd64'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid15, 'Penthouse Balneário Camboriú', 'Cobertura triplex 400m² com 3 suítes, home theater, adega e rooftop com jacuzzi e vista 360° para o mar e a Pedra do Baú.', 'Residencial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1596522354895-6bda26e96893'||P, 0), (pp, B||'1600585154363-67eb9e2e2099'||P, 1), (pp, B||'1600047509807-ba8f99d2cdde'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid15, 'Apartamento Orla Balneário', 'Apartamento 180m² na Avenida Brasil com vista para o mar. Reforma completa com materiais importados, automação e cozinha gourmet equipada.', 'Interiores') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600607687939-ce8a6f349abc'||P, 0), (pp, B||'1600596542815-ffad4c1539a9'||P, 1), (pp, B||'1560448204-444da2e9ddc3'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid15, 'Clínica Estética Premium', 'Clínica de estética 250m² com identidade visual sofisticada. Ambientes que transmitem luxo e bem-estar através de acabamentos em mármore, iluminação indireta e design de mobiliário exclusivo.', 'Comercial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1502672260266-1c1ef2d93688'||P, 0), (pp, B||'1505691938895-1758d7feb511'||P, 1), (pp, B||'1558618666-fcd25c85cd64'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid16, 'Casa Minimalista Blumenau', 'Residência 240m² com conceito minimalista rigoroso. Paleta monocromática, mobiliário de design, jardim de pedras e reflexos d''água no acesso principal.', 'Residencial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600585154340-be6161a56a0c'||P, 0), (pp, B||'1600585154526-990dced4db0d'||P, 1), (pp, B||'1570129477492-45c003edd2be'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid16, 'Retrofit Edifício Histórico', 'Revitalização de edifício dos anos 1960 no centro de Blumenau. Modernização completa das instalações mantendo a fachada histórica tombada pelo município.', 'Corporativo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1416331108676-a22ccb276e35'||P, 0), (pp, B||'1533779183-a4d2afe7ffe3'||P, 1), (pp, B||'1600210492486-724fe5c67fb0'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid16, 'Cozinha Gourmet Show', 'Projeto de cozinha gourmet integrada 40m² para espaço de eventos culinários. Ilha central, forno a lenha, adega climatizada e bancadas em mármore Carrara.', 'Interiores') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600596542815-ffad4c1539a9'||P, 0), (pp, B||'1556028888-0c54de1c1b66'||P, 1), (pp, B||'1600573472550-8090b5e0745e'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid17, 'Duplex Contemporâneo Indaial', 'Duplex 200m² com escada de vidro estrutural, mezanino aberto e pé-direito duplo de 5,4m. Acabamentos em concreto, madeira e vidro.', 'Interiores') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600607687939-ce8a6f349abc'||P, 0), (pp, B||'1558618666-fcd25c85cd64'||P, 1), (pp, B||'1505691938895-1758d7feb511'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid17, 'Home Office de Luxo', 'Conversão de quarto em home office 20m² com biblioteca integrada, iluminação técnica para videoconferências e isolamento acústico completo.', 'Interiores') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600566753190-17f0baa2a6c3'||P, 0), (pp, B||'1560448204-444da2e9ddc3'||P, 1), (pp, B||'1600573472550-8090b5e0745e'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid17, 'Residência Térrea Indaial', 'Casa térrea de 280m² com layout de convivência ampliado. Sala de 60m² integrada, cozinha gourmet, suíte master com closet e banheiro spa.', 'Residencial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600585154340-be6161a56a0c'||P, 0), (pp, B||'1596522354895-6bda26e96893'||P, 1), (pp, B||'1600047509807-ba8f99d2cdde'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid18, 'Sítio Paisagismo Integrado', 'Paisagismo de sítio 5.000m² com lago artificial, horta biodinâmica, pomar de frutas nativas e trilha ecológica com pórticos de bambu.', 'Paisagismo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600585154363-67eb9e2e2099'||P, 0), (pp, B||'1570129477492-45c003edd2be'||P, 1), (pp, B||'1533779183-a4d2afe7ffe3'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid18, 'Jardim Zen Timbó', 'Jardim zen 800m² para residência de alto padrão. Espelho d''água com kois, bambus, canteiros de pedra japonesa e iluminação noturna cênica.', 'Paisagismo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600585154526-990dced4db0d'||P, 0), (pp, B||'1596522354895-6bda26e96893'||P, 1), (pp, B||'1558618666-fcd25c85cd64'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid18, 'Residência Rural Contemporânea', 'Casa de campo 350m² que integra produção rural e moradia. Galinheiro decorativo, horta integrada à cozinha e garage para maquinário agrícola.', 'Residencial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600585154340-be6161a56a0c'||P, 0), (pp, B||'1416331108676-a22ccb276e35'||P, 1), (pp, B||'1570129477492-45c003edd2be'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid19, 'Loja de Moda Sustentável', 'Boutique 120m² para marca de moda consciente. Uso de materiais reciclados, exposição de materiais "vivos" como musgo e bambu, e visual merchandise integrado ao projeto.', 'Comercial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600566753376-12c8ab7fb75b'||P, 0), (pp, B||'1556028888-0c54de1c1b66'||P, 1), (pp, B||'1502672260266-1c1ef2d93688'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid19, 'Café e Coworking Blumenau', 'Espaço híbrido 200m² que funciona como café de dia e coworking noturno. Mobiliário flexível, área privativa por cubículos acústicos e estação de podcasting.', 'Comercial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1505691938895-1758d7feb511'||P, 0), (pp, B||'1600607687939-ce8a6f349abc'||P, 1), (pp, B||'1564078516393-cf04bd966897'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid19, 'Studio Fotográfico e Criativo', 'Estúdio fotográfico 150m² com 3 cicloramas, área de maquiagem, sala de edição e espaço para produções audiovisuais. Iluminação técnica profissional.', 'Comercial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600566753190-17f0baa2a6c3'||P, 0), (pp, B||'1558618666-fcd25c85cd64'||P, 1), (pp, B||'1560448204-444da2e9ddc3'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid20, 'Rooftop Garden Blumenau', 'Jardim de cobertura 400m² em edifício residencial. Área de convivência com pergolado, horta comunitária, churrasqueira e panorama de 360° da cidade.', 'Paisagismo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600585154363-67eb9e2e2099'||P, 0), (pp, B||'1596522354895-6bda26e96893'||P, 1), (pp, B||'1570129477492-45c003edd2be'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid20, 'Residência com Jardim Nativo', 'Casa 290m² com paisagismo usando exclusivamente espécies nativas do bioma Mata Atlântica. Certificação ambiental e monitoramento de biodiversidade.', 'Residencial') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1600585154340-be6161a56a0c'||P, 0), (pp, B||'1533779183-a4d2afe7ffe3'||P, 1), (pp, B||'1558618666-fcd25c85cd64'||P, 2);

INSERT INTO public.projetos_portfolio (escritorio_id, nome, descricao, categoria) VALUES (eid20, 'Parque Urbano Bela Vista', 'Projeto de parque urbano 3.000m² em área de APP recuperada. Trilha permeável, anfiteatro ao ar livre, playground inclusivo e jardim de borboletas.', 'Paisagismo') RETURNING id INTO pp;
INSERT INTO public.portfolio_imagens (projeto_portfolio_id, url, ordem) VALUES (pp, B||'1416331108676-a22ccb276e35'||P, 0), (pp, B||'1600585154363-67eb9e2e2099'||P, 1), (pp, B||'1570129477492-45c003edd2be'||P, 2);

-- ══════════════════════════════════════════════════════════════
-- USUÁRIOS FORNECEDORES
-- ══════════════════════════════════════════════════════════════
fuid1  := public.criar_usuario_ficticio('teste_fornecedor_1@arc-test.local',  'Marcenaria Tischler',        'fornecedor');
fuid2  := public.criar_usuario_ficticio('teste_fornecedor_2@arc-test.local',  'Volthaus Elétrica',          'fornecedor');
fuid3  := public.criar_usuario_ficticio('teste_fornecedor_3@arc-test.local',  'Kristall Vidraçaria',        'fornecedor');
fuid4  := public.criar_usuario_ficticio('teste_fornecedor_4@arc-test.local',  'Weiss Gesseiro',             'fornecedor');
fuid5  := public.criar_usuario_ficticio('teste_fornecedor_5@arc-test.local',  'Farbhaus Tintas',            'fornecedor');
fuid6  := public.criar_usuario_ficticio('teste_fornecedor_6@arc-test.local',  'Lumina Iluminação',          'fornecedor');
fuid7  := public.criar_usuario_ficticio('teste_fornecedor_7@arc-test.local',  'HidroVale Instalações',      'fornecedor');
fuid8  := public.criar_usuario_ficticio('teste_fornecedor_8@arc-test.local',  'Böden Pisos e Revestimentos','fornecedor');
fuid9  := public.criar_usuario_ficticio('teste_fornecedor_9@arc-test.local',  'Vorhang Cortinas',           'fornecedor');
fuid10 := public.criar_usuario_ficticio('teste_fornecedor_10@arc-test.local', 'Stilvoll Decoração',         'fornecedor');

INSERT INTO public.fornecedores (user_id, nome, segmento, cidade, bio, instagram, whatsapp, image_url, cover_url, slug) VALUES
(fuid1,  'Marcenaria Tischler',         'Marcenaria', 'Blumenau',
  'Marcenaria artesanal de alta qualidade há mais de 20 anos. Especializados em móveis planejados, armários embutidos e cozinhas sob medida para projetos de alto padrão. Parceiros de escritórios de arquitetura em toda a região.',
  '@marcenaria.tischler', '(47) 99210-4856',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Tischler',
  B||'1556028888-0c54de1c1b66'||C, 'marcenaria-tischler'),
(fuid2,  'Volthaus Elétrica',           'Elétrica',   'Blumenau',
  'Instalações elétricas residenciais e comerciais com padrão de excelência. Equipe certificada CREA-SC. Especialistas em automação residencial, iluminação técnica e quadros elétricos para projetos de alto padrão.',
  '@volthaus.eletrica', '(47) 99321-7643',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Volthaus',
  B||'1600566753376-12c8ab7fb75b'||C, 'volthaus-eletrica'),
(fuid3,  'Kristall Vidraçaria',         'Vidraçaria', 'Pomerode',
  'Vidros temperados, laminados e insulados para projetos arquitetônicos. Fachadas estruturais, divisórias, escadas e corrimãos em vidro. Instalação por equipe técnica especializada com garantia de 10 anos.',
  '@kristall.vidracaria', '(47) 99432-1980',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Kristall',
  B||'1600210492486-724fe5c67fb0'||C, 'kristall-vidracaria'),
(fuid4,  'Weiss Gesseiro',              'Gesseiro',   'Gaspar',
  'Gesseiro especializado em sancas, rebaixamentos de teto e molduras decorativas. Trabalhos em gesso acartonado e drywall. Parceiros de confiança de escritórios de arquitetura da região há 15 anos.',
  '@weiss.gesseiro', '(47) 99543-5317',
  'https://api.dicebear.com/7.x/shapes/svg?seed=WeissGess',
  B||'1600607687939-ce8a6f349abc'||C, 'weiss-gesseiro'),
(fuid5,  'Farbhaus Tintas',             'Pintura',    'Blumenau',
  'Pinturas residenciais e comerciais com produtos premium. Aplicação de texturas especiais, grafiato, marmorato e pintura artística. Garantia estendida para tintura externa. Certificado pelas principais marcas do mercado.',
  '@farbhaus.pintura', '(47) 99654-8762',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Farbhaus',
  B||'1600585154526-990dced4db0d'||C, 'farbhaus-tintas'),
(fuid6,  'Lumina Iluminação',           'Iluminação', 'Itajaí',
  'Projetos e instalação de iluminação técnica e decorativa. Trabalhamos com as principais marcas nacionais e importadas. Consultoria especializada para projetos arquitetônicos de todos os portes.',
  '@lumina.iluminacao', '(47) 99765-2095',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Lumina',
  B||'1600566753190-17f0baa2a6c3'||C, 'lumina-iluminacao'),
(fuid7,  'HidroVale Instalações',       'Hidráulica', 'Indaial',
  'Instalações hidráulicas em toda a região do Vale do Itajaí. Especialistas em reaproveitamento de água pluvial, aquecimento solar, sistemas de filtragem e projetos compatíveis com arquitetura bioclimática.',
  '@hidrovale.instalacoes', '(47) 99876-3428',
  'https://api.dicebear.com/7.x/shapes/svg?seed=HidroVale',
  B||'1600047509807-ba8f99d2cdde'||C, 'hidrovale-instalacoes'),
(fuid8,  'Böden Pisos e Revestimentos', 'Pisos',      'Timbó',
  'Fornecimento e instalação de pisos em madeira, porcelanato, cerâmica e vinílico. Parceiros homologados das principais fabricantes nacionais. Equipe especializada em grandes obras e projetos comerciais.',
  '@boden.pisos', '(47) 99987-6751',
  'https://api.dicebear.com/7.x/shapes/svg?seed=BodenPisos',
  B||'1600596542815-ffad4c1539a9'||C, 'boden-pisos-e-revestimentos'),
(fuid9,  'Vorhang Cortinas',            'Cortinas',   'Blumenau',
  'Cortinas, persianas e painéis japoneses sob medida para projetos residenciais e comerciais. Tecidos importados e nacionais. Automatização de cortinas para projetos de domótica. Instalação incluída.',
  '@vorhang.cortinas', '(47) 99098-9084',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Vorhang',
  B||'1560448204-444da2e9ddc3'||C, 'vorhang-cortinas'),
(fuid10, 'Stilvoll Decoração',          'Decoração',  'Jaraguá do Sul',
  'Decoração e objetos de design para ambientes residenciais e corporativos. Parceiros de grandes escritórios de arquitetura do Sul do Brasil. Showroom de 500m² com tendências nacionais e importadas.',
  '@stilvoll.decoracao', '(47) 99109-2317',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Stilvoll',
  B||'1564078516393-cf04bd966897'||C, 'stilvoll-decoracao');

-- Captura IDs dos fornecedores
SELECT id INTO fid1  FROM public.fornecedores WHERE user_id = fuid1;
SELECT id INTO fid2  FROM public.fornecedores WHERE user_id = fuid2;
SELECT id INTO fid3  FROM public.fornecedores WHERE user_id = fuid3;
SELECT id INTO fid4  FROM public.fornecedores WHERE user_id = fuid4;
SELECT id INTO fid5  FROM public.fornecedores WHERE user_id = fuid5;
SELECT id INTO fid6  FROM public.fornecedores WHERE user_id = fuid6;
SELECT id INTO fid7  FROM public.fornecedores WHERE user_id = fuid7;
SELECT id INTO fid8  FROM public.fornecedores WHERE user_id = fuid8;
SELECT id INTO fid9  FROM public.fornecedores WHERE user_id = fuid9;
SELECT id INTO fid10 FROM public.fornecedores WHERE user_id = fuid10;

-- ══════════════════════════════════════════════════════════════
-- PRODUTOS DOS FORNECEDORES (5-7 por fornecedor com imagens)
-- ══════════════════════════════════════════════════════════════

-- Marcenaria Tischler
INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES (fid1, 'Cozinha Planejada Carvalho Europeu', 'Cozinha completa em carvalho europeu com tampo em quartzito. Ferragens Blum Servo-Drive, iluminação integrada LED e sistema de organização interno modular. Prazo 35 dias.', 'produto') RETURNING id INTO prod;
INSERT INTO public.fornecedor_produto_imagens (produto_id, url, ordem) VALUES (prod, B||'1600596542815-ffad4c1539a9'||S, 0), (prod, B||'1556028888-0c54de1c1b66'||S, 1);

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES (fid1, 'Armário Casal com Espelho', 'Armário de casal 2,60m com espelho corpo inteiro embutido. Gavetas telescópicas, cabideiro duplo e prateleiras reguláveis. Disponível em laca branco neve ou grafite.', 'produto') RETURNING id INTO prod;
INSERT INTO public.fornecedor_produto_imagens (produto_id, url, ordem) VALUES (prod, B||'1600573472550-8090b5e0745e'||S, 0), (prod, B||'1560448204-444da2e9ddc3'||S, 1);

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES (fid1, 'Home Office Executivo', 'Mesa em L com gaveteiro volante, painel ripado em madeira e prateleiras flutuantes integradas. Acabamento em madeira teca e aço escovado. Configurável conforme espaço.', 'produto') RETURNING id INTO prod;
INSERT INTO public.fornecedor_produto_imagens (produto_id, url, ordem) VALUES (prod, B||'1600566753190-17f0baa2a6c3'||S, 0), (prod, B||'1505691938895-1758d7feb511'||S, 1);

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES (fid1, 'Lareira Embutida com Marcenaria', 'Marcenaria de lareira a etanol com painel ripado em carvalho, nichos e TV embutida. Projeto personalizado conforme a parede disponível.', 'produto') RETURNING id INTO prod;
INSERT INTO public.fornecedor_produto_imagens (produto_id, url, ordem) VALUES (prod, B||'1564078516393-cf04bd966897'||S, 0), (prod, B||'1502672260266-1c1ef2d93688'||S, 1);

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES (fid1, 'Bancada de Banheiro sob Medida', 'Bancada de banheiro em MDF revestido com tampo em porcelanato ou quartzo. Gavetas push-to-open e cuba esculpida integrada. Execução em 15 dias úteis.', 'produto') RETURNING id INTO prod;
INSERT INTO public.fornecedor_produto_imagens (produto_id, url, ordem) VALUES (prod, B||'1600047509807-ba8f99d2cdde'||S, 0), (prod, B||'1558618666-fcd25c85cd64'||S, 1);

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES (fid1, 'Serviço de Projeto e Orçamento', 'Elaboração de projeto de marcenaria completo com visita técnica, renderização 3D e orçamento detalhado. Serviço gratuito para projetos com valor mínimo de R$ 15.000.', 'serviço') RETURNING id INTO prod;
INSERT INTO public.fornecedor_produto_imagens (produto_id, url, ordem) VALUES (prod, B||'1600607687939-ce8a6f349abc'||S, 0));

-- Volthaus Elétrica
INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES (fid2, 'Instalação Elétrica Residencial Completa', 'Projeto e execução de instalação elétrica residencial. Inclui quadro de distribuição bifásico/trifásico, circuitos independentes por cômodo, tomadas USB e pontos para ar-condicionado.', 'serviço') RETURNING id INTO prod;
INSERT INTO public.fornecedor_produto_imagens (produto_id, url, ordem) VALUES (prod, B||'1600566753376-12c8ab7fb75b'||S, 0));

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES (fid2, 'Sistema de Automação Residencial', 'Automação completa para iluminação, persianas, climatização e segurança. Compatível com Alexa, Google Home e Apple HomeKit. Controle por aplicativo ou voz. Instalação em 2 dias.', 'serviço') RETURNING id INTO prod;
INSERT INTO public.fornecedor_produto_imagens (produto_id, url, ordem) VALUES (prod, B||'1600566753190-17f0baa2a6c3'||S, 0), (prod, B||'1505691938895-1758d7feb511'||S, 1);

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES (fid2, 'Projeto de Iluminação Técnica', 'Projeto luminotécnico com cálculos de iluminância, posicionamento de luminárias e especificação de equipamentos. Entrega com memorial descritivo e compatibilização com projeto de arquitetura.', 'serviço') RETURNING id INTO prod;
INSERT INTO public.fornecedor_produto_imagens (produto_id, url, ordem) VALUES (prod, B||'1600607687939-ce8a6f349abc'||S, 0));

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES (fid2, 'SPDA — Para-raios', 'Sistema de proteção contra descargas atmosféricas para residências e pequenos comerciais. Certificado ABNT NBR 5419. Laudo técnico com ART do engenheiro responsável.', 'serviço') RETURNING id INTO prod;
INSERT INTO public.fornecedor_produto_imagens (produto_id, url, ordem) VALUES (prod, B||'1571091718767-18b5b1457add'||S, 0));

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES (fid2, 'Carregador Veículo Elétrico (EVSE)', 'Fornecimento e instalação de carregador para veículo elétrico Wall Box 7,4kW ou 22kW. Compatível com todos os modelos disponíveis no Brasil. Com ou sem gestão de energia.', 'produto') RETURNING id INTO prod;
INSERT INTO public.fornecedor_produto_imagens (produto_id, url, ordem) VALUES (prod, B||'1533779183-a4d2afe7ffe3'||S, 0));

-- Kristall Vidraçaria
INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES (fid3, 'Box de Banheiro Vidro Temperado 10mm', 'Box de banheiro em vidro temperado 10mm com perfis em alumínio fosco ou dourado. Hinge com abertura 180°. Corte sob medida. Garantia 5 anos. Instalação incluída.', 'produto') RETURNING id INTO prod;
INSERT INTO public.fornecedor_produto_imagens (produto_id, url, ordem) VALUES (prod, B||'1600047509807-ba8f99d2cdde'||S, 0), (prod, B||'1558618666-fcd25c85cd64'||S, 1);

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES (fid3, 'Fachada em Vidro Estrutural', 'Sistema de fachada em vidro laminado 8+8mm com fixadores pontuais em aço inox. Projeto, fabricação e instalação. Garantia de estanqueidade de 10 anos.', 'produto') RETURNING id INTO prod;
INSERT INTO public.fornecedor_produto_imagens (produto_id, url, ordem) VALUES (prod, B||'1600210492486-724fe5c67fb0'||S, 0), (prod, B||'1571091718767-18b5b1457add'||S, 1);

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES (fid3, 'Divisória de Vidro para Escritório', 'Divisórias modulares em vidro temperado 12mm com perfis em alumínio. Sistema desmontável para reconfigurações futuras. Opção: vidro jateado ou laminado com película.', 'produto') RETURNING id INTO prod;
INSERT INTO public.fornecedor_produto_imagens (produto_id, url, ordem) VALUES (prod, B||'1600566753190-17f0baa2a6c3'||S, 0), (prod, B||'1502672260266-1c1ef2d93688'||S, 1);

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES (fid3, 'Espelho Decorativo Bisotado', 'Espelhos com borda bisotada em diversas dimensões para banheiros, halls de entrada e closets. Fixação invisível com cola de silicone neutro. Corte em formatos especiais a pedido.', 'produto') RETURNING id INTO prod;
INSERT INTO public.fornecedor_produto_imagens (produto_id, url, ordem) VALUES (prod, B||'1560448204-444da2e9ddc3'||S, 0));

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES (fid3, 'Escada em Vidro Estrutural', 'Escada com degraus em vidro temperado laminado 10+10mm e guarda-corpo em vidro sem perfil. Projeto estrutural incluso. Ícone de design para residências de alto padrão.', 'produto') RETURNING id INTO prod;
INSERT INTO public.fornecedor_produto_imagens (produto_id, url, ordem) VALUES (prod, B||'1505691938895-1758d7feb511'||S, 0), (prod, B||'1564078516393-cf04bd966897'||S, 1);

-- Fornecedores 4-10 com produtos simplificados
INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES
  (fid4, 'Sanca de Gesso com LED Embutido', 'Sanca em gesso com canaleta para fita LED. Iluminação indireta contínua, acabamento impecável. Execução para qualquer formato de ambiente.', 'serviço'),
  (fid4, 'Rebaixamento de Teto em Gesso', 'Rebaixamento de teto em drywall com ponto de luz central e spots embutidos. Forro reto ou com recuos. Instalação rápida com mínimo de sujeira.', 'serviço'),
  (fid4, 'Moldura Decorativa em Gesso', 'Molduras ornamentais em gesso para parede e teto. Estilo clássico, art déco ou moderno. Fabricação sob encomenda conforme projeto do arquiteto.', 'produto'),
  (fid4, 'Painel 3D em Gesso', 'Painel decorativo 3D em gesso para parede de destaque. 40+ modelos disponíveis ou criação exclusiva. Pintura inclusa na cor de sua preferência.', 'produto'),
  (fid4, 'Boiserie em Gesso', 'Revestimento de parede com boiserie em gesso. Estilo clássico contemporâneo muito utilizado em suítes e salas de jantar de alto padrão.', 'produto');

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES
  (fid5, 'Pintura Textura Pedra Areíl', 'Aplicação de textura imitando pedra natural para paredes internas e externas. Alta resistência à umidade e intempéries. Disponível em 12 tonalidades.', 'serviço'),
  (fid5, 'Pintura Marmorato Veneziano', 'Técnica especial de pintura decorativa que reproduz o mármore com acabamento polido e brilhante. Ideal para banheiros, banheiras e áreas de luxo.', 'serviço'),
  (fid5, 'Pintura Epóxi para Garagem', 'Revestimento epóxi de alto tráfego para pisos de garagem, depósitos e áreas técnicas. Disponível em diversas cores. Resistente a manchas de óleo e produtos químicos.', 'serviço'),
  (fid5, 'Pintura Grafite Artística', 'Arte urbana e grafite decorativo para ambientes internos e externos. Parceria com artistas locais. Projetos personalizados conforme temática desejada.', 'serviço'),
  (fid5, 'Impermeabilização de Lajes e Terraços', 'Impermeabilização com manta asfáltica ou elastômero para coberturas, terraços e balcões. Garantia de 10 anos. Laudo técnico incluso.', 'serviço');

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES
  (fid6, 'Projeto Luminotécnico Completo', 'Projeto de iluminação técnica com análise fotométrica, renderização 3D e memorial descritivo. Compatibilizado com projeto de arquitetura e de instalações elétricas.', 'serviço'),
  (fid6, 'Luminária Pendente Articulada', 'Luminária pendente em metal com braço articulável. Compatível com lâmpadas E27 até 25W. Acabamento em preto fosco, dourado ou cromado. Certificado INMETRO.', 'produto'),
  (fid6, 'Sistema Trilho Eletrificado', 'Trilho eletrificado com spots ajustáveis para destacar obras de arte, mobiliário ou pontos específicos. Ideal para galerias, escritórios e residências contemporâneas.', 'produto'),
  (fid6, 'Fita LED de Alta Potência', 'Fita LED 220V de alta potência (2400lm/m) para iluminação técnica indireta. Não precisa de fonte externa. Corte a cada 10cm. IP65 para ambientes úmidos.', 'produto'),
  (fid6, 'Automação de Iluminação Cenas', 'Programação de cenas de iluminação via aplicativo ou painel touchscreen. Até 32 cenas por ambiente. Integração com sistema de automação residencial existente.', 'serviço');

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES
  (fid7, 'Instalação Hidráulica Residencial', 'Instalação hidrossanitária completa para residências. Tubulação PVC ou PPR conforme necessidade. Ramal externo, ramais internos, pontos de água fria e quente.', 'serviço'),
  (fid7, 'Sistema de Aquecimento Solar', 'Projeto e instalação de aquecimento solar de água com painéis de alta eficiência e reservatório térmico. Retorno do investimento em 3 a 5 anos.', 'serviço'),
  (fid7, 'Reaproveitamento de Água Pluvial', 'Sistema de captação, filtração e reuso de água da chuva para irrigação, descarga e limpeza. Redução de até 40% no consumo de água potável.', 'serviço'),
  (fid7, 'Piscina — Projeto e Execução', 'Projeto e construção de piscinas de concreto armado de qualquer formato. Acabamento em cerâmica, porcelanato ou vinil. Inclui sistema de filtragem e automação.', 'serviço'),
  (fid7, 'Aquecedor de Piscina Bomba de Calor', 'Fornecimento e instalação de bomba de calor para aquecimento de piscina. Eficiência de 500%. Operação silenciosa e controle digital de temperatura.', 'produto');

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES
  (fid8, 'Porcelanato Grande Formato 120×240', 'Porcelanato retificado 120×240cm com efeito mármore, madeira ou cimento. Ideal para ambientes integrados sem rejuntes visíveis. Disponível em 8 modelos.', 'produto'),
  (fid8, 'Piso de Madeira Maciça Cumaru', 'Piso de madeira maciça em Cumaru (Angelim) 70×15cm. Madeira de reflorestamento certificado FSC. Instalação com cola elástica MS. Acabamento com óleo natural.', 'produto'),
  (fid8, 'Vinílico Clic Premium', 'Piso vinílico clic SPC 5mm + 2mm manta com efeito madeira ou pedra. Impermeável, antiestático e higiênico. Instalação rápida sem cola. Garantia 15 anos.', 'produto'),
  (fid8, 'Ladrilho Hidráulico Artesanal', 'Ladrilho hidráulico artesanal produzido por ateliê local. Mais de 200 padrões disponíveis ou criação exclusiva. Ideal para cozinhas, banheiros e halls.', 'produto'),
  (fid8, 'Instalação e Nivelamento', 'Serviço de preparação de contrapiso, nivelamento a laser e instalação de revestimentos com argamassa colante de alta performance. Equipe especializada em grandes obras.', 'serviço');

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES
  (fid9, 'Cortina Blackout com Motor', 'Cortina em tecido blackout 100% com motor silencioso. Controle por aplicativo, controle remoto ou voz (Alexa/Google). Instalação inclusa. Múltiplas cores disponíveis.', 'produto'),
  (fid9, 'Persiana Doubleface Linho', 'Persiana rolo doubleface com tecido linho na face externa e blackout na face interna. Controle de luz e privacidade independentes. Fabricação sob medida.', 'produto'),
  (fid9, 'Painel Japonês para Varanda', 'Painéis japoneses em tecido tergal ou linho para divisão de ambientes e varandas. Sistema de sobreposição que permite privacidade total ou parcial.', 'produto'),
  (fid9, 'Cortina Wave em Voil Importado', 'Cortina wave em voil francês com ondas perfeitas. Efeito cinematográfico que valoriza pé-direito alto. Varão em alumínio dourado ou preto. Sob medida.', 'produto'),
  (fid9, 'Automação de Cortinas e Persianas', 'Motorização e automação de cortinas e persianas já instaladas ou novas. Integração com sistemas Somfy, Lutron ou solução própria. Programação horária inclusa.', 'serviço');

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES
  (fid10, 'Consultoria de Decoração', 'Visita técnica, análise do espaço e apresentação de conceito de decoração completo com moodboard, paleta de cores e seleção de produtos. Cobrado por hora.', 'serviço'),
  (fid10, 'Tapete Persa Importado', 'Tapetes persas e orientais artesanais de lã e seda. Autênticos ou reproduções de alta qualidade. Certificado de origem e procedência. Entrega em todo o Brasil.', 'produto'),
  (fid10, 'Escultura e Arte Contemporânea', 'Curadoria e fornecimento de esculturas, pinturas e instalações de artistas catarinenses. Obras exclusivas para projetos residenciais e corporativos de alto padrão.', 'produto'),
  (fid10, 'Objetos de Decoração Premium', 'Vasos, jarros, porta-retratos, objetos escultóricos e artigos de mesa em materiais nobres. Coleção exclusiva com peças importadas da Europa e Ásia.', 'produto'),
  (fid10, 'Paisagismo Interior e Plantas', 'Projeto e instalação de jardins internos, paredes verdes e composições com plantas exóticas. Manutenção mensal disponível para jardins corporativos.', 'serviço');

-- ══════════════════════════════════════════════════════════════
-- CLIENTES
-- ══════════════════════════════════════════════════════════════
cuid1 := public.criar_usuario_ficticio('teste_cliente_1@arc-test.local', 'Carlos Eduardo Souza',  'cliente');
cuid2 := public.criar_usuario_ficticio('teste_cliente_2@arc-test.local', 'Mariana Ferreira Lima', 'cliente');
cuid3 := public.criar_usuario_ficticio('teste_cliente_3@arc-test.local', 'Roberto Alves Santos',  'cliente');
cuid4 := public.criar_usuario_ficticio('teste_cliente_4@arc-test.local', 'Ana Paula Oliveira',    'cliente');
cuid5 := public.criar_usuario_ficticio('teste_cliente_5@arc-test.local', 'Fernando Costa',        'cliente');

UPDATE public.users SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || replace(nome, ' ', '') WHERE id IN (cuid1, cuid2, cuid3, cuid4, cuid5);

-- ══════════════════════════════════════════════════════════════
-- CONVERSAS E MENSAGENS
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.conversas (arquiteto_id, participante_id, tipo, fornecedor_id)
VALUES (uid1, fuid1, 'fornecedor', fid1) RETURNING id INTO conv;
INSERT INTO public.mensagens (conversa_id, remetente_id, texto, lida) VALUES
  (conv, uid1,  'Olá, gostaria de um orçamento para cozinha planejada em MDF com tampo de quartzito. Área de 12m².',                         true),
  (conv, fuid1, 'Olá Carlos! Claro, posso te ajudar. Você tem o projeto do arquiteto com as medidas? Precisaria de um levantamento no local.',true),
  (conv, uid1,  'Tenho sim, vou encaminhar o PDF do projeto. A entrega precisa ser para março de 2025.',                                      true),
  (conv, fuid1, 'Perfeito. Recebemos o projeto e vamos preparar o orçamento detalhado. Prazo para envio: 3 dias úteis.',                       false);

INSERT INTO public.conversas (arquiteto_id, participante_id, tipo, fornecedor_id)
VALUES (uid3, fuid3, 'fornecedor', fid3) RETURNING id INTO conv;
INSERT INTO public.mensagens (conversa_id, remetente_id, texto, lida) VALUES
  (conv, uid3,  'Bom dia! Preciso de orçamento para fachada em vidro laminado. Área total de 80m². Projeto em anexo.',                        true),
  (conv, fuid3, 'Bom dia Luís! Recebi o projeto. Vou analisar e retorno em breve com o orçamento. Posso visitar a obra essa semana?',          true),
  (conv, uid3,  'Pode ser quinta-feira à tarde, por volta das 14h. O endereço é Rua XV de Novembro, 340, Gaspar.',                             true),
  (conv, fuid3, 'Confirmado! Estaremos na quinta às 14h. Nossa equipe técnica vai fazer o levantamento completo para o orçamento.',             false);

INSERT INTO public.conversas (arquiteto_id, participante_id, tipo, fornecedor_id)
VALUES (uid5, fuid6, 'fornecedor', fid6) RETURNING id INTO conv;
INSERT INTO public.mensagens (conversa_id, remetente_id, texto, lida) VALUES
  (conv, uid5,  'Olá Lumina! Preciso de um projeto luminotécnico para residência 260m². Arquitetura contemporânea com pé-direito duplo na sala.',true),
  (conv, fuid6, 'Olá Rodrigo! Adoramos esse tipo de projeto. Quais são os pontos principais: sala principal, cozinha e quartos?',               true),
  (conv, uid5,  'Sim, e também a varanda gourmet que tem 40m². O cliente quer iluminação cênica para destacar a piscina à noite.',              false),
  (conv, fuid6, 'Ótimo! Faremos o levantamento fotométrico completo. Custo do projeto: R$ 3.500. Prazo: 10 dias úteis.',                        false);

-- ══════════════════════════════════════════════════════════════
-- ORÇAMENTOS
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.orcamentos (fornecedor_id, arquiteto_id, mensagem, status) VALUES
  (fid1, uid2, 'Preciso de orçamento para cozinha planejada em carvalho para projeto em Pomerode. Cliente quer entrega em 45 dias. Área de 14m².', 'pendente'),
  (fid2, uid4, 'Instalação elétrica completa para residência de 320m² em Blumenau. Inclui automação de iluminação, persianas e ar-condicionado.',  'em_analise'),
  (fid3, uid1, 'Fachada de vidro laminado 60m² para edifício comercial no centro de Blumenau. Entrega prevista para junho de 2025.',               'respondido'),
  (fid5, uid7, 'Pintura completa de apartamento 180m² em Itajaí. Paredes internas e fachada externa. Cliente quer textura na sala e quartos.',     'aprovado'),
  (fid8, uid9, 'Fornecimento e instalação de porcelanato 120×240 para projeto de 400m² comercial em Blumenau. Necessidade de 600m² de material.',   'concluido');

END $$;
