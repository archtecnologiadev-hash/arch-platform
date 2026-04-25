import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { resetSenhaEmail } from '@/lib/email-templates/reset-senha'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const supabase = createAdminClient()

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

    if (error || !data?.properties?.hashed_token) {
      // Return 200 to avoid email enumeration
      console.log('[reset-senha] generateLink error or no token:', error?.message)
      return NextResponse.json({ ok: true })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.usearc.com.br'
    const link = `${appUrl}/nova-senha?token_hash=${data.properties.hashed_token}&type=recovery`
    console.log('[reset-senha] link destino:', link.substring(0, 80) + '...')

    await sendEmail({
      to: email,
      subject: 'Redefinir senha — ARC',
      html: resetSenhaEmail({ link }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notifications/reset-senha]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
