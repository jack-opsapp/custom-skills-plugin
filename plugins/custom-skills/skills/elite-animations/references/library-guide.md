# Animation Library Guide

When to use which library, installation, and Next.js integration details.

## Library Decision Matrix

| Need | Library | Size | Install |
|------|---------|------|---------|
| Simple hover/fade/slide | Tailwind CSS | 0kb (already included) | N/A |
| Scroll reveals, springs, drag | Framer Motion | ~85kb | Already installed |
| Complex timelines, scrub, pin | GSAP + ScrollTrigger | ~78kb | `npm install gsap @gsap/react` |
| 3D scenes, particles, WebGL | React Three Fiber | ~150kb + three.js | `npm install three @react-three/fiber @react-three/drei @types/three` |
| SVG morphing | GSAP MorphSVG | Plugin (requires GSAP) | GSAP Club membership |
| Lottie animations (After Effects) | lottie-react | ~30kb | `npm install lottie-react` |
| Lightweight CSS animations | tailwindcss-motion | ~5kb | `npm install tailwindcss-motion` |

## Framer Motion (Already Installed)

### Current Version in OPS: ^12.34.0

### Key APIs

```tsx
"use client"
import {
  motion,              // Animated component factory
  AnimatePresence,     // Mount/unmount animations
  useScroll,           // Scroll position tracking
  useTransform,        // Map one value to another
  useSpring,           // Spring-smoothed value
  useInView,           // Viewport detection
  useMotionValue,      // Tracked mutable value
  MotionConfig,        // Global animation config
  LayoutGroup,         // Coordinate layout animations
} from 'framer-motion'
```

### Common Patterns

**Page Transition Wrapper:**
```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

**Layout Animation (auto-animate position changes):**
```tsx
<motion.div layout layoutId="unique-id">
  {/* Automatically animates when position/size changes */}
</motion.div>
```

**Gesture Animations:**
```tsx
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  drag="x"
  dragConstraints={{ left: -100, right: 100 }}
/>
```

## GSAP (Install When Needed)

### Installation
```bash
npm install gsap @gsap/react
```

### Core Setup
```tsx
"use client"
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// Register plugins ONCE at module level
gsap.registerPlugin(ScrollTrigger)
```

### Key APIs

```tsx
// Basic tween
gsap.to('.element', { x: 100, duration: 1, ease: 'power2.out' })
gsap.from('.element', { opacity: 0, y: 40, duration: 0.8 })
gsap.fromTo('.element', { opacity: 0 }, { opacity: 1, duration: 0.5 })

// Timeline
const tl = gsap.timeline({ paused: true })
tl.to('.step1', { opacity: 1 })
  .to('.step2', { x: 100 }, '-=0.3')  // Overlap by 0.3s
  .to('.step3', { scale: 1.2 }, '+=0.5') // Delay 0.5s

// Stagger
gsap.from('.card', { opacity: 0, y: 30, stagger: 0.1 })

// ScrollTrigger
gsap.to('.section', {
  scrollTrigger: {
    trigger: '.section',
    start: 'top center',
    end: 'bottom center',
    scrub: true,
    pin: true,
  },
  x: 500,
})
```

### GSAP Eases
```
power1.out    - Subtle deceleration
power2.out    - Standard deceleration
power3.out    - Strong deceleration
power4.out    - Dramatic deceleration
elastic.out   - Bouncy overshoot
back.out      - Slight overshoot
bounce.out    - Bouncing ball
none          - Linear (for scrub)
```

### useGSAP Hook

The official way to use GSAP in React. Handles cleanup and StrictMode:

```tsx
const containerRef = useRef<HTMLDivElement>(null)

useGSAP(() => {
  // All GSAP animations here
  // Selector strings are scoped to containerRef
  gsap.from('.item', { opacity: 0 })
}, {
  scope: containerRef,
  dependencies: [],        // Re-run when these change
  revertOnUpdate: true,    // Revert previous animations on dependency change
})
```

## React Three Fiber (Install When Needed)

### Installation
```bash
npm install three @react-three/fiber @react-three/drei @types/three
```

### Core Setup
```tsx
"use client"
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Stars, Float, Line } from '@react-three/drei'
import * as THREE from 'three'
```

### Key Concepts

**Canvas** - The root WebGL renderer:
```tsx
<Canvas
  camera={{ position: [0, 0, 10], fov: 60 }}
  style={{ background: 'transparent' }}
  frameloop="always"    // or "demand" for on-change only
>
  <ambientLight intensity={0.5} />
  {/* 3D scene */}
</Canvas>
```

**useFrame** - Runs every frame (60fps):
```tsx
function AnimatedMesh() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state, delta) => {
    ref.current!.rotation.y += delta * 0.5
  })
  return <mesh ref={ref}><boxGeometry /><meshBasicMaterial /></mesh>
}
```

**Events** - R3F meshes receive DOM-like events:
```tsx
<mesh
  onClick={(e) => { e.stopPropagation(); /* handle */ }}
  onPointerOver={(e) => { e.stopPropagation(); /* handle */ }}
  onPointerOut={(e) => { /* handle */ }}
>
```

**Html** (Drei) - Project DOM elements into 3D space:
```tsx
<Html center distanceFactor={10} style={{ pointerEvents: 'auto' }}>
  <div className="tooltip">Content here</div>
</Html>
```

### Must-Know Drei Helpers
- `<Stars>` - Shader-based starfield background
- `<Float>` - Floating/hovering animation
- `<Line>` - Easy line drawing between points
- `<Html>` - DOM elements in 3D space
- `<Billboard>` - Always faces camera
- `<Text>` - 3D text with SDF rendering
- `meshBounds` - Fast bounding-box raycasting
- `<OrbitControls>` - Camera pan/zoom/rotate

### CRITICAL: Next.js Integration
Three.js MUST be loaded client-side only:
```tsx
import dynamic from 'next/dynamic'

const Scene3D = dynamic(() => import('./Scene3D'), {
  ssr: false,
  loading: () => <div className="h-screen bg-ops-background" />,
})
```

## CSS Animations (Zero Cost)

### Tailwind Built-in
```tsx
className="animate-spin"      // Continuous rotation
className="animate-ping"      // Radar-like ping
className="animate-pulse"     // Fade in/out
className="animate-bounce"    // Bouncing
```

### Custom in tailwind.config.ts
```tsx
animation: {
  'fade-up': 'fadeUp 0.5s ease-out forwards',
  'slide-in': 'slideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
},
keyframes: {
  fadeUp: {
    '0%': { opacity: '0', transform: 'translateY(16px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
}
```

### CSS Scroll-Driven Animations (Progressive Enhancement)
```css
@supports (animation-timeline: scroll()) {
  .scroll-fade {
    animation: scrollFade linear both;
    animation-timeline: scroll();
  }
}
```
Browser support: Chrome 115+, Edge 115+. Not yet in Firefox/Safari. Use GSAP as fallback.

## Combining Libraries

Libraries can be combined. Common combos:

1. **Framer Motion + Canvas**: Framer for layout/scroll, Canvas for custom particle effects
2. **GSAP + R3F**: GSAP timelines controlling Three.js animations via refs
3. **Tailwind + Framer Motion**: Tailwind for simple states, FM for complex interactions
4. **GSAP ScrollTrigger + Framer Motion**: GSAP for pinning/scrub, FM for spring physics

**Never combine Framer Motion and GSAP on the same element** - they will fight over the `transform` property. Use one or the other per element.
