import crypto from 'crypto'

export interface CompDimensions {
  dimensao_x: number
  dimensao_y: number
  dimensao_z: number
}

export function computeGeomHash(d: CompDimensions): string {
  const vals = [d.dimensao_x, d.dimensao_y, d.dimensao_z]
    .map(v => Math.round(v * 100) / 100)
    .sort((a, b) => a - b)
  return crypto.createHash('sha256').update(vals.join(',') ).digest('hex')
}

// Returns tipo_componente slug or null if no rule matches
export function applyHeuristics(
  comp: CompDimensions & { posicao_x: number; posicao_y: number; posicao_z: number },
  upAxis: string
): string | null {
  const dx = comp.dimensao_x
  const dy = comp.dimensao_y
  const dz = comp.dimensao_z

  // Height in world space
  const height = upAxis === 'Z_UP' ? dz : dy
  // Floor-plane dimensions
  const w = dx
  const d = upAxis === 'Z_UP' ? dy : dz

  // Vertical position of bottom face
  const posY = upAxis === 'Z_UP' ? comp.posicao_z : comp.posicao_y
  const bottomZ = posY - height / 2
  const isNearFloor = bottomZ < 0.15   // within 15 cm of floor
  const isElevated = bottomZ > 0.35    // elevated (wall-hung or upper cabinet)

  // Aspect ratios
  const footprint = w * d
  const slimRatio = Math.max(w, d) / (Math.min(w, d) || 0.01)

  // Vaso sanitário: ~0.35–0.55w × 0.65–0.80d, height 0.35–0.45, on floor
  if (isNearFloor && height > 0.30 && height < 0.50 &&
      w > 0.30 && w < 0.60 && d > 0.55 && d < 0.90) {
    return 'vaso_sanitario'
  }

  // Banheira: large footprint near floor, elongated
  if (isNearFloor && footprint > 0.9 && slimRatio > 1.8 &&
      height > 0.40 && height < 0.75) {
    return 'banheira'
  }

  // Bancada / pia — counter height ~0.85–0.95m, depth 0.55–0.70, width >0.40
  if (Math.abs(height - 0.90) < 0.12 && d > 0.45 && d < 0.80 && w > 0.40 && isNearFloor) {
    if (w < 1.20) return 'cuba_cozinha'  // small bancada → cuba
    return 'bancada_cozinha'
  }

  // Armário aéreo: height 0.60–1.00m, depth 0.30–0.45, elevated >1.50m from floor
  if (isElevated && bottomZ > 1.40 && height > 0.50 && height < 1.10 &&
      d > 0.25 && d < 0.50) {
    return 'armario_aereo'
  }

  // Armário balcão: height 0.70–0.90m, depth 0.55–0.70, near floor
  if (isNearFloor && height > 0.65 && height < 0.95 && d > 0.50 && d < 0.75 && w > 0.30) {
    return 'armario_balcao'
  }

  // Gaveteiro: narrow, square-ish footprint, similar height range as balcão
  if (isNearFloor && height > 0.65 && height < 0.95 && slimRatio < 1.6 &&
      footprint < 0.40 && footprint > 0.04) {
    return 'gaveteiro'
  }

  // Armário roupeiro: tall, deep, wide
  if (isNearFloor && height > 1.80 && d > 0.50 && w > 0.80) {
    return 'armario_roupeiro'
  }

  // Closet: tall, very wide
  if (isNearFloor && height > 1.80 && w > 1.80 && d > 0.50) {
    return 'closet'
  }

  // Cama casal: large footprint, low height, near floor
  if (isNearFloor && height > 0.35 && height < 0.65 &&
      w > 1.35 && d > 1.80) {
    return 'cama'
  }

  // Cama solteiro
  if (isNearFloor && height > 0.35 && height < 0.65 &&
      w > 0.75 && w < 1.35 && d > 1.70) {
    return 'cama_solteiro'
  }

  // Criado-mudo: small, table height
  if (isNearFloor && height > 0.40 && height < 0.65 &&
      footprint < 0.25 && footprint > 0.01) {
    return 'criado_mudo'
  }

  // Sofá: seat height ~0.40–0.55, wide, deep
  if (isNearFloor && height > 0.65 && height < 1.00 &&
      w > 1.40 && d > 0.70) {
    return 'sofa'
  }

  // Poltrona: like sofá but narrower
  if (isNearFloor && height > 0.65 && height < 1.00 &&
      w > 0.65 && w < 1.40 && d > 0.65) {
    return 'poltrona'
  }

  // Mesa jantar: table height ~0.72–0.80, wide footprint
  if (isNearFloor && Math.abs(height - 0.76) < 0.10 &&
      footprint > 0.60 && slimRatio < 3.0) {
    return 'mesa_jantar'
  }

  // Mesa escritório: similar height, elongated
  if (isNearFloor && Math.abs(height - 0.76) < 0.10 &&
      footprint > 0.30 && slimRatio >= 1.8) {
    return 'mesa_escritorio'
  }

  // Mesa de centro: low coffee table
  if (isNearFloor && height > 0.30 && height < 0.52 && footprint > 0.15) {
    return 'mesa_centro'
  }

  // Geladeira: tall, narrow footprint
  if (isNearFloor && height > 1.50 && footprint > 0.15 && footprint < 0.80 &&
      slimRatio < 2.0) {
    return 'geladeira'
  }

  // TV: flat, elevated, wide
  if (isElevated && height < 0.10 && w > 0.60 && d < 0.15) {
    return 'tv'
  }

  // Chuveiro / Box: near floor, tall, small square footprint
  if (isNearFloor && height > 1.80 && footprint < 1.20 && slimRatio < 1.5) {
    return 'box'
  }

  return null
}

export function buildClassifyPrompt(
  comp: CompDimensions & { nome_skp: string; posicao_x: number; posicao_y: number; posicao_z: number },
  upAxis: string
): string {
  const height = upAxis === 'Z_UP' ? comp.dimensao_z : comp.dimensao_y
  const w = comp.dimensao_x
  const d = upAxis === 'Z_UP' ? comp.dimensao_y : comp.dimensao_z
  const posY = upAxis === 'Z_UP' ? comp.posicao_z : comp.posicao_y
  const bottomZ = posY - height / 2

  return [
    `Componente arquitetônico de um modelo SketchUp (.dae).`,
    `Nome no modelo: "${comp.nome_skp}"`,
    `Dimensões (metros): largura=${w.toFixed(2)}m, profundidade=${d.toFixed(2)}m, altura=${height.toFixed(2)}m`,
    `Posição Z do piso do componente: ${bottomZ.toFixed(2)}m acima do chão`,
    ``,
    `Com base apenas nas dimensões e posição, classifique este componente em UM dos seguintes tipos:`,
    `vaso_sanitario, cuba_banheiro, cuba_cozinha, bancada_cozinha, bancada_banheiro, tanque,`,
    `ducha_higienica, chuveiro, torneira, ralo, banheira, box,`,
    `geladeira, lava_loucas, lava_seca, microondas, forno, fogao, cooktop, coifa,`,
    `tv, monitor, computador, impressora,`,
    `sofa, cadeira_escritorio, cadeira, mesa_jantar, mesa_escritorio, mesa_centro,`,
    `cama, cama_solteiro, criado_mudo, poltrona, pufe, estante,`,
    `bancada_cozinha, armario_aereo, armario_balcao, gaveteiro, armario_roupeiro, nicho, painel_tv, closet, prateleira,`,
    `luminaria_pendente, luminaria_plafon, spot, arandela, trilho, lustre,`,
    `planta, quadro, espelho, tapete, almofada, decoracao,`,
    `porta, porta_vidro, janela, portao`,
    ``,
    `Responda APENAS com JSON: {"tipo": "<slug>", "confianca": <0.0-1.0>, "raciocinio": "<max 80 chars>"}`,
    `Se não souber, use tipo "decoracao" com confianca 0.3.`,
  ].join('\n')
}
