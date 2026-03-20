"use client";

/**
 * Studio Lighting Rig — Custom Lightformer Configurations
 *
 * Three preset lighting rigs for different product photography moods.
 * Each rig uses Lightformers inside Environment — zero runtime cost
 * regardless of Lightformer count (they bake into the environment map).
 *
 * Rigs:
 *   - ProductStudioRig: Balanced 4-light setup (default)
 *   - DramaticRig: High-contrast, strong rim, moody
 *   - SoftRig: Diffused, even, low-contrast
 */

import { Environment, Lightformer } from "@react-three/drei";

// ---------------------------------------------------------------------------
// Balanced Product Studio — 4 lights
// Key-to-fill ratio: 4:1 (dramatic but readable)
// Best for: general product photography, device mockups
// ---------------------------------------------------------------------------

export function ProductStudioRig() {
  return (
    <Environment resolution={256} frames={1}>
      {/* KEY — upper right, warm, primary specular source */}
      <Lightformer
        form="rect"
        intensity={2}
        color="#ffeedd"
        scale={[10, 5]}
        position={[5, 5, -5]}
        target={[0, 0, 0]}
      />

      {/* FILL — opposite side, cool, shadow softening
          0.5 intensity = 4:1 ratio with key for dramatic depth */}
      <Lightformer
        form="rect"
        intensity={0.5}
        color="#cceeff"
        scale={[10, 5]}
        position={[-5, 3, 5]}
        target={[0, 0, 0]}
      />

      {/* RIM — behind subject, defines silhouette edges
          Critical for dark-on-dark scenes (OPS aesthetic) */}
      <Lightformer
        form="circle"
        intensity={3}
        color="#ffffff"
        scale={2}
        position={[0, 5, -8]}
        target={[0, 0, 0]}
      />

      {/* FLOOR BOUNCE — prevents underside from going black */}
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
// Dramatic Rig — 5 lights
// Key-to-fill ratio: 8:1 (deep shadows, strong highlights)
// Best for: hero shots, marketing images, cinematic presentations
// ---------------------------------------------------------------------------

export function DramaticRig() {
  return (
    <Environment resolution={256} frames={1}>
      {/* KEY — narrow and intense for sharp specular catches */}
      <Lightformer
        form="rect"
        intensity={3}
        color="#ffd4a0" // warmer than standard — golden hour feel
        scale={[6, 3]} // narrower = harder light = more dramatic
        position={[4, 6, -3]}
        target={[0, 0, 0]}
      />

      {/* FILL — barely there, just preventing total blackout
          8:1 ratio (3 / ~0.37) for deep shadow contrast */}
      <Lightformer
        form="rect"
        intensity={0.37}
        color="#b0c0d0" // cool blue to push shadows blue
        scale={[8, 4]}
        position={[-6, 2, 4]}
        target={[0, 0, 0]}
      />

      {/* RIM #1 — strong upper back for dramatic edge definition */}
      <Lightformer
        form="circle"
        intensity={4}
        color="#ffffff"
        scale={1.5}
        position={[-2, 7, -6]}
        target={[0, 0, 0]}
      />

      {/* RIM #2 — secondary rim on opposite side for symmetrical edge glow */}
      <Lightformer
        form="circle"
        intensity={2}
        color="#ffffff"
        scale={1}
        position={[3, 4, -7]}
        target={[0, 0, 0]}
      />

      {/* ACCENT — small, colored, adds brand-tinted catch light
          Uses OPS accent color as a subtle brand fingerprint in reflections */}
      <Lightformer
        form="circle"
        intensity={1.5}
        color="#597794" // OPS accent
        scale={0.5}
        position={[-3, 1, 3]}
        target={[0, 0, 0]}
      />
    </Environment>
  );
}

// ---------------------------------------------------------------------------
// Soft Rig — 6 lights
// Key-to-fill ratio: 1.5:1 (very even, almost flat)
// Best for: technical documentation, product detail views, clinical accuracy
// ---------------------------------------------------------------------------

export function SoftRig() {
  return (
    <Environment resolution={256} frames={1}>
      {/* Large wrap-around lights from multiple angles for even coverage */}

      {/* TOP — wide overhead, neutral white */}
      <Lightformer
        form="rect"
        intensity={1.2}
        color="#ffffff"
        scale={[20, 20]}
        position={[0, 8, 0]}
        rotation-x={Math.PI / 2}
      />

      {/* FRONT LEFT — large, soft, slightly warm */}
      <Lightformer
        form="rect"
        intensity={0.8}
        color="#fff8f0"
        scale={[12, 8]}
        position={[-4, 3, 5]}
        target={[0, 0, 0]}
      />

      {/* FRONT RIGHT — matching opposite, slightly cool for subtle depth */}
      <Lightformer
        form="rect"
        intensity={0.8}
        color="#f0f4ff"
        scale={[12, 8]}
        position={[4, 3, 5]}
        target={[0, 0, 0]}
      />

      {/* BACK LEFT */}
      <Lightformer
        form="rect"
        intensity={0.6}
        color="#ffffff"
        scale={[10, 6]}
        position={[-4, 4, -5]}
        target={[0, 0, 0]}
      />

      {/* BACK RIGHT */}
      <Lightformer
        form="rect"
        intensity={0.6}
        color="#ffffff"
        scale={[10, 6]}
        position={[4, 4, -5]}
        target={[0, 0, 0]}
      />

      {/* FLOOR — stronger bounce for soft fill from below */}
      <Lightformer
        form="rect"
        intensity={0.5}
        color="#ffffff"
        scale={[50, 50]}
        position={[0, -2, 0]}
        rotation-x={Math.PI / 2}
      />
    </Environment>
  );
}

// ---------------------------------------------------------------------------
// Rig selector (convenience)
// ---------------------------------------------------------------------------

type RigPreset = "product" | "dramatic" | "soft";

interface LightingRigProps {
  preset?: RigPreset;
}

export function LightingRig({ preset = "product" }: LightingRigProps) {
  switch (preset) {
    case "dramatic":
      return <DramaticRig />;
    case "soft":
      return <SoftRig />;
    case "product":
    default:
      return <ProductStudioRig />;
  }
}
