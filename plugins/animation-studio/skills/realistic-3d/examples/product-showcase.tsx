"use client";

/**
 * Complete Product Photography Scene
 *
 * A production-ready R3F scene template for photorealistic product rendering.
 * Includes: custom Lightformer studio rig, MeshPhysicalMaterial with PBR properties,
 * post-processing stack (N8AO + Bloom + ToneMapping + Vignette), ContactShadows,
 * and adaptive quality via PerformanceMonitor.
 *
 * Usage:
 *   <ProductShowcase>
 *     <YourProductModel />
 *   </ProductShowcase>
 */

import { Suspense, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  ContactShadows,
  OrbitControls,
  Center,
  PerformanceMonitor,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
  N8AO,
  ToneMapping,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Studio Lighting Rig
// ---------------------------------------------------------------------------

function StudioLighting() {
  return (
    <Environment resolution={256} frames={1}>
      {/* KEY LIGHT — large rectangular softbox, warm white
          Upper-right, 45° above, 45° to the right.
          Creates the primary specular highlights and defines shadow direction.
          Intensity 2 establishes the key exposure level. */}
      <Lightformer
        form="rect"
        intensity={2}
        color="#ffeedd" // ~5500K warm white
        scale={[10, 5]} // wide softbox = soft shadow edges
        position={[5, 5, -5]}
        target={[0, 0, 0]}
      />

      {/* FILL LIGHT — cooler, dimmer, opposite side of key.
          Key-to-fill ratio is 4:1 (2.0 / 0.5) for a dramatic product look.
          Cool blue-white creates depth through color temperature contrast. */}
      <Lightformer
        form="rect"
        intensity={0.5}
        color="#cceeff" // ~8000K cool blue-white
        scale={[10, 5]}
        position={[-5, 3, 5]}
        target={[0, 0, 0]}
      />

      {/* RIM / BACK LIGHT — concentrated circle, pure white.
          Defines object edges against dark backgrounds.
          Higher intensity (3) compensates for small size (scale 2).
          Essential for the OPS dark aesthetic — without this, dark objects
          merge into the dark background. */}
      <Lightformer
        form="circle"
        intensity={3}
        color="#ffffff"
        scale={2}
        position={[0, 5, -8]}
        target={[0, 0, 0]}
      />

      {/* FLOOR BOUNCE — wide, dim, positioned below.
          Simulates light bouncing off the ground surface.
          Prevents the underside of the product from going pure black. */}
      <Lightformer
        form="rect"
        intensity={0.3}
        color="#ffffff"
        scale={[50, 1]}
        position={[0, -1, 0]}
        rotation-x={Math.PI / 2}
      />
    </Environment>
  );
}

// ---------------------------------------------------------------------------
// Post-Processing Stack
// ---------------------------------------------------------------------------

function PostProcessing() {
  return (
    <EffectComposer multisampling={8}>
      {/* N8AO — screen-space ambient occlusion.
          Adds subtle shadows in creases and contact points.
          aoRadius 0.5 world units, intensity 3 for visible but not overdone. */}
      <N8AO aoRadius={0.5} intensity={3} quality="High" halfRes={false} />

      {/* Bloom — subtle glow on bright specular highlights.
          luminanceThreshold 0.9 ensures only the brightest reflections bloom.
          mipmapBlur is cheaper than default Kawase blur. */}
      <Bloom
        intensity={0.3}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.025}
        mipmapBlur
      />

      {/* ToneMapping — NEUTRAL mode is designed for embedding 3D in web pages.
          Most color-accurate; no hue shifts like ACES_FILMIC. */}
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />

      {/* Vignette — darkens edges to draw focus to center.
          Classic product photography technique. */}
      <Vignette offset={0.3} darkness={0.4} />
    </EffectComposer>
  );
}

// ---------------------------------------------------------------------------
// Example Product: Rounded Box with Realistic Materials
// ---------------------------------------------------------------------------

function ExampleProduct() {
  return (
    <Center top>
      <group>
        {/* Body — brushed titanium */}
        <mesh castShadow>
          <boxGeometry args={[2, 3, 0.4]} />
          <meshPhysicalMaterial
            color="#8a8a8e"
            metalness={1}
            roughness={0.35}
            anisotropy={0.7}
            anisotropyRotation={Math.PI / 2} // horizontal brushing
            clearcoat={0.1}
            clearcoatRoughness={0.4}
            envMapIntensity={1.2}
          />
        </mesh>

        {/* Screen — glossy glass surface */}
        <mesh position={[0, 0, 0.21]}>
          <planeGeometry args={[1.8, 2.8]} />
          <meshPhysicalMaterial
            color="#111111"
            metalness={0}
            roughness={0.05}
            clearcoat={1}
            clearcoatRoughness={0}
            reflectivity={0.5}
            ior={1.52} // Gorilla Glass
            envMapIntensity={1.5}
          />
        </mesh>

        {/* Camera lens — optical glass with iridescent coating */}
        <mesh position={[-0.5, 1.0, -0.22]}>
          <cylinderGeometry args={[0.15, 0.15, 0.05, 32]} />
          <meshPhysicalMaterial
            color="#1a1a2e"
            metalness={0}
            roughness={0}
            transmission={0.3}
            thickness={2}
            ior={1.8} // high-refraction optical glass
            clearcoat={1}
            clearcoatRoughness={0}
            iridescence={0.3}
            iridescenceIOR={2.2}
            iridescenceThicknessRange={[100, 400]}
            envMapIntensity={2}
          />
        </mesh>
      </group>
    </Center>
  );
}

// ---------------------------------------------------------------------------
// Main Scene
// ---------------------------------------------------------------------------

interface ProductShowcaseProps {
  children?: React.ReactNode;
  className?: string;
  enableOrbit?: boolean;
  backgroundColor?: string;
}

export function ProductShowcase({
  children,
  className,
  enableOrbit = true,
  backgroundColor = "#0A0A0A",
}: ProductShowcaseProps) {
  const [dpr, setDpr] = useState<number>(1.5);

  return (
    <Canvas
      className={className}
      camera={{ position: [3, 1.5, 7], fov: 45 }}
      dpr={[1, dpr]}
      frameloop="demand"
      gl={{
        toneMapping: THREE.NoToneMapping, // CRITICAL: handled by postprocessing
        powerPreference: "high-performance",
        alpha: false,
        antialias: false, // handled by EffectComposer multisampling
      }}
      style={{ background: backgroundColor }}
    >
      <Suspense fallback={null}>
        {/* Adaptive quality — raise/lower DPR based on frame rate */}
        <PerformanceMonitor
          onIncline={() => setDpr(2)}
          onDecline={() => setDpr(1)}
          flipflops={3}
        />

        {/* Studio lighting */}
        <StudioLighting />

        {/* Minimal ambient — Lightformers provide bulk of illumination */}
        <ambientLight intensity={0.15} />

        {/* Content */}
        {children || <ExampleProduct />}

        {/* Ground shadow */}
        <ContactShadows
          opacity={0.5}
          scale={10}
          blur={2}
          far={2.5}
          resolution={256}
          position={[0, -0.01, 0]}
          frames={1}
        />

        {/* Camera controls */}
        {enableOrbit && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
            minPolarAngle={Math.PI / 4} // prevent looking from below
            maxPolarAngle={Math.PI / 2} // prevent looking from top
          />
        )}

        {/* Post-processing */}
        <PostProcessing />
      </Suspense>
    </Canvas>
  );
}
