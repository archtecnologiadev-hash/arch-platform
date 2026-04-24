'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Check, X, Zap, Star, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

interface Plano {
  id: string
  nome: string
  slug: string
  valor_mensal: number
  valor_anual: number | null
  descricao: string | null
  ordem: number
  max_projetos: number | null
  max_membros: number | null
  max_armazenamento_gb: number | null
  destaque_marketplace: string
  analytics: boolean
  suporte_prioritario: boolean
}

const FEATURES: Record<string, { label: string; included: boolean }[]> = {
  'arquiteto-starter': [
    { label: '1 projeto ativo', included: true },
    { label: '1 membro na equipe', included: true },
    { label: '2 GB de armazenamento', included: true },
    { label: 'Perfil público e portfólio', included: true },
    { label: 'Acesso ao marketplace', included: true },
    { label: 'Analytics e relatórios', included: false },
    { label: 'Suporte prioritário', included: false },
  ],
  'arquiteto-profissional': [
    { label: '10 projetos ativos', included: true },
    { label: '5 membros na equipe', included: true },
    { label: '20 GB de armazenamento', included: true },
    { label: 'Perfil público e portfólio', included: true },
    { label: 'Destaque padrão no marketplace', included: true },
    { label: 'Analytics e relatórios', included: true },
    { label: 'Suporte prioritário', included: false },
  ],
  'arquiteto-escritorio': [
    { label: 'Projetos ilimitados', included: true },
    { label: 'Membros ilimitados', included: true },
    { label: '100 GB de armazenamento', included: true },
    { label: 'Perfil público e portfólio', included: true },
    { label: 'Destaque premium no marketplace', included: true },
    { label: 'Analytics e relatórios', included: true },
    { label: 'Suporte prioritário', included: true },
  ],
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  trial:       { label: 'Em trial', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  ativa:       { label: 'Ativo', color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  fundador:    { label: 'Fundador', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  inadimplente:{ label: 'Inadimplente', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  cancelada:   { label: 'Cancelado', color: '#6b6b6b', bg: 'rgba(0,0,0,0.06)' },
}

export default function ArquitetoPlanos() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [ciclo, setCiclo] = useState<'mensal' | 'anual'>('mensal')
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(0)
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [successPlanId, setSuccessPlanId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: planosData }, { data: { user } }] = await Promise.all([
        supabase.from('planos').select('*').eq('tipo_usuario', 'arquiteto').eq('ativo', true).order('ordem'),
        supabase.auth.getUser(),
      ])
      setPlanos((planosData ?? []) as Plano[])

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
      setLoading(false)
    }
    load()
  }, [])

  async function handleSelect(plano: Plano) {
    if (!subscriptionId) return
    setSelecting(plano.id)
    const supabase = createClient()
    const { error } = await supabase
      .from('assinaturas')
      .update({ plano_id: plano.id, ciclo })
      .eq('id', subscriptionId)
    if (!error) {
      setCurrentPlanId(plano.id)
      setSuccessPlanId(plano.id)
      setTimeout(() => setSuccessPlanId(null), 3000)
    }
    setSelecting(null)
  }

  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
  const descAnual = (p: Plano) => p.valor_anual ? Math.round(100 - (p.valor_anual / (p.valor_mensal * 12)) * 100) : 0

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={26} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const statusMeta = currentStatus ? STATUS_LABEL[currentStatus] : null

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', padding: '36px 32px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <p style={{ fontSize: 11.5, color: '#007AFF', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>
          PLANOS E PREÇOS
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>
          Escolha seu plano
        </h1>

        {/* Trial / status banner */}
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
              fontSize: 10, fontWeight: 700, background: ciclo === 'anual' ? 'rgba(255,255,255,0.25)' : 'rgba(0,122,255,0.1)',
              color: ciclo === 'anual' ? '#fff' : '#007AFF', padding: '2px 7px', borderRadius: 10,
            }}>
              2 meses grátis
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      {planos.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#8e8e93', fontSize: 14, padding: '48px 0' }}>
          Nenhum plano disponível no momento.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${planos.length}, minmax(260px, 340px))`,
          gap: 20, justifyContent: 'center', maxWidth: 1100, margin: '0 auto',
        }}>
          {planos.map(plano => {
            const isPopular = plano.descricao === 'Mais popular'
            const isCurrent = plano.id === currentPlanId
            const features = FEATURES[plano.slug] ?? []
            const price = ciclo === 'anual' && plano.valor_anual
              ? plano.valor_anual / 12
              : plano.valor_mensal
            const discount = descAnual(plano)
            const isSelecting = selecting === plano.id
            const isSuccess = successPlanId === plano.id

            return (
              <div key={plano.id} style={{
                background: '#fff',
                border: isPopular ? '2px solid #007AFF' : isCurrent ? '2px solid #34d399' : '1px solid rgba(0,0,0,0.08)',
                borderRadius: 18,
                padding: '28px 28px 24px',
                boxShadow: isPopular ? '0 8px 32px rgba(0,122,255,0.12)' : '0 1px 4px rgba(0,0,0,0.08)',
                display: 'flex', flexDirection: 'column',
                position: 'relative',
                transition: 'box-shadow 0.2s',
              }}>
                {/* Popular badge */}
                {isPopular && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: '#007AFF', color: '#fff',
                    fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 20,
                    display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                  }}>
                    <Star size={10} fill="#fff" color="#fff" /> Mais popular
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrent && !isPopular && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: '#34d399', color: '#fff',
                    fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20,
                    whiteSpace: 'nowrap',
                  }}>
                    Plano atual
                  </div>
                )}
                {isCurrent && isPopular && (
                  <div style={{
                    position: 'absolute', top: -14, right: 20,
                    background: '#34d399', color: '#fff',
                    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  }}>
                    Atual
                  </div>
                )}

                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>{plano.nome}</div>
                  {plano.descricao && plano.descricao !== 'Mais popular' && (
                    <div style={{ fontSize: 12.5, color: '#6b6b6b', marginTop: 3 }}>{plano.descricao}</div>
                  )}
                </div>

                <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: '#1a1a1a' }}>
                      {fmtBRL(price)}
                    </span>
                    <span style={{ fontSize: 13, color: '#8e8e93' }}>/mês</span>
                  </div>
                  {ciclo === 'anual' && plano.valor_anual && (
                    <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>
                      {fmtBRL(plano.valor_anual)}/ano · economize {discount}%
                    </div>
                  )}
                  {ciclo === 'mensal' && discount > 0 && (
                    <div style={{ fontSize: 11.5, color: '#8e8e93', marginTop: 3 }}>
                      ou {fmtBRL(plano.valor_anual! / 12)}/mês no plano anual
                    </div>
                  )}
                </div>

                {/* Features */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        background: f.included ? 'rgba(0,122,255,0.1)' : 'rgba(0,0,0,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {f.included
                          ? <Check size={10} color="#007AFF" strokeWidth={3} />
                          : <X size={9} color="#c7c7cc" strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: 13, color: f.included ? '#1a1a1a' : '#aeaeb2', lineHeight: 1.4 }}>
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                {isCurrent ? (
                  <div style={{
                    padding: '12px', borderRadius: 10, textAlign: 'center',
                    background: 'rgba(52,211,153,0.08)', border: '1.5px solid rgba(52,211,153,0.3)',
                    fontSize: 13, fontWeight: 700, color: '#059669',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    <CheckCircle2 size={14} /> Plano atual
                  </div>
                ) : isSuccess ? (
                  <div style={{
                    padding: '12px', borderRadius: 10, textAlign: 'center',
                    background: 'rgba(52,211,153,0.08)', border: '1.5px solid rgba(52,211,153,0.3)',
                    fontSize: 13, fontWeight: 700, color: '#059669',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    <CheckCircle2 size={14} /> Selecionado!
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelect(plano)}
                    disabled={!!selecting}
                    style={{
                      padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                      cursor: selecting ? 'not-allowed' : 'pointer',
                      background: isPopular ? '#007AFF' : 'rgba(0,122,255,0.08)',
                      color: isPopular ? '#fff' : '#007AFF',
                      border: isPopular ? 'none' : '1.5px solid rgba(0,122,255,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      opacity: selecting && selecting !== plano.id ? 0.5 : 1,
                      transition: 'all 0.15s',
                    }}>
                    {isSelecting
                      ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Selecionando...</>
                      : <><Zap size={13} /> Assinar {plano.nome}</>}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Payment note */}
      <p style={{ textAlign: 'center', fontSize: 12, color: '#8e8e93', marginTop: 32 }}>
        Pagamentos via Asaas · Após selecionar o plano, nossa equipe entrará em contato para configurar a cobrança.
      </p>

      {successPlanId && (
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
        <Link href="/arquiteto/dashboard" style={{ fontSize: 13, color: '#8e8e93', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <ArrowRight size={13} style={{ transform: 'rotate(180deg)' }} /> Voltar ao dashboard
        </Link>
      </div>
    </div>
  )
}
