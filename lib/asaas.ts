const SANDBOX_URL = 'https://sandbox.asaas.com/api/v3'
const PROD_URL = 'https://api.asaas.com/v3'

export function getAsaasUrl() {
  return process.env.ASAAS_ENV === 'production' ? PROD_URL : SANDBOX_URL
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY ?? '',
  }
}

async function asaasPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${getAsaasUrl()}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) {
    const msg = json?.errors?.[0]?.description ?? json?.message ?? `Asaas error ${res.status}`
    throw new Error(msg)
  }
  return json
}

async function asaasDelete(path: string) {
  const res = await fetch(`${getAsaasUrl()}${path}`, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok && res.status !== 404) {
    const json = await res.json().catch(() => ({}))
    const msg = json?.errors?.[0]?.description ?? `Asaas error ${res.status}`
    throw new Error(msg)
  }
}

async function asaasGet(path: string) {
  const res = await fetch(`${getAsaasUrl()}${path}`, {
    method: 'GET',
    headers: headers(),
  })
  const json = await res.json()
  if (!res.ok) {
    const msg = json?.errors?.[0]?.description ?? `Asaas error ${res.status}`
    throw new Error(msg)
  }
  return json
}

// ─── Customer ────────────────────────────────────────────────────────────────

export async function criarCustomer(nome: string, email: string, cpf: string) {
  return asaasPost('/customers', {
    name: nome,
    email,
    cpfCnpj: cpf.replace(/\D/g, ''),
  })
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export interface CartaoInfo {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
  cpfCnpj: string
  email: string
  nome: string
}

export async function criarAssinatura(
  customerId: string,
  valor: number,
  ciclo: 'MONTHLY' | 'YEARLY',
  descricao: string,
  cartao: CartaoInfo,
  trialDays = 14,
) {
  const nextDue = new Date()
  nextDue.setDate(nextDue.getDate() + trialDays)
  const nextDueDate = nextDue.toISOString().split('T')[0]

  return asaasPost('/subscriptions', {
    customer: customerId,
    billingType: 'CREDIT_CARD',
    nextDueDate,
    value: valor,
    cycle: ciclo,
    description: descricao,
    creditCard: {
      holderName: cartao.holderName,
      number: cartao.number.replace(/\s/g, ''),
      expiryMonth: cartao.expiryMonth,
      expiryYear: cartao.expiryYear,
      ccv: cartao.ccv,
    },
    creditCardHolderInfo: {
      name: cartao.nome,
      email: cartao.email,
      cpfCnpj: cartao.cpfCnpj.replace(/\D/g, ''),
      postalCode: '01310100',
      addressNumber: '1',
      phone: '11999999999',
    },
  })
}

export async function atualizarCartaoAssinatura(
  subscriptionId: string,
  customerId: string,
  valor: number,
  ciclo: 'MONTHLY' | 'YEARLY',
  cartao: CartaoInfo,
) {
  const res = await fetch(`${getAsaasUrl()}/subscriptions/${subscriptionId}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({
      customer: customerId,
      billingType: 'CREDIT_CARD',
      value: valor,
      cycle: ciclo,
      creditCard: {
        holderName: cartao.holderName,
        number: cartao.number.replace(/\s/g, ''),
        expiryMonth: cartao.expiryMonth,
        expiryYear: cartao.expiryYear,
        ccv: cartao.ccv,
      },
      creditCardHolderInfo: {
        name: cartao.nome,
        email: cartao.email,
        cpfCnpj: cartao.cpfCnpj.replace(/\D/g, ''),
        postalCode: '01310100',
        addressNumber: '1',
        phone: '11999999999',
      },
    }),
  })
  const json = await res.json()
  if (!res.ok) {
    const msg = json?.errors?.[0]?.description ?? `Asaas error ${res.status}`
    throw new Error(msg)
  }
  return json
}

export async function cancelarAssinatura(subscriptionId: string) {
  return asaasDelete(`/subscriptions/${subscriptionId}`)
}

export async function listarPagamentosAssinatura(subscriptionId: string) {
  return asaasGet(`/payments?subscription=${subscriptionId}&limit=20&sort=dueDate&order=desc`)
}

export async function criarCobrancaAvulsa(
  customerId: string,
  subscriptionId: string,
  valor: number,
  descricao: string,
) {
  const today = new Date().toISOString().split('T')[0]
  return asaasPost('/payments', {
    customer: customerId,
    billingType: 'CREDIT_CARD',
    dueDate: today,
    value: valor,
    description: descricao,
    subscription: subscriptionId,
  })
}

// ─── Brand detection ─────────────────────────────────────────────────────────

export function detectBrand(num: string): string {
  const n = num.replace(/\D/g, '')
  if (/^4/.test(n)) return 'visa'
  if (/^5[1-5]/.test(n) || /^2(2[2-9]|[3-6]\d|7[01])/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  if (/^(401178|401179|431274|438935|451416|457393|457631|457632|504175|627780|636297|636368|(506699|5067|50670|50671|50672|50673|50674|50675|50676|506770|506771|506772|506773|506774|506775|506776|506777|506778|506779|506780|506781|506782|506783|506784|506785|506786|506787|506788|506789|506790|506791|506792|506793|506794|506795|506796|506797|506798|506799))/.test(n)) return 'elo'
  if (/^(384100|384140|384160|60650|4514160|4514161)/.test(n)) return 'hipercard'
  return 'unknown'
}
