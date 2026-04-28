import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { cancelarAssinatura } from '@/lib/asaas'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: sub } = await admin
    .from('assinaturas')
    .select('id, asaas_subscription_id, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sub) return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
  if (sub.status === 'cancelada') return NextResponse.json({ error: 'Assinatura já cancelada' }, { status: 400 })

  try {
    if (sub.asaas_subscription_id) {
      await cancelarAssinatura(sub.asaas_subscription_id)
    }

    await admin
      .from('assinaturas')
      .update({ status: 'cancelada', updated_at: new Date().toISOString() })
      .eq('id', sub.id)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao cancelar assinatura'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
