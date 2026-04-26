'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { usePlan } from '@/hooks/usePlan'

type Feature = 'analytics' | 'suporte_prioritario'

interface Props {
  feature: Feature
  children: React.ReactNode
  upgradeHref?: string
  label?: string
}

export default function PremiumFeature({ feature, children, upgradeHref = '/arquiteto/planos', label }: Props) {
  const plan = usePlan()

  if (plan.loading) {
    return <div style={{ opacity: 0.4, pointerEvents: 'none' }}>{children}</div>
  }

  const hasFeature = feature === 'analytics' ? plan.analytics : plan.suportePrioritario

  if (hasFeature) return <>{children}</>

  return (
    <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ filter: 'blur(2px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.45 }}>
        {children}
      </div>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(6px)',
        gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(0,122,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Lock size={20} color="#007AFF" />
        </div>
        <div style={{ textAlign: 'center', padding: '0 28px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 5 }}>
            {label ?? 'Funcionalidade Premium'}
          </div>
          <div style={{ fontSize: 12, color: '#8e8e93', lineHeight: 1.5, marginBottom: 14 }}>
            Disponível no plano Profissional ou superior.
          </div>
          <Link
            href={upgradeHref}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#007AFF', color: '#fff', textDecoration: 'none',
              borderRadius: 9, padding: '9px 20px', fontSize: 12.5, fontWeight: 700,
            }}
          >
            Fazer upgrade →
          </Link>
        </div>
      </div>
    </div>
  )
}
