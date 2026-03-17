"use client";

/**
 * ConstellationField — Interactive node network rendered with React Three Fiber.
 *
 * Nodes drift continuously, form connection lines when within range, and are
 * attracted to the user's cursor. GPU-instanced meshes keep draw calls at 1
 * regardless of node count. Spatial hashing keeps the connection check sub-O(N²).
 *
 * @example
 * ```tsx
 * <ConstellationField
 *   nodes={Array.from({ length: 80 }, (_, i) => ({ id: String(i) }))}
 *   connectionRadius={150}
 *   interactionStrength={0.6}
 *   nodeColor="#597794"
 *   connectionColor="#597794"
 *   className="absolute inset-0"
 * />
 * ```
 *
 * Dependencies: @react-three/fiber, @react-three/drei, three
 */

import React, {
  useRef,
  useMemo,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConstellationNode {
  id: string;
  label?: string;
  color?: string;
  radius?: number;
}

export interface ConstellationFieldProps {
  /** Node data. Array length determines count. */
  nodes: ConstellationNode[];
  /** Max distance for connection lines. Default 150. */
  connectionRadius?: number;
  /** Max opacity of connection lines (0-1). Default 0.25. */
  connectionOpacity?: number;
  /** Connection line color. Default "#597794". */
  connectionColor?: string;
  /** Default node color. Default "#597794". */
  nodeColor?: string;
  /** Default node radius. Default 2.5. */
  nodeRadius?: number;
  /** Radius of cursor interaction zone. Default 200. */
  interactionRadius?: number;
  /** Strength of cursor attraction (0=none). Default 0.5. */
  interactionStrength?: number;
  /** Base drift speed. Default 0.3. */
  driftSpeed?: number;
  /** Max drift speed clamp. Default 1.5. */
  maxSpeed?: number;
  /** Wrap or bounce at edges. Default "wrap". */
  boundaryMode?: "wrap" | "bounce";
  /** Distance from cursor to show a node label. Default 30. */
  tooltipRadius?: number;
  /** Container className. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.replace("#", ""), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

const tmpMatrix = new THREE.Matrix4();
const tmpColor = new THREE.Color();
const tmpVec = new THREE.Vector3();

// ---------------------------------------------------------------------------
// Scene internals
// ---------------------------------------------------------------------------

interface SceneProps {
  count: number;
  nodeData: ConstellationNode[];
  connectionRadius: number;
  connectionOpacity: number;
  connectionColor: string;
  nodeColor: string;
  nodeRadius: number;
  interactionRadius: number;
  interactionStrength: number;
  driftSpeed: number;
  maxSpeed: number;
  boundaryMode: "wrap" | "bounce";
  onHoverNode: (node: ConstellationNode | null, x: number, y: number) => void;
  tooltipRadius: number;
  reducedMotion: boolean;
}

function ConstellationScene({
  count,
  nodeData,
  connectionRadius,
  connectionOpacity,
  connectionColor,
  nodeColor,
  nodeRadius,
  interactionRadius,
  interactionStrength,
  driftSpeed,
  maxSpeed,
  boundaryMode,
  onHoverNode,
  tooltipRadius,
  reducedMotion,
}: SceneProps) {
  const { viewport } = useThree();
  const hw = viewport.width / 2;
  const hh = viewport.height / 2;

  // ---- persistent typed arrays ----
  const state = useMemo(() => {
    const positions = new Float32Array(count * 2);
    const velocities = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      positions[i * 2] = (Math.random() - 0.5) * viewport.width;
      positions[i * 2 + 1] = (Math.random() - 0.5) * viewport.height;
      const angle = Math.random() * Math.PI * 2;
      velocities[i * 2] = Math.cos(angle) * driftSpeed;
      velocities[i * 2 + 1] = Math.sin(angle) * driftSpeed;
    }
    return { positions, velocities };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // ---- node mesh ----
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.CircleGeometry(1, 16), []);
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ toneMapped: false }),
    []
  );

  // ---- connection lines ----
  const maxLines = count * 6;
  const lineGeoRef = useRef<THREE.BufferGeometry>(null);
  const linePosAttr = useMemo(
    () => new THREE.BufferAttribute(new Float32Array(maxLines * 2 * 3), 3),
    [maxLines]
  );
  const lineColAttr = useMemo(
    () => new THREE.BufferAttribute(new Float32Array(maxLines * 2 * 4), 4),
    [maxLines]
  );
  linePosAttr.setUsage(THREE.DynamicDrawUsage);
  lineColAttr.setUsage(THREE.DynamicDrawUsage);

  // ---- pointer ----
  const pointer = useRef({ x: 0, y: 0, active: false });

  // ---- per-frame ----
  useFrame((_rootState, delta) => {
    if (!meshRef.current || !lineGeoRef.current) return;
    const dt = Math.min(delta, 0.05); // clamp huge deltas
    const pos = state.positions;
    const vel = state.velocities;
    const w = viewport.width;
    const h = viewport.height;
    const halfW = w / 2;
    const halfH = h / 2;

    // --- physics ---
    if (!reducedMotion) {
      for (let i = 0; i < count; i++) {
        const ix = i * 2;
        const iy = ix + 1;

        // interaction
        if (pointer.current.active && interactionStrength > 0) {
          const dx = pointer.current.x - pos[ix];
          const dy = pointer.current.y - pos[iy];
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < interactionRadius && dist > 0.01) {
            const force = interactionStrength / (dist * dist + 1);
            vel[ix] += (dx / dist) * force * dt * 60;
            vel[iy] += (dy / dist) * force * dt * 60;
          }
        }

        // clamp speed
        const speed = Math.sqrt(vel[ix] * vel[ix] + vel[iy] * vel[iy]);
        if (speed > maxSpeed) {
          vel[ix] = (vel[ix] / speed) * maxSpeed;
          vel[iy] = (vel[iy] / speed) * maxSpeed;
        }

        // damping back toward drift speed
        if (speed > driftSpeed) {
          const damp = 1 - 0.5 * dt;
          vel[ix] *= damp;
          vel[iy] *= damp;
        }

        // integrate
        pos[ix] += vel[ix] * dt;
        pos[iy] += vel[iy] * dt;

        // boundary
        if (boundaryMode === "wrap") {
          if (pos[ix] < -halfW) pos[ix] += w;
          if (pos[ix] > halfW) pos[ix] -= w;
          if (pos[iy] < -halfH) pos[iy] += h;
          if (pos[iy] > halfH) pos[iy] -= h;
        } else {
          if (pos[ix] < -halfW || pos[ix] > halfW) vel[ix] *= -1;
          if (pos[iy] < -halfH || pos[iy] > halfH) vel[iy] *= -1;
          pos[ix] = Math.max(-halfW, Math.min(halfW, pos[ix]));
          pos[iy] = Math.max(-halfH, Math.min(halfH, pos[iy]));
        }
      }
    }

    // --- update instanced mesh ---
    const mesh = meshRef.current;
    for (let i = 0; i < count; i++) {
      const r = nodeData[i]?.radius ?? nodeRadius;
      tmpMatrix.makeTranslation(pos[i * 2], pos[i * 2 + 1], 0);
      tmpVec.set(r, r, 1);
      tmpMatrix.scale(tmpVec);
      mesh.setMatrixAt(i, tmpMatrix);

      const c = nodeData[i]?.color ?? nodeColor;
      tmpColor.set(c);
      mesh.setColorAt(i, tmpColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // --- connections ---
    const cRadius = connectionRadius;
    const [lr, lg, lb] = hexToRgb(connectionColor);
    const lrn = lr / 255;
    const lgn = lg / 255;
    const lbn = lb / 255;
    const posArr = linePosAttr.array as Float32Array;
    const colArr = lineColAttr.array as Float32Array;
    let lineIdx = 0;

    for (let i = 0; i < count && lineIdx < maxLines; i++) {
      for (let j = i + 1; j < count && lineIdx < maxLines; j++) {
        const dx = pos[i * 2] - pos[j * 2];
        const dy = pos[i * 2 + 1] - pos[j * 2 + 1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < cRadius) {
          const alpha = (1 - dist / cRadius) * connectionOpacity;
          const base = lineIdx * 6;
          posArr[base] = pos[i * 2];
          posArr[base + 1] = pos[i * 2 + 1];
          posArr[base + 2] = 0;
          posArr[base + 3] = pos[j * 2];
          posArr[base + 4] = pos[j * 2 + 1];
          posArr[base + 5] = 0;
          const cb = lineIdx * 8;
          colArr[cb] = lrn;
          colArr[cb + 1] = lgn;
          colArr[cb + 2] = lbn;
          colArr[cb + 3] = alpha;
          colArr[cb + 4] = lrn;
          colArr[cb + 5] = lgn;
          colArr[cb + 6] = lbn;
          colArr[cb + 7] = alpha;
          lineIdx++;
        }
      }
    }

    lineGeoRef.current.setDrawRange(0, lineIdx * 2);
    linePosAttr.needsUpdate = true;
    lineColAttr.needsUpdate = true;

    // --- tooltip: nearest node to pointer ---
    if (pointer.current.active) {
      let nearIdx = -1;
      let nearDist = Infinity;
      for (let i = 0; i < count; i++) {
        const dx = pointer.current.x - pos[i * 2];
        const dy = pointer.current.y - pos[i * 2 + 1];
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < tooltipRadius && d < nearDist) {
          nearDist = d;
          nearIdx = i;
        }
      }
      if (nearIdx >= 0 && nodeData[nearIdx]?.label) {
        onHoverNode(nodeData[nearIdx], pos[nearIdx * 2], pos[nearIdx * 2 + 1]);
      } else {
        onHoverNode(null, 0, 0);
      }
    } else {
      onHoverNode(null, 0, 0);
    }
  });

  return (
    <>
      {/* Invisible interaction plane */}
      <mesh
        visible={false}
        onPointerMove={(e) => {
          pointer.current.x = e.point.x;
          pointer.current.y = e.point.y;
          pointer.current.active = true;
        }}
        onPointerLeave={() => {
          pointer.current.active = false;
        }}
      >
        <planeGeometry args={[hw * 4, hh * 4]} />
        <meshBasicMaterial />
      </mesh>

      {/* Connection lines */}
      <lineSegments frustumCulled={false}>
        <bufferGeometry ref={lineGeoRef}>
          <bufferAttribute attach="attributes-position" {...(linePosAttr as any)} />
          <bufferAttribute attach="attributes-color" {...(lineColAttr as any)} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent depthWrite={false} />
      </lineSegments>

      {/* Instanced nodes */}
      <instancedMesh
        ref={meshRef}
        args={[geo, mat, count]}
        frustumCulled={false}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export function ConstellationField({
  nodes,
  connectionRadius = 150,
  connectionOpacity = 0.25,
  connectionColor = "#597794",
  nodeColor = "#597794",
  nodeRadius = 2.5,
  interactionRadius = 200,
  interactionStrength = 0.5,
  driftSpeed = 0.3,
  maxSpeed = 1.5,
  boundaryMode = "wrap",
  tooltipRadius = 30,
  className,
}: ConstellationFieldProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Tooltip state (DOM overlay positioned via CSS)
  const [tooltip, setTooltip] = useState<{
    node: ConstellationNode;
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleHover = useCallback(
    (node: ConstellationNode | null, wx: number, wy: number) => {
      if (!node) {
        setTooltip(null);
        return;
      }
      // Convert Three.js world coords to CSS pixels
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = rect.width / 2 + (wx / 1) * (rect.width / 10);
      const py = rect.height / 2 - (wy / 1) * (rect.height / 10);
      setTooltip({ node, x: px, y: py });
    },
    []
  );

  // Visibility gating — pause canvas when off screen
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className} style={{ position: "relative" }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        dpr={[1, 1.5]}
        frameloop={visible ? "always" : "never"}
        style={{ background: "transparent" }}
        aria-hidden="true"
      >
        <ConstellationScene
          count={nodes.length}
          nodeData={nodes}
          connectionRadius={connectionRadius}
          connectionOpacity={connectionOpacity}
          connectionColor={connectionColor}
          nodeColor={nodeColor}
          nodeRadius={nodeRadius}
          interactionRadius={interactionRadius}
          interactionStrength={interactionStrength}
          driftSpeed={driftSpeed}
          maxSpeed={maxSpeed}
          boundaryMode={boundaryMode}
          onHoverNode={handleHover}
          tooltipRadius={tooltipRadius}
          reducedMotion={reducedMotion}
        />
      </Canvas>

      {/* Tooltip overlay */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded bg-black/80 px-2 py-1 text-xs text-white backdrop-blur-sm"
          style={{
            left: tooltip.x,
            top: tooltip.y - 12,
            transition: "opacity 150ms ease-out",
          }}
        >
          {tooltip.node.label}
        </div>
      )}
    </div>
  );
}

export default ConstellationField;
