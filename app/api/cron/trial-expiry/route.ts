import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  // Expire trials whose trial_fim has passed
  const { data: expired, error: expireErr } = await supabase
    .from('assinaturas')
    .update({ status: 'cancelada' })
    .eq('status', 'trial')
    .lt('trial_fim', now)
    .select('user_id')

  if (expireErr) {
    console.error('[cron/trial-expiry] expire error:', expireErr)
    return NextResponse.json({ error: expireErr.message }, { status: 500 })
  }

  // Send warning emails to trials expiring in 1, 3 or 7 days
  const warningDays = [1, 3, 7]
  let warned = 0
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.usearc.com.br'

  for (const days of warningDays) {
    const start = new Date()
    start.setDate(start.getDate() + days)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setHours(23, 59, 59, 999)

    const { data: expiring } = await supabase
      .from('assinaturas')
      .select('user_id')
      .eq('status', 'trial')
      .gte('trial_fim', start.toISOString())
      .lte('trial_fim', end.toISOString())

    for (const row of expiring ?? []) {
      await fetch(`${appUrl}/api/notifications/trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: row.user_id, dias_restantes: days }),
      }).catch(() => {})
      warned++
    }
  }

  return NextResponse.json({
    ok: true,
    expired: expired?.length ?? 0,
    warned,
    timestamp: now,
  })
}
