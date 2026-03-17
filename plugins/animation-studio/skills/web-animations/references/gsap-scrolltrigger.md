# GSAP 3.12+ & ScrollTrigger Reference

## When This Produces the Best Result

Use GSAP when:
- You need a multi-step timeline with precise sequencing (element A moves, then B fades, then C rotates — in order)
- Scroll-driven animations require pinning, scrubbing, or snapping
- Text needs to be split into characters/words/lines and animated individually
- SVGs need morphing (MorphSVG) or drawing (DrawSVG)
- You need Flip animations (animating between two DOM states)
- The animation involves elements outside React's render cycle (raw DOM nodes)

Do NOT use GSAP when:
- The animation is a simple hover/focus state — use CSS
- Animation state is driven by React props and needs re-render integration — use Motion for React
- You're building 3D scenes — use Three.js/R3F

---

## Installation & Setup (2026)

As of April 2025, **all GSAP plugins are 100% free** including SplitText, MorphSVG, DrawSVG, Flip, ScrollSmoother, and all Club GSAP plugins. Webflow acquired GSAP and removed all paid tiers.

```bash
npm install gsap @gsap/react
```

### Dynamic Import (Code Splitting)

GSAP should be dynamically imported in Next.js to avoid SSR issues and reduce initial bundle:

```tsx
"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";

export function AnimatedSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(async () => {
    const { gsap } = await import("gsap");
    const { ScrollTrigger } = await import("gsap/ScrollTrigger");
    gsap.registerPlugin(ScrollTrigger);

    // Animations here — GSAP is loaded and ready
    gsap.from(".reveal-element", {
      y: 60,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.1,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
        end: "bottom 20%",
      },
    });
  }, { scope: containerRef }); // scope limits GSAP selectors to this container

  return <div ref={containerRef}>...</div>;
}
```

### useGSAP Hook

The `@gsap/react` package provides `useGSAP` — a drop-in replacement for `useEffect` that handles GSAP cleanup automatically (kills tweens, removes ScrollTriggers):

```tsx
import { useGSAP } from "@gsap/react";

// Runs once on mount, cleans up on unmount
useGSAP(() => {
  gsap.to(".box", { x: 200 });
}, { scope: containerRef });

// With dependencies (re-runs when deps change)
useGSAP(() => {
  gsap.to(".box", { x: isOpen ? 200 : 0 });
}, { dependencies: [isOpen], scope: containerRef });
```

---

## 1. Timeline Composition

### Basic Timeline

```tsx
const tl = gsap.timeline({
  defaults: {
    duration: 0.6,
    ease: "power3.out",
  },
});

tl
  .from(".hero-title", { y: 40, opacity: 0 })
  .from(".hero-subtitle", { y: 30, opacity: 0 }, "-=0.4")  // overlap by 0.4s
  .from(".hero-cta", { y: 20, opacity: 0, scale: 0.95 }, "-=0.3")
  .from(".hero-image", { scale: 1.1, opacity: 0, duration: 1 }, "-=0.5");
```

### Position Parameter Syntax

| Syntax | Meaning |
|--------|---------|
| `"-=0.4"` | Start 0.4s before previous animation ends (overlap) |
| `"+=0.2"` | Start 0.2s after previous animation ends (gap) |
| `"<"` | Start at the same time as previous animation |
| `"<0.3"` | Start 0.3s after the previous animation starts |
| `2` | Start at absolute time 2s in the timeline |

### Nested Timelines

```tsx
function createHeaderTimeline() {
  return gsap.timeline()
    .from(".logo", { x: -30, opacity: 0, duration: 0.4 })
    .from(".nav-link", { y: -20, opacity: 0, stagger: 0.05 }, "-=0.2");
}

function createHeroTimeline() {
  return gsap.timeline()
    .from(".hero-title", { y: 60, opacity: 0, duration: 0.7 })
    .from(".hero-body", { y: 40, opacity: 0 }, "-=0.4");
}

// Compose into master timeline
const master = gsap.timeline();
master
  .add(createHeaderTimeline())
  .add(createHeroTimeline(), "-=0.3"); // hero starts before header finishes
```

---

## 2. ScrollTrigger

### Basic Scroll-Triggered Animation

```tsx
gsap.from(".feature-card", {
  y: 80,
  opacity: 0,
  duration: 0.8,
  ease: "power3.out",
  stagger: 0.15,
  scrollTrigger: {
    trigger: ".features-section",
    start: "top 75%",     // trigger's top hits 75% from viewport top
    end: "bottom 25%",    // trigger's bottom hits 25% from viewport top
    toggleActions: "play none none none",
  },
});
```

### toggleActions Format

`toggleActions: "onEnter onLeave onEnterBack onLeaveBack"`

Values: `play`, `pause`, `resume`, `reverse`, `restart`, `reset`, `complete`, `none`

### Scrub — Animation Progress Tied to Scroll

```tsx
gsap.to(".parallax-bg", {
  yPercent: -30,
  ease: "none", // linear for scrub — easing feels wrong when user controls speed
  scrollTrigger: {
    trigger: ".parallax-section",
    start: "top bottom",
    end: "bottom top",
    scrub: true,       // boolean: instant tracking
    // scrub: 0.5,     // number: seconds of smoothing lag
  },
});
```

### Pin — Lock Element During Scroll

```tsx
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".pinned-section",
    start: "top top",
    end: "+=2000",      // pin for 2000px of scrolling
    pin: true,          // pin the trigger element
    scrub: 1,           // smooth scrub with 1s lag
    snap: {
      snapTo: 1 / 4,   // snap to 25% increments (4 steps)
      duration: 0.3,
      ease: "power2.inOut",
    },
  },
});

// These play out over 2000px of scroll
tl
  .from(".step-1", { opacity: 0, y: 40 })
  .to(".step-1", { opacity: 0, y: -40 })
  .from(".step-2", { opacity: 0, y: 40 })
  .to(".step-2", { opacity: 0, y: -40 })
  .from(".step-3", { opacity: 0, y: 40 })
  .to(".step-3", { opacity: 0, y: -40 })
  .from(".step-4", { opacity: 0, y: 40 });
```

### clamp() — Above-the-Fold Safety

Prevents trigger positions from leaking above or below the scrollable area:

```tsx
ScrollTrigger.create({
  trigger: ".hero",
  start: "clamp(top bottom)", // never starts before scroll position 0
  end: "clamp(bottom top)",
  scrub: true,
  animation: gsap.fromTo(".hero-bg", { scale: 1.2 }, { scale: 1 }),
});
```

---

## 3. SplitText (Rewritten 2025)

The new SplitText is half the file size of the old version, with 14+ new features:

```tsx
const { SplitText } = await import("gsap/SplitText");
gsap.registerPlugin(SplitText);

// Create split — returns instance with .chars, .words, .lines arrays
const split = SplitText.create(".hero-heading", {
  type: "chars, words, lines",
  autoSplit: true,      // Re-splits on resize and font load
  mask: "lines",        // Wraps each line in overflow:hidden for reveal effects
  aria: true,           // Adds aria-label to parent, aria-hidden to fragments
  onSplit: () => {
    // Callback after every split (including re-splits on resize)
    // Re-run animations here if needed
  },
});

// Stagger characters in
gsap.from(split.chars, {
  y: "100%",           // From below the mask
  opacity: 0,
  duration: 0.5,
  ease: "power3.out",
  stagger: 0.02,       // 20ms between each character
});
```

### SplitText Key Features (2025 Rewrite)

| Feature | Description |
|---------|-------------|
| `autoSplit` | Automatically re-splits when container resizes or fonts load |
| `mask: "lines"` | Wraps lines in `overflow: hidden` containers for clean clip-reveal |
| `deepSlice` | Handles `<a>`, `<strong>`, `<em>` spanning multiple lines without vertical stretch |
| `aria: true` | Screen reader accessible — `aria-label` on parent, `aria-hidden` on fragments |
| `onSplit` | Callback on every split (initial + resize re-splits) |
| `tag` | Custom wrapper tag (default: `div` for lines, `span` for words/chars) |

### Text Reveal with Mask

```tsx
const split = SplitText.create(".reveal-text", {
  type: "lines",
  mask: "lines", // Each line wrapped in overflow:hidden
});

gsap.from(split.lines, {
  yPercent: 100,     // Lines slide up from below their mask
  duration: 0.7,
  ease: "power3.out",
  stagger: 0.08,
  scrollTrigger: {
    trigger: ".reveal-text",
    start: "top 80%",
  },
});
```

---

## 4. MorphSVG

```tsx
const { MorphSVGPlugin } = await import("gsap/MorphSVGPlugin");
gsap.registerPlugin(MorphSVGPlugin);

// Morph one SVG path into another
gsap.to("#shape-a", {
  morphSVG: "#shape-b",
  duration: 1,
  ease: "power2.inOut",
});

// Morph to a raw path string
gsap.to("#icon", {
  morphSVG: "M10 20 L30 10 L50 20 L50 40 L10 40 Z",
  duration: 0.8,
});
```

---

## 5. DrawSVG

Animate SVG stroke drawing:

```tsx
const { DrawSVGPlugin } = await import("gsap/DrawSVGPlugin");
gsap.registerPlugin(DrawSVGPlugin);

// Draw from 0% to 100%
gsap.from(".svg-path", {
  drawSVG: "0%",
  duration: 1.5,
  ease: "power2.inOut",
});

// Draw a segment: start at 40%-60%, animate to full
gsap.fromTo(".svg-path",
  { drawSVG: "40% 60%" },
  { drawSVG: "0% 100%", duration: 1 }
);
```

---

## 6. Flip Plugin

Animate between two DOM states (position, size, any property):

```tsx
const { Flip } = await import("gsap/Flip");
gsap.registerPlugin(Flip);

function reorderItems() {
  // 1. Capture current state
  const state = Flip.getState(".grid-item");

  // 2. Make DOM changes (reorder, reparent, resize, etc.)
  container.classList.toggle("grid-alt-layout");

  // 3. Animate from old state to new state
  Flip.from(state, {
    duration: 0.6,
    ease: "power2.inOut",
    stagger: 0.04,
    absolute: true,  // Use absolute positioning during animation
    onComplete: () => console.log("Flip complete"),
  });
}
```

---

## 7. gsap.matchMedia() — Responsive & Reduced Motion

```tsx
const mm = gsap.matchMedia();

mm.add("(min-width: 768px)", () => {
  // Desktop animations — complex parallax
  gsap.to(".parallax", { yPercent: -20, scrollTrigger: { scrub: true } });
});

mm.add("(max-width: 767px)", () => {
  // Mobile — simpler animations
  gsap.from(".card", { y: 30, opacity: 0, stagger: 0.1 });
});

mm.add("(prefers-reduced-motion: reduce)", () => {
  // Kill all animations, show everything immediately
  gsap.set(".animated", { clearProps: "all" });
  ScrollTrigger.getAll().forEach((st) => st.kill());
});
```

---

## 8. Complete Pattern: Pinned Scroll Narrative

```tsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";

interface ScrollNarrativeProps {
  steps: {
    id: string;
    title: string;
    body: string;
  }[];
  accentColor?: string;
  pinDuration?: number;
}

export function ScrollNarrative({
  steps,
  accentColor = "#597794",
  pinDuration = 3000,
}: ScrollNarrativeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(async () => {
    const { gsap } = await import("gsap");
    const { ScrollTrigger } = await import("gsap/ScrollTrigger");
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: `+=${pinDuration}`,
          pin: true,
          scrub: 1,
          snap: {
            snapTo: 1 / (steps.length - 1),
            duration: 0.4,
            ease: "power2.inOut",
          },
        },
      });

      steps.forEach((step, i) => {
        if (i > 0) {
          // Fade out previous step
          tl.to(`[data-step="${steps[i - 1].id}"]`, {
            opacity: 0,
            y: -30,
            duration: 0.3,
          });
          // Fade in current step
          tl.from(`[data-step="${step.id}"]`, {
            opacity: 0,
            y: 30,
            duration: 0.3,
          });
        }
      });

      // Progress bar
      tl.to(
        "[data-progress-fill]",
        { scaleX: 1, ease: "none", duration: tl.duration() },
        0
      );
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      // Show all steps stacked, no scroll hijacking
      gsap.set("[data-step]", { opacity: 1, y: 0 });
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
        <div
          data-progress-fill
          className="h-full origin-left scale-x-0"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center min-h-screen">
        {steps.map((step, i) => (
          <div
            key={step.id}
            data-step={step.id}
            className="absolute text-center max-w-lg px-6"
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            <h2 className="text-3xl font-bold mb-4" style={{ color: accentColor }}>
              {step.title}
            </h2>
            <p className="text-zinc-400 text-lg">{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Performance Engineering

1. **Dynamic imports** — Always dynamically import GSAP and its plugins. The core is ~28kb gzipped; each plugin adds 3-12kb.
2. **useGSAP cleanup** — The hook automatically kills all tweens and ScrollTriggers created within it on unmount. Never use raw `useEffect` with GSAP.
3. **will-change** — GSAP sets `will-change: transform` during animation and removes it after. Don't pre-set it.
4. **ScrollTrigger.refresh()** — Call after dynamic content loads (images, lazy content) to recalculate trigger positions.
5. **fastScrollEnd** — `ScrollTrigger.config({ fastScrollEnd: true })` prevents ScrollTrigger from waiting 200ms after scroll stops to fire `onLeave`/`onLeaveBack`.
6. **Batch processing** — `ScrollTrigger.batch(".card", { onEnter: batch => gsap.to(batch, { opacity: 1, stagger: 0.1 }) })` for many identical triggers.

---

## Brand Config Integration

```tsx
// All visual tokens come from props — never hardcoded
interface GSAPAnimationConfig {
  accentColor?: string;
  backgroundColor?: string;
  duration?: number;
  ease?: string; // GSAP easing string: "power3.out", "elastic.out(1, 0.3)", etc.
  stagger?: number;
}

const defaults: Required<GSAPAnimationConfig> = {
  accentColor: "#597794",
  backgroundColor: "#0A0A0A",
  duration: 0.7,
  ease: "power3.out",
  stagger: 0.08,
};
```
