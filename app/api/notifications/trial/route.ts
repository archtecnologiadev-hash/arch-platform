import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { trialEmail } from '@/lib/email-templates/trial'

export async function POST(req: NextRequest) {
  try {
    const { user_id, dias_restantes } = await req.json()
    if (!user_id || dias_restantes === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: user } = await supabase
      .from('users')
      .select('email, nome, tipo')
      .eq('id', user_id)
      .single()

    if (!user?.email) return NextResponse.json({ ok: true })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.usearc.com.br'
    const planosUrl =
      user.tipo === 'fornecedor'
        ? `${appUrl}/fornecedor/planos`
        : `${appUrl}/arquiteto/planos`

    await sendEmail({
      to: user.email,
      subject: `Seu trial termina em ${dias_restantes} dia${dias_restantes !== 1 ? 's' : ''}`,
      html: trialEmail({
        nome: user.nome ?? user.email,
        diasRestantes: dias_restantes,
        planosUrl,
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notifications/trial]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
