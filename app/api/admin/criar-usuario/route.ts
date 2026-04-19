import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(request: NextRequest) {
  // Verify requester is admin
  const supabaseUser = createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: adminCheck } = await supabaseUser.from('users').select('role').eq('id', user.id).single()
  if (!adminCheck || adminCheck.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await request.json()
  const { nome, email, telefone, tipo, plano, trial_dias, cidade } = body

  if (!nome || !email || !tipo) {
    return NextResponse.json({ error: 'nome, email e tipo são obrigatórios' }, { status: 400 })
  }

  const senha = generatePassword()
  const admin = createAdminClient()

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, tipo },
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Erro ao criar usuário' }, { status: 400 })
  }

  const uid = authData.user.id
  const trial_ate = trial_dias
    ? new Date(Date.now() + trial_dias * 86_400_000).toISOString()
    : null

  // Update users row (trigger already created the row)
  await admin
    .from('users')
    .update({
      telefone: telefone ?? null,
      plano: plano ?? 'free',
      status_conta: trial_dias ? 'trial' : 'ativo',
      trial_ate,
    })
    .eq('id', uid)

  // Update escritorios city if arquiteto
  if (cidade && tipo === 'arquiteto') {
    const { data: esc } = await admin.from('escritorios').select('id').eq('user_id', uid).single()
    if (esc) {
      await admin.from('escritorios').update({ cidade }).eq('id', esc.id)
    }
  }

  // Log the action
  await admin.from('admin_log').insert({
    admin_id: user.id,
    target_user_id: uid,
    acao: 'criar_usuario',
    detalhes: { nome, email, tipo, plano, trial_dias },
  })

  return NextResponse.json({ success: true, senha_provisoria: senha, user_id: uid })
}
