# Interactive Constellation / Starburst Animation

Complete guide for building an xAI-style interactive constellation: a slowly rotating field of connected nodes where hovering reveals content.

## Architecture Overview

```
<Canvas>                          // R3F canvas, full viewport
  <ConstellationGroup>            // Rotating parent group
    <CenterCore />                // Glowing center point
    <RadialLines />               // Lines from center to each node
    <InterconnectionLines />      // Lines between nearby nodes
    <NodePoint (x N) />           // Interactive hoverable nodes
      <Html />                    // Tooltip content on hover (Drei)
  </ConstellationGroup>
  <ambientLight />
</Canvas>
```

## Dependencies

```bash
npm install three @react-three/fiber @react-three/drei @types/three
```

## Step-by-Step Implementation

### 1. Generate Node Positions

Distribute nodes in a radial pattern from center, using golden angle for even spacing:

```tsx
interface ConstellationNode {
  id: string
  position: [number, number, number]
  label: string
  size: 'sm' | 'md' | 'lg'
}

function generateNodes(data: { id: string; label: string }[], radius: number): ConstellationNode[] {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)) // ~137.5 degrees
  return data.map((item, i) => {
    const angle = i * goldenAngle
    const r = radius * (0.3 + 0.7 * Math.sqrt((i + 1) / data.length)) // Distribute outward
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    const z = (Math.random() - 0.5) * radius * 0.3 // Slight z-depth variation
    const size = i < 3 ? 'lg' : i < 10 ? 'md' : 'sm'
    return { id: item.id, position: [x, y, z], label: item.label, size }
  })
}
```

### 2. Node Component with Hover Detection

Each node is a mesh with pointer events. R3F handles raycasting automatically.

```tsx
import { Html } from '@react-three/drei'
import { useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface NodeProps {
  node: ConstellationNode
  onHover: (id: string | null) => void
  isHovered: boolean
}

function StarNode({ node, onHover, isHovered }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const baseScale = node.size === 'lg' ? 0.15 : node.size === 'md' ? 0.1 : 0.06

  const targetVec = useRef(new THREE.Vector3())

  // Animate scale on hover
  useFrame(() => {
    if (!meshRef.current) return
    const target = isHovered ? baseScale * 1.8 : baseScale
    targetVec.current.set(target, target, target)
    meshRef.current.scale.lerp(targetVec.current, 0.1)
  })

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(node.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          onHover(null)
          document.body.style.cursor = 'auto'
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={isHovered ? '#597794' : '#8AACC0'}
          transparent
          opacity={isHovered ? 1 : 0.7}
        />
      </mesh>

      {/* Tooltip - Drei Html projects DOM into 3D space */}
      {isHovered && (
        <Html
          center
          distanceFactor={15}
          style={{
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div className="px-4 py-2 bg-ops-card/90 backdrop-blur-sm border border-ops-border rounded-ops text-ops-text-primary font-kosugi text-sm tracking-wider uppercase">
            {node.label}
          </div>
        </Html>
      )}
    </group>
  )
}
```

### 3. Radial Lines from Center

Use `BufferGeometry` with `Line` for lines from center to each node:

```tsx
import { Line } from '@react-three/drei'

function RadialLines({ nodes }: { nodes: ConstellationNode[] }) {
  return (
    <>
      {nodes.map((node) => (
        <Line
          key={node.id}
          points={[[0, 0, 0], node.position]}
          color="#FFFFFF"
          opacity={0.08}
          transparent
          lineWidth={0.5}
        />
      ))}
    </>
  )
}
```

### 4. Interconnection Lines Between Nearby Nodes

Connect nodes that are within a threshold distance:

```tsx
function InterconnectionLines({ nodes, threshold = 3 }: { nodes: ConstellationNode[]; threshold?: number }) {
  const connections: [THREE.Vector3, THREE.Vector3][] = []

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = new THREE.Vector3(...nodes[i].position)
      const b = new THREE.Vector3(...nodes[j].position)
      if (a.distanceTo(b) < threshold) {
        connections.push([a, b])
      }
    }
  }

  return (
    <>
      {connections.map((pair, i) => (
        <Line
          key={i}
          points={[pair[0].toArray(), pair[1].toArray()]}
          color="#FFFFFF"
          opacity={0.04}
          transparent
          lineWidth={0.3}
        />
      ))}
    </>
  )
}
```

### 5. Rotating Parent Group

```tsx
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

function ConstellationGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * 0.03 // Slow rotation
    }
  })

  return <group ref={groupRef}>{children}</group>
}
```

### 6. Full Constellation Component

```tsx
"use client"
import { Canvas } from '@react-three/fiber'
import { useState, useMemo } from 'react'

const CONSTELLATION_DATA = [
  { id: '1', label: 'What destiny awaits the cosmos?' },
  { id: '2', label: 'Is the universe infinitely layered?' },
  { id: '3', label: 'Can machines dream?' },
  // ... more data points
]

export default function Constellation() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const nodes = useMemo(() => generateNodes(CONSTELLATION_DATA, 8), [])

  return (
    <div className="relative w-full h-screen bg-ops-background">
      {/* Text overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <h2 className="text-6xl font-mohave font-bold text-ops-text-primary/30">
          Understand
        </h2>
      </div>

      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <ConstellationGroup>
          <RadialLines nodes={nodes} />
          <InterconnectionLines nodes={nodes} />
          {nodes.map((node) => (
            <StarNode
              key={node.id}
              node={node}
              onHover={setHoveredId}
              isHovered={hoveredId === node.id}
            />
          ))}
        </ConstellationGroup>
      </Canvas>
    </div>
  )
}
```

### 7. Lazy Load in Next.js

```tsx
import dynamic from 'next/dynamic'

const Constellation = dynamic(() => import('./Constellation'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-ops-background flex items-center justify-center">
      <div className="text-ops-text-secondary font-kosugi">Loading...</div>
    </div>
  ),
})
```

## Performance Optimization

1. **Use `instancedMesh`** for 50+ nodes - renders all nodes in a single draw call
2. **Throttle hover detection** - R3F raycasting runs every frame; use `meshBounds` from Drei to use bounding box instead of geometry for hit testing
3. **Limit line count** - Cap interconnection lines at ~100 connections
4. **Use `useMemo`** for node generation and geometry - prevent recalculation on re-renders
5. **`frameloop="demand"`** on Canvas if animation only runs on interaction

## Variations

### Flat 2D Constellation (Canvas API, no Three.js)
For a lighter-weight version without 3D, use HTML5 Canvas directly:
- Draw nodes as filled rectangles/circles with `ctx.fillRect()`
- Draw lines with `ctx.beginPath()` / `ctx.lineTo()`
- Rotate by applying `ctx.translate()` + `ctx.rotate()` before drawing
- Hit detection: track node positions, check distance from mouse on `mousemove`
- Reveal tooltip with absolutely-positioned `<div>` at canvas-relative coordinates

### WebGL Shader Particles
For 1000+ nodes, use custom shaders with `THREE.Points`:
- Store positions in `Float32Array` via `BufferAttribute`
- Custom vertex shader for size based on distance
- Fragment shader for glow effect (radial gradient in shader)
- No per-object raycasting - use spatial grid for hover detection
