'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePlan } from '@/hooks/usePlan'
import { AlertTriangle, Clock, ArrowRight, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Props {
  children: React.ReactNode
  tipo: 'arquiteto' | 'fornecedor'
}

export default function TrialGate({ children, tipo }: Props) {
  const plan = usePlan()
  const pathname = usePathname()

  if (plan.loading) return <>{children}</>

  const planoUrl = `/${tipo}/planos`
  const bypassPaths = [`/${tipo}/planos`, `/${tipo}/perfil`]
  const isOnBypassPage = bypassPaths.some(p => pathname.startsWith(p))

  if (plan.isExpired && !isOnBypassPage) {
    return <TrialExpiredWall planoUrl={planoUrl} />
  }

  return (
    <>
      {plan.status === 'trial' && !plan.isExpired && (
        <TrialBanner daysLeft={plan.trialDaysLeft} planoUrl={planoUrl} />
      )}
      {children}
    </>
  )
}

function TrialBanner({ daysLeft, planoUrl }: { daysLeft: number; planoUrl: string }) {
  const isUrgent = daysLeft <= 3
  return (
    <div style={{
      background: isUrgent ? 'rgba(239,68,68,0.06)' : 'rgba(0,122,255,0.05)',
      borderBottom: `1px solid ${isUrgent ? 'rgba(239,68,68,0.18)' : 'rgba(0,122,255,0.12)'}`,
      padding: '9px 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    }}>
      <Clock size={13} color={isUrgent ? '#ef4444' : '#007AFF'} />
      <span style={{ fontSize: 12.5, color: isUrgent ? '#ef4444' : '#3a3a3c', fontWeight: 500 }}>
        {daysLeft === 0
          ? 'Seu trial expira hoje.'
          : `Você tem ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} de teste grátis restante${daysLeft !== 1 ? 's' : ''}.`}
      </span>
      <Link href={planoUrl} style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        color: isUrgent ? '#ef4444' : '#007AFF', textDecoration: 'none',
        fontSize: 12.5, fontWeight: 700,
      }}>
        Ver planos <ArrowRight size={11} />
      </Link>
    </div>
  )
}

function TrialExpiredWall({ planoUrl }: { planoUrl: string }) {
  const router = useRouter()

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f2f2f7',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '44px 52px',
        maxWidth: 480, width: '100%', textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.08)',
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px',
        }}>
          <AlertTriangle size={26} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>
          Seu período de teste encerrou
        </h2>
        <p style={{ fontSize: 14, color: '#6b6b6b', lineHeight: 1.65, marginBottom: 30 }}>
          O seu trial de 14 dias expirou. Escolha um plano para continuar usando a plataforma ARC sem interrupções.
        </p>
        <Link href={planoUrl} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#007AFF', color: '#fff', textDecoration: 'none',
          padding: '14px 32px', borderRadius: 12, fontSize: 14, fontWeight: 700,
        }}>
          <Zap size={15} /> Ver planos e assinar
        </Link>
        <div style={{ marginTop: 18 }}>
          <button onClick={handleLogout} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12.5, color: '#8e8e93',
          }}>
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}
