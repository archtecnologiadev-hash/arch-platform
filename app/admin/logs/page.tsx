'use client'

import { useState, useEffect } from 'react'
import { ScrollText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface LogRow {
  id: number
  acao: string
  detalhes: Record<string, unknown>
  created_at: string
  admin: { nome: string } | null
  target: { nome: string; email: string } | null
}

const ACAO_COLOR: Record<string, string> = {
  criar_usuario: '#34d399',
  editar_usuario: '#007AFF',
  excluir_usuario: '#ef4444',
  suspender: '#f97316',
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('admin_log')
        .select(`
          id, acao, detalhes, created_at,
          admin:admin_id(nome),
          target:target_user_id(nome, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100)
      setLogs((data as unknown as LogRow[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ padding: 32, color: '#1a1a1a', background: '#f2f2f7', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: '#1a1a1a', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ScrollText size={20} color="#007AFF" /> Logs de Atividade
        </h1>
        <p style={{ fontSize: 13, color: '#8e8e93' }}>Histórico das últimas 100 ações administrativas</p>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {loading ? (
          <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={24} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#8e8e93', fontSize: 13 }}>Nenhum log registrado</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                {['Data / Hora', 'Ação', 'Admin', 'Usuário Alvo', 'Detalhes'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#8e8e93', fontWeight: 500, letterSpacing: '0.04em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const color = ACAO_COLOR[log.acao] ?? '#6b6b6b'
                return (
                  <tr key={log.id}
                    style={{ borderBottom: i < logs.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '11px 16px', fontSize: 11, color: '#8e8e93', whiteSpace: 'nowrap' as const }}>
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                        background: `${color}18`, color, border: `1px solid ${color}30`,
                      }}>
                        {log.acao.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: '#6b6b6b' }}>
                      {(log.admin as unknown as { nome: string } | null)?.nome ?? '—'}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: '#1a1a1a' }}>
                      {(log.target as unknown as { nome: string; email: string } | null)?.nome ?? '—'}
                      {(log.target as unknown as { nome: string; email: string } | null)?.email && (
                        <span style={{ fontSize: 10.5, color: '#8e8e93', display: 'block' }}>
                          {(log.target as unknown as { nome: string; email: string }).email}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 11, color: '#8e8e93', maxWidth: 200 }}>
                      {log.detalhes ? (
                        <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' as const }}>
                          {JSON.stringify(log.detalhes).slice(0, 80)}{JSON.stringify(log.detalhes).length > 80 ? '…' : ''}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
