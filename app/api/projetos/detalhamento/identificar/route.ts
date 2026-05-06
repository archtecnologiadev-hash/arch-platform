import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { buildClassifyPrompt } from '@/lib/component-identifier'
import Anthropic from '@anthropic-ai/sdk'

// claude-sonnet-4-6 pricing (USD per token, as of 2025)
const COST_PER_INPUT_TOKEN  = 3  / 1_000_000   // $3/MTok
const COST_PER_OUTPUT_TOKEN = 15 / 1_000_000   // $15/MTok

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

  // Verify ANTHROPIC_API_KEY is configured — fail fast, not silently
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    console.error('[identificar] ANTHROPIC_API_KEY não configurada no ambiente do servidor')
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY não configurada. Configure a variável de ambiente no Vercel antes de usar a identificação por IA.' },
      { status: 503 }
    )
  }

  const { data: det } = await supabase
    .from('detalhamento_projetos')
    .select('id, up_axis')
    .eq('id', detalhamento_id)
    .single()

  if (!det) return NextResponse.json({ error: 'Detalhamento não encontrado' }, { status: 404 })

  const upAxis: string = det.up_axis ?? 'Y_UP'

  const { data: comps, error: compErr } = await supabase
    .from('detalhamento_componentes')
    .select('id, nome_skp, posicao_x, posicao_y, posicao_z, dimensao_x, dimensao_y, dimensao_z')
    .eq('detalhamento_id', detalhamento_id)
    .is('tipo_componente', null)

  if (compErr) return NextResponse.json({ error: compErr.message }, { status: 500 })

  const pendentes: CompRow[] = comps ?? []
  console.log(`[identificar] detalhamento=${detalhamento_id} pendentes=${pendentes.length} upAxis=${upAxis}`)

  if (pendentes.length === 0) {
    return NextResponse.json({ processados: 0, atualizados: 0, chamadas_api: 0 })
  }

  const client = new Anthropic({ apiKey: anthropicKey })

  let chamadas   = 0
  let atualizados = 0
  let duvidosos  = 0
  let totalCustoUsd = 0

  const toCall = pendentes.slice(0, MAX_CALLS)

  for (const comp of toCall) {
    const prompt = buildClassifyPrompt(comp, upAxis)

    let tipo: string | null = null
    let confianca = 0
    let raciocinio = ''
    let tokensInput = 0
    let tokensOutput = 0
    let custoUsd = 0
    let respostaRaw = ''
    let erroMsg: string | null = null

    try {
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 128,
        messages: [{ role: 'user', content: prompt }],
      })
      chamadas++

      tokensInput  = msg.usage?.input_tokens  ?? 0
      tokensOutput = msg.usage?.output_tokens ?? 0
      custoUsd = tokensInput * COST_PER_INPUT_TOKEN + tokensOutput * COST_PER_OUTPUT_TOKEN
      totalCustoUsd += custoUsd

      respostaRaw = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''

      console.log(
        `[identificar] comp=${comp.id} nome="${comp.nome_skp}" ` +
        `tokens=${tokensInput}in/${tokensOutput}out custo=$${custoUsd.toFixed(6)} ` +
        `resposta=${respostaRaw.slice(0, 120)}`
      )

      const jsonMatch = respostaRaw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        tipo      = parsed.tipo      ?? null
        confianca = typeof parsed.confianca === 'number' ? parsed.confianca : 0
        raciocinio = parsed.raciocinio ?? ''
      }
    } catch (e) {
      erroMsg = e instanceof Error ? e.message : String(e)
      console.error(`[identificar] ERRO comp=${comp.id} nome="${comp.nome_skp}":`, erroMsg)
    }

    // Log every call (success or error) to vision_ai_logs
    await supabase.from('vision_ai_logs').insert({
      detalhamento_id,
      componente_id:  comp.id,
      tokens_input:   tokensInput  || null,
      tokens_output:  tokensOutput || null,
      custo_usd:      custoUsd > 0 ? custoUsd : null,
      resposta_raw:   respostaRaw  || null,
      erro:           erroMsg,
    })

    if (!tipo || erroMsg) continue

    const statusId = confianca >= 0.6 ? 'vision_ai' : 'duvidoso'
    if (statusId === 'duvidoso') duvidosos++

    const { error: updErr } = await supabase
      .from('detalhamento_componentes')
      .update({
        tipo_componente:      tipo,
        status_identificacao: statusId,
        confianca,
        raciocinio_ia:        raciocinio,
      })
      .eq('id', comp.id)

    if (!updErr) atualizados++
  }

  console.log(
    `[identificar] CONCLUÍDO detalhamento=${detalhamento_id} ` +
    `chamadas=${chamadas} atualizados=${atualizados} duvidosos=${duvidosos} ` +
    `custo_total=$${totalCustoUsd.toFixed(6)}`
  )

  // Summary log (aggregate per run)
  await supabase.from('detalhamento_ia_log').insert({
    detalhamento_id,
    chamadas,
    componentes_ok:    atualizados - duvidosos,
    componentes_duvida: duvidosos,
  })

  return NextResponse.json({
    processados:  toCall.length,
    atualizados,
    chamadas_api: chamadas,
    duvidosos,
    custo_usd:    totalCustoUsd,
  })
}
