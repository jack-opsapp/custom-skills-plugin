# Micro-Interactions

Premium hover effects, magnetic cursors, morphing shapes, text reveals, and stagger animations.

## Magnetic Button / Cursor Effect

The button subtly follows the cursor when hovering near it, creating a "magnetic pull" feel.

```tsx
"use client"
import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

interface MagneticProps {
  children: React.ReactNode
  strength?: number    // Pixels of magnetic pull (default 30)
  className?: string
}

export function MagneticButton({ children, strength = 30, className }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Spring smoothing for natural feel
  const springX = useSpring(x, { stiffness: 300, damping: 20 })
  const springY = useSpring(y, { stiffness: 300, damping: 20 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Offset from center, scaled by strength
    x.set((e.clientX - centerX) * (strength / rect.width))
    y.set((e.clientY - centerY) * (strength / rect.height))
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  )
}
```

## Text Character-by-Character Reveal

Split text into characters and stagger their appearance:

```tsx
"use client"
import { motion } from 'framer-motion'

interface TextRevealProps {
  text: string
  className?: string
  delay?: number
}

export function TextReveal({ text, className, delay = 0 }: TextRevealProps) {
  const words = text.split(' ')

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.03,
        delayChildren: delay,
      },
    },
  }

  const charVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <motion.span
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block mr-[0.25em]">
          {word.split('').map((char, charIndex) => (
            <motion.span
              key={`${wordIndex}-${charIndex}`}
              className="inline-block"
              variants={charVariants}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.span>
  )
}
```

## Gradient Border Animation

A border that animates with a rotating gradient, creating a glowing edge effect:

```tsx
export function GradientBorder({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative p-[1px] rounded-ops-lg overflow-hidden ${className}`}>
      {/* Animated gradient border */}
      <div
        className="absolute inset-0 animate-[spin_4s_linear_infinite]"
        style={{
          background: 'conic-gradient(from 0deg, #597794, #A5B368, #C4A868, #597794)',
          filter: 'blur(4px)',
        }}
      />
      {/* Content */}
      <div className="relative bg-ops-card rounded-ops-lg">
        {children}
      </div>
    </div>
  )
}
```

## Morphing Icon / Shape

Smoothly transition between SVG paths using Framer Motion:

```tsx
"use client"
import { motion } from 'framer-motion'

const paths = {
  menu: 'M3 12h18M3 6h18M3 18h18',
  close: 'M18 6L6 18M6 6l12 12',
}

function MorphIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <motion.path
        d={isOpen ? paths.close : paths.menu}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={false}
        animate={{ d: isOpen ? paths.close : paths.menu }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  )
}
```

For complex SVG morphing (different path segment counts), use GSAP `MorphSVGPlugin` or `flubber` library.

## Card Hover Lift with Glow

Cards that lift and glow on hover:

```tsx
export function HoverCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={`relative bg-ops-card border border-ops-border rounded-ops-lg p-6 ${className}`}
      whileHover={{
        y: -8,
        boxShadow: '0 20px 60px rgba(89, 119, 148, 0.15)',
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
      }}
    >
      {children}
    </motion.div>
  )
}

// Alternative using CSS for better performance:
// .hover-card {
//   transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
//               box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1);
// }
// .hover-card:hover {
//   transform: translateY(-8px);
//   box-shadow: 0 20px 60px rgba(89, 119, 148, 0.15);
// }
```

## Typewriter / Terminal Effect

Text that types out character by character with a blinking cursor:

```tsx
"use client"
import { useState, useEffect } from 'react'

interface TypewriterProps {
  text: string
  speed?: number       // ms per character
  delay?: number       // ms before starting
  className?: string
}

export function Typewriter({ text, speed = 40, delay = 0, className }: TypewriterProps) {
  const [displayed, setDisplayed] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    let index = 0
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayed(text.slice(0, index + 1))
          index++
        } else {
          clearInterval(interval)
        }
      }, speed)
      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(timeout)
  }, [text, speed, delay])

  return (
    <span className={className}>
      {displayed}
      <span className="animate-cursor-blink text-ops-accent">|</span>
    </span>
  )
}
```

## Stagger Grid Reveal

Cards in a grid that appear one by one with staggered delay:

```tsx
const gridVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const cardVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

function StaggerGrid({ items }: { items: any[] }) {
  return (
    <motion.div
      className="grid grid-cols-3 gap-4"
      variants={gridVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
    >
      {items.map((item) => (
        <motion.div
          key={item.id}
          className="bg-ops-card border border-ops-border rounded-ops p-4"
          variants={cardVariants}
        >
          {item.content}
        </motion.div>
      ))}
    </motion.div>
  )
}
```

## Number Counter Animation

Animated counting number that counts up when scrolled into view:

```tsx
"use client"
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'

function AnimatedCounter({ target, duration = 2 }: { target: number; duration?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { duration: duration * 1000 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (isInView) {
      motionValue.set(target)
    }
  }, [isInView, target, motionValue])

  useEffect(() => {
    const unsubscribe = springValue.on('change', (v) => {
      setDisplay(Math.round(v))
    })
    return unsubscribe
  }, [springValue])

  return <span ref={ref}>{display.toLocaleString()}</span>
}
```

## Line Drawing Animation

SVG paths that draw themselves on scroll:

```tsx
function LineDrawing() {
  const { scrollYProgress } = useScroll()
  const pathLength = useTransform(scrollYProgress, [0, 0.5], [0, 1])

  return (
    <svg viewBox="0 0 400 400" className="w-full">
      <motion.path
        d="M 50,50 L 350,50 L 350,350 L 50,350 Z"
        fill="none"
        stroke="#597794"
        strokeWidth="2"
        style={{ pathLength }}
      />
    </svg>
  )
}
```

## OPS Easing Constants

Consistent easing across all animations:

```tsx
export const EASE = {
  smooth: [0.22, 1, 0.36, 1] as const,        // Main ease-out
  bounce: [0.34, 1.56, 0.64, 1] as const,      // Slight overshoot
  sharp: [0.4, 0, 0.2, 1] as const,            // Material Design standard
  spring: { type: 'spring', stiffness: 400, damping: 25 } as const,
}
```
