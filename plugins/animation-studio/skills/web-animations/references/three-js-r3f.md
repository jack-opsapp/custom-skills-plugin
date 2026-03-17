# Three.js / React Three Fiber Reference

## When This Produces the Best Result

Use Three.js / R3F when:
- The scene is 3D: product showcases, data constellations, globe visualizations, interactive environments
- You need real-time lighting, materials, and camera control
- Particle systems need GPU-accelerated rendering with instanced meshes
- Post-processing effects (bloom, depth-of-field, chromatic aberration) are part of the design
- Physics simulation is needed (rigid bodies, soft bodies, collisions)
- You want interactive 3D embedded in a React component tree with props/state integration

Do NOT use Three.js / R3F when:
- The animation is 2D-only (parallax, fades, transforms) — use CSS or Motion for React
- You need a flat particle system with simple physics — use Canvas 2D (much lighter)
- The project cannot afford the bundle cost (~150kb+ for Three.js core)

---

## Installation (2026)

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
# Optional: physics
npm install @react-three/rapier
```

**Versions:** Three.js r171+ (WebGPU-ready), @react-three/fiber v9.x (React 19 compatible), @react-three/drei v10.x.

---

## 1. Scene Setup — Canvas Component

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { Suspense } from "react";

interface SceneProps {
  children: React.ReactNode;
  className?: string;
  backgroundColor?: string;
  enableOrbit?: boolean;
}

export function Scene({
  children,
  className,
  backgroundColor = "#0A0A0A",
  enableOrbit = false,
}: SceneProps) {
  return (
    <Canvas
      className={className}
      camera={{ position: [0, 0, 5], fov: 50 }}
      dpr={[1, 2]} // Clamp DPR between 1-2 for performance
      gl={{ antialias: true, alpha: true }}
      style={{ background: backgroundColor }}
    >
      <Suspense fallback={null}>
        {/* Ambient light — soft fill, prevents pure black shadows */}
        <ambientLight intensity={0.4} />
        {/* Key light — primary directional illumination */}
        <directionalLight position={[5, 5, 5]} intensity={0.8} />

        {children}

        {enableOrbit && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
          />
        )}
      </Suspense>
    </Canvas>
  );
}
```

### Canvas Props

| Prop | Purpose |
|------|---------|
| `camera` | Default camera config: `position`, `fov`, `near`, `far` |
| `dpr` | Device pixel ratio. `[1, 2]` = auto-clamp between 1-2 |
| `gl` | WebGL renderer options: `antialias`, `alpha`, `toneMapping` |
| `shadows` | Enable shadow maps: `true`, `"soft"`, or shadow map config |
| `frameloop` | `"always"` (default), `"demand"` (only render when state changes), `"never"` |

---

## 2. Meshes, Geometries, Materials

```tsx
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

interface FloatingBoxProps {
  color?: string;
  position?: [number, number, number];
  speed?: number;
}

export function FloatingBox({
  color = "#597794",
  position = [0, 0, 0],
  speed = 1,
}: FloatingBoxProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime * speed;
    /* Sinusoidal bob: amplitude 0.3 units, frequency controlled by speed */
    meshRef.current.position.y = position[1] + Math.sin(t) * 0.3;
    /* Slow rotation: 0.2 rad/s on Y, 0.1 rad/s on X */
    meshRef.current.rotation.y += 0.002 * speed;
    meshRef.current.rotation.x += 0.001 * speed;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.6}
      />
    </mesh>
  );
}
```

### useFrame

Runs every frame (60fps). Access clock, delta time, camera, scene:

```tsx
useFrame((state, delta) => {
  // state.clock.elapsedTime — total elapsed time
  // delta — time since last frame (use for framerate-independent animation)
  // state.camera — current camera
  // state.pointer — normalized mouse position {x, y} in [-1, 1]
  mesh.current.rotation.y += delta * 0.5; // 0.5 rad/s, framerate-independent
});
```

---

## 3. Drei Helpers

### Float

Automatic floating animation:

```tsx
import { Float, Text } from "@react-three/drei";

<Float
  speed={2}               // Animation speed multiplier
  rotationIntensity={0.5} // Rotation wobble intensity
  floatIntensity={1}      // Bob intensity
  floatingRange={[-0.1, 0.1]} // Y-axis range in units
>
  <mesh>
    <sphereGeometry args={[0.5, 32, 32]} />
    <meshStandardMaterial color="#597794" />
  </mesh>
</Float>
```

### Text

SDF text rendering (sharp at any size):

```tsx
import { Text } from "@react-three/drei";

<Text
  fontSize={0.5}
  color="#FFFFFF"
  font="/fonts/Mohave-Bold.woff"
  anchorX="center"
  anchorY="middle"
  maxWidth={4}
>
  Dashboard Overview
</Text>
```

### Html

Embed HTML inside 3D scene:

```tsx
import { Html } from "@react-three/drei";

<Html
  transform           // Apply 3D transforms to HTML
  distanceFactor={10}  // Scale factor based on distance
  position={[0, 1, 0]}
  center
>
  <div className="bg-zinc-900 p-4 rounded-lg text-white text-sm">
    <h3>Node Alpha</h3>
    <p>Connections: 12</p>
  </div>
</Html>
```

### Environment

HDR environment lighting:

```tsx
import { Environment } from "@react-three/drei";

// Preset environments: "sunset", "dawn", "night", "warehouse", "forest", "apartment", "studio", "city", "park", "lobby"
<Environment preset="city" blur={0.5} />

// Custom HDRI
<Environment files="/hdri/studio.hdr" />
```

### MeshPortalMaterial

Portals into different scenes:

```tsx
import { MeshPortalMaterial } from "@react-three/drei";

<mesh>
  <planeGeometry args={[2, 3]} />
  <MeshPortalMaterial>
    {/* Everything inside renders as a separate scene visible through the plane */}
    <ambientLight intensity={0.5} />
    <mesh>
      <sphereGeometry />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  </MeshPortalMaterial>
</mesh>
```

---

## 4. Custom Shaders

### ShaderMaterial with GLSL

```tsx
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying float vElevation;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec3 pos = position;

    /* Sine wave displacement on Y axis
       Frequency: 3.0 (waves per unit), Speed: uTime
       Amplitude: 0.15 units — subtle but visible */
    float elevation = sin(pos.x * 3.0 + uTime) * 0.15
                    + sin(pos.y * 2.0 + uTime * 0.8) * 0.1;
    pos.z += elevation;
    vElevation = elevation;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  varying float vElevation;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  void main() {
    /* Mix between two colors based on wave height
       Normalized elevation from [-0.25, 0.25] to [0, 1] */
    float mixFactor = (vElevation + 0.25) / 0.5;
    vec3 color = mix(uColorA, uColorB, mixFactor);
    gl_FragColor = vec4(color, 1.0);
  }
`;

interface WavePlaneProps {
  colorA?: string;
  colorB?: string;
}

export function WavePlane({
  colorA = "#0A0A0A",
  colorB = "#597794",
}: WavePlaneProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
    }),
    [colorA, colorB]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 4, 0, 0]}>
      <planeGeometry args={[6, 6, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
```

---

## 5. Post-Processing

```tsx
"use client";

import { EffectComposer, Bloom, ChromaticAberration, DepthOfField } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export function PostProcessing() {
  return (
    <EffectComposer>
      {/* Bloom — makes bright areas glow */}
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.8}  // Only bloom pixels brighter than 80%
        luminanceSmoothing={0.2}
        mipmapBlur                 // Higher quality bloom via mipmap chain
      />

      {/* Chromatic aberration — RGB channel offset at edges */}
      <ChromaticAberration
        offset={[0.0005, 0.0005]}
        blendFunction={BlendFunction.NORMAL}
        radialModulation           // Stronger at edges, none at center
        modulationOffset={0.5}
      />

      {/* Depth of field — blur based on distance from focus */}
      <DepthOfField
        focusDistance={0.01}
        focalLength={0.02}
        bokehScale={3}
      />
    </EffectComposer>
  );
}
```

---

## 6. Physics with @react-three/rapier

```tsx
"use client";

import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";

export function PhysicsScene() {
  return (
    <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
      {/* Ground plane — fixed, no gravity */}
      <RigidBody type="fixed">
        <CuboidCollider args={[10, 0.1, 10]} position={[0, -2, 0]} />
        <mesh position={[0, -2, 0]}>
          <boxGeometry args={[20, 0.2, 20]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </RigidBody>

      {/* Falling boxes — dynamic, affected by gravity */}
      {Array.from({ length: 20 }).map((_, i) => (
        <RigidBody
          key={i}
          position={[
            (Math.random() - 0.5) * 4,
            2 + i * 0.5,
            (Math.random() - 0.5) * 4,
          ]}
          restitution={0.4}  // Bounciness: 0 = dead, 1 = perfect bounce
        >
          <mesh>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color="#597794" />
          </mesh>
        </RigidBody>
      ))}
    </Physics>
  );
}
```

### RigidBody Types

| Type | Behavior |
|------|----------|
| `"dynamic"` (default) | Affected by gravity and forces |
| `"fixed"` | Immovable — walls, floors |
| `"kinematicPosition"` | Moved by setting position directly (platforms, moving obstacles) |
| `"kinematicVelocity"` | Moved by setting velocity directly |

### Collision Events

```tsx
<RigidBody
  onCollisionEnter={({ manifold }) => {
    console.log("Hit at", manifold.solverContactPoint(0));
  }}
  onCollisionExit={() => {
    console.log("Separated");
  }}
>
```

---

## 7. Instanced Meshes — Performance at Scale

For rendering thousands of identical meshes (particles, stars, data points):

```tsx
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleFieldProps {
  count?: number;
  color?: string;
  size?: number;
  spread?: number;
}

export function ParticleField({
  count = 1000,
  color = "#597794",
  size = 0.02,
  spread = 10,
}: ParticleFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  /* Pre-compute random positions and velocities */
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * spread,
      y: (Math.random() - 0.5) * spread,
      z: (Math.random() - 0.5) * spread,
      /* Each particle oscillates at a unique frequency and phase */
      speed: 0.2 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count, spread]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    particles.forEach((p, i) => {
      /* Gentle vertical oscillation — sine wave with individual phase */
      dummy.position.set(
        p.x,
        p.y + Math.sin(t * p.speed + p.phase) * 0.3,
        p.z
      );
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color={color} />
    </instancedMesh>
  );
}
```

One draw call for all instances, regardless of count. 1000 spheres = 1 draw call.

---

## 8. WebGPU Progressive Enhancement (Three.js r171+)

Three.js r171 shipped production-ready WebGPU support. As of 2026, WebGPU is available in Chrome, Edge, Safari 26, and Firefox 147 (~70% browser coverage).

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { useState, useEffect } from "react";

export function AdaptiveCanvas({ children }: { children: React.ReactNode }) {
  const [supportsWebGPU, setSupportsWebGPU] = useState(false);

  useEffect(() => {
    async function checkWebGPU() {
      if ("gpu" in navigator) {
        const adapter = await navigator.gpu?.requestAdapter();
        setSupportsWebGPU(!!adapter);
      }
    }
    checkWebGPU();
  }, []);

  return (
    <Canvas
      gl={(canvas) => {
        if (supportsWebGPU) {
          // Three.js r171+ WebGPURenderer — auto-fallback to WebGL2
          // Import dynamically to avoid bundling unused renderer
          const { WebGPURenderer } = require("three/webgpu");
          return new WebGPURenderer({ canvas, antialias: true });
        }
        // Default WebGL2 renderer
        return undefined; // Let R3F create default
      }}
      dpr={[1, 2]}
    >
      {children}
    </Canvas>
  );
}
```

WebGPU benefits:
- Compute shaders for GPU-side particle simulation
- Better resource management — explicit GPU memory control
- Up to 10x improvement in draw-call-heavy scenarios
- Automatic fallback to WebGL2 on unsupported browsers

---

## 9. Reduced Motion

```tsx
"use client";

import { useReducedMotion } from "motion/react";
import { Canvas } from "@react-three/fiber";

export function SafeScene({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion();

  return (
    <Canvas
      frameloop={prefersReduced ? "demand" : "always"}
      /* "demand" = only re-render when state changes, no continuous animation */
    >
      {children}
    </Canvas>
  );
}

// Inside animated components:
function AnimatedMesh() {
  const prefersReduced = useReducedMotion();

  useFrame((state, delta) => {
    if (prefersReduced) return; // Skip all animation
    meshRef.current.rotation.y += delta * 0.5;
  });
}
```

---

## Performance Engineering

1. **Instanced meshes** — Use `<instancedMesh>` for >10 identical objects. One draw call per instance group.
2. **dpr clamping** — `dpr={[1, 2]}` prevents rendering at 3x on high-DPR displays (massive pixel count).
3. **frameloop="demand"** — For non-continuously-animated scenes. Only re-renders when `invalidate()` is called.
4. **Geometry reuse** — Create geometry once with `useMemo`, share across meshes.
5. **dispose** — Three.js does NOT auto-garbage-collect. Dispose geometries, materials, and textures on unmount. R3F handles this for declarative elements, but manual `useEffect` cleanup is needed for imperative objects.
6. **LOD** — Use drei's `<Detailed>` for level-of-detail meshes at distance thresholds.
7. **Frustum culling** — Enabled by default. Objects outside camera view are not rendered.
8. **Post-processing** — Each effect adds a full-screen pass. Use sparingly. `mipmapBlur` on Bloom is cheaper than the default.

---

## Brand Config Integration

```tsx
interface R3FSceneConfig {
  accentColor?: string;      // Primary 3D material color
  backgroundColor?: string;  // Canvas/scene background
  ambientIntensity?: number; // Fill light strength
  bloomIntensity?: number;   // Post-processing glow
  particleCount?: number;    // Performance scaling
  enablePostProcessing?: boolean;
}

const defaults: Required<R3FSceneConfig> = {
  accentColor: "#597794",
  backgroundColor: "#0A0A0A",
  ambientIntensity: 0.4,
  bloomIntensity: 0.5,
  particleCount: 1000,
  enablePostProcessing: true,
};
```
