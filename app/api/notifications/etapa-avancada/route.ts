import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { etapaEmail } from '@/lib/email-templates/etapa'

export async function POST(req: NextRequest) {
  try {
    const { projeto_id, etapa_anterior, nova_etapa } = await req.json()
    if (!projeto_id || !nova_etapa) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: proj } = await supabase
      .from('projetos')
      .select('nome, cliente_id, email_cliente')
      .eq('id', projeto_id)
      .single()

    if (!proj) return NextResponse.json({ ok: true })

    let clienteEmail: string | null = proj.email_cliente ?? null
    let clienteNome = 'Cliente'

    if (proj.cliente_id) {
      const { data: cli } = await supabase
        .from('users')
        .select('email, nome')
        .eq('id', proj.cliente_id)
        .single()
      if (cli?.email) {
        clienteEmail = cli.email
        clienteNome = cli.nome ?? clienteNome
      }
    }

    if (!clienteEmail) return NextResponse.json({ ok: true })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.usearc.com.br'
    await sendEmail({
      to: clienteEmail,
      subject: `${proj.nome} avançou para ${nova_etapa}`,
      html: etapaEmail({
        clienteNome,
        projetoNome: proj.nome,
        etapaAnterior: etapa_anterior ?? '—',
        novaEtapa: nova_etapa,
        portalUrl: `${appUrl}/cliente/projetos`,
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notifications/etapa-avancada]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
