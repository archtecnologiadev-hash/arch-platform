import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { computeGeomHash, applyHeuristics } from '@/lib/component-identifier'

interface CatalogEntry {
  id: string
  nome: string
  categoria: string
  palavras_chave: string[]
  tipo_componente: string
  fabricante: string | null
}

interface AprendidoEntry {
  geometria_hash: string
  tipo_componente: string
}

function matchCatalog(nomeSKP: string, catalog: CatalogEntry[]): CatalogEntry | null {
  const low = nomeSKP.toLowerCase()
  let bestMatch: CatalogEntry | null = null
  let bestScore = 0
  for (const entry of catalog) {
    const score = entry.palavras_chave.filter(kw => low.includes(kw.toLowerCase())).length
    if (score > bestScore) { bestScore = score; bestMatch = entry }
  }
  return bestScore > 0 ? bestMatch : null
}

// GET /api/projetos/detalhamento?projeto_id=xxx
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const projetoId = req.nextUrl.searchParams.get('projeto_id')
  if (!projetoId) return NextResponse.json({ error: 'projeto_id required' }, { status: 400 })

  const { data: det } = await supabase
    .from('detalhamento_projetos')
    .select('*')
    .eq('projeto_id', projetoId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!det) return NextResponse.json({ detalhamento: null, componentes: [], comodos: [], catalogo: [] })

  const [{ data: componentes }, { data: comodos }, { data: catalogo }] = await Promise.all([
    supabase.from('detalhamento_componentes').select('*').eq('detalhamento_id', det.id).order('nome_skp'),
    supabase.from('detalhamento_comodos').select('*').eq('detalhamento_id', det.id).order('area_m2', { ascending: false }),
    supabase.from('catalogo_fabricantes').select('id,nome,categoria,tipo_componente,fabricante,palavras_chave').order('categoria').order('nome'),
  ])

  return NextResponse.json({
    detalhamento: det,
    componentes: componentes ?? [],
    comodos: comodos ?? [],
    catalogo: catalogo ?? [],
  })
}

// POST /api/projetos/detalhamento — save parsed data
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('[detalhamento POST] auth failed — no user')
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await req.json()
  const { projeto_id, escritorio_id, file_path, file_name, componentes = [], comodos = [], up_axis = 'Y_UP' } = body

  console.log(`[detalhamento POST] user=${user.id} projeto=${projeto_id} escritorio=${escritorio_id} comps=${componentes.length} comodos=${comodos.length} up_axis=${up_axis}`)

  if (!projeto_id || !escritorio_id || !file_path) {
    console.error('[detalhamento POST] missing required fields', { projeto_id, escritorio_id, file_path })
    return NextResponse.json({ error: 'projeto_id, escritorio_id e file_path são obrigatórios' }, { status: 400 })
  }

  // Load catalog and learned hashes in parallel
  const [{ data: catalog, error: catalogErr }, { data: aprendidos }] = await Promise.all([
    supabase.from('catalogo_fabricantes').select('*'),
    supabase
      .from('componentes_aprendidos')
      .select('geometria_hash, tipo_componente')
      .eq('escritorio_id', escritorio_id),
  ])

  if (catalogErr) {
    console.error('[detalhamento POST] catalog query failed:', catalogErr.message, catalogErr.code)
  }
  console.log(`[detalhamento POST] catalog loaded: ${catalog?.length ?? 0} entries`)

  const catalogEntries: CatalogEntry[] = catalog ?? []
  const aprendidosMap = new Map<string, string>(
    (aprendidos as AprendidoEntry[] ?? []).map(a => [a.geometria_hash, a.tipo_componente])
  )

  // Remove previous detalhamento
  const { error: delErr } = await supabase.from('detalhamento_projetos').delete().eq('projeto_id', projeto_id)
  if (delErr) console.warn('[detalhamento POST] delete anterior falhou (pode não existir):', delErr.message)

  console.log('[detalhamento POST] inserindo detalhamento_projetos...')
  const { data: det, error: detErr } = await supabase
    .from('detalhamento_projetos')
    .insert({ projeto_id, escritorio_id, dae_file_path: file_path, dae_file_name: file_name, status: 'done', up_axis })
    .select('id')
    .single()

  if (detErr || !det) {
    console.error('[detalhamento POST] FALHA ao inserir detalhamento_projetos:', detErr?.message, detErr?.code, detErr?.details)
    return NextResponse.json({ error: detErr?.message || 'Erro ao criar detalhamento' }, { status: 500 })
  }

  console.log(`[detalhamento POST] detalhamento_projetos inserido id=${det.id}`)
  const detId = det.id

  // Insert components: catalog → aprendizado → heuristica → null
  let compInsertErrors = 0
  if (componentes.length > 0) {
    const rows = (componentes as Record<string, unknown>[]).map(c => {
      const dx = Number(c.dimensao_x) || 0
      const dy = Number(c.dimensao_y) || 0
      const dz = Number(c.dimensao_z) || 0
      const px = Number(c.posicao_x) || 0
      const py = Number(c.posicao_y) || 0
      const pz = Number(c.posicao_z) || 0

      // Step 1: catalog name match
      const match = matchCatalog(String(c.nome_skp || ''), catalogEntries)
      if (match) {
        return {
          ...c,
          detalhamento_id: detId,
          tipo_componente: match.tipo_componente,
          fabricante: match.fabricante ?? c.fabricante ?? null,
          status_identificacao: 'catalogo',
          raw_metadata: c.raw_metadata ?? {},
        }
      }

      // Step 2: geometry hash lookup in learned components
      const hash = computeGeomHash({ dimensao_x: dx, dimensao_y: dy, dimensao_z: dz })
      const learnedTipo = aprendidosMap.get(hash)
      if (learnedTipo) {
        return {
          ...c,
          detalhamento_id: detId,
          tipo_componente: learnedTipo,
          fabricante: c.fabricante ?? null,
          status_identificacao: 'aprendizado',
          raw_metadata: c.raw_metadata ?? {},
        }
      }

      // Step 3: geometric heuristics
      const heuristicTipo = applyHeuristics(
        { dimensao_x: dx, dimensao_y: dy, dimensao_z: dz, posicao_x: px, posicao_y: py, posicao_z: pz },
        up_axis
      )
      if (heuristicTipo) {
        return {
          ...c,
          detalhamento_id: detId,
          tipo_componente: heuristicTipo,
          fabricante: c.fabricante ?? null,
          status_identificacao: 'heuristica',
          raw_metadata: c.raw_metadata ?? {},
        }
      }

      return {
        ...c,
        detalhamento_id: detId,
        tipo_componente: null,
        fabricante: c.fabricante ?? null,
        status_identificacao: null,
        raw_metadata: c.raw_metadata ?? {},
      }
    })

    console.log(`[detalhamento POST] inserindo ${rows.length} componentes em lotes de 500...`)
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase.from('detalhamento_componentes').insert(rows.slice(i, i + 500))
      if (error) {
        compInsertErrors++
        console.error(`[detalhamento POST] FALHA lote ${i}-${i+500}:`, error.message, error.code, error.details)
      }
    }
    console.log(`[detalhamento POST] componentes inseridos (erros: ${compInsertErrors}/${Math.ceil(rows.length/500)} lotes)`)
  }

  // Insert rooms
  if (comodos.length > 0) {
    const rows = (comodos as Record<string, unknown>[]).map(c => ({ ...c, detalhamento_id: detId }))
    const { error } = await supabase.from('detalhamento_comodos').insert(rows)
    if (error) console.error('[detalhamento POST] FALHA ao inserir cômodos:', error.message, error.code)
    else console.log(`[detalhamento POST] ${rows.length} cômodos inseridos`)
  }

  console.log(`[detalhamento POST] CONCLUÍDO id=${detId} comps=${componentes.length} comodos=${comodos.length} compErros=${compInsertErrors}`)
  return NextResponse.json({ id: detId, componentes: componentes.length, comodos: comodos.length })
}

// PATCH /api/projetos/detalhamento — update component or room fields
export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { id, tipo, escritorio_id, dimensao_x, dimensao_y, dimensao_z, ...fields } = body

  if (!id || !tipo) return NextResponse.json({ error: 'id e tipo obrigatórios' }, { status: 400 })

  const table = tipo === 'comodo' ? 'detalhamento_comodos' : 'detalhamento_componentes'
  const { error } = await supabase.from(table).update(fields).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // When tipo_componente is confirmed for a component, save geometry to aprendidos
  if (
    tipo === 'componente' && fields.tipo_componente && escritorio_id &&
    dimensao_x !== undefined && dimensao_y !== undefined && dimensao_z !== undefined
  ) {
    const geometria_hash = computeGeomHash({
      dimensao_x: Number(dimensao_x),
      dimensao_y: Number(dimensao_y),
      dimensao_z: Number(dimensao_z),
    })

    const { data: existing } = await supabase
      .from('componentes_aprendidos')
      .select('id, vezes_usado')
      .eq('escritorio_id', escritorio_id)
      .eq('geometria_hash', geometria_hash)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('componentes_aprendidos')
        .update({
          tipo_componente: fields.tipo_componente,
          vezes_usado: (existing.vezes_usado ?? 1) + 1,
          confirmado_por: user.id,
          confirmado_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('componentes_aprendidos').insert({
        escritorio_id,
        geometria_hash,
        tipo_componente: fields.tipo_componente,
        confirmado_por: user.id,
        vezes_usado: 1,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
