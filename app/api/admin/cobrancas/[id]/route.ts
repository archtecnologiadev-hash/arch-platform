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

// PATCH — atualiza status, comprovante, etc.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin_user = await verifyAdmin()
  if (!admin_user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const body = await request.json()
  const { status, comprovante_url } = body
  const cobId = params.id

  const updateData: Record<string, unknown> = {}
  if (status !== undefined) updateData.status = status
  if (comprovante_url !== undefined) updateData.comprovante_url = comprovante_url
  if (status === 'pago') updateData.pago_em = new Date().toISOString()

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('cobrancas')
    .update(updateData)
    .eq('id', cobId)
    .select('user_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await admin.from('admin_log').insert({
    admin_id: admin_user.id,
    target_user_id: data?.user_id ?? null,
    acao: `cobranca_${status ?? 'atualizada'}`,
    detalhes: { cobranca_id: cobId, ...updateData },
  }).then(() => {})

  return NextResponse.json({ success: true })
}

// DELETE — remove cobrança
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin_user = await verifyAdmin()
  if (!admin_user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const cobId = params.id
  const admin = createAdminClient()

  const { data: cob } = await admin.from('cobrancas').select('user_id').eq('id', cobId).single()

  const { error } = await admin.from('cobrancas').delete().eq('id', cobId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await admin.from('admin_log').insert({
    admin_id: admin_user.id,
    target_user_id: cob?.user_id ?? null,
    acao: 'cobranca_excluida',
    detalhes: { cobranca_id: cobId },
  }).then(() => {})

  return NextResponse.json({ success: true })
}
