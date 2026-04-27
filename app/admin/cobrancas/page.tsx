'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Search, Loader2, CheckCircle2, XCircle, RefreshCw,
  Upload, Trash2, X, AlertTriangle, DollarSign, Clock, Ban,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Cobranca {
  id: string
  user_id: string
  valor: number
  descricao: string | null
  vencimento: string
  status: 'pendente' | 'pago' | 'cancelado' | 'atrasado'
  pix_chave: string | null
  comprovante_url: string | null
  pago_em: string | null
  created_at: string
  users: { id: string; nome: string; email: string } | null
}

interface UserOption { id: string; nome: string; email: string }

const STATUS_COLOR: Record<string, string> = {
  pendente: '#f59e0b',
  pago: '#22c55e',
  cancelado: '#8e8e93',
  atrasado: '#ef4444',
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  cancelado: 'Cancelado',
  atrasado: 'Atrasado',
}

function Badge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? '#8e8e93'
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
      background: `${color}18`, color, border: `1px solid ${color}30`,
    }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

const inp: React.CSSProperties = {
  background: '#fff', border: '1px solid rgba(0,0,0,0.12)', color: '#1a1a1a',
  borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', width: '100%',
  boxSizing: 'border-box', fontFamily: 'inherit',
}

export default function AdminCobrancasPage() {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  // Modal nova cobrança
  const [showModal, setShowModal] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userOptions, setUserOptions] = useState<UserOption[]>([])
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null)
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [vencimento, setVencimento] = useState('')
  const [pixChave, setPixChave] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Ações por cobrança
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string; tipo: 'pago' | 'cancelado' | 'excluir' } | null>(null)

  // Upload comprovante
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (search) params.set('search', search)
    const res = await fetch(`/api/admin/cobrancas?${params}`)
    const json = await res.json()
    setCobrancas(json.data ?? [])
    setLoading(false)
  }, [statusFilter, search])

  useEffect(() => { load() }, [load])

  // Busca usuários para o modal
  useEffect(() => {
    if (!userSearch.trim() || userSearch.length < 2) { setUserOptions([]); return }
    const supabase = createClient()
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('users')
        .select('id, nome, email')
        .or(`nome.ilike.%${userSearch}%,email.ilike.%${userSearch}%`)
        .in('tipo', ['arquiteto', 'fornecedor'])
        .limit(8)
      setUserOptions((data ?? []) as UserOption[])
    }, 300)
    return () => clearTimeout(timer)
  }, [userSearch])

  async function handleCreate() {
    if (!selectedUser || !valor || !vencimento) {
      setSubmitError('Preencha usuário, valor e vencimento.')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    const res = await fetch('/api/admin/cobrancas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: selectedUser.id,
        valor: parseFloat(valor.replace(',', '.')),
        descricao: descricao.trim() || null,
        vencimento,
        pix_chave: pixChave.trim() || null,
      }),
    })
    const json = await res.json()
    setSubmitting(false)
    if (json.error) { setSubmitError(json.error); return }
    setShowModal(false)
    resetModal()
    load()
  }

  function resetModal() {
    setUserSearch(''); setUserOptions([]); setSelectedUser(null)
    setValor(''); setDescricao(''); setVencimento(''); setPixChave('')
    setSubmitError('')
  }

  async function handleAction(id: string, tipo: 'pago' | 'cancelado') {
    setActionLoading(id)
    await fetch(`/api/admin/cobrancas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: tipo }),
    })
    setActionLoading(null)
    setConfirmAction(null)
    load()
  }

  async function handleDelete(id: string) {
    setActionLoading(id)
    await fetch(`/api/admin/cobrancas/${id}`, { method: 'DELETE' })
    setActionLoading(null)
    setConfirmAction(null)
    load()
  }

  async function handleReenviar(id: string) {
    setActionLoading(id)
    await fetch('/api/notifications/cobranca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cobranca_id: id }),
    })
    setActionLoading(null)
  }

  async function handleUploadComprovante(id: string, file: File) {
    setUploadingId(id)
    const supabase = createClient()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `comprovantes/${id}_${Date.now()}_${safeName}`
    const { error } = await supabase.storage.from('chat-arquivos').upload(path, file, { contentType: file.type })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('chat-arquivos').getPublicUrl(path)
      await fetch(`/api/admin/cobrancas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comprovante_url: publicUrl }),
      })
    }
    setUploadingId(null)
    load()
  }

  const total = cobrancas.length
  const totalPago = cobrancas.filter(c => c.status === 'pago').reduce((s, c) => s + Number(c.valor), 0)
  const totalPendente = cobrancas.filter(c => ['pendente', 'atrasado'].includes(c.status)).reduce((s, c) => s + Number(c.valor), 0)

  return (
    <div style={{ padding: 32, color: '#1a1a1a', background: '#f2f2f7', minHeight: '100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: '#1a1a1a', marginBottom: 4 }}>Cobranças</h1>
          <p style={{ fontSize: 13, color: '#8e8e93' }}>{total} cobrança{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowModal(true); resetModal() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 18px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={15} /> Nova cobrança
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Recebido (exibido)', value: `R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <CheckCircle2 size={18} />, color: '#22c55e' },
          { label: 'Pendente de recebimento', value: `R$ ${totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <Clock size={18} />, color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: '#8e8e93', fontWeight: 500 }}>{m.label}</span>
              <div style={{ color: m.color }}>{m.icon}</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} color="#8e8e93" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            style={{ ...inp, paddingLeft: 32 }}
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ ...inp, width: 'auto', cursor: 'pointer' }}
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="atrasado">Atrasado</option>
          <option value="pago">Pago</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <button onClick={load} style={{ background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.25)', color: '#007AFF', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>
          Atualizar
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={24} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : cobrancas.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#8e8e93', fontSize: 13 }}>
            <DollarSign size={32} color="#c7c7cc" style={{ margin: '0 auto 10px' }} />
            <div>Nenhuma cobrança encontrada</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                  {['Usuário', 'Descrição', 'Valor', 'Vencimento', 'Status', 'Ações'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#8e8e93', fontWeight: 500, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cobrancas.map((c, i) => (
                  <tr key={c.id}
                    style={{ borderBottom: i < cobrancas.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{c.users?.nome ?? '—'}</div>
                      <div style={{ fontSize: 11, color: '#8e8e93' }}>{c.users?.email ?? '—'}</div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12.5, color: '#3a3a3c', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.descricao ?? <span style={{ color: '#c7c7cc' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13.5, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap' }}>
                      R$ {Number(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#6b6b6b', whiteSpace: 'nowrap' }}>
                      {new Date(c.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                      {c.pago_em && (
                        <div style={{ fontSize: 10.5, color: '#22c55e', marginTop: 2 }}>
                          Pago: {new Date(c.pago_em).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}><Badge status={c.status} /></td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        {/* Marcar como pago */}
                        {['pendente', 'atrasado'].includes(c.status) && (
                          <button
                            onClick={() => setConfirmAction({ id: c.id, tipo: 'pago' })}
                            disabled={actionLoading === c.id}
                            title="Marcar como pago"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#22c55e', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '4px 9px', cursor: 'pointer' }}
                          >
                            <CheckCircle2 size={11} /> Pago
                          </button>
                        )}
                        {/* Cancelar */}
                        {['pendente', 'atrasado'].includes(c.status) && (
                          <button
                            onClick={() => setConfirmAction({ id: c.id, tipo: 'cancelado' })}
                            disabled={actionLoading === c.id}
                            title="Cancelar cobrança"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#8e8e93', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 6, padding: '4px 9px', cursor: 'pointer' }}
                          >
                            <Ban size={11} /> Cancelar
                          </button>
                        )}
                        {/* Reenviar email */}
                        <button
                          onClick={() => handleReenviar(c.id)}
                          disabled={actionLoading === c.id}
                          title="Reenviar email"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#007AFF', background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.2)', borderRadius: 6, padding: '4px 9px', cursor: 'pointer' }}
                        >
                          {actionLoading === c.id
                            ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                            : <RefreshCw size={11} />
                          } Email
                        </button>
                        {/* Upload comprovante */}
                        <label
                          title="Anexar comprovante"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#8b5cf6', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 6, padding: '4px 9px', cursor: 'pointer' }}
                        >
                          {uploadingId === c.id
                            ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                            : <Upload size={11} />
                          }
                          {c.comprovante_url ? 'Substituir' : 'Comprovante'}
                          <input type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleUploadComprovante(c.id, f) }} />
                        </label>
                        {c.comprovante_url && (
                          <a href={c.comprovante_url} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 11, color: '#007AFF', textDecoration: 'none' }}>
                            Ver
                          </a>
                        )}
                        {/* Excluir */}
                        <button
                          onClick={() => setConfirmAction({ id: c.id, tipo: 'excluir' })}
                          title="Excluir cobrança"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ef4444', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 6, padding: '4px 9px', cursor: 'pointer' }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      {c.pix_chave && (
                        <div style={{ marginTop: 4, fontSize: 10.5, color: '#8e8e93' }}>
                          PIX: <span style={{ fontFamily: 'monospace', color: '#3a3a3c' }}>{c.pix_chave}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nova cobrança */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16,
        }} onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); resetModal() } }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 28, maxWidth: 480, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Nova cobrança</div>
              <button onClick={() => { setShowModal(false); resetModal() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}><X size={18} /></button>
            </div>

            {/* Seleção de usuário */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 7, fontWeight: 600 }}>
                Usuário <span style={{ color: '#ef4444' }}>*</span>
              </label>
              {selectedUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.2)', borderRadius: 9, padding: '10px 14px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1a1a' }}>{selectedUser.nome}</div>
                    <div style={{ fontSize: 11, color: '#8e8e93' }}>{selectedUser.email}</div>
                  </div>
                  <button onClick={() => { setSelectedUser(null); setUserSearch('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93' }}><X size={14} /></button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    placeholder="Buscar por nome ou email..."
                    style={inp}
                  />
                  {userOptions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 10, marginTop: 4 }}>
                      {userOptions.map(u => (
                        <button key={u.id} onClick={() => { setSelectedUser(u); setUserSearch(''); setUserOptions([]) }}
                          style={{ width: '100%', display: 'block', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f2f2f7')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{u.nome}</div>
                          <div style={{ fontSize: 11, color: '#8e8e93' }}>{u.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Valor */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 7, fontWeight: 600 }}>Valor (R$) <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" type="text" inputMode="decimal" style={inp} />
            </div>

            {/* Descrição */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 7, fontWeight: 600 }}>Descrição</label>
              <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Mensalidade ARC — Maio/2026" style={inp} />
            </div>

            {/* Vencimento */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 7, fontWeight: 600 }}>Vencimento <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={vencimento} onChange={e => setVencimento(e.target.value)} type="date" style={inp} />
            </div>

            {/* Chave PIX */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 7, fontWeight: 600 }}>Chave PIX <span style={{ color: '#8e8e93', fontWeight: 400 }}>(opcional)</span></label>
              <input value={pixChave} onChange={e => setPixChave(e.target.value)} placeholder="Email, CPF, telefone ou chave aleatória" style={inp} />
            </div>

            {submitError && (
              <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 12.5, color: '#ef4444' }}>
                {submitError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowModal(false); resetModal() }} style={{ flex: 1, padding: 12, background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#6b6b6b' }}>
                Cancelar
              </button>
              <button onClick={handleCreate} disabled={submitting} style={{ flex: 1, padding: 12, background: submitting ? '#c7c7cc' : '#007AFF', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: submitting ? 'default' : 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                {submitting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</> : 'Gerar cobrança'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmação de ação */}
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmAction(null) }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: confirmAction.tipo === 'pago' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {confirmAction.tipo === 'pago'
                  ? <CheckCircle2 size={18} color="#22c55e" />
                  : <AlertTriangle size={18} color="#ef4444" />
                }
              </div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {confirmAction.tipo === 'pago' ? 'Marcar como pago?' :
                 confirmAction.tipo === 'cancelado' ? 'Cancelar cobrança?' : 'Excluir cobrança?'}
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#6b6b6b', lineHeight: 1.6, marginBottom: 20 }}>
              {confirmAction.tipo === 'pago' ? 'A cobrança será marcada como paga manualmente.' :
               confirmAction.tipo === 'cancelado' ? 'A cobrança será cancelada. O usuário não precisa mais pagar.' :
               'A cobrança será excluída permanentemente.'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmAction(null)} style={{ flex: 1, padding: 11, background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#6b6b6b' }}>Voltar</button>
              <button
                onClick={() => confirmAction.tipo === 'excluir' ? handleDelete(confirmAction.id) : handleAction(confirmAction.id, confirmAction.tipo as 'pago' | 'cancelado')}
                disabled={actionLoading === confirmAction.id}
                style={{ flex: 1, padding: 11, background: confirmAction.tipo === 'pago' ? '#22c55e' : '#ef4444', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                {actionLoading === confirmAction.id
                  ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  : confirmAction.tipo === 'pago' ? 'Confirmar pagamento' : confirmAction.tipo === 'cancelado' ? 'Cancelar cobrança' : 'Excluir'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
