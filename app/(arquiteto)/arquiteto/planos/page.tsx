'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Check, Zap, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

interface Plano {
  id: string
  nome: string
  slug: string
  valor_mensal: number
  valor_anual: number | null
}

const ARC_PRO_FEATURES = [
  'Projetos ilimitados',
  'Até 10 membros na equipe',
  '50 GB de armazenamento',
  'Portal do cliente integrado',
  'Pipeline visual de projetos',
  'Calendário e agenda',
  'Chat com clientes e fornecedores',
  'Suporte por chat',
]

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  trial:        { label: 'Em trial',     color: '#f97316', bg: 'rgba(249,115,22,0.1)'  },
  ativa:        { label: 'Ativo',        color: '#059669', bg: 'rgba(5,150,105,0.1)'   },
  fundador:     { label: 'Fundador',     color: '#7c3aed', bg: 'rgba(124,58,237,0.1)'  },
  inadimplente: { label: 'Inadimplente', color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
  cancelada:    { label: 'Cancelado',    color: 'var(--text-2)', bg: 'rgba(0,0,0,0.06)'      },
}

export default function ArquitetoPlanos() {
  const [plano, setPlano] = useState<Plano | null>(null)
  const [loading, setLoading] = useState(true)
  const [ciclo, setCiclo] = useState<'mensal' | 'anual'>('mensal')
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [trialDaysLeft, setTrialDaysLeft] = useState(0)
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 8000)
    async function load() {
      try {
        const supabase = createClient()
        const [{ data: planosData }, { data: authData }] = await Promise.all([
          supabase.from('planos')
            .select('id, nome, slug, valor_mensal, valor_anual')
            .eq('tipo_usuario', 'arquiteto').eq('ativo', true)
            .order('ordem').limit(1),
          supabase.auth.getUser(),
        ])
        if (planosData?.[0]) setPlano(planosData[0] as Plano)

        const user = authData?.user
        if (user) {
          const { data: sub } = await supabase
            .from('assinaturas').select('id, plano_id, status, trial_fim, ciclo')
            .eq('user_id', user.id).maybeSingle()
          if (sub) {
            setSubscriptionId(sub.id)
            setCurrentPlanId(sub.plano_id)
            setCurrentStatus(sub.status)
            if (sub.status === 'trial' && sub.trial_fim) {
              const days = Math.max(0, Math.ceil((new Date(sub.trial_fim).getTime() - Date.now()) / 86400000))
              setTrialDaysLeft(days)
            }
            if (sub.ciclo) setCiclo(sub.ciclo as 'mensal' | 'anual')
          }
        }
      } catch (err) {
        console.error('[planos] erro ao carregar:', err)
      } finally {
        clearTimeout(timeout)
        setLoading(false)
      }
    }
    load()
    return () => clearTimeout(timeout)
  }, [])

  async function handleAssinar() {
    if (!subscriptionId || !plano) return
    setSelecting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('assinaturas')
      .update({ plano_id: plano.id, ciclo })
      .eq('id', subscriptionId)
    if (!error) {
      setCurrentPlanId(plano.id)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3500)
    }
    setSelecting(false)
  }

  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
  const anualMensal = plano?.valor_anual ? plano.valor_anual / 12 : 124
  const priceMonthly = ciclo === 'anual' ? anualMensal : (plano?.valor_mensal ?? 297)
  const discount = plano?.valor_anual
    ? Math.round(100 - (plano.valor_anual / ((plano.valor_mensal) * 12)) * 100)
    : 17

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={26} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const isCurrent = !!plano && plano.id === currentPlanId
  const statusMeta = currentStatus ? STATUS_LABEL[currentStatus] : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '36px 32px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <p style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>
          SEU PLANO
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
          ARC Pro
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 300, marginBottom: 20 }}>
          Tudo que você precisa para gerenciar seu escritório.
        </p>

        {currentStatus === 'trial' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)',
            borderRadius: 20, padding: '7px 16px', fontSize: 13, color: '#c2410c', fontWeight: 500,
            marginBottom: 20,
          }}>
            <Zap size={13} />
            {trialDaysLeft > 0
              ? `Seu trial termina em ${trialDaysLeft} dia${trialDaysLeft !== 1 ? 's' : ''}`
              : 'Seu trial expirou'}
          </div>
        )}
        {statusMeta && currentStatus !== 'trial' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: statusMeta.bg, border: `1px solid ${statusMeta.color}30`,
            borderRadius: 20, padding: '6px 14px', fontSize: 12.5, color: statusMeta.color, fontWeight: 600,
            marginBottom: 20,
          }}>
            <CheckCircle2 size={13} /> {statusMeta.label}
          </div>
        )}

        {/* Ciclo toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => setCiclo('mensal')}
            style={{
              padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: ciclo === 'mensal' ? '#007AFF' : '#fff',
              color: ciclo === 'mensal' ? '#fff' : '#6b6b6b',
              border: ciclo === 'mensal' ? 'none' : '1px solid rgba(0,0,0,0.12)',
              transition: 'all 0.15s',
            }}>
            Mensal
          </button>
          <button
            onClick={() => setCiclo('anual')}
            style={{
              padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: ciclo === 'anual' ? '#007AFF' : '#fff',
              color: ciclo === 'anual' ? '#fff' : '#6b6b6b',
              border: ciclo === 'anual' ? 'none' : '1px solid rgba(0,0,0,0.12)',
              display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s',
            }}>
            Anual
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: ciclo === 'anual' ? 'rgba(255,255,255,0.25)' : 'rgba(0,122,255,0.1)',
              color: ciclo === 'anual' ? '#fff' : '#007AFF',
              padding: '2px 7px', borderRadius: 10,
            }}>
              2 meses grátis
            </span>
          </button>
        </div>
      </div>

      {/* Plan card */}
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '2px solid #007AFF',
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,122,255,0.12)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {isCurrent && (
            <div style={{
              position: 'absolute', top: 0, right: 24,
              background: '#34d399', color: '#fff',
              fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: '0 0 8px 8px',
            }}>
              PLANO ATUAL
            </div>
          )}

          {/* Price */}
          <div style={{ padding: '32px 32px 26px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 10 }}>
              ARC PRO
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 52, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {fmtBRL(priceMonthly)}
              </span>
              <span style={{ fontSize: 14, color: 'var(--text-3)' }}>/mês</span>
            </div>
            {ciclo === 'anual' && plano?.valor_anual && (
              <div style={{ fontSize: 12.5, color: '#059669', fontWeight: 500 }}>
                {fmtBRL(plano.valor_anual)}/ano · economize {discount}%
              </div>
            )}
            {ciclo === 'mensal' && (
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                ou {fmtBRL(anualMensal)}/mês no plano anual · 2 meses grátis
              </div>
            )}
          </div>

          {/* Features + CTA */}
          <div style={{ padding: '28px 32px 32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 28 }}>
              {ARC_PRO_FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={11} color="var(--accent)" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13.5, color: 'var(--text)' }}>{f}</span>
                </div>
              ))}
            </div>

            {isCurrent ? (
              <div style={{
                padding: '14px', borderRadius: 11, textAlign: 'center',
                background: 'rgba(52,211,153,0.08)', border: '1.5px solid rgba(52,211,153,0.3)',
                fontSize: 13.5, fontWeight: 700, color: '#059669',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}>
                <CheckCircle2 size={15} /> Plano ativo
              </div>
            ) : success ? (
              <div style={{
                padding: '14px', borderRadius: 11, textAlign: 'center',
                background: 'rgba(52,211,153,0.08)', border: '1.5px solid rgba(52,211,153,0.3)',
                fontSize: 13.5, fontWeight: 700, color: '#059669',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}>
                <CheckCircle2 size={15} /> Plano ativado!
              </div>
            ) : (
              <button
                onClick={handleAssinar}
                disabled={selecting}
                style={{
                  width: '100%', padding: '14px', borderRadius: 11,
                  fontSize: 14, fontWeight: 700,
                  cursor: selecting ? 'not-allowed' : 'pointer',
                  background: 'var(--btn-bg)', color: '#fff', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: selecting ? 0.7 : 1, transition: 'opacity 0.15s',
                }}>
                {selecting
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Ativando...</>
                  : <><Zap size={14} /> Assinar agora</>}
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 20 }}>
          Pagamentos via Asaas · Nossa equipe entrará em contato para configurar a cobrança.
        </p>
      </div>

      {success && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a1a', color: '#fff', padding: '13px 22px', borderRadius: 12,
          fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: 9999, whiteSpace: 'nowrap',
        }}>
          <CheckCircle2 size={15} color="#34d399" />
          Plano selecionado. Nossa equipe entrará em contato em breve.
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href="/arquiteto/dashboard" style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <ArrowRight size={13} style={{ transform: 'rotate(180deg)' }} /> Voltar ao dashboard
        </Link>
      </div>
    </div>
  )
}
