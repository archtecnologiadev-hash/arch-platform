import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/email'
import { cobrancaTemplate } from '@/lib/email-templates/cobranca'

async function verifyAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('role, id').eq('id', user.id).single()
  if (!data || data.role !== 'admin') return null
  return data
}

export async function POST(request: NextRequest) {
  const admin_user = await verifyAdmin()
  if (!admin_user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { cobranca_id } = await request.json()
  if (!cobranca_id) return NextResponse.json({ error: 'cobranca_id obrigatório' }, { status: 400 })

  const admin = createAdminClient()

  const { data: cob } = await admin
    .from('cobrancas')
    .select('*, users!cobrancas_user_id_fkey(nome, email)')
    .eq('id', cobranca_id)
    .single()

  if (!cob) return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (cob as any).users
  if (!user?.email) return NextResponse.json({ error: 'Email do usuário não encontrado' }, { status: 400 })

  const valorFormatado = Number(cob.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  const vencimentoFormatado = new Date(cob.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')

  const html = cobrancaTemplate({
    nome: user.nome ?? 'Usuário',
    valor: valorFormatado,
    descricao: cob.descricao ?? 'Cobrança ARC',
    vencimento: vencimentoFormatado,
    pixChave: cob.pix_chave ?? null,
  })

  const assunto = `Cobrança ARC — vence em ${vencimentoFormatado}`
  const ok = await sendEmail({ to: user.email, subject: assunto, html })

  if (ok) {
    await admin.from('admin_log').insert({
      admin_id: admin_user.id,
      target_user_id: cob.user_id,
      acao: 'cobranca_email_enviado',
      detalhes: { cobranca_id, valor: cob.valor, vencimento: cob.vencimento },
    }).then(() => {})
  }

  return NextResponse.json({ success: ok })
}
