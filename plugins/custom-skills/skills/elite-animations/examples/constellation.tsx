/**
 * Interactive Constellation / Starburst Animation
 * Inspired by xAI "Understand The Universe" section
 *
 * Dependencies: npm install three @react-three/fiber @react-three/drei @types/three
 * Usage: Lazy-load with dynamic(() => import('./Constellation'), { ssr: false })
 */
"use client"

import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import { useState, useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'

// ── Types ──────────────────────────────────────────────
interface ConstellationNode {
  id: string
  position: [number, number, number]
  label: string
  size: number
}

interface ConstellationProps {
  data: { id: string; label: string }[]
  radius?: number
  className?: string
}

// ── Node Position Generator ────────────────────────────
function generateNodes(
  data: { id: string; label: string }[],
  radius: number
): ConstellationNode[] {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  return data.map((item, i) => {
    const angle = i * goldenAngle
    const r = radius * (0.3 + 0.7 * Math.sqrt((i + 1) / data.length))
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    const z = (Math.random() - 0.5) * radius * 0.2
    const size = i < 3 ? 0.14 : i < 8 ? 0.09 : 0.05
    return { id: item.id, position: [x, y, z], label: item.label, size }
  })
}

// ── Single Interactive Node ────────────────────────────
function StarNode({
  node,
  onHover,
  isHovered,
}: {
  node: ConstellationNode
  onHover: (id: string | null) => void
  isHovered: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const targetVec = useRef(new THREE.Vector3())

  useFrame(() => {
    if (!meshRef.current) return
    const target = isHovered ? node.size * 1.8 : node.size
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
          opacity={isHovered ? 1 : 0.65}
        />
      </mesh>

      {isHovered && (
        <Html
          center
          distanceFactor={15}
          style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
        >
          <div className="px-4 py-2 bg-[#0D0D0D]/90 backdrop-blur-sm border border-[#2A2A2A] rounded text-[#F5F5F5] font-sans text-xs tracking-[0.15em] uppercase">
            {node.label}
          </div>
        </Html>
      )}
    </group>
  )
}

// ── Radial Lines from Center ───────────────────────────
function RadialLines({ nodes }: { nodes: ConstellationNode[] }) {
  return (
    <>
      {nodes.map((node) => (
        <Line
          key={`radial-${node.id}`}
          points={[
            [0, 0, 0],
            node.position,
          ]}
          color="#FFFFFF"
          opacity={0.06}
          transparent
          lineWidth={0.5}
        />
      ))}
    </>
  )
}

// ── Connection Lines Between Nearby Nodes ──────────────
function ConnectionLines({
  nodes,
  threshold = 3.5,
}: {
  nodes: ConstellationNode[]
  threshold?: number
}) {
  const connections = useMemo(() => {
    const result: [number[], number[]][] = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = new THREE.Vector3(...nodes[i].position)
        const b = new THREE.Vector3(...nodes[j].position)
        if (a.distanceTo(b) < threshold) {
          result.push([nodes[i].position, nodes[j].position])
        }
      }
    }
    return result.slice(0, 80) // Cap for performance
  }, [nodes, threshold])

  return (
    <>
      {connections.map((pair, i) => (
        <Line
          key={`conn-${i}`}
          points={pair}
          color="#FFFFFF"
          opacity={0.03}
          transparent
          lineWidth={0.3}
        />
      ))}
    </>
  )
}

// ── Rotating Group ─────────────────────────────────────
function RotatingGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * 0.025
    }
  })
  return <group ref={groupRef}>{children}</group>
}

// ── Main Constellation Component ───────────────────────
export default function Constellation({
  data,
  radius = 7,
  className = '',
}: ConstellationProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const nodes = useMemo(() => generateNodes(data, radius), [data, radius])
  const handleHover = useCallback((id: string | null) => setHoveredId(id), [])

  return (
    <div className={`relative w-full h-screen bg-[#0A0A0A] ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 14], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <RotatingGroup>
          <RadialLines nodes={nodes} />
          <ConnectionLines nodes={nodes} />
          {nodes.map((node) => (
            <StarNode
              key={node.id}
              node={node}
              onHover={handleHover}
              isHovered={hoveredId === node.id}
            />
          ))}
        </RotatingGroup>
      </Canvas>
    </div>
  )
}

// ── Example Data ───────────────────────────────────────
export const SAMPLE_DATA = [
  { id: '1', label: 'What destiny awaits the cosmos?' },
  { id: '2', label: 'Is the universe infinitely layered?' },
  { id: '3', label: 'Can machines dream?' },
  { id: '4', label: 'Where does consciousness begin?' },
  { id: '5', label: 'What lies beyond the observable?' },
  { id: '6', label: 'Is time an illusion?' },
  { id: '7', label: 'How deep does complexity go?' },
  { id: '8', label: 'Are we alone?' },
  { id: '9', label: 'What is the nature of reality?' },
  { id: '10', label: 'Can order emerge from chaos?' },
  { id: '11', label: 'Where do ideas come from?' },
  { id: '12', label: 'Is mathematics discovered or invented?' },
  { id: '13', label: 'What drives evolution?' },
  { id: '14', label: 'How do patterns form?' },
  { id: '15', label: 'What is emergence?' },
  { id: '16', label: 'Can we simulate reality?' },
  { id: '17', label: 'What is intelligence?' },
  { id: '18', label: 'How vast is the unknown?' },
  { id: '19', label: 'What connects everything?' },
  { id: '20', label: 'Where does meaning live?' },
]
