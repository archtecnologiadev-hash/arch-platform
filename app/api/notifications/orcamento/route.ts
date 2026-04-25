import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { orcamentoEmail } from '@/lib/email-templates/orcamento'

export async function POST(req: NextRequest) {
  try {
    const { fornecedor_id, arquiteto_id, projeto_id, mensagem } = await req.json()
    if (!fornecedor_id || !arquiteto_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const [{ data: forn }, { data: esc }, { data: proj }] = await Promise.all([
      supabase.from('fornecedores').select('nome, user_id').eq('id', fornecedor_id).single(),
      supabase.from('escritorios').select('nome').eq('user_id', arquiteto_id).maybeSingle(),
      projeto_id
        ? supabase.from('projetos').select('nome').eq('id', projeto_id).single()
        : Promise.resolve({ data: null }),
    ])

    if (!forn?.user_id) return NextResponse.json({ ok: true })

    const { data: fornUser } = await supabase
      .from('users')
      .select('email, nome')
      .eq('id', forn.user_id)
      .single()

    if (!fornUser?.email) return NextResponse.json({ ok: true })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.usearc.com.br'
    await sendEmail({
      to: fornUser.email,
      subject: `Novo orçamento de ${esc?.nome ?? 'um escritório'}${proj?.nome ? ` — ${proj.nome}` : ''}`,
      html: orcamentoEmail({
        fornecedorNome: fornUser.nome ?? forn.nome,
        escritorioNome: esc?.nome ?? 'Escritório',
        projetoNome: proj?.nome ?? null,
        descricao: mensagem ?? 'Solicitação de orçamento sem descrição.',
        responderUrl: `${appUrl}/fornecedor/orcamentos`,
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notifications/orcamento]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
