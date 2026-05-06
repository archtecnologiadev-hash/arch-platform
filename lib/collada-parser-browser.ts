// COLLADA (.dae) parser — runs in the browser using DOMParser
// Handles SketchUp COLLADA 1.4 exports (Y_UP, column-major matrices)

export interface ParsedComponent {
  nome_skp: string
  tipo_inferido: string
  fabricante: string | null
  posicao_x: number
  posicao_y: number
  posicao_z: number
  dimensao_x: number
  dimensao_y: number
  dimensao_z: number
  raw_metadata: Record<string, unknown>
}

export interface ParsedComodo {
  nome: string
  polygon: [number, number][]
  area_m2: number
  pe_direito_m: number
}

export interface ParseResult {
  componentes: ParsedComponent[]
  comodos: ParsedComodo[]
  unit_scale: number
  up_axis: string
}

// ─── Matrix helpers (column-major, 16 floats) ─────────────────────────────────

type Mat4 = Float32Array

function identity(): Mat4 {
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])
}

function multiply(a: Mat4, b: Mat4): Mat4 {
  const r = new Float32Array(16)
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let v = 0
      for (let k = 0; k < 4; k++) v += a[k * 4 + row] * b[col * 4 + k]
      r[col * 4 + row] = v
    }
  }
  return r
}

function transformPoint(m: Mat4, x: number, y: number, z: number): [number, number, number] {
  return [
    m[0]*x + m[4]*y + m[8]*z  + m[12],
    m[1]*x + m[5]*y + m[9]*z  + m[13],
    m[2]*x + m[6]*y + m[10]*z + m[14],
  ]
}

function parseMat4(text: string): Mat4 {
  const vals = text.trim().split(/\s+/).map(Number)
  return vals.length === 16 ? new Float32Array(vals) : identity()
}

// ─── Type / manufacturer inference ────────────────────────────────────────────

const TYPE_MAP: [string, string[]][] = [
  ['mobiliario',  ['cadeira','mesa','sofa','sofá','cama','poltrona','armario','armário','escrivaninha','banqueta','chair','table','desk','bed','wardrobe','cabinet','couch','dresser','nightstand','bookcase','ottoman','bench','estante','cristaleira']],
  ['esquadria',   ['porta','janela','window','door','portao','portão','gate','basculante','pivotante','maxim','maxar','veneziana','persiana']],
  ['iluminacao',  ['luminaria','luminária','lamp','lampada','lâmpada','pendente','plafon','spot','arandela','trilho','lustre','abajur','light','fixture','refletor']],
  ['hidraulica',  ['vaso','banheira','pia','chuveiro','ducha','toilet','bathtub','sink','shower','cuba','bacia','torneira','faucet','lavatório','lavatorio','sifao','sifão']],
  ['marcenaria',  ['bancada','balcao','balcão','closet','prateleira','counter','rack','nicho','painel']],
  ['eletronico',  ['tv','televisao','televisão','monitor','computador','geladeira','fogao','fogão','forno','microondas','refrigerator','oven','appliance','freezer','cooktop']],
  ['decorativo',  ['planta','quadro','escultura','espelho','mirror','art','vaso_planta','rug','tapete','cortina','curtain','almofada']],
]

const ROOM_KEYWORDS = ['sala','quarto','cozinha','banheiro','lavabo','corredor','hall','garagem','varanda','terraço','terraco','escritório','escritorio','suíte','suite','sacada','área','area','ambiente','dormitório','dormitorio','living','dining','bedroom','bathroom','kitchen','corridor','lobby','garage','balcony','office','room','comodo','cômodo','espaço','espaco','lavanderia','despensa','adega']

const ARCH_KEYWORDS = ['parede','wall','laje','teto','piso','floor','ceiling','viga','beam','escada','stair','rampa','ramp','fundacao','fundação']

const KNOWN_BRANDS = ['ikea','deca','duratex','portobello','roca','kohler','tramontina','samsung','lg','sony','brastemp','electrolux','consul','whirlpool','apple','dell','hp','philco','arco','etna','franke','teca','ormiston','nespresso','bosch','siemens','miele','smeg','colormaq','mundial']

// Small hardware/electronic parts to skip (volume AND name conditions)
const HARDWARE_KEYWORDS = [
  'parafuso','screw','bolt','porca','nut','arruela','washer','pino','pin','rebite','rivet',
  'grampo','clip','bracket','dobradiça','dobradica','hinge','ferragem',
  'molex','pcb','dip','chip','capacitor','resistor','connector','header','socket',
  'gtx','rtx','rx','gpu','cpu','corsair','rgb','cooler','fan_',
]

function isHardware(name: string): boolean {
  const low = name.toLowerCase()
  return HARDWARE_KEYWORDS.some(k => low.includes(k))
}

function inferType(name: string): string {
  const low = name.toLowerCase()
  for (const [tipo, keys] of TYPE_MAP) {
    if (keys.some(k => low.includes(k))) return tipo
  }
  return 'outro'
}

function inferManufacturer(name: string): string | null {
  const low = name.toLowerCase()
  for (const brand of KNOWN_BRANDS) {
    if (low.includes(brand)) return brand.charAt(0).toUpperCase() + brand.slice(1)
  }
  // Try first underscore-segment if it looks like a brand (all caps, no spaces)
  const firstSegment = name.split(/[_\s]/)[0]
  if (firstSegment && /^[A-Z]{2,}$/.test(firstSegment) && firstSegment.length > 2) {
    return firstSegment
  }
  return null
}

function isArchitectural(name: string): boolean {
  const low = name.toLowerCase()
  return ARCH_KEYWORDS.some(k => low.includes(k))
}

function isRoom(name: string): boolean {
  const low = name.toLowerCase()
  return ROOM_KEYWORDS.some(k => low.includes(k))
}

// ─── Bounding box ─────────────────────────────────────────────────────────────

interface BBox {
  minX: number; maxX: number
  minY: number; maxY: number
  minZ: number; maxZ: number
}

function emptyBBox(): BBox {
  return { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity }
}

function expandBBox(b: BBox, x: number, y: number, z: number) {
  if (x < b.minX) b.minX = x; if (x > b.maxX) b.maxX = x
  if (y < b.minY) b.minY = y; if (y > b.maxY) b.maxY = y
  if (z < b.minZ) b.minZ = z; if (z > b.maxZ) b.maxZ = z
}

function mergeBBox(a: BBox, b: BBox): BBox {
  return {
    minX: Math.min(a.minX, b.minX), maxX: Math.max(a.maxX, b.maxX),
    minY: Math.min(a.minY, b.minY), maxY: Math.max(a.maxY, b.maxY),
    minZ: Math.min(a.minZ, b.minZ), maxZ: Math.max(a.maxZ, b.maxZ),
  }
}

function bboxValid(b: BBox): boolean {
  return b.minX !== Infinity
}

function bboxCenter(b: BBox): [number, number, number] {
  return [(b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, (b.minZ + b.maxZ) / 2]
}

function bboxDims(b: BBox): [number, number, number] {
  return [b.maxX - b.minX, b.maxY - b.minY, b.maxZ - b.minZ]
}

// ─── Geometry map build ────────────────────────────────────────────────────────

type GeometryMap = Map<string, Float32Array> // geomId → flat XYZ positions

function buildGeometryMap(doc: Document): GeometryMap {
  const map: GeometryMap = new Map()

  doc.querySelectorAll('library_geometries geometry').forEach(geo => {
    const id = geo.getAttribute('id')
    if (!id) return

    const mesh = geo.querySelector('mesh')
    if (!mesh) return

    // Find which source provides POSITION
    const verticesEl = mesh.querySelector('vertices')
    let posSourceId: string | null = null
    verticesEl?.querySelectorAll('input').forEach(inp => {
      if (inp.getAttribute('semantic') === 'POSITION') {
        posSourceId = (inp.getAttribute('source') || '').replace('#', '')
      }
    })
    if (!posSourceId) return

    const sourceEl = mesh.querySelector(`source[id="${posSourceId}"]`)
    const floatArrayEl = sourceEl?.querySelector('float_array')
    if (!floatArrayEl?.textContent) return

    const vals = floatArrayEl.textContent.trim().split(/\s+/).map(Number)
    map.set(id, new Float32Array(vals))
  })

  return map
}

// Compute bounding box of a geometry in local (pre-transform) space
function geomLocalBBox(verts: Float32Array): BBox {
  const b = emptyBBox()
  for (let i = 0; i + 2 < verts.length; i += 3) {
    expandBBox(b, verts[i], verts[i + 1], verts[i + 2])
  }
  return b
}

// Apply transform to a local bbox (conservative approximation via 8 corners)
function transformBBox(b: BBox, m: Mat4): BBox {
  if (!bboxValid(b)) return b
  const corners: [number, number, number][] = [
    [b.minX, b.minY, b.minZ], [b.maxX, b.minY, b.minZ],
    [b.minX, b.maxY, b.minZ], [b.maxX, b.maxY, b.minZ],
    [b.minX, b.minY, b.maxZ], [b.maxX, b.minY, b.maxZ],
    [b.minX, b.maxY, b.maxZ], [b.maxX, b.maxY, b.maxZ],
  ]
  const out = emptyBBox()
  for (const [cx, cy, cz] of corners) {
    const [wx, wy, wz] = transformPoint(m, cx, cy, cz)
    expandBBox(out, wx, wy, wz)
  }
  return out
}

// ─── Node traversal ───────────────────────────────────────────────────────────

interface RawNode {
  name: string
  el: Element
  worldMat: Mat4
  children: RawNode[]
  instanceGeomIds: string[]  // geometry IDs referenced directly
  instanceNodeId: string | null // library node ref
  depth: number
}

function buildNodeTree(
  el: Element,
  parentMat: Mat4,
  libraryNodes: Map<string, Element>,
  depth: number
): RawNode | null {
  if (el.tagName !== 'node') return null

  const name = el.getAttribute('name') || el.getAttribute('id') || ''

  // Local matrix — look for direct child <matrix> (not grandchildren)
  let localMat = identity()
  for (const child of Array.from(el.children)) {
    if (child.tagName === 'matrix' && child.textContent) {
      localMat = parseMat4(child.textContent)
      break
    }
  }
  const worldMat = multiply(parentMat, localMat)

  // Collect direct instance_geometry references
  const instanceGeomIds: string[] = []
  for (const child of Array.from(el.children)) {
    if (child.tagName === 'instance_geometry') {
      const url = (child.getAttribute('url') || '').replace('#', '')
      if (url) instanceGeomIds.push(url)
    }
  }

  // instance_node (component reference to library_nodes)
  let instanceNodeId: string | null = null
  for (const child of Array.from(el.children)) {
    if (child.tagName === 'instance_node') {
      instanceNodeId = (child.getAttribute('url') || '').replace('#', '')
      break
    }
  }

  // Recurse into child nodes
  const children: RawNode[] = []
  for (const child of Array.from(el.children)) {
    const sub = buildNodeTree(child, worldMat, libraryNodes, depth + 1)
    if (sub) children.push(sub)
  }

  return { name, el, worldMat, children, instanceGeomIds, instanceNodeId, depth }
}

// Compute world bbox for a RawNode (its geometry + all children)
function computeWorldBBox(node: RawNode, geomMap: GeometryMap, libraryNodes: Map<string, Element>): BBox {
  let bbox = emptyBBox()

  // Direct geometry
  for (const gid of node.instanceGeomIds) {
    const verts = geomMap.get(gid)
    if (verts) {
      const lb = geomLocalBBox(verts)
      const wb = transformBBox(lb, node.worldMat)
      if (bboxValid(wb)) bbox = mergeBBox(bbox, wb)
    }
  }

  // Library node reference
  if (node.instanceNodeId) {
    const libEl = libraryNodes.get(node.instanceNodeId)
    if (libEl) {
      const libBBox = computeLibNodeBBox(libEl, node.worldMat, geomMap)
      if (bboxValid(libBBox)) bbox = mergeBBox(bbox, libBBox)
    }
  }

  // Children
  for (const child of node.children) {
    const cb = computeWorldBBox(child, geomMap, libraryNodes)
    if (bboxValid(cb)) bbox = mergeBBox(bbox, cb)
  }

  return bbox
}

function computeLibNodeBBox(el: Element, worldMat: Mat4, geomMap: GeometryMap): BBox {
  // Apply the library node's own local matrix first
  let localMat = identity()
  for (const child of Array.from(el.children)) {
    if (child.tagName === 'matrix' && child.textContent) {
      localMat = parseMat4(child.textContent)
      break
    }
  }
  const mat = multiply(worldMat, localMat)

  let bbox = emptyBBox()
  for (const child of Array.from(el.children)) {
    if (child.tagName === 'instance_geometry') {
      const gid = (child.getAttribute('url') || '').replace('#', '')
      const verts = geomMap.get(gid)
      if (verts) {
        const lb = geomLocalBBox(verts)
        const wb = transformBBox(lb, mat)
        if (bboxValid(wb)) bbox = mergeBBox(bbox, wb)
      }
    }
  }
  // Recurse into sub-nodes of the library node
  for (const child of Array.from(el.children)) {
    if (child.tagName === 'node') {
      const cb = computeLibNodeBBox(child, mat, geomMap)
      if (bboxValid(cb)) bbox = mergeBBox(bbox, cb)
    }
  }
  return bbox
}

// ─── Main traversal: extract components and rooms ─────────────────────────────

function extractFromTree(
  nodes: RawNode[],
  geomMap: GeometryMap,
  libraryNodes: Map<string, Element>,
  scale: number,
  upAxis: string,
  components: ParsedComponent[],
  rooms: ParsedComodo[]
) {
  for (const node of nodes) {
    const { name, instanceNodeId, instanceGeomIds, children } = node

    if (!name || name === 'SketchUp' || name === 'Model') {
      // Root wrapper node — just recurse
      extractFromTree(children, geomMap, libraryNodes, scale, upAxis, components, rooms)
      continue
    }

    const lname = name.toLowerCase()

    // ── Component via library node reference ──
    if (instanceNodeId) {
      const libEl = libraryNodes.get(instanceNodeId)
      const compName = name || libEl?.getAttribute('name') || instanceNodeId
      if (!isArchitectural(compName)) {
        const bbox = computeWorldBBox(node, geomMap, libraryNodes)
        if (bboxValid(bbox)) {
          const [cx, cy, cz] = bboxCenter(bbox)
          const [dx, dy, dz] = bboxDims(bbox)
          const vol = dx * dy * dz * scale * scale * scale
          // Skip tiny hardware: volume < 0.005 m³ AND name matches hardware keywords
          if (vol < 0.005 && isHardware(compName)) {
            if (children.length > 0) extractFromTree(children, geomMap, libraryNodes, scale, upAxis, components, rooms)
            continue
          }
          components.push({
            nome_skp: compName,
            tipo_inferido: inferType(compName),
            fabricante: inferManufacturer(compName),
            posicao_x: round(cx * scale),
            posicao_y: round(cy * scale),
            posicao_z: round(cz * scale),
            dimensao_x: round(dx * scale),
            dimensao_y: round(dy * scale),
            dimensao_z: round(dz * scale),
            raw_metadata: { lib_id: instanceNodeId, depth: node.depth },
          })
        }
      }
      // Still recurse in case children exist
      if (children.length > 0) {
        extractFromTree(children, geomMap, libraryNodes, scale, upAxis, components, rooms)
      }
      continue
    }

    // ── Room / space ──
    if (isRoom(lname)) {
      const bbox = computeWorldBBox(node, geomMap, libraryNodes)
      if (bboxValid(bbox)) {
        const [dx, dy, dz] = bboxDims(bbox)
        const { area, height, polygon } = computeRoomMetrics(bbox, dx, dy, dz, scale, upAxis)
        if (area > 0.5) {
          rooms.push({ nome: name, polygon, area_m2: round(area), pe_direito_m: round(height) })
        }
      }
      // Recurse children for furniture inside the room
      extractFromTree(children, geomMap, libraryNodes, scale, upAxis, components, rooms)
      continue
    }

    // ── Architectural element (walls, floor, etc.) — skip but recurse ──
    if (isArchitectural(lname)) {
      extractFromTree(children, geomMap, libraryNodes, scale, upAxis, components, rooms)
      continue
    }

    // ── Leaf node with direct geometry — small = component ──
    if (instanceGeomIds.length > 0 && children.length === 0) {
      const bbox = computeWorldBBox(node, geomMap, libraryNodes)
      if (bboxValid(bbox)) {
        const [dx, dy, dz] = bboxDims(bbox)
        const vol = dx * dy * dz * scale * scale * scale
        if (vol > 0.00001 && vol < 50) { // must be > 1 cm³ and < 50 m³
          const [cx, cy, cz] = bboxCenter(bbox)
          components.push({
            nome_skp: name,
            tipo_inferido: inferType(name),
            fabricante: inferManufacturer(name),
            posicao_x: round(cx * scale),
            posicao_y: round(cy * scale),
            posicao_z: round(cz * scale),
            dimensao_x: round(dx * scale),
            dimensao_y: round(dy * scale),
            dimensao_z: round(dz * scale),
            raw_metadata: { depth: node.depth },
          })
          continue
        }
      }
    }

    // ── Group node (multiple children) that is room-sized ──
    if (children.length > 0 && node.depth <= 3) {
      const bbox = computeWorldBBox(node, geomMap, libraryNodes)
      if (bboxValid(bbox)) {
        const [dx, dy, dz] = bboxDims(bbox)
        const { area, height, polygon } = computeRoomMetrics(bbox, dx, dy, dz, scale, upAxis)
        if (area > 1) {
          rooms.push({ nome: name, polygon, area_m2: round(area), pe_direito_m: round(height) })
        }
      }
    }

    extractFromTree(children, geomMap, libraryNodes, scale, upAxis, components, rooms)
  }
}

function computeRoomMetrics(
  bbox: BBox,
  dx: number, dy: number, dz: number,
  scale: number,
  upAxis: string
): { area: number; height: number; polygon: [number, number][] } {
  // Y_UP: X and Z are horizontal, Y is height
  // Z_UP: X and Y are horizontal, Z is height
  let hArea: number, height: number
  let polyPts: [number, number][]

  if (upAxis === 'Z_UP') {
    hArea = dx * dy * scale * scale
    height = dz * scale
    polyPts = [
      [bbox.minX * scale, bbox.minY * scale],
      [bbox.maxX * scale, bbox.minY * scale],
      [bbox.maxX * scale, bbox.maxY * scale],
      [bbox.minX * scale, bbox.maxY * scale],
    ]
  } else {
    // Y_UP (default)
    hArea = dx * dz * scale * scale
    height = dy * scale
    polyPts = [
      [bbox.minX * scale, bbox.minZ * scale],
      [bbox.maxX * scale, bbox.minZ * scale],
      [bbox.maxX * scale, bbox.maxZ * scale],
      [bbox.minX * scale, bbox.maxZ * scale],
    ]
  }

  return { area: hArea, height, polygon: polyPts }
}

function round(v: number, decimals = 4): number {
  const f = Math.pow(10, decimals)
  return Math.round(v * f) / f
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function parseCollada(xmlText: string): ParseResult {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml')

  // Unit scale
  const unitEl = doc.querySelector('asset unit')
  const scale = unitEl ? parseFloat(unitEl.getAttribute('meter') || '1') : 1.0

  // Up axis
  const upAxisEl = doc.querySelector('asset up_axis')
  const upAxis = upAxisEl?.textContent?.trim().toUpperCase() || 'Y_UP'

  // Geometry map
  const geomMap = buildGeometryMap(doc)

  // Library nodes
  const libraryNodes = new Map<string, Element>()
  doc.querySelectorAll('library_nodes node').forEach(n => {
    const id = n.getAttribute('id')
    if (id) libraryNodes.set(id, n)
  })

  // Build node tree from visual scene
  const sceneEl = doc.querySelector('library_visual_scenes visual_scene')
  const rootNodes: RawNode[] = []
  if (sceneEl) {
    for (const child of Array.from(sceneEl.children)) {
      const node = buildNodeTree(child, identity(), libraryNodes, 0)
      if (node) rootNodes.push(node)
    }
  }

  const componentes: ParsedComponent[] = []
  const comodos: ParsedComodo[] = []

  extractFromTree(rootNodes, geomMap, libraryNodes, scale, upAxis, componentes, comodos)

  // Deduplicate rooms by name (take largest area)
  const roomMap = new Map<string, ParsedComodo>()
  for (const r of comodos) {
    const existing = roomMap.get(r.nome)
    if (!existing || r.area_m2 > existing.area_m2) roomMap.set(r.nome, r)
  }

  // Fallback: if no rooms detected (typical flat SketchUp exports), derive one from component extents
  if (roomMap.size === 0 && componentes.length > 0) {
    const fb = emptyBBox()
    for (const c of componentes) {
      const hx = c.dimensao_x / 2; const hy = c.dimensao_y / 2; const hz = c.dimensao_z / 2
      expandBBox(fb, c.posicao_x - hx, c.posicao_y - hy, c.posicao_z - hz)
      expandBBox(fb, c.posicao_x + hx, c.posicao_y + hy, c.posicao_z + hz)
    }
    if (bboxValid(fb)) {
      const [fdx, fdy, fdz] = bboxDims(fb)
      const { area, height, polygon } = computeRoomMetrics(fb, fdx, fdy, fdz, 1, upAxis)
      if (area > 0.5) roomMap.set('Ambiente', { nome: 'Ambiente', polygon, area_m2: round(area), pe_direito_m: round(height) })
    }
  }

  return {
    componentes: componentes.slice(0, 2000),
    comodos: Array.from(roomMap.values()),
    unit_scale: scale,
    up_axis: upAxis,
  }
}
