import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

function makeSupabase(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) { response.cookies.set({ name, value, ...options }) },
        remove(name, options) { response.cookies.set({ name, value: '', ...options }) },
      },
    }
  )
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type') as EmailOtpType | null
  const code       = searchParams.get('code')
  const next       = searchParams.get('next') // 'recovery' when sent by resetPasswordForEmail

  console.log('[auth/confirm] params:', { token_hash: !!token_hash, type, code: !!code, next })

  // ── 1. token_hash flow (template using {{ .TokenHash }}) ─────────────────
  if (token_hash && type) {
    let successUrl: string
    let errorUrl: string

    if (type === 'signup' || type === 'invite' || type === 'magiclink') {
      successUrl = '/login?msg=email-confirmado'
      errorUrl   = '/confirmar-email?erro=link-invalido'
    } else if (type === 'recovery') {
      successUrl = '/nova-senha'
      errorUrl   = '/nova-senha?erro=link-invalido'
    } else {
      // email_change or any other type
      successUrl = '/arquiteto/perfil?msg=email-alterado'
      errorUrl   = '/login'
    }

    const response = NextResponse.redirect(new URL(successUrl, origin))
    const supabase = makeSupabase(request, response)
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })

    if (error) {
      console.error('[auth/confirm] verifyOtp error:', error.message)
      return NextResponse.redirect(new URL(errorUrl, origin))
    }

    console.log('[auth/confirm] verifyOtp ok → ', successUrl)
    return response
  }

  // ── 2. PKCE code flow ────────────────────────────────────────────────────
  if (!code) {
    console.warn('[auth/confirm] no token_hash and no code')
    return NextResponse.redirect(new URL('/login', origin))
  }

  // 'next=recovery' is appended by resetPasswordForEmail's redirectTo option.
  // Without it (signUp emailRedirectTo flow), treat as email confirmation.
  const isRecovery = next === 'recovery'
  const successUrl = isRecovery ? '/nova-senha' : '/login?msg=email-confirmado'
  const errorUrl   = isRecovery ? '/nova-senha?erro=link-invalido' : '/confirmar-email?erro=link-invalido'

  const response = NextResponse.redirect(new URL(successUrl, origin))
  const supabase = makeSupabase(request, response)
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/confirm] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(new URL(errorUrl, origin))
  }

  console.log('[auth/confirm] exchangeCodeForSession ok → ', successUrl)
  return response
}
