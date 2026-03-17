"use client";

import { useRef, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";

// ---------------------------------------------------------------------------
// MagneticButton
// ---------------------------------------------------------------------------
// A button that magnetically follows the cursor when the pointer enters a
// proximity radius. On leave the button springs back to center.
//
// Physics rationale:
//   - stiffness 150 = moderate pull — fast enough to track the cursor but soft
//     enough to feel elastic rather than rigidly attached.
//   - damping 12 = low damping lets the return-to-center overshoot slightly,
//     giving the "snap-back" feel. A critically-damped spring (damping ~2√k ≈ 24)
//     would kill the overshoot; we intentionally underdamp.
//   - The displacement is scaled by `strength` (0-1). 0.35 default means the
//     button moves 35 % of the cursor's offset from center — enough to be
//     noticeable without breaking layout.
// ---------------------------------------------------------------------------

interface MagneticButtonProps {
  children: React.ReactNode;
  /** How far the button follows the cursor, 0-1. Default 0.35. */
  strength?: number;
  /** Spring stiffness. Higher = snappier tracking. */
  stiffness?: number;
  /** Spring damping. Lower = more overshoot on release. */
  damping?: number;
  /** Accent color for the hover glow ring. */
  accentColor?: string;
  /** Additional CSS classes applied to the outer wrapper. */
  className?: string;
  /** Click handler. */
  onClick?: () => void;
}

export function MagneticButton({
  children,
  strength = 0.35,
  stiffness = 150,
  damping = 12,
  accentColor = "#597794",
  className = "",
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const prefersReduced = useReducedMotion();

  // Raw motion values — updated every pointer-move without triggering re-renders.
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring-smoothed outputs wired directly to the motion component's `style`.
  const springX = useSpring(x, { stiffness, damping });
  const springY = useSpring(y, { stiffness, damping });

  // Subtle scale bump while hovering.
  const scale = useMotionValue(1);
  const springScale = useSpring(scale, { stiffness: 300, damping: 20 });

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (prefersReduced) return;
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;

      // Offset from the element's center, in CSS pixels.
      const offsetX = e.clientX - (rect.left + rect.width / 2);
      const offsetY = e.clientY - (rect.top + rect.height / 2);

      // Apply strength factor so the button doesn't fully follow the cursor.
      x.set(offsetX * strength);
      y.set(offsetY * strength);
    },
    [prefersReduced, strength, x, y],
  );

  const handlePointerEnter = useCallback(() => {
    if (prefersReduced) return;
    scale.set(1.05);
  }, [prefersReduced, scale]);

  const handlePointerLeave = useCallback(() => {
    // Snap back to center — the spring handles the animation.
    x.set(0);
    y.set(0);
    scale.set(1);
  }, [x, y, scale]);

  return (
    <motion.button
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      style={{
        x: prefersReduced ? 0 : springX,
        y: prefersReduced ? 0 : springY,
        scale: prefersReduced ? 1 : springScale,
      }}
      // Tap animation: quick scale-down for tactile feedback.
      whileTap={prefersReduced ? undefined : { scale: 0.97 }}
      className={`
        relative inline-flex items-center justify-center
        px-6 py-3 rounded-lg font-medium text-sm
        text-white cursor-pointer select-none
        transition-shadow duration-200
        focus-visible:outline-2 focus-visible:outline-offset-2
        ${className}
      `}
      /*
       * Inline styles for brand-token-driven visuals.
       * Colors come from props — never imported from a config module.
       */
      aria-label={typeof children === "string" ? children : undefined}
    >
      {/* Background layer */}
      <span
        className="absolute inset-0 rounded-lg"
        style={{ backgroundColor: accentColor }}
      />

      {/* Hover glow — expands behind the button on pointer proximity */}
      <motion.span
        className="absolute -inset-1 rounded-xl opacity-0 blur-md pointer-events-none"
        style={{ backgroundColor: accentColor }}
        // The glow fades in/out with the spring scale value.
        animate={{
          opacity: prefersReduced ? 0 : undefined,
        }}
        whileHover={prefersReduced ? undefined : { opacity: 0.25 }}
        transition={{ duration: 0.25 }}
      />

      {/* Content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
