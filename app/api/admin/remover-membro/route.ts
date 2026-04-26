import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { user_id } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Verify caller is owner of an escritorio
  const { data: escritorio } = await admin
    .from('escritorios')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!escritorio) return NextResponse.json({ error: 'Not an owner' }, { status: 403 })

  // Verify target is a member of this escritorio
  const { data: targetUser } = await admin
    .from('users')
    .select('id, escritorio_vinculado_id')
    .eq('id', user_id)
    .maybeSingle()
  if (!targetUser || targetUser.escritorio_vinculado_id !== escritorio.id) {
    return NextResponse.json({ error: 'User not in your team' }, { status: 403 })
  }

  // Delete project memberships
  await admin.from('projeto_membros').delete().eq('user_id', user_id)

  // Delete conversations where this user is the arquiteto, including their messages
  const { data: convs } = await admin.from('conversas').select('id').eq('arquiteto_id', user_id)
  const convIds = (convs ?? []).map((c: { id: string }) => c.id)
  if (convIds.length > 0) {
    await admin.from('mensagens').delete().in('conversa_id', convIds)
    await admin.from('conversas').delete().in('id', convIds)
  }

  // Delete any other messages sent by the user
  await admin.from('mensagens').delete().eq('remetente_id', user_id)

  // Delete public.users record
  await admin.from('users').delete().eq('id', user_id)

  // Delete auth.users record
  const { error: authError } = await admin.auth.admin.deleteUser(user_id)
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
