# Gamified Interactions

Physics-based interactive animations where user input drives visual systems with momentum, gravity, snapping, and scoring. These are participatory — the user's actions have visible, satisfying physical consequences.

## Physics-Based Drag, Flick, and Toss

### Velocity Tracking

Track the last N pointer positions (typically 3-5) with timestamps. On release, compute velocity from the most recent delta:

```typescript
interface PointerSample {
  x: number;
  y: number;
  t: number;  // performance.now()
}

function computeVelocity(samples: PointerSample[]): { vx: number; vy: number } {
  if (samples.length < 2) return { vx: 0, vy: 0 };
  const last = samples[samples.length - 1];
  const prev = samples[samples.length - 2];
  const dt = (last.t - prev.t) / 1000;
  if (dt === 0) return { vx: 0, vy: 0 };
  return {
    vx: (last.x - prev.x) / dt,
    vy: (last.y - prev.y) / dt,
  };
}
```

### Momentum and Friction

After release, apply the computed velocity with exponential decay:

```typescript
// Per frame (inside requestAnimationFrame)
element.vx *= friction;  // 0.95-0.98 typical
element.vy *= friction;
element.x += element.vx * dt;
element.y += element.vy * dt;

// Stop threshold — prevent infinite micro-drift
if (Math.abs(element.vx) < 0.1 && Math.abs(element.vy) < 0.1) {
  element.vx = 0;
  element.vy = 0;
}
```

### Gravity (optional)

For toss-and-fall interactions:

```typescript
element.vy += GRAVITY * dt;  // GRAVITY: 800-1200 px/s^2
```

### Boundary Bounce

When the element reaches a container edge, reverse and dampen the velocity:

```typescript
if (element.x < 0) {
  element.x = 0;
  element.vx = -element.vx * bounceFactor;  // 0.5-0.7
}
```

## Forked Decision Flows

The canonical pattern is the ForcedChoiceFork — a particle field that responds to user intent through three distinct modes.

### Three Modes

1. **Ambient Mode** — Particles drift with gentle sinusoidal breathing. No user input detected.
   - Velocity: `vx += sin(time * 0.2 + phase) * 0.00008`
   - Damping: `vx *= 0.99`
   - Feel: calm, contemplative, slightly alive

2. **Hover Orbit Mode** — User hovers near a decision node. Particles are drawn toward it.
   - Radial pull: `v += (nodePos - particlePos).normalized * pullStrength`
   - Tangential drift: perpendicular component prevents collapse into a point
   - Color shift: proximity-based interpolation from neutral gray to node's assigned color
   - Feel: gathering energy, intent forming

3. **Stream Mode** — User selects a node. Particles flow in one direction.
   - Flow velocity: horizontal bias in the direction of the selected node
   - Y-convergence funnel: particles converge toward the node's Y position as they approach
   - Entry-side scatter: loose, wide spread far from the node
   - Post-node tightening: stream narrows after passing through the node
   - Respawn: particles that exit the canvas re-enter on the opposite side with random Y offset
   - Feel: commitment, flow, resolution

### Color System

- Neutral (no hover): gray `rgb(160, 160, 160)`
- Each node has an assigned color (e.g., blue for left, orange for right)
- Interpolation: `lerpColor(neutral, nodeColor, proximityFactor)`
- In stream mode, color transitions from neutral on the entry side to full node color past the node

See `examples/ForcedChoiceFork.tsx` for the complete seed implementation.

## Swipe-to-Reveal

A card or panel that the user swipes to reveal content underneath.

### Implementation

```typescript
// Track horizontal drag distance
const swipeThreshold = containerWidth * 0.4;  // 40% of width to commit

// During drag: translate the top layer
topLayer.style.transform = `translateX(${dragDelta}px)`;

// On release:
if (Math.abs(dragDelta) > swipeThreshold || Math.abs(velocity.vx) > 500) {
  // Commit: animate to full reveal
  animateTo(dragDelta > 0 ? containerWidth : -containerWidth);
} else {
  // Snap back to origin
  animateTo(0);
}
```

### Visual Feedback During Swipe

- Background content scales up slightly as it's revealed (0.95 to 1.0)
- Top layer opacity decreases as it moves away
- A subtle parallax: background moves at 0.3x the drag speed

## Snap-to-Grid with Magnetic Pull

For drag-and-drop into a grid layout:

### Magnetic Pull Zone

When a dragged element enters within `magnetRadius` (typically 40-60px) of a grid cell center, apply a spring force toward the cell:

```typescript
const dx = cellCenterX - dragX;
const dy = cellCenterY - dragY;
const dist = Math.sqrt(dx * dx + dy * dy);

if (dist < magnetRadius) {
  const strength = 1 - (dist / magnetRadius);  // 0 at edge, 1 at center
  const pullForce = strength * strength * 0.15;  // quadratic for snappy feel
  dragX += dx * pullForce;
  dragY += dy * pullForce;
}
```

### Snap Commit

On release, if within `snapRadius` (smaller than `magnetRadius`, typically 20-30px), snap to the grid cell with a spring animation (duration: 150-200ms, slight overshoot).

### Visual Indicators

- Grid cell highlights when the dragged element is within magnetic range
- Cell border brightens or a subtle glow appears
- Occupied cells show a "swap" indicator (the existing item shifts slightly)

## Score and Progress Animations

### Counting Animation

For score displays that count up from 0:

```typescript
function animateCounter(target: number, duration: number = 1200) {
  const start = performance.now();
  function tick(now: number) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);  // ease-out cubic
    const current = Math.round(target * eased);
    display.textContent = current.toString();
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
```

### Progress Bar Fill

- Width transition with `cubic-bezier(0.4, 0, 0.2, 1)` over 800ms
- Color interpolation from red (0%) through yellow (50%) to green (100%)
- A subtle shine sweep (linear-gradient moving left-to-right) on completion

### Milestone Celebrations

When a score threshold is reached:

- Brief pulse on the score number (scale 1.0 to 1.15 to 1.0, 300ms)
- A ring expands outward from the score element (opacity 0.6 to 0, scale 1 to 2, 500ms)
- No confetti, no bouncing, no emoji. Restraint is the celebration.

## iOS Equivalents

| Web Pattern | iOS Pattern |
|-------------|-------------|
| Canvas particle field | `CAEmitterLayer` with `CAEmitterCell` |
| Drag velocity tracking | `UIPanGestureRecognizer.velocity(in:)` |
| Momentum + friction | `UIDynamicAnimator` with `UIDynamicItemBehavior` |
| Snap-to-grid | `UISnapBehavior` |
| Spring animation | `UIView.animate(withDuration:delay:usingSpringWithDamping:)` |
| Score counter | `CADisplayLink` with interpolation |
