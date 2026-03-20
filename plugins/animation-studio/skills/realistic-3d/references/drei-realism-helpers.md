# Drei Realism Helpers Reference

Specialized drei components for photorealistic rendering. These complement the basic drei helpers covered in `web-animations/references/three-js-r3f.md`.

---

## MeshTransmissionMaterial (Realistic Glass)

More realistic than native `MeshPhysicalMaterial` transmission — renders the scene behind the object into a separate buffer with per-object refraction, chromatic aberration, and distortion.

```tsx
import { MeshTransmissionMaterial } from '@react-three/drei'

<mesh>
  <sphereGeometry args={[1, 64, 64]} />
  <MeshTransmissionMaterial
    transmission={1}                 // 0-1, transparency amount
    thickness={0.5}                  // refraction depth (world units)
    roughness={0}                    // blur amount
    chromaticAberration={0.03}       // RGB channel separation through glass
    anisotropicBlur={0.1}            // directional blur
    distortion={0}                   // warping effect
    distortionScale={0.5}            // distortion frequency
    temporalDistortion={0}           // animated distortion
    samples={6}                      // refraction render samples (more = quality)
    resolution={undefined}           // FBO resolution (undefined = fullscreen)
    backside={false}                 // render backside for thick glass
    backsideThickness={0}            // thickness when backside=true
    transmissionSampler={false}      // use Three's shared buffer (faster but limited)
  />
</mesh>
```

### When to Use vs. Native Transmission

| Feature | MeshTransmissionMaterial | Native `transmission` on MeshPhysicalMaterial |
|---------|--------------------------|----------------------------------------------|
| Per-object chromatic aberration | Yes | No |
| Per-object distortion | Yes | No |
| Sees other transmissive objects | Yes (separate buffer per mesh) | No (shared buffer) |
| Performance | Heavier (extra render pass per object) | Lighter |
| Temporal distortion animation | Yes | No |

**Rule:** Use `MeshTransmissionMaterial` for hero glass objects (1-3 in scene). Use native `transmission` for background/many glass objects.

### Shared Buffer Optimization

When multiple glass objects need to see the same background:

```tsx
const buffer = useFBO()

{/* All glass objects share one buffer render */}
<GlassObject1 buffer={buffer.texture} />
<GlassObject2 buffer={buffer.texture} />
```

---

## MeshReflectorMaterial (Reflective Ground)

Creates reflective surfaces like polished floors, water, or mirrors by rendering a mirrored view of the scene.

```tsx
import { MeshReflectorMaterial } from '@react-three/drei'

<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
  <planeGeometry args={[20, 20]} />
  <MeshReflectorMaterial
    blur={[300, 100]}             // [x, y] blur amount (0 = mirror)
    resolution={1024}             // reflection FBO resolution
    mixBlur={1}                   // blur interpolation (0-1)
    mixStrength={0.8}             // reflection strength (0-1)
    roughness={0.5}               // surface roughness
    depthScale={1.2}              // depth-based reflection scale
    minDepthThreshold={0.4}       // depth range start
    maxDepthThreshold={1.4}       // depth range end
    color="#151515"                // surface base color
    metalness={0.5}
    mirror={0}                    // 0 = use roughness-based reflections, 1 = perfect mirror
  />
</mesh>
```

### Common Configurations

**Polished dark floor (OPS aesthetic):**
```tsx
<MeshReflectorMaterial
  blur={[400, 200]}
  resolution={1024}
  mixBlur={1}
  mixStrength={0.5}
  roughness={0.6}
  color="#0a0a0a"
  metalness={0.3}
/>
```

**Water surface:**
```tsx
<MeshReflectorMaterial
  blur={[512, 512]}
  resolution={512}
  mixBlur={0.8}
  mixStrength={0.6}
  roughness={0.2}
  color="#001020"
  metalness={0.1}
  distortion={0.5}              // needs distortionMap or will be flat
/>
```

---

## Caustics

Simulates light refraction patterns (the dancing light patterns on the bottom of a pool, or light through a glass on a table).

```tsx
import { Caustics } from '@react-three/drei'

<Caustics
  color="#ffffff"                   // caustic light color
  worldRadius={0.3}                // world-space radius
  ior={1.1}                        // index of refraction
  intensity={0.05}                 // light intensity
  causticsOnly={false}             // true = transparent outside caustics
  backside={false}                 // trace backside for thick objects
  frames={1}                       // 1 = static, Infinity = dynamic
>
  {/* Objects that cast caustics */}
  <mesh>
    <sphereGeometry args={[1, 64, 64]} />
    <meshPhysicalMaterial transmission={1} thickness={1} ior={1.5} />
  </mesh>
</Caustics>
```

### Multi-Light Caustics

```tsx
{/* Each Caustics component represents one light source */}
<Caustics lightSource={[5, 5, -5]} frames={1}>
  <GlassObject />
</Caustics>
<Caustics lightSource={[-5, 3, 5]} frames={1} intensity={0.02}>
  <GlassObject />
</Caustics>
```

---

## SpotLight (Volumetric)

Volumetric spotlight with visible light cone (like a stage light cutting through fog).

```tsx
import { SpotLight } from '@react-three/drei'

<SpotLight
  position={[0, 5, 0]}
  angle={0.5}                      // cone angle (radians)
  penumbra={0.5}                   // edge softness (0-1)
  intensity={2}
  color="#ffffff"
  distance={10}
  castShadow

  {/* Volumetric props */}
  volumetric={true}                // enable visible light cone
  opacity={0.2}                    // cone opacity
  radiusTop={0.1}                  // cone top radius
  radiusBottom={1}                 // cone bottom radius (auto from angle if omitted)
  depthBuffer={depthBuffer}        // from useDepthBuffer() for soft particle blending
  attenuation={5}                  // volumetric falloff
/>
```

### useDepthBuffer for Soft Blending

```tsx
import { useDepthBuffer } from '@react-three/drei'

function Scene() {
  const depthBuffer = useDepthBuffer({ frames: 1 })

  return (
    <SpotLight
      volumetric
      depthBuffer={depthBuffer}    // enables soft particle blending at intersections
      opacity={0.15}
      attenuation={5}
    />
  )
}
```

---

## Stage (Quick Product Setup)

One-component product photography stage with preset lighting, shadows, and camera framing.

```tsx
import { Stage } from '@react-three/drei'

<Stage
  preset="rembrandt"               // lighting arrangement
  intensity={0.5}                  // brightness multiplier
  environment="studio"             // Environment preset or props
  shadows="contact"                // shadow type
  adjustCamera={true}              // auto-center and frame object
  center={undefined}               // Center component props
>
  <MyProductModel />
</Stage>
```

### Stage Presets

| Preset | Key Light | Fill Light | Character |
|--------|-----------|------------|-----------|
| `"rembrandt"` | Upper-right (classic triangle shadow) | Lower-left | Dramatic, classical |
| `"portrait"` | Front-center | Both sides | Even, flattering |
| `"upfront"` | Front above | Rear | Bright, commercial |
| `"soft"` | Overhead, spread | All sides | Soft, diffused |
| Custom `{ main: [x,y,z], fill: [x,y,z] }` | Custom position | Custom position | Full control |

### Shadow Options

| Value | Technique | Quality |
|-------|-----------|---------|
| `"contact"` | ContactShadows | Medium — good for interactive |
| `"accumulative"` | AccumulativeShadows | Excellent — hero product |
| `true` | Real-time shadow maps | Basic — multiple objects |
| `false` | No shadows | Maximum performance |

### When to Use Stage vs. Custom Setup

**Use Stage when:**
- Prototyping a product shot quickly
- The preset lighting is close enough
- You need a one-liner to get started

**Build custom when:**
- You need specific Lightformer placement
- The brand has specific lighting requirements
- You need to combine multiple shadow techniques
- The scene has multiple objects with different lighting needs

---

## ContactShadows

See `references/lighting-and-shadows.md` for full shadow comparison. Quick reference:

```tsx
import { ContactShadows } from '@react-three/drei'

<ContactShadows
  opacity={0.5}
  scale={10}
  blur={2}
  far={2.5}
  resolution={256}
  color="#000000"
  frames={1}
  position={[0, -0.01, 0]}
/>
```

---

## AccumulativeShadows

See `references/lighting-and-shadows.md` for full shadow comparison. Quick reference:

```tsx
import { AccumulativeShadows, RandomizedLight } from '@react-three/drei'

<AccumulativeShadows temporal frames={100} scale={10}
  opacity={1} alphaTest={0.65} color="black" resolution={1024}>
  <RandomizedLight amount={8} radius={1} ambient={0.5}
    intensity={1} position={[5, 5, -10]} />
</AccumulativeShadows>
```

---

## Bounds (Auto-Framing)

Automatically positions and sizes the camera to frame a group of objects.

```tsx
import { Bounds, useBounds } from '@react-three/drei'

<Bounds fit clip observe margin={1.2}>
  <MyProductModel />
</Bounds>
```

### Programmatic Control

```tsx
function FitButton() {
  const bounds = useBounds()

  return (
    <mesh onClick={() => bounds.refresh().clip().fit()}>
      {/* Click to re-frame */}
    </mesh>
  )
}
```

---

## Center

Centers a group of objects at the origin.

```tsx
import { Center } from '@react-three/drei'

<Center top>                       // top = align bottom at y=0
  <MyProductModel />
</Center>
```

Props: `top`, `bottom`, `left`, `right`, `front`, `back` — boolean alignment flags.

---

## PerformanceMonitor (Adaptive Quality)

Monitors frame rate and triggers quality adjustments:

```tsx
import { PerformanceMonitor } from '@react-three/drei'

<PerformanceMonitor
  onIncline={() => {
    // FPS is good — increase quality
    setDpr(2)
    setPostProcessing(true)
  }}
  onDecline={() => {
    // FPS dropping — reduce quality
    setDpr(1)
    setPostProcessing(false)
  }}
  flipflops={3}                    // fallback after N quality oscillations
  bounds={(refreshrate) => [30, refreshrate]}  // acceptable FPS range
/>
```

---

## useEnvironment (Programmatic HDRI)

Load environment maps programmatically:

```tsx
import { useEnvironment } from '@react-three/drei'

function Scene() {
  const envMap = useEnvironment({ preset: 'studio' })
  // or: useEnvironment({ files: '/hdri/custom.hdr' })

  return (
    <mesh>
      <meshPhysicalMaterial envMap={envMap} envMapIntensity={1.5} />
    </mesh>
  )
}
```
