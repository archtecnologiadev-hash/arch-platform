import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  const cookieNames = request.cookies.getAll().map(c => c.name)
  console.log('[auth/confirm] code:', code ? code.slice(0, 20) + '…' : 'MISSING')
  console.log('[auth/confirm] cookies present:', cookieNames.join(', ') || 'none')

  if (!code) {
    console.log('[auth/confirm] → redirect erro=link-invalido (no code)')
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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  console.log('[auth/confirm] exchangeCodeForSession:', error ? `ERROR: ${error.message}` : 'ok')
  console.log('[auth/confirm] session established:', !!data?.session)

  if (error) {
    console.log('[auth/confirm] → redirect erro=link-invalido')
    return NextResponse.redirect(new URL('/nova-senha?erro=link-invalido', origin))
  }

  console.log('[auth/confirm] → redirect /nova-senha (success)')
  return response
}
