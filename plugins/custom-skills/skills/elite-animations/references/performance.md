# Animation Performance Optimization

Techniques for maintaining 60fps across all animation tiers.

## GPU-Accelerated Properties

Only these CSS properties are composited on the GPU (no layout/paint cost):
- `transform` (translate, rotate, scale, perspective)
- `opacity`
- `filter` (blur, brightness, etc.)
- `clip-path` (in some browsers)

**Never animate**: `width`, `height`, `top`, `left`, `right`, `bottom`, `margin`, `padding`, `border-width`, `font-size`. These trigger layout recalculation.

```css
/* BAD - triggers layout */
.animate { transition: width 0.3s, left 0.3s; }

/* GOOD - GPU composited */
.animate { transition: transform 0.3s, opacity 0.3s; }
```

## will-change

Hint to the browser to promote an element to its own compositor layer:

```css
.will-animate {
  will-change: transform, opacity;
}
```

**Rules**:
- Apply BEFORE the animation starts (e.g., on hover of parent, not on the element itself)
- Remove after animation completes - keeping it permanently wastes GPU memory
- Never apply to more than ~10 elements at once
- Prefer `transform: translateZ(0)` as a lighter alternative for permanent promotion

```tsx
// Apply will-change dynamically
function AnimatedElement() {
  const [willAnimate, setWillAnimate] = useState(false)

  return (
    <div
      onMouseEnter={() => setWillAnimate(true)}
      onTransitionEnd={() => setWillAnimate(false)}
      style={{ willChange: willAnimate ? 'transform' : 'auto' }}
    >
      {/* ... */}
    </div>
  )
}
```

## Canvas Performance

### Device Pixel Ratio

Always scale canvas for retina displays:

```tsx
function setupCanvas(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)
  return ctx
}
```

### OffscreenCanvas (Web Workers)

For heavy particle systems (500+ particles), offload computation to a Web Worker:

```tsx
// worker.ts
const canvas = (self as any).transferredCanvas as OffscreenCanvas
const ctx = canvas.getContext('2d')!

function animate() {
  // Update and draw particles
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  // ... particle logic
  requestAnimationFrame(animate)
}
animate()

// Component
useEffect(() => {
  const offscreen = canvasRef.current!.transferControlToOffscreen()
  const worker = new Worker(new URL('./worker.ts', import.meta.url))
  worker.postMessage({ canvas: offscreen }, [offscreen])
  return () => worker.terminate()
}, [])
```

### Object Pooling

Reuse particle objects instead of creating/destroying:

```tsx
class ParticlePool {
  private pool: Particle[] = []
  private active: Particle[] = []

  get(): Particle {
    const particle = this.pool.pop() || new Particle()
    this.active.push(particle)
    return particle
  }

  release(particle: Particle): void {
    const idx = this.active.indexOf(particle)
    if (idx !== -1) {
      this.active.splice(idx, 1)
      particle.reset()
      this.pool.push(particle)
    }
  }
}
```

### Spatial Partitioning

For particle-to-particle distance checks (connections, collisions), use a grid:

```tsx
class SpatialGrid {
  private cellSize: number
  private grid: Map<string, Particle[]> = new Map()

  constructor(cellSize: number) {
    this.cellSize = cellSize
  }

  private key(x: number, y: number): string {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`
  }

  insert(particle: Particle): void {
    const k = this.key(particle.x, particle.y)
    if (!this.grid.has(k)) this.grid.set(k, [])
    this.grid.get(k)!.push(particle)
  }

  getNeighbors(particle: Particle): Particle[] {
    const cx = Math.floor(particle.x / this.cellSize)
    const cy = Math.floor(particle.y / this.cellSize)
    const neighbors: Particle[] = []

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cell = this.grid.get(`${cx + dx},${cy + dy}`)
        if (cell) neighbors.push(...cell)
      }
    }
    return neighbors
  }

  clear(): void {
    this.grid.clear()
  }
}
```

## React Three Fiber Performance

### InstancedMesh for Many Objects

For 50+ similar objects (e.g., constellation nodes):

```tsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function InstancedNodes({ count, positions }: { count: number; positions: Float32Array }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    if (!meshRef.current) return
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      )
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshBasicMaterial color="#597794" />
    </instancedMesh>
  )
}
```

### Demand Frameloop

Only render when something changes:

```tsx
<Canvas frameloop="demand">
  {/* Scene only re-renders when state changes */}
</Canvas>
```

### meshBounds for Hit Testing

Use bounding box instead of geometry for faster raycasting:

```tsx
import { meshBounds } from '@react-three/drei'

<mesh raycast={meshBounds}>
  {/* Uses bounding box for hit testing instead of geometry */}
</mesh>
```

## Lazy Loading Heavy Animations

### Next.js Dynamic Import

```tsx
import dynamic from 'next/dynamic'

const Constellation = dynamic(() => import('./Constellation'), {
  ssr: false,
  loading: () => <div className="h-screen bg-ops-background" />,
})

const GSAPSection = dynamic(() => import('./GSAPSection'), {
  ssr: false,
})
```

### Intersection Observer Trigger

Only initialize heavy animations when visible:

```tsx
function LazyAnimation() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' } // Start loading 200px before visible
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref}>
      {isVisible ? <HeavyAnimation /> : <Placeholder />}
    </div>
  )
}
```

## Reduced Motion

Always respect user preferences:

```tsx
"use client"
import { useEffect, useState } from 'react'

export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mq.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return prefersReduced
}

// Usage
function AnimatedSection() {
  const reducedMotion = usePrefersReducedMotion()

  if (reducedMotion) {
    return <StaticFallback />
  }
  return <FullAnimation />
}
```

Framer Motion has built-in support:

```tsx
// Globally reduce all Framer Motion animations
import { MotionConfig } from 'framer-motion'

<MotionConfig reducedMotion="user">
  <App />
</MotionConfig>
```

## GSAP Cleanup

Always use `useGSAP` instead of `useEffect` for automatic cleanup:

```tsx
// GOOD - automatic cleanup
useGSAP(() => {
  gsap.to('.box', { x: 100 })
}, { scope: containerRef })

// BAD - manual cleanup required, StrictMode issues
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.to('.box', { x: 100 })
  }, containerRef.current)
  return () => ctx.revert()
}, [])
```

## Performance Checklist

- [ ] Only animate `transform` and `opacity` where possible
- [ ] Use `will-change` sparingly and remove after animation
- [ ] Canvas uses `devicePixelRatio` for retina
- [ ] Heavy animations lazy-loaded with `dynamic()` and `ssr: false`
- [ ] Particle count capped (60-100 for Canvas, 5000+ only with instancing/shaders)
- [ ] `useGSAP` used instead of `useEffect` for GSAP
- [ ] Cleanup functions in all `useEffect` hooks (cancelAnimationFrame, removeEventListener)
- [ ] `prefers-reduced-motion` check with static fallback
- [ ] No layout thrashing (reading then writing DOM in same frame)
- [ ] Three.js scenes use `frameloop="demand"` when possible
- [ ] R3F uses `meshBounds` for simpler raycasting
