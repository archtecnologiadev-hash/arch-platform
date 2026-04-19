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

// Service role client bypasses RLS — used only for admin role check
function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getUserRole(userId: string): Promise<string | null> {
  try {
    const { data } = await serviceClient()
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

  // ── Admin route guard (service role — bypasses RLS) ────────────────────────
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const role = await getUserRole(session.user.id)
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // ── Regular protected routes ───────────────────────────────────────────────
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Redirect logged-in users away from auth pages ─────────────────────────
  if ((pathname === '/login' || pathname === '/cadastro') && session) {
    const role = await getUserRole(session.user.id)
    if (role === 'admin') {
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
