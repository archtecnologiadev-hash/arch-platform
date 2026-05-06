import { simboloSVG, TIPO_LABEL, DISC_COR, type StatusPonto } from './simbolos-svg'

// ─── Layout constants (mm) ────────────────────────────────────────────────────

const PAGE_W = 594   // A2 landscape
const PAGE_H = 420

const MARGIN_LEFT   = 15
const MARGIN_TOP    = 15
const LEGEND_W      = 82
const MARGIN_RIGHT  = 10
const CARIMBO_H     = 38
const MARGIN_BOTTOM = 6

const DRAW_X1 = MARGIN_LEFT
const DRAW_Y1 = MARGIN_TOP
const DRAW_X2 = PAGE_W - LEGEND_W - MARGIN_RIGHT
const DRAW_Y2 = PAGE_H - CARIMBO_H - MARGIN_BOTTOM
const DRAW_W  = DRAW_X2 - DRAW_X1   // ~487mm
const DRAW_H  = DRAW_Y2 - DRAW_Y1   // ~361mm

const LEG_X = PAGE_W - LEGEND_W - MARGIN_RIGHT + 4
const LEG_Y1 = MARGIN_TOP
const CAR_Y  = PAGE_H - CARIMBO_H - MARGIN_BOTTOM

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComodoRow {
  id: string
  nome: string
  polygon: [number, number][]
  area_m2: number | null
}

interface CompRow {
  id: string
  tipo_componente: string | null
  posicao_x: number
  posicao_y: number
  posicao_z: number
  dimensao_x: number
  dimensao_y: number
  dimensao_z: number
}

interface PontoRow {
  id: string
  tipo_ponto: string
  disciplina: string
  posicao_x: number
  posicao_y: number
  altura_cm: number
  status: StatusPonto
  descricao_tecnica: string | null
}

export interface PranchaInput {
  nome_projeto: string
  disciplina: string
  numero_prancha: string
  data: string
  comodos: ComodoRow[]
  componentes: CompRow[]
  pontos: PontoRow[]
  up_axis: string
}

// ─── Coordinate helpers ───────────────────────────────────────────────────────

interface BBox { minX: number; minY: number; maxX: number; maxY: number }

function computeBBox(comodos: ComodoRow[], pontos: PontoRow[]): BBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const r of comodos) {
    for (const [x, y] of r.polygon) {
      if (x < minX) minX = x; if (x > maxX) maxX = x
      if (y < minY) minY = y; if (y > maxY) maxY = y
    }
  }
  for (const p of pontos) {
    if (p.posicao_x < minX) minX = p.posicao_x
    if (p.posicao_x > maxX) maxX = p.posicao_x
    if (p.posicao_y < minY) minY = p.posicao_y
    if (p.posicao_y > maxY) maxY = p.posicao_y
  }
  if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 10, maxY: 8 }
  return { minX, minY, maxX, maxY }
}

function makeTransform(bb: BBox) {
  const planW = bb.maxX - bb.minX || 1
  const planH = bb.maxY - bb.minY || 1
  const rawScale = Math.min(DRAW_W / planW, DRAW_H / planH)
  const scale = Math.min(rawScale, 25)   // max 1:40

  const drawnW = planW * scale
  const drawnH = planH * scale
  const offX = DRAW_X1 + (DRAW_W - drawnW) / 2
  const offY = DRAW_Y2 - (DRAW_H - drawnH) / 2

  function toSVG(wx: number, wy: number): [number, number] {
    return [
      offX + (wx - bb.minX) * scale,
      offY - (wy - bb.minY) * scale,   // Y-flip
    ]
  }

  const scaleLabel = `1:${Math.round(1000 / scale) * 5}`  // nearest 5
  return { toSVG, scale, scaleLabel, drawnW, drawnH }
}

function floorY(comp: CompRow, upAxis: string): number {
  return upAxis === 'Z_UP' ? comp.posicao_y : comp.posicao_z
}
function floorDim(comp: CompRow, upAxis: string): number {
  return upAxis === 'Z_UP' ? comp.dimensao_y : comp.dimensao_z
}

// ─── Component floor-plan category colors (same as frontend) ─────────────────

const TIPO_COLOR: Record<string, string> = {
  sofa: '#007AFF', cama: '#007AFF', cama_solteiro: '#007AFF',
  mesa_jantar: '#007AFF', mesa_escritorio: '#007AFF',
  armario_roupeiro: '#ea580c', closet: '#ea580c', bancada_cozinha: '#ea580c',
  armario_aereo: '#ea580c', armario_balcao: '#ea580c',
  vaso_sanitario: '#4f46e5', cuba_cozinha: '#4f46e5', cuba_banheiro: '#4f46e5',
  chuveiro: '#4f46e5', banheira: '#4f46e5', tanque: '#4f46e5',
  geladeira: '#7c3aed', fogao: '#7c3aed', cooktop: '#7c3aed', coifa: '#7c3aed',
  porta: '#d4b896', porta_vidro: '#b0d4e8',
  janela: '#b0d4e8',
}

// ─── SVG builders ─────────────────────────────────────────────────────────────

function renderRooms(comodos: ComodoRow[], toSVG: (x: number, y: number) => [number, number], wallStroke: number): string {
  return comodos.map(r => {
    if (!r.polygon.length) return ''
    const pts = r.polygon.map(([x, y]) => toSVG(x, y).join(',')).join(' ')
    const [cx, cy] = [
      r.polygon.reduce((s, p) => s + p[0], 0) / r.polygon.length,
      r.polygon.reduce((s, p) => s + p[1], 0) / r.polygon.length,
    ]
    const [scx, scy] = toSVG(cx, cy)
    const area = r.area_m2 != null ? `${Number(r.area_m2).toFixed(1)} m²` : ''
    return `<polygon points="${pts}" fill="#f8f8f8" stroke="#2a2a2a" stroke-width="${wallStroke}" stroke-linejoin="round"/>
            <text x="${scx.toFixed(2)}" y="${(scy - wallStroke).toFixed(2)}" text-anchor="middle" font-size="3" font-weight="600" fill="#2a2a2a">${escapeXml(r.nome)}</text>
            ${area ? `<text x="${scx.toFixed(2)}" y="${(scy + 3.8).toFixed(2)}" text-anchor="middle" font-size="2.2" fill="#6b7280">${area}</text>` : ''}`
  }).join('\n')
}

function renderComponents(
  componentes: CompRow[],
  upAxis: string,
  toSVG: (x: number, y: number) => [number, number],
  scale: number
): string {
  return componentes.map(c => {
    const tipo = c.tipo_componente ?? ''
    const color = TIPO_COLOR[tipo] ?? '#9ca3af'
    const fy = floorY(c, upAxis)
    const fd = floorDim(c, upAxis)
    const [cx, cy] = toSVG(c.posicao_x, fy)
    const w = Math.max(c.dimensao_x * scale, 1.5)
    const d = Math.max(fd * scale, 1.5)

    if (tipo === 'porta' || tipo === 'porta_vidro') {
      const leaf = Math.max(c.dimensao_x * scale, 2)
      return `<line x1="${(cx - leaf/2).toFixed(2)}" y1="${cy.toFixed(2)}" x2="${(cx + leaf/2).toFixed(2)}" y2="${cy.toFixed(2)}"
                stroke="#c4a882" stroke-width="0.6"/>
              <path d="M${(cx - leaf/2).toFixed(2)},${cy.toFixed(2)} A${leaf.toFixed(2)},${leaf.toFixed(2)} 0 0,1 ${(cx - leaf/2).toFixed(2)},${(cy - leaf).toFixed(2)}"
                fill="none" stroke="#c4a882" stroke-width="0.35" stroke-dasharray="1,0.5"/>`
    }
    if (tipo === 'janela') {
      const w2 = Math.max(c.dimensao_x * scale, 2)
      return `<line x1="${(cx - w2/2).toFixed(2)}" y1="${(cy - 0.8).toFixed(2)}" x2="${(cx + w2/2).toFixed(2)}" y2="${(cy - 0.8).toFixed(2)}" stroke="#7ab8d4" stroke-width="0.6"/>
              <line x1="${(cx - w2/2).toFixed(2)}" y1="${(cy + 0.8).toFixed(2)}" x2="${(cx + w2/2).toFixed(2)}" y2="${(cy + 0.8).toFixed(2)}" stroke="#7ab8d4" stroke-width="0.6"/>`
    }

    return `<rect x="${(cx - w/2).toFixed(2)}" y="${(cy - d/2).toFixed(2)}" width="${w.toFixed(2)}" height="${d.toFixed(2)}"
              fill="${color}30" stroke="${color}" stroke-width="0.35" rx="0.4"/>`
  }).join('\n')
}

function renderPontos(
  pontos: PontoRow[],
  disciplina: string,
  toSVG: (x: number, y: number) => [number, number],
): string {
  return pontos
    .filter(p => p.disciplina === disciplina)
    .map(p => {
      const [sx, sy] = toSVG(p.posicao_x, p.posicao_y)
      const sym = simboloSVG(p.tipo_ponto, p.status as StatusPonto)
      const desc = p.descricao_tecnica ?? p.tipo_ponto
      const short = desc.length > 35 ? desc.slice(0, 33) + '…' : desc
      return `<g transform="translate(${sx.toFixed(2)},${sy.toFixed(2)})">
                ${sym}
              </g>
              <line x1="${(sx + 3).toFixed(2)}" y1="${sy.toFixed(2)}" x2="${(sx + 6).toFixed(2)}" y2="${sy.toFixed(2)}"
                stroke="#999" stroke-width="0.2"/>
              <text x="${(sx + 6.5).toFixed(2)}" y="${(sy + 0.8).toFixed(2)}" font-size="1.8" fill="#333">${escapeXml(short)}</text>`
    }).join('\n')
}

function renderLegend(pontos: PontoRow[], disciplina: string): string {
  const tiposSet = new Set(pontos.filter(p => p.disciplina === disciplina).map(p => p.tipo_ponto))
  const tipos = Array.from(tiposSet)
  if (tipos.length === 0) return ''

  const discLabel: Record<string, string> = {
    hidraulica: 'HIDRÁULICA', eletrica: 'ELÉTRICA', gas: 'GÁS', mobiliario: 'MOBILIÁRIO',
  }
  const discCor = DISC_COR[disciplina] ?? '#333'

  let y = LEG_Y1 + 4
  const lines: string[] = [
    `<text x="${LEG_X}" y="${y}" font-size="3" font-weight="700" fill="${discCor}">${discLabel[disciplina] ?? disciplina.toUpperCase()}</text>`,
    `<line x1="${LEG_X}" y1="${y + 1.5}" x2="${LEG_X + 72}" y2="${y + 1.5}" stroke="${discCor}" stroke-width="0.5"/>`,
  ]
  y += 8

  for (const tipo of tipos) {
    const sym = simboloSVG(tipo, 'novo')
    const label = TIPO_LABEL[tipo] ?? tipo.replace(/_/g, ' ')
    lines.push(
      `<g transform="translate(${LEG_X + 3},${y})">${sym}</g>`,
      `<text x="${LEG_X + 9}" y="${y + 0.8}" font-size="2.4" fill="#333">${escapeXml(label)}</text>`,
    )
    y += 7
  }

  // Status legend
  y += 3
  lines.push(`<text x="${LEG_X}" y="${y}" font-size="2.5" font-weight="600" fill="#555">STATUS</text>`)
  y += 5
  const statuses: [StatusPonto, string][] = [['novo', 'Novo'], ['reposicionar', 'Reposicionar'], ['existente', 'Existente']]
  const statCor: Record<StatusPonto, string> = { novo: '#dc2626', reposicionar: '#2563eb', existente: '#6b7280' }
  for (const [s, label] of statuses) {
    lines.push(
      `<circle cx="${LEG_X + 3}" cy="${y}" r="2" fill="none" stroke="${statCor[s]}" stroke-width="0.5"/>`,
      `<text x="${LEG_X + 8}" y="${y + 0.8}" font-size="2.2" fill="#555">${label}</text>`,
    )
    y += 6
  }

  return lines.join('\n')
}

function renderCarimbo(input: PranchaInput, scaleLabel: string): string {
  const x0 = MARGIN_LEFT
  const y0 = CAR_Y
  const w = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT
  const h = CARIMBO_H

  const discLabel: Record<string, string> = {
    hidraulica: 'Planta Hidráulica', eletrica: 'Planta Elétrica',
    gas: 'Planta de Gás', mobiliario: 'Planta de Mobiliário',
  }

  return `
    <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="white" stroke="#2a2a2a" stroke-width="0.5"/>
    <line x1="${x0 + w * 0.55}" y1="${y0}" x2="${x0 + w * 0.55}" y2="${y0 + h}" stroke="#2a2a2a" stroke-width="0.4"/>
    <line x1="${x0 + w * 0.55}" y1="${y0 + h * 0.45}" x2="${x0 + w}" y2="${y0 + h * 0.45}" stroke="#2a2a2a" stroke-width="0.4"/>
    <text x="${x0 + 5}" y="${y0 + 12}" font-size="5.5" font-weight="700" fill="#1a1a1a">${escapeXml(input.nome_projeto)}</text>
    <text x="${x0 + 5}" y="${y0 + 24}" font-size="4" fill="#444">${escapeXml(discLabel[input.disciplina] ?? input.disciplina)}</text>
    <text x="${x0 + 5}" y="${y0 + 34}" font-size="3" fill="#888">Pranchas geradas automaticamente • ARCH Platform</text>
    <text x="${x0 + w * 0.55 + 5}" y="${y0 + 13}" font-size="3.2" fill="#555">Escala: ${scaleLabel}</text>
    <text x="${x0 + w * 0.55 + 5}" y="${y0 + 19}" font-size="3.2" fill="#555">Data: ${input.data}</text>
    <text x="${x0 + w * 0.55 + 5}" y="${y0 + h * 0.45 + 12}" font-size="7" font-weight="700" fill="#1a1a1a">${input.numero_prancha}</text>
  `
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ─── Main render ──────────────────────────────────────────────────────────────

export function renderPrancha(input: PranchaInput): string {
  const { toSVG, scale, scaleLabel } = makeTransform(
    computeBBox(input.comodos, input.pontos)
  )
  const wallStroke = Math.max(0.5 * scale, 0.8)

  const rooms    = renderRooms(input.comodos, toSVG, wallStroke)
  const comps    = renderComponents(input.componentes, input.up_axis, toSVG, scale)
  const pts      = renderPontos(input.pontos, input.disciplina, toSVG)
  const legend   = renderLegend(input.pontos, input.disciplina)
  const carimbo  = renderCarimbo(input, scaleLabel)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${PAGE_W}mm" height="${PAGE_H}mm"
     viewBox="0 0 ${PAGE_W} ${PAGE_H}">
  <defs>
    <style>
      text { font-family: Arial, Helvetica, sans-serif; }
    </style>
    <clipPath id="drawarea">
      <rect x="${DRAW_X1}" y="${DRAW_Y1}" width="${DRAW_W}" height="${DRAW_H}"/>
    </clipPath>
  </defs>

  <!-- Page border -->
  <rect x="5" y="5" width="${PAGE_W - 10}" height="${PAGE_H - 10}" fill="white" stroke="#555" stroke-width="0.5"/>
  <rect x="${MARGIN_LEFT}" y="${MARGIN_TOP}" width="${DRAW_W}" height="${DRAW_H}"
        fill="#fbfbfb" stroke="#aaa" stroke-width="0.3"/>

  <!-- Floorplan (clipped) -->
  <g clip-path="url(#drawarea)">
    ${rooms}
    ${comps}
    ${pts}
  </g>

  <!-- Legend border -->
  <rect x="${PAGE_W - LEGEND_W - MARGIN_RIGHT}" y="${MARGIN_TOP}"
        width="${LEGEND_W}" height="${DRAW_H}"
        fill="white" stroke="#aaa" stroke-width="0.3"/>
  ${legend}

  <!-- Title block -->
  ${carimbo}
</svg>`
}
