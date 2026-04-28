import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { criarCustomer, criarAssinatura, detectBrand, type CartaoInfo } from '@/lib/asaas'

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

  // Get user data
  const { data: userData } = await admin
    .from('users')
    .select('nome, email')
    .eq('id', user.id)
    .single()

  if (!userData) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  // Get subscription row
  const { data: sub } = await admin
    .from('assinaturas')
    .select('id, asaas_subscription_id, plano_id, ciclo, planos(valor_mensal, nome)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (sub?.asaas_subscription_id) {
    return NextResponse.json({ error: 'Assinatura Asaas já existe' }, { status: 400 })
  }

  const plano = (sub?.planos as unknown as { valor_mensal: number; nome: string } | null)
  const valor = plano?.valor_mensal ?? 99
  const nome_plano = plano?.nome ?? 'ARC Arquiteto'
  const ciclo = (sub?.ciclo === 'anual' ? 'YEARLY' : 'MONTHLY') as 'MONTHLY' | 'YEARLY'

  try {
    // Create customer
    const customer = await criarCustomer(
      userData.nome ?? holderName,
      userData.email,
      cpf,
    )

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

    // Create subscription (trial = 14 days)
    const subscription = await criarAssinatura(
      customer.id,
      valor,
      ciclo,
      nome_plano,
      cartao,
      14,
    )

    const last4 = number.replace(/\D/g, '').slice(-4)
    const brand = detectBrand(number)

    // Update DB
    if (sub?.id) {
      await admin
        .from('assinaturas')
        .update({
          asaas_customer_id: customer.id,
          asaas_subscription_id: subscription.id,
          card_last4: last4,
          card_brand: brand,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id)
    } else {
      // Create assinatura row if it doesn't exist
      const trialFim = new Date()
      trialFim.setDate(trialFim.getDate() + 14)
      await admin.from('assinaturas').insert({
        user_id: user.id,
        status: 'trial',
        ciclo: ciclo === 'YEARLY' ? 'anual' : 'mensal',
        trial_fim: trialFim.toISOString(),
        proxima_cobranca: trialFim.toISOString(),
        asaas_customer_id: customer.id,
        asaas_subscription_id: subscription.id,
        card_last4: last4,
        card_brand: brand,
      })
    }

    return NextResponse.json({ success: true, subscriptionId: subscription.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao processar cartão'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
