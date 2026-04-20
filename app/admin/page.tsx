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

const TIPO_COLOR: Record<string, string> = { arquiteto: '#007AFF', fornecedor: '#4f9cf9', cliente: '#34d399', admin: '#a78bfa' }
const STATUS_COLOR: Record<string, string> = { ativo: '#34d399', trial: '#007AFF', suspenso: '#ef4444' }

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
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
        { label: 'Arquitetos', value: nArq ?? 0, icon: <Building2 size={18} />, color: '#007AFF' },
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f2f7' }}>
      <Loader2 size={28} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ padding: 32, color: '#1a1a1a', background: '#f2f2f7', minHeight: '100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: '#1a1a1a', marginBottom: 4 }}>Visão Geral</h1>
        <p style={{ fontSize: 13, color: '#8e8e93' }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {metrics.map(m => (
          <div key={m.label} style={{
            background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12,
            padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#8e8e93', fontWeight: 500, letterSpacing: '0.04em' }}>
                {m.label}
              </span>
              <div style={{ color: m.color, opacity: 0.8 }}>{m.icon}</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 300, color: m.color, lineHeight: 1 }}>
              {m.value}
            </div>
            {m.sub && <div style={{ fontSize: 10.5, color: '#8e8e93' }}>{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* Recent users table */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>
            Usuários Recentes
          </span>
          <Link href="/admin/usuarios" style={{ fontSize: 12, color: '#007AFF', textDecoration: 'none' }}>
            Ver todos →
          </Link>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              {['Nome', 'Email', 'Tipo', 'Plano', 'Status', 'Cadastro'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#8e8e93', fontWeight: 500, letterSpacing: '0.04em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentUsers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#8e8e93', fontSize: 13 }}>
                  Nenhum usuário encontrado
                </td>
              </tr>
            )}
            {recentUsers.map((u, i) => (
              <tr key={u.id} style={{
                borderBottom: i < recentUsers.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                transition: 'background 0.12s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{u.nome}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b6b6b' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <Badge text={u.tipo} color={TIPO_COLOR[u.tipo] ?? '#666'} />
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b6b6b' }}>{u.plano ?? 'free'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <Badge text={u.status_conta ?? 'ativo'} color={STATUS_COLOR[u.status_conta ?? 'ativo']} />
                </td>
                <td style={{ padding: '12px 16px', fontSize: 11, color: '#8e8e93' }}>
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
