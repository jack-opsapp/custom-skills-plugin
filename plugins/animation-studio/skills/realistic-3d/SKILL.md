---
name: realistic-3d
description: Photorealistic 3D rendering in React Three Fiber — PBR materials, studio lighting, post-processing, texture workflow, and product photography techniques. This skill should be used when the user asks to "make it look realistic", "add realistic materials", "studio lighting", "product shot", "photorealistic rendering", "PBR materials", "glass material", "metal material", "titanium", "brushed metal", "iPhone model", "device mockup 3D", "environment map", "HDRI lighting", "tone mapping", "post-processing stack", or mentions MeshPhysicalMaterial, MeshTransmissionMaterial, Lightformer, clearcoat, transmission, anisotropy, iridescence, IOR, "realistic shadows", or "environment lighting".
metadata:
  priority: 7
  pathPatterns:
    - "**/phone-scene/**"
    - "**/phone-model*"
    - "**/*scene*/*.tsx"
    - "**/*model*/*.tsx"
    - "**/3d/**"
    - "**/product-*/**"
    - "**/*environment*"
    - "**/*lighting*"
    - "**/*material*"
  importPatterns:
    - "MeshPhysicalMaterial"
    - "MeshTransmissionMaterial"
    - "MeshReflectorMaterial"
    - "Lightformer"
    - "AccumulativeShadows"
    - "ContactShadows"
    - "Caustics"
    - "Stage"
    - "EffectComposer"
    - "postprocessing"
    - "@react-three/postprocessing"
  promptSignals:
    phrases:
      - "realistic"
      - "photorealistic"
      - "pbr"
      - "material recipe"
      - "studio lighting"
      - "product shot"
      - "glass material"
      - "metal material"
      - "titanium"
      - "brushed metal"
      - "iphone model"
      - "device mockup"
      - "environment map"
      - "hdri"
      - "tone mapping"
      - "clearcoat"
      - "transmission"
      - "anisotropy"
      - "iridescence"
      - "ior"
      - "refraction"
      - "caustics"
      - "shadow quality"
      - "post-processing"
      - "realistic shadows"
      - "environment lighting"
---

# Photorealistic 3D Rendering

Physically-based rendering knowledge for producing product-photography-quality 3D scenes in React Three Fiber. This skill provides material recipes, lighting rigs, post-processing stacks, and texture workflows — everything needed to make 3D objects look indistinguishable from real photographs.

This skill complements `web-animations` (which covers R3F scene setup, animation patterns, physics, and general 3D). Load both when building photorealistic interactive 3D.

## Relationship to Other Skills

- **animation-architect** (gateway) makes the emotional/framework decision first
- **web-animations** provides R3F scene scaffolding, animation loops, reduced motion, instancing
- **realistic-3d** (this skill) provides the material science, lighting craft, and visual fidelity layer

## Core Principle: Physical Accuracy Over Artistic Approximation

Every material parameter maps to a real physical property. Do not guess values — use measured IOR tables, calibrated roughness, and physically-motivated lighting. When a surface looks wrong, the fix is almost always a physics parameter, not an artistic adjustment.

---

## 1. MeshPhysicalMaterial — The Foundation

`MeshPhysicalMaterial` is the only material suitable for photorealistic rendering. It extends `MeshStandardMaterial` with clearcoat, transmission, anisotropy, iridescence, sheen, and specular control.

### Critical Properties (beyond roughness/metalness)

| Property | Range | Purpose |
|----------|-------|---------|
| `clearcoat` | 0-1 | Transparent reflective layer (car paint, lacquer, screen glass) |
| `clearcoatRoughness` | 0-1 | Blur of clearcoat reflections |
| `transmission` | 0-1 | Physical transparency (glass, liquids — replaces `opacity` for realism) |
| `thickness` | world units | Volume depth for transmissive materials (affects refraction + attenuation) |
| `ior` | 1.0-2.333 | Index of refraction — determines reflection intensity and refraction angle |
| `anisotropy` | 0-1 | Directional reflection stretching (brushed metal, hair, carbon fiber) |
| `anisotropyRotation` | radians | Direction of anisotropic brushing |
| `iridescence` | 0-1 | Thin-film interference (soap bubbles, oil slicks, lens coatings) |
| `iridescenceIOR` | 1.0-2.333 | IOR of the iridescent layer |
| `iridescenceThicknessRange` | [nm, nm] | Min/max nanometer thickness of iridescent film |
| `sheen` | 0-1 | Fabric/cloth edge glow |
| `sheenColor` | Color | Tint of sheen highlight |
| `sheenRoughness` | 0-1 | Sheen spread |
| `specularIntensity` | 0-1 | Non-metal specular reflection strength |
| `specularColor` | Color | Non-metal specular tint |
| `attenuationColor` | Color | Color absorbed by transmissive volume (tinted glass) |
| `attenuationDistance` | world units | Distance for full color absorption |
| `dispersion` | 0+ | Chromatic splitting through volume (prisms, crystal) |

### The Metal/Dielectric Rule

- **Metals** (`metalness: 1`): Color comes from reflections. The `color` property tints reflections, not the surface. Roughness controls reflection blur.
- **Dielectrics** (`metalness: 0`): Color comes from diffuse scattering. Reflections are white (unless `specularColor` is set). IOR controls reflection intensity at normal incidence.

### Quick Material Lookup

See `references/material-recipes.md` for copy-paste-ready material definitions for: iPhone glass screen, brushed titanium, polished chrome, matte aluminum, camera lens glass, glossy plastic, matte rubber, fabric/cloth, frosted glass, clear glass, gold, copper, carbon fiber.

See `references/ior-reference.md` for IOR values of 30+ real-world materials.

---

## 2. Lighting for Product Photography

### Custom Lightformer Studio Rig (Recommended)

Environment presets (`"studio"`, `"city"`, etc.) provide generic lighting. For product photography, build a custom rig using `<Lightformer>` components inside `<Environment>`:

```tsx
<Environment resolution={256} frames={1}>
  {/* Key light — large rect softbox, warm, primary illumination */}
  <Lightformer form="rect" intensity={2} color="#ffeedd"
    scale={[10, 5]} position={[5, 5, -5]} target={[0, 0, 0]} />
  {/* Fill light — softer, cooler, prevents harsh shadows */}
  <Lightformer form="rect" intensity={0.5} color="#cceeff"
    scale={[10, 5]} position={[-5, 3, 5]} target={[0, 0, 0]} />
  {/* Rim light — defines edges, separates object from background */}
  <Lightformer form="circle" intensity={3} color="#ffffff"
    scale={2} position={[0, 5, -8]} target={[0, 0, 0]} />
  {/* Floor bounce — prevents bottom from going pure black */}
  <Lightformer form="rect" intensity={0.3} color="#ffffff"
    scale={[50, 1]} position={[0, -1, 0]} rotation-x={Math.PI / 2} />
</Environment>
```

Lightformers are emissive meshes baked into the environment map — zero runtime cost regardless of count. Unlike RectAreaLights (limited to 1-2 on mobile), unlimited Lightformers are free.

### Lighting Design Rules

1. **Key-to-fill ratio** determines mood: 4:1 = dramatic, 2:1 = balanced, 1:1 = flat/clinical
2. **Rim lights** define object edges against dark backgrounds — essential for dark-themed product shots
3. **Color temperature**: warm key (5500-6500K / #ffeedd) + cool fill (8000K+ / #cceeff) creates depth
4. **envMapIntensity** per material controls how much each surface reflects the environment — polish it per-material, not globally

See `references/lighting-and-shadows.md` for shadow technique comparison (ContactShadows vs AccumulativeShadows vs SoftShadows), color management (tone mapping modes), and advanced lighting patterns.

---

## 3. Post-Processing for Product Photography

### Recommended Stack

```tsx
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing'
import { N8AO } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

// CRITICAL: Disable renderer tone mapping when using postprocessing ToneMapping
<Canvas gl={{ toneMapping: THREE.NoToneMapping }}>
  {/* ... scene ... */}
  <EffectComposer multisampling={8}>
    <N8AO aoRadius={0.5} intensity={3} quality="High" />
    <Bloom intensity={0.3} luminanceThreshold={0.9} mipmapBlur />
    <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    <Vignette offset={0.3} darkness={0.4} />
  </EffectComposer>
</Canvas>
```

### Tone Mapping Selection

| Mode | Best For | Tradeoff |
|------|----------|----------|
| `NEUTRAL` | Product photography, embedding 3D in 2D pages | Most color-accurate, designed for mixed media |
| `ACES_FILMIC` | Cinematic, dramatic hero shots | Shifts hues (oranges→yellow), higher contrast |
| `AGX` | Color grading pipelines | Flat base, needs post-grade |

See `references/post-processing-stack.md` for complete effect configuration, N8AO quality presets, selective bloom technique, and depth-of-field setup.

---

## 4. Drei Realism Helpers

### MeshTransmissionMaterial (Realistic Glass)

More realistic than native `transmission` — renders scene behind the object into a buffer with per-object chromatic aberration and distortion:

```tsx
<MeshTransmissionMaterial
  transmission={1} thickness={0.5} roughness={0}
  chromaticAberration={0.03} anisotropicBlur={0.1}
  samples={6} backside={false}
/>
```

### AccumulativeShadows (Hero Product Shadows)

Raycast-quality penumbra for static or slowly-animating objects:

```tsx
<AccumulativeShadows temporal frames={100} scale={10}
  opacity={1} alphaTest={0.65} color="black">
  <RandomizedLight amount={8} radius={1} ambient={0.5}
    intensity={1} position={[5, 5, -10]} />
</AccumulativeShadows>
```

### Stage (Quick Product Setup)

One-liner product photography stage with preset lighting:

```tsx
<Stage preset="rembrandt" intensity={0.5}
  environment="studio" shadows="contact" adjustCamera />
```

See `references/drei-realism-helpers.md` for MeshReflectorMaterial, Caustics, SpotLight volumetric, and complete prop reference for each helper.

---

## 5. Texture Workflow

### PBR Map Types

| Map | Color Space | Channel | Purpose |
|-----|-------------|---------|---------|
| Albedo/Color | sRGB | RGB | Base color |
| Normal | Linear | RGB | Surface detail without geometry |
| Roughness | Linear | Single (G) | Reflection blur |
| Metalness | Linear | Single (B) | Metal vs dielectric |
| AO | Linear | Single (R) | Ambient occlusion |
| ORM (packed) | Linear | R=AO, G=Rough, B=Metal | Single texture for 3 maps |

### Loading

```tsx
const textures = useTexture({
  map: '/textures/color.jpg',
  normalMap: '/textures/normal.jpg',
  roughnessMap: '/textures/roughness.jpg',
})
<meshPhysicalMaterial {...textures} />
```

See `references/texture-workflow.md` for KTX2/Basis compression, ORM packing, texture sources (ambientCG, Poly Haven), and GLTF optimization pipeline.

---

## 6. Performance for Photorealistic Scenes

### Canvas Configuration

```tsx
<Canvas
  gl={{ powerPreference: "high-performance", alpha: false,
        antialias: false, stencil: false, depth: false }}
  dpr={[1, 1.5]}          // Cap at 1.5x — photorealistic scenes are GPU-heavy
  frameloop="demand"       // Only render when state changes
/>
```

### Adaptive Quality

```tsx
<PerformanceMonitor
  onIncline={() => setDpr(2)}
  onDecline={() => setDpr(1)}
  flipflops={3}
/>
```

### Key Targets

- Under 100 draw calls per frame for 60fps on mobile
- 3 or fewer real-time lights (use Lightformers instead — they are free)
- Shadow maps: 512-1024 mobile, 1024-2048 desktop
- `renderer.shadowMap.autoUpdate = false` for static scenes
- Half-resolution post-processing for 2x frame rate improvement

---

## Reference File Index

| File | Content | When to Load |
|------|---------|-------------|
| `references/material-recipes.md` | Copy-paste MeshPhysicalMaterial configs for 15+ real surfaces | Building any realistic material |
| `references/ior-reference.md` | IOR values for 30+ real-world materials | Setting IOR on glass, plastic, crystal, metal |
| `references/lighting-and-shadows.md` | Studio lighting rigs, shadow techniques, tone mapping, color management | Setting up lighting or shadows |
| `references/post-processing-stack.md` | EffectComposer, N8AO, Bloom, ToneMapping, selective glow | Adding post-processing |
| `references/drei-realism-helpers.md` | MeshTransmissionMaterial, MeshReflectorMaterial, Caustics, Stage, AccumulativeShadows | Using drei for realistic effects |
| `references/texture-workflow.md` | PBR maps, KTX2 compression, useTexture, GLTF pipeline | Working with textures |

## Example File Index

| File | Pattern | When to Use |
|------|---------|-------------|
| `examples/product-showcase.tsx` | Complete product photography scene with Lightformers + post-processing | Starting a new product 3D scene |
| `examples/studio-lighting-rig.tsx` | Custom Lightformer Environment setup | Setting up studio lighting |
| `examples/realistic-glass.tsx` | MeshTransmissionMaterial with chromatic aberration | Making glass look real |
