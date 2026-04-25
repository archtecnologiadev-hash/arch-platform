import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { conviteEmail } from '@/lib/email-templates/convite'

export async function POST(req: NextRequest) {
  try {
    const { email, nome, cargo, nivel_permissao, nome_escritorio, link_convite } = await req.json()
    if (!email || !nome || !link_convite) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    await sendEmail({
      to: email,
      subject: `${nome_escritorio ?? 'Um escritório'} convidou você para a equipe`,
      html: conviteEmail({
        nomeConvidado: nome,
        nomeEscritorio: nome_escritorio ?? 'Escritório',
        cargo: cargo ?? null,
        nivel: nivel_permissao ?? 'junior',
        linkConvite: link_convite,
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notifications/convite]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
