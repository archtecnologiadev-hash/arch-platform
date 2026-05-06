'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Upload, Loader2, CheckCircle2, AlertCircle, RefreshCw, X,
  ZoomIn, ZoomOut, Maximize2, ChevronRight, AlertTriangle, Sparkles,
  FileText, Download, Settings2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { parseCollada, type ParsedComponent, type ParsedComodo } from '@/lib/collada-parser-browser'
import { renderPrancha } from '@/lib/detalhamento/render-prancha'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DetalhamentoDB {
  id: string
  dae_file_name: string | null
  dae_file_path: string
  dae_uploaded_at: string
  status: string
  up_axis: string | null
}

interface ComponenteDB {
  id: string
  detalhamento_id: string
  nome_skp: string
  tipo_inferido: string
  tipo_componente: string | null
  fabricante: string | null
  posicao_x: number
  posicao_y: number
  posicao_z: number
  dimensao_x: number
  dimensao_y: number
  dimensao_z: number
  raw_metadata: Record<string, unknown> | null
  status_identificacao: string | null
  confianca: number | null
  raciocinio_ia: string | null
}

interface ComodoDBRow {
  id: string
  nome: string
  area_m2: number | null
  pe_direito_m: number | null
  polygon: [number, number][] | null
}

interface CatalogEntry {
  id: string
  nome: string
  categoria: string
  tipo_componente: string
  fabricante: string | null
}

interface PontoRow {
  id: string
  disciplina: string
  tipo_ponto: string
  posicao_x: number
  posicao_y: number
  altura_cm: number
  status: 'novo' | 'existente' | 'reposicionar'
  descricao_tecnica: string | null
  comodo_id: string | null
  componente_origem_id: string | null
}

interface PranchaRow {
  id: string
  disciplina: string
  numero_prancha: string
  pdf_path: string
  gerado_em: string
}

type ParseStatus = 'idle' | 'reading' | 'parsing' | 'ready' | 'uploading' | 'saving' | 'done' | 'error'

const CATEGORIAS = ['todos', 'moveis', 'hidraulica', 'eletro', 'eletronico', 'marcenaria', 'iluminacao', 'esquadria', 'decoracao', 'nao_identificado', 'pendentes'] as const
type Categoria = typeof CATEGORIAS[number]

const CAT_LABEL: Record<Categoria, string> = {
  todos: 'Todos', moveis: 'Móveis', hidraulica: 'Hidráulica', eletro: 'Eletro',
  eletronico: 'Eletrônico', marcenaria: 'Marcenaria', iluminacao: 'Iluminação',
  esquadria: 'Esquadria', decoracao: 'Decoração', nao_identificado: '⚠ Não identif.',
  pendentes: '⏳ Pendentes',
}

const TIPO_PARA_CAT: Record<string, Categoria> = {
  vaso_sanitario: 'hidraulica', cuba_cozinha: 'hidraulica', cuba_banheiro: 'hidraulica',
  tanque: 'hidraulica', ducha_higienica: 'hidraulica', chuveiro: 'hidraulica',
  torneira: 'hidraulica', torneira_cozinha: 'hidraulica', ralo: 'hidraulica',
  banheira: 'hidraulica', box: 'hidraulica',
  geladeira: 'eletro', lava_loucas: 'eletro', lava_seca: 'eletro', microondas: 'eletro',
  forno: 'eletro', fogao: 'eletro', cooktop: 'eletro', coifa: 'eletro',
  tv: 'eletronico', monitor: 'eletronico', computador: 'eletronico', impressora: 'eletronico',
  sofa: 'moveis', cadeira: 'moveis', cadeira_escritorio: 'moveis', cama: 'moveis',
  cama_solteiro: 'moveis', criado_mudo: 'moveis', poltrona: 'moveis', pufe: 'moveis',
  estante: 'moveis', mesa_jantar: 'moveis', mesa_escritorio: 'moveis', mesa_centro: 'moveis',
  bancada_cozinha: 'marcenaria', bancada_banheiro: 'marcenaria', bancada: 'marcenaria',
  armario_aereo: 'marcenaria', armario_balcao: 'marcenaria', gaveteiro: 'marcenaria',
  armario_roupeiro: 'marcenaria', nicho: 'marcenaria', painel_tv: 'marcenaria',
  closet: 'marcenaria', prateleira: 'marcenaria',
  luminaria_pendente: 'iluminacao', luminaria_plafon: 'iluminacao', spot: 'iluminacao',
  arandela: 'iluminacao', trilho: 'iluminacao', lustre: 'iluminacao',
  porta: 'esquadria', porta_vidro: 'esquadria', janela: 'esquadria', portao: 'esquadria',
  planta: 'decoracao', quadro: 'decoracao', espelho: 'decoracao', tapete: 'decoracao',
  almofada: 'decoracao', decoracao: 'decoracao',
}

const CAT_COLOR: Record<Categoria, string> = {
  todos: '#6b7280', moveis: '#007AFF', hidraulica: '#4f46e5', eletro: '#7c3aed',
  eletronico: '#db2777', marcenaria: '#ea580c', iluminacao: '#b45309',
  esquadria: '#059669', decoracao: '#ec4899', nao_identificado: '#f97316',
  pendentes: '#d97706',
}

// Identification-source colors
const STATUS_COLOR: Record<string, string> = {
  catalogo:   '#059669', // green
  aprendizado: '#007AFF', // blue
  heuristica: '#7c3aed', // purple
  vision_ai:  '#d97706', // amber/yellow
  duvidoso:   '#f97316', // orange
}
const STATUS_LABEL: Record<string, string> = {
  catalogo:   'Catálogo',
  aprendizado: 'Aprendizado',
  heuristica: 'Heurística',
  vision_ai:  'Vision AI',
  duvidoso:   'Duvidoso',
}

function compColor(c: ComponenteDB | ParsedComponent): string {
  const status = (c as ComponenteDB).status_identificacao
  if (!status) return '#f97316'  // not identified yet
  return STATUS_COLOR[status] ?? '#6b7280'
}

function isPendingValidation(c: ComponenteDB): boolean {
  return c.status_identificacao === 'duvidoso' || c.status_identificacao === 'vision_ai' || !c.tipo_componente
}

const TIPO_SHORT: Record<string, string> = {
  vaso_sanitario: 'WC', cuba_cozinha: 'Cuba', cuba_banheiro: 'Cuba', tanque: 'Tanque',
  ducha_higienica: 'Ducha', chuveiro: 'Ducha', torneira: 'Torn.', torneira_cozinha: 'Torn.',
  ralo: 'Ralo', banheira: 'Banha.', box: 'Box',
  geladeira: 'Gelad.', lava_loucas: 'L.Louç', lava_seca: 'L.Seca', microondas: 'MW',
  forno: 'Forno', fogao: 'Fogão', cooktop: 'Cook', coifa: 'Coifa',
  tv: 'TV', monitor: 'Mon.', computador: 'PC', impressora: 'Imp.',
  sofa: 'Sofá', cadeira: 'Cad.', cadeira_escritorio: 'Cad.', cama: 'Cama',
  cama_solteiro: 'Cama', criado_mudo: 'Cria.', poltrona: 'Poltr.', pufe: 'Pufe',
  estante: 'Est.', mesa_jantar: 'Mesa', mesa_escritorio: 'Mesa', mesa_centro: 'Mesa',
  bancada_cozinha: 'Banc.', bancada_banheiro: 'Banc.', bancada: 'Banc.',
  armario_aereo: 'Aér.', armario_balcao: 'Balc.', gaveteiro: 'Gav.',
  armario_roupeiro: 'Roupe.', nicho: 'Nicho', painel_tv: 'Painel', closet: 'Closet', prateleira: 'Prat.',
  luminaria_pendente: 'Pend.', luminaria_plafon: 'Plaf.', spot: 'Spot',
  arandela: 'Aran.', trilho: 'Trilho', lustre: 'Lustr.',
  porta: 'Porta', porta_vidro: 'Port.V', janela: 'Jan.', portao: 'Portão',
  planta: 'Plant.', quadro: 'Quad.', espelho: 'Esp.', tapete: 'Tap.',
  almofada: 'Alm.', decoracao: 'Déc.',
}

const PRANCHA_NUMEROS: Record<string, string> = {
  mobiliario: 'A-02', hidraulica: 'A-03', gas: 'A-05', eletrica: 'A-06',
}
const DISC_LABEL_PT: Record<string, string> = {
  mobiliario: 'Mobiliário', hidraulica: 'Hidráulica', gas: 'Gás', eletrica: 'Elétrica',
}
const DISC_ORDER = ['mobiliario', 'hidraulica', 'eletrica', 'gas']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readAsText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = e => res(e.target?.result as string)
    reader.onerror = rej
    reader.readAsText(file)
  })
}
function nextFrame(): Promise<void> {
  return new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => res())))
}
function fmtSize(bytes: number): string {
  return bytes < 1048576 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1048576).toFixed(1)} MB`
}

// ─── PDF conversion (client-only, dynamic imports) ───────────────────────────

async function svgStringToPdf(svgString: string): Promise<Blob> {
  const jsPDFMod = await import('jspdf')
  const { svg2pdf } = await import('svg2pdf.js')
  const jsPDF = jsPDFMod.default ?? jsPDFMod
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a2' })
  const parser = new DOMParser()
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml')
  const svgEl = svgDoc.documentElement as unknown as SVGSVGElement
  await svg2pdf(svgEl, doc, { x: 0, y: 0, width: 594, height: 420 })
  return doc.output('blob')
}

// ─── Floor-plan coordinate helpers ───────────────────────────────────────────

interface FloorCoords { cx: number; cy: number; w: number; h: number }
function compFloor(c: ComponenteDB | ParsedComponent, upAxis: string): FloorCoords {
  if ('posicao_x' in c) {
    if (upAxis === 'Z_UP') return { cx: c.posicao_x, cy: c.posicao_y, w: c.dimensao_x, h: c.dimensao_y }
    return { cx: c.posicao_x, cy: c.posicao_z, w: c.dimensao_x, h: c.dimensao_z }
  }
  return { cx: 0, cy: 0, w: 0, h: 0 }
}

function compCategory(c: { tipo_componente?: string | null; tipo_inferido?: string }): Categoria {
  const t = (c as ComponenteDB).tipo_componente
  if (!t) return 'nao_identificado'
  return TIPO_PARA_CAT[t] ?? 'todos'
}

// ─── SVG BBox ─────────────────────────────────────────────────────────────────

interface Rect { x: number; y: number; w: number; h: number }

function computeViewBox(
  comodos: (ComodoDBRow | ParsedComodo)[],
  componentes: (ComponenteDB | ParsedComponent)[],
  upAxis: string
): Rect {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity

  for (const r of comodos) {
    const poly = (r as ComodoDBRow).polygon ?? (r as ParsedComodo).polygon
    if (!poly) continue
    for (const [px, py] of poly) {
      if (px < minX) minX = px; if (px > maxX) maxX = px
      if (py < minY) minY = py; if (py > maxY) maxY = py
    }
  }
  for (const c of componentes) {
    const { cx, cy } = compFloor(c, upAxis)
    if (cx < minX) minX = cx; if (cx > maxX) maxX = cx
    if (cy < minY) minY = cy; if (cy > maxY) maxY = cy
  }

  if (minX === Infinity) return { x: -5, y: -5, w: 20, h: 15 }

  const pad = Math.max((maxX - minX) * 0.12, (maxY - minY) * 0.12, 1)
  return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 }
}

// ─── FloorPlanSVG ─────────────────────────────────────────────────────────────

interface FloorPlanProps {
  comodos: (ComodoDBRow | ParsedComodo)[]
  componentes: (ComponenteDB | ParsedComponent)[]
  upAxis: string
  filterCat: Categoria
  selectedId: string | null
  onSelectComp: (id: string | null) => void
}

function FloorPlanSVG({ comodos, componentes, upAxis, filterCat, selectedId, onSelectComp }: FloorPlanProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const defaultVb = useMemo(() => computeViewBox(comodos, componentes, upAxis), [comodos, componentes, upAxis])
  const [vb, setVb] = useState<Rect>(defaultVb)
  const [panning, setPanning] = useState(false)
  const panRef = useRef({ startX: 0, startY: 0, vbX: 0, vbY: 0 })

  useEffect(() => { setVb(defaultVb) }, [defaultVb])

  function getSVGCursor(e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    return {
      x: vb.x + (e.clientX - rect.left) * (vb.w / rect.width),
      y: vb.y + (e.clientY - rect.top) * (vb.h / rect.height),
    }
  }

  function handleWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 1.15 : 0.87
    const { x, y } = getSVGCursor(e)
    setVb(v => ({
      x: x - (x - v.x) * factor,
      y: y - (y - v.y) * factor,
      w: v.w * factor,
      h: v.h * factor,
    }))
  }

  function handleMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    const tgt = e.target as Element
    if (tgt.tagName === 'svg' || tgt.tagName === 'polygon' || tgt.classList.contains('room-poly')) {
      setPanning(true)
      panRef.current = { startX: e.clientX, startY: e.clientY, vbX: vb.x, vbY: vb.y }
    }
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!panning) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const dx = -(e.clientX - panRef.current.startX) * (vb.w / rect.width)
    const dy = -(e.clientY - panRef.current.startY) * (vb.h / rect.height)
    setVb(v => ({ ...v, x: panRef.current.vbX + dx, y: panRef.current.vbY + dy }))
  }

  function handleMouseUp() { setPanning(false) }

  // Derived sizes (all in SVG units = meters)
  const fontSize = vb.w * 0.028
  const fontSmall = vb.w * 0.019
  const strokeW = vb.w * 0.003
  const dimOffset = vb.w * 0.04

  // Overall bounding box for dimension annotations
  const allPts = comodos.flatMap(r => {
    const poly = (r as ComodoDBRow).polygon ?? (r as ParsedComodo).polygon ?? []
    return poly
  })
  const minX = allPts.length ? Math.min(...allPts.map(p => p[0])) : vb.x
  const maxX = allPts.length ? Math.max(...allPts.map(p => p[0])) : vb.x + vb.w
  const minY = allPts.length ? Math.min(...allPts.map(p => p[1])) : vb.y
  const maxY = allPts.length ? Math.max(...allPts.map(p => p[1])) : vb.y + vb.h
  const totalW = maxX - minX
  const totalH = maxY - minY

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      {/* Zoom buttons */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button onClick={() => setVb(v => ({ x: v.x + v.w * 0.15, y: v.y + v.h * 0.15, w: v.w * 0.7, h: v.h * 0.7 }))}
          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ZoomIn size={13} />
        </button>
        <button onClick={() => setVb(v => ({ x: v.x - v.w * 0.15, y: v.y - v.h * 0.15, w: v.w * 1.3, h: v.h * 1.3 }))}
          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ZoomOut size={13} />
        </button>
        <button onClick={() => setVb(defaultVb)}
          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Maximize2 size={13} />
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        style={{ width: '100%', height: '100%', cursor: panning ? 'grabbing' : 'grab', display: 'block', background: '#f8f8f9' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={e => { if ((e.target as Element).tagName === 'svg') onSelectComp(null) }}
      >
        {/* Grid */}
        <defs>
          <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
            <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#e5e5ea" strokeWidth={strokeW * 0.3} />
          </pattern>
        </defs>
        <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="url(#grid)" />

        {/* ── Rooms ── */}
        {comodos.map((r, i) => {
          const poly = (r as ComodoDBRow).polygon ?? (r as ParsedComodo).polygon ?? []
          if (!poly.length) return null
          const pts = poly.map(([x, y]) => `${x},${y}`).join(' ')
          const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length
          const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length
          const nome = (r as ComodoDBRow).nome ?? (r as ParsedComodo).nome
          const area = (r as ComodoDBRow).area_m2 ?? (r as ParsedComodo).area_m2

          return (
            <g key={i}>
              <polygon
                className="room-poly"
                points={pts}
                fill="white"
                stroke="#1c1c1e"
                strokeWidth={strokeW * 1.5}
                strokeLinejoin="round"
              />
              <text x={cx} y={cy - fontSize * 0.3} textAnchor="middle" fontSize={fontSize} fontWeight="600" fill="#1c1c1e">
                {nome}
              </text>
              {area != null && (
                <text x={cx} y={cy + fontSize * 1.1} textAnchor="middle" fontSize={fontSmall} fill="#6b6b6b">
                  {Number(area).toFixed(1)} m²
                </text>
              )}
            </g>
          )
        })}

        {/* ── Components ── */}
        {componentes.map((c, i) => {
          const cat = compCategory(c as ComponenteDB)
          const color = compColor(c as ComponenteDB)
          const identified = !!(c as ComponenteDB).tipo_componente
          const { cx, cy, w, h } = compFloor(c, upAxis)

          // Skip if filtered
          if (filterCat !== 'todos' && filterCat !== cat) return null

          const dbId = (c as ComponenteDB).id ?? String(i)
          const isSelected = selectedId === dbId
          const rw = Math.max(w, strokeW * 4)
          const rh = Math.max(h, strokeW * 4)
          const label = (c as ComponenteDB).tipo_componente ? TIPO_SHORT[(c as ComponenteDB).tipo_componente!] : '?'

          return (
            <g
              key={dbId}
              onClick={e => { e.stopPropagation(); onSelectComp(isSelected ? null : dbId) }}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={cx - rw / 2}
                y={cy - rh / 2}
                width={rw}
                height={rh}
                fill={`${color}22`}
                stroke={isSelected ? '#1c1c1e' : color}
                strokeWidth={isSelected ? strokeW * 2 : strokeW}
                rx={strokeW * 0.5}
              />
              {!identified && (
                <text x={cx} y={cy + fontSmall * 0.4} textAnchor="middle" fontSize={fontSmall * 1.2} fill={color}>?</text>
              )}
              {identified && label && (
                <text x={cx} y={cy + fontSmall * 0.4} textAnchor="middle" fontSize={fontSmall * 0.85} fill={color} fontWeight="500">
                  {label}
                </text>
              )}
            </g>
          )
        })}

        {/* ── Dimension annotations ── */}
        {allPts.length > 0 && totalW > 0 && totalH > 0 && (
          <g style={{ pointerEvents: 'none' }}>
            {/* Width dimension — below */}
            <line x1={minX} y1={maxY + dimOffset} x2={maxX} y2={maxY + dimOffset} stroke="#aaa" strokeWidth={strokeW * 0.6} />
            <line x1={minX} y1={maxY + dimOffset * 0.3} x2={minX} y2={maxY + dimOffset * 1.7} stroke="#aaa" strokeWidth={strokeW * 0.6} />
            <line x1={maxX} y1={maxY + dimOffset * 0.3} x2={maxX} y2={maxY + dimOffset * 1.7} stroke="#aaa" strokeWidth={strokeW * 0.6} />
            <text x={(minX + maxX) / 2} y={maxY + dimOffset * 2.2} textAnchor="middle" fontSize={fontSmall} fill="#888">
              {totalW.toFixed(2)} m
            </text>
            {/* Height dimension — right */}
            <line x1={maxX + dimOffset} y1={minY} x2={maxX + dimOffset} y2={maxY} stroke="#aaa" strokeWidth={strokeW * 0.6} />
            <line x1={maxX + dimOffset * 0.3} y1={minY} x2={maxX + dimOffset * 1.7} y2={minY} stroke="#aaa" strokeWidth={strokeW * 0.6} />
            <line x1={maxX + dimOffset * 0.3} y1={maxY} x2={maxX + dimOffset * 1.7} y2={maxY} stroke="#aaa" strokeWidth={strokeW * 0.6} />
            <text
              x={maxX + dimOffset * 2.8}
              y={(minY + maxY) / 2}
              textAnchor="middle"
              fontSize={fontSmall}
              fill="#888"
              transform={`rotate(90, ${maxX + dimOffset * 2.8}, ${(minY + maxY) / 2})`}
            >
              {totalH.toFixed(2)} m
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

// ─── ComponentDetail panel ────────────────────────────────────────────────────

function ComponentDetail({
  comp,
  catalogo,
  onClose,
  onSave,
}: {
  comp: ComponenteDB
  catalogo: CatalogEntry[]
  onClose: () => void
  onSave: (id: string, tipo: string) => void
}) {
  const [draftTipo, setDraftTipo] = useState(comp.tipo_componente ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(comp.id, draftTipo)
    setSaving(false)
  }

  const grouped = useMemo(() => {
    const m: Record<string, CatalogEntry[]> = {}
    for (const e of catalogo) {
      if (!m[e.categoria]) m[e.categoria] = []
      m[e.categoria].push(e)
    }
    return m
  }, [catalogo])

  const color = compColor(comp)
  const statusLabel = comp.status_identificacao ? STATUS_LABEL[comp.status_identificacao] : 'Pendente'

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', wordBreak: 'break-all', maxWidth: '80%' }}>
          {comp.nome_skp}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, flexShrink: 0 }}>
          <X size={13} />
        </button>
      </div>

      {/* Status badge */}
      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${color}18`, color, fontWeight: 600 }}>
          {statusLabel}
        </span>
        {comp.confianca != null && (
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>conf. {(comp.confianca * 100).toFixed(0)}%</span>
        )}
        {comp.fabricante && (
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{comp.fabricante}</span>
        )}
      </div>

      {/* AI reasoning */}
      {comp.raciocinio_ia && (
        <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 8, fontStyle: 'italic', lineHeight: 1.4 }}>
          &ldquo;{comp.raciocinio_ia}&rdquo;
        </div>
      )}

      {/* Position & dims */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 12, fontSize: 11, color: 'var(--text-3)' }}>
        <div>X: <strong style={{ color: 'var(--text-2)' }}>{comp.posicao_x.toFixed(2)}</strong></div>
        <div>Y: <strong style={{ color: 'var(--text-2)' }}>{comp.posicao_y.toFixed(2)}</strong></div>
        <div>Z: <strong style={{ color: 'var(--text-2)' }}>{comp.posicao_z.toFixed(2)}</strong></div>
        <div>Dims: <strong style={{ color: 'var(--text-2)' }}>{comp.dimensao_x.toFixed(2)}×{comp.dimensao_y.toFixed(2)}×{comp.dimensao_z.toFixed(2)}</strong></div>
      </div>

      {/* Manual type assignment */}
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Confirmar / corrigir tipo:</div>
      <select
        value={draftTipo}
        onChange={e => setDraftTipo(e.target.value)}
        style={{ width: '100%', fontSize: 11, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text)', marginBottom: 8, cursor: 'pointer' }}
      >
        <option value="">— não identificado —</option>
        {Object.entries(grouped).map(([catKey, entries]) => (
          <optgroup key={catKey} label={catKey.charAt(0).toUpperCase() + catKey.slice(1)}>
            {entries.map(e => (
              <option key={e.id} value={e.tipo_componente}>{e.nome}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{ width: '100%', fontSize: 11, padding: '6px', borderRadius: 6, background: 'var(--btn-bg)', border: 'none', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
      >
        {saving ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : null}
        Confirmar e aprender
      </button>
    </div>
  )
}

// ─── PranchaCard ─────────────────────────────────────────────────────────────

function PranchaCard({ prancha }: { prancha: PranchaRow }) {
  const [downloading, setDownloading] = useState(false)
  const discLabel: Record<string, string> = {
    mobiliario: 'Mobiliário', hidraulica: 'Hidráulica', gas: 'Gás', eletrica: 'Elétrica',
  }
  const discCor: Record<string, string> = {
    mobiliario: '#6b7280', hidraulica: '#1d4ed8', gas: '#d97706', eletrica: '#1a1a1a',
  }
  const cor = discCor[prancha.disciplina] ?? '#007AFF'

  async function handleDownload() {
    setDownloading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.storage.from('detalhamento').createSignedUrl(prancha.pdf_path, 120)
      if (data?.signedUrl) {
        const a = document.createElement('a')
        a.href = data.signedUrl
        a.download = `${prancha.numero_prancha}_${prancha.disciplina}.pdf`
        a.click()
      }
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg)', border: `1.5px solid ${cor}30`, borderRadius: 10, padding: '12px 14px', minWidth: 150, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: cor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {discLabel[prancha.disciplina] ?? prancha.disciplina}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{prancha.numero_prancha}</div>
      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
        {new Date(prancha.gerado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
      </div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11, padding: '5px 10px', borderRadius: 6, background: `${cor}12`, border: `1px solid ${cor}40`, color: cor, cursor: downloading ? 'not-allowed' : 'pointer', fontWeight: 600 }}
      >
        {downloading ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={10} />}
        Download PDF
      </button>
    </div>
  )
}

// ─── PontoTableRow ────────────────────────────────────────────────────────────

function PontoTableRow({
  ponto,
  editing,
  onEdit,
  onSave,
}: {
  ponto: PontoRow
  editing: boolean
  onEdit: () => void
  onSave: (fields: Partial<PontoRow>) => void
}) {
  const [altura, setAltura] = useState(ponto.altura_cm)
  const [statusVal, setStatusVal] = useState(ponto.status)
  const [desc, setDesc] = useState(ponto.descricao_tecnica ?? '')

  const statusCor: Record<string, string> = { novo: '#dc2626', reposicionar: '#2563eb', existente: '#6b7280' }
  const tipoCor = statusCor[ponto.status] ?? '#999'

  if (editing) {
    return (
      <tr style={{ background: 'rgba(0,122,255,0.04)', borderBottom: '1px solid var(--border)' }}>
        <td style={{ padding: '6px 8px', color: 'var(--text-2)' }}>{ponto.tipo_ponto.replace(/_/g, ' ')}</td>
        <td style={{ padding: '4px 8px', textAlign: 'center' }}>
          <input
            type="number"
            value={altura}
            onChange={e => setAltura(Number(e.target.value))}
            style={{ width: 60, textAlign: 'center', padding: '3px 5px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg)', color: 'var(--text)', fontSize: 11 }}
          />
        </td>
        <td style={{ padding: '4px 8px', textAlign: 'center' }}>
          <select
            value={statusVal}
            onChange={e => setStatusVal(e.target.value as PontoRow['status'])}
            style={{ fontSize: 11, padding: '3px 5px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer' }}
          >
            <option value="novo">Novo</option>
            <option value="reposicionar">Reposicionar</option>
            <option value="existente">Existente</option>
          </select>
        </td>
        <td style={{ padding: '4px 8px' }}>
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            style={{ width: '100%', padding: '3px 5px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg)', color: 'var(--text)', fontSize: 11 }}
          />
        </td>
        <td style={{ padding: '4px 8px', textAlign: 'center' }}>
          <button
            onClick={() => onSave({ altura_cm: altura, status: statusVal, descricao_tecnica: desc || null })}
            style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: 'var(--btn-bg)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          >
            OK
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}>
      <td style={{ padding: '5px 8px', color: 'var(--text-2)' }}>{ponto.tipo_ponto.replace(/_/g, ' ')}</td>
      <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 600, color: 'var(--text)' }}>{ponto.altura_cm}</td>
      <td style={{ padding: '5px 8px', textAlign: 'center' }}>
        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: `${tipoCor}15`, color: tipoCor, fontWeight: 600 }}>
          {ponto.status}
        </span>
      </td>
      <td style={{ padding: '5px 8px', color: 'var(--text-3)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {ponto.descricao_tecnica ?? '—'}
      </td>
      <td style={{ padding: '5px 8px', textAlign: 'center' }}>
        <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2 }}>
          <Settings2 size={11} />
        </button>
      </td>
    </tr>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props { projectId: string; escritorioId: string | null; canEdit: boolean; nomeProjeto?: string }

export default function DetalhamentoProjeto({ projectId, escritorioId, canEdit, nomeProjeto }: Props) {
  // DB state
  const [dbDet, setDbDet] = useState<DetalhamentoDB | null>(null)
  const [dbComps, setDbComps] = useState<ComponenteDB[]>([])
  const [dbComodos, setDbComodos] = useState<ComodoDBRow[]>([])
  const [catalogo, setCatalogo] = useState<CatalogEntry[]>([])
  const [loadingDb, setLoadingDb] = useState(true)

  // Pranchas state
  const [pontos, setPontos] = useState<PontoRow[]>([])
  const [pranchas, setPranchas] = useState<PranchaRow[]>([])
  const [pontosResume, setPontosResume] = useState<Record<string, number> | null>(null)
  const [gerandoPontos, setGerandoPontos] = useState(false)
  const [gerandoPDF, setGerandoPDF] = useState<string | null>(null)
  const [pontosTab, setPontosTab] = useState<string>('eletrica')
  const [editingPontoId, setEditingPontoId] = useState<string | null>(null)

  // Parse / upload state
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<ParseStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [parsedComps, setParsedComps] = useState<ParsedComponent[]>([])
  const [parsedComodos, setParsedComodos] = useState<ParsedComodo[]>([])
  const [parsedUpAxis, setParsedUpAxis] = useState<string>('Y_UP')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // UI state
  const [filterCat, setFilterCat] = useState<Categoria>('todos')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [identificando, setIdentificando] = useState(false)
  const [iaResult, setIaResult] = useState<{ atualizados: number; chamadas_api: number } | null>(null)
  const [reprocessando, setReprocessando] = useState(false)

  const loadPontos = useCallback(async (detId: string) => {
    const res = await fetch(`/api/projetos/detalhamento/${detId}/pontos`)
    if (res.ok) {
      const data = await res.json()
      setPontos(data)
      const resume: Record<string, number> = {}
      for (const p of data as PontoRow[]) resume[p.disciplina] = (resume[p.disciplina] ?? 0) + 1
      setPontosResume(Object.keys(resume).length > 0 ? resume : null)
    }
  }, [])

  const loadPranchas = useCallback(async (detId: string) => {
    const res = await fetch(`/api/projetos/detalhamento/${detId}/pranchas`)
    if (res.ok) setPranchas(await res.json())
  }, [])

  const loadDb = useCallback(async () => {
    setLoadingDb(true)
    const res = await fetch(`/api/projetos/detalhamento?projeto_id=${projectId}`)
    const data = await res.json()
    const det = data.detalhamento ?? null
    setDbDet(det)
    setDbComps(data.componentes ?? [])
    setDbComodos(data.comodos ?? [])
    setCatalogo(data.catalogo ?? [])
    setLoadingDb(false)
    if (det?.id) {
      loadPontos(det.id)
      loadPranchas(det.id)
    }
  }, [projectId, loadPontos, loadPranchas])

  useEffect(() => { loadDb() }, [loadDb])

  // ── File handling ──
  async function handleFile(f: File) {
    if (!f.name.toLowerCase().endsWith('.dae')) {
      setErrorMsg('Arquivo deve ter extensão .dae'); setStatus('error'); return
    }
    setFile(f); setStatus('reading'); setErrorMsg('')
    try {
      const text = await readAsText(f)
      setStatus('parsing')
      await nextFrame()
      const result = parseCollada(text)
      setParsedComps(result.componentes)
      setParsedComodos(result.comodos)
      setParsedUpAxis(result.up_axis)
      setStatus('ready')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erro ao ler arquivo')
      setStatus('error')
    }
  }

  // ── Save ──
  async function handleSave() {
    if (!file || !escritorioId) return
    setStatus('uploading'); setErrorMsg('')
    const supabase = createClient()
    const safeName = file.name.replace(/[^a-zA-Z0-9._\-]/g, '_')
    const path = `${escritorioId}/${projectId}/${Date.now()}_${safeName}`
    const { error: upErr } = await supabase.storage.from('detalhamento').upload(path, file, { upsert: true })
    if (upErr) { setErrorMsg(`Erro no upload: ${upErr.message}`); setStatus('error'); return }
    setStatus('saving')
    const res = await fetch('/api/projetos/detalhamento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projeto_id: projectId, escritorio_id: escritorioId, file_path: path, file_name: file.name, componentes: parsedComps, comodos: parsedComodos, up_axis: parsedUpAxis }),
    })
    if (!res.ok) { const err = await res.json(); setErrorMsg(err.error || 'Erro ao salvar'); setStatus('error'); return }
    const saved = await res.json()
    setStatus('done'); setFile(null); setParsedComps([]); setParsedComodos([])
    await loadDb()
    // Trigger Vision AI identification for remaining unknowns
    if (saved.id) triggerIdentificar(saved.id)
  }

  async function triggerIdentificar(detalhamentoId: string) {
    setIdentificando(true); setIaResult(null)
    try {
      const res = await fetch('/api/projetos/detalhamento/identificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detalhamento_id: detalhamentoId }),
      })
      if (res.ok) {
        const data = await res.json()
        setIaResult({ atualizados: data.atualizados ?? 0, chamadas_api: data.chamadas_api ?? 0 })
        if ((data.atualizados ?? 0) > 0) await loadDb()
      }
    } finally {
      setIdentificando(false)
    }
  }

  // ── Manual type update — confirm + teach ──
  async function handleSaveTipo(compId: string, tipo: string) {
    const comp = dbComps.find(c => c.id === compId)
    const statusNew = tipo ? 'confirmado' : null
    setDbComps(prev => prev.map(c => c.id === compId
      ? { ...c, tipo_componente: tipo || null, status_identificacao: statusNew }
      : c
    ))
    setSelectedId(null)
    await fetch('/api/projetos/detalhamento', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: compId,
        tipo: 'componente',
        tipo_componente: tipo || null,
        status_identificacao: statusNew,
        escritorio_id: escritorioId,
        dimensao_x: comp?.dimensao_x,
        dimensao_y: comp?.dimensao_y,
        dimensao_z: comp?.dimensao_z,
      }),
    })
  }

  // ── Pranchas: apply rules ──
  async function handleGerarPontos(): Promise<string | null> {
    if (!dbDet) return null
    setGerandoPontos(true)
    try {
      const res = await fetch(`/api/projetos/detalhamento/${dbDet.id}/gerar-pontos`, { method: 'POST' })
      if (!res.ok) return null
      const data = await res.json()
      await loadPontos(dbDet.id)
      setPontosResume(data.por_disciplina ?? null)
      return dbDet.id
    } finally {
      setGerandoPontos(false)
    }
  }

  // ── Pranchas: generate PDFs client-side ──
  async function handleGerarPDFs() {
    if (!dbDet || !escritorioId) return
    const supabase = createClient()
    const upAxis = dbDet.up_axis ?? 'Y_UP'
    const hoje = new Date().toLocaleDateString('pt-BR')
    const nomeProj = nomeProjeto ?? dbDet.dae_file_name ?? 'Projeto'

    const discWithPoints = DISC_ORDER.filter(d => pontos.some(p => p.disciplina === d))

    for (const disc of discWithPoints) {
      setGerandoPDF(disc)
      try {
        const svgString = renderPrancha({
          nome_projeto: nomeProj,
          disciplina: disc,
          numero_prancha: PRANCHA_NUMEROS[disc] ?? disc,
          data: hoje,
          comodos: dbComodos.map(r => ({ ...r, polygon: r.polygon ?? [] })),
          componentes: dbComps,
          pontos,
          up_axis: upAxis,
        })

        // SVG → PDF (dynamic import — client only)
        const pdfBlob = await svgStringToPdf(svgString)

        const path = `${escritorioId}/${projectId}/${dbDet.id}/prancha_${disc}.pdf`
        await supabase.storage.from('detalhamento').upload(path, pdfBlob, {
          upsert: true,
          contentType: 'application/pdf',
        })

        await fetch(`/api/projetos/detalhamento/${dbDet.id}/pranchas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ disciplina: disc, numero_prancha: PRANCHA_NUMEROS[disc] ?? disc, pdf_path: path }),
        })
      } catch (e) {
        console.error(`Erro ao gerar prancha ${disc}:`, e)
      }
    }
    setGerandoPDF(null)
    await loadPranchas(dbDet.id)
  }

  async function handleGerarTudo() {
    const detId = await handleGerarPontos()
    if (detId) await handleGerarPDFs()
  }

  async function handleUpdatePonto(pontoId: string, fields: Partial<PontoRow>) {
    if (!dbDet) return
    setPontos(prev => prev.map(p => p.id === pontoId ? { ...p, ...fields } : p))
    await fetch(`/api/projetos/detalhamento/${dbDet.id}/pontos`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ponto_id: pontoId, ...fields }),
    })
  }

  // ── Reprocessar: re-download existing DAE and re-run full pipeline ──
  async function handleReprocessar() {
    if (!dbDet || !escritorioId) return
    setReprocessando(true); setStatus('reading'); setErrorMsg('')
    try {
      const supabase = createClient()
      const { data: urlData } = await supabase.storage.from('detalhamento').createSignedUrl(dbDet.dae_file_path, 120)
      if (!urlData?.signedUrl) throw new Error('Não foi possível obter URL do arquivo .dae')

      const resp = await fetch(urlData.signedUrl)
      if (!resp.ok) throw new Error('Falha ao baixar arquivo .dae')
      const text = await resp.text()

      setStatus('parsing')
      await nextFrame()
      const result = parseCollada(text)

      setStatus('saving')
      const res = await fetch('/api/projetos/detalhamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projeto_id: projectId,
          escritorio_id: escritorioId,
          file_path: dbDet.dae_file_path,
          file_name: dbDet.dae_file_name,
          componentes: result.componentes,
          comodos: result.comodos,
          up_axis: result.up_axis,
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erro ao salvar') }
      const saved = await res.json()
      setStatus('done')
      await loadDb()
      if (saved.id) triggerIdentificar(saved.id)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erro ao reprocessar')
      setStatus('error')
    } finally {
      setReprocessando(false)
    }
  }

  // ── Derived ──
  const showParsed = status === 'ready' || status === 'uploading' || status === 'saving'
  const activeComps = (showParsed ? parsedComps : dbComps) as (ComponenteDB | ParsedComponent)[]
  const activeComodos = (showParsed ? parsedComodos : dbComodos) as (ComodoDBRow | ParsedComodo)[]
  const upAxis = showParsed ? parsedUpAxis : (dbDet?.up_axis ?? 'Y_UP')
  const hasData = (dbDet?.status === 'done') || showParsed

  const selectedComp = selectedId ? dbComps.find(c => c.id === selectedId) ?? null : null

  const unidentified = (dbComps as ComponenteDB[]).filter(c => !c.tipo_componente)
  const pendingValidation = useMemo(
    () => dbComps.filter(isPendingValidation).sort((a, b) => (a.confianca ?? -1) - (b.confianca ?? -1)),
    [dbComps]
  )
  const countCat = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of dbComps) {
      const cat = compCategory(c)
      m[cat] = (m[cat] ?? 0) + 1
    }
    return m
  }, [dbComps])

  // ── Loading ──
  if (loadingDb) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 10, color: 'var(--text-3)', fontSize: 13 }}>
        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Carregando detalhamento...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Upload bar ── */}
      {canEdit && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {dbDet && !showParsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, padding: '8px 12px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, fontSize: 12 }}>
              <CheckCircle2 size={13} color="#059669" />
              <span style={{ color: 'var(--text-2)' }}>
                <strong>{dbDet.dae_file_name}</strong>
                {' · '}{dbComps.length} comp. ({unidentified.length} não identif.{pendingValidation.length > 0 ? `, ${pendingValidation.length} pend.` : ''}) · {dbComodos.length} cômodos
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <button
                  onClick={handleReprocessar}
                  disabled={reprocessando}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '4px 10px', borderRadius: 5, background: '#007AFF', border: 'none', color: '#fff', cursor: reprocessando ? 'not-allowed' : 'pointer', opacity: reprocessando ? 0.7 : 1 }}>
                  {reprocessando ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={10} />}
                  Reprocessar
                </button>
                <button onClick={() => fileInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '4px 10px', borderRadius: 5, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}>
                  <Upload size={10} /> Novo arquivo
                </button>
              </div>
            </div>
          ) : !showParsed ? (
            <div
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              style={{ flex: 1, border: `2px dashed ${dragOver ? '#007AFF' : 'var(--border)'}`, borderRadius: 10, padding: '32px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(0,122,255,0.04)' : 'var(--bg-card)', transition: 'all 0.15s' }}>
              <Upload size={22} color={dragOver ? '#007AFF' : '#c7c7cc'} style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>Arraste o arquivo .dae aqui</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>ou clique para selecionar · máx. 200 MB</div>
            </div>
          ) : null}
          <input ref={fileInputRef} type="file" accept=".dae" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      )}

      {/* ── Processing states ── */}
      {(status === 'reading' || status === 'parsing' || status === 'uploading' || status === 'saving') && (
        <div style={{ padding: '20px 24px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
          <Loader2 size={20} color="#007AFF" style={{ margin: '0 auto 8px', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
            {status === 'reading' ? 'Lendo arquivo...' : status === 'parsing' ? 'Processando geometria COLLADA...' : status === 'uploading' ? `Enviando ${file ? fmtSize(file.size) : ''}...` : 'Salvando...'}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {status === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}>
          <AlertCircle size={14} color="#ef4444" />
          <span style={{ flex: 1, fontSize: 12, color: 'var(--text-2)' }}>{errorMsg}</span>
          <button onClick={() => setStatus('idle')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={12} /></button>
        </div>
      )}

      {/* ── Vision AI banner ── */}
      {identificando && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 8 }}>
          <Sparkles size={13} color="#d97706" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>Identificando componentes com IA...</span>
          <Loader2 size={12} color="#d97706" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
        </div>
      )}
      {!identificando && iaResult && iaResult.atualizados > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(5,150,105,0.07)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 8 }}>
          <Sparkles size={13} color="#059669" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
            IA identificou <strong>{iaResult.atualizados}</strong> componentes ({iaResult.chamadas_api} chamadas)
          </span>
          <button onClick={() => setIaResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, marginLeft: 'auto' }}><X size={11} /></button>
        </div>
      )}

      {/* ── Parsed confirm bar ── */}
      {status === 'ready' && file && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.18)', borderRadius: 8 }}>
          <span style={{ flex: 1, fontSize: 12, color: 'var(--text-2)' }}>
            <strong>{file.name}</strong> · {fmtSize(file.size)} · <span style={{ color: '#007AFF' }}>{parsedComps.length} componentes</span> · {parsedComodos.length} cômodos
          </span>
          <button onClick={() => { setStatus('idle'); setFile(null) }} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleSave} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 6, background: 'var(--btn-bg)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Confirmar e Salvar</button>
        </div>
      )}

      {/* ── Main view: floor plan + sidebar ── */}
      {hasData && (
        <div style={{ display: 'flex', gap: 14, height: 600 }}>

          {/* Floor plan SVG */}
          <div style={{ flex: 1, minWidth: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
            <FloorPlanSVG
              comodos={activeComodos}
              componentes={activeComps}
              upAxis={upAxis}
              filterCat={filterCat}
              selectedId={selectedId}
              onSelectComp={setSelectedId}
            />
          </div>

          {/* Right sidebar */}
          <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>

            {/* Category filters */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Filtrar por categoria
              </div>
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {CATEGORIAS.map(cat => {
                  const count = cat === 'todos' ? dbComps.length
                    : cat === 'nao_identificado' ? (countCat.nao_identificado ?? 0)
                    : cat === 'pendentes' ? pendingValidation.length
                    : (countCat[cat] ?? 0)
                  const active = filterCat === cat
                  const color = CAT_COLOR[cat]
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilterCat(cat)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 6, border: 'none', background: active ? `${color}14` : 'transparent', color: active ? color : 'var(--text-2)', cursor: 'pointer', fontSize: 11, fontWeight: active ? 600 : 400, transition: 'background 0.1s' }}
                    >
                      <span>{CAT_LABEL[cat]}</span>
                      {count > 0 && <span style={{ fontSize: 10, background: active ? `${color}25` : 'var(--bg)', color: active ? color : 'var(--text-3)', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>{count}</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Unidentified list */}
            {filterCat === 'nao_identificado' && unidentified.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontSize: 10, color: '#f97316', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AlertTriangle size={10} /> Não identificados ({unidentified.length})
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {unidentified.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '6px 10px', background: c.id === selectedId ? 'rgba(249,115,22,0.08)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                    >
                      <AlertTriangle size={10} color="#f97316" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome_skp}</span>
                      <ChevronRight size={10} color="#c7c7cc" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pending validation list (vision_ai + duvidoso) */}
            {filterCat === 'pendentes' && pendingValidation.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontSize: 10, color: '#d97706', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Sparkles size={10} /> Pendentes de validação ({pendingValidation.length})
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {pendingValidation.map(c => {
                    const clr = compColor(c)
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '6px 10px', background: c.id === selectedId ? `${clr}10` : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                      >
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: clr, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{c.nome_skp}</span>
                        {c.confianca != null && (
                          <span style={{ fontSize: 9, color: clr, fontWeight: 600, flexShrink: 0 }}>{(c.confianca * 100).toFixed(0)}%</span>
                        )}
                        <ChevronRight size={10} color="#c7c7cc" style={{ flexShrink: 0 }} />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Selected component detail */}
            {selectedComp && (
              <ComponentDetail
                comp={selectedComp}
                catalogo={catalogo}
                onClose={() => setSelectedId(null)}
                onSave={handleSaveTipo}
              />
            )}

            {/* Legend */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Identificação</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {Object.entries(STATUS_LABEL).map(([k, label]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLOR[k], flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-2)' }}>{label}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-2)' }}>Não identif.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, marginTop: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: 'white', border: '1.5px solid #1c1c1e', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-2)' }}>Cômodo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pranchas técnicas ── */}
      {hasData && dbDet && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={14} color="#007AFF" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Pranchas Técnicas</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {pontos.length > 0 && (
                <button
                  onClick={handleGerarPDFs}
                  disabled={!!gerandoPDF || gerandoPontos}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 11px', borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: (gerandoPDF || gerandoPontos) ? 'not-allowed' : 'pointer', fontWeight: 500 }}
                >
                  {gerandoPDF ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={10} />}
                  Regenerar PDFs
                </button>
              )}
              <button
                onClick={handleGerarTudo}
                disabled={gerandoPontos || !!gerandoPDF}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 12px', borderRadius: 6, background: 'var(--btn-bg)', border: 'none', color: '#fff', cursor: (gerandoPontos || gerandoPDF) ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >
                {(gerandoPontos || gerandoPDF) ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={10} />}
                Gerar pranchas
              </button>
            </div>
          </div>

          {/* Summary */}
          {pontosResume && (
            <div style={{ padding: '8px 16px', background: 'rgba(0,122,255,0.04)', display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, borderBottom: '1px solid var(--border)' }}>
              {DISC_ORDER.filter(d => pontosResume[d]).map(d => (
                <span key={d} style={{ color: 'var(--text-2)' }}>
                  <strong style={{ color: '#007AFF' }}>{pontosResume[d]}</strong> pts {DISC_LABEL_PT[d] ?? d}
                </span>
              ))}
            </div>
          )}

          {/* Progress */}
          {(gerandoPontos || gerandoPDF) && (
            <div style={{ padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>
              <Loader2 size={12} color="#007AFF" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              {gerandoPontos ? 'Aplicando regras técnicas...' : `Gerando PDF — ${DISC_LABEL_PT[gerandoPDF!] ?? gerandoPDF}...`}
            </div>
          )}

          {/* Generated PDFs */}
          {pranchas.length > 0 && (
            <div style={{ padding: '14px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', borderBottom: pontos.length > 0 ? '1px solid var(--border)' : 'none' }}>
              {pranchas.map(p => (
                <PranchaCard key={p.id} prancha={p} />
              ))}
            </div>
          )}

          {/* Pontos table */}
          {pontos.length > 0 && (
            <div style={{ padding: 16 }}>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
                {DISC_ORDER.filter(d => pontos.some(p => p.disciplina === d)).map(d => (
                  <button
                    key={d}
                    onClick={() => setPontosTab(d)}
                    style={{ padding: '5px 12px', fontSize: 11, fontWeight: pontosTab === d ? 700 : 400, color: pontosTab === d ? '#007AFF' : 'var(--text-3)', background: 'none', border: 'none', borderBottom: pontosTab === d ? '2px solid #007AFF' : '2px solid transparent', cursor: 'pointer', marginBottom: -1 }}
                  >
                    {DISC_LABEL_PT[d]} ({pontos.filter(p => p.disciplina === d).length})
                  </button>
                ))}
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 600 }}>Tipo</th>
                      <th style={{ padding: '5px 8px', textAlign: 'center', color: 'var(--text-3)', fontWeight: 600 }}>Altura (cm)</th>
                      <th style={{ padding: '5px 8px', textAlign: 'center', color: 'var(--text-3)', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 600 }}>Descrição técnica</th>
                      <th style={{ padding: '5px 8px', width: 28 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pontos.filter(p => p.disciplina === pontosTab).map(ponto => (
                      <PontoTableRow
                        key={ponto.id}
                        ponto={ponto}
                        editing={editingPontoId === ponto.id}
                        onEdit={() => setEditingPontoId(ponto.id === editingPontoId ? null : ponto.id)}
                        onSave={fields => { handleUpdatePonto(ponto.id, fields); setEditingPontoId(null) }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!gerandoPontos && !gerandoPDF && pontos.length === 0 && (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
              Clique em &ldquo;Gerar pranchas&rdquo; para aplicar as regras técnicas e gerar os PDFs.
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {!hasData && status === 'idle' && !loadingDb && (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📐</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Nenhum detalhamento importado</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Exporte o modelo no SketchUp como .dae e faça o upload acima</div>
        </div>
      )}
    </div>
  )
}
