import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { buildClassifyPrompt } from '@/lib/component-identifier'
import Anthropic from '@anthropic-ai/sdk'

const MAX_CALLS = 50

interface CompRow {
  id: string
  nome_skp: string
  posicao_x: number
  posicao_y: number
  posicao_z: number
  dimensao_x: number
  dimensao_y: number
  dimensao_z: number
}

// POST /api/projetos/detalhamento/identificar
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { detalhamento_id } = await req.json()
  if (!detalhamento_id) return NextResponse.json({ error: 'detalhamento_id obrigatório' }, { status: 400 })

  // Fetch up_axis for the detalhamento
  const { data: det } = await supabase
    .from('detalhamento_projetos')
    .select('id, up_axis')
    .eq('id', detalhamento_id)
    .single()

  if (!det) return NextResponse.json({ error: 'Detalhamento não encontrado' }, { status: 404 })

  const upAxis: string = det.up_axis ?? 'Y_UP'

  // Fetch components with no tipo_componente
  const { data: comps, error: compErr } = await supabase
    .from('detalhamento_componentes')
    .select('id, nome_skp, posicao_x, posicao_y, posicao_z, dimensao_x, dimensao_y, dimensao_z')
    .eq('detalhamento_id', detalhamento_id)
    .is('tipo_componente', null)

  if (compErr) return NextResponse.json({ error: compErr.message }, { status: 500 })

  const pendentes: CompRow[] = comps ?? []
  if (pendentes.length === 0) {
    return NextResponse.json({ processados: 0, atualizados: 0, chamadas_api: 0 })
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 503 })
  }

  const client = new Anthropic({ apiKey: anthropicKey })

  let chamadas = 0
  let atualizados = 0
  let duvidosos = 0

  const toCall = pendentes.slice(0, MAX_CALLS)

  for (const comp of toCall) {
    const prompt = buildClassifyPrompt(comp, upAxis)

    let tipo: string | null = null
    let confianca = 0
    let raciocinio = ''

    try {
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 128,
        messages: [{ role: 'user', content: prompt }],
      })
      chamadas++

      const text = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
      // Extract JSON from response (may have markdown fences)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        tipo = parsed.tipo ?? null
        confianca = typeof parsed.confianca === 'number' ? parsed.confianca : 0
        raciocinio = parsed.raciocinio ?? ''
      }
    } catch (e) {
      console.error('Vision AI error for', comp.id, e)
      continue
    }

    if (!tipo) continue

    const statusId = confianca >= 0.6 ? 'vision_ai' : 'duvidoso'
    if (statusId === 'duvidoso') duvidosos++

    const { error: updErr } = await supabase
      .from('detalhamento_componentes')
      .update({
        tipo_componente: tipo,
        status_identificacao: statusId,
        confianca,
        raciocinio_ia: raciocinio,
      })
      .eq('id', comp.id)

    if (!updErr) atualizados++
  }

  // Log this run
  await supabase.from('detalhamento_ia_log').insert({
    detalhamento_id,
    chamadas,
    componentes_ok: atualizados - duvidosos,
    componentes_duvida: duvidosos,
  })

  return NextResponse.json({
    processados: toCall.length,
    atualizados,
    chamadas_api: chamadas,
    duvidosos,
  })
}
