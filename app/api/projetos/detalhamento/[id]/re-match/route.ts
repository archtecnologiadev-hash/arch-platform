import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { applyHeuristics } from '@/lib/component-identifier'

interface CatalogEntry {
  id: string
  nome: string
  categoria: string
  palavras_chave: string[]
  tipo_componente: string
  fabricante: string | null
}

function matchCatalog(nomeSKP: string, catalog: CatalogEntry[]): CatalogEntry | null {
  const low = nomeSKP.toLowerCase()
  let bestMatch: CatalogEntry | null = null
  let bestScore = 0
  for (const entry of catalog) {
    if (!Array.isArray(entry.palavras_chave)) continue
    const score = entry.palavras_chave.filter(kw => kw && low.includes(kw.toLowerCase())).length
    if (score > bestScore) { bestScore = score; bestMatch = entry }
  }
  return bestScore > 0 ? bestMatch : null
}

// POST /api/projetos/detalhamento/[id]/re-match
// Re-applies catalog + heuristic matching to all unidentified components of a detalhamento.
// Does NOT require re-parsing the DAE — uses components already in the DB.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const detId = params.id

  const { data: det } = await supabase
    .from('detalhamento_projetos')
    .select('id, up_axis')
    .eq('id', detId)
    .single()
  if (!det) return NextResponse.json({ error: 'Detalhamento não encontrado' }, { status: 404 })

  const upAxis: string = det.up_axis ?? 'Y_UP'

  // Load catalog — SELECT without auth filter (RLS now allows public read)
  const { data: catalog, error: catalogErr } = await supabase
    .from('catalogo_fabricantes')
    .select('*')

  if (catalogErr) {
    console.error('[re-match] catalog query error:', catalogErr.message, catalogErr.code)
    return NextResponse.json({ error: `Falha ao carregar catálogo: ${catalogErr.message}` }, { status: 500 })
  }

  console.log(`[re-match] det=${detId} catalog=${catalog?.length ?? 0} entries upAxis=${upAxis}`)

  const catalogEntries: CatalogEntry[] = catalog ?? []

  if (catalogEntries.length === 0) {
    return NextResponse.json({ error: 'Catálogo vazio. Execute a migration 056 e tente novamente.' }, { status: 422 })
  }

  // Fetch ALL unidentified components (tipo_componente IS NULL)
  const { data: comps, error: compsErr } = await supabase
    .from('detalhamento_componentes')
    .select('id, nome_skp, dimensao_x, dimensao_y, dimensao_z, posicao_x, posicao_y, posicao_z, fabricante')
    .eq('detalhamento_id', detId)
    .is('tipo_componente', null)

  if (compsErr) return NextResponse.json({ error: compsErr.message }, { status: 500 })

  const pendentes = comps ?? []
  console.log(`[re-match] ${pendentes.length} componentes sem tipo`)

  let matchedCatalog = 0
  let matchedHeuristic = 0
  let stillUnknown = 0

  for (const comp of pendentes) {
    const dx = Number(comp.dimensao_x) || 0
    const dy = Number(comp.dimensao_y) || 0
    const dz = Number(comp.dimensao_z) || 0
    const px = Number(comp.posicao_x) || 0
    const py = Number(comp.posicao_y) || 0
    const pz = Number(comp.posicao_z) || 0

    // Step 1: catalog name match
    const catMatch = matchCatalog(comp.nome_skp, catalogEntries)
    if (catMatch) {
      await supabase.from('detalhamento_componentes').update({
        tipo_componente: catMatch.tipo_componente,
        fabricante: catMatch.fabricante ?? comp.fabricante ?? null,
        status_identificacao: 'catalogo',
      }).eq('id', comp.id)
      matchedCatalog++
      continue
    }

    // Step 2: geometry hash (componentes_aprendidos — skipped here, handled on initial save)

    // Step 3: geometric heuristics
    const heuristicTipo = applyHeuristics({ dimensao_x: dx, dimensao_y: dy, dimensao_z: dz, posicao_x: px, posicao_y: py, posicao_z: pz }, upAxis)
    if (heuristicTipo) {
      await supabase.from('detalhamento_componentes').update({
        tipo_componente: heuristicTipo,
        status_identificacao: 'heuristica',
      }).eq('id', comp.id)
      matchedHeuristic++
      continue
    }

    stillUnknown++
  }

  console.log(`[re-match] CONCLUÍDO: catalogo=${matchedCatalog} heuristica=${matchedHeuristic} unknown=${stillUnknown}`)

  return NextResponse.json({
    total: pendentes.length,
    matched_catalogo: matchedCatalog,
    matched_heuristica: matchedHeuristic,
    still_unknown: stillUnknown,
  })
}
