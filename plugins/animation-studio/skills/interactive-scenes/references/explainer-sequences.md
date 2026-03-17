# Explainer Sequences

Step-by-step process illustrations that build up progressively, revealing complexity in digestible pieces. The user scrolls or triggers to advance, watching a system assemble itself.

## Scroll-Driven Build-Up

### IntersectionObserver Approach

Each step element gets an `IntersectionObserver` that triggers its entrance animation when it scrolls into the viewport:

```typescript
interface StepConfig {
  id: string;
  threshold: number;     // 0.2-0.5 typical
  staggerDelay: number;  // ms delay after previous step
  animation: 'fade-up' | 'fade-in' | 'scale-in' | 'draw-in';
}

function observeSteps(steps: StepConfig[]) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.classList.add('step-visible');
          observer.unobserve(el);
        }
      }
    },
    { threshold: 0.3 }
  );

  for (const step of steps) {
    const el = document.getElementById(step.id);
    if (el) observer.observe(el);
  }

  return observer;
}
```

### CSS Classes for Step States

```css
.step-node {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}

.step-node.step-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger via custom property */
.step-node:nth-child(1) { transition-delay: 0ms; }
.step-node:nth-child(2) { transition-delay: 150ms; }
.step-node:nth-child(3) { transition-delay: 300ms; }
```

### Scroll Progress Tracking

For animations tied to scroll position (not just on/off visibility):

```typescript
function trackScrollProgress(element: HTMLElement): number {
  const rect = element.getBoundingClientRect();
  const viewportH = window.innerHeight;
  // 0 when element top enters viewport bottom
  // 1 when element bottom exits viewport top
  const progress = (viewportH - rect.top) / (viewportH + rect.height);
  return Math.max(0, Math.min(1, progress));
}
```

Use this progress value to drive continuous animations (line drawing, opacity ramps, position interpolation).

## Connection Lines Between Elements

### SVG Path Drawing

The most common technique: an SVG `<path>` whose `stroke-dashoffset` animates from the path's total length to 0, creating a "drawing" effect.

```typescript
function animatePathDraw(pathElement: SVGPathElement, duration: number = 800) {
  const length = pathElement.getTotalLength();
  pathElement.style.strokeDasharray = `${length}`;
  pathElement.style.strokeDashoffset = `${length}`;
  pathElement.style.transition = `stroke-dashoffset ${duration}ms ease-out`;

  // Trigger reflow, then animate
  pathElement.getBoundingClientRect();
  pathElement.style.strokeDashoffset = '0';
}
```

### Path Calculation Between Nodes

For connecting two DOM elements with an SVG path:

```typescript
interface NodePosition {
  x: number;  // center X in SVG coordinates
  y: number;  // center Y in SVG coordinates
}

function computeConnectionPath(
  from: NodePosition,
  to: NodePosition,
  curveStrength: number = 0.5,
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Vertical layout: curve horizontally
  if (Math.abs(dy) > Math.abs(dx)) {
    const cp1x = from.x;
    const cp1y = from.y + dy * curveStrength;
    const cp2x = to.x;
    const cp2y = to.y - dy * curveStrength;
    return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
  }

  // Horizontal layout: curve vertically
  const cp1x = from.x + dx * curveStrength;
  const cp1y = from.y;
  const cp2x = to.x - dx * curveStrength;
  const cp2y = to.y;
  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
}
```

### Canvas Connection Lines

When SVG is not practical (many dynamic connections), use Canvas:

```typescript
function drawConnection(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  progress: number,  // 0-1 draw progress
  color: string,
  lineWidth: number = 1.5,
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cp1 = { x: from.x, y: from.y + dy * 0.5 };
  const cp2 = { x: to.x, y: to.y - dy * 0.5 };

  // Sample points along the bezier up to `progress`
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);

  const steps = 50;
  const maxStep = Math.floor(steps * progress);
  for (let i = 1; i <= maxStep; i++) {
    const t = i / steps;
    const x = bezierPoint(from.x, cp1.x, cp2.x, to.x, t);
    const y = bezierPoint(from.y, cp1.y, cp2.y, to.y, t);
    ctx.lineTo(x, y);
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function bezierPoint(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}
```

### Arrowheads

Draw an arrowhead at the path endpoint:

```typescript
function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  tipX: number,
  tipY: number,
  angle: number,     // direction the path is traveling (radians)
  size: number = 8,
  color: string,
) {
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.5);
  ctx.lineTo(-size, size * 0.5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}
```

## State Machine Visualizations

For showing system states and transitions:

### Node Layout

Nodes arranged in a directed graph layout. For simple linear flows, horizontal or vertical arrangement with equal spacing. For branching flows, use a tree layout algorithm.

### Active State Highlight

The currently active node has:
- Brighter fill (opacity 0.9 vs 0.3)
- Subtle glow (`box-shadow` or Canvas `shadowBlur`)
- Slightly larger scale (1.05x)

Transition between active states: the outgoing node dims while the incoming node brightens, with the connecting edge animating its draw simultaneously.

### Transition Edges

Edges between states animate their draw (stroke-dashoffset) when the transition fires. A small dot or pulse travels along the edge path:

```typescript
function drawTravelingDot(
  ctx: CanvasRenderingContext2D,
  path: { x: number; y: number }[],
  progress: number,  // 0-1
  dotSize: number = 4,
  color: string,
) {
  const idx = Math.floor(progress * (path.length - 1));
  const localT = (progress * (path.length - 1)) - idx;
  const x = path[idx].x + (path[Math.min(idx + 1, path.length - 1)].x - path[idx].x) * localT;
  const y = path[idx].y + (path[Math.min(idx + 1, path.length - 1)].y - path[idx].y) * localT;

  ctx.beginPath();
  ctx.arc(x, y, dotSize, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
```

## Before/After Comparisons

### Slider Approach

A vertical or horizontal divider that the user drags to reveal more of "before" or "after":

```typescript
// Container with two layers: before (clipped left of slider) and after (clipped right)
// The slider position is tracked via drag
const clipBefore = `inset(0 ${100 - sliderPercent}% 0 0)`;
const clipAfter = `inset(0 0 0 ${sliderPercent}%)`;
```

### Animated Transition

For non-interactive before/after (triggered on scroll):

1. "Before" state visible at rest
2. On trigger: elements transform, recolor, resize to "after" state
3. Duration: 800ms with staggered child animations
4. Each property (color, position, size) animates independently for visual richness

### Morphing Comparison

Elements in the "before" state morph into their "after" equivalents using FLIP (First, Last, Invert, Play):

```typescript
// 1. Record "before" positions
const firstRects = elements.map(el => el.getBoundingClientRect());

// 2. Apply "after" state
container.classList.add('after-state');

// 3. Record "after" positions
const lastRects = elements.map(el => el.getBoundingClientRect());

// 4. Invert: move elements back to "before" positions
elements.forEach((el, i) => {
  const dx = firstRects[i].left - lastRects[i].left;
  const dy = firstRects[i].top - lastRects[i].top;
  const sw = firstRects[i].width / lastRects[i].width;
  const sh = firstRects[i].height / lastRects[i].height;
  el.style.transform = `translate(${dx}px, ${dy}px) scale(${sw}, ${sh})`;
});

// 5. Play: animate to identity transform
requestAnimationFrame(() => {
  elements.forEach(el => {
    el.style.transition = 'transform 0.6s cubic-bezier(0.32, 0.72, 0, 1)';
    el.style.transform = '';
  });
});
```

## Configurable Step Data

Explainer components should accept step data via props:

```typescript
interface ExplainerStep {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  status?: 'pending' | 'active' | 'complete';
  connections?: string[];  // IDs of steps this connects TO
}

interface ProcessExplainerProps {
  steps: ExplainerStep[];
  layout?: 'vertical' | 'horizontal' | 'tree';
  animateOnScroll?: boolean;
  connectionStyle?: 'straight' | 'curved' | 'stepped';
  activeStep?: string;
}
```

## Performance Considerations

- SVG path animations are GPU-accelerated via `will-change: stroke-dashoffset`
- For > 20 nodes with connections, switch from SVG to Canvas
- IntersectionObserver callbacks should be lightweight — set a flag and let `requestAnimationFrame` handle the actual animation
- Avoid layout thrashing: batch all `getBoundingClientRect()` reads before writes
