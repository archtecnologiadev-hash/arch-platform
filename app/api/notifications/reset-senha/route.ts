import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { resetSenhaEmail } from '@/lib/email-templates/reset-senha'

export async function POST(req: NextRequest) {
  try {
    const { email, redirectTo } = await req.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const supabase = createAdminClient()

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: redirectTo ?? `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.usearc.com.br'}/auth/confirm` },
    })

    if (error || !data?.properties?.action_link) {
      // Return 200 regardless to avoid email enumeration
      return NextResponse.json({ ok: true })
    }

    await sendEmail({
      to: email,
      subject: 'Redefinir senha — ARC',
      html: resetSenhaEmail({ link: data.properties.action_link }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notifications/reset-senha]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
