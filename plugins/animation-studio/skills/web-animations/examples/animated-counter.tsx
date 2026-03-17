"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  useMotionValue,
  useSpring,
  useReducedMotion,
  motion,
} from "motion/react";

// ---------------------------------------------------------------------------
// AnimatedCounter
// ---------------------------------------------------------------------------
// A number count-up component with spring easing. Fires when the element
// enters the viewport (Intersection Observer).
//
// Features:
//   - Locale-aware formatting: thousands separators, currency prefix/suffix.
//   - Configurable spring physics with optional overshoot.
//   - Supports decimal precision.
//   - Reduced motion: instant display, no animation.
//
// Spring physics rationale:
//   - stiffness 80: moderate — lets the count-up take ~0.8-1.2 s depending on
//     distance. Lower values make large numbers count up more slowly.
//   - damping 15: underdamped — the displayed value will slightly overshoot
//     the target then settle back. Set `overshoot: false` to critically damp
//     (damping ~20 for stiffness 80, roughly 2√(stiffness * mass)).
//   - restDelta 0.5: the spring resolves when within 0.5 of the target.
//     Prevents sub-pixel jitter on large numbers (e.g. counting to 1,000,000
//     and oscillating between 999,999.7 and 1,000,000.3).
// ---------------------------------------------------------------------------

interface AnimatedCounterProps {
  /** Target number to count up to. */
  to: number;
  /** Starting number. Default 0. */
  from?: number;
  /** Locale for number formatting (e.g. "en-US", "de-DE"). Default "en-US". */
  locale?: string;
  /** Number of decimal places. Default 0. */
  decimals?: number;
  /** Prefix string (e.g. "$", "€"). */
  prefix?: string;
  /** Suffix string (e.g. "%", " users"). */
  suffix?: string;
  /** Spring stiffness. Higher = faster count-up. */
  stiffness?: number;
  /** Spring damping. Lower = more overshoot past the target. */
  damping?: number;
  /** Allow the spring to overshoot the target value. Default true. */
  overshoot?: boolean;
  /**
   * Duration override in seconds. When set, uses a tween instead of a spring.
   * Spring physics are ignored.
   */
  duration?: number;
  /** Accent color for the number text. */
  color?: string;
  /** CSS class on the wrapper span. */
  className?: string;
  /** Trigger animation on mount even if not in view. Default false. */
  animateOnMount?: boolean;
}

export function AnimatedCounter({
  to,
  from = 0,
  locale = "en-US",
  decimals = 0,
  prefix = "",
  suffix = "",
  stiffness = 80,
  damping = 15,
  overshoot = true,
  duration,
  color,
  className = "",
  animateOnMount = false,
}: AnimatedCounterProps) {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [hasTriggered, setHasTriggered] = useState(animateOnMount);

  // The raw motion value starts at `from`.
  const motionValue = useMotionValue(from);

  // Spring config: if overshoot is disabled, increase damping to critically
  // damp the system. Critical damping ≈ 2 * √(stiffness) for unit mass.
  const effectiveDamping = overshoot ? damping : Math.max(damping, 2 * Math.sqrt(stiffness));

  // If duration is provided, use a tween (not spring). Otherwise spring.
  const springValue = useSpring(motionValue, duration
    ? { duration: duration * 1000, bounce: 0 }
    : { stiffness, damping: effectiveDamping, restDelta: 0.5 }
  );

  // Displayed text — updated every frame by subscribing to the spring value.
  const [display, setDisplay] = useState(() => formatNumber(from, locale, decimals));

  // Subscribe to spring value changes (runs outside React render cycle).
  useEffect(() => {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    const unsubscribe = springValue.on("change", (latest: number) => {
      setDisplay(formatter.format(latest));
    });

    return unsubscribe;
  }, [springValue, locale, decimals]);

  // Intersection Observer — trigger the count-up when the element enters view.
  useEffect(() => {
    if (animateOnMount || hasTriggered) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasTriggered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animateOnMount, hasTriggered]);

  // When triggered (or when `to` changes), animate the motion value.
  useEffect(() => {
    if (!hasTriggered) return;

    if (prefersReduced) {
      // Instant — no animation.
      motionValue.set(to);
      return;
    }

    // Set the target. The spring (or tween) interpolates automatically.
    motionValue.set(to);
  }, [hasTriggered, to, motionValue, prefersReduced]);

  return (
    <motion.span
      ref={ref}
      className={`tabular-nums ${className}`}
      style={color ? { color } : undefined}
      // Subtle scale pop when the counter first triggers.
      initial={false}
      animate={
        hasTriggered && !prefersReduced
          ? { scale: [1, 1.04, 1], transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
          : undefined
      }
    >
      {prefix}
      {display}
      {suffix}
    </motion.span>
  );
}

// ---- Utility ----

function formatNumber(value: number, locale: string, decimals: number): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
