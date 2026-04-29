import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { contratoEnviadoEmail, contratoAssinadoEmail } from '@/lib/email-templates/contrato'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tipo } = body

    if (tipo === 'enviado') {
      const { email, nomeCliente, nomeEscritorio, tituloProjeto, tituloContrato, linkContrato } = body
      if (!email || !linkContrato) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      await sendEmail({
        to: email,
        subject: `${nomeEscritorio ?? 'Seu escritório'} enviou um contrato para assinatura`,
        html: contratoEnviadoEmail({ nomeCliente, nomeEscritorio, tituloProjeto, tituloContrato, linkContrato }),
      })
    } else if (tipo === 'assinado') {
      const { email, nomeArquiteto, nomeCliente, tituloProjeto, tituloContrato, assinadoEm, linkContrato } = body
      if (!email || !linkContrato) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      await sendEmail({
        to: email,
        subject: `${nomeCliente} assinou o contrato "${tituloContrato}"`,
        html: contratoAssinadoEmail({ nomeArquiteto, nomeCliente, tituloProjeto, tituloContrato, assinadoEm, linkContrato }),
      })
    } else {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notifications/contrato]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
