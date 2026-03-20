# Post-Processing Stack Reference

Production post-processing configurations for photorealistic R3F scenes using `@react-three/postprocessing`.

---

## Setup

```bash
npm install @react-three/postprocessing postprocessing
```

**Critical:** When using the `ToneMapping` effect from postprocessing, disable the renderer's built-in tone mapping to avoid double-mapping:

```tsx
<Canvas gl={{ toneMapping: THREE.NoToneMapping }}>
```

---

## EffectComposer

```tsx
import { EffectComposer } from '@react-three/postprocessing'

<EffectComposer
  enabled={true}
  multisampling={8}         // MSAA samples (0 to disable for max perf)
  depthBuffer={true}
  enableNormalPass={true}    // required for SSAO/N8AO
  stencilBuffer={false}
  resolutionScale={1}        // 0.5 = half-res (2x perf boost, slight blur)
/>
```

### Effect Order

Effects are applied in JSX order. Recommended sequence:

1. **Depth-based** — N8AO, SSAO, DepthOfField (need clean depth buffer)
2. **Color/tone** — Bloom, ToneMapping (operate on HDR values)
3. **Noise/grain** — Noise (applied after tone mapping)
4. **Final visual** — Vignette, ChromaticAberration (cosmetic, last pass)

---

## Individual Effects

### N8AO (Recommended over SSAO)

Screen-space ambient occlusion. Adds subtle shadows in creases, corners, and contact points. Creates the depth and grounding that separates amateur from professional rendering.

```tsx
import { N8AO } from '@react-three/postprocessing'

<N8AO
  aoRadius={0.5}              // world units — controls how far AO spreads
  distanceFalloff={1.0}       // how fast AO fades with distance
  intensity={3}               // pow(ao, intensity) — higher = darker shadows
  color={new THREE.Color(0, 0, 0)}  // AO tint (black = natural)
  quality="High"              // Performance | Low | Medium | High | Ultra
  halfRes={false}             // true = 2-4x faster, slight quality loss
  screenSpaceRadius={false}   // true = pixels instead of world units
  depthAwareUpsampling={true} // sharper AO edges
/>
```

### Quality Presets

| Preset | AO Samples | Denoise Samples | Denoise Radius | Cost |
|--------|-----------|-----------------|----------------|------|
| Performance | 8 | 4 | 12 | Lowest |
| Low | 16 | 4 | 12 | Low |
| Medium | 16 | 8 | 12 | Medium |
| High | 64 | 8 | 6 | High |
| Ultra | 64 | 16 | 6 | Highest |

**Guideline:** `High` for hero product shots, `Medium` for interactive scenes, `Performance` for mobile.

### Bloom

Makes bright areas glow. Essential for emissive materials (screens, LEDs, hot spots).

```tsx
import { Bloom } from '@react-three/postprocessing'

<Bloom
  intensity={0.3}                // bloom strength — keep subtle for realism
  luminanceThreshold={0.9}       // only bloom very bright pixels
  luminanceSmoothing={0.025}     // threshold smoothness
  mipmapBlur={true}              // cheaper, higher quality blur
/>
```

### Selective Bloom Technique

Make only specific objects glow by combining `luminanceThreshold` with `toneMapped={false}`:

```tsx
{/* This material will bloom — emissive exceeds tone mapping range */}
<meshStandardMaterial
  emissive="#00ff00"
  emissiveIntensity={2}
  toneMapped={false}         // exempt from tone mapping → stays bright → triggers bloom
/>

{/* This material will NOT bloom — stays within tone-mapped range */}
<meshStandardMaterial color="#555555" />

{/* Bloom with high threshold catches only the toneMapped={false} materials */}
<Bloom luminanceThreshold={1.0} intensity={0.5} mipmapBlur />
```

**The mechanism:** `toneMapped={false}` lets a material's output exceed 1.0 in the HDR buffer. The bloom threshold then selectively catches only those over-bright pixels. Regular materials stay under 1.0 and are invisible to bloom.

### ToneMapping

```tsx
import { ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

<ToneMapping
  mode={ToneMappingMode.NEUTRAL}      // best for product shots in web context
  // mode={ToneMappingMode.ACES_FILMIC}  // cinematic, higher contrast
  adaptive={false}                     // true = auto-exposure
  resolution={256}                     // luminance texture res (for adaptive)
  middleGrey={0.6}                     // target brightness
  maxLuminance={16}
/>
```

### ChromaticAberration

Subtle RGB channel offset. Use very sparingly for photographic realism — heavy values look like a lens defect.

```tsx
import { ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

<ChromaticAberration
  offset={[0.0005, 0.0005]}           // very subtle — larger values = obvious
  blendFunction={BlendFunction.NORMAL}
/>
```

**Guideline:** For product photography, `0.0003-0.0008` is realistic. Above `0.002` starts looking like a lens defect. Omit entirely for clinical/technical renders.

### Vignette

Darkens edges to draw focus to center. Classic product photography technique.

```tsx
import { Vignette } from '@react-three/postprocessing'

<Vignette
  offset={0.3}              // how far from center the darkening starts
  darkness={0.4}            // how dark the edges get
  eskil={false}             // alternative algorithm
/>
```

### DepthOfField

Simulates camera focus — sharp subject, blurred background.

```tsx
import { DepthOfField } from '@react-three/postprocessing'

<DepthOfField
  focusDistance={0.02}       // normalized [0, 1]: 0=near, 1=far
  focalLength={0.02}        // lens focal length [0, 1]
  bokehScale={2}             // bokeh disc size
/>
```

**When to use:** Dramatic product shots with shallow depth of field. Not appropriate for interactive scenes where the user rotates the camera (focus point would change).

### SSAO (Alternative to N8AO)

Standard screen-space AO. N8AO is generally recommended for quality, but SSAO offers different tuning:

```tsx
import { SSAO } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

<SSAO
  blendFunction={BlendFunction.MULTIPLY}
  samples={30}
  rings={4}
  distanceThreshold={1}
  distanceFalloff={0}
  rangeThreshold={0.5}
  rangeFalloff={0.1}
  luminanceInfluence={0.9}
  radius={20}
  intensity={1}
  bias={0.025}
/>
```

---

## Complete Stacks

### Product Photography (Balanced)

For product shots embedded in web pages:

```tsx
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

### Cinematic Hero (Dramatic)

For standalone 3D hero sections:

```tsx
<Canvas gl={{ toneMapping: THREE.NoToneMapping }}>
  {/* ... scene ... */}
  <EffectComposer multisampling={8}>
    <N8AO aoRadius={0.8} intensity={5} quality="High" />
    <DepthOfField focusDistance={0.02} focalLength={0.03} bokehScale={3} />
    <Bloom intensity={0.5} luminanceThreshold={0.8} mipmapBlur />
    <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    <ChromaticAberration offset={[0.0005, 0.0005]} />
    <Vignette offset={0.2} darkness={0.6} />
  </EffectComposer>
</Canvas>
```

### Performance-First (Mobile)

For interactive scenes on mobile:

```tsx
<Canvas gl={{ toneMapping: THREE.NeutralToneMapping }}>
  {/* Use renderer tone mapping — no postprocessing overhead */}
  {/* ... scene ... */}
  {/* If any post-processing needed: */}
  <EffectComposer multisampling={0} resolutionScale={0.5}>
    <N8AO aoRadius={0.5} intensity={2} quality="Performance" halfRes />
    <Bloom intensity={0.2} luminanceThreshold={0.95} mipmapBlur />
  </EffectComposer>
</Canvas>
```

---

## Performance Notes

- Each effect adds a full-screen render pass
- `multisampling={0}` saves significant GPU cost (use FXAA instead if needed)
- `resolutionScale={0.5}` renders post-processing at half resolution — 4x fewer pixels
- `mipmapBlur` on Bloom is cheaper than the default Kawase blur
- N8AO `halfRes` provides 2-4x performance improvement with minimal quality loss
- On mobile: limit to 2-3 effects maximum. Consider skipping post-processing entirely and using renderer-level tone mapping
