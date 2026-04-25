import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { leadEmail } from '@/lib/email-templates/lead'

export async function POST(req: NextRequest) {
  try {
    const { escritorio_id, nome, email, telefone, mensagem } = await req.json()
    if (!escritorio_id || !nome || !email) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: esc } = await supabase
      .from('escritorios')
      .select('nome, user_id')
      .eq('id', escritorio_id)
      .single()

    if (!esc?.user_id) return NextResponse.json({ ok: true })

    const { data: arq } = await supabase
      .from('users')
      .select('email, nome')
      .eq('id', esc.user_id)
      .single()

    if (!arq?.email) return NextResponse.json({ ok: true })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.usearc.com.br'
    await sendEmail({
      to: arq.email,
      subject: `Novo lead na ARC — ${nome}`,
      html: leadEmail({
        arquitetoNome: arq.nome ?? esc.nome,
        clienteNome: nome,
        clienteEmail: email,
        clienteTelefone: telefone ?? null,
        mensagem,
        painelUrl: `${appUrl}/arquiteto/leads`,
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notifications/lead]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
