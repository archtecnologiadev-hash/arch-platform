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

/**
 * Check admin status via three layers (in order of reliability):
 * 1. JWT user_metadata.role — instant, no DB query, set by auth trigger or admin API
 * 2. DB query with anon client + session (uses RLS users_select_own)
 * 3. DB query with service role (bypasses RLS, requires SUPABASE_SERVICE_ROLE_KEY)
 */
async function isAdmin(
  session: { user: { id: string; user_metadata?: Record<string, unknown> } },
  anonClient: ReturnType<typeof createServerClient>
): Promise<boolean> {
  // Layer 1: JWT metadata (fast path — no network request)
  if (session.user.user_metadata?.role === 'admin') return true

  // Layer 2: anon client with session cookie (relies on RLS users_select_own)
  try {
    const { data } = await anonClient
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()
    if (data?.role === 'admin') return true
  } catch { /* ignore — column may not exist yet */ }

  // Layer 3: service role (bypasses RLS, requires env var)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { data } = await createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      ).from('users').select('role').eq('id', session.user.id).single()
      if (data?.role === 'admin') return true
    } catch { /* ignore */ }
  }

  return false
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

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
  const pathname = request.nextUrl.pathname

  // ── /admin routes — check role FIRST ──────────────────────────────────────
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const admin = await isAdmin(session, supabase)
    if (!admin) {
      // Not admin — send to their own dashboard, not /login (avoids redirect loop)
      const tipo = session.user.user_metadata?.tipo ?? 'cliente'
      return NextResponse.redirect(new URL(`/${tipo}/dashboard`, request.url))
    }
    return response
  }

  // ── Regular protected paths ────────────────────────────────────────────────
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  if (isProtected) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Admin trying to access non-admin protected paths → redirect to /admin
    const admin = await isAdmin(session, supabase)
    if (admin) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // ── Auth pages: redirect already-logged-in users ───────────────────────────
  if ((pathname === '/login' || pathname === '/cadastro') && session) {
    const admin = await isAdmin(session, supabase)
    if (admin) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    const tipo = session.user.user_metadata?.tipo ?? 'cliente'
    return NextResponse.redirect(new URL(`/${tipo}/dashboard`, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
