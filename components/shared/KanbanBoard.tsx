'use client'

import { useRef, useState } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay,
  PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable,
} from '@dnd-kit/core'
import { Clock, CheckSquare, FolderOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'

export const KANBAN_STAGES = [
  'Atendimento', 'Reunião', 'Briefing', '3D', 'Alt. 3D', 'Detalhamento', 'Orçamento', 'Execução',
]
const STAGE_COLORS = ['#8b5cf6', '#007AFF', '#34d399', '#4f9cf9', '#f59e0b', '#f97316', '#ef4444', '#10b981']

export interface KanbanProjeto {
  id: string
  nome: string
  tipo: string | null
  etapa_atual: string | null
  status: string
  cover_url: string | null
  cliente_nome: string | null
  iniciado_em?: string | null
  subtarefas_pendentes?: number
}

export function diasDesde(iso: string | null | undefined): number | null {
  if (!iso) return null
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  return d >= 0 ? d : null
}

function normalizeEtapa(etapa: string | null | undefined): string {
  const e = (etapa ?? 'Atendimento').trim()
  const norm: Record<string, string> = {
    'Alteração 3D': 'Alt. 3D', 'alteracao 3d': 'Alt. 3D', 'alt 3d': 'Alt. 3D',
    'reuniao': 'Reunião', 'Reuniao': 'Reunião',
    'orcamento': 'Orçamento', 'Orcamento': 'Orçamento',
    'execucao': 'Execução', 'Execucao': 'Execução',
    'briefing': 'Briefing', '3d': '3D',
    'atendimento': 'Atendimento', 'detalhamento': 'Detalhamento',
    'alt_3d': 'Alt. 3D',
  }
  return norm[e] ?? e
}

function TempoTag({ days }: { days: number | null }) {
  if (days === null) return null
  const color = days <= 7 ? '#10b981' : days <= 14 ? '#f59e0b' : '#ef4444'
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 6, background: color + '1a', color, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <Clock size={9} />
      {days}d
    </span>
  )
}

function CardContent({ proj }: { proj: KanbanProjeto }) {
  const days = diasDesde(proj.iniciado_em)
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
      overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', userSelect: 'none',
    }}>
      {proj.cover_url && (
        <div style={{ height: 56, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
          <img src={proj.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%)' }} />
        </div>
      )}
      {!proj.cover_url && (
        <div style={{ height: 32, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FolderOpen size={14} color="var(--text-3)" />
        </div>
      )}
      <div style={{ padding: '7px 10px 8px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
          {proj.nome}
        </div>
        {proj.cliente_nome && (
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {proj.cliente_nome}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          <TempoTag days={days} />
          {(proj.subtarefas_pendentes ?? 0) > 0 && (
            <span style={{ fontSize: 9.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckSquare size={9} />
              {proj.subtarefas_pendentes}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function DraggableCard({ proj, draggingId }: { proj: KanbanProjeto; draggingId: string | null }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: proj.id })
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
    opacity: draggingId === proj.id ? 0.4 : 1,
    cursor: 'grab',
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => { if (!draggingId) router.push(`/arquiteto/projetos/${proj.id}`) }}
    >
      <CardContent proj={proj} />
    </div>
  )
}

function DroppableColumn({ stage, projetos, stageColor, draggingId }: {
  stage: string
  projetos: KanbanProjeto[]
  stageColor: string
  draggingId: string | null
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  return (
    <div
      ref={setNodeRef}
      style={{
        minWidth: 210, width: 210, display: 'flex', flexDirection: 'column',
        background: isOver ? stageColor + '0a' : 'var(--bg)',
        borderRadius: 12,
        border: `1.5px solid ${isOver ? stageColor + '60' : 'var(--border)'}`,
        transition: 'background 0.15s, border-color 0.15s',
        overflow: 'hidden', flexShrink: 0,
      }}
    >
      <div style={{ padding: '9px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${stageColor}` }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: stageColor, letterSpacing: '0.04em' }}>{stage}</span>
        <span style={{ fontSize: 9.5, fontWeight: 600, color: stageColor, background: stageColor + '1a', borderRadius: 10, padding: '1px 6px' }}>
          {projetos.length}
        </span>
      </div>
      <div style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 60 }}>
        {projetos.map(p => <DraggableCard key={p.id} proj={p} draggingId={draggingId} />)}
        {projetos.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 10.5, padding: '12px 0', textAlign: 'center', minHeight: 40 }}>
            Vazio
          </div>
        )}
      </div>
    </div>
  )
}

interface KanbanBoardProps {
  projetos: KanbanProjeto[]
  onMove: (projetoId: string, novaEtapa: string) => Promise<void>
  filtroBusca?: string
  filtroStatus?: string
  filtroTipo?: string
}

export default function KanbanBoard({ projetos, onMove, filtroBusca, filtroStatus, filtroTipo }: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const didDragRef = useRef(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const filtered = projetos.filter(p => {
    if (filtroStatus && filtroStatus !== 'todos' && p.status !== filtroStatus) return false
    if (filtroTipo && filtroTipo !== 'todos' && (p.tipo ?? '') !== filtroTipo) return false
    if (filtroBusca) {
      const q = filtroBusca.toLowerCase()
      if (!p.nome.toLowerCase().includes(q) && !(p.cliente_nome ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const byStage: Record<string, KanbanProjeto[]> = {}
  for (const stage of KANBAN_STAGES) byStage[stage] = []
  for (const p of filtered) {
    const norm = normalizeEtapa(p.etapa_atual)
    const col = KANBAN_STAGES.find(s => s === norm) ?? KANBAN_STAGES[0]
    byStage[col].push(p)
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setDraggingId(null)
    if (!over || !didDragRef.current) return
    const novaEtapa = over.id as string
    const proj = projetos.find(p => p.id === active.id)
    if (!proj || normalizeEtapa(proj.etapa_atual) === novaEtapa) return
    await onMove(active.id as string, novaEtapa)
  }

  const activeProj = projetos.find(p => p.id === draggingId)

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => { setDraggingId(active.id as string); didDragRef.current = false }}
      onDragMove={() => { didDragRef.current = true }}
      onDragEnd={handleDragEnd}
      onDragCancel={() => { setDraggingId(null); didDragRef.current = false }}
    >
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 12 }}>
        {KANBAN_STAGES.map((stage, idx) => (
          <DroppableColumn
            key={stage}
            stage={stage}
            projetos={byStage[stage]}
            stageColor={STAGE_COLORS[idx]}
            draggingId={draggingId}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeProj && (
          <div style={{ width: 210, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', borderRadius: 10, transform: 'scale(1.02)', pointerEvents: 'none' }}>
            <CardContent proj={activeProj} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
