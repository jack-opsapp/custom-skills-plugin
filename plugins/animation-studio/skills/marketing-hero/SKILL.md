---
name: marketing-hero
description: Marketing and hero section animations — constellation fields, 3D scenes, scroll narratives, ambient backgrounds, parallax layers.
metadata:
  priority: 6
  pathPatterns:
    - "**/hero/**"
    - "**/landing/**"
    - "**/marketing/**"
  promptSignals:
    phrases:
      - "hero section"
      - "landing page"
      - "constellation"
      - "parallax"
      - "scroll narrative"
      - "particle field"
      - "3d showcase"
      - "ambient background"
---

# Marketing Hero

Hero sections are the first thing a visitor sees. They must stop the scroll, set the emotional tone, and communicate sophistication without saying a word. A hero that feels generic — stock gradients, predictable parallax, template-tier particle effects — actively damages credibility. A hero that feels crafted — deliberate motion, purposeful interactivity, atmospheric depth — builds trust before the user reads a single word.

This skill covers four domains that together produce hero and marketing surfaces worthy of the brand.

---

## 1. Constellation & Particle Fields

Interactive node networks and particle systems that respond to the user's presence. These are not decorative — they communicate "this product is alive, responsive, intelligent." Nodes connect and disconnect based on proximity. Particles drift with purpose. Mouse/touch interaction creates a gravitational pull that draws elements toward the user's attention.

**Primary patterns:**
- Node networks with distance-based connections (lines form/dissolve dynamically)
- Mouse/touch proximity attraction (nodes gravitate toward cursor)
- Configurable density, color, connection radius, interaction strength
- R3F implementation (instanced meshes) for high counts (500+)
- Canvas 2D alternative for simpler deployments (sub-200 nodes)

**Reference:** `references/constellation-particles.md`
**Example:** `examples/constellation-field.tsx`

---

## 2. 3D Product Showcases

Orbiting product viewers that let users inspect, rotate, and appreciate a physical object in 3D space. Environment lighting, reflections, shadows, and depth of field transform a static product shot into an experience. Auto-rotation when idle says "look at this." Drag-to-rotate says "this is yours to explore."

**Primary patterns:**
- R3F + drei for web (Environment, OrbitControls, ContactShadows)
- Auto-rotation with idle detection, drag-to-rotate override
- Environment lighting (HDR) with reflections
- Post-processing: subtle bloom, optional depth of field
- Responsive sizing to container
- Shadow plane for grounding

**Reference:** `references/3d-scenes.md`
**Example:** `examples/3d-product-showcase.tsx`

---

## 3. Scroll Narratives & Parallax

Pinned sections with scrub-linked timelines that transform the act of scrolling into storytelling. Elements build, transform, and dissolve as the user progresses. Parallax layers create depth without 3D overhead. Text reveals timed to scroll position turn passive reading into active discovery.

**Primary patterns:**
- GSAP ScrollTrigger for pinned scroll-scrub narratives
- Framer Motion useScroll for React-native parallax
- Multi-layer parallax with configurable depth factors
- Text reveals timed to scroll progress (word-by-word, line-by-line)
- Device mockup layers at independent scroll rates
- Snap points for chapter-like progression

**Reference:** `references/scroll-narratives.md`
**Example:** `examples/parallax-hero.tsx`

---

## 4. Ambient Backgrounds

Gradient meshes, noise-based organic motion, and subtle grain overlays that create atmosphere without demanding attention. These are the breath of the page — slow, continuous, alive. The moment a user consciously notices an ambient background, it has failed. The moment they leave the page and the next site feels dead by comparison, it has succeeded.

**Primary patterns:**
- Simplex/Perlin noise displacement for organic gradient motion
- CSS grain overlays (noise texture via SVG filter or pseudo-element)
- requestAnimationFrame with 30fps cap for battery efficiency
- Color interpolation between brand palette stops
- Intersection Observer pause when off-screen

**Reference:** `references/scroll-narratives.md` (section 2)
**Example:** `examples/ambient-mesh-gradient.tsx`

---

## 5. Standards

### Every marketing hero animation must:

1. **Serve the emotional arc.** The hero is Entry/Arrival beat — counter skepticism with confidence. Sharp entries, precise motion, assured timing. No wobble, no bounce, no playful overshoot.

2. **Degrade gracefully, never disappear.** Reduced motion users get a different animation (crossfade, opacity pulse), not a blank section. Low-end devices get fewer particles/simpler shaders, not a static image.

3. **Load without blocking.** Dynamic imports for Three.js, GSAP, and any heavy dependency. Static first frame rendered immediately. Animation initializes on idle or intersection.

4. **Pause when invisible.** IntersectionObserver pauses RAF loops, R3F `frameloop="demand"`, and GSAP timeline `.pause()` when the hero scrolls out of view. No battery drain for off-screen spectacle.

5. **Respect the brand.** Read the brand config (`.claude/animation-studio.local.md`). Apply brand colors, easing curves, and emotional direction. A military-tactical brand gets sharp, minimal particle fields — not neon rave effects.

6. **Be interactive where possible.** Mouse proximity, scroll response, touch interaction — the hero should respond to the user's presence. Static beauty is for print. Digital beauty moves with you.

7. **Pair with content, not replace it.** The animation is the stage, not the show. Headlines, value propositions, and CTAs must remain readable and accessible. Background effects at 0.3-0.6 opacity. Never animate foreground text in a way that delays readability.

### Performance budgets for marketing surfaces:

| Metric | Target | Hard Limit |
|--------|--------|------------|
| LCP | < 2.5s | < 4.0s |
| JS for hero animation | < 50KB gzipped (lazy) | < 80KB |
| Frame rate (desktop) | 60fps | 45fps minimum |
| Frame rate (mobile) | 30fps | 24fps minimum |
| Time to interactive | < 3.0s | < 5.0s |
| Battery (continuous animation) | < 5% CPU idle | < 10% CPU |

### Accessibility requirements:

- `prefers-reduced-motion: reduce` — replace motion with opacity/color transitions
- `prefers-color-scheme: dark/light` — ambient backgrounds must work in both schemes
- All foreground text meets WCAG 2.1 AA contrast (4.5:1) against the animated background at every point in the animation cycle
- Interactive 3D scenes provide keyboard controls (arrow keys for rotation, +/- for zoom)
- Screen readers get `aria-hidden="true"` on decorative canvases with meaningful alt text on the section itself
