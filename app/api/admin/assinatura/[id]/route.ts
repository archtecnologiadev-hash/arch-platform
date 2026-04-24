import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

async function verifyAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('role, id').eq('id', user.id).single()
  if (!data || data.role !== 'admin') return null
  return data
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin_user = await verifyAdmin()
  if (!admin_user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const body = await request.json()
  const { acao } = body
  const assinaturaId = params.id
  const admin = createAdminClient()

  const { data: sub } = await admin
    .from('assinaturas').select('user_id').eq('id', assinaturaId).single()
  if (!sub) return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })

  let update: Record<string, unknown> = {}

  if (acao === 'marcar_fundador') {
    const { data: plano } = await admin
      .from('planos').select('id').eq('slug', 'arquiteto-profissional').maybeSingle()
    const proxima = new Date()
    proxima.setMonth(proxima.getMonth() + 3)
    update = {
      status: 'fundador',
      plano_id: plano?.id ?? null,
      proxima_cobranca: proxima.toISOString(),
      updated_at: new Date().toISOString(),
    }
  } else if (acao === 'ativar') {
    const proxima = new Date()
    proxima.setMonth(proxima.getMonth() + 1)
    update = {
      status: 'ativa',
      proxima_cobranca: proxima.toISOString(),
      updated_at: new Date().toISOString(),
    }
  } else if (acao === 'cancelar') {
    update = { status: 'cancelada', updated_at: new Date().toISOString() }
  } else {
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }

  const { error } = await admin.from('assinaturas').update(update).eq('id', assinaturaId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  try {
    await admin.from('admin_log').insert({
      admin_id: admin_user.id,
      target_user_id: sub.user_id,
      acao: `assinatura_${acao}`,
      detalhes: update,
    })
  } catch { /* log failure must not block success */ }

  return NextResponse.json({ success: true })
}
