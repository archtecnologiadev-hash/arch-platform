import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import { criarCobrancaAvulsa } from '@/lib/asaas'

async function verifyAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('role, id').eq('id', user.id).single()
  if (!data || data.role !== 'admin') return null
  return data
}

export async function POST(req: NextRequest) {
  const admin_user = await verifyAdmin()
  if (!admin_user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { assinaturaId } = await req.json()
  if (!assinaturaId) return NextResponse.json({ error: 'assinaturaId obrigatório' }, { status: 400 })

  const admin = createAdminClient()

  const { data: sub } = await admin
    .from('assinaturas')
    .select('id, asaas_customer_id, asaas_subscription_id, valor_cobrado, planos(valor_mensal, nome)')
    .eq('id', assinaturaId)
    .single()

  if (!sub) return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
  if (!sub.asaas_subscription_id || !sub.asaas_customer_id) {
    return NextResponse.json({ error: 'Assinatura sem dados Asaas' }, { status: 400 })
  }

  const plano = (sub.planos as unknown as { valor_mensal: number; nome: string } | null)
  const valor = plano?.valor_mensal ?? sub.valor_cobrado ?? 99
  const descricao = `Cobrança manual — ${plano?.nome ?? 'ARC'}`

  try {
    const payment = await criarCobrancaAvulsa(
      sub.asaas_customer_id,
      sub.asaas_subscription_id,
      valor,
      descricao,
    )

    await admin.from('cobrancas_asaas').insert({
      assinatura_id: sub.id,
      asaas_payment_id: payment.id,
      valor,
      status: 'pending',
      vencimento: new Date().toISOString().split('T')[0],
    })

    try {
      await admin.from('admin_log').insert({
        admin_id: admin_user.id,
        target_user_id: null,
        acao: 'assinatura_forcar_cobranca',
        detalhes: { assinaturaId, paymentId: payment.id, valor },
      })
    } catch { /* non-fatal */ }

    return NextResponse.json({ success: true, paymentId: payment.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro Asaas'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
