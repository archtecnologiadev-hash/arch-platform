'use client'

import { useState } from 'react'
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'

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
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const EVENT_META: Record<EventType, { color: string; label: string }> = {
  arquiteto:   { color: '#c8a96e', label: 'Arquiteto / Reunião' },
  marceneiro:  { color: '#4f9cf9', label: 'Marceneiro' },
  eletricista: { color: '#34d399', label: 'Eletricista' },
  vidracaria:  { color: '#a78bfa', label: 'Vidraçaria' },
  pintor:      { color: '#ef4444', label: 'Pintor' },
  gesseiro:    { color: '#f97316', label: 'Gesseiro' },
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
}: CalendarioObraProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [showModal, setShowModal] = useState(false)
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

  const submit = () => {
    if (!form.title.trim() || !form.startDate || !form.endDate) return
    onEventAdd?.({ ...form })
    setForm({ ...blankForm })
    setShowModal(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <style>{`
        .cal-day { transition: background 0.12s; }
        .cal-day:hover { background: #111 !important; }
        .cal-chip { transition: opacity 0.12s; cursor: default; }
        .cal-chip:hover { opacity: 0.8; }
        .cal-nav:hover { border-color: #333 !important; color: #ccc !important; }
        .cal-pill { cursor: pointer; transition: all 0.15s; }
        .cal-pill:hover { filter: brightness(1.1); }
        .cal-inp {
          width: 100%;
          background: #141414;
          border: 1px solid #222;
          border-radius: 7px;
          padding: 8px 11px;
          color: #e0e0e0;
          font-size: 12.5px;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
          transition: border-color 0.15s;
        }
        .cal-inp:focus { border-color: rgba(200,169,110,0.45); }
        .cal-inp::placeholder { color: #2e2e2e; }
        .cal-inp[type="date"],
        .cal-inp[type="time"] { color-scheme: dark; }
      `}</style>

      {/* ── Legenda ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 20px',
          padding: '12px 16px',
          background: '#0f0f0f',
          border: '1px solid #1c1c1c',
          borderRadius: 10,
        }}
      >
        {EVENT_TYPES.map((t) => {
          const meta = EVENT_META[t]
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: meta.color,
                  flexShrink: 0,
                  boxShadow: `0 0 6px ${meta.color}55`,
                }}
              />
              <span style={{ fontSize: 11.5, color: '#555', fontWeight: 500 }}>{meta.label}</span>
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
              width: 30,
              height: 30,
              borderRadius: 7,
              background: '#0f0f0f',
              border: '1px solid #1c1c1c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#444',
              transition: 'border-color 0.15s, color 0.15s',
            }}
          >
            <ChevronLeft size={14} />
          </button>

          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#e0e0e0',
              minWidth: 176,
              textAlign: 'center',
            }}
          >
            {MONTHS[month]} {year}
          </span>

          <button
            className="cal-nav"
            onClick={goNext}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: '#0f0f0f',
              border: '1px solid #1c1c1c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#444',
              transition: 'border-color 0.15s, color 0.15s',
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {!readonly && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 7,
              background: 'rgba(200,169,110,0.09)',
              border: '1px solid rgba(200,169,110,0.22)',
              color: '#c8a96e',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(200,169,110,0.18)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(200,169,110,0.09)')}
          >
            <Plus size={12} />
            Adicionar evento
          </button>
        )}
      </div>

      {/* ── Grade do calendário ── */}
      <div
        style={{
          background: '#0f0f0f',
          border: '1px solid #1c1c1c',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho dos dias da semana */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: '1px solid #1a1a1a',
          }}
        >
          {WEEKDAYS.map((wd, i) => (
            <div
              key={wd}
              style={{
                padding: '9px 0',
                textAlign: 'center',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: i === 0 || i === 6 ? '#252525' : '#2e2e2e',
                borderRight: i < 6 ? '1px solid #141414' : 'none',
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
                style={{
                  minHeight: 92,
                  padding: '7px 6px 5px',
                  borderRight: col < 6 ? '1px solid #141414' : 'none',
                  borderBottom: lastRow ? 'none' : '1px solid #141414',
                  background: valid ? 'transparent' : '#080808',
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
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        fontSize: 11,
                        fontWeight: isToday ? 700 : 400,
                        color: isToday ? '#080808' : weekend ? '#242424' : '#525252',
                        background: isToday ? '#c8a96e' : 'transparent',
                        marginBottom: 4,
                      }}
                    >
                      {day}
                    </div>

                    {/* Chips de eventos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {dayEvs.map((ev) => {
                        const color = EVENT_META[ev.type].color
                        const isStart = ev.startDate === dStr
                        return (
                          <div
                            key={ev.id}
                            className="cal-chip"
                            title={`${ev.title} · ${ev.provider}${ev.startTime ? ` · ${ev.startTime}` : ''}`}
                            style={{
                              borderLeft: `3px solid ${color}`,
                              background: `${color}12`,
                              borderRadius: '0 3px 3px 0',
                              padding: '2px 4px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                fontSize: 9.5,
                                fontWeight: 600,
                                color,
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
                                  fontSize: 8.5,
                                  color: `${color}88`,
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

      {/* ── Modal ── */}
      {showModal && !readonly && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.76)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div
            style={{
              background: '#111',
              border: '1px solid #1e1e1e',
              borderRadius: 14,
              width: '100%',
              maxWidth: 500,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 32px 80px rgba(0,0,0,0.85)',
              margin: '0 16px',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid #1a1a1a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e8e8e8' }}>
                Novo Evento
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: 'transparent',
                  border: '1px solid #222',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#555',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1a1a1a'
                  e.currentTarget.style.color = '#999'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#555'
                }}
              >
                <X size={13} />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
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
                          padding: '5px 11px',
                          borderRadius: 20,
                          border: `1px solid ${sel ? meta.color : '#222'}`,
                          background: sel ? `${meta.color}15` : '#0f0f0f',
                          color: sel ? meta.color : '#444',
                          fontSize: 11.5,
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
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 7,
                    background: 'transparent',
                    border: '1px solid #222',
                    color: '#555',
                    fontSize: 12.5,
                    cursor: 'pointer',
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#888'
                    e.currentTarget.style.borderColor = '#333'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#555'
                    e.currentTarget.style.borderColor = '#222'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={submit}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 7,
                    background: 'rgba(200,169,110,0.12)',
                    border: '1px solid rgba(200,169,110,0.3)',
                    color: '#c8a96e',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(200,169,110,0.22)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'rgba(200,169,110,0.12)')
                  }
                >
                  Salvar evento
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
  fontSize: 10.5,
  color: '#333',
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  display: 'block',
}
