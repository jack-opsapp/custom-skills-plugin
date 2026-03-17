"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BarDatum {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Numeric value */
  value: number;
  /** Bar fill color (hex or CSS color) */
  color: string;
}

export interface AnimatedBarChartProps {
  /** Data to display */
  data: BarDatum[];
  /** Chart width in pixels */
  width?: number;
  /** Height per bar in pixels */
  barHeight?: number;
  /** Vertical gap between bars in pixels */
  barGap?: number;
  /** Left padding for labels */
  labelWidth?: number;
  /** Format the value for display (default: toLocaleString) */
  formatValue?: (value: number) => string;
  /** Tooltip render override */
  renderTooltip?: (datum: BarDatum) => React.ReactNode;
  /** Called when a bar is clicked */
  onBarClick?: (datum: BarDatum) => void;
  /** Track color (unfilled portion) */
  trackColor?: string;
  /** Label text color */
  labelColor?: string;
  /** Value text color */
  valueColor?: string;
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

function useIntersectionEntry(threshold = 0.3) {
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
// Animated value — drives bar width and data‑update morphing
// ---------------------------------------------------------------------------

function useAnimatedValue(
  target: number,
  hasEntered: boolean,
  index: number,
  reducedMotion: boolean,
): number {
  const [current, setCurrent] = useState(0);
  const prevTarget = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!hasEntered) {
      setCurrent(0);
      return;
    }

    const from = prevTarget.current;
    const to = target;
    prevTarget.current = to;

    if (reducedMotion) {
      setCurrent(to);
      return;
    }

    // First entry: stagger delay. Subsequent updates: no delay.
    const isEntry = from === 0;
    const delay = isEntry ? index * 50 : 0;
    const duration = isEntry ? 500 : 400;

    let cancelled = false;

    const timeout = setTimeout(() => {
      const start = performance.now();

      function tick(now: number) {
        if (cancelled) return;
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = cubicOut(progress);
        setCurrent(from + (to - from) * eased);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(tick);
        }
      }

      frameRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      cancelAnimationFrame(frameRef.current);
    };
  }, [target, hasEntered, index, reducedMotion]);

  return current;
}

// ---------------------------------------------------------------------------
// Bar component
// ---------------------------------------------------------------------------

interface BarRowProps {
  datum: BarDatum;
  maxValue: number;
  barAreaWidth: number;
  barHeight: number;
  y: number;
  index: number;
  hasEntered: boolean;
  reducedMotion: boolean;
  isHovered: boolean;
  onHover: (datum: BarDatum | null, rect: DOMRect | null) => void;
  onClick?: (datum: BarDatum) => void;
  formatValue: (value: number) => string;
  trackColor: string;
  labelColor: string;
  valueColor: string;
  labelWidth: number;
}

function BarRow({
  datum,
  maxValue,
  barAreaWidth,
  barHeight,
  y,
  index,
  hasEntered,
  reducedMotion,
  isHovered,
  onHover,
  onClick,
  formatValue,
  trackColor,
  labelColor,
  valueColor,
  labelWidth,
}: BarRowProps) {
  const targetWidth = maxValue > 0 ? (datum.value / maxValue) * barAreaWidth : 0;
  const currentWidth = useAnimatedValue(targetWidth, hasEntered, index, reducedMotion);
  const barRef = useRef<SVGRectElement>(null);

  const handlePointerEnter = useCallback(() => {
    if (barRef.current) {
      onHover(datum, barRef.current.getBoundingClientRect());
    }
  }, [datum, onHover]);

  const handlePointerLeave = useCallback(() => {
    onHover(null, null);
  }, [onHover]);

  const handleClick = useCallback(() => {
    onClick?.(datum);
  }, [datum, onClick]);

  const halfHeight = barHeight / 2;

  return (
    <g>
      {/* Category label */}
      <text
        x={labelWidth - 12}
        y={y + halfHeight}
        textAnchor="end"
        dominantBaseline="central"
        fill={labelColor}
        fontSize={12}
        fontWeight={isHovered ? 600 : 400}
        style={{
          transition: "font-weight 150ms ease",
          userSelect: "none",
        }}
      >
        {datum.label}
      </text>

      {/* Track (background) */}
      <rect
        x={labelWidth}
        y={y}
        width={barAreaWidth}
        height={barHeight}
        rx={halfHeight}
        fill={trackColor}
      />

      {/* Animated bar */}
      <rect
        ref={barRef}
        x={labelWidth}
        y={y}
        width={Math.max(0, currentWidth)}
        height={barHeight}
        rx={halfHeight}
        fill={datum.color}
        style={{
          opacity: isHovered ? 1 : 0.85,
          transition: "opacity 150ms ease",
          cursor: onClick ? "pointer" : "default",
        }}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        role="img"
        aria-label={`${datum.label}: ${formatValue(datum.value)}`}
      />

      {/* Value label */}
      <text
        x={labelWidth + currentWidth + 10}
        y={y + halfHeight}
        dominantBaseline="central"
        fill={valueColor}
        fontSize={12}
        fontWeight={500}
        style={{
          opacity: currentWidth > 10 ? 1 : 0,
          transition: "opacity 200ms ease-out",
          userSelect: "none",
        }}
      >
        {formatValue(datum.value)}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

interface TooltipState {
  datum: BarDatum;
  rect: DOMRect;
}

function DefaultTooltip({ datum, formatValue }: { datum: BarDatum; formatValue: (v: number) => string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: datum.color,
          flexShrink: 0,
        }}
      />
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{datum.label}</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{formatValue(datum.value)}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AnimatedBarChart({
  data,
  width = 480,
  barHeight = 28,
  barGap = 10,
  labelWidth = 100,
  formatValue = (v) => v.toLocaleString(),
  renderTooltip,
  onBarClick,
  trackColor = "rgba(255,255,255,0.05)",
  labelColor = "rgba(255,255,255,0.6)",
  valueColor = "rgba(255,255,255,0.5)",
}: AnimatedBarChartProps) {
  const { ref, hasEntered } = useIntersectionEntry(0.3);
  const reducedMotion = useReducedMotion();

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);
  const barAreaWidth = width - labelWidth - 60; // 60px right padding for value labels
  const totalHeight = data.length * (barHeight + barGap) - barGap;

  const handleHover = useCallback((datum: BarDatum | null, rect: DOMRect | null) => {
    if (datum && rect) {
      setTooltip({ datum, rect });
    } else {
      setTooltip(null);
    }
  }, []);

  // Compute tooltip position relative to container
  const tooltipStyle = useMemo<React.CSSProperties>(() => {
    if (!tooltip || !containerRef.current) {
      return { opacity: 0, pointerEvents: "none" };
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = tooltip.rect.right - containerRect.left + 12;
    const y = tooltip.rect.top - containerRect.top + tooltip.rect.height / 2;

    return {
      position: "absolute" as const,
      left: x,
      top: y,
      transform: "translateY(-50%)",
      opacity: 1,
      pointerEvents: "none" as const,
      transition: "opacity 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      zIndex: 10,
    };
  }, [tooltip]);

  // Hidden data table for screen readers
  const srTable = useMemo(
    () => (
      <table
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          borderWidth: 0,
        }}
      >
        <caption>Bar chart data</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.id}>
              <td>{d.label}</td>
              <td>{formatValue(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    [data, formatValue],
  );

  const ariaLabel = useMemo(
    () =>
      `Horizontal bar chart. ${data.length} categories. ` +
      data.map((d) => `${d.label}: ${formatValue(d.value)}`).join(". "),
    [data, formatValue],
  );

  return (
    <div
      ref={(node) => {
        // Merge refs
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      style={{ position: "relative", width }}
      role="img"
      aria-label={ariaLabel}
    >
      {srTable}

      <svg
        width={width}
        height={totalHeight}
        viewBox={`0 0 ${width} ${totalHeight}`}
        style={{ overflow: "visible" }}
      >
        {data.map((datum, index) => (
          <BarRow
            key={datum.id}
            datum={datum}
            maxValue={maxValue}
            barAreaWidth={barAreaWidth}
            barHeight={barHeight}
            y={index * (barHeight + barGap)}
            index={index}
            hasEntered={hasEntered}
            reducedMotion={reducedMotion}
            isHovered={tooltip?.datum.id === datum.id}
            onHover={handleHover}
            onClick={onBarClick}
            formatValue={formatValue}
            trackColor={trackColor}
            labelColor={labelColor}
            valueColor={valueColor}
            labelWidth={labelWidth}
          />
        ))}
      </svg>

      {/* Tooltip */}
      <div
        style={{
          ...tooltipStyle,
          opacity: tooltip ? 1 : 0,
          transition: tooltip
            ? "opacity 150ms cubic-bezier(0.16, 1, 0.3, 1)"
            : "opacity 100ms cubic-bezier(0.4, 0, 1, 1)",
        }}
      >
        {tooltip && (
          <div
            style={{
              background: "rgba(15, 15, 15, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "8px 12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              color: "#fff",
              fontSize: 13,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            {renderTooltip ? (
              renderTooltip(tooltip.datum)
            ) : (
              <DefaultTooltip datum={tooltip.datum} formatValue={formatValue} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
