import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { atualizarCartaoAssinatura, detectBrand, type CartaoInfo } from '@/lib/asaas'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { holderName, number, expiryMonth, expiryYear, ccv, cpf } = body

  if (!holderName || !number || !expiryMonth || !expiryYear || !ccv || !cpf) {
    return NextResponse.json({ error: 'Preencha todos os campos do cartão' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: sub } = await admin
    .from('assinaturas')
    .select('id, asaas_customer_id, asaas_subscription_id, ciclo, planos(valor_mensal)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sub?.asaas_subscription_id || !sub?.asaas_customer_id) {
    return NextResponse.json({ error: 'Assinatura Asaas não encontrada' }, { status: 404 })
  }

  const { data: userData } = await admin
    .from('users')
    .select('nome, email')
    .eq('id', user.id)
    .single()

  if (!userData) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const plano = (sub.planos as unknown as { valor_mensal: number } | null)
  const valor = plano?.valor_mensal ?? 99
  const ciclo = (sub.ciclo === 'anual' ? 'YEARLY' : 'MONTHLY') as 'MONTHLY' | 'YEARLY'

  try {
    const cartao: CartaoInfo = {
      holderName,
      number,
      expiryMonth,
      expiryYear,
      ccv,
      cpfCnpj: cpf,
      email: userData.email,
      nome: userData.nome ?? holderName,
    }

    await atualizarCartaoAssinatura(
      sub.asaas_subscription_id,
      sub.asaas_customer_id,
      valor,
      ciclo,
      cartao,
    )

    const last4 = number.replace(/\D/g, '').slice(-4)
    const brand = detectBrand(number)

    await admin
      .from('assinaturas')
      .update({ card_last4: last4, card_brand: brand, updated_at: new Date().toISOString() })
      .eq('id', sub.id)

    return NextResponse.json({ success: true, last4, brand })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar cartão'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
