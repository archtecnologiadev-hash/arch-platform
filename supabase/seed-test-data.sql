-- =============================================================
-- ARC Platform — Dados de Teste
-- 20 arquitetos, 10 fornecedores, 5 clientes — região Vale do Itajaí
-- Para remover: SELECT public.remover_dados_teste();
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Função: criar_usuario_ficticio
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.criar_usuario_ficticio(
  p_email text,
  p_nome  text,
  p_tipo  text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  novo_id uuid;
BEGIN
  novo_id := gen_random_uuid();

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    aud, role, raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    novo_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt('senha123', gen_salt('bf')),
    now(), now(), now(),
    'authenticated', 'authenticated',
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
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Função: remover_dados_teste
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.remover_dados_teste()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  uid             uuid;
  count_removidos integer := 0;
BEGIN
  FOR uid IN
    SELECT id FROM auth.users WHERE email LIKE '%@arc-test.local'
  LOOP
    DELETE FROM auth.users WHERE id = uid;
    count_removidos := count_removidos + 1;
  END LOOP;
  RETURN 'Removidos ' || count_removidos || ' usuários de teste';
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- View de credenciais (painel admin)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.dados_teste_view AS
SELECT
  u.id,
  u.nome,
  u.email,
  u.tipo,
  'senha123'::text AS senha_padrao,
  u.created_at
FROM public.users u
WHERE u.email LIKE '%@arc-test.local'
ORDER BY u.tipo, u.nome;

GRANT SELECT ON public.dados_teste_view TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- Inserção de dados fictícios
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  uid1  uuid; uid2  uuid; uid3  uuid; uid4  uuid; uid5  uuid;
  uid6  uuid; uid7  uuid; uid8  uuid; uid9  uuid; uid10 uuid;
  uid11 uuid; uid12 uuid; uid13 uuid; uid14 uuid; uid15 uuid;
  uid16 uuid; uid17 uuid; uid18 uuid; uid19 uuid; uid20 uuid;
  eid1  uuid; eid2  uuid; eid3  uuid; eid4  uuid; eid5  uuid;
  fuid1 uuid; fuid2 uuid; fuid3 uuid; fuid4 uuid; fuid5 uuid;
  fuid6 uuid; fuid7 uuid; fuid8 uuid; fuid9 uuid; fuid10 uuid;
  fid1  uuid; fid2  uuid; fid3  uuid;
  cuid1 uuid; cuid2 uuid; cuid3 uuid; cuid4 uuid; cuid5 uuid;
BEGIN

-- ── Usuários arquitetos ──────────────────────────────────────────────────────
uid1  := public.criar_usuario_ficticio('teste_escritorio_1@arc-test.local',  'Carlos Schmitt',       'arquiteto');
uid2  := public.criar_usuario_ficticio('teste_escritorio_2@arc-test.local',  'Ana Bäumer',           'arquiteto');
uid3  := public.criar_usuario_ficticio('teste_escritorio_3@arc-test.local',  'Luís Ritter',          'arquiteto');
uid4  := public.criar_usuario_ficticio('teste_escritorio_4@arc-test.local',  'Fernanda Müller',      'arquiteto');
uid5  := public.criar_usuario_ficticio('teste_escritorio_5@arc-test.local',  'Rodrigo Alves',        'arquiteto');
uid6  := public.criar_usuario_ficticio('teste_escritorio_6@arc-test.local',  'Heinrich Fischer',     'arquiteto');
uid7  := public.criar_usuario_ficticio('teste_escritorio_7@arc-test.local',  'Beatriz Cunha',        'arquiteto');
uid8  := public.criar_usuario_ficticio('teste_escritorio_8@arc-test.local',  'Paulo Hoffmann',       'arquiteto');
uid9  := public.criar_usuario_ficticio('teste_escritorio_9@arc-test.local',  'Marina Torres',        'arquiteto');
uid10 := public.criar_usuario_ficticio('teste_escritorio_10@arc-test.local', 'Gerhardt Neumann',     'arquiteto');
uid11 := public.criar_usuario_ficticio('teste_escritorio_11@arc-test.local', 'Camila Santos',        'arquiteto');
uid12 := public.criar_usuario_ficticio('teste_escritorio_12@arc-test.local', 'Klaus Weber',          'arquiteto');
uid13 := public.criar_usuario_ficticio('teste_escritorio_13@arc-test.local', 'Paulo Melo',           'arquiteto');
uid14 := public.criar_usuario_ficticio('teste_escritorio_14@arc-test.local', 'Sandra Klein',         'arquiteto');
uid15 := public.criar_usuario_ficticio('teste_escritorio_15@arc-test.local', 'Rafael Oliveira',      'arquiteto');
uid16 := public.criar_usuario_ficticio('teste_escritorio_16@arc-test.local', 'Thomas Becker',        'arquiteto');
uid17 := public.criar_usuario_ficticio('teste_escritorio_17@arc-test.local', 'Aline Bremer',         'arquiteto');
uid18 := public.criar_usuario_ficticio('teste_escritorio_18@arc-test.local', 'Otto Schulz',          'arquiteto');
uid19 := public.criar_usuario_ficticio('teste_escritorio_19@arc-test.local', 'Vera Wittmann',        'arquiteto');
uid20 := public.criar_usuario_ficticio('teste_escritorio_20@arc-test.local', 'Heiko Krause',         'arquiteto');

-- ── Escritórios ──────────────────────────────────────────────────────────────
INSERT INTO public.escritorios
  (user_id, nome, nome_responsavel, cidade, estado, telefone, instagram, bio, especialidades, image_url, cover_url, slug)
VALUES
(uid1,  'Schmitt & Corrêa Arquitetura',   'Carlos Schmitt',    'Blumenau',           'SC', '(47) 99201-3847', '@schmitt.arquitetura',
  'Escritório com 12 anos de experiência em projetos residenciais de alto padrão. Especializados em soluções que integram o estilo europeu com a arquitetura contemporânea brasileira. Atuamos em toda a região do Vale do Itajaí.',
  ARRAY['Residencial','Interiores'],
  'https://api.dicebear.com/7.x/initials/svg?seed=SchmittCorrea',
  'https://picsum.photos/seed/schmittcorrea/800/400',
  'schmitt-correa-arquitetura'),
(uid2,  'Atelier Bäumer Design',          'Ana Bäumer',        'Pomerode',           'SC', '(47) 99342-5610', '@atelie.baumer',
  'Design de interiores e arquitetura com influência da herança alemã de Pomerode. Criamos ambientes únicos que contam histórias. Mais de 200 projetos entregues na região.',
  ARRAY['Interiores','Comercial'],
  'https://api.dicebear.com/7.x/initials/svg?seed=AtelierBaumer',
  'https://picsum.photos/seed/baumerdesign/800/400',
  'atelier-baumer-design'),
(uid3,  'Ritter Projetos Arquitetônicos', 'Luís Ritter',       'Gaspar',             'SC', '(47) 99455-7823', '@ritter.projetos',
  'Especialistas em arquitetura residencial e corporativa para Gaspar e municípios vizinhos. Projetos sustentáveis com foco em eficiência energética e conforto térmico.',
  ARRAY['Residencial','Corporativo'],
  'https://api.dicebear.com/7.x/initials/svg?seed=RitterProjetos',
  'https://picsum.photos/seed/ritterprojetos/800/400',
  'ritter-projetos-arquitetonicos'),
(uid4,  'Müller Arquitetura Sustentável', 'Fernanda Müller',   'Blumenau',           'SC', '(47) 99567-2190', '@muller.sustentavel',
  'Arquitetura bioclimática e paisagismo integrado. Desenvolvemos projetos que respeitam o meio ambiente e valorizam o bem-estar dos moradores. Certificação LEED para projetos comerciais.',
  ARRAY['Residencial','Paisagismo'],
  'https://api.dicebear.com/7.x/initials/svg?seed=MullerSust',
  'https://picsum.photos/seed/mullersust/800/400',
  'muller-arquitetura-sustentavel'),
(uid5,  'Atelier Vale do Itajaí',         'Rodrigo Alves',     'Indaial',            'SC', '(47) 99618-4532', '@atelie.vale',
  'Escritório de arquitetura e design de interiores com foco em projetos residenciais modernos. Atendemos clientes em toda a região do Vale do Itajaí com projetos personalizados e dentro do prazo.',
  ARRAY['Residencial','Interiores'],
  'https://api.dicebear.com/7.x/initials/svg?seed=AtelierVale',
  'https://picsum.photos/seed/ateliervale/800/400',
  'atelier-vale-do-itajai'),
(uid6,  'Fischer & Krauss Arquitetura',   'Heinrich Fischer',  'Blumenau',           'SC', '(47) 99723-8901', '@fischer.krauss',
  'Reconhecidos pela excelência em projetos corporativos e comerciais em Blumenau. Nossa equipe multidisciplinar entrega soluções completas, do projeto executivo ao acompanhamento de obra.',
  ARRAY['Corporativo','Comercial'],
  'https://api.dicebear.com/7.x/initials/svg?seed=FischerKrauss',
  'https://picsum.photos/seed/fischerkrauss/800/400',
  'fischer-krauss-arquitetura'),
(uid7,  'Estúdio Itajaí Contemporâneo',  'Beatriz Cunha',     'Itajaí',             'SC', '(47) 99834-6274', '@studio.itajai',
  'Design de interiores e arquitetura residencial em Itajaí e região portuária. Projetos que valorizam a vista para o mar e o lifestyle costeiro catarinense.',
  ARRAY['Interiores','Residencial'],
  'https://api.dicebear.com/7.x/initials/svg?seed=EstudioItajai',
  'https://picsum.photos/seed/estudioitajai/800/400',
  'estudio-itajai-contemporaneo'),
(uid8,  'Hoffmann Arquitetura Criativa',  'Paulo Hoffmann',    'Timbó',              'SC', '(47) 99945-1837', '@hoffmann.arq',
  'Arquitetura residencial e design de interiores com identidade única. Combinamos criatividade e funcionalidade para criar espaços que inspiram. Atendimento personalizado desde a concepção até a entrega.',
  ARRAY['Residencial','Interiores'],
  'https://api.dicebear.com/7.x/initials/svg?seed=HoffmannArq',
  'https://picsum.photos/seed/hoffmannarq/800/400',
  'hoffmann-arquitetura-criativa'),
(uid9,  'Estúdio Formas Urbanas',         'Marina Torres',     'Blumenau',           'SC', '(47) 99012-5493', '@formas.urbanas',
  'Especialistas em arquitetura comercial e projetos de uso misto em ambiente urbano. Desenvolvemos conceitos que transformam espaços em experiências memoráveis para clientes e usuários.',
  ARRAY['Comercial','Corporativo'],
  'https://api.dicebear.com/7.x/initials/svg?seed=FormasUrbanas',
  'https://picsum.photos/seed/formasurbanas/800/400',
  'estudio-formas-urbanas'),
(uid10, 'Neumann Arquitetura e Urbanismo','Gerhardt Neumann',  'Pomerode',           'SC', '(47) 99156-7802', '@neumann.urbanismo',
  'Projetos residenciais e de urbanismo com forte influência do modernismo europeu. Diferencial na integração entre arquitetura, paisagismo e planejamento urbano para projetos de todos os portes.',
  ARRAY['Residencial','Paisagismo'],
  'https://api.dicebear.com/7.x/initials/svg?seed=NeumannUrb',
  'https://picsum.photos/seed/neumannurb/800/400',
  'neumann-arquitetura-e-urbanismo'),
(uid11, 'Atelier Sul Design',             'Camila Santos',     'Brusque',            'SC', '(47) 99267-9341', '@atelie.suldesign',
  'Design de interiores residencial e comercial em Brusque e região. Nossa equipe cria ambientes sofisticados com atenção a cada detalhe, refletindo a personalidade e o estilo de vida de cada cliente.',
  ARRAY['Interiores','Residencial'],
  'https://api.dicebear.com/7.x/initials/svg?seed=AtelierSul',
  'https://picsum.photos/seed/ateliersul/800/400',
  'atelier-sul-design'),
(uid12, 'Weber & Associados Arquitetura', 'Klaus Weber',       'Gaspar',             'SC', '(47) 99378-2658', '@weber.associados',
  'Consultoria e projetos de arquitetura corporativa e comercial. Atendemos empresas de todos os setores com projetos que maximizam a funcionalidade do espaço sem abrir mão da estética.',
  ARRAY['Corporativo','Comercial'],
  'https://api.dicebear.com/7.x/initials/svg?seed=WeberAssoc',
  'https://picsum.photos/seed/weberassoc/800/400',
  'weber-associados-arquitetura'),
(uid13, 'Estúdio Rio do Sul Design',     'Paulo Melo',        'Rio do Sul',         'SC', '(47) 99489-3917', '@riodesul.design',
  'Escritório de arquitetura e design com presença consolidada em Rio do Sul e toda a região Oeste do Vale. Projetos residenciais, comerciais e de interiores com foco em qualidade e inovação.',
  ARRAY['Residencial','Interiores'],
  'https://api.dicebear.com/7.x/initials/svg?seed=RioSulDesign',
  'https://picsum.photos/seed/riosuldesign/800/400',
  'estudio-rio-do-sul-design'),
(uid14, 'Klein Arquitetura Corporativa',  'Sandra Klein',      'Jaraguá do Sul',     'SC', '(47) 99590-4206', '@klein.corporativo',
  'Líderes em projetos corporativos e industriais na região de Jaraguá do Sul. Experiência em plantas industriais e escritórios nos posiciona como referência para grandes empresas catarinenses.',
  ARRAY['Corporativo','Comercial'],
  'https://api.dicebear.com/7.x/initials/svg?seed=KleinArq',
  'https://picsum.photos/seed/kleinarq/800/400',
  'klein-arquitetura-corporativa'),
(uid15, 'Atelier Balneário Projetos',     'Rafael Oliveira',   'Balneário Camboriú', 'SC', '(47) 99601-8745', '@atelie.balneario',
  'Arquitetura residencial de alto padrão em Balneário Camboriú. Apartamentos, coberturas e casas de praia são nossa especialidade. Projetos que valorizam a vista para o mar e o lifestyle litorâneo.',
  ARRAY['Residencial','Interiores'],
  'https://api.dicebear.com/7.x/initials/svg?seed=AtelierBalneario',
  'https://picsum.photos/seed/atelierbal/800/400',
  'atelier-balneario-projetos'),
(uid16, 'Becker Arquitetura Contemporânea','Thomas Becker',    'Blumenau',           'SC', '(47) 99712-5184', '@becker.contemporaneo',
  'Arquitetura e design com identidade contemporânea para projetos residenciais e corporativos. Base em Blumenau, atendendo toda Santa Catarina com projetos que equilibram forma e função.',
  ARRAY['Residencial','Corporativo'],
  'https://api.dicebear.com/7.x/initials/svg?seed=BeckerContemp',
  'https://picsum.photos/seed/beckercontemp/800/400',
  'becker-arquitetura-contemporanea'),
(uid17, 'Estúdio Bremer & Figueiredo',   'Aline Bremer',      'Indaial',            'SC', '(47) 99823-6473', '@bremer.figueiredo',
  'Design de interiores residencial em Indaial e região. Criamos ambientes que traduzem a personalidade dos clientes com elegância e funcionalidade. Especialistas em reforma e decoração de interiores.',
  ARRAY['Interiores','Residencial'],
  'https://api.dicebear.com/7.x/initials/svg?seed=BremerFig',
  'https://picsum.photos/seed/bremerfig/800/400',
  'estudio-bremer-e-figueiredo'),
(uid18, 'Schulz Projetos e Espaços',     'Otto Schulz',       'Timbó',              'SC', '(47) 99934-7862', '@schulz.projetos',
  'Projetos residenciais e paisagismo integrado em Timbó e região. Acreditamos que um bom projeto respeita o entorno natural e cria harmonia entre o construído e o verde.',
  ARRAY['Residencial','Paisagismo'],
  'https://api.dicebear.com/7.x/initials/svg?seed=SchulzProj',
  'https://picsum.photos/seed/schulzproj/800/400',
  'schulz-projetos-e-espacos'),
(uid19, 'Atelier Wittmann Design',       'Vera Wittmann',     'Blumenau',           'SC', '(47) 99045-9151', '@wittmann.design',
  'Design de interiores e arquitetura comercial em Blumenau. Transformamos espaços comerciais em ambientes que potencializam os negócios com projetos estratégicos e esteticamente impecáveis.',
  ARRAY['Interiores','Comercial'],
  'https://api.dicebear.com/7.x/initials/svg?seed=WittmannDesign',
  'https://picsum.photos/seed/wittmanndesign/800/400',
  'atelier-wittmann-design'),
(uid20, 'Krause Arquitetura e Paisagismo','Heiko Krause',      'Blumenau',           'SC', '(47) 99156-0420', '@krause.paisagismo',
  'Paisagismo e arquitetura residencial com olhar sensível para o meio ambiente. Integramos jardins e áreas verdes aos projetos criando residências que dialogam com a natureza do Vale.',
  ARRAY['Paisagismo','Residencial'],
  'https://api.dicebear.com/7.x/initials/svg?seed=KrausePais',
  'https://picsum.photos/seed/krausepais/800/400',
  'krause-arquitetura-e-paisagismo');

-- ── Projetos (5 primeiros escritórios) ───────────────────────────────────────
SELECT id INTO eid1 FROM public.escritorios WHERE user_id = uid1;
SELECT id INTO eid2 FROM public.escritorios WHERE user_id = uid2;
SELECT id INTO eid3 FROM public.escritorios WHERE user_id = uid3;
SELECT id INTO eid4 FROM public.escritorios WHERE user_id = uid4;
SELECT id INTO eid5 FROM public.escritorios WHERE user_id = uid5;

INSERT INTO public.projetos (escritorio_id, nome, tipo, descricao) VALUES
  (eid1, 'Residência Vale do Rio',      'residencial', 'Casa de 280m² com integração entre área interna e jardim. Projeto minimalista com grandes painéis de vidro e materiais naturais.'),
  (eid1, 'Apartamento Centro Blumenau', 'residencial', 'Reforma completa de apartamento 140m² com conceito open space, cozinha integrada e home office.'),
  (eid2, 'Loft Contemporâneo Pomerode', 'interiores',  'Design de interiores de loft 85m² com referências à arquitetura europeia e móveis sob medida em carvalho natural.'),
  (eid3, 'Centro Empresarial Gaspar',   'corporativo', 'Projeto de escritório corporativo 400m² para empresa de tecnologia. Espaços colaborativos e salas de reunião flexíveis.'),
  (eid4, 'Casa Bioclimática Blumenau',  'residencial', 'Residência 320m² com telhado verde, painéis solares e aproveitamento de água pluvial. Projeto certificado LEED.'),
  (eid5, 'Residência Indaial Valley',   'residencial', 'Casa térrea 260m² em condomínio fechado. Integração total entre sala, cozinha e varanda gourmet.');

-- ── Usuários fornecedores ─────────────────────────────────────────────────────
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

-- ── Perfis fornecedores ───────────────────────────────────────────────────────
INSERT INTO public.fornecedores
  (user_id, nome, segmento, cidade, bio, instagram, whatsapp, image_url, cover_url, slug)
VALUES
(fuid1,  'Marcenaria Tischler',         'Marcenaria', 'Blumenau',
  'Marcenaria artesanal de alta qualidade em Blumenau. Mais de 20 anos criando móveis sob medida para arquitetos e designers de interiores. Especialistas em madeiras nobres, MDF e painéis de alta densidade.',
  '@marcenaria.tischler', '(47) 99210-4856',
  'https://api.dicebear.com/7.x/initials/svg?seed=Tischler',
  'https://picsum.photos/seed/tischler/800/400',
  'marcenaria-tischler'),
(fuid2,  'Volthaus Elétrica',           'Elétrica',   'Blumenau',
  'Instalações elétricas residenciais e comerciais com padrão de excelência. Equipe certificada pelo CREA-SC. Atendemos projetos de automação residencial e iluminação técnica.',
  '@volthaus.eletrica', '(47) 99321-7643',
  'https://api.dicebear.com/7.x/initials/svg?seed=Volthaus',
  'https://picsum.photos/seed/volthaus/800/400',
  'volthaus-eletrica'),
(fuid3,  'Kristall Vidraçaria',         'Vidraçaria', 'Pomerode',
  'Vidros temperados, laminados e insulados para projetos arquitetônicos de alto padrão. Fachadas, divisórias, escadas de vidro e corrimãos. Instalação especializada com equipe técnica treinada.',
  '@kristall.vidracaria', '(47) 99432-1980',
  'https://api.dicebear.com/7.x/initials/svg?seed=Kristall',
  'https://picsum.photos/seed/kristall/800/400',
  'kristall-vidracaria'),
(fuid4,  'Weiss Gesseiro',              'Gesseiro',   'Gaspar',
  'Gesseiro especializado em sancas, rebaixamentos de teto e molduras decorativas. Trabalhos em gesso acartonado e drywall. Parceiros de confiança de escritórios de arquitetura da região há 15 anos.',
  '@weiss.gesseiro', '(47) 99543-5317',
  'https://api.dicebear.com/7.x/initials/svg?seed=WeissGess',
  'https://picsum.photos/seed/weissgess/800/400',
  'weiss-gesseiro'),
(fuid5,  'Farbhaus Tintas',             'Pintura',    'Blumenau',
  'Pinturas residenciais e comerciais com produtos premium. Aplicação de texturas, grafiato, marmorato e pintura artística. Garantia de 5 anos para tintura externa. Empresa certificada pelas principais marcas do mercado.',
  '@farbhaus.pintura', '(47) 99654-8762',
  'https://api.dicebear.com/7.x/initials/svg?seed=Farbhaus',
  'https://picsum.photos/seed/farbhaus/800/400',
  'farbhaus-tintas'),
(fuid6,  'Lumina Iluminação',           'Iluminação', 'Itajaí',
  'Projetos e instalação de iluminação técnica e decorativa para ambientes residenciais e comerciais. Trabalhamos com as principais marcas nacionais e importadas. Consultoria gratuita para projetos arquitetônicos.',
  '@lumina.iluminacao', '(47) 99765-2095',
  'https://api.dicebear.com/7.x/initials/svg?seed=Lumina',
  'https://picsum.photos/seed/luminailum/800/400',
  'lumina-iluminacao'),
(fuid7,  'HidroVale Instalações',       'Hidráulica', 'Indaial',
  'Instalações hidráulicas residenciais e comerciais em toda a região do Vale do Itajaí. Reaproveitamento de água pluvial, aquecimento solar e sistemas de filtragem. Projetos compatíveis com arquitetura bioclimática.',
  '@hidrovale.instalacoes', '(47) 99876-3428',
  'https://api.dicebear.com/7.x/initials/svg?seed=HidroVale',
  'https://picsum.photos/seed/hidrovale/800/400',
  'hidrovale-instalacoes'),
(fuid8,  'Böden Pisos e Revestimentos', 'Pisos',      'Timbó',
  'Fornecimento e instalação de pisos de madeira, cerâmica, porcelanato e vinílico. Parceiros homologados das maiores fabricantes nacionais. Atendemos todo o Vale do Itajaí com equipe especializada em grandes obras.',
  '@boden.pisos', '(47) 99987-6751',
  'https://api.dicebear.com/7.x/initials/svg?seed=BodenPisos',
  'https://picsum.photos/seed/bodenpisos/800/400',
  'boden-pisos-e-revestimentos'),
(fuid9,  'Vorhang Cortinas',            'Cortinas',   'Blumenau',
  'Cortinas, persianas e painéis japoneses sob medida para projetos residenciais e comerciais. Tecidos importados e nacionais. Automatização de cortinas para projetos de automação residencial. Instalação incluída.',
  '@vorhang.cortinas', '(47) 99098-9084',
  'https://api.dicebear.com/7.x/initials/svg?seed=Vorhang',
  'https://picsum.photos/seed/vorhangcort/800/400',
  'vorhang-cortinas'),
(fuid10, 'Stilvoll Decoração',          'Decoração',  'Jaraguá do Sul',
  'Decoração e objetos de design para ambientes residenciais e corporativos. Parceiros de grandes escritórios da região Sul do Brasil. Showroom de 500m² com as principais tendências de decoração nacional e importada.',
  '@stilvoll.decoracao', '(47) 99109-2317',
  'https://api.dicebear.com/7.x/initials/svg?seed=Stilvoll',
  'https://picsum.photos/seed/stilvoll/800/400',
  'stilvoll-decoracao');

-- ── Produtos no catálogo (3 fornecedores) ────────────────────────────────────
SELECT id INTO fid1 FROM public.fornecedores WHERE user_id = fuid1;
SELECT id INTO fid2 FROM public.fornecedores WHERE user_id = fuid2;
SELECT id INTO fid3 FROM public.fornecedores WHERE user_id = fuid3;

INSERT INTO public.fornecedor_produtos (fornecedor_id, nome, descricao, tipo) VALUES
  (fid1, 'Armário Sob Medida Carvalho',  'Armário com acabamento em carvalho natural, portas deslizantes com trilhos alemães. Disponível em diversas configurações internas.', 'produto'),
  (fid1, 'Cozinha Planejada Premium',    'Cozinha completa em MDF 18mm com tampo em granito ou silestone. Ferragens Blum. Prazo de entrega 30 dias.', 'produto'),
  (fid1, 'Home Office Modulado',         'Sistema modular para home office com gaveteiro, prateleiras e espaço para monitor. Acabamento em laca fosca ou brilho.', 'produto'),
  (fid2, 'Instalação Elétrica Completa', 'Projeto e instalação elétrica residencial. Inclui quadro de distribuição, tomadas, interruptores e pontos de iluminação.', 'serviço'),
  (fid2, 'Automação Residencial',        'Sistema de automação para iluminação, persianas e climatização. Compatível com Amazon Alexa e Google Home. Instalação em 2 dias.', 'serviço'),
  (fid3, 'Vidro Temperado 10mm',         'Vidro temperado 10mm para box de banheiro, divisórias e escadas. Certificado pelo INMETRO. Corte sob medida.', 'produto'),
  (fid3, 'Fachada em Vidro Laminado',    'Fachada estrutural em vidro laminado 8+8mm. Projeto e instalação inclusos. Garantia de 10 anos contra delaminação.', 'produto');

-- ── Clientes ─────────────────────────────────────────────────────────────────
cuid1 := public.criar_usuario_ficticio('teste_cliente_1@arc-test.local', 'Carlos Eduardo Souza',  'cliente');
cuid2 := public.criar_usuario_ficticio('teste_cliente_2@arc-test.local', 'Mariana Ferreira Lima', 'cliente');
cuid3 := public.criar_usuario_ficticio('teste_cliente_3@arc-test.local', 'Roberto Alves Santos',  'cliente');
cuid4 := public.criar_usuario_ficticio('teste_cliente_4@arc-test.local', 'Ana Paula Oliveira',    'cliente');
cuid5 := public.criar_usuario_ficticio('teste_cliente_5@arc-test.local', 'Fernando Costa',        'cliente');

UPDATE public.users SET avatar_url = 'https://api.dicebear.com/7.x/initials/svg?seed=' || replace(nome, ' ', '') WHERE id IN (cuid1, cuid2, cuid3, cuid4, cuid5);

END $$;
