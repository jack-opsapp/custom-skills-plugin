# Animated Metrics — Detailed Reference

A metric is not a number. A metric is a story compressed into a single data point. The animation's job is to decompress that story — to show the user not just "47%" but the journey to 47%, the direction of 47%, and the meaning of 47%. This reference covers every metric display pattern.

---

## Count-Up Numbers

The most fundamental metric animation. A number ticks from its previous value (or zero on first render) to its current value, giving the user a sense of magnitude and change.

### Core Implementation

```typescript
import { useEffect, useRef, useState, useCallback } from 'react';

interface CountUpOptions {
  /** Starting value (default: 0) */
  from?: number;
  /** Target value */
  to: number;
  /** Duration in ms (default: 1000) */
  duration?: number;
  /** Decimal places (default: 0) */
  decimals?: number;
  /** Locale for formatting (default: 'en-US') */
  locale?: string;
  /** Prefix (e.g., '$') */
  prefix?: string;
  /** Suffix (e.g., '%') */
  suffix?: string;
  /** Whether to use compact notation for large numbers (1.2K, 3.4M) */
  compact?: boolean;
  /** Custom easing function */
  easing?: (t: number) => number;
  /** Whether animation is enabled (set false for reduced motion) */
  animate?: boolean;
}

function useCountUp({
  from = 0,
  to,
  duration = 1000,
  decimals = 0,
  locale = 'en-US',
  prefix = '',
  suffix = '',
  compact = false,
  easing = cubicOut,
  animate = true,
}: CountUpOptions): string {
  const [displayValue, setDisplayValue] = useState(from);
  const prevToRef = useRef(from);
  const frameRef = useRef<number>(0);

  const format = useCallback(
    (value: number): string => {
      let formatted: string;

      if (compact && Math.abs(value) >= 1000) {
        formatted = new Intl.NumberFormat(locale, {
          notation: 'compact',
          maximumFractionDigits: 1,
        }).format(value);
      } else {
        formatted = new Intl.NumberFormat(locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value);
      }

      return `${prefix}${formatted}${suffix}`;
    },
    [locale, decimals, prefix, suffix, compact]
  );

  useEffect(() => {
    const fromVal = prevToRef.current;
    prevToRef.current = to;

    if (!animate) {
      setDisplayValue(to);
      return;
    }

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      const current = fromVal + (to - fromVal) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [to, duration, easing, animate]);

  return format(displayValue);
}

// Easing
const cubicOut = (t: number) => 1 - Math.pow(1 - t, 3);
```

### Usage Patterns

**Currency:**
```typescript
const revenue = useCountUp({ to: 142850, prefix: '$', compact: true, duration: 1200 });
// Animates: $0 → $142.9K
```

**Percentage:**
```typescript
const completion = useCountUp({ to: 73.5, suffix: '%', decimals: 1, duration: 800 });
// Animates: 0% → 73.5%
```

**Integer with comma formatting:**
```typescript
const users = useCountUp({ to: 8472, duration: 1000 });
// Animates: 0 → 8,472
```

**Value update (not from zero):**
```typescript
// When `to` changes, it automatically animates FROM the previous value
const [revenue, setRevenue] = useState(142850);
const display = useCountUp({ to: revenue, prefix: '$', compact: true });
// If revenue changes from 142850 to 156200, animates: $142.9K → $156.2K
```

### Timing and Easing

- **First appearance (from zero):** 800-1200ms with `cubicOut`. Longer durations for larger numbers give a sense of magnitude.
- **Value update (between non-zero values):** 400-600ms with `cubicInOut`. Faster because the user already has context.
- **Rapid updates (live data):** 200-300ms with `linear`. When values update every 1-2 seconds, the animation should barely be perceptible — a smooth interpolation, not a visible animation.

### Reduced Motion

When `prefers-reduced-motion: reduce`, skip the count animation entirely. Show the final formatted value immediately. The number still appears — only the counting motion is removed.

---

## Radial Progress Rings

A circle that fills to represent a percentage. More visually engaging than a linear progress bar, and the center provides space for the value.

### Core Implementation (SVG)

```typescript
interface RadialProgressProps {
  /** 0-100 */
  value: number;
  /** Pixel size (width = height) */
  size?: number;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Ring color */
  color?: string;
  /** Track color (unfilled portion) */
  trackColor?: string;
  /** Whether to show the center value */
  showValue?: boolean;
  /** Label below the value */
  label?: string;
  /** Spring stiffness (default: 60) */
  stiffness?: number;
  /** Spring damping (default: 15) */
  damping?: number;
}

function RadialProgress({
  value,
  size = 120,
  strokeWidth = 8,
  color = '#597794',
  trackColor = 'rgba(255,255,255,0.08)',
  showValue = true,
  label,
  stiffness = 60,
  damping = 15,
}: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = Math.max(0, Math.min(100, value));
  const targetOffset = circumference - (normalizedValue / 100) * circumference;

  // Spring physics for the dashoffset
  const currentOffset = useSpringValue(targetOffset, { stiffness, damping });

  // Count-up for center number
  const displayValue = useCountUp({
    to: normalizedValue,
    duration: 800,
    decimals: 0,
    suffix: '%',
  });

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size}>
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
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={currentOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke 300ms ease' }}
        />
      </svg>
      {showValue && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: size * 0.22, fontWeight: 700 }}>
            {displayValue}
          </span>
          {label && (
            <span style={{ fontSize: size * 0.1, opacity: 0.5, marginTop: 2 }}>
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
```

### Spring Physics for Ring Fill

The ring fill uses spring physics rather than timed easing. This produces a natural deceleration that feels physical — the ring "arrives" at its value rather than "stopping" at it.

```typescript
// Standalone spring value hook (no Framer Motion dependency)
function useSpringValue(
  target: number,
  config: { stiffness: number; damping: number; mass?: number } = {
    stiffness: 60,
    damping: 15,
    mass: 1,
  }
): number {
  const [current, setCurrent] = useState(target);
  const velocityRef = useRef(0);
  const currentRef = useRef(target);
  const targetRef = useRef(target);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    targetRef.current = target;

    const { stiffness, damping, mass = 1 } = config;

    let lastTime = performance.now();

    function step(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.064); // Cap delta to prevent spiral
      lastTime = now;

      const displacement = currentRef.current - targetRef.current;
      const springForce = -stiffness * displacement;
      const dampingForce = -damping * velocityRef.current;
      const acceleration = (springForce + dampingForce) / mass;

      velocityRef.current += acceleration * dt;
      currentRef.current += velocityRef.current * dt;

      setCurrent(currentRef.current);

      // Stop when velocity and displacement are negligible
      if (
        Math.abs(velocityRef.current) < 0.01 &&
        Math.abs(displacement) < 0.01
      ) {
        currentRef.current = targetRef.current;
        setCurrent(targetRef.current);
        velocityRef.current = 0;
        return;
      }

      frameRef.current = requestAnimationFrame(step);
    }

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, config.stiffness, config.damping, config.mass]);

  return current;
}
```

### Color Thresholds

Rings can change color based on value ranges. The color transitions smoothly (300ms CSS transition on `stroke`) as the value crosses thresholds.

```typescript
function getThresholdColor(
  value: number,
  thresholds: { min: number; max: number; color: string }[]
): string {
  for (const t of thresholds) {
    if (value >= t.min && value <= t.max) return t.color;
  }
  return thresholds[thresholds.length - 1].color;
}

// Usage
const color = getThresholdColor(value, [
  { min: 0, max: 33, color: '#EF4444' },   // danger
  { min: 34, max: 66, color: '#F59E0B' },  // warning
  { min: 67, max: 100, color: '#22C55E' }, // success
]);
```

---

## Trend Indicators

Small directional elements that show whether a metric is trending up, down, or flat. They communicate change at a glance.

### Delta Arrow

```typescript
interface TrendDeltaProps {
  /** Current value */
  value: number;
  /** Previous value for comparison */
  previousValue: number;
  /** Format: 'percent' shows % change, 'absolute' shows raw delta, 'both' */
  format?: 'percent' | 'absolute' | 'both';
  /** Override colors (default: green up, red down) */
  positiveColor?: string;
  negativeColor?: string;
  neutralColor?: string;
}

function TrendDelta({
  value,
  previousValue,
  format = 'percent',
  positiveColor = '#22C55E',
  negativeColor = '#EF4444',
  neutralColor = 'rgba(255,255,255,0.4)',
}: TrendDeltaProps) {
  const delta = value - previousValue;
  const percentChange = previousValue !== 0
    ? ((delta / Math.abs(previousValue)) * 100)
    : 0;

  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';
  const color = direction === 'up'
    ? positiveColor
    : direction === 'down'
    ? negativeColor
    : neutralColor;

  const formattedDelta = (() => {
    const absDelta = Math.abs(delta);
    const absPercent = Math.abs(percentChange);
    switch (format) {
      case 'percent':
        return `${absPercent.toFixed(1)}%`;
      case 'absolute':
        return absDelta.toLocaleString();
      case 'both':
        return `${absDelta.toLocaleString()} (${absPercent.toFixed(1)}%)`;
    }
  })();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        color,
        fontSize: '0.85em',
      }}
    >
      {/* Arrow with directional animation */}
      <svg
        width={12}
        height={12}
        viewBox="0 0 12 12"
        style={{
          transform: direction === 'down' ? 'rotate(180deg)' : 'none',
          opacity: direction === 'neutral' ? 0 : 1,
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease',
        }}
      >
        <path
          d="M6 2L10 7H2L6 2Z"
          fill="currentColor"
        />
      </svg>
      <span>{direction === 'neutral' ? '—' : formattedDelta}</span>
    </span>
  );
}
```

### Entry Animation

The trend indicator slides in from the direction it represents: up trends slide up into position; down trends slide down. 200ms, `ease-out`. The number counts up simultaneously.

```typescript
// Entry keyframes based on direction
const entryVariants = {
  up: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
  },
  down: {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
  },
  neutral: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
};
```

---

## Sparklines

Miniature line charts (no axes, no labels, no grid) that show trend shape. They appear inline with metrics or in cards.

### Canvas Implementation (Preferred for Performance)

Sparklines are often rendered in lists or grids with dozens visible simultaneously. Canvas is preferred over SVG for this reason.

```typescript
interface SparklineConfig {
  data: number[];
  width: number;
  height: number;
  color: string;
  lineWidth?: number;
  fillOpacity?: number;
  animate?: boolean;
  animationDuration?: number;
}

function drawSparkline(
  canvas: HTMLCanvasElement,
  config: SparklineConfig,
  progress: number = 1 // 0-1 animation progress
) {
  const {
    data,
    width,
    height,
    color,
    lineWidth = 1.5,
    fillOpacity = 0.1,
  } = config;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  if (data.length < 2) return;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = lineWidth;

  const pointsCount = Math.max(2, Math.floor(data.length * progress));
  const visibleData = data.slice(0, pointsCount);

  const points = visibleData.map((val, i) => ({
    x: (i / (data.length - 1)) * (width - padding * 2) + padding,
    y: height - padding - ((val - min) / range) * (height - padding * 2),
  }));

  // Draw fill gradient
  if (fillOpacity > 0 && points.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineTo(points[points.length - 1].x, height);
    ctx.lineTo(points[0].x, height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `${color}${Math.round(fillOpacity * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, `${color}00`);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // Draw line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Draw end dot
  if (progress >= 1) {
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, lineWidth * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}
```

### Draw Animation

Sparklines draw on intersection — when the user scrolls them into view. The line draws from left to right over 600-800ms. The `progress` parameter (0-1) controls how much of the line is visible, driven by `requestAnimationFrame` and the intersection observer.

```typescript
function useSparklineAnimation(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  config: SparklineConfig,
  reducedMotion: boolean
) {
  const hasDrawn = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (reducedMotion) {
      drawSparkline(canvas, config, 1);
      return;
    }

    // Draw empty initially
    drawSparkline(canvas, config, 0);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasDrawn.current) {
          hasDrawn.current = true;
          observer.disconnect();

          const duration = config.animationDuration || 700;
          const start = performance.now();

          function frame(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = cubicOut(progress);
            drawSparkline(canvas!, config, eased);

            if (progress < 1) {
              requestAnimationFrame(frame);
            }
          }

          requestAnimationFrame(frame);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [config, reducedMotion]);
}

const cubicOut = (t: number) => 1 - Math.pow(1 - t, 3);
```

---

## Comparison Visuals

Metrics that show how one value relates to another: actual vs target, before vs after, this period vs last period.

### Target vs Actual Bar

A single horizontal bar with two layers: the target (background, dashed or lighter) and the actual (foreground, solid). The delta between them is the story.

```typescript
// Visual pattern:
// [====================|--- target ---------]  Under target
// [========================== target ===]====]  Over target (overflow)

interface TargetActualBarProps {
  actual: number;
  target: number;
  max?: number; // Scale maximum (default: Math.max(actual, target) * 1.2)
  label?: string;
  actualColor?: string;
  targetColor?: string;
  overColor?: string;
  height?: number;
}

// The actual bar animates to its value with cubicOut easing (600ms).
// If actual > target, the portion beyond target uses overColor.
// The target line is a thin vertical marker that fades in at 400ms.
// A delta badge appears after both animations complete, showing +/- difference.
```

### Before/After Comparison

Two side-by-side metrics (or stacked vertically on mobile) with an animated connection between them. The "before" renders first, then an animated arrow or connector draws toward the "after" value, which then counts up.

**Timing sequence:**
1. "Before" value appears (200ms fade)
2. Connector arrow draws (300ms, left to right)
3. "After" value counts up (600ms)
4. Delta badge appears between them (200ms pop)

### Period Comparison

Current period metric with a ghost trace of the previous period. The ghost is the same visualization type (ring, bar, line) but rendered at 20% opacity behind the current. This gives instant visual comparison without requiring the user to remember the previous value.

```typescript
// Radial ring comparison: two rings on the same center
// Previous period: thin stroke, 20% opacity, no animation
// Current period: full stroke, animated fill with spring
// Center shows: current value, with previous value in smaller text below

// Bar comparison: two bars overlaid
// Previous period: dashed outline, 20% opacity
// Current period: solid fill, animated growth
// Overlap region visible, delta shown as label
```

---

## Locale-Aware Formatting

Every number in every metric must be formatted according to the user's locale. Never manually format with commas, periods, or currency symbols.

```typescript
// Number formatting utilities
const formatters = {
  number: (value: number, locale: string, decimals = 0) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value),

  currency: (value: number, locale: string, currency: string) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value),

  compact: (value: number, locale: string) =>
    new Intl.NumberFormat(locale, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value),

  percent: (value: number, locale: string, decimals = 0) =>
    new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100),
};

// Usage:
// formatters.currency(142850, 'en-US', 'USD') → "$142,850"
// formatters.currency(142850, 'de-DE', 'EUR') → "142.850 €"
// formatters.compact(8472000, 'en-US') → "8.5M"
// formatters.percent(73.5, 'en-US', 1) → "73.5%"
```

---

## Intersection Observer Patterns

Metrics should animate when they enter the viewport, not when the component mounts. This ensures the animation is seen by the user and avoids wasting animation cycles on off-screen content.

```typescript
function useMetricVisibility(threshold = 0.5): {
  ref: React.RefObject<HTMLDivElement | null>;
  isVisible: boolean;
} {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Only animate once
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
```
