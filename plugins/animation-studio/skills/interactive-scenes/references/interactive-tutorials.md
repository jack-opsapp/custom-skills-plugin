# Interactive Tutorials

Step-by-step guided experiences that overlay the real UI with spotlights, tooltips, and gesture indicators. The user is led through a workflow — each step isolates a target element, explains the action, and waits for the user to complete it.

## Spotlight Cutout System

The spotlight isolates a target element by darkening everything else. Four morphing strategies for transitioning between spotlight targets:

### Strategy 1: Expand

The spotlight starts as a small circle/rounded-rect at the previous target's position, then expands and repositions to the new target.

```css
/* Implementation via clip-path */
.spotlight-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  clip-path: url(#spotlight-path);
  transition: clip-path 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  pointer-events: none;
}
```

Using an SVG `<clipPath>` with an inverted rectangle + cutout shape allows the cutout to animate via CSS or JavaScript.

### Strategy 2: Morph

The cutout shape smoothly morphs from one bounding box to another. Best for targets of similar shape.

```typescript
interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
}

function interpolateRect(a: SpotlightRect, b: SpotlightRect, t: number): SpotlightRect {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    width: a.width + (b.width - a.width) * t,
    height: a.height + (b.height - a.height) * t,
    borderRadius: a.borderRadius + (b.borderRadius - a.borderRadius) * t,
  };
}
```

Animate with `requestAnimationFrame` over 400ms with ease-out.

### Strategy 3: Fade

The current spotlight fades out (150ms), then the new spotlight fades in at the new position (150ms). Simple, reliable, works for large position changes.

### Strategy 4: Slide

The entire overlay slides in the direction of the new target. Best for sequential targets that are spatially ordered (e.g., a form with fields top-to-bottom).

### CSS clip-path Implementation

The most performant web approach uses `clip-path` with a polygon that has an inner cutout:

```typescript
function buildClipPath(rect: SpotlightRect, viewportW: number, viewportH: number): string {
  const { x, y, width, height, borderRadius: r } = rect;
  // Outer rectangle (full viewport, clockwise)
  // Inner cutout (counter-clockwise for the hole)
  // Using polygon with enough points to approximate rounded corners
  return `polygon(
    evenodd,
    0 0, ${viewportW}px 0, ${viewportW}px ${viewportH}px, 0 ${viewportH}px, 0 0,
    ${x + r}px ${y}px,
    ${x}px ${y + r}px,
    ${x}px ${y + height - r}px,
    ${x + r}px ${y + height}px,
    ${x + width - r}px ${y + height}px,
    ${x + width}px ${y + height - r}px,
    ${x + width}px ${y + r}px,
    ${x + width - r}px ${y}px,
    ${x + r}px ${y}px
  )`;
}
```

For smoother rounded corners, use more interpolation points or an SVG mask.

### Padding

Always add padding around the target element (8-16px) so the spotlight doesn't clip tightly against the element edge. This breathing room makes the cutout feel intentional rather than mechanical.

## Tooltip Positioning

### Smart Edge Avoidance

The tooltip must never clip the viewport edge. Compute the ideal position, then adjust:

```typescript
type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipPosition {
  x: number;
  y: number;
  placement: TooltipPlacement;
  arrowOffset: number;  // offset of the arrow from tooltip center
}

function computeTooltipPosition(
  targetRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
  preferredPlacement: TooltipPlacement,
  padding: number = 12,
): TooltipPosition {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const gap = 12;  // space between target and tooltip

  // Try preferred placement first
  const placements: TooltipPlacement[] = [
    preferredPlacement,
    ...(['bottom', 'top', 'right', 'left'] as TooltipPlacement[]).filter(p => p !== preferredPlacement),
  ];

  for (const placement of placements) {
    let x: number, y: number;

    switch (placement) {
      case 'top':
        x = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        y = targetRect.top - tooltipHeight - gap;
        break;
      case 'bottom':
        x = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        y = targetRect.bottom + gap;
        break;
      case 'left':
        x = targetRect.left - tooltipWidth - gap;
        y = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        break;
      case 'right':
        x = targetRect.right + gap;
        y = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        break;
    }

    // Clamp to viewport
    x = Math.max(padding, Math.min(viewportW - tooltipWidth - padding, x));
    y = Math.max(padding, Math.min(viewportH - tooltipHeight - padding, y));

    // Check if it fits without overlapping the target
    const tooltipRect = { left: x, top: y, right: x + tooltipWidth, bottom: y + tooltipHeight };
    const overlaps =
      tooltipRect.left < targetRect.right &&
      tooltipRect.right > targetRect.left &&
      tooltipRect.top < targetRect.bottom &&
      tooltipRect.bottom > targetRect.top;

    if (!overlaps) {
      const arrowOffset = (targetRect.left + targetRect.width / 2) - (x + tooltipWidth / 2);
      return { x, y, placement, arrowOffset };
    }
  }

  // Fallback: bottom, clamped
  return {
    x: Math.max(padding, targetRect.left + targetRect.width / 2 - tooltipWidth / 2),
    y: targetRect.bottom + gap,
    placement: 'bottom',
    arrowOffset: 0,
  };
}
```

### Arrow Positioning

The tooltip arrow (CSS triangle or SVG) should point toward the target element's center. When the tooltip is shifted due to edge avoidance, the arrow offset tracks with it so the arrow still points at the target.

### Tooltip Styling

```css
.tutorial-tooltip {
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 16px 20px;
  max-width: 280px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}
```

## Gesture Indicators

Animated hints that show the user what action to perform. They loop until the user completes the action.

### Tap Pulse

A translucent circle that pulses at the target's center:

```
Animation:
  0ms:    scale(0.8), opacity(0.6)
  400ms:  scale(1.2), opacity(0.3)
  800ms:  scale(0.8), opacity(0.6)
  Loop: infinite
  Pause: 400ms between loops
```

A small ring (2px border, no fill) expands outward on each pulse peak.

### Swipe Arrow

An SVG arrow that translates along the swipe path:

```
Path: from (startX, startY) to (endX, endY)
Animation:
  0ms:    translate at start, opacity(0)
  100ms:  opacity(0.7)
  600ms:  translate at end, opacity(0.7)
  800ms:  opacity(0)
  Pause: 600ms
  Loop: infinite
```

The arrow head should be subtle — a thin chevron, not a filled triangle.

### Drag Hand

An SVG hand icon that moves from start to destination:

```
Animation:
  0ms:    hand at start, "pressing" (slightly smaller)
  200ms:  hand "grabs" (scale 1.0)
  800ms:  hand drags to destination
  1000ms: hand "releases" (opacity fades)
  Pause: 800ms
  Loop: infinite
```

### Cancellation

All gesture indicators must stop immediately when the user begins the correct gesture. Use a ref flag (`gestureStarted`) that the indicator's animation loop checks each frame.

## Phase Transitions

Transitioning between tutorial steps is a choreographed sequence:

### Step Exit (200ms)
1. Gesture indicator fades out (100ms)
2. Tooltip slides out in the opposite direction of the next step (150ms, ease-in)

### Spotlight Move (400ms)
3. Spotlight morphs/fades/slides to the new target (strategy-dependent)

### Step Enter (200ms)
4. Tooltip slides in from the direction of travel (150ms, ease-out)
5. Gesture indicator fades in and begins looping (100ms)

Total transition: ~600-800ms. Never exceed 1s between steps.

### Skip/Back Controls

- Skip button: always visible, top-right of tooltip or overlay
- Back button: visible after step 1, left of skip
- Progress indicator: dots or a step counter (e.g., "3 of 6")

## Completion Celebration

When the user finishes all steps:

1. Spotlight fades out (300ms)
2. A centered completion message fades in: title + subtitle
3. A single, subtle ring animation expands outward from the message center (scale 0 to 3, opacity 0.4 to 0, 600ms)
4. Optional: the message slides up and out after 2s, or stays until dismissed

No confetti. No bounce. No emoji. The satisfaction comes from having completed the task, not from decoration.

## iOS Implementation

### UIView Mask for Spotlight

```swift
// Create a mask layer with a hole
let maskLayer = CAShapeLayer()
let fullPath = UIBezierPath(rect: view.bounds)
let cutoutPath = UIBezierPath(roundedRect: targetFrame, cornerRadius: 8)
fullPath.append(cutoutPath)
maskLayer.path = fullPath.cgPath
maskLayer.fillRule = .evenOdd
overlayView.layer.mask = maskLayer
```

Animate the cutout by interpolating `targetFrame` and updating the mask path inside a `CADisplayLink` callback.

### SwiftUI Overlay

```swift
.overlay {
  SpotlightOverlay(targetRect: currentTarget)
    .animation(.easeInOut(duration: 0.4), value: currentTarget)
}
```

Using a custom `Shape` conformance that draws the inverted cutout.
