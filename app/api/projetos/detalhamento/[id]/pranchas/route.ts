import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET — list pranchas for a detalhamento
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('detalhamento_pranchas')
    .select('*')
    .eq('detalhamento_id', params.id)
    .order('disciplina')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — upsert a prancha record (called after client uploads PDF to Storage)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { disciplina, numero_prancha, pdf_path } = await req.json()
  if (!disciplina || !pdf_path) {
    return NextResponse.json({ error: 'disciplina e pdf_path obrigatórios' }, { status: 400 })
  }

  // Delete previous prancha of same disciplina (re-generate)
  await supabase
    .from('detalhamento_pranchas')
    .delete()
    .eq('detalhamento_id', params.id)
    .eq('disciplina', disciplina)

  const { data, error } = await supabase
    .from('detalhamento_pranchas')
    .insert({ detalhamento_id: params.id, disciplina, numero_prancha, pdf_path })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
