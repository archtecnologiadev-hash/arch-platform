'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Building2, Package, MessageSquare, TrendingUp, AlertTriangle, Clock, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Metric { label: string; value: number | string; icon: React.ReactNode; color: string; sub?: string }
interface RecentUser {
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
      textTransform: 'capitalize' as const,
    }}>{text}</span>
  )
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      const [
        { count: nArq },
        { count: nForn },
        { count: nCli },
        { count: leadsHoje },
        { count: leadsMes },
        { count: trials },
        { count: inadim },
        { data: recentes },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('tipo', 'arquiteto'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('tipo', 'fornecedor'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('tipo', 'cliente'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('status_conta', 'trial'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('status_conta', 'suspenso'),
        supabase.from('users').select('id, nome, email, tipo, plano, status_conta, created_at')
          .order('created_at', { ascending: false }).limit(10),
      ])

      setMetrics([
        { label: 'Arquitetos', value: nArq ?? 0, icon: <Building2 size={18} />, color: '#c8a96e' },
        { label: 'Fornecedores', value: nForn ?? 0, icon: <Package size={18} />, color: '#4f9cf9' },
        { label: 'Clientes', value: nCli ?? 0, icon: <Users size={18} />, color: '#34d399' },
        { label: 'Leads Hoje', value: leadsHoje ?? 0, icon: <MessageSquare size={18} />, color: '#a78bfa' },
        { label: 'Leads Mês', value: leadsMes ?? 0, icon: <TrendingUp size={18} />, color: '#f97316', sub: 'no mês corrente' },
        { label: 'Trials Ativos', value: trials ?? 0, icon: <Clock size={18} />, color: '#facc15' },
        { label: 'Inadimplentes', value: inadim ?? 0, icon: <AlertTriangle size={18} />, color: '#ef4444' },
      ])
      setRecentUsers((recentes as RecentUser[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} color="#c8a96e" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ padding: 32, color: '#e0e0e0' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0', marginBottom: 4 }}>Visão Geral</h1>
        <p style={{ fontSize: 13, color: '#444' }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {metrics.map(m => (
          <div key={m.label} style={{
            background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: 12,
            padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#444', fontWeight: 700, letterSpacing: '0.08em' }}>
                {m.label.toUpperCase()}
              </span>
              <div style={{ color: m.color, opacity: 0.7 }}>{m.icon}</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: m.color, lineHeight: 1 }}>
              {m.value}
            </div>
            {m.sub && <div style={{ fontSize: 10.5, color: '#333' }}>{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* Recent users table */}
      <div style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#c8a96e', letterSpacing: '0.1em' }}>
            USUÁRIOS RECENTES
          </span>
          <Link href="/admin/usuarios" style={{ fontSize: 11.5, color: '#555', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c8a96e')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
            Ver todos →
          </Link>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #141414' }}>
              {['Nome', 'Email', 'Tipo', 'Plano', 'Status', 'Cadastro'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: '#333', fontWeight: 700, letterSpacing: '0.08em' }}>
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentUsers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#333', fontSize: 13 }}>
                  Nenhum usuário encontrado
                </td>
              </tr>
            )}
            {recentUsers.map((u, i) => (
              <tr key={u.id} style={{
                borderBottom: i < recentUsers.length - 1 ? '1px solid #111' : 'none',
                transition: 'background 0.12s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#111')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#d0d0d0' }}>{u.nome}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#555' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <Badge text={u.tipo} color={TIPO_COLOR[u.tipo] ?? '#666'} />
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#555' }}>{u.plano ?? 'free'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <Badge text={u.status_conta ?? 'ativo'} color={STATUS_COLOR[u.status_conta ?? 'ativo']} />
                </td>
                <td style={{ padding: '12px 16px', fontSize: 11, color: '#444' }}>
                  {new Date(u.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
