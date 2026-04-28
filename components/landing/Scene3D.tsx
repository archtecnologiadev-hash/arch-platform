'use client'
import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Scene data ───────────────────────────────────────────────────────────────

const BUILDINGS: Array<{ pos: [number, number, number]; w: number; h: number; d: number }> = [
  { pos: [-3.5, 0, -2.0], w: 2.8, h: 4.0, d: 2.8 },
  { pos: [ 2.5, 0,  0.0], w: 1.8, h: 6.5, d: 1.8 },
  { pos: [-5.5, 0,  1.5], w: 1.6, h: 2.8, d: 2.2 },
  { pos: [ 5.0, 0, -1.5], w: 2.0, h: 5.0, d: 1.6 },
  { pos: [ 0.0, 0, -4.5], w: 3.5, h: 2.0, d: 1.5 },
  { pos: [-1.5, 0,  3.0], w: 1.2, h: 5.5, d: 1.2 },
]

// Pairs of building indices to connect with wireframe lines
const LINE_PAIRS = [0, 1, 1, 3, 3, 4, 4, 0, 0, 2, 1, 5, 2, 5]

// ─── Building (solid body + edge wireframe) ───────────────────────────────────

function Building({ pos, w, h, d }: { pos: [number, number, number]; w: number; h: number; d: number }) {
  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
    [w, h, d],
  )
  return (
    <group position={[pos[0], h / 2, pos[2]]}>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color="#060c1a"
          roughness={0.85}
          metalness={0.15}
          transparent
          opacity={0.9}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#3b82f6" transparent opacity={0.72} />
      </lineSegments>
    </group>
  )
}

// ─── Wireframe connection lines between building tops ─────────────────────────

function ConnectionLines() {
  const obj = useMemo(() => {
    const tops = BUILDINGS.map(b => new THREE.Vector3(b.pos[0], b.h, b.pos[2]))
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < LINE_PAIRS.length; i += 2) {
      pts.push(tops[LINE_PAIRS[i]], tops[LINE_PAIRS[i + 1]])
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({ color: '#1d4ed8', transparent: true, opacity: 0.3 })
    return new THREE.LineSegments(geo, mat)
  }, [])

  return <primitive object={obj} />
}

// ─── Floating particles ───────────────────────────────────────────────────────

function Particles({ count }: { count: number }) {
  const geo = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 26
      arr[i * 3 + 1] = Math.random() * 13 + 0.3
      arr[i * 3 + 2] = (Math.random() - 0.5) * 26
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3))
    return g
  }, [count])

  const ref = useRef<THREE.Points>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.018
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.055} color="#93c5fd" transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

// ─── Pulsing accent light ─────────────────────────────────────────────────────

function PulsingLight({
  position,
  color,
  speed = 1.5,
}: {
  position: [number, number, number]
  color: string
  speed?: number
}) {
  const ref = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.intensity = 0.4 + Math.sin(clock.elapsedTime * speed) * 0.28
    }
  })
  return <pointLight ref={ref} position={position} color={color} distance={10} />
}

// ─── Orbital camera + mouse parallax ─────────────────────────────────────────

function CameraRig({
  mouseRef,
}: {
  mouseRef: React.RefObject<{ x: number; y: number }>
}) {
  const { camera } = useThree()
  const angle = useRef(0)
  const pos   = useRef(new THREE.Vector3(0, 8, 16))

  useFrame((_, dt) => {
    angle.current += dt * 0.09

    const mx = mouseRef.current?.x ?? 0
    const my = mouseRef.current?.y ?? 0

    const tx = Math.sin(angle.current) * 16 + mx * 2.5
    const ty = 7.5 + my * -1.8
    const tz = Math.cos(angle.current) * 16 + my * 1.2

    pos.current.lerp(new THREE.Vector3(tx, ty, tz), 0.022)
    camera.position.copy(pos.current)
    camera.lookAt(0, 2.2, 0)
  })

  return null
}

// ─── Full scene (renders inside Canvas) ──────────────────────────────────────

function ArchScene({
  mouseRef,
  isMobile,
}: {
  mouseRef: React.RefObject<{ x: number; y: number }>
  isMobile: boolean
}) {
  return (
    <>
      {/* Sky colour + atmospheric fog */}
      <color attach="background" args={['#070c1a']} />
      <fog attach="fog" args={['#070c1a', 18, 44]} />

      {/* ── Lights ── */}
      <ambientLight intensity={0.05} />
      {/* Key — top-right, cool white */}
      <directionalLight position={[10, 14, 6]} intensity={1.4} color="#c8e0ff" />
      {/* Fill — left side, cyan */}
      <pointLight position={[-10, 9, -4]} intensity={0.9} color="#0088ff" />
      {/* Rim — behind scene, violet */}
      <pointLight position={[0, 6, -14]} intensity={0.8} color="#5533ff" />
      {/* Pulsing accents on buildings */}
      <PulsingLight position={[ 2.5,  6.8,  0.0]} color="#00ccff" speed={1.4} />
      <PulsingLight position={[-3.5,  4.2, -2.0]} color="#0066ff" speed={1.9} />

      {/* ── Ground ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#04080f" roughness={0.92} metalness={0.08} />
      </mesh>
      <gridHelper args={[40, 40, '#0d1f3c', '#060f1e']} />

      {/* ── Architecture ── */}
      {BUILDINGS.map((b, i) => (
        <Building key={i} pos={b.pos} w={b.w} h={b.h} d={b.d} />
      ))}
      <ConnectionLines />

      {/* ── Atmosphere ── */}
      <Particles count={isMobile ? 80 : 220} />

      {/* ── Camera ── */}
      <CameraRig mouseRef={mouseRef} />
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Scene3D({
  mouseRef,
}: {
  mouseRef: React.RefObject<{ x: number; y: number }>
}) {
  const [isMobile, setIsMobile] = useState(false)
  const [loaded,   setLoaded]   = useState(false)
  const [visible,  setVisible]  = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMobile(window.matchMedia('(max-width: 768px)').matches)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let mounted = true
    const obs = new IntersectionObserver(
      ([entry]) => { if (mounted) setVisible(entry.isIntersecting) },
      { threshold: 0.01 },
    )
    obs.observe(el)
    return () => { mounted = false; obs.disconnect() }
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Fade-in wrapper */}
      <div style={{
        width: '100%', height: '100%',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 1s ease',
      }}>
        <Canvas
          camera={{ position: [0, 8, 16], fov: 60 }}
          gl={{
            antialias: !isMobile,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          dpr={[1, isMobile ? 1.5 : 2]}
          frameloop={visible ? 'always' : 'never'}
          onCreated={() => setLoaded(true)}
          style={{ width: '100%', height: '100%' }}
        >
          <ArchScene mouseRef={mouseRef} isMobile={isMobile} />
        </Canvas>
      </div>

      {/* Placeholder shown before canvas is ready */}
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, #070c1a 0%, #0a0e27 100%)',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  )
}
