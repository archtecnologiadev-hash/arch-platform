'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Filter, Loader2, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface UserRow {
  id: string; nome: string; email: string; tipo: string
  plano: string; status_conta: string; created_at: string
}

const TIPO_COLOR: Record<string, string> = { arquiteto: '#c8a96e', fornecedor: '#4f9cf9', cliente: '#34d399', admin: '#a78bfa' }
const STATUS_COLOR: Record<string, string> = { ativo: '#34d399', trial: '#c8a96e', suspenso: '#ef4444' }

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
      background: `${color}18`, color, border: `1px solid ${color}30`,
      textTransform: 'capitalize' as const, whiteSpace: 'nowrap' as const,
    }}>{text ?? '—'}</span>
  )
}

const inp: React.CSSProperties = {
  background: '#0e0e0e', border: '1px solid #222', color: '#d0d0d0',
  borderRadius: 7, padding: '8px 12px', fontSize: 13, outline: 'none',
}
const sel: React.CSSProperties = { ...inp, cursor: 'pointer' }

export default function AdminUsuarios() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [total, setTotal] = useState(0)

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

  return (
    <div style={{ padding: 32, color: '#e0e0e0' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0', marginBottom: 4 }}>Usuários</h1>
        <p style={{ fontSize: 13, color: '#444' }}>{total} usuário{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' as const }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} color="#444" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            style={{ ...inp, width: '100%', paddingLeft: 32, boxSizing: 'border-box' as const }}
            onFocus={e => (e.target.style.borderColor = '#c8a96e')}
            onBlur={e => (e.target.style.borderColor = '#222')}
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
          background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.25)',
          color: '#c8a96e', borderRadius: 7, padding: '8px 14px', cursor: 'pointer',
          fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Filter size={13} /> Filtrar
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={24} color="#c8a96e" style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #141414' }}>
                {['Nome', 'Email', 'Tipo', 'Plano', 'Status', 'Cadastro', ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: '#333', fontWeight: 700, letterSpacing: '0.08em' }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#333', fontSize: 13 }}>Nenhum usuário encontrado</td></tr>
              )}
              {users.map((u, i) => (
                <tr key={u.id}
                  style={{ borderBottom: i < users.length - 1 ? '1px solid #111' : 'none', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#111')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#d0d0d0' }}>{u.nome}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#555', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}><Badge text={u.tipo} color={TIPO_COLOR[u.tipo] ?? '#666'} /></td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#555' }}>{u.plano ?? 'free'}</td>
                  <td style={{ padding: '12px 16px' }}><Badge text={u.status_conta ?? 'ativo'} color={STATUS_COLOR[u.status_conta ?? 'ativo']} /></td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: '#444' }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Link href={`/admin/usuarios/${u.id}`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 11.5, color: '#555', textDecoration: 'none',
                      background: '#151515', border: '1px solid #222', borderRadius: 6, padding: '5px 10px',
                      transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#c8a96e'; e.currentTarget.style.borderColor = 'rgba(200,169,110,0.35)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#222' }}>
                      <Pencil size={11} /> Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
