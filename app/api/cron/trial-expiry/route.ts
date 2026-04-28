import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  // Accept Bearer token OR x-cron-secret header OR secret query param
  const authHeader = req.headers.get('authorization')
  const cronSecret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  const isAuthorized =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    cronSecret === process.env.CRON_SECRET

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.usearc.com.br'

  // Warn 3 days before trial ends
  const in3 = new Date(now)
  in3.setDate(in3.getDate() + 3)
  const { data: expiring3 } = await admin
    .from('assinaturas')
    .select('user_id')
    .eq('status', 'trial')
    .gte('trial_fim', `${in3.toISOString().split('T')[0]}T00:00:00.000Z`)
    .lte('trial_fim', `${in3.toISOString().split('T')[0]}T23:59:59.999Z`)

  for (const row of expiring3 ?? []) {
    await fetch(`${appUrl}/api/notifications/trial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: row.user_id, dias_restantes: 3 }),
    }).catch(() => {})
  }

  // Expire trials that ended — if they have Asaas subscription set ativa, else inadimplente
  const { data: expired } = await admin
    .from('assinaturas')
    .select('id, user_id, asaas_subscription_id')
    .eq('status', 'trial')
    .lt('trial_fim', now.toISOString())

  for (const sub of expired ?? []) {
    const newStatus = sub.asaas_subscription_id ? 'ativa' : 'inadimplente'
    await admin
      .from('assinaturas')
      .update({ status: newStatus, updated_at: now.toISOString() })
      .eq('id', sub.id)

    if (newStatus === 'inadimplente') {
      await fetch(`${appUrl}/api/notifications/trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: sub.user_id, dias_restantes: 0 }),
      }).catch(() => {})
    }
  }

  return NextResponse.json({
    ok: true,
    warned3days: expiring3?.length ?? 0,
    expired: expired?.length ?? 0,
    timestamp: now.toISOString(),
  })
}
