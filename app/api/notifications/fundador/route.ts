import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { fundadorEmail } from '@/lib/email-templates/fundador'

export async function POST(req: NextRequest) {
  try {
    const { user_id, senha } = await req.json()
    if (!user_id || !senha) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: user } = await supabase
      .from('users')
      .select('email, nome')
      .eq('id', user_id)
      .single()

    if (!user?.email) return NextResponse.json({ ok: true })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.usearc.com.br'

    await sendEmail({
      to: user.email,
      subject: `Bem-vindo à ARC, ${user.nome ?? 'Fundador'}! ★`,
      html: fundadorEmail({
        nome: user.nome ?? 'Fundador',
        email: user.email,
        senha,
        loginUrl: `${appUrl}/login`,
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notifications/fundador]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
