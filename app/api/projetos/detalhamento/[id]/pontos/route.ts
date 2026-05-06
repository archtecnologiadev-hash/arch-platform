import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/projetos/detalhamento/[id]/pontos
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('detalhamento_pontos')
    .select('*')
    .eq('detalhamento_id', params.id)
    .order('disciplina')
    .order('tipo_ponto')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// PATCH /api/projetos/detalhamento/[id]/pontos  — body: { ponto_id, ...fields }
export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { ponto_id, ...fields } = await req.json()
  if (!ponto_id) return NextResponse.json({ error: 'ponto_id obrigatório' }, { status: 400 })

  const { error } = await supabase
    .from('detalhamento_pontos')
    .update(fields)
    .eq('id', ponto_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
