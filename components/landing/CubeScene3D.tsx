'use client'
import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const FACE_COLORS = ['#1a56db', '#0044b5', '#2563eb', '#003999', '#1e4ec8', '#0050d0']

function FeatureCube() {
  const meshRef  = useRef<THREE.Mesh>(null)
  const edgeRef  = useRef<THREE.Mesh>(null)
  const isDrag   = useRef(false)
  const lastPos  = useRef({ x: 0, y: 0 })
  const velocity = useRef({ x: 0, y: 0 })
  const { gl }   = useThree()

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    const edge = edgeRef.current
    if (!mesh) return

    if (!isDrag.current) {
      // Decay velocity, auto-rotate when idle
      velocity.current.x *= 0.93
      velocity.current.y *= 0.93
      if (Math.abs(velocity.current.x) < 0.001 && Math.abs(velocity.current.y) < 0.001) {
        mesh.rotation.y += 0.006
        mesh.rotation.x += 0.0015
      } else {
        mesh.rotation.y += velocity.current.x
        mesh.rotation.x += velocity.current.y
      }
    }

    if (edge) {
      ;(edge.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.sin(clock.elapsedTime * 1.5) * 0.1
    }
  })

  const onPointerDown = (e: { clientX: number; clientY: number }) => {
    isDrag.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    velocity.current = { x: 0, y: 0 }
    gl.domElement.style.cursor = 'grabbing'
  }
  const onPointerUp = () => {
    isDrag.current = false
    gl.domElement.style.cursor = 'grab'
  }
  const onPointerMove = (e: { clientX: number; clientY: number }) => {
    if (!isDrag.current || !meshRef.current) return
    const dx = (e.clientX - lastPos.current.x) * 0.01
    const dy = (e.clientY - lastPos.current.y) * 0.01
    meshRef.current.rotation.y += dx
    meshRef.current.rotation.x += dy
    velocity.current = { x: dx, y: dy }
    lastPos.current = { x: e.clientX, y: e.clientY }
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        onPointerDown={onPointerDown as never}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove as never}
        onPointerLeave={onPointerUp}
      >
        <boxGeometry args={[2.4, 2.4, 2.4]} />
        {FACE_COLORS.map((color, i) => (
          <meshStandardMaterial
            key={i}
            attach={`material-${i}`}
            color={color}
            roughness={0.12}
            metalness={0.88}
          />
        ))}
      </mesh>
      <mesh ref={edgeRef}>
        <boxGeometry args={[2.44, 2.44, 2.44]} />
        <meshBasicMaterial color="#60a5fa" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

export default function CubeScene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.5], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%', cursor: 'grab' }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={2.5} color="#3b82f6" />
      <pointLight position={[-5, -4, -5]} intensity={1.2} color="#1d4ed8" />
      <directionalLight position={[0, 6, 6]} intensity={1.2} color="#ffffff" />
      <FeatureCube />
    </Canvas>
  )
}
