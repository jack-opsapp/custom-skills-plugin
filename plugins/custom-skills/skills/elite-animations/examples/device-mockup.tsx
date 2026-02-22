/**
 * 3D Device Mockup with Data Stream Animation
 * Phone rotates from face-on to isometric on hover,
 * data particles flow through when tilted.
 *
 * Dependencies: None beyond React + Tailwind (pure CSS 3D + Canvas)
 * Usage: <DeviceMockup>{ screen content }</DeviceMockup>
 */
"use client"

import { useState, useRef, useEffect, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────
interface Particle {
  progress: number
  speed: number
  opacity: number
  size: number
  pathIndex: number
  color: string
}

interface DeviceMockupProps {
  children: React.ReactNode
  className?: string
  width?: number
  height?: number
}

// ── Flow Paths (normalized 0-1) ────────────────────────
const FLOW_PATHS = [
  [
    { x: 0.5, y: -0.05 },
    { x: 0.45, y: 0.2 },
    { x: 0.35, y: 0.45 },
    { x: 0.5, y: 0.55 },
  ],
  [
    { x: -0.05, y: 0.4 },
    { x: 0.15, y: 0.42 },
    { x: 0.35, y: 0.48 },
    { x: 0.5, y: 0.5 },
  ],
  [
    { x: 0.5, y: 0.5 },
    { x: 0.55, y: 0.65 },
    { x: 0.48, y: 0.82 },
    { x: 0.5, y: 1.05 },
  ],
  [
    { x: 1.05, y: 0.3 },
    { x: 0.85, y: 0.35 },
    { x: 0.65, y: 0.45 },
    { x: 0.5, y: 0.5 },
  ],
  [
    { x: 0.3, y: -0.05 },
    { x: 0.32, y: 0.15 },
    { x: 0.4, y: 0.35 },
    { x: 0.5, y: 0.5 },
  ],
]

const COLORS = ['#597794', '#8AACC0', '#A5B368', '#FFFFFF']

// ── Path Interpolation ─────────────────────────────────
function interpolatePath(
  path: { x: number; y: number }[],
  t: number,
  w: number,
  h: number
): { x: number; y: number } {
  const segments = path.length - 1
  const segFloat = t * segments
  const idx = Math.min(Math.floor(segFloat), segments - 1)
  const segT = segFloat - idx
  const a = path[idx]
  const b = path[idx + 1]
  return {
    x: (a.x + (b.x - a.x) * segT) * w,
    y: (a.y + (b.y - a.y) * segT) * h,
  }
}

// ── Data Stream Canvas ─────────────────────────────────
function DataStream({
  active,
  width,
  height,
}: {
  active: boolean
  width: number
  height: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const MAX = 50

    function spawn(): Particle {
      return {
        progress: 0,
        speed: 0.004 + Math.random() * 0.006,
        opacity: 0.3 + Math.random() * 0.7,
        size: 1 + Math.random() * 2,
        pathIndex: Math.floor(Math.random() * FLOW_PATHS.length),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }
    }

    function animate() {
      ctx!.clearRect(0, 0, width, height)
      const particles = particlesRef.current

      // Spawn
      if (active && particles.length < MAX && Math.random() > 0.65) {
        particles.push(spawn())
      }

      // Update + draw
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.progress += p.speed

        if (p.progress >= 1) {
          particles.splice(i, 1)
          continue
        }

        const pos = interpolatePath(FLOW_PATHS[p.pathIndex], p.progress, width, height)
        const fadeIn = Math.min(p.progress * 6, 1)
        const fadeOut = Math.min((1 - p.progress) * 6, 1)
        const alpha = p.opacity * fadeIn * fadeOut * (active ? 1 : 0.2)

        // Glow
        ctx!.beginPath()
        ctx!.arc(pos.x, pos.y, p.size * 3, 0, Math.PI * 2)
        ctx!.fillStyle = p.color
        ctx!.globalAlpha = alpha * 0.12
        ctx!.fill()

        // Core
        ctx!.beginPath()
        ctx!.arc(pos.x, pos.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = p.color
        ctx!.globalAlpha = alpha
        ctx!.fill()
      }

      ctx!.globalAlpha = 1
      rafRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, width, height])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width, height }}
    />
  )
}

// ── Main Device Mockup ─────────────────────────────────
export default function DeviceMockup({
  children,
  className = '',
  width = 280,
  height = 580,
}: DeviceMockupProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ perspective: '1200px', perspectiveOrigin: 'center center' }}
    >
      <div
        className="relative transition-transform duration-[800ms]"
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovered
            ? 'rotateX(-15deg) rotateY(25deg) rotateZ(-5deg)'
            : 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Phone frame */}
        <div
          className="relative overflow-hidden bg-[#0D0D0D] border-2 border-[#2A2A2A]"
          style={{
            width,
            height,
            borderRadius: 40,
          }}
        >
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-[#0A0A0A] rounded-b-2xl z-20" />

          {/* Screen content */}
          <div className="relative w-full h-full pt-7 overflow-hidden">
            {children}
          </div>
        </div>

        {/* Data stream overlay */}
        <DataStream active={isHovered} width={width} height={height} />

        {/* Reflection/shine on hover */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-700 z-20"
          style={{
            opacity: isHovered ? 0.08 : 0,
            background:
              'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
            borderRadius: 40,
          }}
        />
      </div>
    </div>
  )
}
