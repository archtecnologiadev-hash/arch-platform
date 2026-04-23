'use client'

import { useState } from 'react'
import { Plus, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type EventType =
  | 'arquiteto'
  | 'marceneiro'
  | 'eletricista'
  | 'vidracaria'
  | 'pintor'
  | 'gesseiro'

export interface CalendarioEvent {
  id: number
  type: EventType
  title: string
  provider: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  note?: string
}

interface CalendarioObraProps {
  events: CalendarioEvent[]
  readonly?: boolean
  onEventAdd?: (event: Omit<CalendarioEvent, 'id'>) => void
  onEventEdit?: (event: CalendarioEvent) => void
  onEventDelete?: (id: number) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const EVENT_META: Record<EventType, { color: string; bg: string; label: string }> = {
  arquiteto:   { color: '#b45309', bg: '#fef3c7', label: 'Arquiteto / Reunião' },
  marceneiro:  { color: '#1d4ed8', bg: '#dbeafe', label: 'Marceneiro' },
  eletricista: { color: '#065f46', bg: '#d1fae5', label: 'Eletricista' },
  vidracaria:  { color: '#6d28d9', bg: '#ede9fe', label: 'Vidraçaria' },
  pintor:      { color: '#b91c1c', bg: '#fee2e2', label: 'Pintor' },
  gesseiro:    { color: '#c2410c', bg: '#ffedd5', label: 'Gesseiro' },
}

const EVENT_TYPES = Object.keys(EVENT_META) as EventType[]

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function eventsForDay(all: CalendarioEvent[], year: number, month: number, day: number) {
  const d = toDateStr(year, month, day)
  return all.filter((e) => e.startDate <= d && e.endDate >= d)
}

const blankForm = {
  type: 'arquiteto' as EventType,
  title: '',
  provider: '',
  startDate: '',
  endDate: '',
  startTime: '08:00',
  endTime: '17:00',
  note: '',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CalendarioObra({
  events,
  readonly = false,
  onEventAdd,
  onEventEdit,
  onEventDelete,
}: CalendarioObraProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...blankForm })

  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate())

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7

  const goPrev = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }
  const goNext = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  function openCreate(dateStr?: string) {
    setForm({ ...blankForm, startDate: dateStr ?? '', endDate: dateStr ?? '' })
    setModalMode('create')
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(ev: CalendarioEvent) {
    setForm({
      type: ev.type,
      title: ev.title,
      provider: ev.provider ?? '',
      startDate: ev.startDate,
      endDate: ev.endDate,
      startTime: ev.startTime ?? '08:00',
      endTime: ev.endTime ?? '17:00',
      note: ev.note ?? '',
    })
    setModalMode('edit')
    setEditingId(ev.id)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingId(null)
  }

  function submit() {
    if (!form.title.trim() || !form.startDate || !form.endDate) return
    if (modalMode === 'create') {
      onEventAdd?.({ ...form })
    } else if (modalMode === 'edit' && editingId !== null) {
      onEventEdit?.({ ...form, id: editingId })
    }
    closeModal()
  }

  function handleDelete() {
    if (editingId !== null) {
      onEventDelete?.(editingId)
      closeModal()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <style>{`
        .cal-day { cursor: ${readonly ? 'default' : 'pointer'}; }
        .cal-day:hover { background: ${readonly ? '#ffffff' : '#f2f2f7'} !important; }
        .cal-chip { transition: opacity 0.12s; cursor: ${readonly ? 'default' : 'pointer'}; }
        .cal-chip:hover { opacity: ${readonly ? '1' : '0.75'}; }
        .cal-nav:hover { background: #e5e5ea !important; }
        .cal-pill { cursor: pointer; transition: all 0.15s; }
        .cal-pill:hover { filter: brightness(0.95); }
        .cal-inp {
          width: 100%;
          background: #f2f2f7;
          border: 1px solid #e5e5ea;
          border-radius: 10px;
          padding: 10px 13px;
          color: #1c1c1e;
          font-size: 13px;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .cal-inp:focus {
          border-color: #007AFF;
          box-shadow: 0 0 0 3px rgba(0,122,255,0.12);
          background: #fff;
        }
        .cal-inp::placeholder { color: #aeaeb2; }
        .cal-inp[type="date"],
        .cal-inp[type="time"] { color-scheme: light; }
      `}</style>

      {/* ── Legenda ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 20px',
          padding: '12px 16px',
          background: '#ffffff',
          border: '1px solid #e5e5ea',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        }}
      >
        {EVENT_TYPES.map((t) => {
          const meta = EVENT_META[t]
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: meta.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, color: '#3a3a3c', fontWeight: 500 }}>{meta.label}</span>
            </div>
          )
        })}
      </div>

      {/* ── Nav bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="cal-nav"
            onClick={goPrev}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#f2f2f7',
              border: '1px solid #e5e5ea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#3a3a3c',
              transition: 'background 0.15s',
            }}
          >
            <ChevronLeft size={15} />
          </button>

          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#1c1c1e',
              minWidth: 176,
              textAlign: 'center',
              letterSpacing: '-0.01em',
            }}
          >
            {MONTHS[month]} {year}
          </span>

          <button
            className="cal-nav"
            onClick={goNext}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#f2f2f7',
              border: '1px solid #e5e5ea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#3a3a3c',
              transition: 'background 0.15s',
            }}
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {!readonly && (
          <button
            onClick={() => openCreate(todayStr)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              background: '#007AFF',
              border: 'none',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Plus size={13} />
            Adicionar evento
          </button>
        )}
      </div>

      {/* ── Grade do calendário ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e5ea',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        }}
      >
        {/* Cabeçalho dos dias da semana */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: '1px solid #e5e5ea',
            background: '#f9f9fb',
          }}
        >
          {WEEKDAYS.map((wd, i) => (
            <div
              key={wd}
              style={{
                padding: '9px 0',
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: i === 0 || i === 6 ? '#aeaeb2' : '#8e8e93',
                borderRight: i < 6 ? '1px solid #e5e5ea' : 'none',
              }}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Células dos dias */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {Array.from({ length: totalCells }).map((_, idx) => {
            const day = idx - firstDay + 1
            const valid = day >= 1 && day <= daysInMonth
            const dStr = valid ? toDateStr(year, month, day) : ''
            const isToday = dStr === todayStr
            const dayEvs = valid ? eventsForDay(events, year, month, day) : []
            const col = idx % 7
            const row = Math.floor(idx / 7)
            const lastRow = row === Math.floor((totalCells - 1) / 7)
            const weekend = col === 0 || col === 6

            return (
              <div
                key={idx}
                className={valid ? 'cal-day' : ''}
                onClick={valid && !readonly ? () => openCreate(dStr) : undefined}
                style={{
                  minHeight: 92,
                  padding: '7px 6px 5px',
                  borderRight: col < 6 ? '1px solid #e5e5ea' : 'none',
                  borderBottom: lastRow ? 'none' : '1px solid #e5e5ea',
                  background: valid ? '#ffffff' : '#f9f9fb',
                  transition: 'background 0.12s',
                }}
              >
                {valid && (
                  <>
                    {/* Número do dia */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        fontSize: 12,
                        fontWeight: isToday ? 700 : 400,
                        color: isToday ? '#ffffff' : weekend ? '#aeaeb2' : '#1c1c1e',
                        background: isToday ? '#007AFF' : 'transparent',
                        marginBottom: 4,
                      }}
                    >
                      {day}
                    </div>

                    {/* Chips de eventos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {dayEvs.map((ev) => {
                        const meta = EVENT_META[ev.type]
                        const isStart = ev.startDate === dStr
                        return (
                          <div
                            key={ev.id}
                            className="cal-chip"
                            title={`${ev.title} · ${ev.provider}${ev.startTime ? ` · ${ev.startTime}` : ''}`}
                            onClick={!readonly ? (e) => { e.stopPropagation(); openEdit(ev) } : undefined}
                            style={{
                              borderLeft: `3px solid ${meta.color}`,
                              background: meta.bg,
                              borderRadius: '0 4px 4px 0',
                              padding: '2px 5px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: meta.color,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {ev.title}
                            </div>
                            {isStart && ev.startTime && (
                              <div
                                style={{
                                  fontSize: 9,
                                  color: meta.color,
                                  opacity: 0.7,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {ev.startTime}{ev.endTime ? `–${ev.endTime}` : ''}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Modal (criar / editar) ── */}
      {showModal && !readonly && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(6px)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e5ea',
              borderRadius: 16,
              width: '100%',
              maxWidth: 500,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              margin: '0 16px',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid #f2f2f7',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1c1c1e' }}>
                {modalMode === 'create' ? 'Novo Evento' : 'Editar Evento'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {modalMode === 'edit' && onEventDelete && (
                  <button
                    onClick={handleDelete}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#ef4444',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.18)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    title="Excluir evento"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <button
                  onClick={closeModal}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: '#f2f2f7',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#8e8e93',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#e5e5ea')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#f2f2f7')}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div
              style={{
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              {/* Tipo de serviço */}
              <div>
                <label style={labelStyle}>Tipo de Serviço</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {EVENT_TYPES.map((t) => {
                    const meta = EVENT_META[t]
                    const sel = form.type === t
                    return (
                      <button
                        key={t}
                        className="cal-pill"
                        onClick={() => setForm((f) => ({ ...f, type: t }))}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '6px 12px',
                          borderRadius: 20,
                          border: `1.5px solid ${sel ? meta.color : '#e5e5ea'}`,
                          background: sel ? meta.bg : '#f9f9fb',
                          color: sel ? meta.color : '#6c6c70',
                          fontSize: 12,
                          fontWeight: sel ? 600 : 400,
                        }}
                      >
                        <div
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: meta.color,
                            flexShrink: 0,
                          }}
                        />
                        {meta.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Serviço + Fornecedor */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Serviço</label>
                  <input
                    className="cal-inp"
                    style={{ marginTop: 6 }}
                    placeholder="Ex: Marcenaria"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Fornecedor</label>
                  <input
                    className="cal-inp"
                    style={{ marginTop: 6 }}
                    placeholder="Ex: Madeiras Silva"
                    value={form.provider}
                    onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                  />
                </div>
              </div>

              {/* Datas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Data início</label>
                  <input
                    type="date"
                    className="cal-inp"
                    style={{ marginTop: 6 }}
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Data fim</label>
                  <input
                    type="date"
                    className="cal-inp"
                    style={{ marginTop: 6 }}
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Horários */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Início</label>
                  <input
                    type="time"
                    className="cal-inp"
                    style={{ marginTop: 6 }}
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Fim</label>
                  <input
                    type="time"
                    className="cal-inp"
                    style={{ marginTop: 6 }}
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  />
                </div>
              </div>

              {/* Observação */}
              <div>
                <label style={labelStyle}>Observação</label>
                <textarea
                  className="cal-inp"
                  rows={3}
                  style={{ marginTop: 6, resize: 'vertical' }}
                  placeholder="Detalhes adicionais do serviço..."
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>

              {/* Ações */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  paddingTop: 2,
                }}
              >
                <button
                  onClick={closeModal}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 10,
                    background: '#f2f2f7',
                    border: 'none',
                    color: '#3a3a3c',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#e5e5ea')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#f2f2f7')}
                >
                  Cancelar
                </button>
                <button
                  onClick={submit}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 10,
                    background: '#007AFF',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  {modalMode === 'create' ? 'Salvar evento' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Shared label style used inside the component
const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#8e8e93',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  display: 'block',
}
