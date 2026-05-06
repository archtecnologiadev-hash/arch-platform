// SVG symbols for technical points — simplified NBR 5410 / NBR 5626
// All symbols drawn centered at (0,0), ~5mm overall size

export type StatusPonto = 'novo' | 'existente' | 'reposicionar'

const COR_STATUS: Record<StatusPonto, string> = {
  novo:         '#dc2626',
  reposicionar: '#2563eb',
  existente:    '#6b7280',
}

// Returns an inline SVG <g> element (no outer <svg> tag)
export function simboloSVG(tipo_ponto: string, status: StatusPonto): string {
  const c = COR_STATUS[status] ?? '#dc2626'
  const sw = '0.45'

  switch (tipo_ponto) {
    // ── Elétrica ─────────────────────────────────────────────────────────────
    case 'tomada_10a':
      return `<circle cx="0" cy="0" r="2.5" fill="none" stroke="${c}" stroke-width="${sw}"/>
              <line x1="-2.5" y1="0" x2="2.5" y2="0" stroke="${c}" stroke-width="${sw}"/>`

    case 'tomada_20a':
      return `<circle cx="0" cy="0" r="2.5" fill="none" stroke="${c}" stroke-width="${sw}"/>
              <line x1="-2.5" y1="-0.7" x2="2.5" y2="-0.7" stroke="${c}" stroke-width="${sw}"/>
              <line x1="-2.5" y1=" 0.7" x2="2.5" y2=" 0.7" stroke="${c}" stroke-width="${sw}"/>`

    case 'tomada_220v':
      return `<circle cx="0" cy="0" r="2.5" fill="none" stroke="${c}" stroke-width="${sw}"/>
              <line x1="-1.8" y1="-1.8" x2="1.8" y2="1.8" stroke="${c}" stroke-width="${sw}"/>
              <line x1="-0.7" y1="-0.7" x2="0.7" y2="0.7" stroke="${c}" stroke-width="0.9"/>`

    case 'tomada_vdi':
      return `<rect x="-2.5" y="-2" width="5" height="4" rx="0.4" fill="none" stroke="${c}" stroke-width="${sw}"/>
              <line x1="-1.5" y1="-0.6" x2="1.5" y2="-0.6" stroke="${c}" stroke-width="0.3"/>
              <line x1="-1.5" y1=" 0.6" x2="1.5" y2=" 0.6" stroke="${c}" stroke-width="0.3"/>
              <text x="0" y="-2.6" text-anchor="middle" font-size="1.6" fill="${c}">VDI</text>`

    case 'ponto_luz_teto':
      return `<circle cx="0" cy="0" r="2.5" fill="none" stroke="${c}" stroke-width="${sw}"/>
              <line x1="0" y1="-2.5" x2="0" y2="2.5" stroke="${c}" stroke-width="${sw}"/>
              <line x1="-2.5" y1="0" x2="2.5" y2="0" stroke="${c}" stroke-width="${sw}"/>`

    case 'interruptor_simples':
      return `<circle cx="-2" cy="0" r="0.6" fill="${c}"/>
              <line x1="-2" y1="0" x2="2" y2="0" stroke="${c}" stroke-width="${sw}"/>
              <line x1="0.5" y1="0" x2="2" y2="-1.8" stroke="${c}" stroke-width="${sw}"/>`

    case 'ponto_exaustao':
      return `<circle cx="0" cy="0" r="2.5" fill="none" stroke="${c}" stroke-width="${sw}"/>
              <text x="0" y="0.9" text-anchor="middle" font-size="2.2" fill="${c}" font-weight="bold">E</text>`

    // ── Hidráulica ────────────────────────────────────────────────────────────
    case 'agua_fria':
      return `<polygon points="0,-3 2.6,1.5 -2.6,1.5" fill="none" stroke="#1d4ed8" stroke-width="${sw}"/>
              <text x="0" y="0.8" text-anchor="middle" font-size="1.8" fill="#1d4ed8" font-weight="bold">F</text>`

    case 'agua_quente':
      return `<polygon points="0,3 2.6,-1.5 -2.6,-1.5" fill="none" stroke="#b91c1c" stroke-width="${sw}"/>
              <text x="0" y="0.5" text-anchor="middle" font-size="1.8" fill="#b91c1c" font-weight="bold">Q</text>`

    case 'esgoto_50':
    case 'esgoto_100':
      return `<circle cx="0" cy="0" r="2.5" fill="none" stroke="#7c2d12" stroke-width="${sw}"/>
              <line x1="-1.8" y1="-1.8" x2="1.8" y2="1.8" stroke="#7c2d12" stroke-width="${sw}"/>
              <line x1=" 1.8" y1="-1.8" x2="-1.8" y2="1.8" stroke="#7c2d12" stroke-width="${sw}"/>`

    // ── Gás ───────────────────────────────────────────────────────────────────
    case 'ponto_gas':
      return `<polygon points="0,-3 2.6,-1.5 2.6,1.5 0,3 -2.6,1.5 -2.6,-1.5"
                fill="none" stroke="#d97706" stroke-width="${sw}"/>
              <text x="0" y="0.9" text-anchor="middle" font-size="2.5" fill="#d97706" font-weight="bold">G</text>`

    default:
      return `<circle cx="0" cy="0" r="2.5" fill="none" stroke="${c}" stroke-width="${sw}"/>
              <text x="0" y="0.8" text-anchor="middle" font-size="1.6" fill="${c}">?</text>`
  }
}

export const TIPO_LABEL: Record<string, string> = {
  tomada_10a:          'Tomada 10A',
  tomada_20a:          'Tomada 20A',
  tomada_220v:         'Tomada 220V dedicada',
  tomada_vdi:          'Tomada VDI (TV/Dados)',
  ponto_luz_teto:      'Ponto de luz — teto',
  interruptor_simples: 'Interruptor simples',
  ponto_exaustao:      'Saída de exaustão',
  agua_fria:           'Água fria',
  agua_quente:         'Água quente',
  esgoto_50:           'Esgoto Ø50mm',
  esgoto_100:          'Esgoto Ø100mm',
  ponto_gas:           'Ponto de gás',
}

export const DISC_COR: Record<string, string> = {
  hidraulica:  '#1d4ed8',
  eletrica:    '#1a1a1a',
  gas:         '#d97706',
  mobiliario:  '#6b7280',
}
