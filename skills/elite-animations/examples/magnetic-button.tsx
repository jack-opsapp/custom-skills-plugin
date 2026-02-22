/**
 * Magnetic Button Component
 * Button that subtly follows the cursor with spring physics.
 *
 * Dependencies: framer-motion (already installed in OPS)
 * Usage: <MagneticButton>Click Me</MagneticButton>
 */
"use client"

import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
  strength?: number
  onClick?: () => void
}

export default function MagneticButton({
  children,
  className = '',
  strength = 40,
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = { stiffness: 350, damping: 20, mass: 0.5 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const distX = e.clientX - centerX
    const distY = e.clientY - centerY

    x.set(distX * (strength / rect.width))
    y.set(distY * (strength / rect.height))
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      className={`
        relative px-8 py-3
        bg-[#597794] hover:bg-[#6B8BA8]
        text-[#F5F5F5] font-mohave font-semibold text-sm tracking-wider uppercase
        rounded-[5px]
        transition-colors duration-200
        ${className}
      `}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.button>
  )
}
