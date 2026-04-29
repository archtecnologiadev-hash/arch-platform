import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
  )

  const { error } = await supabase.auth.resend({ type: 'signup', email })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('rate limit') || msg.includes('too many')) {
      return NextResponse.json({ error: 'Aguarde alguns minutos antes de reenviar.' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Não foi possível reenviar. Tente novamente.' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
