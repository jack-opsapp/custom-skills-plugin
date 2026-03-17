# Charts & Graphs — Detailed Reference

Every chart is an animated, interactive data surface. Static charts are screenshots. Animated, interactive charts are experiences. This reference covers every major chart type with complete animation patterns, interaction models, and implementation guidance.

---

## Universal Principles

### Entry Animation

Every chart animates on first render. The animation serves the **Entry / Arrival** emotional beat: the user sees data appear with precision and confidence, building trust in the system before a single number is read.

**Stagger pattern:** Elements animate in sequence, not simultaneously. Simultaneous animation is noise. Staggered animation guides the eye through the data in order of importance.

```typescript
// Stagger configuration
const STAGGER = {
  delayBetween: 50,   // ms between each element start
  baseDuration: 400,  // ms per element animation
  easing: [0.16, 1, 0.3, 1] as const, // sharp ease-out
};

// For N bars, total animation time = baseDuration + (N - 1) * delayBetween
// 8 bars = 400 + 350 = 750ms total — fast enough to feel snappy, slow enough to read
```

**Intersection Observer trigger:** Charts do not animate on mount. They animate when visible. A chart below the fold that animates before the user scrolls to it wastes its entry animation.

```typescript
const useIntersectionEntry = (threshold = 0.3) => {
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
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasEntered, threshold]);

  return { ref, hasEntered };
};
```

### Data Update Transitions

When data values change, elements morph — they never jump. This is the **Transition** emotional beat: the user maintains spatial continuity and can track what changed.

**Interpolation strategy:**
- Numeric values (bar heights, line Y positions, pie angles): linear interpolation over 400-600ms with `cubicOut` easing.
- Colors: interpolate in OKLCH color space for perceptually uniform transitions. Never interpolate in RGB.
- Element count changes (bars added/removed): new elements enter with the entry animation; removed elements fade to 0 opacity over 200ms, then are removed from DOM.

```typescript
// Smooth value interpolation with requestAnimationFrame
function animateValue(
  from: number,
  to: number,
  duration: number,
  easing: (t: number) => number,
  onUpdate: (value: number) => void,
  onComplete?: () => void
) {
  const start = performance.now();

  function tick(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    const value = from + (to - from) * easedProgress;
    onUpdate(value);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      onComplete?.();
    }
  }

  requestAnimationFrame(tick);
}

// Easing functions
const cubicOut = (t: number) => 1 - Math.pow(1 - t, 3);
const cubicInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
```

### Interactive Tooltips

Every data point is hoverable (desktop) or tappable (mobile). Tooltips show precise values, labels, and contextual comparisons.

**Tooltip positioning:** Always position to avoid overflow. Prefer above the element; fall back to below, then left/right. Animate in with 150ms `ease-out`, out with 100ms `ease-in`. Tooltip follows cursor on line/area charts; anchors to element center on bar/pie charts.

```typescript
interface TooltipData {
  label: string;
  value: number;
  formattedValue: string;
  color: string;
  secondary?: { label: string; value: string }[];
  position: { x: number; y: number };
}

// Tooltip component pattern
function ChartTooltip({ data, visible }: { data: TooltipData | null; visible: boolean }) {
  if (!data) return null;

  return (
    <div
      role="tooltip"
      aria-live="polite"
      style={{
        position: 'absolute',
        left: data.position.x,
        top: data.position.y,
        transform: 'translate(-50%, -100%) translateY(-8px)',
        opacity: visible ? 1 : 0,
        transition: visible
          ? 'opacity 150ms cubic-bezier(0.16, 1, 0.3, 1)'
          : 'opacity 100ms cubic-bezier(0.4, 0, 1, 1)',
        pointerEvents: 'none',
      }}
    >
      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
        <div className="font-medium">{data.label}</div>
        <div className="text-lg font-bold" style={{ color: data.color }}>
          {data.formattedValue}
        </div>
        {data.secondary?.map((s, i) => (
          <div key={i} className="text-gray-400 text-xs mt-1">
            {s.label}: {s.value}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Bar Charts

The most common visualization. Bars are intuitive — length encodes magnitude. Animation makes them compelling.

### Horizontal Bar Chart (Preferred for Labeled Categories)

Horizontal bars are preferred when category labels are strings (project names, team members, expense categories). The label reads naturally on the left; the bar extends right.

**Entry animation:** Bars grow from left edge (width 0 → final width), staggered top to bottom. Each bar's width animates with spring physics or sharp ease-out.

**Data update:** Bar widths interpolate smoothly to new values. If a bar's value increases, it grows; if it decreases, it shrinks. The animation duration is proportional to the magnitude of change, clamped to 400-600ms.

```typescript
// Complete animated horizontal bar pattern (SVG)
interface BarDatum {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface AnimatedBarProps {
  datum: BarDatum;
  maxValue: number;
  chartWidth: number;
  barHeight: number;
  y: number;
  index: number;
  hasEntered: boolean;
  reducedMotion: boolean;
}

function AnimatedBar({
  datum,
  maxValue,
  chartWidth,
  barHeight,
  y,
  index,
  hasEntered,
  reducedMotion,
}: AnimatedBarProps) {
  const targetWidth = (datum.value / maxValue) * chartWidth;
  const [currentWidth, setCurrentWidth] = useState(0);
  const prevTargetRef = useRef(0);

  useEffect(() => {
    if (!hasEntered) return;

    const from = prevTargetRef.current;
    const to = targetWidth;
    prevTargetRef.current = to;

    if (reducedMotion) {
      setCurrentWidth(to);
      return;
    }

    // Entry: delay based on index. Update: no delay.
    const delay = from === 0 ? index * 50 : 0;
    const duration = from === 0 ? 500 : 400;

    const timeout = setTimeout(() => {
      animateValue(from, to, duration, cubicOut, setCurrentWidth);
    }, delay);

    return () => clearTimeout(timeout);
  }, [hasEntered, targetWidth, index, reducedMotion]);

  return (
    <g>
      {/* Background track */}
      <rect
        x={0}
        y={y}
        width={chartWidth}
        height={barHeight}
        rx={barHeight / 2}
        fill="rgba(255,255,255,0.05)"
      />
      {/* Animated bar */}
      <rect
        x={0}
        y={y}
        width={currentWidth}
        height={barHeight}
        rx={barHeight / 2}
        fill={datum.color}
      />
      {/* Value label (appears after bar settles) */}
      <text
        x={currentWidth + 8}
        y={y + barHeight / 2}
        dominantBaseline="central"
        fill="rgba(255,255,255,0.7)"
        fontSize={12}
        style={{
          opacity: currentWidth > 20 ? 1 : 0,
          transition: 'opacity 200ms ease-out',
        }}
      >
        {datum.value.toLocaleString()}
      </text>
    </g>
  );
}
```

### Vertical Bar Chart (Preferred for Time Series)

Vertical bars work best for time-series data (monthly revenue, weekly counts) where the X axis is chronological.

**Entry animation:** Bars grow from bottom (height 0 → final height), staggered left to right. This mirrors the temporal reading direction.

**Grouped bars:** When comparing categories within each time period, bars within a group animate simultaneously; the stagger is between groups.

```typescript
// Vertical bar entry — grows from bottom
// SVG coordinate system: y=0 is top, so bar grows "up" by decreasing y and increasing height

interface VerticalBarAnimState {
  y: number;      // top edge of bar
  height: number; // bar height
}

function animateVerticalBar(
  finalHeight: number,
  chartHeight: number,
  index: number,
  hasEntered: boolean,
  reducedMotion: boolean,
  onUpdate: (state: VerticalBarAnimState) => void
) {
  const finalY = chartHeight - finalHeight;

  if (!hasEntered) {
    onUpdate({ y: chartHeight, height: 0 });
    return;
  }

  if (reducedMotion) {
    onUpdate({ y: finalY, height: finalHeight });
    return;
  }

  const delay = index * 50;
  setTimeout(() => {
    animateValue(0, finalHeight, 500, cubicOut, (h) => {
      onUpdate({ y: chartHeight - h, height: h });
    });
  }, delay);
}
```

### Stacked Bar Chart

Segments within each bar animate sequentially — bottom segment first, then the next, creating a building effect.

**Entry:** Each segment grows from its base position. Stagger between bars is 80ms; stagger between segments within a bar is 30ms.

**Data update:** All segments in a bar interpolate simultaneously. The proportional split morphs smoothly.

---

## Line Charts

Lines communicate trends. The animation must emphasize the trajectory, not individual points.

### Line Draw Animation

**Entry:** The line draws from left to right using SVG `stroke-dasharray` / `stroke-dashoffset`. The total path length is calculated, then `dashoffset` animates from `pathLength` to `0`.

```typescript
// SVG line draw animation
function useLineDrawAnimation(
  pathRef: React.RefObject<SVGPathElement | null>,
  hasEntered: boolean,
  reducedMotion: boolean,
  duration = 800,
  delay = 0
) {
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;

    if (!hasEntered) {
      path.style.strokeDashoffset = `${length}`;
      return;
    }

    if (reducedMotion) {
      path.style.strokeDashoffset = '0';
      return;
    }

    path.style.strokeDashoffset = `${length}`;

    const timeout = setTimeout(() => {
      animateValue(length, 0, duration, cubicOut, (val) => {
        path.style.strokeDashoffset = `${val}`;
      });
    }, delay);

    return () => clearTimeout(timeout);
  }, [hasEntered, reducedMotion, duration, delay]);
}
```

### Multi-Line Charts

When multiple lines exist, stagger their draw animations by 150ms each. Draw the most important line first (primary metric), then secondary lines. This creates a layered reveal that guides the user's attention.

### Data Point Markers

Points along the line appear after the line has drawn past their position. Use a scale-up animation (0 → 1) with 200ms duration. Points are interactive — hoverable with tooltips.

### Area Fill

For area charts, the fill fades in (opacity 0 → 0.15) after the line draw completes. Use a gradient fill that fades to transparent at the bottom — this grounds the line without obscuring grid lines.

```typescript
// Area gradient definition
<defs>
  <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
    <stop offset="100%" stopColor={color} stopOpacity={0} />
  </linearGradient>
</defs>
```

### Data Update Morphing

When line data updates, the path morphs from old shape to new. Interpolate each point's Y coordinate independently over 500ms with `cubicInOut` easing. The line "breathes" into its new shape.

```typescript
// Path morphing between datasets
function interpolatePath(
  oldPoints: { x: number; y: number }[],
  newPoints: { x: number; y: number }[],
  progress: number
): string {
  // Handle different point counts by resampling to the larger set
  const maxLen = Math.max(oldPoints.length, newPoints.length);
  const resampledOld = resamplePoints(oldPoints, maxLen);
  const resampledNew = resamplePoints(newPoints, maxLen);

  const interpolated = resampledOld.map((old, i) => ({
    x: old.x + (resampledNew[i].x - old.x) * progress,
    y: old.y + (resampledNew[i].y - old.y) * progress,
  }));

  return pointsToSmoothPath(interpolated);
}

function resamplePoints(
  points: { x: number; y: number }[],
  targetCount: number
): { x: number; y: number }[] {
  if (points.length === targetCount) return points;

  const result: { x: number; y: number }[] = [];
  for (let i = 0; i < targetCount; i++) {
    const t = i / (targetCount - 1);
    const sourceIndex = t * (points.length - 1);
    const lower = Math.floor(sourceIndex);
    const upper = Math.min(lower + 1, points.length - 1);
    const frac = sourceIndex - lower;
    result.push({
      x: points[lower].x + (points[upper].x - points[lower].x) * frac,
      y: points[lower].y + (points[upper].y - points[lower].y) * frac,
    });
  }
  return result;
}

// Convert points to smooth SVG path using cubic bezier curves
function pointsToSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[Math.min(i + 1, points.length - 1)];
    const prevPrev = points[Math.max(i - 2, 0)];

    // Catmull-Rom to Bezier conversion
    const tension = 0.3;
    const cp1x = prev.x + (curr.x - prevPrev.x) * tension;
    const cp1y = prev.y + (curr.y - prevPrev.y) * tension;
    const cp2x = curr.x - (next.x - prev.x) * tension;
    const cp2y = curr.y - (next.y - prev.y) * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }

  return d;
}
```

---

## Radar / Spider Charts

Radar charts show multi-dimensional data on radial axes. They work best for comparing profiles (skill sets, performance dimensions, feature coverage).

### Entry Animation

**Pattern:** Each data polygon draws from center (all values at 0) to its final shape. The polygon "inflates" outward. Stagger multiple overlapping polygons by 200ms.

```typescript
// Radar chart point calculation
function radarPoints(
  values: number[],       // 0-1 normalized
  cx: number,
  cy: number,
  radius: number,
  progress: number = 1    // 0-1 animation progress
): string {
  const angleStep = (Math.PI * 2) / values.length;
  const startAngle = -Math.PI / 2; // Start from top

  return values
    .map((val, i) => {
      const angle = startAngle + i * angleStep;
      const r = radius * val * progress;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      return `${x},${y}`;
    })
    .join(' ');
}
```

### Axis Lines and Labels

Axis lines (spokes from center to edge) render immediately — they are the scaffold. Labels at the end of each spoke fade in with 200ms delay after the polygon animation starts. Grid rings (concentric circles at 25%, 50%, 75%, 100%) render immediately at low opacity.

### Hover Interaction

Hovering a spoke highlights the corresponding value on all visible polygons. A radial indicator line appears at the hovered value's distance from center. The tooltip shows the exact values for all datasets at that dimension.

---

## Pie / Donut Charts

Use donut charts (with a center hole) over filled pies. The center provides space for a total or label. Filled pies waste that space and make segment comparison harder.

### Entry Animation

**Pattern:** Segments sweep in from 12 o'clock (top), each starting where the previous ended. Each segment takes 200ms to sweep to its arc, with 30ms stagger.

```typescript
// SVG arc path for donut segment
function describeArc(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,  // radians, 0 = top
  endAngle: number
): string {
  const startOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
  const endOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, endAngle);
  const endInner = polarToCartesian(cx, cy, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ');
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleRadians: number
): { x: number; y: number } {
  // Offset by -PI/2 so 0 radians = 12 o'clock
  const adjusted = angleRadians - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(adjusted),
    y: cy + radius * Math.sin(adjusted),
  };
}
```

### Data Update

When values change, segments rotate and resize to their new proportions. All segments animate simultaneously over 500ms with `cubicInOut` easing. The total arc (360 degrees) is preserved — segments trade space with each other.

### Hover Interaction

Hovering a segment: the segment translates outward from center by 6px (along its bisecting angle). Opacity of non-hovered segments drops to 0.5. Center label updates to show the hovered segment's value and percentage.

---

## Implementation Decision: Custom vs Library

### When to Use a Chart Library (Recharts, Nivo, Visx)

- The project already uses one and consistency matters
- The chart is standard (basic bar, basic line) with no custom animation requirements
- Development speed is the primary constraint and the library's default animations are acceptable

### When to Build Custom (SVG or Canvas)

- The animation quality of the library's defaults is not sufficient (most common case)
- The interaction model requires custom behaviors (linked highlighting, custom tooltips, drill-down)
- The chart combines types (bar + line overlay) in a way the library handles poorly
- Performance requires Canvas rendering (high element count, continuous updates)
- The brand's motion language requires specific easing, timing, or spring physics that the library cannot configure

**Default recommendation:** Build custom with SVG. Chart libraries trade animation quality for convenience. For any visualization that matters — a dashboard, a key metric, a data story — custom SVG with hand-tuned animation produces a categorically better result. The extra code is the job.

---

## Canvas Rendering (High-Performance Charts)

When element count exceeds ~100 or continuous updates are needed (live data), switch to Canvas.

### DPI-Aware Setup

```typescript
function setupHiDPICanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return ctx;
}
```

### Canvas Animation Loop

```typescript
function createChartAnimationLoop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  drawFrame: (ctx: CanvasRenderingContext2D, t: number) => void
) {
  let animationId: number;
  let startTime: number | null = null;

  function loop(timestamp: number) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;

    ctx.clearRect(0, 0, width, height);
    drawFrame(ctx, elapsed);

    animationId = requestAnimationFrame(loop);
  }

  animationId = requestAnimationFrame(loop);

  return () => cancelAnimationFrame(animationId);
}
```

### Canvas Hit Testing

Canvas does not have DOM elements for hover detection. Implement hit testing manually:

```typescript
// For bar charts: check if mouse is within any bar's bounding rect
function hitTestBars(
  mouseX: number,
  mouseY: number,
  bars: { x: number; y: number; width: number; height: number; data: BarDatum }[]
): BarDatum | null {
  for (const bar of bars) {
    if (
      mouseX >= bar.x &&
      mouseX <= bar.x + bar.width &&
      mouseY >= bar.y &&
      mouseY <= bar.y + bar.height
    ) {
      return bar.data;
    }
  }
  return null;
}

// For line charts: find the closest point within a threshold
function hitTestPoints(
  mouseX: number,
  mouseY: number,
  points: { x: number; y: number; data: PointDatum }[],
  threshold = 15
): PointDatum | null {
  let closest: { data: PointDatum; dist: number } | null = null;

  for (const point of points) {
    const dist = Math.hypot(mouseX - point.x, mouseY - point.y);
    if (dist < threshold && (!closest || dist < closest.dist)) {
      closest = { data: point.data, dist };
    }
  }

  return closest?.data ?? null;
}
```
