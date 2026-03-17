"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LiveMetricCardProps {
  /** Current metric value */
  value: number;
  /** Previous value for delta calculation */
  previousValue?: number;
  /** Card title / metric label */
  label: string;
  /** Format the displayed value (default: locale string) */
  formatValue?: (value: number) => string;
  /** Prefix for the value (e.g., "$") */
  prefix?: string;
  /** Suffix for the value (e.g., "%") */
  suffix?: string;
  /** Sparkline data points (at least 2) */
  sparklineData?: number[];
  /** Sparkline color (default: brand accent) */
  sparklineColor?: string;
  /** Card background */
  background?: string;
  /** Card border color */
  borderColor?: string;
  /** Card width */
  width?: number;
  /** Show delta indicator */
  showDelta?: boolean;
  /** Delta format: 'percent' | 'absolute' */
  deltaFormat?: "percent" | "absolute";
  /** Positive delta color */
  positiveColor?: string;
  /** Negative delta color */
  negativeColor?: string;
  /** Neutral delta color */
  neutralColor?: string;
  /** Called on card click */
  onClick?: () => void;
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

// ---------------------------------------------------------------------------
// Count-up hook
// ---------------------------------------------------------------------------

function useCountUp(
  target: number,
  active: boolean,
  reducedMotion: boolean,
  duration = 1000,
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
// Canvas Sparkline
// ---------------------------------------------------------------------------

interface SparklineProps {
  data: number[];
  width: number;
  height: number;
  color: string;
  active: boolean;
  reducedMotion: boolean;
}

function Sparkline({
  data,
  width,
  height,
  color,
  active,
  reducedMotion,
}: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawnRef = useRef(false);
  const frameRef = useRef(0);

  const draw = useCallback(
    (progress: number) => {
      const canvas = canvasRef.current;
      if (!canvas || data.length < 2) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min || 1;
      const padding = 2;

      // How many points to draw based on progress
      const pointsCount = Math.max(
        2,
        Math.floor(data.length * progress),
      );
      const visibleData = data.slice(0, pointsCount);

      const points = visibleData.map((val, i) => ({
        x: (i / (data.length - 1)) * (width - padding * 2) + padding,
        y:
          height -
          padding -
          ((val - min) / range) * (height - padding * 2),
      }));

      // Fill gradient
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.lineTo(points[points.length - 1].x, height);
      ctx.lineTo(points[0].x, height);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, color + "1A"); // ~10% opacity
      gradient.addColorStop(1, color + "00");
      ctx.fillStyle = gradient;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

      // End dot (only when fully drawn)
      if (progress >= 1) {
        const last = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    },
    [data, width, height, color],
  );

  useEffect(() => {
    if (!active) {
      draw(0);
      return;
    }

    if (drawnRef.current) {
      // Data changed after initial draw — redraw fully
      draw(1);
      return;
    }

    if (reducedMotion) {
      draw(1);
      drawnRef.current = true;
      return;
    }

    // Animate draw
    const duration = 700;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = cubicOut(progress);
      draw(eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        drawnRef.current = true;
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [active, reducedMotion, draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width, height }}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Delta Indicator
// ---------------------------------------------------------------------------

interface DeltaIndicatorProps {
  value: number;
  previousValue: number;
  format: "percent" | "absolute";
  positiveColor: string;
  negativeColor: string;
  neutralColor: string;
  visible: boolean;
  reducedMotion: boolean;
}

function DeltaIndicator({
  value,
  previousValue,
  format,
  positiveColor,
  negativeColor,
  neutralColor,
  visible,
  reducedMotion,
}: DeltaIndicatorProps) {
  const delta = value - previousValue;
  const percentChange =
    previousValue !== 0
      ? (delta / Math.abs(previousValue)) * 100
      : 0;

  const direction: "up" | "down" | "neutral" =
    delta > 0 ? "up" : delta < 0 ? "down" : "neutral";

  const color =
    direction === "up"
      ? positiveColor
      : direction === "down"
        ? negativeColor
        : neutralColor;

  const formatted =
    format === "percent"
      ? `${Math.abs(percentChange).toFixed(1)}%`
      : Math.abs(delta).toLocaleString();

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        color,
        fontSize: 12,
        fontWeight: 500,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(4px)",
        transition: reducedMotion
          ? "opacity 150ms ease"
          : "opacity 250ms cubic-bezier(0.16, 1, 0.3, 1), transform 250ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {direction !== "neutral" && (
        <svg
          width={10}
          height={10}
          viewBox="0 0 10 10"
          style={{
            transform: direction === "down" ? "rotate(180deg)" : "none",
          }}
        >
          <path d="M5 1.5L8.5 6H1.5L5 1.5Z" fill="currentColor" />
        </svg>
      )}
      <span>{direction === "neutral" ? "—" : formatted}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Value change flash
// ---------------------------------------------------------------------------

function useValueChangeFlash(value: number): React.CSSProperties {
  const prevRef = useRef(value);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (value !== prevRef.current) {
      prevRef.current = value;
      setFlashing(true);
      const timeout = setTimeout(() => setFlashing(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  return {
    boxShadow: flashing
      ? "inset 0 0 0 1px rgba(89, 119, 148, 0.25)"
      : "inset 0 0 0 1px transparent",
    transition: flashing
      ? "box-shadow 100ms ease-out"
      : "box-shadow 300ms ease-in",
  };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LiveMetricCard({
  value,
  previousValue,
  label,
  formatValue,
  prefix = "",
  suffix = "",
  sparklineData,
  sparklineColor = "#597794",
  background = "rgba(255,255,255,0.03)",
  borderColor = "rgba(255,255,255,0.06)",
  width = 280,
  showDelta = true,
  deltaFormat = "percent",
  positiveColor = "#22C55E",
  negativeColor = "#EF4444",
  neutralColor = "rgba(255,255,255,0.4)",
  onClick,
}: LiveMetricCardProps) {
  const { ref, hasEntered } = useIntersectionEntry(0.5);
  const reducedMotion = useReducedMotion();
  const flashStyle = useValueChangeFlash(value);

  // Animated count-up value
  const animatedValue = useCountUp(
    hasEntered ? value : 0,
    hasEntered,
    reducedMotion,
    1000,
  );

  // Format the display value
  const displayValue = useMemo(() => {
    if (formatValue) return formatValue(animatedValue);

    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
    }).format(animatedValue);

    return `${prefix}${formatted}${suffix}`;
  }, [animatedValue, formatValue, prefix, suffix, value]);

  // Card entry animation
  const cardStyle: React.CSSProperties = {
    width,
    background,
    border: `1px solid ${borderColor}`,
    borderRadius: 12,
    padding: "20px 20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    cursor: onClick ? "pointer" : "default",
    opacity: hasEntered ? 1 : 0,
    transform: hasEntered ? "translateY(0)" : "translateY(12px)",
    transition: reducedMotion
      ? "opacity 200ms ease"
      : "opacity 400ms cubic-bezier(0.16, 1, 0.3, 1), transform 400ms cubic-bezier(0.16, 1, 0.3, 1)",
    ...flashStyle,
  };

  const ariaLabel = useMemo(() => {
    let desc = `${label}: ${prefix}${value.toLocaleString()}${suffix}`;
    if (showDelta && previousValue != null) {
      const delta = value - previousValue;
      const pct =
        previousValue !== 0
          ? ((delta / Math.abs(previousValue)) * 100).toFixed(1)
          : "0";
      desc += `. ${delta >= 0 ? "Up" : "Down"} ${Math.abs(delta).toLocaleString()} (${Math.abs(Number(pct))}%)`;
    }
    return desc;
  }, [label, value, previousValue, prefix, suffix, showDelta]);

  return (
    <div
      ref={ref}
      style={cardStyle}
      role="img"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {/* Header row: label + delta */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          {label}
        </span>

        {showDelta && previousValue != null && (
          <DeltaIndicator
            value={value}
            previousValue={previousValue}
            format={deltaFormat}
            positiveColor={positiveColor}
            negativeColor={negativeColor}
            neutralColor={neutralColor}
            visible={hasEntered}
            reducedMotion={reducedMotion}
          />
        )}
      </div>

      {/* Large metric value */}
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.02em",
        }}
      >
        {displayValue}
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length >= 2 && (
        <div style={{ marginTop: 4 }}>
          <Sparkline
            data={sparklineData}
            width={width - 40} // account for card padding
            height={40}
            color={sparklineColor}
            active={hasEntered}
            reducedMotion={reducedMotion}
          />
        </div>
      )}
    </div>
  );
}
