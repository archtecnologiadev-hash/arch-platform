import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { mensagemEmail } from '@/lib/email-templates/mensagem'

export async function POST(req: NextRequest) {
  try {
    const { conversa_id, remetente_id, texto } = await req.json()
    if (!conversa_id || !remetente_id || !texto) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: conversa } = await supabase
      .from('conversas')
      .select('arquiteto_id, participante_id, tipo')
      .eq('id', conversa_id)
      .single()

    if (!conversa) return NextResponse.json({ ok: true })

    const destinatarioId =
      remetente_id === conversa.arquiteto_id
        ? conversa.participante_id
        : conversa.arquiteto_id

    const { data: dest } = await supabase
      .from('users')
      .select('email, nome')
      .eq('id', destinatarioId)
      .single()

    if (!dest?.email) return NextResponse.json({ ok: true })

    const { data: rem } = await supabase
      .from('users')
      .select('nome')
      .eq('id', remetente_id)
      .single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.usearc.com.br'
    const rolePrefix =
      remetente_id === conversa.arquiteto_id
        ? conversa.tipo === 'fornecedor' ? 'fornecedor' : 'cliente'
        : 'arquiteto'
    const conversaUrl = `${appUrl}/${rolePrefix}/mensagens?c=${conversa_id}`

    const preview = texto.length > 200 ? texto.slice(0, 200) + '...' : texto

    await sendEmail({
      to: dest.email,
      subject: `Nova mensagem de ${rem?.nome ?? 'alguém'}`,
      html: mensagemEmail({
        destinatarioNome: dest.nome ?? dest.email,
        remetenteNome: rem?.nome ?? 'Usuário',
        preview,
        conversaUrl,
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notifications/mensagem]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
