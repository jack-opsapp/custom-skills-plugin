"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComparisonGaugeProps {
  /** Actual / current value */
  actual: number;
  /** Target / expected value */
  target: number;
  /** Minimum value on the gauge scale */
  min?: number;
  /** Maximum value on the gauge scale */
  max?: number;
  /** Outer dimension in pixels */
  size?: number;
  /** Arc stroke width */
  strokeWidth?: number;
  /** Actual value color */
  actualColor?: string;
  /** Target marker color */
  targetColor?: string;
  /** Track color */
  trackColor?: string;
  /** Color when actual exceeds target */
  overTargetColor?: string;
  /** Color when actual is below target */
  underTargetColor?: string;
  /** Label for the actual value (e.g., "Revenue") */
  actualLabel?: string;
  /** Label for the target value (e.g., "Goal") */
  targetLabel?: string;
  /** Format values for display */
  formatValue?: (value: number) => string;
  /** Gauge arc sweep in degrees (default: 240) */
  arcSweep?: number;
  /** Background color */
  backgroundColor?: string;
}

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

const cubicOut = (t: number) => 1 - Math.pow(1 - t, 3);

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

function useAnimatedValue(
  target: number,
  active: boolean,
  reducedMotion: boolean,
  duration = 800,
): number {
  const [current, setCurrent] = useState(0);
  const prevRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = to;

    if (!active || reducedMotion) {
      setCurrent(to);
      return;
    }

    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = cubicOut(progress);
      setCurrent(from + (to - from) * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, active, reducedMotion, duration]);

  return current;
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`,
  ].join(" ");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ComparisonGauge({
  actual,
  target,
  min = 0,
  max: maxProp,
  size = 220,
  strokeWidth = 14,
  actualColor = "#597794",
  targetColor = "rgba(255,255,255,0.6)",
  trackColor = "rgba(255,255,255,0.06)",
  overTargetColor = "#22C55E",
  underTargetColor = "#F59E0B",
  actualLabel = "Actual",
  targetLabel = "Target",
  formatValue = (v) => v.toLocaleString(),
  arcSweep = 240,
  backgroundColor = "transparent",
}: ComparisonGaugeProps) {
  const { ref, hasEntered } = useIntersectionEntry(0.5);
  const reducedMotion = useReducedMotion();

  // Auto-compute max if not provided
  const max = maxProp ?? Math.max(actual, target) * 1.25;
  const range = max - min || 1;

  // Normalize values to 0–1
  const normalizedActual = Math.max(0, Math.min(1, (actual - min) / range));
  const normalizedTarget = Math.max(0, Math.min(1, (target - min) / range));

  // Animated actual value (0–1)
  const animatedActual = useAnimatedValue(
    hasEntered ? normalizedActual : 0,
    hasEntered,
    reducedMotion,
    800,
  );

  // Animated display number
  const animatedDisplayValue = useAnimatedValue(
    hasEntered ? actual : 0,
    hasEntered,
    reducedMotion,
    1000,
  );

  // Determine comparison color
  const comparisonColor = actual >= target ? overTargetColor : underTargetColor;

  // Geometry
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - strokeWidth) / 2 - 4; // 4px inset for target markers

  // Arc angles
  const startAngle = (360 - arcSweep) / 2 + 90; // Centered at bottom
  const endAngle = startAngle + arcSweep;

  // Track arc (full background)
  const trackPath = describeArc(cx, cy, radius, startAngle, endAngle);

  // Actual value arc
  const actualEndAngle = startAngle + arcSweep * animatedActual;
  const actualPath =
    animatedActual > 0.001
      ? describeArc(cx, cy, radius, startAngle, actualEndAngle)
      : "";

  // Target marker position
  const targetAngle = startAngle + arcSweep * normalizedTarget;
  const targetInner = polarToCartesian(cx, cy, radius - strokeWidth / 2 - 4, targetAngle);
  const targetOuter = polarToCartesian(cx, cy, radius + strokeWidth / 2 + 4, targetAngle);

  // Target marker visibility (fade in after actual arc passes 30% of animation)
  const [targetVisible, setTargetVisible] = useState(false);
  useEffect(() => {
    if (!hasEntered) return;

    if (reducedMotion) {
      setTargetVisible(true);
      return;
    }

    const timeout = setTimeout(() => setTargetVisible(true), 300);
    return () => clearTimeout(timeout);
  }, [hasEntered, reducedMotion]);

  // Delta
  const delta = actual - target;
  const deltaPercent =
    target !== 0 ? ((delta / Math.abs(target)) * 100).toFixed(1) : "0";
  const deltaSign = delta >= 0 ? "+" : "";

  // Scale tick marks
  const ticks = useMemo(() => {
    const count = 5; // Number of ticks including min and max
    const result: { angle: number; value: number; label: string }[] = [];

    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const angle = startAngle + arcSweep * t;
      const value = min + range * t;
      result.push({
        angle,
        value,
        label: formatValue(Math.round(value)),
      });
    }

    return result;
  }, [min, range, startAngle, arcSweep, formatValue]);

  const ariaLabel = `Comparison gauge. ${actualLabel}: ${formatValue(actual)}. ${targetLabel}: ${formatValue(target)}. ${delta >= 0 ? "Over" : "Under"} target by ${formatValue(Math.abs(delta))} (${Math.abs(Number(deltaPercent))}%).`;

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
        background: backgroundColor,
      }}
      role="img"
      aria-label={ariaLabel}
    >
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        {/* Scale tick marks */}
        {ticks.map((tick, i) => {
          const inner = polarToCartesian(cx, cy, radius + strokeWidth / 2 + 8, tick.angle);
          const outer = polarToCartesian(cx, cy, radius + strokeWidth / 2 + 14, tick.angle);
          const labelPos = polarToCartesian(cx, cy, radius + strokeWidth / 2 + 24, tick.angle);

          return (
            <g key={i}>
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="rgba(255,255,255,0.25)"
                fontSize={8}
              >
                {tick.label}
              </text>
            </g>
          );
        })}

        {/* Background track */}
        <path
          d={trackPath}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Actual value arc */}
        {actualPath && (
          <path
            d={actualPath}
            fill="none"
            stroke={actualColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ transition: "stroke 300ms ease" }}
          />
        )}

        {/* Target marker line */}
        <line
          x1={targetInner.x}
          y1={targetInner.y}
          x2={targetOuter.x}
          y2={targetOuter.y}
          stroke={targetColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{
            opacity: targetVisible ? 1 : 0,
            transition: reducedMotion
              ? "opacity 150ms ease"
              : "opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />

        {/* Target dot */}
        {targetVisible && (
          <circle
            cx={polarToCartesian(cx, cy, radius, targetAngle).x}
            cy={polarToCartesian(cx, cy, radius, targetAngle).y}
            r={3}
            fill={targetColor}
            style={{
              opacity: targetVisible ? 1 : 0,
              transition: "opacity 200ms ease",
            }}
          />
        )}
      </svg>

      {/* Center content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          // Shift up slightly since arc is bottom-heavy
          paddingBottom: size * 0.08,
        }}
      >
        {/* Actual value */}
        <span
          style={{
            fontSize: Math.round(size * 0.18),
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
          }}
        >
          {formatValue(Math.round(animatedDisplayValue))}
        </span>

        {/* Actual label */}
        <span
          style={{
            fontSize: Math.round(size * 0.05),
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 500,
            marginTop: 4,
          }}
        >
          {actualLabel}
        </span>

        {/* Delta badge */}
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: Math.round(size * 0.055),
            fontWeight: 600,
            color: comparisonColor,
            opacity: targetVisible ? 1 : 0,
            transform: targetVisible ? "translateY(0)" : "translateY(4px)",
            transition: reducedMotion
              ? "opacity 150ms ease"
              : "opacity 300ms cubic-bezier(0.16, 1, 0.3, 1), transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Direction arrow */}
          <svg
            width={10}
            height={10}
            viewBox="0 0 10 10"
            style={{
              transform: delta < 0 ? "rotate(180deg)" : "none",
            }}
          >
            <path d="M5 1.5L8.5 6H1.5L5 1.5Z" fill="currentColor" />
          </svg>
          <span>
            {deltaSign}
            {deltaPercent}% vs {targetLabel.toLowerCase()}
          </span>
        </div>

        {/* Target value label */}
        <span
          style={{
            fontSize: Math.round(size * 0.045),
            color: "rgba(255,255,255,0.3)",
            marginTop: 4,
            opacity: targetVisible ? 1 : 0,
            transition: "opacity 200ms ease",
          }}
        >
          {targetLabel}: {formatValue(target)}
        </span>
      </div>
    </div>
  );
}
