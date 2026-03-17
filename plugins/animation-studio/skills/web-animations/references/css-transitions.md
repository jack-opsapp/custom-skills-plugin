# CSS Transitions & Animations Reference

## When This Produces the Best Result

Use pure CSS animations when:
- The animation is decorative (hover states, focus rings, entry fades)
- No JavaScript state drives the animation — it's triggered by pseudo-classes, scroll position, or element visibility
- Performance is paramount — CSS animations run on the compositor thread, avoiding main-thread jank
- You want zero runtime dependency — no library, no bundle cost
- The animation is scroll-driven and the element doesn't need complex choreography

Do NOT use CSS alone when:
- Animation timing depends on React state or props (use Motion for React)
- You need to orchestrate a multi-step timeline with scrub control (use GSAP)
- The animation involves 3D scene rendering (use Three.js/R3F)

---

## 1. @keyframes with animation-composition

### Basic Keyframes

```css
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-enter {
  animation: fadeSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
}
```

### animation-composition for Layered Effects

When multiple animations target the same property, `animation-composition` controls how they combine:

```css
.element {
  /* Base transform from layout */
  transform: translateX(100px);

  /* This animation ADDS to the existing transform rather than replacing it */
  animation: pulse 2s ease-in-out infinite;
  animation-composition: add;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

Values: `replace` (default — overwrites), `add` (combines additively), `accumulate` (adds numeric values).

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .card-enter {
    animation: none;
    /* Element appears instantly — no motion, full content */
  }
}
```

---

## 2. transition with linear() Easing

### Standard Transitions

```css
.button {
  background-color: var(--bg-idle);
  transform: scale(1);
  transition:
    background-color 0.2s ease,
    transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.button:hover {
  background-color: var(--bg-hover);
  transform: scale(1.02);
}

.button:active {
  transform: scale(0.98);
  transition-duration: 0.08s;
}
```

### linear() for Spring and Bounce Curves

The `linear()` easing function accepts a list of output values at evenly spaced (or explicitly positioned) stops, enabling spring and bounce effects impossible with `cubic-bezier()`:

```css
/* Spring easing — overshoots to ~1.05 then settles back to 1.0 */
/* Physics: underdamped spring with damping ratio ~0.5, stiffness ~200 */
.spring-enter {
  transition: transform 0.5s linear(
    0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%,
    0.938 16.7%, 1.017, 1.077, 1.121 24%, 1.149 26.2%,
    1.159, 1.151 32%, 1.017 45.9%, 0.991, 0.977 55%,
    0.975 58.9%, 1.003 72.8%, 1.009 81.4%, 1
  );
}

/* Bounce easing — hits floor, bounces twice, settles */
.bounce-enter {
  transition: transform 0.7s linear(
    0, 0.004, 0.016, 0.035, 0.063, 0.098, 0.141, 0.191,
    0.25, 0.316, 0.391, 0.472, 0.562, 0.66, 0.765, 0.878,
    1, 0.934, 0.878, 0.832, 0.797, 0.773, 0.76, 0.757,
    0.773, 0.797, 0.832, 0.878, 0.934, 1, 0.965, 0.941,
    0.928, 0.925, 0.941, 0.965, 1, 0.988, 0.984, 0.988, 1
  );
}
```

Generate `linear()` values using the [Linear Easing Generator](https://linear-easing-generator.netlify.app/) — input spring parameters (mass, stiffness, damping) and it outputs the CSS.

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .spring-enter,
  .bounce-enter {
    transition-duration: 0.01s;
    transition-timing-function: ease;
  }
}
```

---

## 3. @starting-style — Entry Animations from display:none

Baseline 2025 (Chrome 117+, Safari 17.5+, Firefox 129+). Enables CSS-only entry animations when an element transitions from `display: none` to visible.

### Complete Pattern: Dialog Entry

```css
dialog {
  /* Final (visible) state */
  opacity: 1;
  transform: translateY(0) scale(1);
  transition:
    opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    overlay 0.3s allow-discrete,
    display 0.3s allow-discrete;

  /* Starting state — where the element animates FROM when first displayed */
  @starting-style {
    opacity: 0;
    transform: translateY(16px) scale(0.96);
  }
}

/* Exit state — where the element animates TO when hidden */
dialog:not([open]) {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
```

Key requirements:
- `transition-behavior: allow-discrete` (or shorthand `allow-discrete` in the transition) lets `display` and `overlay` participate in the transition
- `@starting-style` block defines the "from" state for the ENTRY transition only
- The `:not([open])` selector defines the exit state

### Complete Pattern: Popover Entry

```css
[popover] {
  opacity: 1;
  transform: scale(1);
  transition:
    opacity 0.25s ease,
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    overlay 0.25s allow-discrete,
    display 0.25s allow-discrete;

  @starting-style {
    opacity: 0;
    transform: scale(0.9);
  }
}

[popover]:not(:popover-open) {
  opacity: 0;
  transform: scale(0.95);
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  dialog,
  [popover] {
    transition: none;
  }
}
```

---

## 4. View Transition API

### SPA View Transitions (Same-Document)

```typescript
// Wrap any DOM mutation in startViewTransition
function navigateTo(newContent: HTMLElement) {
  if (!document.startViewTransition) {
    // Fallback: instant swap
    replaceContent(newContent);
    return;
  }

  const transition = document.startViewTransition(() => {
    replaceContent(newContent);
  });

  // Optional: run code when transition finishes
  transition.finished.then(() => {
    console.log("Transition complete");
  });
}
```

```css
/* Default cross-fade for all transitions */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

/* Named transition for a specific element */
.product-image {
  view-transition-name: product-hero;
}

::view-transition-old(product-hero) {
  animation: fadeAndShrink 0.3s ease forwards;
}

::view-transition-new(product-hero) {
  animation: fadeAndGrow 0.3s ease forwards;
}
```

### MPA View Transitions (Cross-Document)

No JavaScript required. Works for same-origin navigations:

```css
/* Add to BOTH source and destination pages */
@view-transition {
  navigation: auto;
}

/* Elements with matching view-transition-name across pages animate between them */
.page-header {
  view-transition-name: page-header;
}

.hero-image {
  view-transition-name: hero-image;
}
```

Browser support (2026): Chrome 126+, Edge 126+, Safari 18.2+. Firefox in development.

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
  }
}
```

---

## 5. Scroll-Driven Animations (CSS Only)

### animation-timeline: scroll()

Ties animation progress to scroll position of a container:

```css
/* Progress bar that fills as user scrolls the page */
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--accent-color, #597794);
  transform-origin: left;
  animation: scaleX linear both;
  animation-timeline: scroll(root block);
}

@keyframes scaleX {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
```

`scroll()` arguments:
- Scroller: `root` (viewport), `nearest` (nearest scroll ancestor), `self`
- Axis: `block` (vertical), `inline` (horizontal), `x`, `y`

### animation-timeline: view()

Ties animation progress to an element's visibility within its scroll container:

```css
/* Element fades and slides up as it enters the viewport */
.reveal-on-scroll {
  animation: revealUp linear both;
  animation-timeline: view(block);
  /* Start when element's top edge enters bottom of viewport,
     end when element's top edge reaches 40% from bottom */
  animation-range: entry 0% entry 100%;
}

@keyframes revealUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

`animation-range` keywords:
- `entry` — from element entering to fully inside
- `exit` — from element starting to leave to fully outside
- `contain` — from fully inside to starting to leave
- `cover` — from first pixel visible to last pixel gone

### Named Scroll Timelines

```css
.scroll-container {
  overflow-y: scroll;
  scroll-timeline-name: --my-scroller;
  scroll-timeline-axis: block;
}

.animated-child {
  animation: parallax linear both;
  animation-timeline: --my-scroller;
}
```

### Browser Support

Baseline 2025: Chrome 115+, Edge 115+, Safari 26+, Firefox 110+. Fully cross-browser as of Safari 26 (2026).

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .reveal-on-scroll,
  .scroll-progress {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

---

## 6. Container Queries for Responsive Animation Parameters

Use container queries to adjust animation intensity based on component size rather than viewport:

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* Larger cards get more dramatic hover transforms */
@container card (min-width: 400px) {
  .card {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .card:hover {
    transform: translateY(-8px) scale(1.02);
  }
}

/* Smaller cards get subtle hover */
@container card (max-width: 399px) {
  .card {
    transition: transform 0.2s ease;
  }
  .card:hover {
    transform: translateY(-4px);
  }
}
```

---

## 7. Complete Production Pattern: Animated Card

```css
.animated-card {
  /* Layout */
  position: relative;
  overflow: hidden;
  border-radius: var(--radius, 12px);
  background: var(--card-bg, #111111);

  /* Default state */
  opacity: 1;
  transform: translateY(0);

  /* Hover transition */
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.25s ease;

  /* Scroll-driven entry */
  animation: cardReveal linear both;
  animation-timeline: view(block);
  animation-range: entry 0% entry 80%;

  /* Entry from display:none (if toggled) */
  @starting-style {
    opacity: 0;
    transform: translateY(24px);
  }
}

.animated-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.animated-card:active {
  transform: translateY(-2px);
  transition-duration: 0.08s;
}

/* Internal shine effect on hover */
.animated-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 255, 255, 0.03) 45%,
    rgba(255, 255, 255, 0.06) 50%,
    rgba(255, 255, 255, 0.03) 55%,
    transparent 60%
  );
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.animated-card:hover::after {
  transform: translateX(100%);
}

@keyframes cardReveal {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .animated-card {
    animation: none;
    transition: none;
  }
  .animated-card::after {
    display: none;
  }
}
```

---

## Brand Config Integration Points

CSS custom properties are the bridge between brand tokens and animation parameters:

```css
:root {
  /* Brand tokens — set these from your design system */
  --animation-duration-fast: 0.15s;
  --animation-duration-base: 0.3s;
  --animation-duration-slow: 0.5s;
  --animation-easing-default: cubic-bezier(0.16, 1, 0.3, 1);
  --animation-easing-spring: linear(
    0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%,
    0.938 16.7%, 1.017, 1.077, 1.121 24%, 1.149 26.2%,
    1.159, 1.151 32%, 1.017 45.9%, 0.991, 0.977 55%,
    0.975 58.9%, 1.003 72.8%, 1.009 81.4%, 1
  );
  --accent-color: #597794;
  --surface-color: #0A0A0A;
  --card-bg: #111111;
  --radius: 12px;
}
```

Reference these in every animation declaration. Never hardcode `0.3s` or `ease-out` directly — always use the token so the entire system can be retuned from one place.

---

## Performance Notes

1. **Compositor-only properties** — `transform` and `opacity` are GPU-composited. Animating `width`, `height`, `top`, `left`, `padding`, `border-radius` triggers layout/paint. Use `transform: scale()` instead of width changes.
2. **will-change** — Apply `will-change: transform` only on elements that WILL animate (not globally). Remove after animation completes to free GPU memory.
3. **contain** — Use `contain: layout style paint` on animated containers to isolate repaints.
4. **Scroll-driven animations** run on the compositor thread automatically — no jank.
5. **@starting-style** triggers a single style recalc on element insertion — negligible cost.
