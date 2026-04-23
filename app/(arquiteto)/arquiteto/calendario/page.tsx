'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, ChevronLeft, ChevronRight, Loader2, Plus, X, Trash2, Save } from 'lucide-react'
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
  projeto_id: string | null
  escritorio_id: string | null
  projeto_nome: string
}

interface ProjetoSimple {
  id: string
  nome: string
}

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const EVENT_TYPE_SUGGESTIONS = Object.entries(EVENT_META).map(([key, val]) => ({ key, label: val.label }))

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const emptyForm = { titulo: '', tipo: 'arquiteto', projeto_id: '', data_inicio: '', data_fim: '', hora_inicio: '', hora_fim: '', observacao: '' }

function getMeta(tipo: string) {
  return EVENT_META[tipo] ?? { color: '#6b6b6b', bg: '#f2f2f7', label: tipo }
}

export default function CalendarioPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [projetos, setProjetos] = useState<ProjetoSimple[]>([])
  const [escritorioId, setEscritorioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(toYMD(today))

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [modalForm, setModalForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: escritorio } = await supabase
        .from('escritorios').select('id').eq('user_id', user.id).single()
      if (!escritorio) { setLoading(false); return }

      setEscritorioId(escritorio.id)

      const { data: projetosList } = await supabase
        .from('projetos').select('id, nome').eq('escritorio_id', escritorio.id).order('nome')

      const projetoMap: Record<string, string> = {}
      if (projetosList) {
        projetosList.forEach((p: { id: string; nome: string }) => { projetoMap[p.id] = p.nome })
        setProjetos(projetosList as ProjetoSimple[])
      }

      // Fetch events: both by projeto_id IN [...] and by escritorio_id (events without project)
      const allEvents: EventRow[] = []

      if (projetosList && projetosList.length > 0) {
        const projetoIds = projetosList.map((p: { id: string }) => p.id)
        const { data: evsByProjeto } = await supabase
          .from('eventos').select('*').in('projeto_id', projetoIds).order('data_inicio', { ascending: true })
        if (evsByProjeto) {
          evsByProjeto.forEach((e: EventRow) => {
            allEvents.push({ ...e, projeto_nome: projetoMap[e.projeto_id ?? ''] ?? 'Projeto' })
          })
        }
      }

      // Also fetch events with null projeto_id that belong to this escritório
      const { data: evsGeral } = await supabase
        .from('eventos').select('*')
        .eq('escritorio_id', escritorio.id)
        .is('projeto_id', null)
        .order('data_inicio', { ascending: true })
      if (evsGeral) {
        evsGeral.forEach((e: EventRow) => {
          allEvents.push({ ...e, projeto_nome: 'Geral' })
        })
      }

      setEvents(allEvents)
      setLoading(false)
    }
    load()
  }, [])

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

  function openCreate(day: string) {
    setEditingId(null)
    setSaveError(null)
    setModalForm({ ...emptyForm, data_inicio: day, data_fim: day, projeto_id: projetos[0]?.id ?? '' })
    setModalOpen(true)
  }

  function openEdit(ev: EventRow) {
    setEditingId(ev.id)
    setSaveError(null)
    setModalForm({
      titulo: ev.titulo, tipo: ev.tipo, projeto_id: ev.projeto_id ?? '',
      data_inicio: ev.data_inicio, data_fim: ev.data_fim,
      hora_inicio: ev.hora_inicio ?? '', hora_fim: ev.hora_fim ?? '', observacao: ev.observacao ?? '',
    })
    setModalOpen(true)
  }

  async function saveEvent() {
    if (!modalForm.titulo.trim() || !modalForm.data_inicio) return
    setSaving(true)
    setSaveError(null)
    const supabase = createClient()
    const payload = {
      projeto_id: modalForm.projeto_id || null,
      escritorio_id: escritorioId,
      titulo: modalForm.titulo.trim(),
      tipo: modalForm.tipo || 'arquiteto',
      data_inicio: modalForm.data_inicio,
      data_fim: modalForm.data_fim || modalForm.data_inicio,
      hora_inicio: modalForm.hora_inicio || null,
      hora_fim: modalForm.hora_fim || null,
      observacao: modalForm.observacao || null,
    }
    const projetoNome = projetos.find(p => p.id === modalForm.projeto_id)?.nome ?? 'Geral'

    if (editingId !== null) {
      const { error } = await supabase.from('eventos').update(payload).eq('id', editingId)
      if (error) {
        console.error('eventos update error:', error)
        setSaveError(`Erro ao salvar: ${error.message}`)
        setSaving(false)
        return
      }
      setEvents(prev => prev.map(e => e.id === editingId ? { ...e, ...payload, projeto_nome: projetoNome } : e))
    } else {
      const { data, error } = await supabase.from('eventos').insert(payload).select('*').single()
      if (error) {
        console.error('eventos insert error:', error)
        setSaveError(`Erro ao salvar: ${error.message}`)
        setSaving(false)
        return
      }
      if (data) setEvents(prev => [...prev, { ...(data as EventRow), projeto_nome: projetoNome }])
    }
    setSaving(false)
    setModalOpen(false)
  }

  async function deleteEvent() {
    if (editingId === null) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('eventos').delete().eq('id', editingId)
    setEvents(prev => prev.filter(e => e.id !== editingId))
    setDeleting(false)
    setModalOpen(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, fontSize: 13, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', color: '#1a1a1a', padding: 32 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={20} color="#007AFF" /> Calendário
          </h1>
          <p style={{ fontSize: 13, color: '#6b6b6b' }}>Todos os eventos dos seus projetos</p>
        </div>
        <button onClick={() => openCreate(selectedDay ?? todayYMD)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Adicionar Evento
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

        {/* Calendar grid */}
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#007AFF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8e8e93')}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#007AFF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8e8e93')}>
              <ChevronRight size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 400, color: '#8e8e93', padding: '4px 0', letterSpacing: '0.05em' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayEvents = eventsForDate(ymd)
              const isToday = ymd === todayYMD
              const isSelected = ymd === selectedDay
              return (
                <button key={i} onClick={() => { setSelectedDay(ymd); if (!dayEvents.length) openCreate(ymd) }} style={{
                  background: isSelected ? 'rgba(0,122,255,0.12)' : isToday ? 'rgba(0,122,255,0.05)' : 'transparent',
                  border: isSelected ? '1px solid rgba(0,122,255,0.4)' : isToday ? '1px solid rgba(0,122,255,0.18)' : '1px solid transparent',
                  borderRadius: 8, padding: '8px 4px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', minHeight: 52,
                }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(0,122,255,0.05)' : 'transparent' }}>
                  <div style={{ fontSize: 12.5, fontWeight: isToday ? 700 : 400, color: isSelected ? '#007AFF' : isToday ? '#007AFF' : '#1a1a1a', marginBottom: 4 }}>
                    {day}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                    {dayEvents.slice(0, 2).map(ev => {
                      const meta = getMeta(ev.tipo)
                      return <div key={ev.id} style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
                    })}
                    {dayEvents.length > 2 && <div style={{ fontSize: 8, color: '#8e8e93' }}>+{dayEvents.length - 2}</div>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Event list for selected day */}
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 400, color: '#8e8e93', letterSpacing: '0.04em', margin: 0 }}>
              {selectedDay ? selectedDay.split('-').reverse().join('/') : 'Selecione um dia'}
            </p>
            <button onClick={() => openCreate(selectedDay ?? todayYMD)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,122,255,0.07)', border: '1px solid rgba(0,122,255,0.2)', color: '#007AFF', borderRadius: 7, padding: '4px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={11} /> Novo
            </button>
          </div>

          {selectedEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#8e8e93', fontSize: 13 }}>
              Nenhum evento neste dia
              <div style={{ fontSize: 11, marginTop: 6, color: '#c7c7cc' }}>Clique no dia ou em &quot;Novo&quot; para adicionar</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedEvents.map(ev => {
                const meta = getMeta(ev.tipo)
                return (
                  <div key={ev.id} onClick={() => openEdit(ev)} style={{
                    background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '12px 14px',
                    borderLeft: `3px solid ${meta.color}`, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#ebebf0' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f2f2f7' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>{ev.titulo}</div>
                    <div style={{ fontSize: 10, color: meta.color, marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em' }}>{meta.label ?? ev.tipo}</div>
                    {(ev.hora_inicio || ev.hora_fim) && (
                      <div style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 4 }}>
                        {ev.hora_inicio}{ev.hora_fim ? ` → ${ev.hora_fim}` : ''}
                      </div>
                    )}
                    {ev.projeto_id ? (
                      <Link href={`/arquiteto/projetos/${ev.projeto_id}`} onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: '#8e8e93', textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#007AFF')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#8e8e93')}>
                        {ev.projeto_nome} →
                      </Link>
                    ) : (
                      <span style={{ fontSize: 10, color: '#aeaeb2' }}>Geral</span>
                    )}
                    {ev.observacao && (
                      <div style={{ fontSize: 11, color: '#6b6b6b', marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(0,0,0,0.08)' }}>{ev.observacao}</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Event modal */}
      {modalOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', border: '1px solid rgba(0,0,0,0.08)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{editingId !== null ? 'Editar Evento' : 'Novo Evento'}</div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}><X size={18} /></button>
            </div>

            {saveError && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#ef4444' }}>
                {saveError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Título */}
              <div>
                <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Descrição *</label>
                <input value={modalForm.titulo} onChange={e => setModalForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Reunião com cliente, instalação elétrica..." style={inp}
                  onFocus={e => (e.target.style.borderColor = '#007AFF')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
              </div>

              {/* Tipo (datalist) + Projeto */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Tipo / Categoria</label>
                  <datalist id="cal-tipo-geral">
                    {EVENT_TYPE_SUGGESTIONS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </datalist>
                  <input list="cal-tipo-geral" value={modalForm.tipo} onChange={e => setModalForm(f => ({ ...f, tipo: e.target.value }))}
                    placeholder="arquiteto, marceneiro..." style={inp}
                    onFocus={e => (e.target.style.borderColor = '#007AFF')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Projeto</label>
                  <select value={modalForm.projeto_id} onChange={e => setModalForm(f => ({ ...f, projeto_id: e.target.value }))} style={{ ...inp }}>
                    <option value="">— Sem projeto (Geral)</option>
                    {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
              </div>

              {/* Datas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Data início *</label>
                  <input type="date" value={modalForm.data_inicio} onChange={e => setModalForm(f => ({ ...f, data_inicio: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Data fim</label>
                  <input type="date" value={modalForm.data_fim} onChange={e => setModalForm(f => ({ ...f, data_fim: e.target.value }))} style={inp} />
                </div>
              </div>

              {/* Horários */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Hora início</label>
                  <input type="time" value={modalForm.hora_inicio} onChange={e => setModalForm(f => ({ ...f, hora_inicio: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Hora fim</label>
                  <input type="time" value={modalForm.hora_fim} onChange={e => setModalForm(f => ({ ...f, hora_fim: e.target.value }))} style={inp} />
                </div>
              </div>

              {/* Observação */}
              <div>
                <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Observação</label>
                <textarea value={modalForm.observacao} onChange={e => setModalForm(f => ({ ...f, observacao: e.target.value }))} rows={2} placeholder="Notas adicionais..." style={{ ...inp, resize: 'none' as const }} />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                {editingId !== null && (
                  <button onClick={deleteEvent} disabled={deleting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Trash2 size={13} /> {deleting ? 'Excluindo...' : 'Excluir'}
                  </button>
                )}
                <button onClick={saveEvent} disabled={saving || !modalForm.titulo.trim() || !modalForm.data_inicio}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', background: saving ? 'rgba(0,122,255,0.4)' : '#007AFF', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: !modalForm.titulo.trim() || !modalForm.data_inicio ? 0.5 : 1 }}>
                  {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : <><Save size={13} /> {editingId !== null ? 'Salvar alterações' : 'Criar evento'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
