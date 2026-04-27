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

// GET — lista cobranças com dados do usuário
export async function GET(request: NextRequest) {
  const admin_user = await verifyAdmin()
  if (!admin_user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  const admin = createAdminClient()

  // Marca como atrasado automaticamente cobranças vencidas pendentes
  await admin
    .from('cobrancas')
    .update({ status: 'atrasado' })
    .eq('status', 'pendente')
    .lt('vencimento', new Date().toISOString().split('T')[0])

  let q = admin
    .from('cobrancas')
    .select('*, users!cobrancas_user_id_fkey(id, nome, email)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  let result = data ?? []

  if (search) {
    const s = search.toLowerCase()
    result = result.filter((c: { users?: { nome?: string; email?: string } }) => {
      const u = c.users as { nome?: string; email?: string } | null
      return u?.nome?.toLowerCase().includes(s) || u?.email?.toLowerCase().includes(s)
    })
  }

  return NextResponse.json({ data: result })
}

// POST — cria nova cobrança e envia email
export async function POST(request: NextRequest) {
  const admin_user = await verifyAdmin()
  if (!admin_user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const body = await request.json()
  const { user_id, valor, descricao, vencimento, pix_chave } = body

  if (!user_id || !valor || !vencimento) {
    return NextResponse.json({ error: 'user_id, valor e vencimento são obrigatórios' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: cob, error } = await admin
    .from('cobrancas')
    .insert({
      user_id, valor: Number(valor), descricao: descricao || null,
      vencimento, pix_chave: pix_chave || null,
      status: 'pendente', created_by: admin_user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await admin.from('admin_log').insert({
    admin_id: admin_user.id,
    target_user_id: user_id,
    acao: 'cobranca_criada',
    detalhes: { cobranca_id: cob.id, valor, vencimento, descricao },
  }).then(() => {})

  // Envia email para o usuário
  const { data: userData } = await admin
    .from('users').select('nome, email').eq('id', user_id).single()

  if (userData?.email) {
    const valorFormatado = Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    const vencimentoFormatado = new Date(vencimento + 'T00:00:00').toLocaleDateString('pt-BR')
    const html = cobrancaTemplate({
      nome: userData.nome ?? 'Usuário',
      valor: valorFormatado,
      descricao: descricao || 'Cobrança ARC',
      vencimento: vencimentoFormatado,
      pixChave: pix_chave || null,
    })
    sendEmail({
      to: userData.email,
      subject: `Cobrança ARC — vence em ${vencimentoFormatado}`,
      html,
    }).catch(() => {})
  }

  return NextResponse.json({ data: cob })
}
