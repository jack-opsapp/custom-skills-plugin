---
name: web-animations
description: Web animation implementation — CSS, Framer Motion, GSAP, Three.js/R3F, Canvas/WebGL. Includes micro-interactions, web haptics, and scroll animations.
metadata:
  priority: 8
  pathPatterns:
    - "**/*.tsx"
    - "**/*.jsx"
    - "**/animations/**/*.ts"
    - "**/components/animated/**"
    - "**/effects/**/*.ts"
  importPatterns:
    - "framer-motion"
    - "gsap"
    - "three"
    - "@react-three/fiber"
    - "@react-three/drei"
    - "@react-three/rapier"
  promptSignals:
    phrases:
      - "web animation"
      - "react animation"
      - "scroll animation"
      - "framer motion"
      - "gsap"
      - "three.js"
      - "canvas animation"
      - "webgl"
---

# Web Animations Skill

Production-grade web animation implementation across five capability tiers, from CSS-only to GPU-compute. Every pattern is TypeScript-first, reduced-motion-aware, and designed for Next.js App Router ("use client" where required).

## Animation Tiers

### Tier 1 — CSS Transitions & Animations
Pure CSS. Zero JavaScript. Best for: hover states, entry animations, page transitions, scroll-driven effects.
- `@keyframes` with `animation-composition` for layered effects
- `transition` with `linear()` easing for spring/bounce curves in pure CSS
- `@starting-style` for entry animations from `display: none` (Baseline 2025)
- `animation-timeline: scroll()` and `animation-timeline: view()` for scroll-driven effects
- View Transition API (`document.startViewTransition` + `@view-transition` CSS at-rule) for SPA and MPA page transitions
- Container queries for responsive animation parameters

### Tier 2 — Motion for React (formerly Framer Motion)
React-native declarative animations. Best for: component mount/unmount, layout shifts, gesture responses, shared layout transitions.
- Import from `motion/react` (v12.x+). Use `motion/react-client` for RSC compatibility.
- `motion` components, `AnimatePresence`, `LayoutGroup`
- `useScroll` + `useTransform` + `useSpring` for scroll-linked physics
- `useMotionValue` for imperative spring-physics interactions (magnetic buttons, cursor followers)
- Variant orchestration with `staggerChildren`, `delayChildren`
- `mode="popLayout"` on AnimatePresence for smooth exit + sibling reflow

### Tier 3 — GSAP + ScrollTrigger
Timeline-based sequencing and scroll choreography. Best for: pinned scroll narratives, complex multi-step reveals, text splitting, SVG morphing.
- All GSAP plugins are **free** (Webflow acquisition, April 2025) — SplitText, MorphSVG, DrawSVG, Flip, ScrollSmoother
- `SplitText.create()` — rewritten from scratch. Auto re-split on resize (`autoSplit`), `deepSlice` for inline elements, built-in `aria-label` accessibility
- `ScrollTrigger` — `clamp()` for above-fold safety, scrub, pin, snap
- Dynamic imports for code splitting: `const { gsap } = await import("gsap")`
- `useGSAP` hook from `@gsap/react` for proper React cleanup

### Tier 4 — Three.js / React Three Fiber
3D scenes in React. Best for: hero visuals, data constellations, interactive product showcases, particle fields.
- `@react-three/fiber` v9.x (React 19 compatible), `@react-three/drei` v10.x
- Declarative scene graph: `<Canvas>`, `<mesh>`, `<ambientLight>`, etc.
- drei helpers: `<Float>`, `<Environment>`, `<Text>`, `<Html>`, `<MeshPortalMaterial>`
- `@react-three/rapier` for physics: `<Physics>`, `<RigidBody>`, collision groups
- `@react-three/postprocessing` for bloom, DOF, chromatic aberration
- Custom shaders via `shaderMaterial` or raw `<meshStandardMaterial>` with `onBeforeCompile`
- WebGPU progressive enhancement (Three.js r171+): `WebGPURenderer` with automatic WebGL2 fallback

### Tier 5 — Canvas 2D / WebGL / WebGPU
Low-level GPU access. Best for: particle systems at scale, data visualizations, real-time simulations, generative art.
- DPI-aware Canvas 2D: `devicePixelRatio` scaling on every setup
- `requestAnimationFrame` loops with delta-time physics
- `OffscreenCanvas` + Web Worker for main-thread-free rendering
- WebGL shader programs (vertex + fragment) for GPU-accelerated effects
- WebGPU compute shaders for massive parallelism (70%+ browser support, 2026)
- Progressive enhancement: WebGPU → WebGL2 → Canvas 2D

## Cross-Cutting Standards

### TypeScript
All animation code is TypeScript. Props interfaces for every component. Strict generic types for motion values and refs.

### "use client" Directive
Every component that uses hooks, event handlers, or browser APIs must have `"use client"` as the first line. No exceptions in Next.js App Router.

### Reduced Motion
Every animation must respect `prefers-reduced-motion: reduce`. Patterns:
- CSS: `@media (prefers-reduced-motion: reduce) { animation: none; transition: none; }`
- Motion for React: `useReducedMotion()` hook → conditionally disable or simplify
- GSAP: `gsap.matchMedia()` with `(prefers-reduced-motion: reduce)` context
- Canvas/WebGL: check `window.matchMedia("(prefers-reduced-motion: reduce)").matches` before rAF loop

### Brand Config Integration
Never hardcode colors, font families, or timing values. Accept them as props:
```tsx
interface AnimationConfig {
  accentColor?: string;     // e.g. "#597794"
  backgroundColor?: string; // e.g. "#0A0A0A"
  fontFamily?: string;      // e.g. "Mohave, sans-serif"
  duration?: number;        // base duration in seconds
}
```
Components receive brand tokens through props, not imports. This makes every component portable across projects.

### DPI-Aware Canvas
Every Canvas 2D or WebGL setup must account for `devicePixelRatio`:
```tsx
const dpr = window.devicePixelRatio || 1;
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
ctx.scale(dpr, dpr);
canvas.style.width = `${rect.width}px`;
canvas.style.height = `${rect.height}px`;
```

### Physics & Math Comments
Every non-obvious formula (spring constants, damping ratios, easing curves, force vectors) must have a comment explaining the physics or math intent. Not just `// spring` — explain WHY the stiffness/damping values were chosen.

### Web Haptics
Haptic feedback on web is limited but useful where available:
- Android: `navigator.vibrate()` — well-supported
- iOS Safari: Hidden `<input type="checkbox" switch>` + label click hack (Safari 17.4+)
- Always feature-detect. Never assume availability. Haptics are enhancement, never requirement.

## Reference File Index

| File | Tier | When to use |
|------|------|-------------|
| `references/css-transitions.md` | 1 | Hover states, entry animations, scroll-driven CSS, page transitions, `@starting-style`, `linear()` easing |
| `references/framer-motion.md` | 2 | React component animations, layout shifts, gesture responses, AnimatePresence, useScroll |
| `references/gsap-scrolltrigger.md` | 3 | Timeline sequencing, pinned scroll, SplitText, MorphSVG, complex choreography |
| `references/three-js-r3f.md` | 4 | 3D scenes, particle systems, post-processing, physics, interactive 3D |
| `references/canvas-webgl.md` | 5 | Canvas 2D particles, WebGL shaders, WebGPU compute, OffscreenCanvas workers |
| `references/scroll-animations.md` | 1-3 | Choosing between CSS scroll(), Motion useScroll, GSAP ScrollTrigger |
| `references/web-haptics.md` | All | Adding tactile feedback to web interactions |

## Example Component Index

| File | Tier | Pattern |
|------|------|---------|
| `examples/magnetic-button.tsx` | 2 | Spring-physics cursor tracking with proximity detection |
| `examples/scroll-reveal.tsx` | 3 | GSAP pinned multi-step scroll narrative |
| `examples/constellation.tsx` | 4 | R3F interactive node graph with proximity connections |
| `examples/device-mockup.tsx` | 1+5 | CSS 3D perspective + Canvas 2D particle overlay |
| `examples/animated-counter.tsx` | 2 | Spring-eased number interpolation with locale formatting |
| `examples/stagger-grid.tsx` | 2 | Orchestrated grid entry with configurable stagger patterns |
| `examples/text-reveal.tsx` | 2+3 | Character-level animation: typewriter, wave, scramble, stagger |
