import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

async function verifyAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('role, id').eq('id', user.id).single()
  if (!data || data.role !== 'admin') return null
  return user
}

export async function GET() {
  const admin_user = await verifyAdmin()
  if (!admin_user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const admin = createAdminClient()
  const { count } = await admin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .like('email', '%@arc-test.local')

  return NextResponse.json({ count: count ?? 0 })
}

export async function DELETE() {
  const admin_user = await verifyAdmin()
  if (!admin_user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const admin = createAdminClient()

  const { data, error } = await admin.rpc('remover_dados_teste')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ result: data })
}
