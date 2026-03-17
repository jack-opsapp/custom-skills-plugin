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

export interface GraphNode {
  id: string;
  label: string;
  color?: string;
  radius?: number;
  mass?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
  weight?: number;
  color?: string;
}

export interface NetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width?: number;
  height?: number;
  /** Repulsion force between all node pairs */
  repulsion?: number;
  /** Attraction force along edges */
  attraction?: number;
  /** Centering force toward canvas center */
  centering?: number;
  /** Velocity damping 0–1 (lower = more damping) */
  damping?: number;
  /** Target rest length for edges */
  edgeLength?: number;
  /** Default node radius */
  defaultRadius?: number;
  /** Default node color */
  defaultNodeColor?: string;
  /** Default edge color */
  defaultEdgeColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Label color */
  labelColor?: string;
  /** Called when a node is clicked */
  onNodeClick?: (node: GraphNode) => void;
}

// ---------------------------------------------------------------------------
// Internal simulation types
// ---------------------------------------------------------------------------

interface SimNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  color: string;
  dragging: boolean;
}

interface SimConfig {
  repulsion: number;
  attraction: number;
  centering: number;
  damping: number;
  minDistance: number;
  maxVelocity: number;
  edgeLength: number;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

interface DragState {
  nodeId: string | null;
  isPanning: boolean;
  startX: number;
  startY: number;
  startTransformX: number;
  startTransformY: number;
}

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

// ---------------------------------------------------------------------------
// Physics simulation
// ---------------------------------------------------------------------------

function applyRepulsion(nodes: SimNode[], config: SimConfig) {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distSq = Math.max(
        dx * dx + dy * dy,
        config.minDistance * config.minDistance,
      );
      const dist = Math.sqrt(distSq);

      const force = config.repulsion / distSq;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (!a.dragging) {
        a.vx -= fx / a.mass;
        a.vy -= fy / a.mass;
      }
      if (!b.dragging) {
        b.vx += fx / b.mass;
        b.vy += fy / b.mass;
      }
    }
  }
}

function applyAttraction(
  nodes: SimNode[],
  edges: GraphEdge[],
  nodeMap: Map<string, SimNode>,
  config: SimConfig,
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

    if (!source.dragging) {
      source.vx += fx / source.mass;
      source.vy += fy / source.mass;
    }
    if (!target.dragging) {
      target.vx -= fx / target.mass;
      target.vy -= fy / target.mass;
    }
  }
}

function applyCentering(
  nodes: SimNode[],
  centerX: number,
  centerY: number,
  config: SimConfig,
) {
  for (const node of nodes) {
    if (node.dragging) continue;
    node.vx += (centerX - node.x) * config.centering;
    node.vy += (centerY - node.y) * config.centering;
  }
}

function integrate(nodes: SimNode[], config: SimConfig) {
  for (const node of nodes) {
    if (node.dragging) {
      node.vx = 0;
      node.vy = 0;
      continue;
    }

    node.vx *= config.damping;
    node.vy *= config.damping;

    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    if (speed > config.maxVelocity) {
      node.vx = (node.vx / speed) * config.maxVelocity;
      node.vy = (node.vy / speed) * config.maxVelocity;
    }

    node.x += node.vx;
    node.y += node.vy;
  }
}

function kineticEnergy(nodes: SimNode[]): number {
  return nodes.reduce(
    (sum, n) => sum + n.mass * (n.vx * n.vx + n.vy * n.vy),
    0,
  );
}

function simulationStep(
  nodes: SimNode[],
  edges: GraphEdge[],
  nodeMap: Map<string, SimNode>,
  config: SimConfig,
  centerX: number,
  centerY: number,
) {
  applyRepulsion(nodes, config);
  applyAttraction(nodes, edges, nodeMap, config);
  applyCentering(nodes, centerX, centerY, config);
  integrate(nodes, config);
}

// ---------------------------------------------------------------------------
// Canvas drawing
// ---------------------------------------------------------------------------

function drawGraph(
  ctx: CanvasRenderingContext2D,
  nodes: SimNode[],
  edges: GraphEdge[],
  nodeMap: Map<string, SimNode>,
  hoveredId: string | null,
  width: number,
  height: number,
  transform: Transform,
  defaultEdgeColor: string,
  labelColor: string,
) {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.scale, transform.scale);

  // Build connected-to-hovered set for fast lookup
  const connectedToHovered = new Set<string>();
  if (hoveredId) {
    connectedToHovered.add(hoveredId);
    for (const edge of edges) {
      if (edge.source === hoveredId) connectedToHovered.add(edge.target);
      if (edge.target === hoveredId) connectedToHovered.add(edge.source);
    }
  }

  // --- Edges ---
  for (const edge of edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) continue;

    const isHighlighted =
      hoveredId != null &&
      (edge.source === hoveredId || edge.target === hoveredId);

    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = isHighlighted
      ? (edge.color ?? "rgba(255,255,255,0.5)")
      : hoveredId != null
        ? "rgba(255,255,255,0.03)"
        : (defaultEdgeColor);
    ctx.lineWidth = isHighlighted ? 2 : 1;
    ctx.stroke();

    // Edge label on hover
    if (isHighlighted && edge.label) {
      const mx = (source.x + target.x) / 2;
      const my = (source.y + target.y) / 2;
      ctx.font = "10px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(edge.label, mx, my - 10);
    }
  }

  // --- Nodes ---
  for (const node of nodes) {
    const isHovered = hoveredId === node.id;
    const isConnected = connectedToHovered.has(node.id);

    const radius = isHovered ? node.radius * 1.3 : node.radius;
    const alpha =
      hoveredId == null || isHovered || isConnected ? 1 : 0.15;

    // Node circle
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = node.color;
    ctx.fill();

    // Glow ring on hover
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.25;
      ctx.stroke();
    }

    // Label
    ctx.globalAlpha = alpha;
    ctx.font = `${isHovered ? "bold " : ""}11px system-ui, sans-serif`;
    ctx.fillStyle = labelColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(node.label, node.x, node.y + radius + 5);

    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NetworkGraph({
  nodes: inputNodes,
  edges,
  width = 600,
  height = 400,
  repulsion = 5000,
  attraction = 0.005,
  centering = 0.01,
  damping = 0.9,
  edgeLength = 120,
  defaultRadius = 10,
  defaultNodeColor = "#597794",
  defaultEdgeColor = "rgba(255,255,255,0.08)",
  backgroundColor = "transparent",
  labelColor = "rgba(255,255,255,0.8)",
  onNodeClick,
}: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  // Stable refs for simulation state (avoids re-creating simulation on render)
  const simNodesRef = useRef<SimNode[]>([]);
  const nodeMapRef = useRef<Map<string, SimNode>>(new Map());
  const sleepingRef = useRef(false);
  const frameRef = useRef(0);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  hoveredIdRef.current = hoveredId;

  const [transform, setTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const dragRef = useRef<DragState>({
    nodeId: null,
    isPanning: false,
    startX: 0,
    startY: 0,
    startTransformX: 0,
    startTransformY: 0,
  });

  const config = useMemo<SimConfig>(
    () => ({
      repulsion,
      attraction,
      centering,
      damping,
      minDistance: 30,
      maxVelocity: 10,
      edgeLength,
    }),
    [repulsion, attraction, centering, damping, edgeLength],
  );

  // --- Initialize simulation nodes ---
  useEffect(() => {
    const centerX = width / 2;
    const centerY = height / 2;

    const simNodes: SimNode[] = inputNodes.map((n) => ({
      id: n.id,
      label: n.label,
      x: centerX + (Math.random() - 0.5) * 100,
      y: centerY + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0,
      radius: n.radius ?? defaultRadius,
      mass: n.mass ?? 1,
      color: n.color ?? defaultNodeColor,
      dragging: false,
    }));

    const nodeMap = new Map(simNodes.map((n) => [n.id, n]));

    if (reducedMotion) {
      // Pre-compute equilibrium
      for (let i = 0; i < 500; i++) {
        simulationStep(simNodes, edges, nodeMap, config, centerX, centerY);
      }
      for (const n of simNodes) {
        n.vx = 0;
        n.vy = 0;
      }
    }

    simNodesRef.current = simNodes;
    nodeMapRef.current = nodeMap;
    sleepingRef.current = reducedMotion;
  }, [inputNodes, edges, width, height, defaultRadius, defaultNodeColor, config, reducedMotion]);

  // --- DPI-aware canvas setup ---
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.scale(dpr, dpr);
    return ctx;
  }, [width, height]);

  // --- Animation loop ---
  useEffect(() => {
    const ctx = setupCanvas();
    if (!ctx) return;

    const centerX = width / 2;
    const centerY = height / 2;

    let running = true;

    function loop() {
      if (!running) return;

      const nodes = simNodesRef.current;
      const nodeMap = nodeMapRef.current;

      if (!sleepingRef.current) {
        simulationStep(nodes, edges, nodeMap, config, centerX, centerY);

        const isDragging = dragRef.current.nodeId != null;
        if (kineticEnergy(nodes) < 0.1 && !isDragging) {
          sleepingRef.current = true;
        }
      }

      // Always redraw (hover state may change even when sleeping)
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawGraph(
        ctx,
        nodes,
        edges,
        nodeMap,
        hoveredIdRef.current,
        width,
        height,
        transformRef.current,
        defaultEdgeColor,
        labelColor,
      );

      frameRef.current = requestAnimationFrame(loop);
    }

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [edges, config, width, height, setupCanvas, defaultEdgeColor, labelColor]);

  // --- Wake simulation ---
  const wake = useCallback(() => {
    sleepingRef.current = false;
  }, []);

  // --- Hit test ---
  const hitTest = useCallback(
    (clientX: number, clientY: number): SimNode | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const t = transformRef.current;
      const mouseX = (clientX - rect.left - t.x) / t.scale;
      const mouseY = (clientY - rect.top - t.y) / t.scale;

      for (const node of simNodesRef.current) {
        const dx = mouseX - node.x;
        const dy = mouseY - node.y;
        // Expanded hit area (1.5x radius)
        if (dx * dx + dy * dy <= node.radius * node.radius * 2.25) {
          return node;
        }
      }
      return null;
    },
    [],
  );

  // --- Pointer handlers ---
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const node = hitTest(e.clientX, e.clientY);

      if (node) {
        node.dragging = true;
        dragRef.current = {
          nodeId: node.id,
          isPanning: false,
          startX: e.clientX,
          startY: e.clientY,
          startTransformX: 0,
          startTransformY: 0,
        };
        wake();
      } else {
        const t = transformRef.current;
        dragRef.current = {
          nodeId: null,
          isPanning: true,
          startX: e.clientX,
          startY: e.clientY,
          startTransformX: t.x,
          startTransformY: t.y,
        };
      }

      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    },
    [hitTest, wake],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current;

      if (drag.nodeId) {
        // Dragging a node
        const t = transformRef.current;
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - t.x) / t.scale;
        const mouseY = (e.clientY - rect.top - t.y) / t.scale;

        const node = nodeMapRef.current.get(drag.nodeId);
        if (node) {
          node.x = mouseX;
          node.y = mouseY;
          node.vx = 0;
          node.vy = 0;
        }
        return;
      }

      if (drag.isPanning) {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        setTransform((prev) => ({
          ...prev,
          x: drag.startTransformX + dx,
          y: drag.startTransformY + dy,
        }));
        return;
      }

      // Hover detection
      const node = hitTest(e.clientX, e.clientY);
      setHoveredId(node?.id ?? null);
    },
    [hitTest],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current;

      if (drag.nodeId) {
        const node = nodeMapRef.current.get(drag.nodeId);
        if (node) node.dragging = false;

        // If the pointer barely moved, treat as click
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3 && onNodeClick) {
          const inputNode = inputNodes.find((n) => n.id === drag.nodeId);
          if (inputNode) onNodeClick(inputNode);
        }
      }

      dragRef.current = {
        nodeId: null,
        isPanning: false,
        startX: 0,
        startY: 0,
        startTransformX: 0,
        startTransformY: 0,
      };
    },
    [onNodeClick, inputNodes],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.08 : 1 / 1.08;

      setTransform((prev) => {
        const newScale = Math.max(0.1, Math.min(5, prev.scale * zoomFactor));
        const scaleChange = newScale / prev.scale;
        return {
          x: mouseX - (mouseX - prev.x) * scaleChange,
          y: mouseY - (mouseY - prev.y) * scaleChange,
          scale: newScale,
        };
      });
    },
    [],
  );

  // Cursor style
  const cursor = useMemo(() => {
    if (dragRef.current.nodeId) return "grabbing";
    if (dragRef.current.isPanning) return "grabbing";
    if (hoveredId) return "grab";
    return "default";
  }, [hoveredId]);

  // Accessible summary
  const ariaLabel = useMemo(
    () =>
      `Network graph with ${inputNodes.length} nodes and ${edges.length} connections. ` +
      `Nodes: ${inputNodes.map((n) => n.label).join(", ")}.`,
    [inputNodes, edges],
  );

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        background: backgroundColor,
      }}
      role="img"
      aria-label={ariaLabel}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          cursor,
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Hidden table for screen readers */}
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
        <caption>Network graph connections</caption>
        <thead>
          <tr>
            <th scope="col">From</th>
            <th scope="col">To</th>
            <th scope="col">Label</th>
          </tr>
        </thead>
        <tbody>
          {edges.map((edge, i) => (
            <tr key={i}>
              <td>
                {inputNodes.find((n) => n.id === edge.source)?.label ??
                  edge.source}
              </td>
              <td>
                {inputNodes.find((n) => n.id === edge.target)?.label ??
                  edge.target}
              </td>
              <td>{edge.label ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
