import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type') as EmailOtpType | null
  const code       = searchParams.get('code')

  // ── Email confirmation via token_hash (Supabase email template) ───────────
  if (token_hash && type === 'email') {
    const response = NextResponse.redirect(new URL('/login?msg=email-confirmado', origin))
    const supabase = createServerClient(
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
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (error) {
      return NextResponse.redirect(new URL('/confirmar-email?erro=link-invalido', origin))
    }
    return response
  }

  // ── Password reset via PKCE code ──────────────────────────────────────────
  if (!code) {
    return NextResponse.redirect(new URL('/nova-senha?erro=link-invalido', origin))
  }

  const response = NextResponse.redirect(new URL('/nova-senha', origin))
  const supabase = createServerClient(
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

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/nova-senha?erro=link-invalido', origin))
  }

  return response
}
