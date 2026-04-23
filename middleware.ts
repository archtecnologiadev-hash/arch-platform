import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = [
  '/arquiteto',
  '/cliente',
  '/fornecedor/dashboard',
  '/fornecedor/perfil',
  '/fornecedor/orcamentos',
  '/fornecedor/mensagens',
  '/fornecedor/catalogo',
  '/fornecedor/pedidos',
]

// Queries public.users directly with service role — bypasses RLS entirely
async function getRoleFromDB(userId: string): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  try {
    const { data } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    return data?.role ?? null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Early passthrough — never run session logic on these paths.
  // /auth/confirm exchanges the PKCE code server-side; /nova-senha and
  // /recuperar-senha must not have getSession() consume the code first.
  if (
    pathname === '/auth/confirm' ||
    pathname === '/nova-senha' ||
    pathname === '/recuperar-senha'
  ) {
    return NextResponse.next({ request: { headers: request.headers } })
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const isAdminPath    = pathname === '/admin' || pathname.startsWith('/admin/')
  const isProtected    = PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isAuthPage     = pathname === '/login' || pathname === '/cadastro'

  // ── 1. No session: block protected routes ─────────────────────────────────
  if (!session) {
    if (isAdminPath || isProtected) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // ── 2. Has session: check role FIRST from public.users (service role) ─────
  const role = await getRoleFromDB(session.user.id)

  if (role === 'admin') {
    // Admin accessing /admin → allow
    if (isAdminPath) return response
    // Admin on protected routes or auth pages → send to /admin
    if (isProtected || isAuthPage) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    // Admin on public pages → allow freely
    return response
  }

  // ── 3. Non-admin rules ─────────────────────────────────────────────────────
  if (isAdminPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const userTipo = session.user.user_metadata?.tipo ?? 'cliente'

  if (isAuthPage) {
    const home = userTipo === 'cliente'
      ? '/cliente/projetos'
      : `/${userTipo}/dashboard`
    return NextResponse.redirect(new URL(home, request.url))
  }

  // ── 4. Cross-role isolation ───────────────────────────────────────────────
  if (isProtected) {
    const pathTipo =
      pathname.startsWith('/arquiteto') ? 'arquiteto' :
      pathname.startsWith('/cliente') ? 'cliente' :
      pathname.startsWith('/fornecedor') ? 'fornecedor' : null

    if (pathTipo && pathTipo !== userTipo) {
      const homeMap: Record<string, string> = {
        arquiteto: '/arquiteto/dashboard',
        cliente: '/cliente/projetos',
        fornecedor: '/fornecedor/dashboard',
      }
      return NextResponse.redirect(new URL(homeMap[userTipo] ?? '/login', request.url))
    }
  }

  // Protected path with valid session and correct role: allow through
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
