export type Disciplina = 'hidraulica' | 'eletrica' | 'gas' | 'mobiliario'
export type StatusPonto = 'novo' | 'existente' | 'reposicionar'

export interface CompInfo {
  id: string
  tipo_componente: string
  floor_x: number
  floor_y: number
  dim_x: number
  dim_floor: number  // depth in the floor plane
  dim_h: number      // height (vertical)
}

export interface ComodoInfo {
  id: string
  nome: string
  polygon: [number, number][]
  area_m2: number | null
}

export interface PontoGerado {
  componente_origem_id: string | null
  comodo_id: string | null
  disciplina: Disciplina
  tipo_ponto: string
  posicao_x: number
  posicao_y: number
  altura_cm: number
  status: StatusPonto
  descricao_tecnica: string
  dados_extras?: Record<string, unknown>
}

function centroide(poly: [number, number][]): [number, number] {
  const n = poly.length
  if (n === 0) return [0, 0]
  return [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n]
}

function isAreaMolhada(nome: string) {
  return ['cozinha', 'banheir', 'lavabo', 'lavand', 'área', 'area', 'wc', 'bwc', 'serviço', 'servico'].some(k =>
    nome.toLowerCase().includes(k)
  )
}
function isCozinha(nome: string) {
  return ['cozinha', 'copa'].some(k => nome.toLowerCase().includes(k))
}

const h = (cm: number) => `h=${cm}cm`
const AF = 'Á.F. Ø25mm'
const AQ = 'Á.Q. Ø25mm'
const E50 = 'Esgoto Ø50mm'
const T10 = 'Tomada 2P+T 10A'
const T20 = 'Tomada 2P+T 20A'
const T220 = 'Tomada dedicada 220V 20A'

function pt(
  comp: CompInfo,
  disciplina: Disciplina,
  tipo_ponto: string,
  altura_cm: number,
  descricao_tecnica: string,
  offsetX = 0,
  offsetY = 0,
): PontoGerado {
  return {
    componente_origem_id: comp.id,
    comodo_id: null,
    disciplina,
    tipo_ponto,
    posicao_x: comp.floor_x + offsetX,
    posicao_y: comp.floor_y + offsetY,
    altura_cm,
    status: 'novo',
    descricao_tecnica,
  }
}

function tomadas_bancada(comp: CompInfo, altura_cm: number): PontoGerado[] {
  const len = Math.max(comp.dim_x, comp.dim_floor)
  const n = Math.max(1, Math.round(len / 0.8))
  return Array.from({ length: n }, (_, i) => {
    const offset = -len / 2 + (i + 0.5) * (len / n)
    return pt(comp, 'eletrica', 'tomada_10a', altura_cm, `${T10} (${h(altura_cm)} bancada — a cada 80cm)`, offset)
  })
}

type Regra = (c: CompInfo) => PontoGerado[]

const REGRAS: Record<string, Regra> = {
  cuba_cozinha: c => [
    pt(c, 'hidraulica', 'agua_fria',  43, `${AF} (${h(43)} monocomando de mesa 2 a 40 m.c.a)`),
    pt(c, 'hidraulica', 'agua_quente',43, `${AQ} (${h(43)})`),
    pt(c, 'hidraulica', 'esgoto_50',  35, `${E50} (${h(35)} p/ triturador) — caixa de gordura`),
    pt(c, 'eletrica',   'tomada_20a',110, `${T20} (${h(110)} bancada cozinha)`),
  ],

  cuba_banheiro: c => [
    pt(c, 'hidraulica', 'agua_fria',  70, `${AF} (${h(70)} monocomando 2 a 40 m.c.a)`),
    pt(c, 'hidraulica', 'agua_quente',70, `${AQ} (${h(70)})`),
    pt(c, 'hidraulica', 'esgoto_50',  60, `${E50} (${h(60)})`),
  ],

  vaso_sanitario: c => [
    pt(c, 'hidraulica', 'agua_fria', 20, `${AF} (${h(20)} caixa acoplada — padrão construtora)`),
  ],

  ducha_higienica: c => [
    pt(c, 'hidraulica', 'agua_fria',  110, `${AF} (${h(110)} monocomando 2 a 40 m.c.a)`),
    pt(c, 'hidraulica', 'agua_quente',110, `${AQ} (${h(110)})`),
  ],

  chuveiro: c => [
    pt(c, 'hidraulica', 'agua_fria',  225, `${AF} (${h(225)})`),
    pt(c, 'hidraulica', 'agua_quente',225, `${AQ} (${h(225)})`),
    pt(c, 'eletrica',   'tomada_220v',220, `${T220} — chuveiro elétrico (${h(220)})`),
  ],

  tanque: c => [
    pt(c, 'hidraulica', 'agua_fria',  47, `${AF} (${h(47)})`),
    pt(c, 'hidraulica', 'agua_quente',51, `${AQ} (${h(51)})`),
    pt(c, 'hidraulica', 'esgoto_50',  51, `${E50} (${h(51)})`),
  ],

  lava_loucas: c => [
    pt(c, 'hidraulica', 'agua_fria',  51, `${AF} (${h(51)})`),
    pt(c, 'hidraulica', 'agua_quente',53, `${AQ} (${h(53)})`),
    pt(c, 'hidraulica', 'esgoto_50',  58, `${E50} (${h(58)})`),
    pt(c, 'eletrica',   'tomada_20a', 80, `${T20} (${h(80)})`),
  ],

  lava_seca: c => [
    pt(c, 'hidraulica', 'agua_fria',  51, `${AF} (${h(51)})`),
    pt(c, 'hidraulica', 'agua_quente',53, `${AQ} (${h(53)})`),
    pt(c, 'hidraulica', 'esgoto_50',  58, `${E50} (${h(58)})`),
    pt(c, 'eletrica',   'tomada_20a', 80, `${T20} (${h(80)} — máquina de lavar)`),
  ],

  geladeira: c => [
    pt(c, 'eletrica', 'tomada_10a', 110, `${T10} (${h(110)} geladeira)`),
  ],

  microondas: c => [
    pt(c, 'eletrica', 'tomada_10a', 180, `${T10} (${h(180)} micro-ondas)`),
  ],

  forno: c => [
    pt(c, 'eletrica', 'tomada_220v', 50, `${T220} — forno elétrico (dedicada)`),
  ],

  fogao: c => [
    pt(c, 'gas',     'ponto_gas',  60, 'Ponto de gás — fogão (padrão construtora)'),
    pt(c, 'eletrica','tomada_10a', 60, `${T10} (${h(60)} fogão c/ forno elétrico)`),
  ],

  cooktop: c => [
    pt(c, 'gas',     'ponto_gas',  60, 'Ponto de gás — cooktop'),
    pt(c, 'eletrica','tomada_220v',60, `${T220} — cooktop (dedicada)`),
  ],

  coifa: c => [
    pt(c, 'eletrica', 'tomada_10a',     220, `${T10} (${h(220)} coifa)`),
    pt(c, 'eletrica', 'ponto_exaustao', 220, `Saída de exaustão (${h(220)})`),
  ],

  banheira: c => [
    pt(c, 'hidraulica', 'agua_fria',  45, `${AF} (${h(45)})`),
    pt(c, 'hidraulica', 'agua_quente',45, `${AQ} (${h(45)})`),
    pt(c, 'hidraulica', 'esgoto_50',  15, `${E50} (${h(15)})`),
  ],

  cama: c => [
    pt(c, 'eletrica', 'tomada_10a', 20, `${T10} (${h(20)} lado esquerdo)`, -c.dim_x / 2 + 0.10),
    pt(c, 'eletrica', 'tomada_10a', 20, `${T10} (${h(20)} lado direito)`,  +c.dim_x / 2 - 0.10),
  ],

  cama_solteiro: c => [
    pt(c, 'eletrica', 'tomada_10a', 20, `${T10} (${h(20)} cabeceira)`, -c.dim_x / 2 - 0.05),
  ],

  criado_mudo: c => [
    pt(c, 'eletrica', 'tomada_10a', 20, `${T10} (${h(20)} ao lado)`),
  ],

  painel_tv: c => [
    pt(c, 'eletrica', 'tomada_10a', 120, `${T10} (${h(120)} TV)`),
    pt(c, 'eletrica', 'tomada_vdi', 120, `Tomada VDI TV/Dados (${h(120)})`),
  ],

  mesa_escritorio: c => tomadas_bancada(c, 110),
  bancada_cozinha: c => tomadas_bancada(c, 110),
  bancada_banheiro: c => tomadas_bancada(c, 110),
}

REGRAS['torneira'] = REGRAS['cuba_banheiro']
REGRAS['torneira_cozinha'] = () => []

export function gerarPontosComponente(c: CompInfo): PontoGerado[] {
  return REGRAS[c.tipo_componente]?.(c) ?? []
}

export function gerarPontosComodo(comodo: ComodoInfo): PontoGerado[] {
  const [cx, cy] = centroide(comodo.polygon)
  const pontos: PontoGerado[] = [
    {
      componente_origem_id: null,
      comodo_id: comodo.id,
      disciplina: 'eletrica',
      tipo_ponto: 'ponto_luz_teto',
      posicao_x: cx,
      posicao_y: cy,
      altura_cm: 0,
      status: 'novo',
      descricao_tecnica: `Ponto de luz — teto — ${comodo.nome}`,
    },
    {
      componente_origem_id: null,
      comodo_id: comodo.id,
      disciplina: 'eletrica',
      tipo_ponto: 'interruptor_simples',
      posicao_x: cx + 0.5,
      posicao_y: cy,
      altura_cm: 120,
      status: 'novo',
      descricao_tecnica: `Interruptor simples h=120cm — ${comodo.nome}`,
    },
  ]

  if (isAreaMolhada(comodo.nome) || isCozinha(comodo.nome)) {
    pontos.push({
      componente_origem_id: null,
      comodo_id: comodo.id,
      disciplina: 'eletrica',
      tipo_ponto: 'tomada_10a',
      posicao_x: cx - 0.5,
      posicao_y: cy,
      altura_cm: 110,
      status: 'novo',
      descricao_tecnica: `${T10} h=110cm bancada — ${comodo.nome}`,
    })
  }

  return pontos
}

export function floorCoords(
  comp: { posicao_x: number; posicao_y: number; posicao_z: number; dimensao_x: number; dimensao_y: number; dimensao_z: number },
  upAxis: string
): CompInfo & { id: string; tipo_componente: string } {
  const isZUp = upAxis === 'Z_UP'
  return {
    id: '',
    tipo_componente: '',
    floor_x: comp.posicao_x,
    floor_y: isZUp ? comp.posicao_y : comp.posicao_z,
    dim_x: comp.dimensao_x,
    dim_floor: isZUp ? comp.dimensao_y : comp.dimensao_z,
    dim_h: isZUp ? comp.dimensao_z : comp.dimensao_y,
  }
}
