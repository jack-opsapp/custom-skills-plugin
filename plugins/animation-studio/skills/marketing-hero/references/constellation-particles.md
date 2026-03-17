# Constellation & Particle Fields — Reference

Interactive node networks and particle systems for hero sections and marketing surfaces. Two primary implementation paths: React Three Fiber for high-count, high-fidelity deployments, and Canvas 2D for lightweight alternatives.

---

## 1. Core Concepts

### Node Network Anatomy

A constellation field consists of three visual layers:

1. **Nodes** — Individual points rendered as circles (Canvas 2D) or instanced spheres/sprites (R3F). Each node has a position, velocity, radius, color, and optional data payload (for tooltips/labels).
2. **Connections** — Lines drawn between nodes that are within a configurable distance threshold. Line opacity fades as distance increases, creating an organic connect/disconnect effect as nodes drift.
3. **Interaction zone** — An invisible area around the cursor/touch point that influences node behavior. Nodes within the interaction radius are attracted toward the pointer (or repelled, depending on configuration).

### Physics Model

Nodes move continuously with individual velocity vectors. The physics is deliberately simple — no gravity, no collision, no complex force fields. The goal is organic drift, not simulation.

```
For each node, per frame:
  1. Apply base velocity (drift)
  2. Apply boundary wrapping or bounce
  3. Apply interaction force (attraction toward cursor, falloff by distance²)
  4. Clamp velocity to max speed
  5. Update position
```

### Connection Algorithm

Every frame, check pairwise distances between nodes. For N nodes this is O(N²) — acceptable up to ~500 nodes on Canvas 2D, ~2000 on R3F with spatial optimization.

```
For each pair (i, j) where i < j:
  distance = dist(nodes[i], nodes[j])
  if distance < connectionRadius:
    opacity = 1 - (distance / connectionRadius)
    draw line from nodes[i] to nodes[j] at opacity
```

For high node counts (1000+), use spatial hashing or a grid-based neighbor lookup to reduce the O(N²) to O(N * k) where k is the average number of nearby nodes.

---

## 2. React Three Fiber Implementation (Recommended for 200+ nodes)

### Why R3F

Instanced meshes render thousands of nodes in a single draw call. Connection lines use a single `THREE.BufferGeometry` with dynamic vertex updates. The GPU handles the rendering — the CPU only updates positions and connection topology.

### Architecture

```
<Canvas>
  <ConstellationScene>
    <InstancedNodes />      ← Single InstancedMesh for all nodes
    <ConnectionLines />     ← Single LineSegments geometry, updated per frame
    <InteractionTracker />  ← Invisible plane that tracks pointer via raycasting
  </ConstellationScene>
</Canvas>
```

### Instanced Nodes Pattern

```typescript
// Node data stored in typed arrays for GPU upload
const positions = new Float32Array(count * 3);  // x, y, z per node
const colors = new Float32Array(count * 3);     // r, g, b per node
const scales = new Float32Array(count);         // radius per node

// InstancedMesh with a small sphere geometry
<instancedMesh ref={meshRef} args={[geometry, material, count]}>
  <sphereGeometry args={[1, 8, 8]} />
  <meshBasicMaterial />
</instancedMesh>

// Per-frame update: set each instance's matrix
useFrame(() => {
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    matrix.makeTranslation(positions[i*3], positions[i*3+1], positions[i*3+2]);
    matrix.scale(new THREE.Vector3(scales[i], scales[i], scales[i]));
    meshRef.current.setMatrixAt(i, matrix);
    color.setRGB(colors[i*3], colors[i*3+1], colors[i*3+2]);
    meshRef.current.setColorAt(i, color);
  }
  meshRef.current.instanceMatrix.needsUpdate = true;
  meshRef.current.instanceColor.needsUpdate = true;
});
```

### Connection Lines Pattern

```typescript
// Pre-allocate buffer for maximum possible connections
const maxConnections = count * 6; // heuristic: ~6 connections per node max
const linePositions = new Float32Array(maxConnections * 2 * 3); // 2 endpoints × 3 coords
const lineColors = new Float32Array(maxConnections * 2 * 4);    // 2 endpoints × RGBA

// Per-frame: rebuild connection topology
useFrame(() => {
  let lineIndex = 0;
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const dx = positions[i*3] - positions[j*3];
      const dy = positions[i*3+1] - positions[j*3+1];
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < connectionRadius) {
        const alpha = 1 - dist / connectionRadius;
        // Set start point
        linePositions[lineIndex * 6] = positions[i*3];
        linePositions[lineIndex * 6 + 1] = positions[i*3+1];
        linePositions[lineIndex * 6 + 2] = 0;
        // Set end point
        linePositions[lineIndex * 6 + 3] = positions[j*3];
        linePositions[lineIndex * 6 + 4] = positions[j*3+1];
        linePositions[lineIndex * 6 + 5] = 0;
        // Set colors with alpha
        for (let c = 0; c < 2; c++) {
          lineColors[(lineIndex * 2 + c) * 4] = lineColor.r;
          lineColors[(lineIndex * 2 + c) * 4 + 1] = lineColor.g;
          lineColors[(lineIndex * 2 + c) * 4 + 2] = lineColor.b;
          lineColors[(lineIndex * 2 + c) * 4 + 3] = alpha * maxLineOpacity;
        }
        lineIndex++;
      }
    }
  }
  // Update draw range to only render active connections
  lineGeometry.setDrawRange(0, lineIndex * 2);
  lineGeometry.attributes.position.needsUpdate = true;
  lineGeometry.attributes.color.needsUpdate = true;
});
```

### Pointer Interaction Pattern

```typescript
// Invisible plane at z=0 for raycasting
<mesh visible={false} onPointerMove={(e) => {
  mousePosition.current.set(e.point.x, e.point.y);
}}>
  <planeGeometry args={[100, 100]} />
  <meshBasicMaterial />
</mesh>

// In physics update, apply attraction force
const dx = mousePosition.current.x - positions[i*3];
const dy = mousePosition.current.y - positions[i*3+1];
const distToMouse = Math.sqrt(dx*dx + dy*dy);
if (distToMouse < interactionRadius && distToMouse > 0.1) {
  const force = interactionStrength / (distToMouse * distToMouse);
  velocities[i*2] += (dx / distToMouse) * force * delta;
  velocities[i*2+1] += (dy / distToMouse) * force * delta;
}
```

### Performance Optimization

- **Pre-allocate all typed arrays** at initialization. Never allocate during the render loop.
- **Reuse THREE.Matrix4, THREE.Vector3, THREE.Color** — create once outside the loop, reuse inside.
- **Spatial hashing for connections**: Divide the field into grid cells. Only check connections between nodes in the same or adjacent cells. Reduces O(N²) to O(N*k).
- **frameloop="demand"**: Use `invalidate()` only when nodes have moved significantly. For slow-moving constellations, this can cut GPU work by 50%+.
- **Intersection Observer**: Pause the entire Canvas when it scrolls out of view.

```typescript
const gridSize = connectionRadius;
const grid: Map<string, number[]> = new Map();

function getGridKey(x: number, y: number): string {
  return `${Math.floor(x / gridSize)},${Math.floor(y / gridSize)}`;
}

// Build grid
for (let i = 0; i < count; i++) {
  const key = getGridKey(positions[i*3], positions[i*3+1]);
  if (!grid.has(key)) grid.set(key, []);
  grid.get(key)!.push(i);
}

// Check only adjacent cells
const offsets = [
  [0,0], [1,0], [0,1], [1,1],
  [-1,0], [0,-1], [-1,-1], [1,-1], [-1,1]
];
```

---

## 3. Canvas 2D Implementation (Lightweight alternative, sub-200 nodes)

### When to Use

- Node count under 200
- No need for 3D depth or post-processing
- Bundle size is critical (0KB vs ~170KB for R3F + Three.js)
- Target audience includes low-end mobile devices

### Architecture

```typescript
// Single canvas element, single requestAnimationFrame loop
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d')!;

function animate() {
  ctx.clearRect(0, 0, width, height);
  updatePhysics(deltaTime);
  drawConnections(ctx);
  drawNodes(ctx);
  rafId = requestAnimationFrame(animate);
}
```

### DPI-Aware Setup

```typescript
function setupCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
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

### Drawing Nodes (Canvas 2D)

```typescript
function drawNodes(ctx: CanvasRenderingContext2D) {
  for (let i = 0; i < count; i++) {
    ctx.beginPath();
    ctx.arc(positions[i*2], positions[i*2+1], radii[i], 0, Math.PI * 2);
    ctx.fillStyle = nodeColor;
    ctx.fill();
  }
}
```

### Drawing Connections (Canvas 2D)

```typescript
function drawConnections(ctx: CanvasRenderingContext2D) {
  ctx.lineWidth = 1;
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const dx = positions[i*2] - positions[j*2];
      const dy = positions[i*2+1] - positions[j*2+1];
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < connectionRadius) {
        const alpha = (1 - dist / connectionRadius) * maxLineOpacity;
        ctx.beginPath();
        ctx.moveTo(positions[i*2], positions[i*2+1]);
        ctx.lineTo(positions[j*2], positions[j*2+1]);
        ctx.strokeStyle = `rgba(${lineR}, ${lineG}, ${lineB}, ${alpha})`;
        ctx.stroke();
      }
    }
  }
}
```

### Pointer Tracking (Canvas 2D)

```typescript
canvas.addEventListener('pointermove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
  mouseActive = true;
});

canvas.addEventListener('pointerleave', () => {
  mouseActive = false;
});
```

---

## 4. Tooltip / Label Pattern

When nodes carry data (team members, features, metrics), display a tooltip on hover nearest node.

```typescript
// Find nearest node to cursor
let nearestIdx = -1;
let nearestDist = Infinity;
for (let i = 0; i < count; i++) {
  const dx = mouseX - positions[i*2];
  const dy = mouseY - positions[i*2+1];
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist < tooltipRadius && dist < nearestDist) {
    nearestDist = dist;
    nearestIdx = i;
  }
}

// Render tooltip as a DOM overlay positioned absolutely
if (nearestIdx >= 0) {
  tooltipEl.style.transform = `translate(${positions[nearestIdx*2]}px, ${positions[nearestIdx*2+1] - 20}px)`;
  tooltipEl.textContent = nodeData[nearestIdx].label;
  tooltipEl.style.opacity = '1';
} else {
  tooltipEl.style.opacity = '0';
}
```

---

## 5. Reduced Motion Alternative

For `prefers-reduced-motion: reduce`, replace the animated constellation with a static version:

- Render nodes at their initial positions with no drift
- Draw all connections at their initial state (no formation/dissolution)
- Disable pointer interaction (no attraction effect)
- Apply a slow, gentle opacity pulse (2s cycle, 0.7-1.0 opacity) to the entire canvas — this creates "alive" without motion

```typescript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (prefersReducedMotion) {
  // Draw once, then only pulse opacity
  drawStaticFrame();
  function pulseOpacity() {
    const t = (Math.sin(Date.now() / 2000) + 1) / 2;
    canvas.style.opacity = `${0.7 + t * 0.3}`;
    requestAnimationFrame(pulseOpacity);
  }
  pulseOpacity();
} else {
  animate(); // full animation loop
}
```

---

## 6. Configuration Interface

Every constellation field should accept these configuration props:

```typescript
interface ConstellationConfig {
  /** Array of node data. Length determines node count. */
  nodes: Array<{ id: string; label?: string; color?: string; radius?: number }>;

  /** Maximum distance between nodes for a connection line to appear. Default: 150 */
  connectionRadius?: number;

  /** Maximum opacity of connection lines. Default: 0.3 */
  connectionOpacity?: number;

  /** Color of connection lines. Default: brand primary */
  connectionColor?: string;

  /** Default node color (overridden by per-node color). Default: brand primary */
  nodeColor?: string;

  /** Default node radius (overridden by per-node radius). Default: 3 */
  nodeRadius?: number;

  /** Radius of cursor interaction zone. Default: 200 */
  interactionRadius?: number;

  /** Strength of cursor attraction. 0 = no interaction. Default: 0.5 */
  interactionStrength?: number;

  /** Base drift speed of nodes. Default: 0.3 */
  driftSpeed?: number;

  /** Maximum drift speed (prevents runaway velocity). Default: 1.5 */
  maxSpeed?: number;

  /** Background color. Default: transparent */
  backgroundColor?: string;

  /** Whether to wrap nodes at boundaries or bounce them. Default: 'wrap' */
  boundaryMode?: 'wrap' | 'bounce';

  /** Tooltip radius — how close cursor must be to show a node's label. Default: 30 */
  tooltipRadius?: number;

  /** CSS class for the container. */
  className?: string;
}
```
