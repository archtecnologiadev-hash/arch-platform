import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = body.event as string
  const payment = body.payment as Record<string, unknown> | undefined
  const subscription = body.subscription as Record<string, unknown> | undefined

  const admin = createAdminClient()

  if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
    if (!payment) return NextResponse.json({ ok: true })

    const asaasSubId = payment.subscription as string | undefined
    if (!asaasSubId) return NextResponse.json({ ok: true })

    const { data: sub } = await admin
      .from('assinaturas')
      .select('id')
      .eq('asaas_subscription_id', asaasSubId)
      .maybeSingle()

    if (sub?.id) {
      const nextDue = new Date()
      nextDue.setMonth(nextDue.getMonth() + 1)

      await admin
        .from('assinaturas')
        .update({
          status: 'ativa',
          proxima_cobranca: nextDue.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id)

      await admin
        .from('cobrancas_asaas')
        .upsert({
          assinatura_id: sub.id,
          asaas_payment_id: payment.id as string,
          valor: Number(payment.value ?? 0),
          status: 'confirmed',
          vencimento: payment.dueDate as string ?? null,
          pago_em: new Date().toISOString(),
        }, { onConflict: 'asaas_payment_id' })
    }

    return NextResponse.json({ ok: true })
  }

  if (event === 'PAYMENT_OVERDUE') {
    if (!payment) return NextResponse.json({ ok: true })

    const asaasSubId = payment.subscription as string | undefined
    if (!asaasSubId) return NextResponse.json({ ok: true })

    const { data: sub } = await admin
      .from('assinaturas')
      .select('id')
      .eq('asaas_subscription_id', asaasSubId)
      .maybeSingle()

    if (sub?.id) {
      await admin
        .from('assinaturas')
        .update({ status: 'inadimplente', updated_at: new Date().toISOString() })
        .eq('id', sub.id)

      await admin
        .from('cobrancas_asaas')
        .upsert({
          assinatura_id: sub.id,
          asaas_payment_id: payment.id as string,
          valor: Number(payment.value ?? 0),
          status: 'overdue',
          vencimento: payment.dueDate as string ?? null,
        }, { onConflict: 'asaas_payment_id' })
    }

    return NextResponse.json({ ok: true })
  }

  if (event === 'SUBSCRIPTION_DELETED' || event === 'SUBSCRIPTION_CANCELED') {
    const asaasSubId = subscription?.id as string | undefined
    if (!asaasSubId) return NextResponse.json({ ok: true })

    await admin
      .from('assinaturas')
      .update({ status: 'cancelada', updated_at: new Date().toISOString() })
      .eq('asaas_subscription_id', asaasSubId)

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}
