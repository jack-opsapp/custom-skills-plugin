# Scroll Animations — Comprehensive Comparison

Three approaches to scroll-driven animation on the web. This reference compares them head-to-head with decision criteria and complete patterns for each.

---

## Decision Matrix

| Criterion | CSS `animation-timeline` | Motion `useScroll` | GSAP ScrollTrigger |
|-----------|-------------------------|--------------------|--------------------|
| **Bundle cost** | 0kb | ~27kb (Motion) | ~28kb (GSAP) + ~12kb (ScrollTrigger) |
| **Thread** | Compositor (off-main-thread) | Main thread (WAAPI fallback in 12.35+) | Main thread |
| **Choreography** | Simple — single element per animation | Moderate — useTransform chains | Complex — multi-element timelines |
| **Pinning** | No | No (requires `position: sticky` workaround) | Yes — first-class `pin: true` |
| **Scrubbing** | Yes — native | Yes — via motion values | Yes — `scrub: true/number` |
| **Snapping** | No | No | Yes — `snap: { snapTo }` |
| **Text splitting** | No | No | Yes — SplitText plugin |
| **Browser support** | Chrome 115+, Safari 26+, FF 110+ | All (React requirement) | All (IE11+) |
| **React integration** | CSS modules/Tailwind only | Native — props/state driven | `useGSAP` hook, but DOM-centric |
| **Reduced motion** | `@media` query | `useReducedMotion()` hook | `gsap.matchMedia()` |

---

## When to Use Each

### CSS `animation-timeline: scroll()` / `view()`
**Best when:**
- The animation is a single element responding to scroll (progress bar, parallax background, reveal-on-scroll)
- Zero JavaScript is acceptable — pure CSS
- Performance is critical and you need compositor-thread rendering
- The project doesn't already have Motion or GSAP loaded

**Not suitable when:**
- Multiple elements need coordinated timing (use GSAP timeline)
- Animation values need to drive React state (use Motion useScroll)
- Pinning is required (use GSAP)

### Motion for React `useScroll` + `useTransform`
**Best when:**
- Scroll position needs to drive React component props (color, text, conditional rendering)
- The animation is part of a component already using Motion (AnimatePresence, layout animations)
- Spring-smoothed scroll values are needed (useSpring)
- You want scroll-linked values without managing DOM refs manually

**Not suitable when:**
- The animation is purely visual with no React state involvement (use CSS)
- Complex timeline with pinning, snapping, scrubbing is needed (use GSAP)
- Text splitting or SVG morphing is involved (use GSAP)

### GSAP ScrollTrigger
**Best when:**
- Multi-step narrative sections: pin, scrub through timeline, snap between steps
- Text needs splitting and character-level animation
- SVGs need to morph or draw on scroll
- The scroll section is a self-contained experience (not tightly coupled to React state)
- You need `toggleActions` for different behaviors on enter/leave/re-enter

**Not suitable when:**
- A simple reveal-on-scroll that CSS can handle (overkill)
- Scroll values need to drive React re-renders (Motion is more natural)

---

## Complete Patterns

### Pattern 1: Parallax Section — CSS

```css
.parallax-container {
  height: 100vh;
  overflow: hidden;
}

.parallax-bg {
  position: absolute;
  inset: -20% 0; /* Extra 20% top/bottom for travel room */
  background-image: url("/hero-bg.jpg");
  background-size: cover;
  background-position: center;

  /* Parallax: background moves at 30% of scroll speed
     The animation plays from 0% to 100% as the container scrolls through */
  animation: parallaxShift linear both;
  animation-timeline: scroll(nearest block);
}

@keyframes parallaxShift {
  from { transform: translateY(-10%); }
  to { transform: translateY(10%); }
}

.parallax-content {
  position: relative;
  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .parallax-bg {
    animation: none;
    transform: none;
  }
}
```

### Pattern 2: Parallax Section — Motion for React

```tsx
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

interface ParallaxSectionProps {
  backgroundSrc: string;
  children: React.ReactNode;
  speed?: number; // 0 = static, 1 = full speed
}

export function ParallaxSection({
  backgroundSrc,
  children,
  speed = 0.3,
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
    /* start end = ref's top hits viewport bottom → progress 0
       end start = ref's bottom hits viewport top → progress 1 */
  });

  /* Map [0, 1] scroll progress to vertical pixel offset
     speed=0.3 means background moves at 30% of scroll speed */
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <div ref={ref} className="relative h-screen overflow-hidden">
      <motion.div
        className="absolute inset-[-20%_0] bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundSrc})`,
          y: prefersReduced ? 0 : y,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

### Pattern 3: Parallax Section — GSAP ScrollTrigger

```tsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";

interface ParallaxSectionGSAPProps {
  backgroundSrc: string;
  children: React.ReactNode;
  speed?: number;
}

export function ParallaxSectionGSAP({
  backgroundSrc,
  children,
  speed = 0.3,
}: ParallaxSectionGSAPProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(async () => {
    const { gsap } = await import("gsap");
    const { ScrollTrigger } = await import("gsap/ScrollTrigger");
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to("[data-parallax-bg]", {
        yPercent: speed * 30, // 30% travel = ~10% of container height
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true, // instant tracking, no smoothing lag
        },
      });
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative h-screen overflow-hidden">
      <div
        data-parallax-bg
        className="absolute inset-[-20%_0] bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundSrc})` }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

---

### Pattern 4: Reveal-on-Scroll — CSS

```css
.reveal {
  animation: revealUp linear both;
  animation-timeline: view(block);
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

@media (prefers-reduced-motion: reduce) {
  .reveal {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

### Pattern 5: Reveal-on-Scroll — Motion for React

```tsx
"use client";

import { motion, useReducedMotion } from "motion/react";

interface RevealProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
}

export function Reveal({ children, direction = "up", delay = 0 }: RevealProps) {
  const prefersReduced = useReducedMotion();

  const directionMap = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
  };

  return (
    <motion.div
      initial={
        prefersReduced
          ? { opacity: 0 }
          : { opacity: 0, ...directionMap[direction] }
      }
      whileInView={
        prefersReduced
          ? { opacity: 1 }
          : { opacity: 1, x: 0, y: 0 }
      }
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: prefersReduced ? 0.15 : 0.6,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
```

### Pattern 6: Reveal-on-Scroll — GSAP ScrollTrigger

```tsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";

interface RevealGSAPProps {
  children: React.ReactNode;
  stagger?: number;
}

export function RevealGSAP({ children, stagger = 0.1 }: RevealGSAPProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(async () => {
    const { gsap } = await import("gsap");
    const { ScrollTrigger } = await import("gsap/ScrollTrigger");
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(ref.current!.children, {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger,
        scrollTrigger: {
          trigger: ref.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });
    });
  }, { scope: ref });

  return <div ref={ref}>{children}</div>;
}
```

---

### Pattern 7: Pinned Narrative — GSAP Only

This pattern has no CSS or Motion equivalent. Pinning is unique to GSAP ScrollTrigger:

```tsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";

interface NarrativeStep {
  id: string;
  content: React.ReactNode;
}

interface PinnedNarrativeProps {
  steps: NarrativeStep[];
  accentColor?: string;
}

export function PinnedNarrative({
  steps,
  accentColor = "#597794",
}: PinnedNarrativeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(async () => {
    const { gsap } = await import("gsap");
    const { ScrollTrigger } = await import("gsap/ScrollTrigger");
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const totalSteps = steps.length;
      /* Each step gets 800px of scroll travel */
      const scrollPerStep = 800;
      const totalScroll = scrollPerStep * totalSteps;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: `+=${totalScroll}`,
          pin: true,
          scrub: 0.8, // 0.8s smoothing lag for buttery feel
          snap: {
            snapTo: 1 / (totalSteps - 1),
            duration: { min: 0.2, max: 0.4 },
            ease: "power2.inOut",
          },
        },
      });

      /* Build timeline: each step fades in then fades out */
      steps.forEach((step, i) => {
        const selector = `[data-narrative-step="${step.id}"]`;

        if (i === 0) {
          /* First step starts visible */
          tl.from(selector, { opacity: 0, y: 30, duration: 0.3 });
        }

        if (i < totalSteps - 1) {
          /* Fade out current step */
          tl.to(selector, { opacity: 0, y: -30, duration: 0.3 }, `+=${0.4}`);
          /* Fade in next step */
          tl.from(
            `[data-narrative-step="${steps[i + 1].id}"]`,
            { opacity: 0, y: 30, duration: 0.3 }
          );
        }
      });
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      /* Show all steps stacked, no pinning */
      gsap.set("[data-narrative-step]", { opacity: 1, y: 0, position: "relative" });
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center">
      {steps.map((step) => (
        <div
          key={step.id}
          data-narrative-step={step.id}
          className="absolute max-w-2xl px-8 text-center"
        >
          {step.content}
        </div>
      ))}
    </div>
  );
}
```

---

### Pattern 8: Scroll Progress Indicator — All Three

**CSS (zero JS):**
```css
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--accent, #597794);
  transform-origin: left;
  animation: scaleX linear both;
  animation-timeline: scroll(root block);
}

@keyframes scaleX {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
```

**Motion:**
```tsx
"use client";
import { motion, useScroll, useSpring } from "motion/react";

export function ScrollProgress({ color = "#597794" }: { color?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 400, damping: 40 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] origin-left z-50"
      style={{ scaleX, backgroundColor: color }}
    />
  );
}
```

**GSAP:**
```tsx
"use client";
import { useGSAP } from "@gsap/react";

export function ScrollProgressGSAP({ color = "#597794" }: { color?: string }) {
  useGSAP(async () => {
    const { gsap } = await import("gsap");
    const { ScrollTrigger } = await import("gsap/ScrollTrigger");
    gsap.registerPlugin(ScrollTrigger);

    gsap.to("[data-scroll-progress]", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { scrub: 0.3 },
    });
  });

  return (
    <div
      data-scroll-progress
      className="fixed top-0 left-0 right-0 h-[3px] origin-left scale-x-0 z-50"
      style={{ backgroundColor: color }}
    />
  );
}
```

**Recommendation:** Use the CSS version. Zero bundle cost, compositor-thread performance, and the simplest implementation for this specific pattern.

---

## Mixing Approaches

You can safely combine these approaches in one project:

- **CSS scroll-driven** for progress bars, simple parallax, reveal-on-scroll
- **Motion useScroll** for scroll values that drive React component state
- **GSAP ScrollTrigger** for the one or two hero sections that need pinning + timeline

There is no conflict. CSS scroll-driven animations run on the compositor. Motion and GSAP both use Intersection Observer or scroll event listeners on the main thread. They don't interfere with each other.
