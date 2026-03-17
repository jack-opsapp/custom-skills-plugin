# Decision Flow Patterns

Particle-field-based visualizations where user intent drives a physics system through distinct behavioral modes. The canonical implementation is the ForcedChoiceFork — a 2-option selector using Canvas 2D particles that respond to proximity, hover, and selection.

## The ForcedChoiceFork Pattern

### Architecture

```
ForcedChoiceFork
├── Canvas (full container, DPI-aware)
├── Particle array (80-120 particles, pre-allocated)
├── Node positions (normalized, 2 nodes for binary choice)
├── State machine: Ambient → Hover → Selected
└── Callbacks: onSelect, onSelectionChange, onAnimationComplete
```

### Particle Data Structure

```typescript
interface Particle {
  x: number;        // normalized 0-1 (horizontal position)
  y: number;        // normalized 0-1 (vertical position)
  vx: number;       // velocity X (normalized units per frame)
  vy: number;       // velocity Y
  size: number;     // pixel size (2-5.5px)
  baseAlpha: number;// resting opacity (0.15-0.30)
  phase: number;    // random offset for sinusoidal motion (0 to 2*PI)
}
```

Particles are initialized once and stored in a `useRef`. Positions are normalized so they scale with container size. Velocities are tiny (0.0003 range) because they accumulate over many frames.

### Mode 1: Ambient

No user hover detected. Particles drift with gentle sinusoidal breathing.

**Physics:**
```
breatheX = sin(time * 0.2 + phase) * 0.00008
breatheY = cos(time * 0.15 + phase * 1.3) * 0.00008

vx += breatheX
vy += breatheY

vx *= 0.99    // light damping
vy *= 0.99

x += vx
y += vy
```

**Wrapping:** When a particle drifts past the edge (x < -0.05 or x > 1.05), it wraps to the opposite side. The 0.05 buffer prevents visible pop-in.

**Color:** All particles are neutral gray `rgb(160, 160, 160)` with subtle alpha oscillation: `baseAlpha + sin(time * 0.5 + phase) * 0.03`.

**Feel:** Calm, contemplative, slightly alive. The field breathes but doesn't demand attention.

### Mode 2: Hover Orbit

User's cursor is within `HIT_RADIUS` (60px) of a node. Particles are drawn toward the hovered node with orbital dynamics.

**Physics:**
```
dx = nodeX - particleX     // normalized distance
dy = nodeY - particleY
dist = sqrt(dx*dx + dy*dy)

if (dist > 0.01) {
  // Radial pull — draws particles inward
  pullStrength = 0.00025
  vx += (dx / dist) * pullStrength
  vy += (dy / dist) * pullStrength

  // Tangential drift — creates orbit, prevents collapse
  tangentX = -dy / dist
  tangentY = dx / dist
  orbitStrength = 0.00012
  vx += tangentX * orbitStrength
  vy += tangentY * orbitStrength
}

// Ambient breathing continues (weaker)
vx += sin(time * 0.2 + phase) * 0.00003
vy += cos(time * 0.15 + phase * 1.3) * 0.00003

vx *= 0.985    // slightly more damping than ambient
vy *= 0.985
```

The radial pull draws particles inward. The tangential drift gives them sideways momentum, creating an orbit. The balance between pull and orbit determines orbit radius — at these values, particles spiral slowly inward and then scatter slightly, creating a breathing cloud around the node.

**Color:** Proximity-based interpolation from neutral to the node's color.

```
hovDistance = sqrt((particleX - nodeX)^2 + (particleY - nodeY)^2)
proximity = max(0, 1 - hovDistance / 0.45)
color = lerpColor(NEUTRAL, nodeColor, proximity * 0.8)
alpha = baseAlpha + proximity * 0.2
```

Particles close to the node turn the node's color. Distant particles stay gray. The 0.45 radius and 0.8 max interpolation prevent the entire field from saturating.

**Feel:** Energy gathering, intent forming. The user sees the consequences of their lean.

### Mode 3: Stream

User clicks/taps a node. Particles flow horizontally through the selected node.

**Flow direction:** If left node selected, particles flow right-to-left (flowDir = -1). If right, left-to-right (flowDir = +1).

**The Y-Convergence Funnel:**

The key insight is that particles should be scattered on the entry side and converge into a tight stream as they approach and pass through the node. This is the "funnel" effect.

```
// Distance from node along flow axis (signed)
// Negative = on entry side, positive = past node
distToNode = flowDir < 0
  ? (nodeX - particleX)
  : (particleX - nodeX)

// Approach factor: 0 at far entry, 1 at node
approachT = clamp((distToNode + 0.5) / 0.5, 0, 1)

// Funnel strength increases as particle approaches node
funnelStrength = (0.0003 + approachT * 0.004) * selectionProgress

// Pull toward node's Y position
yDiff = nodeY - particleY
vy += yDiff * funnelStrength
vy *= 0.92

// Flow speed: slower on entry, faster near/past node
speedMult = 0.4 + approachT * 0.6
vx += (flowVx * speedMult - vx) * (0.03 + selProgress * 0.06)
```

**Entry-side scatter:** Particles far from the node get sinusoidal jitter to keep the field loose:

```
if (distToNode < -0.1) {
  vy += sin(time * 1.5 + phase) * 0.0003 * (1 - approachT)
  vx += cos(time * 0.8 + phase * 2) * 0.00008 * (1 - approachT)
}
```

**Post-node jitter:** Particles past the node get minimal jitter so the stream isn't a laser line:

```
vy += sin(time * 2 + phase) * 0.00005
```

**Respawning:** When a particle exits the canvas on the flow side, it respawns on the entry side with a wide Y spread:

```
// flowDir < 0 and particle.x < -0.02 → respawn at right edge
particle.x = 1.0 + random() * 0.15
particle.y = nodeY + (random() - 0.5) * 0.8
particle.vx = flowDir * baseFlowSpeed * 0.3
particle.vy = (random() - 0.5) * 0.0005
```

**Color in stream mode:** Transition from neutral on entry side to full selection color past the node.

```
// How far past the node (signed)
passedNode = flowDir < 0 ? (nodeX - particleX) : (particleX - nodeX)

if (passedNode > 0) {
  colorT = min(1, 0.6 + passedNode * 2)
} else {
  colorT = max(0, 1 + passedNode * 3) * 0.5
}
colorT *= selectionProgress

color = lerpColor(NEUTRAL, selectionColor, colorT)
```

**Hovering the unselected node:** Slows the stream to 20% speed (`flowSpeedMult = 0.2`). This gives the user a visual indication they could change their mind.

**Feel:** Commitment, flow, resolution. The choice has consequences. The stream has direction.

### Selection Progress

`selectionProgress` ramps from 0 to 1 at rate `dt * 1.8` (~0.6s to full). This gates all stream-mode behaviors so the transition from hover/ambient to stream is gradual, not a sudden snap.

### Node Rendering

Nodes are drawn as small squares (not circles — squares match the particle aesthetic).

```
States:
  Default:            7px, alpha 0.4, neutral gray
  Hovered:            10px, alpha 0.65, node color
  Selected:           12px, alpha 0.95, node color, glow (shadowBlur: 18)
  Unselected (after): 6px, alpha 0.15, neutral gray
  Hovering unselected: 9px, alpha 0.45, node color
```

### Labels

Labels are drawn below each node in a small sans-serif font. Multi-line wrapping is handled manually via `measureText`. Label opacity follows the same state logic as nodes.

## Extending to N-Way Decisions

The binary ForcedChoiceFork can be extended to 3+ options:

### Layout
- 3 options: triangle arrangement (top-center, bottom-left, bottom-right)
- 4 options: diamond or square corners
- 5+: radial arrangement at equal angles

### Flow Direction
Instead of left/right flow, particles stream radially inward toward the selected node from all edges.

### Color Differentiation
Each node needs a distinct color. Use hue separation: for N options, space hues evenly across the spectrum, then desaturate to keep the palette muted.

## Multi-Branch Extension

For paths that fork into completely different visual systems (not just a color change), see `examples/branching-flow.tsx`. In this pattern:

- Each branch has its own particle behavior (speed, turbulence, color palette)
- Selection transitions smoothly between branch behaviors via interpolation
- Unselected branch particles fade and slow over 800ms
- Selected branch particles accelerate and brighten

## iOS Implementation

### CAEmitterLayer Approach

```swift
let emitter = CAEmitterLayer()
emitter.emitterPosition = CGPoint(x: view.bounds.midX, y: view.bounds.midY)
emitter.emitterShape = .rectangle
emitter.emitterSize = view.bounds.size

let cell = CAEmitterCell()
cell.birthRate = 5
cell.lifetime = 3
cell.velocity = 20
cell.velocityRange = 10
cell.emissionRange = .pi * 2
cell.scale = 0.05
cell.scaleRange = 0.02
cell.color = UIColor.gray.cgColor
cell.alphaRange = 0.3
cell.alphaSpeed = -0.1

emitter.emitterCells = [cell]
view.layer.addSublayer(emitter)
```

Mode transitions require updating `emitterPosition`, `velocity`, `emissionRange`, and `color` dynamically based on gesture state.

### SwiftUI + Canvas Approach

```swift
Canvas { context, size in
  for particle in particles {
    let rect = CGRect(
      x: particle.x * size.width - particle.size / 2,
      y: particle.y * size.height - particle.size / 2,
      width: particle.size,
      height: particle.size
    )
    context.fill(Path(rect), with: .color(particle.color.opacity(particle.alpha)))
  }
}
.gesture(DragGesture(minimumDistance: 0)
  .onChanged { value in /* update hover state */ }
  .onEnded { value in /* trigger selection */ }
)
```

Update particle positions in a `TimelineView(.animation)` callback.
