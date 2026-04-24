'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Filter, Loader2, Pencil, Trash2, AlertTriangle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface UserRow {
  id: string; nome: string; email: string; tipo: string
  plano: string; status_conta: string; created_at: string
}

const TIPO_COLOR: Record<string, string> = { arquiteto: '#007AFF', fornecedor: '#4f9cf9', cliente: '#34d399', admin: '#a78bfa' }
const STATUS_COLOR: Record<string, string> = { ativo: '#34d399', trial: '#007AFF', suspenso: '#ef4444' }

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
      background: `${color}18`, color, border: `1px solid ${color}30`,
      textTransform: 'capitalize' as const, whiteSpace: 'nowrap' as const,
    }}>{text ?? '—'}</span>
  )
}

const inp: React.CSSProperties = {
  background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', color: '#1a1a1a',
  borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none',
}
const sel: React.CSSProperties = { ...inp, cursor: 'pointer' }

export default function AdminUsuarios() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [total, setTotal] = useState(0)

  // Delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase
      .from('users')
      .select('id, nome, email, tipo, plano, status_conta, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(100)
    if (tipoFilter) q = q.eq('tipo', tipoFilter)
    if (statusFilter) q = q.eq('status_conta', statusFilter)
    if (search) q = q.or(`nome.ilike.%${search}%,email.ilike.%${search}%`)
    const { data, count } = await q
    setUsers((data as UserRow[]) ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [search, tipoFilter, statusFilter])

  useEffect(() => { load() }, [load])

  async function handleDelete(userId: string) {
    setDeleting(true)
    setDeleteError('')
    const res = await fetch(`/api/admin/usuario/${userId}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.error) {
      setDeleteError(data.error)
      setDeleting(false)
      return
    }
    // Remove from local state without full reload
    setUsers(prev => prev.filter(u => u.id !== userId))
    setTotal(prev => prev - 1)
    setConfirmDeleteId(null)
    setDeleting(false)
  }

  const confirmTarget = users.find(u => u.id === confirmDeleteId)

  return (
    <div style={{ padding: 32, color: '#1a1a1a', background: '#f2f2f7', minHeight: '100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: '#1a1a1a', marginBottom: 4 }}>Usuários</h1>
        <p style={{ fontSize: 13, color: '#8e8e93' }}>{total} usuário{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' as const }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} color="#8e8e93" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            style={{ ...inp, width: '100%', paddingLeft: 32, boxSizing: 'border-box' as const }}
            onFocus={e => (e.target.style.borderColor = '#007AFF')}
            onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.12)')}
          />
        </div>
        <select value={tipoFilter} onChange={e => setTipoFilter(e.target.value)} style={sel}>
          <option value="">Todos os tipos</option>
          <option value="arquiteto">Arquiteto</option>
          <option value="fornecedor">Fornecedor</option>
          <option value="cliente">Cliente</option>
          <option value="admin">Admin</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={sel}>
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="trial">Trial</option>
          <option value="suspenso">Suspenso</option>
        </select>
        <button onClick={load} style={{
          background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.25)',
          color: '#007AFF', borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
          fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Filter size={13} /> Filtrar
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {loading ? (
          <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={24} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                {['Nome', 'Email', 'Tipo', 'Plano', 'Status', 'Cadastro', ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#8e8e93', fontWeight: 500, letterSpacing: '0.04em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#8e8e93', fontSize: 13 }}>Nenhum usuário encontrado</td></tr>
              )}
              {users.map((u, i) => (
                <tr key={u.id}
                  style={{ borderBottom: i < users.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{u.nome}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b6b6b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}><Badge text={u.tipo} color={TIPO_COLOR[u.tipo] ?? '#666'} /></td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b6b6b' }}>{u.plano ?? 'free'}</td>
                  <td style={{ padding: '12px 16px' }}><Badge text={u.status_conta ?? 'ativo'} color={STATUS_COLOR[u.status_conta ?? 'ativo']} /></td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: '#8e8e93' }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Link href={`/admin/usuarios/${u.id}`} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 11.5, color: '#007AFF', textDecoration: 'none',
                        background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.2)', borderRadius: 6, padding: '5px 10px',
                        transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,122,255,0.12)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,122,255,0.06)' }}>
                        <Pencil size={11} /> Editar
                      </Link>
                      <button onClick={() => { setConfirmDeleteId(u.id); setDeleteError('') }} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 11.5, color: '#ef4444', background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '5px 10px',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}>
                        <Trash2 size={11} /> Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteId && confirmTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}
          onClick={e => { if (e.target === e.currentTarget && !deleting) setConfirmDeleteId(null) }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} color="#ef4444" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Excluir usuário</div>
                  <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>Ação irreversível</div>
                </div>
              </div>
              {!deleting && (
                <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}>
                  <X size={18} />
                </button>
              )}
            </div>

            <p style={{ fontSize: 13, color: '#3a3a3c', lineHeight: 1.6, marginBottom: 8 }}>
              Tem certeza que deseja excluir <strong>{confirmTarget.nome}</strong>?
            </p>
            <p style={{ fontSize: 12, color: '#8e8e93', lineHeight: 1.6, marginBottom: 20 }}>
              Isso apagará permanentemente o usuário e <strong>todos os dados vinculados</strong> — projetos, orçamentos, conversas e arquivos. Essa ação não pode ser desfeita.
            </p>

            {deleteError && (
              <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 12, color: '#ef4444' }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setConfirmDeleteId(null); setDeleteError('') }} disabled={deleting} style={{
                flex: 1, padding: '11px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.1)', color: '#6b6b6b',
                cursor: deleting ? 'not-allowed' : 'pointer',
              }}>
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDeleteId)} disabled={deleting} style={{
                flex: 1, padding: '11px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                background: '#ef4444', border: 'none', color: '#fff',
                cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.75 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}>
                {deleting
                  ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Excluindo...</>
                  : <><Trash2 size={13} /> Excluir permanentemente</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
