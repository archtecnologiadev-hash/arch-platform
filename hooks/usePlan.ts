'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export interface PlanInfo {
  loading: boolean
  subscriptionId: string | null
  planId: string | null
  planNome: string | null
  planSlug: string | null
  status: string | null
  ciclo: string | null
  trialFim: Date | null
  trialDaysLeft: number
  isExpired: boolean
  hasAccess: boolean
  maxProjetos: number | null
  maxMembros: number | null
  maxProdutos: number | null
  maxArmazenamentoGb: number | null
  valorMensal: number | null
  proximaCobranca: Date | null
  valorCobrado: number | null
  analytics: boolean
  suportePrioritario: boolean
  destaqueMarketplace: string
}

const DEFAULTS: Omit<PlanInfo, 'loading'> = {
  subscriptionId: null, planId: null, planNome: null, planSlug: null,
  status: null, ciclo: null, trialFim: null, trialDaysLeft: 0,
  isExpired: false, hasAccess: true,
  maxProjetos: null, maxMembros: null, maxProdutos: null, maxArmazenamentoGb: null,
  valorMensal: null, proximaCobranca: null, valorCobrado: null,
  analytics: false, suportePrioritario: false, destaqueMarketplace: 'nenhum',
}

export function usePlan(): PlanInfo {
  const [info, setInfo] = useState<PlanInfo>({ ...DEFAULTS, loading: true })

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setInfo({ ...DEFAULTS, loading: false }); return }

        const { data: sub } = await supabase
          .from('assinaturas')
          .select('*, planos(*)')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!sub) { setInfo({ ...DEFAULTS, loading: false }); return }

        const plan = sub.planos as Record<string, unknown> | null
        const now = new Date()
        const trialFim = sub.trial_fim ? new Date(sub.trial_fim as string) : null
        const trialDaysLeft = (sub.status === 'trial' && trialFim)
          ? Math.max(0, Math.ceil((trialFim.getTime() - now.getTime()) / 86400000))
          : 0
        const isExpired = sub.status === 'trial' && !!trialFim && trialFim < now
        const hasAccess = ['ativa', 'fundador'].includes(sub.status as string) ||
          (sub.status === 'trial' && !isExpired)

        setInfo({
          loading: false,
          subscriptionId: sub.id as string,
          planId: (plan?.id as string) ?? null,
          planNome: (plan?.nome as string) ?? null,
          planSlug: (plan?.slug as string) ?? null,
          status: sub.status as string,
          ciclo: sub.ciclo as string,
          trialFim,
          trialDaysLeft,
          isExpired,
          hasAccess,
          maxProjetos: (plan?.max_projetos as number) ?? null,
          maxMembros: (plan?.max_membros as number) ?? null,
          maxProdutos: (plan?.max_produtos as number) ?? null,
          maxArmazenamentoGb: (plan?.max_armazenamento_gb as number) ?? null,
          valorMensal: (plan?.valor_mensal as number) ?? null,
          proximaCobranca: sub.proxima_cobranca ? new Date(sub.proxima_cobranca as string) : null,
          valorCobrado: (sub.valor_cobrado as number) ?? null,
          analytics: (plan?.analytics as boolean) ?? false,
          suportePrioritario: (plan?.suporte_prioritario as boolean) ?? false,
          destaqueMarketplace: (plan?.destaque_marketplace as string) ?? 'nenhum',
        })
      } catch {
        setInfo({ ...DEFAULTS, loading: false })
      }
    }
    load()
  }, [])

  return info
}
