# Motion for React (Framer Motion 12+) Reference

## When This Produces the Best Result

Use Motion for React when:
- Animation state is driven by React props or component state
- Components mount/unmount and need enter/exit transitions (`AnimatePresence`)
- Layout shifts need smooth interpolation (`layout` prop, `LayoutGroup`)
- Gesture-driven animations: hover, tap, drag, pan, focus
- Scroll-linked values need to drive React component props
- Shared element transitions between routes/views
- Spring physics for natural-feeling micro-interactions

Do NOT use Motion for React when:
- The animation is purely decorative CSS (hover glow, focus ring) — use CSS
- You need pinned scroll sections with timeline scrubbing — use GSAP ScrollTrigger
- You're rendering 3D scenes — use Three.js/R3F
- You need thousands of particles — use Canvas/WebGL

---

## Installation & Import (2026)

```bash
npm install motion
```

```tsx
// Standard import — use this in client components
"use client";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, useReducedMotion, LayoutGroup } from "motion/react";

// For React Server Components (Next.js App Router)
// Import from motion/react-client when you need motion in a server component tree
import * as m from "motion/react-client";
```

The package is `motion` (not `framer-motion`). Import path is `motion/react`. The `framer-motion` package still works as an alias but is deprecated.

Bundle size: ~27kb (full), ~12.5kb (motion component only).

---

## 1. Motion Components — Basics

Every HTML and SVG element has a `motion` equivalent:

```tsx
"use client";

import { motion } from "motion/react";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.16, 1, 0.3, 1], // expo-out
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

### Key Props

| Prop | Purpose |
|------|---------|
| `initial` | Starting state (or `false` to skip mount animation) |
| `animate` | Target state — Motion interpolates from initial to animate |
| `exit` | State to animate to on unmount (requires `AnimatePresence` parent) |
| `transition` | Timing config: `duration`, `ease`, `delay`, `type: "spring"`, etc. |
| `whileHover` | State while hovered |
| `whileTap` | State while pressed |
| `whileFocus` | State while focused |
| `whileInView` | State while element is in viewport |
| `layout` | Enable layout animation (animates position/size changes) |

---

## 2. AnimatePresence — Enter/Exit Transitions

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface NotificationProps {
  id: string;
  message: string;
  accentColor?: string;
}

export function NotificationStack({ notifications }: { notifications: NotificationProps[] }) {
  return (
    <div className="fixed top-4 right-4 flex flex-col gap-2 z-50">
      <AnimatePresence mode="popLayout">
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            style={{ borderLeftColor: n.accentColor }}
            className="bg-zinc-900 border-l-2 rounded-lg px-4 py-3 text-sm text-zinc-100 shadow-lg"
          >
            {n.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

### AnimatePresence Modes

| Mode | Behavior |
|------|----------|
| `"sync"` (default) | Exiting and entering children animate simultaneously |
| `"wait"` | Exiting child completes before entering child starts |
| `"popLayout"` | Exiting child is popped out of document flow — siblings reflow immediately while exit animation plays. Best for lists and notification stacks. |

---

## 3. Variants — Orchestrated Animations

Variants let you define named animation states and orchestrate parent-child timing:

```tsx
"use client";

import { motion } from "motion/react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      /* Parent waits 0.1s, then staggers children 0.06s apart */
      delayChildren: 0.1,
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

interface StaggerListProps {
  items: { id: string; label: string }[];
  accentColor?: string;
}

export function StaggerList({ items, accentColor = "#597794" }: StaggerListProps) {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      {items.map((item) => (
        <motion.li
          key={item.id}
          variants={itemVariants}
          className="px-4 py-3 rounded-lg bg-zinc-900"
          style={{ borderLeftColor: accentColor }}
        >
          {item.label}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

---

## 4. Layout Animations

The `layout` prop makes position and size changes animate smoothly:

```tsx
"use client";

import { useState } from "react";
import { motion, LayoutGroup } from "motion/react";

interface Tab {
  id: string;
  label: string;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  accentColor?: string;
}

export function AnimatedTabs({ tabs, accentColor = "#597794" }: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <LayoutGroup>
      <div className="flex gap-1 p-1 rounded-lg bg-zinc-900">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative px-4 py-2 text-sm font-medium rounded-md"
            style={{ color: activeTab === tab.id ? "#fff" : "#888" }}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-md"
                style={{ backgroundColor: accentColor }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}
```

`layoutId` — Elements with the same `layoutId` animate between each other, even across different parent components. This is the shared layout transition primitive.

---

## 5. useScroll + useTransform + useSpring

### Scroll Progress Indicator

```tsx
"use client";

import { motion, useScroll, useSpring } from "motion/react";

interface ScrollProgressProps {
  color?: string;
}

export function ScrollProgress({ color = "#597794" }: ScrollProgressProps) {
  /* scrollYProgress: 0 at top of page, 1 at bottom */
  const { scrollYProgress } = useScroll();

  /* Smooth the raw scroll value with spring physics */
  /* stiffness: 400 = responsive, damping: 40 = minimal overshoot */
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 400,
    damping: 40,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] origin-left z-50"
      style={{ scaleX, backgroundColor: color }}
    />
  );
}
```

### Parallax Effect

```tsx
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

interface ParallaxProps {
  children: React.ReactNode;
  offset?: number; // pixels of parallax travel
  className?: string;
}

export function Parallax({ children, offset = 100, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
    /* "start end" = element's top hits viewport bottom → progress 0
       "end start" = element's bottom hits viewport top → progress 1 */
  });

  /* Map scroll progress [0, 1] to pixel offset [+offset, -offset] */
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}
```

### useTransform with Function Syntax (v12+)

```tsx
/* Function syntax — runs on every frame, full control */
const backgroundColor = useTransform(scrollYProgress, (progress) => {
  // Interpolate between two colors based on scroll
  const r = Math.round(10 + progress * 79);  // 0A → 59
  const g = Math.round(10 + progress * 109); // 0A → 77
  const b = Math.round(10 + progress * 138); // 0A → 94
  return `rgb(${r}, ${g}, ${b})`;
});
```

---

## 6. useMotionValue + useSpring — Imperative Physics

For interactions that need frame-by-frame control (magnetic effects, cursor followers):

```tsx
"use client";

import { useMotionValue, useSpring, motion } from "motion/react";
import { useCallback } from "react";

export function CursorGlow({ color = "#597794" }: { color?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  /* Spring-smooth the raw mouse positions
     stiffness: 150 = gentle follow, damping: 15 = fluid trailing */
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  return (
    <div className="relative overflow-hidden" onMouseMove={handleMouseMove}>
      <motion.div
        className="pointer-events-none absolute w-64 h-64 rounded-full blur-3xl opacity-20"
        style={{
          x: springX,
          y: springY,
          backgroundColor: color,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
    </div>
  );
}
```

---

## 7. SVG Animations — pathLength

```tsx
"use client";

import { motion } from "motion/react";

interface AnimatedCheckProps {
  color?: string;
  size?: number;
  strokeWidth?: number;
}

export function AnimatedCheck({
  color = "#597794",
  size = 24,
  strokeWidth = 2,
}: AnimatedCheckProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      initial="hidden"
      animate="visible"
    >
      {/* Circle draws first */}
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth={strokeWidth}
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: { duration: 0.4, ease: "easeOut" },
          },
        }}
      />
      {/* Checkmark draws second, with delay */}
      <motion.path
        d="M8 12l3 3 5-6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: { duration: 0.3, delay: 0.35, ease: "easeOut" },
          },
        }}
      />
    </motion.svg>
  );
}
```

---

## 8. whileInView — Intersection-Based Triggers

```tsx
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{
    once: true,       // Only animate on first intersection
    amount: 0.3,      // Trigger when 30% visible
    margin: "-100px",  // Shrink detection zone by 100px
  }}
  transition={{
    duration: 0.5,
    ease: [0.16, 1, 0.3, 1],
  }}
>
  Content reveals on scroll
</motion.div>
```

---

## 9. Reduced Motion — Complete Pattern

```tsx
"use client";

import { useReducedMotion, motion, AnimatePresence } from "motion/react";

interface AnimatedCardProps {
  children: React.ReactNode;
  isVisible: boolean;
}

export function AnimatedCard({ children, isVisible }: AnimatedCardProps) {
  const prefersReduced = useReducedMotion();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.95 }}
          animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.95 }}
          transition={
            prefersReduced
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 300, damping: 25 }
          }
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 10. Performance Engineering

1. **Hardware-accelerated properties** — Motion automatically uses `transform` and `opacity` via WAAPI (Web Animations API) when possible. Avoid animating `width`, `height`, `borderRadius` directly.
2. **useScroll with ScrollTimeline** — In Motion 12.35+, `useScroll` can use the native CSS `ScrollTimeline` API for hardware-accelerated scroll animations. This happens automatically in supported browsers.
3. **layout="position"** — If you only need to animate position (not size), use `layout="position"` to skip the more expensive size interpolation.
4. **layoutDependency** — Pass a value to `layoutDependency` so layout animations only recalculate when that value changes, not on every render.
5. **Avoid re-renders** — `useMotionValue`, `useTransform`, and `useSpring` update without causing React re-renders. Use them instead of `useState` for continuously updating values (mouse position, scroll position).
6. **Exit cleanup** — `AnimatePresence` keeps exiting elements in the DOM. Ensure `key` is unique per element so React can correctly track insertions and removals.

---

## Brand Config Integration

Accept all visual tokens as props. Never import a brand config module — components must be portable:

```tsx
interface MotionConfig {
  // Colors
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;

  // Timing
  springStiffness?: number;
  springDamping?: number;
  duration?: number;

  // Easing (for non-spring animations)
  ease?: number[];  // cubic-bezier as [x1, y1, x2, y2]
}

// Sensible defaults that match OPS design system
const defaults: Required<MotionConfig> = {
  accentColor: "#597794",
  backgroundColor: "#0A0A0A",
  textColor: "#FFFFFF",
  springStiffness: 300,
  springDamping: 25,
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1],
};
```
