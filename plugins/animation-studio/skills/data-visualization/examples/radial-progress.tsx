"use client";

import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RadialProgressProps {
  /** Value 0–100 */
  value: number;
  /** Outer dimension in pixels (width = height) */
  size?: number;
  /** Ring stroke width */
  strokeWidth?: number;
  /** Ring fill color */
  color?: string;
  /** Unfilled track color */
  trackColor?: string;
  /** Show the numeric value in the center */
  showValue?: boolean;
  /** Label below the center value */
  label?: string;
  /** Value suffix (default: "%") */
  suffix?: string;
  /** Value prefix */
  prefix?: string;
  /** Center value font size multiplier relative to size (default: 0.22) */
  valueFontScale?: number;
  /** Label font size multiplier relative to size (default: 0.1) */
  labelFontScale?: number;
  /** Center value color */
  valueColor?: string;
  /** Label color */
  labelColor?: string;
  /** Spring stiffness (default: 60) */
  stiffness?: number;
  /** Spring damping (default: 15) */
  damping?: number;
  /** Color thresholds — ring changes color based on value range */
  thresholds?: { min: number; max: number; color: string }[];
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return reduced;
}

function useIntersectionEntry(threshold = 0.5) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasEntered) {
          setHasEntered(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasEntered, threshold]);

  return { ref, hasEntered };
}

/**
 * Spring-physics value interpolation.
 * Returns a smoothly-springing value that chases the target.
 */
function useSpringValue(
  target: number,
  active: boolean,
  config: { stiffness: number; damping: number },
): number {
  const [current, setCurrent] = useState(target);
  const velocityRef = useRef(0);
  const currentRef = useRef(target);
  const targetRef = useRef(target);
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    targetRef.current = target;

    if (!active) {
      // Jump immediately when not active (reduced motion, or not entered)
      currentRef.current = target;
      velocityRef.current = 0;
      setCurrent(target);
      return;
    }

    const { stiffness, damping } = config;

    function step(now: number) {
      if (lastTimeRef.current === 0) lastTimeRef.current = now;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.064);
      lastTimeRef.current = now;

      const displacement = currentRef.current - targetRef.current;
      const springForce = -stiffness * displacement;
      const dampingForce = -damping * velocityRef.current;
      const acceleration = springForce + dampingForce;

      velocityRef.current += acceleration * dt;
      currentRef.current += velocityRef.current * dt;

      setCurrent(currentRef.current);

      if (
        Math.abs(velocityRef.current) < 0.01 &&
        Math.abs(displacement) < 0.01
      ) {
        currentRef.current = targetRef.current;
        velocityRef.current = 0;
        setCurrent(targetRef.current);
        lastTimeRef.current = 0;
        return;
      }

      frameRef.current = requestAnimationFrame(step);
    }

    lastTimeRef.current = 0;
    frameRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frameRef.current);
      lastTimeRef.current = 0;
    };
  }, [target, active, config.stiffness, config.damping]);

  return current;
}

/**
 * Count-up number display.
 * Returns a formatted string that ticks from previous value to target.
 */
function useCountUp(
  target: number,
  active: boolean,
  reducedMotion: boolean,
  options: {
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
  } = {},
): string {
  const { duration = 800, decimals = 0, prefix = "", suffix = "" } = options;
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = to;

    if (!active || reducedMotion) {
      setDisplay(to);
      return;
    }

    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubicOut
      setDisplay(from + (to - from) * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, active, reducedMotion, duration]);

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(display);

  return `${prefix}${formatted}${suffix}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RadialProgress({
  value,
  size = 120,
  strokeWidth = 8,
  color: colorProp = "#597794",
  trackColor = "rgba(255,255,255,0.08)",
  showValue = true,
  label,
  suffix = "%",
  prefix = "",
  valueFontScale = 0.22,
  labelFontScale = 0.1,
  valueColor = "#fff",
  labelColor = "rgba(255,255,255,0.45)",
  stiffness = 60,
  damping = 15,
  thresholds,
  ariaLabel,
}: RadialProgressProps) {
  const { ref, hasEntered } = useIntersectionEntry(0.5);
  const reducedMotion = useReducedMotion();

  const normalizedValue = Math.max(0, Math.min(100, value));

  // Determine color (threshold-based or static)
  const activeColor =
    thresholds != null
      ? (thresholds.find((t) => normalizedValue >= t.min && normalizedValue <= t.max)?.color ??
        colorProp)
      : colorProp;

  // Geometry
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (normalizedValue / 100) * circumference;

  // Initial state: full offset (ring empty). Spring chases the target offset.
  const initialOffset = circumference;
  const springTarget = hasEntered ? targetOffset : initialOffset;
  const animate = hasEntered && !reducedMotion;

  const currentOffset = useSpringValue(springTarget, animate, {
    stiffness,
    damping,
  });

  // For reduced motion: jump immediately when entered
  const displayOffset = reducedMotion && hasEntered ? targetOffset : currentOffset;

  // Count-up value
  const displayValue = useCountUp(
    hasEntered ? normalizedValue : 0,
    hasEntered,
    reducedMotion,
    { duration: 800, decimals: 0, prefix, suffix },
  );

  const computedAriaLabel =
    ariaLabel ?? `Progress: ${normalizedValue}%${label ? `, ${label}` : ""}`;

  return (
    <div
      ref={ref}
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      role="img"
      aria-label={computedAriaLabel}
    >
      <svg
        width={size}
        height={size}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated fill ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={activeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={displayOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke 300ms ease" }}
        />
      </svg>

      {/* Center content */}
      {showValue && (
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          <span
            style={{
              fontSize: Math.round(size * valueFontScale),
              fontWeight: 700,
              color: valueColor,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
            }}
          >
            {displayValue}
          </span>
          {label && (
            <span
              style={{
                fontSize: Math.round(size * labelFontScale),
                color: labelColor,
                marginTop: 2,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 500,
              }}
            >
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
