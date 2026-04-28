'use client'
import { useEffect, useRef } from 'react'

// Pre-computed building data — no random, deterministic
const BUILDINGS = [
  { x: 4,  y: 28, w: 6,  h: 20 },
  { x: 12, y: 16, w: 8,  h: 32 },
  { x: 22, y: 26, w: 5,  h: 22 },
  { x: 29, y: 10, w: 10, h: 38 },
  { x: 41, y: 22, w: 6,  h: 26 },
  { x: 50, y: 14, w: 9,  h: 34 },
  { x: 61, y: 24, w: 5,  h: 24 },
  { x: 68, y: 8,  w: 12, h: 40 },
  { x: 82, y: 20, w: 7,  h: 28 },
  { x: 91, y: 16, w: 6,  h: 32 },
  { x: 7,  y: 36, w: 4,  h: 12 },
  { x: 37, y: 32, w: 3,  h: 16 },
  { x: 57, y: 34, w: 4,  h: 14 },
  { x: 77, y: 30, w: 5,  h: 18 },
]

const FLOAT_BOXES = [
  { cx: 22, cy: 18, size: 2.5, delay: 0,    dur: 3.2 },
  { cx: 55, cy: 12, size: 1.8, delay: 0.8,  dur: 4.1 },
  { cx: 78, cy: 20, size: 2.2, delay: 1.5,  dur: 2.8 },
  { cx: 38, cy: 10, size: 1.5, delay: 0.4,  dur: 3.7 },
]

export default function HeroScene3D({
  mouseRef,
}: {
  mouseRef: React.RefObject<{ x: number; y: number }>
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const rafRef  = useRef<number>(0)

  useEffect(() => {
    let tx = 0, ty = 0
    const tick = () => {
      if (wrapRef.current && mouseRef.current) {
        const mx = mouseRef.current.x
        const my = mouseRef.current.y
        tx += (mx * 7 - tx) * 0.06
        ty += (my * 4 - ty) * 0.06
        wrapRef.current.style.transform =
          `perspective(900px) rotateX(${-ty}deg) rotateY(${tx}deg)`
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [mouseRef])

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Subtle grid bg */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,122,255,0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,122,255,0.07) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      {/* Radial glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 55% at 50% 35%, rgba(0,122,255,0.1) 0%, transparent 70%)',
      }} />

      {/* Parallax SVG scene */}
      <div
        ref={wrapRef}
        style={{ position: 'absolute', inset: '-10%', willChange: 'transform' }}
      >
        <svg
          viewBox="0 0 100 48"
          preserveAspectRatio="xMidYMid slice"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Ground grid */}
          {Array.from({ length: 21 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={48} x2={i * 5} y2={28}
              stroke="rgba(0,122,255,0.18)" strokeWidth="0.15" />
          ))}
          {Array.from({ length: 21 }, (_, i) => (
            <line key={`v${i}`} x1={i * 5} y1={28} x2="100" y2={48}
              stroke="rgba(0,122,255,0.18)" strokeWidth="0.15" />
          ))}

          {/* Buildings */}
          {BUILDINGS.map((b, i) => (
            <g key={i} filter="url(#glow)">
              <rect
                x={b.x} y={b.y} width={b.w} height={b.h}
                fill="rgba(0,122,255,0.05)"
                stroke="#007AFF"
                strokeWidth="0.25"
                opacity={0.75 + (i % 3) * 0.08}
              />
              {/* Top edge highlight */}
              <line x1={b.x} y1={b.y} x2={b.x + b.w} y2={b.y}
                stroke="#60a5fa" strokeWidth="0.35" opacity={0.9} />
              {/* Inner cross line */}
              <line x1={b.x} y1={b.y + b.h * 0.5} x2={b.x + b.w} y2={b.y + b.h * 0.5}
                stroke="rgba(0,122,255,0.3)" strokeWidth="0.12" />
            </g>
          ))}

          {/* Floating animated boxes */}
          {FLOAT_BOXES.map((fb, i) => (
            <g key={i}>
              <rect
                x={fb.cx - fb.size / 2} y={fb.cy - fb.size / 2}
                width={fb.size} height={fb.size}
                fill="none" stroke="#60a5fa" strokeWidth="0.3" opacity={0.7}
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values={`0,0; 0,${-fb.size * 0.8}; 0,0`}
                  dur={`${fb.dur}s`}
                  begin={`${fb.delay}s`}
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                />
                <animate attributeName="opacity" values="0.7;0.95;0.7"
                  dur={`${fb.dur}s`} begin={`${fb.delay}s`} repeatCount="indefinite" />
              </rect>
              <rect
                x={fb.cx - fb.size / 2 + 0.4} y={fb.cy - fb.size / 2 + 0.4}
                width={fb.size * 0.6} height={fb.size * 0.6}
                fill="none" stroke="rgba(0,122,255,0.35)" strokeWidth="0.15" opacity={0.5}
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`0 ${fb.cx} ${fb.cy}`}
                  to={`360 ${fb.cx} ${fb.cy}`}
                  dur={`${fb.dur * 2.5}s`}
                  repeatCount="indefinite"
                />
              </rect>
            </g>
          ))}

          {/* Scan line animation */}
          <line x1="0" y1="28" x2="100" y2="28" stroke="rgba(0,122,255,0.4)" strokeWidth="0.2">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
          </line>
        </svg>
      </div>
    </div>
  )
}
