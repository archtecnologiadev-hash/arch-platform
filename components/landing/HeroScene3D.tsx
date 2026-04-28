'use client'
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const BUILDINGS = [
  { x: -5.5, z: -6, w: 1.5, h: 2.8, d: 1.5 },
  { x: -2.5, z: -5.5, w: 2,   h: 4.2, d: 2   },
  { x:  1,   z: -6,  w: 1.2, h: 1.8, d: 1.2 },
  { x:  4.2, z: -5.5,w: 2.5, h: 5.5, d: 2   },
  { x: -5.5, z: -1,  w: 1.2, h: 2,   d: 2.5 },
  { x: -5.5, z:  3,  w: 2,   h: 4.8, d: 2.5 },
  { x:  5.5, z: -1,  w: 1.5, h: 3.2, d: 2   },
  { x:  5.5, z:  3,  w: 1.2, h: 2.5, d: 1.5 },
  { x: -1.5, z:  4,  w: 2.5, h: 3,   d: 2   },
  { x:  2.5, z:  4.5,w: 1.8, h: 3.8, d: 1.8 },
  { x:  0,   z: -1,  w: 1,   h: 1.5, d: 1   },
  { x: -3.5, z:  1,  w: 1.2, h: 2.2, d: 1.2 },
  { x:  3,   z:  1,  w: 1,   h: 3,   d: 1   },
]

function FloatingCube({ position, scale, speed }: {
  position: [number, number, number]; scale: number; speed: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.x = clock.elapsedTime * speed * 0.5
    ref.current.rotation.y = clock.elapsedTime * speed * 0.7
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * speed) * 0.25
  })
  return (
    <mesh ref={ref} position={position} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#3b82f6" wireframe />
    </mesh>
  )
}

function Scene({ mouseRef }: { mouseRef: React.RefObject<{ x: number; y: number }> }) {
  const group = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!group.current || !mouseRef.current) return
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x, -0.42 + mouseRef.current.y * 0.12, 0.04,
    )
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y, mouseRef.current.x * 0.18, 0.04,
    )
  })

  return (
    <group ref={group} rotation={[-0.42, 0, 0]}>
      <gridHelper args={[36, 36, '#1e3a6e', '#0d1f3c']} />
      {BUILDINGS.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshBasicMaterial color="#007AFF" wireframe transparent opacity={0.65} />
        </mesh>
      ))}
      <FloatingCube position={[ 2,  6.5, -3]} scale={0.45} speed={0.7} />
      <FloatingCube position={[-3,  5.5, -1]} scale={0.28} speed={1.1} />
      <FloatingCube position={[ 5,  4.5,  2]} scale={0.38} speed={0.55} />
      <FloatingCube position={[-1,  7,    2]} scale={0.22} speed={0.9} />
    </group>
  )
}

export default function HeroScene3D({
  mouseRef,
}: { mouseRef: React.RefObject<{ x: number; y: number }> }) {
  return (
    <Canvas
      camera={{ position: [0, 4.5, 14], fov: 55 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
    >
      <Scene mouseRef={mouseRef} />
    </Canvas>
  )
}
