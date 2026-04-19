'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Star, FileText, ExternalLink, CheckCircle2, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function FornecedorDashboardPage() {
  const [userName, setUserName] = useState('')
  const [perfilSlug, setPerfilSlug] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const nome = user.user_metadata?.nome ?? user.email ?? 'Fornecedor'
      setUserName(nome)
      const { data: perfil } = await supabase
        .from('fornecedor_perfis')
        .select('slug')
        .eq('user_id', user.id)
        .single()
      if (perfil?.slug) setPerfilSlug(perfil.slug)
    }
    loadUser()
  }, [])

  return (
    <div style={{
      padding: '32px 36px', minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif', color: '#d0d0d0',
    }}>
      <style>{`
        .fd-stat-card { background: #0e0e0e; border: 1px solid #161616; border-radius: 12px; padding: 20px 22px; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f0f0', margin: 0 }}>Dashboard</h1>
          {userName && (
            <p style={{ fontSize: 13, color: '#444', margin: '5px 0 0' }}>Bem-vindo, {userName}</p>
          )}
        </div>
        {perfilSlug ? (
          <Link href={`/fornecedor/${perfilSlug}`} target="_blank" style={{
            display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5,
            padding: '8px 16px', borderRadius: 8,
            background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.2)',
            color: '#c8a96e', textDecoration: 'none', fontWeight: 600,
          }}>
            <ExternalLink size={13} />
            Ver Perfil Público
          </Link>
        ) : (
          <Link href="/fornecedor/perfil" style={{
            display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5,
            padding: '8px 16px', borderRadius: 8,
            background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.2)',
            color: '#c8a96e', textDecoration: 'none', fontWeight: 600,
          }}>
            Completar Perfil
          </Link>
        )}
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Orçamentos Recebidos', value: '0', sub: 'este mês', icon: FileText, color: '#4f9cf9' },
          { label: 'Aprovados', value: '0', sub: 'este mês', icon: CheckCircle2, color: '#34d399' },
          { label: 'Receita Estimada', value: 'R$ 0', sub: '', icon: TrendingUp, color: '#c8a96e' },
          { label: 'Avaliação Média', value: '—', sub: 'sem avaliações ainda', icon: Star, color: '#f97316' },
        ].map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="fd-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 10.5, color: '#3e3e3e', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#f0f0f0', marginTop: 8 }}>{card.value}</div>
                  {card.sub && <div style={{ fontSize: 11, color: '#383838', marginTop: 4 }}>{card.sub}</div>}
                </div>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: `${card.color}14`, border: `1px solid ${card.color}28`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} color={card.color} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Body: quotes + messages ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'flex-start' }}>

        {/* Quote list */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#d0d0d0' }}>Orçamentos Solicitados</div>
            <Link href="/fornecedor/orcamentos" style={{ fontSize: 12, color: '#c8a96e', textDecoration: 'none', fontWeight: 600 }}>
              Ver todos →
            </Link>
          </div>
          <div style={{
            background: '#0e0e0e', border: '1px solid #161616', borderRadius: 12,
            padding: '48px 24px', textAlign: 'center',
          }}>
            <FileText size={36} color="#222" style={{ marginBottom: 14 }} />
            <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>Nenhum orçamento recebido</div>
            <div style={{ fontSize: 12, color: '#2a2a2a' }}>
              Quando arquitetos solicitarem orçamentos, eles aparecerão aqui
            </div>
          </div>
        </div>

        {/* Messages sidebar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#d0d0d0' }}>Mensagens</div>
            <Link href="/fornecedor/mensagens" style={{ fontSize: 12, color: '#c8a96e', textDecoration: 'none', fontWeight: 600 }}>
              Ver todas →
            </Link>
          </div>
          <div style={{
            background: '#0e0e0e', border: '1px solid #161616', borderRadius: 12,
            padding: '36px 20px', textAlign: 'center',
          }}>
            <MessageSquare size={28} color="#222" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13, color: '#333', marginBottom: 3 }}>Nenhuma mensagem</div>
            <div style={{ fontSize: 11, color: '#2a2a2a' }}>Conversas com arquitetos aparecerão aqui</div>
          </div>

          <div style={{
            marginTop: 14, background: '#0e0e0e', border: '1px solid #161616',
            borderRadius: 12, padding: '16px 18px',
          }}>
            <div style={{ fontSize: 10, color: '#383838', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 12 }}>
              Avaliação Média
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#555' }}>—</div>
              <div style={{ fontSize: 12, color: '#333' }}>Sem avaliações ainda</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
