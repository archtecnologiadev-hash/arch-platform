-- ─── PR 2: Catálogo de fabricantes + tipo_componente ──────────────────────────

-- Catálogo global de componentes (não escopado por escritório)
CREATE TABLE IF NOT EXISTS public.catalogo_fabricantes (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome            text NOT NULL,
  categoria       text NOT NULL,       -- 'hidraulica','eletro','moveis','marcenaria','iluminacao','esquadria','decoracao','eletronico'
  palavras_chave  text[] NOT NULL,     -- match por substring case-insensitive
  tipo_componente text NOT NULL,       -- slug único do tipo
  fabricante      text,
  regras_default  jsonb,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalogo_categoria  ON public.catalogo_fabricantes(categoria);
CREATE INDEX IF NOT EXISTS idx_catalogo_tipo       ON public.catalogo_fabricantes(tipo_componente);

-- Qualquer usuário autenticado pode ler o catálogo (é global)
ALTER TABLE public.catalogo_fabricantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalogo_read_all" ON public.catalogo_fabricantes FOR SELECT USING (auth.role() = 'authenticated');

-- Nova coluna tipo_componente nos componentes
ALTER TABLE public.detalhamento_componentes
  ADD COLUMN IF NOT EXISTS tipo_componente text;

-- up_axis para saber qual plano é o chão (Y_UP ou Z_UP)
ALTER TABLE public.detalhamento_projetos
  ADD COLUMN IF NOT EXISTS up_axis text DEFAULT 'Y_UP';

-- ─── Seed — 90+ entradas ──────────────────────────────────────────────────────

INSERT INTO public.catalogo_fabricantes (nome, categoria, palavras_chave, tipo_componente, fabricante) VALUES

-- Hidráulica / Louças sanitárias
('Vaso sanitário Deca',        'hidraulica', ARRAY['vaso','sanitario','deca','bacia'],          'vaso_sanitario',  'Deca'),
('Vaso sanitário Roca',        'hidraulica', ARRAY['vaso','roca','gap','ona'],                  'vaso_sanitario',  'Roca'),
('Vaso sanitário Incepa',      'hidraulica', ARRAY['vaso','incepa'],                            'vaso_sanitario',  'Incepa'),
('Vaso sanitário Celite',      'hidraulica', ARRAY['vaso','celite'],                            'vaso_sanitario',  'Celite'),
('Vaso sanitário Hydra',       'hidraulica', ARRAY['vaso','hydra'],                             'vaso_sanitario',  'Hydra'),
('Vaso sanitário genérico',    'hidraulica', ARRAY['vaso','toilet','wc'],                       'vaso_sanitario',  null),
('Cuba cozinha Deca',          'hidraulica', ARRAY['cuba','cozinha','deca'],                    'cuba_cozinha',    'Deca'),
('Cuba cozinha Franke',        'hidraulica', ARRAY['cuba','franke'],                            'cuba_cozinha',    'Franke'),
('Cuba cozinha genérica',      'hidraulica', ARRAY['cuba','sink','pia_cozinha'],                'cuba_cozinha',    null),
('Lavatório banheiro Deca',    'hidraulica', ARRAY['lavatório','lavatorio','deca'],             'cuba_banheiro',   'Deca'),
('Lavatório banheiro Roca',    'hidraulica', ARRAY['lavatório','lavatorio','roca'],             'cuba_banheiro',   'Roca'),
('Cuba banheiro genérica',     'hidraulica', ARRAY['cuba','banheiro','lavatório','lavatorio'],  'cuba_banheiro',   null),
('Tanque Deca',                'hidraulica', ARRAY['tanque','deca'],                            'tanque',          'Deca'),
('Tanque genérico',            'hidraulica', ARRAY['tanque','laundry'],                         'tanque',          null),
('Ducha higiênica Docol',      'hidraulica', ARRAY['ducha','docol'],                            'ducha_higienica', 'Docol'),
('Ducha higiênica Lorenzetti', 'hidraulica', ARRAY['ducha','lorenzetti'],                       'ducha_higienica', 'Lorenzetti'),
('Chuveiro Lorenzetti',        'hidraulica', ARRAY['chuveiro','lorenzetti','acqua'],            'chuveiro',        'Lorenzetti'),
('Chuveiro Hydra',             'hidraulica', ARRAY['chuveiro','hydra','banho'],                 'chuveiro',        'Hydra'),
('Chuveiro genérico',          'hidraulica', ARRAY['chuveiro','shower'],                        'chuveiro',        null),
('Torneira cozinha Deca',      'hidraulica', ARRAY['torneira','cozinha','deca'],                'torneira_cozinha','Deca'),
('Torneira Docol',             'hidraulica', ARRAY['torneira','docol','monocomando'],           'torneira',        'Docol'),
('Torneira genérica',          'hidraulica', ARRAY['torneira','faucet','tap','bica'],           'torneira',        null),
('Ralo linear Tigre',          'hidraulica', ARRAY['ralo','tigre','linear'],                    'ralo',            'Tigre'),
('Ralo genérico',              'hidraulica', ARRAY['ralo','drain'],                             'ralo',            null),
('Banheira',                   'hidraulica', ARRAY['banheira','bathtub','jacuzzi','ofuro'],     'banheira',        null),
('Box banheiro',               'hidraulica', ARRAY['box','cabine','shower_door'],               'box',             null),
('Pia / Cuba genérica',        'hidraulica', ARRAY['pia','sink'],                               'cuba_cozinha',    null),

-- Eletrodomésticos
('Geladeira Brastemp',         'eletro', ARRAY['geladeira','brastemp','frost','quite'],         'geladeira',    'Brastemp'),
('Geladeira Electrolux',       'eletro', ARRAY['geladeira','electrolux','inverse'],             'geladeira',    'Electrolux'),
('Geladeira Consul',           'eletro', ARRAY['geladeira','consul','bem','cvg'],               'geladeira',    'Consul'),
('Geladeira Samsung',          'eletro', ARRAY['geladeira','samsung','french'],                 'geladeira',    'Samsung'),
('Geladeira LG',               'eletro', ARRAY['geladeira','lg','gc'],                          'geladeira',    'LG'),
('Geladeira genérica',         'eletro', ARRAY['geladeira','refrigerador','refrigerator','fridge'], 'geladeira', null),
('Lava-louças Brastemp',       'eletro', ARRAY['lava-loucas','lava_loucas','brastemp','dishwasher'], 'lava_loucas', 'Brastemp'),
('Lava-louças Electrolux',     'eletro', ARRAY['lava-loucas','lava_loucas','electrolux'],       'lava_loucas',  'Electrolux'),
('Lava-louças genérica',       'eletro', ARRAY['lava_loucas','lava-loucas','dishwasher'],       'lava_loucas',  null),
('Lava-seca Electrolux',       'eletro', ARRAY['lava-seca','lava_seca','electrolux'],           'lava_seca',    'Electrolux'),
('Lava-seca Brastemp',         'eletro', ARRAY['lava-seca','lava_seca','brastemp'],             'lava_seca',    'Brastemp'),
('Máquina de lavar',           'eletro', ARRAY['maquina','lavadora','washing_machine','lavar'], 'lava_seca',    null),
('Micro-ondas Electrolux',     'eletro', ARRAY['microondas','micro-ondas','electrolux'],        'microondas',   'Electrolux'),
('Micro-ondas Brastemp',       'eletro', ARRAY['microondas','micro-ondas','brastemp'],          'microondas',   'Brastemp'),
('Micro-ondas genérico',       'eletro', ARRAY['microondas','micro-ondas','microwave'],         'microondas',   null),
('Forno Electrolux',           'eletro', ARRAY['forno','electrolux','eo'],                      'forno',        'Electrolux'),
('Forno Fischer',              'eletro', ARRAY['forno','fischer'],                              'forno',        'Fischer'),
('Forno genérico',             'eletro', ARRAY['forno','oven'],                                 'forno',        null),
('Fogão Brastemp',             'eletro', ARRAY['fogao','fogão','brastemp','mensageiro'],        'fogao',        'Brastemp'),
('Fogão Electrolux',           'eletro', ARRAY['fogao','fogão','electrolux'],                   'fogao',        'Electrolux'),
('Fogão genérico',             'eletro', ARRAY['fogao','fogão','cooker','stove'],               'fogao',        null),
('Cooktop Electrolux',         'eletro', ARRAY['cooktop','electrolux'],                         'cooktop',      'Electrolux'),
('Cooktop Bosch',              'eletro', ARRAY['cooktop','bosch'],                              'cooktop',      'Bosch'),
('Cooktop genérico',           'eletro', ARRAY['cooktop','cook_top'],                           'cooktop',      null),
('Coifa Electrolux',           'eletro', ARRAY['coifa','electrolux','depurador'],               'coifa',        'Electrolux'),
('Coifa Bosch',                'eletro', ARRAY['coifa','bosch'],                                'coifa',        'Bosch'),
('Coifa Fischer',              'eletro', ARRAY['coifa','depurador','fischer'],                  'coifa',        'Fischer'),
('Coifa genérica',             'eletro', ARRAY['coifa','range_hood','hood','depurador'],        'coifa',        null),

-- Eletrônicos
('TV Samsung',            'eletronico', ARRAY['tv','samsung','qled','neo','frame'],      'tv', 'Samsung'),
('TV LG',                 'eletronico', ARRAY['tv','lg','oled','nanocell'],              'tv', 'LG'),
('TV Sony',               'eletronico', ARRAY['tv','sony','bravia'],                    'tv', 'Sony'),
('TV Philco',             'eletronico', ARRAY['tv','philco','smart'],                   'tv', 'Philco'),
('TV genérica',           'eletronico', ARRAY['televisao','televisão','television'],    'tv', null),
('Monitor Dell',          'eletronico', ARRAY['monitor','dell','ultrasharp'],           'monitor', 'Dell'),
('Monitor LG',            'eletronico', ARRAY['monitor','lg'],                          'monitor', 'LG'),
('Monitor genérico',      'eletronico', ARRAY['monitor','screen','display'],            'monitor', null),
('Computador',            'eletronico', ARRAY['computador','desktop','cpu','torre','pc'], 'computador', null),
('Impressora',            'eletronico', ARRAY['impressora','printer','hp','epson'],     'impressora', null),

-- Móveis
('Sofá Tok&Stok',         'moveis', ARRAY['sofa','sofá','tok','stok','retratil'],       'sofa',             'Tok&Stok'),
('Sofá Etna',             'moveis', ARRAY['sofa','sofá','etna'],                        'sofa',             'Etna'),
('Sofá genérico',         'moveis', ARRAY['sofa','sofá','couch','sectional'],           'sofa',             null),
('Cadeira Fratini',       'moveis', ARRAY['fratini','kopenhagem'],                      'cadeira_escritorio','Fratini'),
('Cadeira Breton',        'moveis', ARRAY['breton','cadeira'],                          'cadeira_escritorio','Breton'),
('Cadeira escritório',    'moveis', ARRAY['cadeira','escritorio','gamer','ergonomica','office'], 'cadeira_escritorio', null),
('Cadeira sala',          'moveis', ARRAY['cadeira','dining','chair','sala'],           'cadeira',          null),
('Mesa jantar',           'moveis', ARRAY['mesa','jantar','dining','table'],            'mesa_jantar',      null),
('Mesa escritório',       'moveis', ARRAY['mesa','escritorio','work','desk'],           'mesa_escritorio',  null),
('Mesa de centro',        'moveis', ARRAY['centro','coffee','mesa_centro','mesa_lateral'], 'mesa_centro',  null),
('Cama casal',            'moveis', ARRAY['cama','casal','queen','king','double'],      'cama',             null),
('Cama solteiro',         'moveis', ARRAY['cama','solteiro','single','twin'],           'cama_solteiro',    null),
('Criado-mudo',           'moveis', ARRAY['criado','mudo','nightstand','bedside'],      'criado_mudo',      null),
('Poltrona Ornare',       'moveis', ARRAY['poltrona','ornare'],                         'poltrona',         'Ornare'),
('Poltrona Fratini',      'moveis', ARRAY['poltrona','fratini'],                        'poltrona',         'Fratini'),
('Poltrona genérica',     'moveis', ARRAY['poltrona','armchair','lounge'],              'poltrona',         null),
('Pufe / Banqueta',       'moveis', ARRAY['pufe','puff','ottoman','banqueta','banquete'], 'pufe',           null),
('Estante / Livros',      'moveis', ARRAY['estante','bookcase','bookshelf','biblioteca'], 'estante',        null),

-- Marcenaria
('Bancada cozinha',       'marcenaria', ARRAY['bancada','cozinha','kitchen'],           'bancada_cozinha',  null),
('Bancada banheiro',      'marcenaria', ARRAY['bancada','banheiro','bathroom'],         'bancada_banheiro', null),
('Bancada genérica',      'marcenaria', ARRAY['bancada','counter','balcao','balcão'],   'bancada_cozinha',  null),
('Armário aéreo',         'marcenaria', ARRAY['aereo','aéreo','upper','cabinet_upper'], 'armario_aereo',    null),
('Armário balcão',        'marcenaria', ARRAY['balcao','balcão','lower','armario_lower'],'armario_balcao',  null),
('Gaveteiro',             'marcenaria', ARRAY['gaveteiro','gaveta','drawer','dresser'], 'gaveteiro',        null),
('Armário roupeiro',      'marcenaria', ARRAY['roupeiro','wardrobe','guarda_roupa'],    'armario_roupeiro', null),
('Nicho',                 'marcenaria', ARRAY['nicho','niche','alcove'],                'nicho',            null),
('Painel TV',             'marcenaria', ARRAY['painel','tv','rack','home_theater'],     'painel_tv',        null),
('Closet',                'marcenaria', ARRAY['closet','walk-in','dressing'],           'closet',           null),
('Prateleira',            'marcenaria', ARRAY['prateleira','shelf','shelving'],         'prateleira',       null),

-- Iluminação
('Luminária pendente',    'iluminacao', ARRAY['pendente','pendant','luminaria'],        'luminaria_pendente', null),
('Luminária plafon',      'iluminacao', ARRAY['plafon','plafond','ceiling_light'],      'luminaria_plafon', null),
('Spot LED',              'iluminacao', ARRAY['spot','led','embutir','downlight'],      'spot',             null),
('Arandela',              'iluminacao', ARRAY['arandela','wall_light','sconce'],        'arandela',         null),
('Trilho eletrificado',   'iluminacao', ARRAY['trilho','track','rail_light'],           'trilho',           null),
('Lustre',                'iluminacao', ARRAY['lustre','chandelier','candelabro'],      'lustre',           null),

-- Decoração
('Planta / Vaso planta',  'decoracao', ARRAY['planta','vaso_planta','plant','flower','tree','arvore'], 'planta',    null),
('Quadro / Arte',         'decoracao', ARRAY['quadro','picture','painting','frame','art','obra'],      'quadro',    null),
('Espelho',               'decoracao', ARRAY['espelho','mirror'],                        'espelho',        null),
('Tapete',                'decoracao', ARRAY['tapete','rug','carpet'],                   'tapete',          null),
('Almofada',              'decoracao', ARRAY['almofada','cushion','pillow'],             'almofada',        null),
('Decoração genérica',    'decoracao', ARRAY['escultura','sculpture','vaso','objeto','object'], 'decoracao', null),

-- Esquadrias
('Porta de madeira',      'esquadria', ARRAY['porta','door','madeira'],                 'porta',           null),
('Porta de vidro',        'esquadria', ARRAY['porta_vidro','glass_door','slider'],      'porta_vidro',     null),
('Janela',                'esquadria', ARRAY['janela','window','correr','basculante','maxim'], 'janela',    null),
('Portão',                'esquadria', ARRAY['portao','portão','gate'],                 'portao',          null)

ON CONFLICT DO NOTHING;
