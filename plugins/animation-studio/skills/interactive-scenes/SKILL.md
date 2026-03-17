---
name: interactive-scenes
description: Interactive animation scenes — product demos, gamified interactions, interactive tutorials, explainer sequences, decision flow patterns. Cross-platform.
metadata:
  priority: 6
  pathPatterns:
    - "**/tutorial/**"
    - "**/demo/**"
    - "**/onboarding/**"
    - "**/interactive/**"
  promptSignals:
    phrases:
      - "interactive tutorial"
      - "product demo"
      - "gamified"
      - "explainer"
      - "walkthrough"
      - "spotlight"
      - "decision flow"
      - "forked choice"
---

# Interactive Scenes

Animations where the user **participates** — not just watches. This skill covers the full spectrum of interactive motion design across web (React/Canvas/SVG) and iOS (SwiftUI/SceneKit/Core Animation) platforms.

## Five Domains

### 1. Product Demos
Animated device mockups with perspective-shifting 3D transforms, live screen content, touch-point indicators, and screen transition simulation. The user sees a product in motion and can manipulate the viewing angle, triggering timed hotspot sequences that reveal features.

**Reference:** `references/product-demos.md`

### 2. Gamified Interactions
Physics-based drag, flick, and toss with realistic momentum. Forked decision flows where particles orbit in ambient mode then stream on user choice. Swipe-to-reveal with magnetic snap-to-grid. Score and progress animations that respond to cumulative user action.

**Reference:** `references/gamified-interactions.md`

### 3. Interactive Tutorials
Spotlight cutouts that isolate UI elements using four morphing strategies (expand, morph, fade, slide). Tooltip positioning with smart edge avoidance. Gesture indicators — tap pulse, swipe arrow, drag hand — that loop until the user acts. Phase transitions between tutorial steps. Completion celebrations with restraint.

**Reference:** `references/interactive-tutorials.md`

### 4. Explainer Sequences
Step-by-step process illustrations that build up progressively on scroll or intersection. Connection lines drawing between elements via SVG path animation or Canvas. State machine visualizations. Before/after comparisons with animated transitions.

**Reference:** `references/explainer-sequences.md`

### 5. Decision Flow Patterns
The ForcedChoiceFork pattern in detail: particle field physics with three distinct modes (ambient breathing float, hover orbit with radial pull and tangential drift, stream mode with horizontal flow and Y-convergence funnel). Color interpolation by proximity. Branching animations with multiple entry/exit states.

**Reference:** `references/decision-flow-patterns.md`

## Cross-Platform Scope

| Technique | Web | iOS |
|-----------|-----|-----|
| Particle fields | Canvas 2D API | Core Animation + CAEmitterLayer |
| 3D device mockups | CSS `perspective` + `transform-style: preserve-3d` | SceneKit SCNNode |
| Spotlight cutouts | CSS `clip-path` / SVG mask | UIView mask + CAShapeLayer |
| SVG path drawing | `stroke-dasharray` + `stroke-dashoffset` | CAShapeLayer `strokeEnd` |
| Physics drag/toss | `requestAnimationFrame` + velocity tracking | UIDynamicAnimator / SwiftUI gesture |
| Scroll-driven | IntersectionObserver / scroll events | UIScrollView delegate / ScrollView |

## Example Index

| # | File | Domain | Technique |
|---|------|--------|-----------|
| 1 | `examples/ForcedChoiceFork.tsx` | Decision Flow | Canvas 2D particle field (seed) |
| 2 | `examples/LeadershipSphere.tsx` | Gamified / 3D | Canvas 2D + DOM hybrid (seed) |
| 3 | `examples/app-demo-mockup.tsx` | Product Demo | CSS 3D perspective transforms |
| 4 | `examples/swipe-tutorial-step.tsx` | Interactive Tutorial | clip-path spotlight + Framer Motion |
| 5 | `examples/process-explainer.tsx` | Explainer Sequence | SVG path drawing + IntersectionObserver |
| 6 | `examples/branching-flow.tsx` | Decision Flow | Canvas 2D multi-branch particles |

## Standards

1. **Performance first.** Canvas animations must hold 60fps. Use `requestAnimationFrame`, DPI-aware sizing, and avoid allocations inside the render loop. Pre-allocate particle arrays. Reuse objects.

2. **Accessibility.** Respect `prefers-reduced-motion`. Provide static fallbacks. Ensure interactive targets meet minimum 44x44px touch area. Add `role` and `aria-label` attributes to interactive Canvas containers.

3. **Touch parity.** Every mouse interaction must have a touch equivalent. Track `touchstart`, `touchmove`, `touchend` alongside mouse events. Prevent default on drag to avoid scroll interference.

4. **DPI awareness.** Canvas dimensions must be `rect.width * devicePixelRatio` with `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`. CSS dimensions set independently.

5. **Cleanup.** Cancel `requestAnimationFrame` in effect cleanup. Disconnect `ResizeObserver`. Remove window-level event listeners. Clear timeouts.

6. **No library lock-in for Canvas.** Particle systems, physics, and 3D projections use pure Canvas 2D API with no animation library dependency. Framer Motion is acceptable for DOM-based transitions (tooltips, overlays, panels) but not for per-frame Canvas work.

7. **State via refs, not React state.** Animation state (particle positions, velocities, hover indices, selection state, time accumulators) lives in `useRef` to avoid re-render overhead. React state is reserved for DOM elements that need re-render (description panels, labels, buttons).

8. **Normalized coordinates.** Particle positions should be normalized (0-1 range) so they scale with container size. Convert to pixel coordinates only at draw time.
