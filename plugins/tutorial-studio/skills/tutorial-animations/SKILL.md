---
name: tutorial-animations
description: This skill should be used when implementing tutorial spotlight transitions, tooltip entrance animations, celebration moments, progress bar animations, gesture indicator animations, phase transition effects, completion screen animations, or any animation within an onboarding tutorial for iOS (SwiftUI) or web (React/Next.js).
---

# Tutorial Animations

Build tutorial-specific animations for dual-platform onboarding experiences across iOS (SwiftUI) and web (React/Next.js). This skill transforms an agent into a specialist in the narrow but critical domain of tutorial motion design — spotlights, tooltips, celebrations, gestures, and transitions that guide new users through their first experience.

## OPS Project Context

**iOS app** (`OPS/OPS/`):
- SwiftUI with OPSStyle design system
- Fonts: Mohave (headings), Kosugi (body)
- Colors: dark theme with `#597794` accent
- Tutorial system uses real app views with tutorial environment values injected

**Web app** (`try-ops/`):
- Next.js 14 (App Router), React 18, TypeScript
- Tailwind CSS 3.4 with OPS design tokens
- Framer Motion 12 (already installed)
- Fonts: Mohave (headings), Kosugi (body), Bebas Neue (accent)
- Colors: `#0A0A0A` background, `#597794` accent, `#F5F5F5` text

Before building any animation, read the relevant design system files: `try-ops/tailwind.config.ts` and `try-ops/lib/styles/OPSStyle.ts` for web, or `OPS/OPS/Styles/OPSStyle.swift` for iOS.

---

## Animation Tier System

Tutorial animations use a simplified three-tier system. Always select the lowest tier capable of delivering the required effect.

### Tier 1: Built-In Transitions (No extra deps)

Use CSS transitions and `@keyframes` on web, `withAnimation` and implicit animations in SwiftUI. Sufficient for fades, slides, opacity changes, and basic transforms.

**Use for:** Basic phase transitions, tooltip fade-in/fade-out, progress bar width changes, simple state changes between tutorial steps.

**Web:** `transition` property on elements, Tailwind `transition-*` utilities, CSS `@keyframes` for loops.
**iOS:** `.animation(.easeInOut(duration:))`, `withAnimation { }` blocks, implicit animations on state changes.

### Tier 2: Spring Physics (Framer Motion / SwiftUI .spring)

Use spring-based animations for natural, physical-feeling motion. This is the primary tier for tutorial animations — most tutorial UI should use spring physics.

**Use for:** Tooltip entrance and exit, spotlight reveal and morph, UI element scale and position, action bar appearance, tab switch animations, most interactive tutorial elements.

**Web:** Framer Motion `motion.div` with `transition={{ type: "spring", stiffness, damping }}`, `AnimatePresence` for enter/exit, `layoutId` for shared layout transitions.
**iOS:** `.spring(response:dampingFraction:)`, `.interpolatingSpring(stiffness:damping:)`, `withAnimation(.spring()) { }`.

### Tier 3: Custom (Canvas / Complex Sequences)

Use custom canvas rendering, SVG path animations, or complex multi-step choreographed sequences. Reserve exclusively for high-impact moments.

**Use for:** Completion celebrations only — confetti particles, animated checkmarks, stats counter animations, complex staggered reveal sequences.

**Web:** `canvas-confetti` library, custom `<canvas>` with `requestAnimationFrame`, SVG `stroke-dasharray`/`stroke-dashoffset` animations, Framer Motion `useMotionValue` + `useTransform`.
**iOS:** `CAEmitterLayer` for particles, custom `Shape` with `trim(from:to:)` for drawn paths, `Timer`-based counter animations.

---

## Core Tutorial Animation Types

### 1. Spotlight Reveals

The cutout in the overlay that highlights a target element. Appears, morphs between positions, and disappears as the tutorial progresses. Four patterns: expand from point, morph between shapes, fade transition, slide + morph.

**Default:** Spring animation, 300ms, morphing rounded rect.

See `references/spotlight-animations.md` for full implementation guide with code for both platforms.

### 2. Tooltip Entrance and Exit

Tooltip slides in from the direction of its arrow anchor point, combined with an opacity fade. Exit is faster than entrance to feel responsive.

**Entrance:** Translate 8px from arrow direction + opacity 0→1. Spring physics: stiffness 300, damping 25. Duration ~250ms.
**Exit:** Translate 4px toward arrow direction + opacity 1→0. Ease-out. Duration 150ms.

**Web:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 4 }}
  transition={{ type: "spring", stiffness: 300, damping: 25 }}
/>
```

**iOS:**
```swift
.offset(y: isVisible ? 0 : 8)
.opacity(isVisible ? 1 : 0)
.animation(.spring(response: 0.25, dampingFraction: 0.7), value: isVisible)
```

### 3. Celebration Moments

High-impact animations that reward completion. Confetti particles, pulse glows, animated checkmarks, and counting stats. These are Tier 3 — lazy load them and trigger only on explicit completion events.

See `references/celebration-library.md` for five celebration implementations with full code.

### 4. Progress Bar Fill

Width transition with ease-out easing. At milestone boundaries (25%, 50%, 75%, 100%), add a subtle color pulse — the accent color briefly brightens then returns.

**Web:**
```tsx
<div className="h-0.5 bg-accent transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
```

**iOS:**
```swift
Rectangle()
    .fill(Color.accent)
    .frame(width: totalWidth * progress)
    .animation(.easeOut(duration: 0.3), value: progress)
```

### 5. Gesture Indicators

Animated hints showing the user what gesture to perform — tap, swipe, drag, pinch, long press. Loop continuously until the user performs the action or the phase advances.

See `references/gesture-indicators.md` for five gesture hint patterns with code for both platforms.

### 6. Phase Transitions

Crossfade between tooltip positions when advancing phases. The old tooltip fades out (150ms ease-out), then the new tooltip fades in (200ms spring) with a slight translate from its anchor direction. Use `AnimatePresence` on web and conditional rendering with `.transition` on iOS.

### 7. Tab Switch Animations

Directional slide based on tab index delta. Moving to a higher-index tab = content slides left (new content enters from right). Moving to a lower-index tab = content slides right (new content enters from left).

**Duration:** 300ms ease-out. **Distance:** 20px translate.

### 8. Completion Screen Stagger Reveal

Sequential reveal of completion screen elements with increasing delay:
1. Background fades in — 200ms ease-in
2. Time stat zooms in — 300ms spring (stiffness 200, damping 20), 200ms delay
3. Secondary stats fade up — stagger 100ms each, spring physics, 500ms delay
4. CTA button slides up from bottom — 300ms spring, after all stats visible

---

## Platform-Specific Implementation

### iOS (SwiftUI)

- Use `.animation(.spring(...))` modifier or `withAnimation(.spring(...)) { }` blocks
- Pair visual feedback with haptics: `UIImpactFeedbackGenerator(style: .light)` on tooltip appear, `.medium` on phase complete, `UINotificationFeedbackGenerator().notificationOccurred(.success)` on tutorial complete
- Respect reduced motion: check `@Environment(\.accessibilityReduceMotion) var reduceMotion` and gate all spring/transform animations behind it
- Use `@State` and `@Binding` to drive animation state; avoid `Timer` except for Tier 3 counter animations
- Prefer `.matchedGeometryEffect` for spotlight morphing between positions

### Web (React / Next.js)

- Use Framer Motion `motion.div` with `variants` for reusable animation definitions
- Use `AnimatePresence` with `mode="wait"` for tooltip enter/exit sequencing
- Use `layoutId` for shared layout transitions between spotlight positions
- CSS transitions for Tier 1 cases — avoid importing Framer Motion for simple fades
- Check `prefers-reduced-motion` media query: `window.matchMedia('(prefers-reduced-motion: reduce)')`
- All animation components must be `"use client"` — server components cannot use browser APIs

---

## Performance Rules

- **60fps target.** Profile animations on low-end devices. If frames drop, simplify.
- **Transform and opacity only.** Never animate `width`, `height`, `top`, `left`, `margin`, or `padding`. These trigger layout recalculation. Use `transform: translateX/Y` and `scale` instead.
- **Lazy load celebrations.** Tier 3 animations (confetti, canvas particles) must be dynamically imported. On web: `const Confetti = dynamic(() => import('./Confetti'), { ssr: false })`. On iOS: load `CAEmitterLayer` only when needed.
- **Clean up on phase change.** Cancel running animations, remove `requestAnimationFrame` loops, invalidate timers, stop `CAEmitterLayer` emission when leaving a phase.
- **Use `will-change` sparingly.** Apply only to elements actively animating and remove after animation completes. Excessive `will-change` consumes GPU memory.
- **Avoid animating during gesture input.** If the user is actively swiping or dragging, pause decorative animations to keep the gesture responsive.

---

## Timing Defaults

| Animation | Duration | Easing | Notes |
|---|---|---|---|
| Spotlight transition | 300ms | spring(200, 25) | Morphs between cutout positions |
| Tooltip entrance | 250ms | spring(300, 25) | Slide + fade from arrow direction |
| Tooltip exit | 150ms | ease-out | Fade + slight slide |
| Celebration | 500–800ms | varies | Confetti longer, pulse shorter |
| Progress fill | matches phase | ease-out | Smooth width transition |
| Gesture indicator | 1500ms loop | ease-in-out | Repeating hint animation |
| Tab switch | 300ms | ease-out | Directional slide |
| Completion stagger | 100ms between items | spring(200, 20) | Sequential reveal |

---

## Reduced Motion Fallback

When `prefers-reduced-motion` (web) or `accessibilityReduceMotion` (iOS) is enabled:

- **Replace all spring/transform motion with instant state changes.** Elements appear at their final position immediately.
- **Keep opacity fades.** Opacity transitions are low-motion and acceptable. Reduce duration to 100ms.
- **Disable looping gesture indicators.** Show a static icon instead of an animated hint.
- **Keep haptics on iOS.** Haptic feedback is separate from visual motion and remains useful for accessibility.
- **Skip celebration particles.** Show the completion state without confetti or particle effects.
- **Progress bar updates instantly.** No width transition — jump to new value.

---

## Reference Files

- `references/spotlight-animations.md` — Four spotlight reveal patterns with full code for iOS and web
- `references/celebration-library.md` — Five celebration implementations with full code for both platforms
- `references/gesture-indicators.md` — Five gesture hint animations with full code for iOS and web
