'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { EVENT_META } from '@/components/shared/CalendarioObra'

interface EventRow {
  id: number
  titulo: string
  tipo: string
  data_inicio: string
  data_fim: string
  hora_inicio: string | null
  hora_fim: string | null
  observacao: string | null
  projeto_id: string
  projeto_nome: string
}

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CalendarioPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(toYMD(today))

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: escritorio } = await supabase
        .from('escritorios')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!escritorio) { setLoading(false); return }

      const { data: projetos } = await supabase
        .from('projetos')
        .select('id, nome')
        .eq('escritorio_id', escritorio.id)

      if (!projetos || projetos.length === 0) { setLoading(false); return }

      const projetoIds = projetos.map((p: { id: string }) => p.id)
      const projetoMap: Record<string, string> = {}
      projetos.forEach((p: { id: string; nome: string }) => { projetoMap[p.id] = p.nome })

      const { data: evs } = await supabase
        .from('eventos')
        .select('*')
        .in('projeto_id', projetoIds)
        .order('data_inicio', { ascending: true })

      if (evs) {
        setEvents(evs.map((e: EventRow) => ({ ...e, projeto_nome: projetoMap[e.projeto_id] ?? 'Projeto' })))
      }
      setLoading(false)
    }
    load()
  }, [])

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function eventsForDate(ymd: string) {
    return events.filter(e => e.data_inicio <= ymd && e.data_fim >= ymd)
  }

  const selectedEvents = selectedDay ? eventsForDate(selectedDay) : []

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const todayYMD = toYMD(today)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} color="#c8a96e" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#e0e0e0', padding: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calendar size={20} color="#c8a96e" />
          Calendário
        </h1>
        <p style={{ fontSize: 13, color: '#444' }}>Todos os eventos dos seus projetos</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

        {/* Calendar grid */}
        <div style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: 14, padding: 24 }}>
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c8a96e')}
              onMouseLeave={e => (e.currentTarget.style.color = '#666')}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#e0e0e0' }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c8a96e')}
              onMouseLeave={e => (e.currentTarget.style.color = '#666')}>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#444', padding: '4px 0', letterSpacing: '0.05em' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayEvents = eventsForDate(ymd)
              const isToday = ymd === todayYMD
              const isSelected = ymd === selectedDay
              return (
                <button key={i} onClick={() => setSelectedDay(ymd)} style={{
                  background: isSelected ? 'rgba(200,169,110,0.15)' : isToday ? 'rgba(200,169,110,0.06)' : 'transparent',
                  border: isSelected ? '1px solid rgba(200,169,110,0.5)' : isToday ? '1px solid rgba(200,169,110,0.2)' : '1px solid transparent',
                  borderRadius: 8, padding: '8px 4px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                  minHeight: 52,
                }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(200,169,110,0.06)' : 'transparent' }}>
                  <div style={{ fontSize: 12.5, fontWeight: isToday ? 700 : 400, color: isSelected ? '#c8a96e' : isToday ? '#c8a96e' : '#aaa', marginBottom: 4 }}>
                    {day}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                    {dayEvents.slice(0, 2).map(ev => {
                      const meta = EVENT_META[ev.tipo as keyof typeof EVENT_META] ?? { color: '#666', label: ev.tipo }
                      return (
                        <div key={ev.id} style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
                      )
                    })}
                    {dayEvents.length > 2 && (
                      <div style={{ fontSize: 8, color: '#555' }}>+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Event list for selected day */}
        <div style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: 14, padding: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#444', letterSpacing: '0.1em', marginBottom: 16 }}>
            {selectedDay ? selectedDay.split('-').reverse().join('/') : 'SELECIONE UM DIA'}
          </p>

          {selectedEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#333', fontSize: 13 }}>
              Nenhum evento neste dia
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedEvents.map(ev => {
                const meta = EVENT_META[ev.tipo as keyof typeof EVENT_META] ?? { color: '#666', label: ev.tipo, icon: '●' }
                return (
                  <div key={ev.id} style={{
                    background: '#111', border: '1px solid #1c1c1c', borderRadius: 10, padding: '12px 14px',
                    borderLeft: `3px solid ${meta.color}`,
                  }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#e0e0e0', marginBottom: 4 }}>{ev.titulo}</div>
                    <div style={{ fontSize: 10, color: meta.color, marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em' }}>
                      {meta.label}
                    </div>
                    {(ev.hora_inicio || ev.hora_fim) && (
                      <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>
                        {ev.hora_inicio}{ev.hora_fim ? ` → ${ev.hora_fim}` : ''}
                      </div>
                    )}
                    <Link href={`/arquiteto/projetos/${ev.projeto_id}`} style={{ fontSize: 10, color: '#555', textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#c8a96e')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
                      {ev.projeto_nome} →
                    </Link>
                    {ev.observacao && (
                      <div style={{ fontSize: 11, color: '#444', marginTop: 6, paddingTop: 6, borderTop: '1px solid #1c1c1c' }}>
                        {ev.observacao}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
