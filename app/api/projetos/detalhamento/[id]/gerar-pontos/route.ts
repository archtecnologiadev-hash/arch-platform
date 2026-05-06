import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { gerarPontosComponente, gerarPontosComodo, floorCoords } from '@/lib/detalhamento/regras-pontos'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const detId = params.id

  // Verify ownership via detalhamento → escritório
  const { data: det } = await supabase
    .from('detalhamento_projetos')
    .select('id, up_axis, escritorio_id')
    .eq('id', detId)
    .single()

  if (!det) return NextResponse.json({ error: 'Detalhamento não encontrado' }, { status: 404 })

  const upAxis: string = det.up_axis ?? 'Y_UP'

  // Fetch components and rooms in parallel
  const [{ data: comps }, { data: comodos }] = await Promise.all([
    supabase
      .from('detalhamento_componentes')
      .select('id, tipo_componente, posicao_x, posicao_y, posicao_z, dimensao_x, dimensao_y, dimensao_z')
      .eq('detalhamento_id', detId)
      .not('tipo_componente', 'is', null),
    supabase
      .from('detalhamento_comodos')
      .select('id, nome, polygon, area_m2')
      .eq('detalhamento_id', detId),
  ])

  // Delete previous points (idempotent)
  await supabase.from('detalhamento_pontos').delete().eq('detalhamento_id', detId)

  const pontosRows: Record<string, unknown>[] = []

  // Component rules
  for (const c of comps ?? []) {
    const fc = floorCoords(c, upAxis)
    const infoPontos = gerarPontosComponente({
      ...fc,
      id: c.id,
      tipo_componente: c.tipo_componente!,
    })
    for (const p of infoPontos) {
      pontosRows.push({ ...p, detalhamento_id: detId })
    }
  }

  // Room auto-points (lighting + switches)
  for (const r of comodos ?? []) {
    const poly = r.polygon as [number, number][] ?? []
    if (!poly.length) continue
    const infoPontos = gerarPontosComodo({
      id: r.id,
      nome: r.nome ?? '',
      polygon: poly,
      area_m2: r.area_m2,
    })
    for (const p of infoPontos) {
      pontosRows.push({ ...p, detalhamento_id: detId })
    }
  }

  // Insert in batches of 500
  let inserted = 0
  for (let i = 0; i < pontosRows.length; i += 500) {
    const { error } = await supabase
      .from('detalhamento_pontos')
      .insert(pontosRows.slice(i, i + 500))
    if (error) console.error('Erro ao inserir pontos:', error.message)
    else inserted += Math.min(500, pontosRows.length - i)
  }

  // Compute summary
  const summary: Record<string, number> = {}
  for (const p of pontosRows) {
    const d = p.disciplina as string
    summary[d] = (summary[d] ?? 0) + 1
  }

  return NextResponse.json({ total: inserted, por_disciplina: summary })
}
