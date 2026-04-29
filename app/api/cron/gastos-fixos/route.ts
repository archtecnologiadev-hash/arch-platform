import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

interface GastoFixo {
  id: string
  escritorio_id: string
  descricao: string
  valor: number
  categoria: string | null
  dia_vencimento: number
  forma_pagamento: string | null
  ativo: boolean
  data_inicio: string
  data_fim: string | null
  frequencia: string | null
}

function freqMonths(freq: string | null): number {
  switch (freq) {
    case 'bimestral':  return 2
    case 'trimestral': return 3
    case 'semestral':  return 6
    case 'anual':      return 12
    default:           return 1
  }
}

function addMonths(base: Date, n: number): Date {
  const d = new Date(base)
  d.setMonth(d.getMonth() + n)
  return d
}

function vencimentoDate(ano: number, mes: number, dia: number): string {
  const max = new Date(ano, mes, 0).getDate()
  return `${ano}-${String(mes).padStart(2, '0')}-${String(Math.min(dia, max)).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  const isAuthorized =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    cronSecret === process.env.CRON_SECRET

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const agora  = new Date()
  const limite = new Date(agora.getFullYear(), agora.getMonth() + 12, 1)

  // Fetch all active gastos fixos
  const { data: gastos, error } = await admin
    .from('financeiro_gastos_fixos')
    .select('*')
    .eq('ativo', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let totalGeradas = 0

  for (const gasto of (gastos ?? []) as GastoFixo[]) {
    const interval   = freqMonths(gasto.frequencia)
    const inicioRef  = new Date(gasto.data_inicio + 'T12:00:00')
    const fimDate    = gasto.data_fim ? new Date(gasto.data_fim + 'T12:00:00') : null

    // Build list of dates to generate
    const datas: string[] = []
    let ref = inicioRef

    while (ref <= limite) {
      const key = vencimentoDate(ref.getFullYear(), ref.getMonth() + 1, gasto.dia_vencimento)
      const keyDate = new Date(key + 'T12:00:00')

      if (keyDate >= agora) {
        if (!fimDate || keyDate <= fimDate) {
          datas.push(key)
        }
      }

      ref = addMonths(ref, interval)
    }

    if (datas.length === 0) continue

    // Check existing transactions for this gasto
    const { data: existing } = await admin
      .from('transacoes_financeiras')
      .select('data_vencimento')
      .eq('escritorio_id', gasto.escritorio_id)
      .eq('recorrente', true)
      .ilike('observacao', `%gasto_fixo:${gasto.id}%`)

    const existingKeys = new Set(
      (existing ?? []).map((e: { data_vencimento: string }) => e.data_vencimento)
    )

    const toInsert = datas.filter(d => !existingKeys.has(d))
    if (toInsert.length === 0) continue

    const rows = toInsert.map(d => ({
      escritorio_id: gasto.escritorio_id,
      tipo: 'saida' as const,
      descricao: gasto.descricao,
      valor: gasto.valor,
      categoria: gasto.categoria,
      metodo_pagamento: gasto.forma_pagamento,
      status: 'pendente' as const,
      data_vencimento: d,
      recorrente: true,
      observacao: `gasto_fixo:${gasto.id}`,
    }))

    await admin.from('transacoes_financeiras').insert(rows)
    totalGeradas += rows.length
  }

  return NextResponse.json({
    ok: true,
    gastosProcessados: (gastos ?? []).length,
    movimentacoesGeradas: totalGeradas,
    timestamp: agora.toISOString(),
  })
}
