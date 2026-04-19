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
  const { nome, email, telefone, tipo, plano, status_conta, trial_ate, role } = body
  const targetId = params.id

  const admin = createAdminClient()

  // Update users table
  const updateData: Record<string, unknown> = {}
  if (nome !== undefined)        updateData.nome = nome
  if (telefone !== undefined)    updateData.telefone = telefone
  if (tipo !== undefined)        updateData.tipo = tipo
  if (plano !== undefined)       updateData.plano = plano
  if (status_conta !== undefined) updateData.status_conta = status_conta
  if (trial_ate !== undefined)   updateData.trial_ate = trial_ate || null
  if (role !== undefined)        updateData.role = role

  const { error: dbError } = await admin.from('users').update(updateData).eq('id', targetId)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 })

  // Update auth email if changed
  if (email) {
    await admin.auth.admin.updateUserById(targetId, { email })
  }

  // Log
  await admin.from('admin_log').insert({
    admin_id: admin_user.id,
    target_user_id: targetId,
    acao: 'editar_usuario',
    detalhes: updateData,
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin_user = await verifyAdmin()
  if (!admin_user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const targetId = params.id
  if (targetId === admin_user.id) {
    return NextResponse.json({ error: 'Não pode excluir a própria conta' }, { status: 400 })
  }

  const admin = createAdminClient()

  await admin.from('admin_log').insert({
    admin_id: admin_user.id,
    target_user_id: targetId,
    acao: 'excluir_usuario',
    detalhes: {},
  })

  const { error } = await admin.auth.admin.deleteUser(targetId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
