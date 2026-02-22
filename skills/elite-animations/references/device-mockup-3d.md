# 3D Device Mockup with Data Stream Animation

Build a phone/device wireframe that sits head-on and rotates to isometric view on hover, with animated data particles flowing through it.

## Architecture

```
<div.perspective-container>      // perspective: 1200px
  <div.device-wrapper>           // CSS 3D transforms, transition on hover
    <div.phone-frame>            // Phone wireframe (border + rounded corners)
      <div.screen-content>       // App screenshot or wireframe UI
      </div>
    </div>
    <canvas.data-stream>         // Overlay canvas for flowing particles
  </div.device-wrapper>
</div>
```

## CSS 3D Transform Approach

### Phone Frame with Perspective Shift

```tsx
"use client"
import { useState, useRef, useEffect } from 'react'

interface DeviceMockupProps {
  children: React.ReactNode
  className?: string
}

export default function DeviceMockup({ children, className }: DeviceMockupProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`relative ${className}`}
      style={{ perspective: '1200px', perspectiveOrigin: 'center center' }}
    >
      <div
        className="relative transition-transform duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovered
            ? 'rotateX(-15deg) rotateY(25deg) rotateZ(-5deg)'
            : 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Phone frame */}
        <div className="relative w-[280px] h-[580px] rounded-[40px] border-2 border-ops-border bg-ops-card overflow-hidden">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-ops-background rounded-b-2xl z-10" />

          {/* Screen content */}
          <div className="w-full h-full p-2 pt-8">
            {children}
          </div>
        </div>

        {/* Data stream canvas overlay */}
        <DataStreamOverlay active={isHovered} />
      </div>
    </div>
  )
}
```

### Mouse-Following 3D Tilt (Advanced)

For a more dynamic effect where the tilt follows the mouse position:

```tsx
function useTiltEffect(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5  // -0.5 to 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5

      el.style.transform = `
        rotateY(${x * 30}deg)
        rotateX(${-y * 20}deg)
        rotateZ(${x * -5}deg)
      `
    }

    const handleMouseLeave = () => {
      el.style.transform = 'rotateY(0deg) rotateX(0deg) rotateZ(0deg)'
    }

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [ref])
}
```

## Data Stream Particle Animation

Particles that flow along predefined paths through the device, creating a "data flowing through the interface" effect.

### Canvas-Based Data Stream

```tsx
"use client"
import { useRef, useEffect } from 'react'

interface Particle {
  x: number
  y: number
  progress: number  // 0-1 along path
  speed: number
  opacity: number
  size: number
  color: string
}

function DataStreamOverlay({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Handle retina
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Define flow paths (arrays of {x, y} waypoints, normalized 0-1)
    const paths = [
      // Top to center
      [{ x: 0.5, y: 0 }, { x: 0.5, y: 0.15 }, { x: 0.3, y: 0.4 }, { x: 0.5, y: 0.5 }],
      // Left to center
      [{ x: 0, y: 0.5 }, { x: 0.2, y: 0.45 }, { x: 0.4, y: 0.5 }],
      // Center to bottom
      [{ x: 0.5, y: 0.5 }, { x: 0.6, y: 0.65 }, { x: 0.5, y: 0.85 }, { x: 0.5, y: 1 }],
      // Right entry
      [{ x: 1, y: 0.3 }, { x: 0.8, y: 0.35 }, { x: 0.6, y: 0.45 }, { x: 0.5, y: 0.5 }],
    ]

    const colors = ['#597794', '#8AACC0', '#A5B368', '#FFFFFF']

    function spawnParticle(): Particle {
      const pathIndex = Math.floor(Math.random() * paths.length)
      return {
        x: 0,
        y: 0,
        progress: 0,
        speed: 0.003 + Math.random() * 0.005,
        opacity: 0.3 + Math.random() * 0.7,
        size: 1 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      }
    }

    function interpolatePath(
      path: { x: number; y: number }[],
      t: number,
      w: number,
      h: number
    ): { x: number; y: number } {
      const totalSegments = path.length - 1
      const segmentFloat = t * totalSegments
      const segmentIndex = Math.min(Math.floor(segmentFloat), totalSegments - 1)
      const segmentT = segmentFloat - segmentIndex

      const a = path[segmentIndex]
      const b = path[segmentIndex + 1]
      return {
        x: (a.x + (b.x - a.x) * segmentT) * w,
        y: (a.y + (b.y - a.y) * segmentT) * h,
      }
    }

    // Particle pool
    const MAX_PARTICLES = 60
    const particles: { particle: Particle; pathIndex: number }[] = []

    function animate() {
      if (!ctx || !canvas) return
      const w = rect.width
      const h = rect.height

      ctx.clearRect(0, 0, w, h)

      // Spawn new particles
      if (active && particles.length < MAX_PARTICLES && Math.random() > 0.7) {
        const pathIndex = Math.floor(Math.random() * paths.length)
        particles.push({ particle: spawnParticle(), pathIndex })
      }

      // Update and draw
      for (let i = particles.length - 1; i >= 0; i--) {
        const { particle, pathIndex } = particles[i]
        particle.progress += particle.speed

        if (particle.progress >= 1) {
          particles.splice(i, 1)
          continue
        }

        const pos = interpolatePath(paths[pathIndex], particle.progress, w, h)
        particle.x = pos.x
        particle.y = pos.y

        // Fade in/out at edges
        const fadeIn = Math.min(particle.progress * 5, 1)
        const fadeOut = Math.min((1 - particle.progress) * 5, 1)
        const alpha = particle.opacity * fadeIn * fadeOut

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.globalAlpha = alpha
        ctx.fill()

        // Glow
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.globalAlpha = alpha * 0.15
        ctx.fill()
      }

      ctx.globalAlpha = 1
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationRef.current)
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
```

## SVG Path Data Stream (Alternative)

For smoother, resolution-independent streams, use SVG `<path>` with animated offsets:

```tsx
function SVGDataStream() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <linearGradient id="stream-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#597794" stopOpacity="0" />
          <stop offset="50%" stopColor="#597794" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#597794" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M140,0 Q140,150 100,290 T140,580"
        fill="none"
        stroke="url(#stream-grad)"
        strokeWidth="2"
        strokeDasharray="8 16"
        className="animate-[dash_2s_linear_infinite]"
      />
    </svg>
  )
}
```

Add to Tailwind config:
```js
keyframes: {
  dash: {
    '0%': { strokeDashoffset: '24' },
    '100%': { strokeDashoffset: '0' },
  }
}
```

## Combining Tilt + Data Stream

The full component activates the data stream only when the device is in isometric view (hovered), creating the effect of "seeing the data flow" when you tilt the device:

1. Default state: Phone face-on, no particles
2. Hover: Phone smoothly rotates to isometric, particles begin spawning
3. Leave: Phone rotates back, particles fade and stop spawning

## Performance Notes

- Canvas particle count capped at 60 for smooth 60fps
- Use `devicePixelRatio` for retina sharpness
- CSS `will-change: transform` on the device wrapper (remove after animation settles)
- `pointer-events: none` on canvas overlay so hover passes through to content below
