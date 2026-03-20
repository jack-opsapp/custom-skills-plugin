# Lighting & Shadows Reference

Studio lighting rigs, shadow techniques, color management, and tone mapping for photorealistic R3F scenes.

---

## 1. Environment Component (drei)

### Available Presets

| Preset | HDRI Source | Best For |
|--------|------------|----------|
| `apartment` | `lebombo_1k.hdr` | Warm interior |
| `city` | `potsdamer_platz_1k.hdr` | General purpose (default) |
| `dawn` | `kiara_1_dawn_1k.hdr` | Warm golden hour |
| `forest` | `forest_slope_1k.hdr` | Natural green tones |
| `lobby` | `st_fagans_interior_1k.hdr` | Soft indoor |
| `night` | `dikhololo_night_1k.hdr` | Dark/dramatic (low-key) |
| `park` | `rooitou_park_1k.hdr` | Outdoor natural |
| `studio` | `studio_small_03_1k.hdr` | Product photography |
| `sunset` | `venice_sunset_1k.hdr` | Warm dramatic |
| `warehouse` | `empty_warehouse_01_1k.hdr` | Large open space |

### Environment Props

```tsx
<Environment
  preset="studio"                    // or files="custom.hdr"
  background={false}                 // true | false | "only"
  backgroundBlurriness={0}           // 0-1
  backgroundIntensity={1}
  environmentIntensity={1}           // global reflection brightness
  environmentRotation={[0, 0, 0]}    // rotate HDRI to reposition key light
  ground={false}                     // { height: 15, radius: 60, scale: 1000 } for ground projection
  frames={1}                         // 1 = static, Infinity = recompute every frame
  resolution={256}                   // FBO resolution for Lightformer mode
/>
```

### Recommended Studio HDRIs (Poly Haven — Free, CC0)

For product photography requiring custom HDRIs beyond presets:

| Name | Character | Use Case |
|------|-----------|----------|
| `studio_small_03` | Bright umbrella softbox, crisp white floor | High-contrast product |
| `studio_small_08` | Soft, low-contrast, large softboxes | Even wraparound lighting |
| `studio_small_02` | Bright cool key lamps, strong specular | Specular highlight emphasis |
| `studio_small_04` | Two bright directional lamps, neutral | Strong rim lighting |
| `pav_studio_03` | 20K HDRI, soft windows + softboxes | Portraits, delicate products |

Download from [Poly Haven](https://polyhaven.com/hdris/studio) in 1k or 2k resolution.

---

## 2. Custom Lightformer Studio Rigs

Lightformers are emissive meshes inside `<Environment>` that bake into the environment map. They cost zero at render time — unlimited Lightformers add no draw calls.

### 4-Light Product Photography Rig

```tsx
<Environment resolution={256} frames={1}>
  {/* KEY LIGHT — large rectangular softbox, warm white
      Position: upper-right, 45° above, 45° to the right
      Creates the primary specular highlights and shadows */}
  <Lightformer
    form="rect"
    intensity={2}
    color="#ffeedd"         // ~5500K warm white
    scale={[10, 5]}         // wide softbox = softer shadows
    position={[5, 5, -5]}
    target={[0, 0, 0]}
  />

  {/* FILL LIGHT — cooler, dimmer, opposite side of key
      Fills shadows without eliminating them
      Key-to-fill ratio: 4:1 = dramatic, 2:1 = balanced */}
  <Lightformer
    form="rect"
    intensity={0.5}         // 4:1 ratio with key for dramatic look
    color="#cceeff"         // ~8000K cool blue-white
    scale={[10, 5]}
    position={[-5, 3, 5]}
    target={[0, 0, 0]}
  />

  {/* RIM / BACK LIGHT — defines edges against dark backgrounds
      Essential for dark-themed product shots (OPS aesthetic)
      Concentrated circle shape for a bright edge catch */}
  <Lightformer
    form="circle"
    intensity={3}
    color="#ffffff"
    scale={2}
    position={[0, 5, -8]}
    target={[0, 0, 0]}
  />

  {/* FLOOR BOUNCE — prevents the underside from going pure black
      Wide, dim, positioned below to simulate floor reflection */}
  <Lightformer
    form="rect"
    intensity={0.3}
    color="#ffffff"
    scale={[50, 1]}
    position={[0, -1, 0]}
    rotation-x={Math.PI / 2}
  />
</Environment>
```

### Lightformer Props

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `form` | `"rect"` \| `"circle"` \| `"ring"` | `"rect"` | Shape of the light |
| `intensity` | number | 1 | Emission brightness (multiplied into emissive color) |
| `color` | Color | `"white"` | Light color |
| `scale` | number \| [w, h] | 1 | Physical size — larger = softer light |
| `target` | [x,y,z] \| Vector3 | — | Point the light aims at |
| `toneMapped` | boolean | false | Usually false — let lights exceed tone mapping |

### Light Shaping Principles

1. **Larger source = softer light.** A `scale={[20, 10]}` Lightformer produces much softer shadows than `scale={2}`.
2. **Distance matters.** Moving a light farther away increases hardness (effectively smaller source relative to subject).
3. **Color temperature creates depth.** Warm key + cool fill = natural depth perception. Same-temperature everywhere = flat.
4. **Rim lights separate subject from background.** On dark backgrounds (OPS aesthetic), rim lights are essential — without them, dark objects merge into the background.

---

## 3. Supplementary Real-Time Lights

Use sparingly alongside Lightformers for specific effects:

```tsx
{/* Directional light — sharp specular catch on specific surface */}
<directionalLight
  position={[-4, 5, 6]}
  intensity={0.8}
  color="#ffffff"
  castShadow
  shadow-mapSize={[2048, 2048]}
  shadow-bias={-0.0001}
  shadow-normalBias={0.02}
/>

{/* Accent fill — colored to match brand */}
<directionalLight
  position={[3, 2, -4]}
  intensity={0.15}
  color="#597794"              // OPS accent as fill tint
/>
```

### Performance Budget for Real-Time Lights

- **3 or fewer** real-time lights total for 60fps on mobile
- Each `PointLight` with `castShadow` renders **6 shadow maps** (cube faces)
- Each `DirectionalLight` with `castShadow` renders **1 shadow map**
- Prefer Lightformers (free) for general illumination, reserve real-time lights for cast shadows only

---

## 4. Shadow Techniques

### ContactShadows (Best for Interactive Scenes)

Renders shadows by raycasting from below — works regardless of scene lighting. Good for rotating/animating objects.

```tsx
<ContactShadows
  opacity={0.5}
  scale={10}
  blur={2}                  // shadow softness
  far={2.5}                 // max shadow distance
  resolution={256}          // rendertarget resolution
  color="#000000"
  frames={1}                // 1 = static, Infinity = dynamic
  position={[0, -0.01, 0]} // slightly below ground to prevent z-fighting
/>
```

**When to use:** Interactive objects that rotate/move. Lower visual quality but zero scene-lighting dependency.

### AccumulativeShadows + RandomizedLight (Best for Hero Product Shots)

Raycast-quality penumbra by accumulating many shadow samples over multiple frames. Produces soft, realistic shadows.

```tsx
<AccumulativeShadows
  temporal                  // accumulate over time
  frames={100}              // more frames = cleaner shadow (bake on load)
  blend={100}
  scale={10}
  opacity={1}
  alphaTest={0.65}          // discard faint shadow edges
  color="black"
  colorBlend={2}
  resolution={1024}
  position={[0, -0.01, 0]}
>
  <RandomizedLight
    amount={8}              // number of lights to randomize
    radius={1}              // randomization radius
    ambient={0.5}           // ambient light contribution
    intensity={1}
    position={[5, 5, -10]}
    bias={0.001}
    mapSize={1024}
    size={5}
  />
</AccumulativeShadows>
```

**When to use:** Static or slowly-animating hero objects where shadow quality is paramount. The 100-frame bake produces photography-grade penumbra.

### SoftShadows (PCSS — Percentage-Closer Soft Shadows)

Injects PCSS into all shadow-casting lights. Shadows get softer with distance from the caster (physically accurate penumbra falloff).

```tsx
<SoftShadows
  size={25}                 // light source size (larger = softer)
  samples={10}              // more = less noise, more expensive
  focus={0}                 // depth focal point
/>
```

**When to use:** When you need physically-accurate penumbra on multiple objects with real-time shadow-casting lights.

### Shadow Comparison

| Technique | Quality | Cost | Dynamic? | Best For |
|-----------|---------|------|----------|----------|
| ContactShadows | Medium | Low | Yes | Interactive objects, dark scenes |
| AccumulativeShadows | Excellent | High (bake) | Semi (re-bake) | Hero product shots, marketing |
| SoftShadows (PCSS) | Good | Medium | Yes | Multi-object scenes with real-time lights |
| Native shadow maps | Basic | Low | Yes | Simple scenes, many objects |

### Shadow Map Configuration (for real-time lights)

```tsx
<directionalLight
  castShadow
  shadow-mapSize={[2048, 2048]}    // 512-1024 mobile, 1024-2048 desktop, 4096 quality-critical
  shadow-bias={-0.0001}            // prevents shadow acne
  shadow-normalBias={0.02}         // prevents peter-panning
  shadow-camera-near={0.5}
  shadow-camera-far={20}
  shadow-camera-left={-5}
  shadow-camera-right={5}
  shadow-camera-top={5}
  shadow-camera-bottom={-5}
/>
```

For static scenes, disable auto-update after initial render:
```tsx
useEffect(() => {
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true; // render once
}, []);
```

---

## 5. Color Management & Tone Mapping

### Color Space (Three.js r152+)

Three.js defaults to correct color management:
- `renderer.outputColorSpace = THREE.SRGBColorSpace` (default)
- `THREE.ColorManagement.enabled = true` (default)

**Critical rule:** Color/albedo textures use sRGB. Data textures (normal, roughness, metalness, AO) use Linear. `useTexture` from drei handles this automatically for loaded files — but when creating textures programmatically (CanvasTexture, DataTexture), set color space explicitly:

```tsx
const canvasTexture = new THREE.CanvasTexture(canvas);
canvasTexture.colorSpace = THREE.SRGBColorSpace; // for visual content
// or
canvasTexture.colorSpace = THREE.LinearSRGBColorSpace; // for data
```

### Tone Mapping

Tone mapping compresses HDR lighting into displayable LDR range. Set on the renderer or via postprocessing.

**Renderer-level** (simple):
```tsx
<Canvas gl={{ toneMapping: THREE.NeutralToneMapping }} />
```

**Postprocessing-level** (more control):
```tsx
// CRITICAL: disable renderer tone mapping when using postprocessing ToneMapping
<Canvas gl={{ toneMapping: THREE.NoToneMapping }}>
  <EffectComposer>
    <ToneMapping mode={ToneMappingMode.NEUTRAL} />
  </EffectComposer>
</Canvas>
```

### Tone Mapping Mode Comparison

| Mode | Hue Shift | Contrast | Best For |
|------|-----------|----------|----------|
| `NeutralToneMapping` | Minimal | Natural | Product photography, 3D embedded in 2D pages |
| `ACESFilmicToneMapping` | Orange→yellow | High (cinematic) | Dramatic hero shots, standalone 3D |
| `AgXToneMapping` | Minimal | Flat (needs grading) | Color grading pipelines |
| `ReinhardToneMapping` | Minimal | Soft | Even exposure, documentary feel |
| `LinearToneMapping` | None | None (raw) | Technical visualization, accurate colors |
| `CineonToneMapping` | Slight | Medium | Film emulation |

**Recommendation:** Use `NeutralToneMapping` for product shots embedded in web pages (designed specifically for this use case). Use `ACESFilmicToneMapping` for standalone hero 3D scenes where cinematic drama is appropriate.

### Exposure Control

Control overall scene brightness:
```tsx
<Canvas gl={{ toneMappingExposure: 1.2 }}>
// or dynamically:
useFrame(({ gl }) => {
  gl.toneMappingExposure = 1.2;
});
```

---

## 6. Combining Environment with Real-Time Lights

The most realistic results combine an HDRI or Lightformer environment (for ambient/reflected light) with 1-2 real-time directional lights (for cast shadows and sharp specular catches):

```tsx
<Environment resolution={256} frames={1}>
  <Lightformer form="rect" intensity={2} color="#ffeedd"
    scale={[10, 5]} position={[5, 5, -5]} target={[0, 0, 0]} />
  <Lightformer form="rect" intensity={0.5} color="#cceeff"
    scale={[10, 5]} position={[-5, 3, 5]} target={[0, 0, 0]} />
  <Lightformer form="circle" intensity={3} color="#ffffff"
    scale={2} position={[0, 5, -8]} target={[0, 0, 0]} />
</Environment>

{/* One directional light for cast shadows — matches key Lightformer direction */}
<directionalLight
  position={[5, 5, -5]}
  intensity={0.3}           // lower than Lightformer — supplementary only
  castShadow
  shadow-mapSize={[2048, 2048]}
/>

{/* Minimal ambient to prevent pure-black areas without Environment */}
<ambientLight intensity={0.15} />
```

The Environment provides the bulk of illumination through reflections and diffuse lighting. The directional light adds crisp shadow definition that environment maps alone cannot provide.
