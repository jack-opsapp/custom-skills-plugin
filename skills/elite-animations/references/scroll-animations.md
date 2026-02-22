# Scroll-Driven Animations

Complete guide for building premium scroll animations in Next.js using GSAP ScrollTrigger and Framer Motion.

## GSAP ScrollTrigger in Next.js

### Installation

```bash
npm install gsap @gsap/react
```

### Core Setup Pattern

Every GSAP component in Next.js must:
1. Be a client component (`"use client"`)
2. Use the `useGSAP` hook (NOT `useEffect`)
3. Register plugins before use

```tsx
"use client"
import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

export default function ScrollSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // GSAP code here - automatically cleaned up
    gsap.from('.reveal-item', {
      y: 60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse',
      },
    })
  }, { scope: containerRef }) // Scope selector queries to this container

  return (
    <div ref={containerRef}>
      <div className="reveal-item">Item 1</div>
      <div className="reveal-item">Item 2</div>
      <div className="reveal-item">Item 3</div>
    </div>
  )
}
```

### ScrollTrigger Key Properties

```tsx
scrollTrigger: {
  trigger: '.section',           // Element that triggers the animation
  start: 'top 80%',             // When trigger top hits 80% of viewport
  end: 'bottom 20%',            // When trigger bottom hits 20% of viewport
  scrub: true,                   // Link animation progress to scroll position
  scrub: 1,                      // Scrub with 1s smoothing
  pin: true,                     // Pin the trigger element while animation plays
  pinSpacing: true,              // Add spacing for pinned element
  snap: 'labels',                // Snap to timeline labels
  snap: { snapTo: 0.25 },       // Snap to quarter increments
  toggleActions: 'play pause resume reverse',
  // Format: onEnter onLeave onEnterBack onLeaveBack
  // Values: play, pause, resume, reverse, restart, reset, complete, none
  markers: true,                 // Debug - shows trigger points (remove in prod)
  onEnter: () => {},
  onLeave: () => {},
  onEnterBack: () => {},
  onLeaveBack: () => {},
}
```

### Timeline with ScrollTrigger (Pinned Section)

Pins a section and plays a sequence of animations as user scrolls through:

```tsx
useGSAP(() => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.pinned-section',
      pin: true,
      start: 'top top',
      end: '+=2000',      // Scroll distance to complete animation
      scrub: 1,
      snap: {
        snapTo: 'labels',
        duration: { min: 0.2, max: 0.8 },
        ease: 'power1.inOut',
      },
    },
  })

  tl.addLabel('start')
    .from('.headline', { opacity: 0, y: 40 })
    .addLabel('headline-visible')
    .from('.cards', { opacity: 0, y: 60, stagger: 0.2 })
    .addLabel('cards-visible')
    .to('.section-bg', { backgroundColor: '#0A0A0A' })
    .addLabel('end')
}, { scope: containerRef })
```

### Horizontal Scroll Section

```tsx
useGSAP(() => {
  const sections = gsap.utils.toArray<HTMLElement>('.horizontal-panel')

  gsap.to(sections, {
    xPercent: -100 * (sections.length - 1),
    ease: 'none',
    scrollTrigger: {
      trigger: '.horizontal-container',
      pin: true,
      scrub: 1,
      snap: 1 / (sections.length - 1),
      end: () => '+=' + document.querySelector('.horizontal-container')!.scrollWidth,
    },
  })
}, { scope: containerRef })
```

### Parallax Layers

```tsx
useGSAP(() => {
  gsap.to('.parallax-bg', {
    y: -200,
    ease: 'none',
    scrollTrigger: {
      trigger: '.parallax-section',
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  })

  gsap.to('.parallax-fg', {
    y: -400,
    ease: 'none',
    scrollTrigger: {
      trigger: '.parallax-section',
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  })
}, { scope: containerRef })
```

## Framer Motion Scroll Animations

Already installed in OPS project. Use for simpler scroll reveals.

### Basic Viewport Reveal

```tsx
"use client"
import { motion } from 'framer-motion'

function RevealOnScroll({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
```

### Scroll-Linked Parallax with useScroll

```tsx
"use client"
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

function ParallaxSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'], // Track from entering to leaving viewport
  })

  const y = useTransform(scrollYProgress, [0, 1], [100, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8])

  return (
    <div ref={ref} className="relative h-screen">
      <motion.div style={{ y, opacity, scale }}>
        {/* Content */}
      </motion.div>
    </div>
  )
}
```

### Stagger Children on Scroll

```tsx
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

function StaggeredList() {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
    >
      {items.map((item) => (
        <motion.li key={item.id} variants={itemVariants}>
          {item.content}
        </motion.li>
      ))}
    </motion.ul>
  )
}
```

### Progress Bar Tied to Scroll

```tsx
function ScrollProgress() {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-ops-accent z-50 origin-left"
      style={{ scaleX: scrollYProgress }}
    />
  )
}
```

## CSS Scroll-Driven Animations API

Native CSS approach (Chrome 115+, Edge 115+). Use as progressive enhancement with GSAP fallback.

```css
@supports (animation-timeline: scroll()) {
  .parallax-element {
    animation: parallax linear both;
    animation-timeline: scroll();
    animation-range: entry 0% exit 100%;
  }

  @keyframes parallax {
    from { transform: translateY(100px); }
    to { transform: translateY(-100px); }
  }
}
```

## When to Use Which

| Scenario | Use |
|----------|-----|
| Simple fade/slide on scroll | Framer Motion `whileInView` |
| Parallax sections | Framer Motion `useScroll` + `useTransform` |
| Pinned scrolling sequences | GSAP ScrollTrigger with `pin: true` |
| Horizontal scroll galleries | GSAP ScrollTrigger |
| Scrub-linked animations | GSAP with `scrub: true` |
| Scroll progress indicators | Framer Motion `useScroll` |
| Complex multi-step timelines | GSAP `gsap.timeline()` + ScrollTrigger |
| Page transitions | Framer Motion `AnimatePresence` |
