---
name: Elite Animations
description: This skill should be used when the user asks to "create an animation", "add animations", "build interactive effects", "animate this section", "add scroll animations", "create particle effects", "build a constellation", "add 3D effects", "make it interactive", "add hover effects", "create a starburst", "data stream animation", "device mockup animation", "add micro-interactions", "parallax effect", or wants to build premium, award-winning web animations for Next.js/React. Provides comprehensive guidance for building xAI-tier interactive animations using Canvas, WebGL, Three.js, React Three Fiber, GSAP, Framer Motion, and CSS techniques.
---

# Elite Animations

Build premium, award-winning interactive animations for Next.js/React web applications. This skill transforms an agent into a world-class animation engineer capable of creating xAI-tier interactive experiences.

## OPS Project Context

The OPS web app (`try-ops/`) uses:
- **Next.js 14** (App Router), **React 18**, **TypeScript**
- **Tailwind CSS 3.4** with OPS design tokens (see `tailwind.config.ts`)
- **Framer Motion 12** (already installed)
- **Zustand** for state
- **Fonts**: Mohave (headings), Kosugi (body), Bebas Neue (accent)
- **Colors**: Dark theme - `#0A0A0A` background, `#597794` accent, `#F5F5F5` text

Before building any animation, read `try-ops/tailwind.config.ts` and `try-ops/lib/styles/OPSStyle.ts` to understand the design system.

## Animation Tier System

### Tier 1: CSS + Tailwind (No extra deps)
Use for: fade-ins, slides, cursor-blink, simple hover states, gradient shifts.
Existing Tailwind animations are in `tailwind.config.ts` under `animation` and `keyframes`.

### Tier 2: Framer Motion (Already installed)
Use for: scroll-triggered reveals, layout animations, spring physics, drag, stagger sequences, `whileInView`, `whileHover`, `AnimatePresence` page transitions.

### Tier 3: GSAP + ScrollTrigger (Install when needed)
Use for: timeline-based scroll animations, pinning sections, scrub-linked motion, morphing SVGs, complex sequenced animations. Install: `npm install gsap @gsap/react`.

### Tier 4: React Three Fiber + Drei (Install when needed)
Use for: interactive 3D particle fields, constellation/starburst effects, 3D device mockups, WebGL backgrounds, point clouds with raycasting. Install: `npm install three @react-three/fiber @react-three/drei @types/three`.

### Tier 5: Raw Canvas/WebGL (No deps needed)
Use for: custom particle systems, data stream effects, matrix rain, flowing lines, generative art when full control is needed over every pixel.

## Core Animation Patterns

### Pattern 1: Interactive Constellation / Starburst
**Inspired by**: xAI "Understand The Universe" section - rotating field of connected points with hoverable nodes that reveal quotes.

**Approach**: React Three Fiber + Drei `Html` component.
- Points as `<mesh>` objects with `onPointerOver`/`onPointerOut` event handlers
- Radial lines from center using `<Line>` or `BufferGeometry`
- Slow rotation via `useFrame` on a parent `<group>`
- Hover reveals content using Drei `<Html>` component positioned at the hovered point
- Raycasting is built into R3F - every mesh automatically receives pointer events

**Reference**: `references/constellation-starburst.md` for full implementation guide and code.

### Pattern 2: 3D Device Mockup with Data Stream
**Inspired by**: Phone wireframe that rotates from head-on to isometric on hover, with data particles flowing through it.

**Approach**: CSS 3D transforms + Canvas overlay.
- Phone container with `perspective: 1200px` on parent
- Default state: `rotateX(0) rotateY(0) rotateZ(0)`
- Hover state: `rotateX(-15deg) rotateY(25deg) rotateZ(-5deg)` with `transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)`
- Canvas overlay for flowing data particles along predefined SVG paths
- Particles use `requestAnimationFrame` with path interpolation

**Reference**: `references/device-mockup-3d.md` for full implementation guide.

### Pattern 3: Scroll-Driven Sections
**Approach**: GSAP ScrollTrigger for complex sequences, Framer Motion `whileInView` for simpler reveals.

GSAP in Next.js requires `"use client"` and the `useGSAP` hook:
```tsx
"use client"
import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
gsap.registerPlugin(ScrollTrigger)
```

**Reference**: `references/scroll-animations.md` for ScrollTrigger patterns, pinning, and scrub.

### Pattern 4: Micro-Interactions
Magnetic buttons, morphing icons, text character-by-character reveals, stagger animations.

**Reference**: `references/micro-interactions.md` for implementation patterns.

## Implementation Workflow

1. **Classify the animation tier** - Determine which tier is needed (start with lowest possible)
2. **Check dependencies** - Read `package.json` to see what is installed
3. **Install if needed** - Only install what the tier requires
4. **Create as client component** - All animation components must use `"use client"`
5. **Respect the design system** - Use OPS colors, fonts, spacing from Tailwind config
6. **Add reduced motion support** - Always include `prefers-reduced-motion` handling
7. **Lazy load heavy animations** - Use `dynamic()` import for Tier 3-5 components
8. **Test performance** - Target 60fps, use `will-change` sparingly, clean up in `useEffect` returns

## Critical Rules

1. **Every Canvas/WebGL component MUST be `"use client"`** - Server components cannot use browser APIs
2. **Always clean up** - Return cleanup functions from `useEffect` for requestAnimationFrame, event listeners, GSAP instances
3. **Lazy load Three.js** - Never import Three.js in the initial bundle. Use Next.js `dynamic()`:
   ```tsx
   const Scene = dynamic(() => import('./Scene'), { ssr: false })
   ```
4. **Reduced motion** - Check `window.matchMedia('(prefers-reduced-motion: reduce)')` and provide static fallbacks
5. **GPU acceleration** - Use `transform` and `opacity` for CSS animations (composited properties). Avoid animating `width`, `height`, `top`, `left`
6. **Canvas sizing** - Always handle `devicePixelRatio` for sharp rendering on retina displays
7. **Event cleanup in R3F** - Use `e.stopPropagation()` on pointer events to prevent events from reaching objects behind
8. **GSAP context** - Always use `useGSAP` hook (not raw `useEffect`) for proper cleanup and React 18 StrictMode compatibility

## Quick Reference: Framer Motion (Already Available)

```tsx
"use client"
import { motion, useScroll, useTransform } from 'framer-motion'

// Scroll-linked parallax
const { scrollYProgress } = useScroll()
const y = useTransform(scrollYProgress, [0, 1], [0, -200])

// Viewport reveal
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
/>

// Spring physics
<motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} />

// Stagger children
<motion.ul variants={{ show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" whileInView="show">
```

## Additional Resources

### Reference Files
- **`references/constellation-starburst.md`** - Complete guide to building xAI-style interactive constellation with R3F
- **`references/device-mockup-3d.md`** - 3D phone mockup with perspective shift and data stream particles
- **`references/scroll-animations.md`** - GSAP ScrollTrigger and Framer Motion scroll patterns for Next.js
- **`references/micro-interactions.md`** - Magnetic cursor, morphing shapes, text reveals, stagger effects
- **`references/performance.md`** - GPU acceleration, Web Workers, lazy loading, reduced motion
- **`references/library-guide.md`** - Detailed library comparison, installation, and Next.js integration

### Example Files
- **`examples/constellation.tsx`** - Complete interactive constellation React component
- **`examples/device-mockup.tsx`** - CSS 3D phone mockup with Canvas data stream
- **`examples/scroll-reveal.tsx`** - GSAP ScrollTrigger section with pinning and scrub
- **`examples/magnetic-button.tsx`** - Magnetic hover effect component

### External Inspiration
- xAI (x.ai) - Constellation starburst, product card animations, volumetric text
- Codrops (tympanus.net/codrops) - WebGL hover effects, scroll animations
- Three.js Journey (threejs-journey.com) - Three.js learning resource
- GSAP docs (gsap.com) - ScrollTrigger, timeline, React integration
- Motion docs (motion.dev) - Framer Motion scroll, springs, layout
