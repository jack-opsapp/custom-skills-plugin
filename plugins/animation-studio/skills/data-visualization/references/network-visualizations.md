# Network Visualizations — Detailed Reference

Network visualizations display relationships between entities. Nodes are things. Edges are connections. The animation's job is to reveal structure — clusters, hierarchies, flows, and outliers — that raw adjacency lists cannot communicate. This reference covers force-directed graphs, relationship maps, org charts, and flow diagrams.

---

## Force-Directed Graphs

The most versatile network layout. Nodes repel each other (preventing overlap), connected nodes attract each other (forming clusters), and a centering force keeps everything on screen. The physics simulation runs until equilibrium, producing an organic layout that reveals community structure.

### Physics Model

Three forces act on every node every frame:

**1. Repulsion (Coulomb's Law)**
Every node pushes every other node away. The force magnitude is inversely proportional to the square of the distance. This prevents overlap and creates spacing.

```typescript
interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  label: string;
  color: string;
  /** Pinned nodes ignore forces */
  pinned?: boolean;
  /** Currently being dragged */
  dragging?: boolean;
}

interface Edge {
  source: string;
  target: string;
  weight?: number;
  color?: string;
  label?: string;
}

interface ForceConfig {
  /** Repulsion strength between all node pairs */
  repulsion: number;
  /** Attraction strength along edges */
  attraction: number;
  /** Centering force pulling toward center */
  centering: number;
  /** Velocity damping per frame (0-1, lower = more damping) */
  damping: number;
  /** Minimum distance for repulsion calculation (prevents division by near-zero) */
  minDistance: number;
  /** Maximum velocity magnitude */
  maxVelocity: number;
  /** Target rest length for edges */
  edgeLength: number;
}

const DEFAULT_FORCE_CONFIG: ForceConfig = {
  repulsion: 5000,
  attraction: 0.005,
  centering: 0.01,
  damping: 0.9,
  minDistance: 30,
  maxVelocity: 10,
  edgeLength: 120,
};

function applyRepulsion(nodes: Node[], config: ForceConfig) {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];

      if (a.pinned && b.pinned) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distSq = Math.max(dx * dx + dy * dy, config.minDistance * config.minDistance);
      const dist = Math.sqrt(distSq);

      const force = config.repulsion / distSq;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (!a.pinned && !a.dragging) {
        a.vx -= fx / a.mass;
        a.vy -= fy / a.mass;
      }
      if (!b.pinned && !b.dragging) {
        b.vx += fx / b.mass;
        b.vy += fy / b.mass;
      }
    }
  }
}
```

**2. Attraction (Hooke's Law)**
Connected nodes pull toward each other. The force is proportional to the distance beyond the rest length. This forms clusters of connected nodes.

```typescript
function applyAttraction(
  nodes: Node[],
  edges: Edge[],
  nodeMap: Map<string, Node>,
  config: ForceConfig
) {
  for (const edge of edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) continue;

    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const displacement = dist - config.edgeLength;
    const force = config.attraction * displacement * (edge.weight ?? 1);
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;

    if (!source.pinned && !source.dragging) {
      source.vx += fx / source.mass;
      source.vy += fy / source.mass;
    }
    if (!target.pinned && !target.dragging) {
      target.vx -= fx / target.mass;
      target.vy -= fy / target.mass;
    }
  }
}
```

**3. Centering Force**
A gentle pull toward the center of the canvas prevents the graph from drifting off-screen.

```typescript
function applyCentering(
  nodes: Node[],
  centerX: number,
  centerY: number,
  config: ForceConfig
) {
  for (const node of nodes) {
    if (node.pinned || node.dragging) continue;

    node.vx += (centerX - node.x) * config.centering;
    node.vy += (centerY - node.y) * config.centering;
  }
}
```

### Simulation Loop

The simulation runs in a `requestAnimationFrame` loop. Each frame: apply forces, integrate velocity, apply damping, draw.

```typescript
function simulationStep(
  nodes: Node[],
  edges: Edge[],
  nodeMap: Map<string, Node>,
  config: ForceConfig,
  centerX: number,
  centerY: number
) {
  // Apply forces
  applyRepulsion(nodes, config);
  applyAttraction(nodes, edges, nodeMap, config);
  applyCentering(nodes, centerX, centerY, config);

  // Integrate and damp
  for (const node of nodes) {
    if (node.pinned || node.dragging) {
      node.vx = 0;
      node.vy = 0;
      continue;
    }

    // Apply damping
    node.vx *= config.damping;
    node.vy *= config.damping;

    // Clamp velocity
    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    if (speed > config.maxVelocity) {
      node.vx = (node.vx / speed) * config.maxVelocity;
      node.vy = (node.vy / speed) * config.maxVelocity;
    }

    // Integrate
    node.x += node.vx;
    node.y += node.vy;
  }
}

// Kinetic energy — when this drops below threshold, simulation can sleep
function kineticEnergy(nodes: Node[]): number {
  return nodes.reduce(
    (sum, n) => sum + n.mass * (n.vx * n.vx + n.vy * n.vy),
    0
  );
}
```

### Canvas Rendering

Force-directed graphs use Canvas for rendering — the number of nodes and edges, plus the continuous simulation, demands GPU-accelerated pixel rendering. SVG becomes janky above ~50 nodes.

```typescript
function drawGraph(
  ctx: CanvasRenderingContext2D,
  nodes: Node[],
  edges: Edge[],
  nodeMap: Map<string, Node>,
  hoveredNodeId: string | null,
  width: number,
  height: number,
  transform: { x: number; y: number; scale: number }
) {
  ctx.clearRect(0, 0, width, height);
  ctx.save();

  // Apply pan/zoom transform
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.scale, transform.scale);

  // Draw edges
  for (const edge of edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) continue;

    const isHighlighted =
      hoveredNodeId === edge.source || hoveredNodeId === edge.target;

    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = isHighlighted
      ? (edge.color ?? 'rgba(255,255,255,0.6)')
      : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = isHighlighted ? 2 : 1;
    ctx.stroke();

    // Edge label (only on hover)
    if (isHighlighted && edge.label) {
      const mx = (source.x + target.x) / 2;
      const my = (source.y + target.y) / 2;
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(edge.label, mx, my - 8);
    }
  }

  // Draw nodes
  for (const node of nodes) {
    const isHovered = hoveredNodeId === node.id;
    const isConnectedToHovered =
      hoveredNodeId != null &&
      edges.some(
        (e) =>
          (e.source === hoveredNodeId && e.target === node.id) ||
          (e.target === hoveredNodeId && e.source === node.id)
      );

    const radius = isHovered ? node.radius * 1.3 : node.radius;
    const alpha =
      hoveredNodeId == null || isHovered || isConnectedToHovered ? 1 : 0.2;

    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = node.color;
    ctx.globalAlpha = alpha;
    ctx.fill();

    // Glow on hover
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
    }

    ctx.globalAlpha = alpha;

    // Label
    ctx.font = `${isHovered ? 'bold ' : ''}11px sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(node.label, node.x, node.y + radius + 4);

    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
```

### Interaction: Drag Nodes

Users can drag nodes to manually adjust the layout. While dragging, the node's position follows the cursor and its velocity is zeroed. Connected nodes respond naturally through the physics simulation — they're pulled toward the dragged node's new position.

```typescript
interface DragState {
  nodeId: string | null;
  offsetX: number;
  offsetY: number;
}

function handleMouseDown(
  e: MouseEvent,
  nodes: Node[],
  transform: { x: number; y: number; scale: number },
  dragState: React.MutableRefObject<DragState>
) {
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const mouseX = (e.clientX - rect.left - transform.x) / transform.scale;
  const mouseY = (e.clientY - rect.top - transform.y) / transform.scale;

  // Hit test — find node under cursor
  for (const node of nodes) {
    const dx = mouseX - node.x;
    const dy = mouseY - node.y;
    if (dx * dx + dy * dy <= node.radius * node.radius * 1.5) {
      dragState.current = {
        nodeId: node.id,
        offsetX: node.x - mouseX,
        offsetY: node.y - mouseY,
      };
      node.dragging = true;
      return;
    }
  }

  // No node hit — start panning
  dragState.current = {
    nodeId: null,
    offsetX: e.clientX - transform.x,
    offsetY: e.clientY - transform.y,
  };
}

function handleMouseMove(
  e: MouseEvent,
  nodes: Node[],
  nodeMap: Map<string, Node>,
  transform: { x: number; y: number; scale: number },
  dragState: React.MutableRefObject<DragState>,
  setTransform: (t: { x: number; y: number; scale: number }) => void,
  setHoveredNodeId: (id: string | null) => void
) {
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const mouseX = (e.clientX - rect.left - transform.x) / transform.scale;
  const mouseY = (e.clientY - rect.top - transform.y) / transform.scale;

  if (dragState.current.nodeId) {
    // Dragging a node
    const node = nodeMap.get(dragState.current.nodeId);
    if (node) {
      node.x = mouseX + dragState.current.offsetX;
      node.y = mouseY + dragState.current.offsetY;
      node.vx = 0;
      node.vy = 0;
    }
    return;
  }

  if (e.buttons === 1 && dragState.current.offsetX !== 0) {
    // Panning
    setTransform({
      ...transform,
      x: e.clientX - dragState.current.offsetX,
      y: e.clientY - dragState.current.offsetY,
    });
    return;
  }

  // Hover detection
  let found: string | null = null;
  for (const node of nodes) {
    const dx = mouseX - node.x;
    const dy = mouseY - node.y;
    if (dx * dx + dy * dy <= node.radius * node.radius * 1.5) {
      found = node.id;
      break;
    }
  }
  setHoveredNodeId(found);
}

function handleMouseUp(
  nodes: Node[],
  nodeMap: Map<string, Node>,
  dragState: React.MutableRefObject<DragState>
) {
  if (dragState.current.nodeId) {
    const node = nodeMap.get(dragState.current.nodeId);
    if (node) node.dragging = false;
  }
  dragState.current = { nodeId: null, offsetX: 0, offsetY: 0 };
}
```

### Interaction: Zoom / Pan

Scroll wheel zooms. Click+drag on empty space pans. Pinch-to-zoom on touch.

```typescript
function handleWheel(
  e: WheelEvent,
  transform: { x: number; y: number; scale: number },
  setTransform: (t: { x: number; y: number; scale: number }) => void
) {
  e.preventDefault();

  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  const newScale = Math.max(0.1, Math.min(5, transform.scale * zoomFactor));

  // Zoom toward cursor position
  const scaleChange = newScale / transform.scale;
  setTransform({
    x: mouseX - (mouseX - transform.x) * scaleChange,
    y: mouseY - (mouseY - transform.y) * scaleChange,
    scale: newScale,
  });
}
```

### Interaction: Hover to Highlight Connections

When a node is hovered, its direct connections (edges and neighbor nodes) highlight. All other nodes and edges dim to 20% opacity. This reveals the local neighborhood of the hovered node.

The highlighting is computed per-frame in the draw function (see `drawGraph` above) based on the `hoveredNodeId` state.

### Entry Animation

Nodes do not appear at their equilibrium positions immediately. They enter from the center of the canvas (or from random positions near center) and the simulation spreads them out organically.

**Pattern:**
1. All nodes start at center with random offsets of +/-50px
2. Simulation starts immediately
3. Nodes drift outward under repulsion forces and settle into equilibrium
4. Total settlement time: 1-3 seconds depending on graph complexity

For reduced motion: pre-compute equilibrium positions by running the simulation for 500 iterations off-screen, then render the final state immediately.

```typescript
function initializeNodePositions(
  nodes: Node[],
  centerX: number,
  centerY: number,
  reducedMotion: boolean,
  edges: Edge[],
  config: ForceConfig
) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Start near center
  for (const node of nodes) {
    node.x = centerX + (Math.random() - 0.5) * 100;
    node.y = centerY + (Math.random() - 0.5) * 100;
    node.vx = 0;
    node.vy = 0;
  }

  if (reducedMotion) {
    // Pre-compute equilibrium
    for (let i = 0; i < 500; i++) {
      simulationStep(nodes, edges, nodeMap, config, centerX, centerY);
    }
    // Zero out velocities
    for (const node of nodes) {
      node.vx = 0;
      node.vy = 0;
    }
  }
}
```

---

## Relationship Maps

A specialized network visualization where edge types and directions matter. Examples: dependency graphs, influence maps, communication flows.

### Directed Edges

Arrows indicate direction. Use a triangular arrowhead at the target end.

```typescript
function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  targetRadius: number,
  arrowSize: number = 8
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);

  // Position arrowhead at edge of target node
  const tipX = toX - Math.cos(angle) * targetRadius;
  const tipY = toY - Math.sin(angle) * targetRadius;

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(
    tipX - arrowSize * Math.cos(angle - Math.PI / 6),
    tipY - arrowSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    tipX - arrowSize * Math.cos(angle + Math.PI / 6),
    tipY - arrowSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}
```

### Edge Types

Different relationships are encoded by edge style:

| Relationship | Visual | Canvas Implementation |
|-------------|--------|----------------------|
| Strong / primary | Solid line, 2px | `ctx.setLineDash([])` |
| Weak / secondary | Dashed line, 1px | `ctx.setLineDash([4, 4])` |
| Bidirectional | Solid line, arrows both ends | Two arrowheads |
| Hierarchical | Thick line, single arrow | 3px line + arrowhead |

### Animated Data Flow

For flow diagrams where data moves along edges, animate particles traveling along edge paths.

```typescript
interface FlowParticle {
  edgeIndex: number;
  progress: number; // 0-1 along the edge
  speed: number;    // progress per second
  color: string;
  radius: number;
}

function updateFlowParticles(particles: FlowParticle[], dt: number) {
  for (const p of particles) {
    p.progress += p.speed * dt;
    if (p.progress > 1) p.progress -= 1; // Loop
  }
}

function drawFlowParticle(
  ctx: CanvasRenderingContext2D,
  particle: FlowParticle,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
) {
  const x = sourceX + (targetX - sourceX) * particle.progress;
  const y = sourceY + (targetY - sourceY) * particle.progress;

  ctx.beginPath();
  ctx.arc(x, y, particle.radius, 0, Math.PI * 2);
  ctx.fillStyle = particle.color;
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(particle.progress * Math.PI);
  ctx.fill();
  ctx.globalAlpha = 1;
}
```

---

## Org Charts

Hierarchical tree layouts where each node has at most one parent. The layout is computed top-down (or left-to-right), not by physics simulation.

### Tree Layout Algorithm

```typescript
interface TreeNode {
  id: string;
  label: string;
  children: TreeNode[];
  // Computed layout positions
  x: number;
  y: number;
  width: number;
}

function layoutTree(
  root: TreeNode,
  nodeWidth: number,
  nodeHeight: number,
  horizontalGap: number,
  verticalGap: number
): void {
  // First pass: compute subtree widths bottom-up
  function computeWidth(node: TreeNode): number {
    if (node.children.length === 0) {
      node.width = nodeWidth;
      return nodeWidth;
    }

    const childrenWidth = node.children.reduce(
      (sum, child) => sum + computeWidth(child) + horizontalGap,
      -horizontalGap
    );

    node.width = Math.max(nodeWidth, childrenWidth);
    return node.width;
  }

  computeWidth(root);

  // Second pass: assign positions top-down
  function assignPositions(
    node: TreeNode,
    x: number,
    y: number,
    availableWidth: number
  ) {
    node.x = x + availableWidth / 2;
    node.y = y;

    if (node.children.length === 0) return;

    const totalChildrenWidth = node.children.reduce(
      (sum, child) => sum + child.width + horizontalGap,
      -horizontalGap
    );

    let childX = x + (availableWidth - totalChildrenWidth) / 2;

    for (const child of node.children) {
      assignPositions(child, childX, y + nodeHeight + verticalGap, child.width);
      childX += child.width + horizontalGap;
    }
  }

  assignPositions(root, 0, 0, root.width);
}
```

### Animated Connections

Parent-to-child connections draw with a line animation (stroke-dashoffset technique adapted for Canvas, or SVG if node count is low). Connections draw top-down, staggered by depth level:

1. Root node appears (200ms fade)
2. Connections to level-1 children draw (300ms each)
3. Level-1 nodes appear (200ms fade, staggered 50ms)
4. Connections to level-2 draw (300ms each)
5. Level-2 nodes appear... and so on.

**Timing per depth:** `depth * 350ms` offset.

### Expand/Collapse

Clicking a node expands or collapses its subtree. The collapsed subtree fades out (200ms) while the remaining tree repositions with smooth layout animation (400ms, `cubicInOut`). Expanding reverses: tree repositions to make room, then children fade in.

---

## Performance Considerations

### Node Count Thresholds

| Node Count | Recommended Approach |
|-----------|---------------------|
| 1-50 | SVG or Canvas, either works |
| 50-500 | Canvas required, full physics sim |
| 500-2000 | Canvas with spatial indexing (quadtree) for repulsion calculation |
| 2000+ | WebGL (via regl, PixiJS, or custom shaders), Barnes-Hut approximation for n-body forces |

### Quadtree Optimization for Large Graphs

For graphs with 500+ nodes, pairwise repulsion calculation is O(n^2). Use a quadtree (Barnes-Hut algorithm) to reduce this to O(n log n).

```typescript
interface QuadTreeNode {
  x: number;
  y: number;
  mass: number;
  children: (QuadTreeNode | null)[];
  bounds: { x: number; y: number; width: number; height: number };
  isLeaf: boolean;
  body: Node | null;
}

// Barnes-Hut: if the quadtree cell's width / distance-to-cell < theta (0.5-0.9),
// treat the entire cell as a single point mass at its center of mass.
// This reduces O(n^2) to O(n log n) with minimal accuracy loss.
const THETA = 0.7;

function shouldApproximate(
  node: QuadTreeNode,
  targetX: number,
  targetY: number
): boolean {
  const dx = node.x - targetX;
  const dy = node.y - targetY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return node.bounds.width / dist < THETA;
}
```

### Simulation Sleeping

When kinetic energy drops below a threshold, stop the simulation loop. Restart it when:
- The user drags a node
- Data changes (nodes/edges added/removed)
- The window resizes

```typescript
const ENERGY_THRESHOLD = 0.1;

// In the animation loop:
const energy = kineticEnergy(nodes);
if (energy < ENERGY_THRESHOLD && !isDragging) {
  // Stop the simulation — save CPU/battery
  simulationSleeping = true;
  return; // Don't requestAnimationFrame
}
```

### Touch Support

Force-directed graphs on mobile require adapted interactions:

| Desktop | Mobile |
|---------|--------|
| Hover to highlight | Tap to select/highlight |
| Click + drag node | Touch + drag node |
| Click + drag empty = pan | Touch + drag empty = pan |
| Scroll wheel = zoom | Pinch = zoom |
| — | Double-tap = zoom to fit |

Touch events must account for the pan/zoom transform to correctly hit-test nodes.

---

## Reduced Motion

For reduced motion preferences:

1. **Force-directed graphs:** Pre-compute equilibrium positions by running 500 simulation iterations synchronously. Render final state immediately. No simulation animation.
2. **Flow particles:** Hide particle animations. Show static directional arrows instead.
3. **Org chart expansion:** Use crossfade (opacity) instead of layout repositioning animations.
4. **Hover highlights:** Keep the highlight effect (it is informational, not motion). Apply it instantly instead of with a transition.
