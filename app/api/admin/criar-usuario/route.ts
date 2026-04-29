import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(request: NextRequest) {
  const supabaseUser = createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: adminCheck } = await supabaseUser.from('users').select('role').eq('id', user.id).single()
  if (!adminCheck || adminCheck.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await request.json()
  const { nome, email, telefone, tipo, plano, trial_dias, cidade, isFundador, observacao_admin } = body

  if (!nome || !email || !tipo) {
    return NextResponse.json({ error: 'nome, email e tipo são obrigatórios' }, { status: 400 })
  }

  const senha = generatePassword()
  const admin = createAdminClient()

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

  await admin
    .from('users')
    .update({
      telefone: telefone ?? null,
      plano: plano ?? 'free',
      status_conta: isFundador ? 'fundador' : (trial_dias ? 'trial' : 'ativo'),
      trial_ate,
      nivel_permissao: 'owner',
    })
    .eq('id', uid)

  if (cidade && tipo === 'arquiteto') {
    const { data: esc } = await admin.from('escritorios').select('id').eq('user_id', uid).maybeSingle()
    if (esc) {
      await admin.from('escritorios').update({ cidade }).eq('id', esc.id)
    }
  }

  // Create assinatura for founders
  if (isFundador && tipo === 'arquiteto') {
    const { data: arcPro } = await admin
      .from('planos').select('id').eq('slug', 'arquiteto-profissional').maybeSingle()

    const trialFim = new Date()
    trialFim.setFullYear(trialFim.getFullYear() + 10)

    const { data: existingSub } = await admin
      .from('assinaturas').select('id').eq('user_id', uid).maybeSingle()

    const subPayload = {
      status: 'fundador',
      plano_id: arcPro?.id ?? null,
      ciclo: 'mensal',
      trial_fim: trialFim.toISOString(),
      observacao_admin: observacao_admin ?? null,
      updated_at: new Date().toISOString(),
    }

    if (existingSub?.id) {
      await admin.from('assinaturas').update(subPayload).eq('id', existingSub.id)
    } else {
      await admin.from('assinaturas').insert({ user_id: uid, ...subPayload })
    }
  }

  await admin.from('admin_log').insert({
    admin_id: user.id,
    target_user_id: uid,
    acao: isFundador ? 'criar_fundador' : 'criar_usuario',
    detalhes: { nome, email, tipo, plano, trial_dias, isFundador: isFundador ?? false, observacao_admin },
  })

  if (isFundador) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.usearc.com.br'
      await fetch(`${appUrl}/api/notifications/fundador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: uid, senha }),
      })
    } catch (emailErr) {
      console.error('[criar-usuario] email fundador error:', emailErr)
    }
  }

  return NextResponse.json({ success: true, senha_provisoria: senha, user_id: uid, isFundador: isFundador ?? false })
}
