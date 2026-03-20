"use client";

/**
 * Realistic Glass Examples
 *
 * Three approaches to glass rendering in R3F, from simplest to most realistic.
 * Each approach trades performance for visual quality.
 *
 * 1. NativeGlass — MeshPhysicalMaterial with transmission (lightest)
 * 2. TransmissionGlass — MeshTransmissionMaterial from drei (most realistic)
 * 3. ScreenGlass — Opaque surface with clearcoat reflections (for device screens)
 */

import { MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// 1. Native Glass (MeshPhysicalMaterial)
//
// Uses Three.js built-in transmission rendering. All transmissive objects in
// the scene share a single buffer — fast, but cannot see through one glass
// object to another.
//
// Best for: background glass objects, many glass items in scene, mobile.
// ---------------------------------------------------------------------------

interface NativeGlassProps {
  color?: string;
  roughness?: number;
  ior?: number;
  thickness?: number;
  tintColor?: string;
  tintDistance?: number;
}

export function NativeGlass({
  color = "#ffffff",
  roughness = 0,
  ior = 1.5,
  thickness = 0.5,
  tintColor,
  tintDistance,
}: NativeGlassProps) {
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={0}
      roughness={roughness}
      transmission={1}
      thickness={thickness}
      ior={ior}
      clearcoat={1}
      clearcoatRoughness={0}
      envMapIntensity={1}
      transparent={true}
      /* Tinted glass — color absorbed into the volume.
         attenuationColor is the color that the glass absorbs:
         shorter attenuationDistance = deeper tint. */
      {...(tintColor
        ? {
            attenuationColor: new THREE.Color(tintColor),
            attenuationDistance: tintDistance ?? 0.5,
          }
        : {})}
    />
  );
}

// ---------------------------------------------------------------------------
// 2. Transmission Glass (drei MeshTransmissionMaterial)
//
// Renders the scene behind each glass object into a separate FBO buffer.
// Supports per-object chromatic aberration, distortion, and anisotropic blur.
// Most realistic glass rendering available in R3F.
//
// Best for: 1-3 hero glass objects, product shots, camera lenses.
// Cost: One extra render pass per glass object.
// ---------------------------------------------------------------------------

interface TransmissionGlassProps {
  roughness?: number;
  thickness?: number;
  chromaticAberration?: number;
  anisotropicBlur?: number;
  distortion?: number;
  samples?: number;
  backside?: boolean;
}

export function TransmissionGlass({
  roughness = 0,
  thickness = 0.5,
  chromaticAberration = 0.03,
  anisotropicBlur = 0.1,
  distortion = 0,
  samples = 6,
  backside = false,
}: TransmissionGlassProps) {
  return (
    <MeshTransmissionMaterial
      transmission={1}
      thickness={thickness}
      roughness={roughness}
      chromaticAberration={chromaticAberration}
      anisotropicBlur={anisotropicBlur}
      distortion={distortion}
      distortionScale={0.5}
      temporalDistortion={0}
      samples={samples}
      backside={backside}
      backsideThickness={backside ? thickness * 0.5 : 0}
    />
  );
}

// ---------------------------------------------------------------------------
// 3. Screen Glass (Opaque with Clearcoat Reflections)
//
// Not truly transparent — the screen content is displayed via emissiveMap
// (CanvasTexture), while clearcoat provides the glassy surface reflections.
// This is the correct approach for device screens where you're showing
// rendered UI content, not looking through the glass.
//
// Best for: phone screens, tablet screens, monitor displays.
// ---------------------------------------------------------------------------

interface ScreenGlassProps {
  screenTexture?: THREE.Texture;
  emissiveIntensity?: number;
  ior?: number;
}

export function ScreenGlass({
  screenTexture,
  emissiveIntensity = 0.8,
  ior = 1.52,
}: ScreenGlassProps) {
  return (
    <meshPhysicalMaterial
      color="#000000"
      metalness={0}
      roughness={0.05}
      /* Clearcoat creates the glass surface reflections.
         The screen itself is opaque — content comes from emissiveMap. */
      clearcoat={1}
      clearcoatRoughness={0}
      reflectivity={0.5}
      ior={ior} // Gorilla Glass / Ceramic Shield: 1.50-1.52
      envMapIntensity={1.5}
      /* Screen content — emissive so it appears self-lit.
         Intensity 0.5-1.0 depending on scene brightness.
         toneMapped={false} if using selective bloom on screen elements. */
      emissive="#ffffff"
      emissiveMap={screenTexture}
      emissiveIntensity={emissiveIntensity}
    />
  );
}

// ---------------------------------------------------------------------------
// Camera Lens Glass (with Anti-Reflective Coating)
//
// Combines transmission (see sensor behind) with iridescence (coating shimmer).
// The iridescence simulates multi-layer anti-reflective coatings that produce
// the characteristic purple/green/blue reflections on camera lenses.
// ---------------------------------------------------------------------------

interface CameraLensGlassProps {
  ior?: number;
  iridescenceIntensity?: number;
}

export function CameraLensGlass({
  ior = 1.8,
  iridescenceIntensity = 0.3,
}: CameraLensGlassProps) {
  return (
    <meshPhysicalMaterial
      color="#1a1a2e" // dark with blue-purple tint
      metalness={0}
      roughness={0}
      transmission={0.3} // partially see-through to dark sensor
      thickness={2}
      ior={ior} // high-refraction optical glass (1.7-1.9)
      clearcoat={1}
      clearcoatRoughness={0}
      /* Iridescence simulates anti-reflective coating.
         iridescenceIOR controls the coating layer's refractive index.
         iridescenceThicknessRange [nm, nm] controls the thin-film
         interference — different thicknesses produce different colors. */
      iridescence={iridescenceIntensity}
      iridescenceIOR={2.2}
      iridescenceThicknessRange={[100, 400]}
      envMapIntensity={2} // strong reflections for specular catch
    />
  );
}

// ---------------------------------------------------------------------------
// Frosted Glass
//
// High roughness on transmission creates the frosted/sandblasted look.
// No clearcoat — frosted glass has no smooth outer layer.
// ---------------------------------------------------------------------------

interface FrostedGlassProps {
  roughness?: number;
  thickness?: number;
  tintColor?: string;
}

export function FrostedGlass({
  roughness = 0.7,
  thickness = 1,
  tintColor,
}: FrostedGlassProps) {
  return (
    <meshPhysicalMaterial
      color="#ffffff"
      metalness={0}
      roughness={roughness} // 0.5-0.8 for varying frost intensity
      transmission={1}
      thickness={thickness}
      ior={1.5}
      {...(tintColor
        ? {
            attenuationColor: new THREE.Color(tintColor),
            attenuationDistance: 0.5,
          }
        : {})}
    />
  );
}
