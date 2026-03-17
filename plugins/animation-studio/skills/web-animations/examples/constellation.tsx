"use client";

import { useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Float } from "@react-three/drei";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Constellation
// ---------------------------------------------------------------------------
// An interactive React Three Fiber constellation. Data points are rendered as
// glowing spheres. Lines connect nodes that are within a configurable distance
// threshold. The mouse pointer attracts nearby nodes via an inverse-square
// proximity force.
//
// Physics rationale:
//   - Connection distance threshold: Euclidean distance in world units. Keeping
//     it relative to `spread` ensures the visual density is consistent.
//   - Mouse attraction: inversely proportional to distance squared (like
//     gravity). Clamped with a minimum distance to prevent infinite force at
//     the pointer's exact position.
//   - Damping (0.96 per frame at 60fps): nodes decelerate quickly once the
//     pointer moves away, preventing them from drifting forever.
// ---------------------------------------------------------------------------

// --- Types ---

interface ConstellationNode {
  id: string;
  label: string;
  /** Optional numeric value displayed in the tooltip. */
  value?: number;
}

interface ConstellationProps {
  /** Data nodes to display. */
  nodes: ConstellationNode[];
  /** Primary accent color for nodes and connections. */
  accentColor?: string;
  /** Background color of the Canvas. */
  backgroundColor?: string;
  /** Maximum distance (world units) between nodes for a connection line. */
  connectionDistance?: number;
  /** Spread of the initial random positions. */
  spread?: number;
  /** Strength of mouse-proximity attraction. 0 = no attraction. */
  attractionStrength?: number;
  /** CSS class on the outer wrapper. */
  className?: string;
}

export function Constellation({
  nodes,
  accentColor = "#597794",
  backgroundColor = "#0A0A0A",
  connectionDistance = 3,
  spread = 8,
  attractionStrength = 0.6,
  className,
}: ConstellationProps) {
  // Reduced motion: render a static scatter, no animation loop.
  const prefersReduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  return (
    <div className={`w-full h-full ${className ?? ""}`}>
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        dpr={[1, 2]}
        style={{ background: backgroundColor }}
        frameloop={prefersReduced ? "demand" : "always"}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.6} />

        <ConstellationScene
          nodes={nodes}
          accentColor={accentColor}
          connectionDistance={connectionDistance}
          spread={spread}
          attractionStrength={prefersReduced ? 0 : attractionStrength}
        />
      </Canvas>
    </div>
  );
}

// --- Internal Scene ---

interface SceneProps {
  nodes: ConstellationNode[];
  accentColor: string;
  connectionDistance: number;
  spread: number;
  attractionStrength: number;
}

function ConstellationScene({
  nodes,
  accentColor,
  connectionDistance,
  spread,
  attractionStrength,
}: SceneProps) {
  const { pointer, viewport } = useThree();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Stable random positions seeded per node count + spread.
  const initialPositions = useMemo(() => {
    return nodes.map(() =>
      new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread * 0.6, // Slightly flatter on Y
        (Math.random() - 0.5) * spread * 0.3,
      ),
    );
  }, [nodes.length, spread]);

  // Live positions mutated every frame (not React state — avoids re-renders).
  const positions = useRef<THREE.Vector3[]>(
    initialPositions.map((p) => p.clone()),
  );
  const velocities = useRef<THREE.Vector3[]>(
    nodes.map(() => new THREE.Vector3()),
  );

  // Connection line geometry — updated every frame.
  const lineRef = useRef<THREE.BufferGeometry>(null);
  // Max possible connections: n*(n-1)/2.
  const maxLines = (nodes.length * (nodes.length - 1)) / 2;
  const linePositions = useMemo(
    () => new Float32Array(maxLines * 6),
    [maxLines],
  );
  const lineOpacities = useMemo(
    () => new Float32Array(maxLines * 2),
    [maxLines],
  );

  // Sphere refs for individual node meshes.
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  const tempVec = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const pos = positions.current;
    const vel = velocities.current;

    // Convert 2D pointer to a 3D world-space position on the z=0 plane.
    const mouseWorld = new THREE.Vector3(
      (pointer.x * viewport.width) / 2,
      (pointer.y * viewport.height) / 2,
      0,
    );

    // --- Update node physics ---
    for (let i = 0; i < pos.length; i++) {
      if (attractionStrength > 0) {
        // Vector from node → mouse.
        tempVec.copy(mouseWorld).sub(pos[i]);
        const dist = tempVec.length();

        if (dist > 0.1) {
          // Inverse-square attraction, clamped to prevent extreme forces
          // when the pointer is very close. F ∝ strength / d².
          const force = attractionStrength / Math.max(dist * dist, 1);
          tempVec.normalize().multiplyScalar(force);
          vel[i].add(tempVec);
        }
      }

      // Return-to-origin spring: gently pulls nodes back to their initial
      // positions so the constellation doesn't dissolve.
      // Spring constant 0.01 = very soft — allows free movement near the
      // mouse but prevents permanent drift.
      tempVec.copy(initialPositions[i]).sub(pos[i]).multiplyScalar(0.01);
      vel[i].add(tempVec);

      // Damping: 0.96 per frame at 60fps ≈ velocity halves every ~17 frames.
      vel[i].multiplyScalar(0.96);

      // Integrate position.
      pos[i].add(vel[i]);

      // Update mesh position (no re-render — direct mutation).
      const mesh = meshRefs.current[i];
      if (mesh) {
        mesh.position.copy(pos[i]);
      }
    }

    // --- Update connection lines ---
    let lineIndex = 0;

    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const d = pos[i].distanceTo(pos[j]);

        if (d < connectionDistance) {
          const base = lineIndex * 6;
          linePositions[base] = pos[i].x;
          linePositions[base + 1] = pos[i].y;
          linePositions[base + 2] = pos[i].z;
          linePositions[base + 3] = pos[j].x;
          linePositions[base + 4] = pos[j].y;
          linePositions[base + 5] = pos[j].z;

          // Opacity fades linearly: 1.0 at distance 0 → 0.0 at threshold.
          const opacity = 1 - d / connectionDistance;
          lineOpacities[lineIndex * 2] = opacity;
          lineOpacities[lineIndex * 2 + 1] = opacity;

          lineIndex++;
        }
      }
    }

    // Update line buffer geometry.
    if (lineRef.current) {
      const posAttr = lineRef.current.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      posAttr.set(linePositions);
      posAttr.needsUpdate = true;
      lineRef.current.setDrawRange(0, lineIndex * 2);
    }
  });

  const handlePointerOver = useCallback(
    (id: string) => () => setHoveredId(id),
    [],
  );
  const handlePointerOut = useCallback(() => setHoveredId(null), []);

  const accentThree = useMemo(() => new THREE.Color(accentColor), [accentColor]);

  return (
    <>
      {/* Connection lines */}
      <lineSegments>
        <bufferGeometry ref={lineRef}>
          <bufferAttribute
            attach="attributes-position"
            array={linePositions}
            count={maxLines * 2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={accentColor}
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </lineSegments>

      {/* Nodes */}
      {nodes.map((node, i) => (
        <Float
          key={node.id}
          speed={1.5}
          rotationIntensity={0}
          floatIntensity={0.2}
          floatingRange={[-0.05, 0.05]}
        >
          <mesh
            ref={(el) => {
              meshRefs.current[i] = el;
            }}
            position={initialPositions[i]}
            onPointerOver={handlePointerOver(node.id)}
            onPointerOut={handlePointerOut}
          >
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentThree}
              emissiveIntensity={hoveredId === node.id ? 1.5 : 0.4}
              roughness={0.3}
              metalness={0.5}
            />

            {/* Tooltip — only visible on hover */}
            {hoveredId === node.id && (
              <Html
                center
                distanceFactor={8}
                style={{ pointerEvents: "none" }}
              >
                <div
                  className="px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-lg"
                  style={{
                    backgroundColor: "rgba(10, 10, 10, 0.9)",
                    border: `1px solid ${accentColor}44`,
                    color: "#fff",
                  }}
                >
                  <span className="font-semibold">{node.label}</span>
                  {node.value !== undefined && (
                    <span
                      className="ml-2"
                      style={{ color: accentColor }}
                    >
                      {node.value.toLocaleString()}
                    </span>
                  )}
                </div>
              </Html>
            )}
          </mesh>
        </Float>
      ))}
    </>
  );
}
