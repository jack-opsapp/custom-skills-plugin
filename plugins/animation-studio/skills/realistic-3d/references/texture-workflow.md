# Texture Workflow Reference

PBR texture maps, loading patterns, compression, and optimization for photorealistic R3F scenes.

---

## 1. PBR Texture Map Types

| Map | Color Space | Channel(s) | Purpose | Required? |
|-----|-------------|------------|---------|-----------|
| **Albedo / Color / Base** | sRGB | RGB | Surface color without lighting | Essential |
| **Normal** | Linear | RGB (tangent-space XYZ) | Surface micro-detail without geometry | Important |
| **Roughness** | Linear | Single (typically Green) | How rough/smooth the surface is | Important |
| **Metalness** | Linear | Single (typically Blue) | Metal vs dielectric classification | Important |
| **Ambient Occlusion (AO)** | Linear | Single (typically Red) | Pre-computed shadow in crevices | Optional |
| **Displacement / Height** | Linear | Single | Actual geometry displacement | Expensive — use sparingly |
| **Emissive** | sRGB | RGB | Self-lit areas (screens, LEDs) | When needed |

### ORM Packing Convention

Many PBR pipelines pack AO, Roughness, and Metalness into a single texture:

```
R channel = Ambient Occlusion
G channel = Roughness
B channel = Metalness
```

This reduces texture count from 3 to 1. Three.js supports this via separate map assignments:

```tsx
// Load the single ORM texture
const ormTexture = useTexture('/textures/material_orm.jpg')

<meshPhysicalMaterial
  aoMap={ormTexture}               // reads R channel
  roughnessMap={ormTexture}        // reads G channel
  metalnessMap={ormTexture}        // reads B channel
/>
```

**Color space:** ORM textures must be Linear (they are data, not visual content).

---

## 2. Loading Textures in R3F

### useTexture (drei — Recommended)

```tsx
import { useTexture } from '@react-three/drei'

// Object notation — keys match MeshPhysicalMaterial props
const textures = useTexture({
  map: '/textures/color.jpg',           // auto: sRGB
  normalMap: '/textures/normal.jpg',    // auto: Linear
  roughnessMap: '/textures/roughness.jpg',  // auto: Linear
  metalnessMap: '/textures/metalness.jpg',  // auto: Linear
  aoMap: '/textures/ao.jpg',            // auto: Linear
})

<meshPhysicalMaterial {...textures} />
```

### TextureLoader (manual)

For programmatic control:

```tsx
import { useLoader } from '@react-three/fiber'
import { TextureLoader, SRGBColorSpace, LinearSRGBColorSpace } from 'three'

const [colorMap, normalMap] = useLoader(TextureLoader, [
  '/textures/color.jpg',
  '/textures/normal.jpg',
])

// Set color spaces manually
colorMap.colorSpace = SRGBColorSpace     // visual content
normalMap.colorSpace = LinearSRGBColorSpace  // data
```

### CanvasTexture (Programmatic)

For dynamically-generated textures (screen content, procedural patterns):

```tsx
import { CanvasTexture, SRGBColorSpace } from 'three'

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
// ... draw content ...

const texture = new CanvasTexture(canvas)
texture.colorSpace = SRGBColorSpace  // CRITICAL for visual content
texture.needsUpdate = true           // flag for re-upload after drawing

// DPR-aware canvas size
const dpr = Math.min(window.devicePixelRatio, 2)
canvas.width = logicalWidth * dpr
canvas.height = logicalHeight * dpr
ctx.scale(dpr, dpr)
```

### useTexture Preloading

Preload textures during parent component render to prevent pop-in:

```tsx
// At module level — starts loading immediately
useTexture.preload([
  '/textures/color.jpg',
  '/textures/normal.jpg',
  '/textures/roughness.jpg',
])
```

---

## 3. Normal Map Creation

### From Height Map

Convert grayscale height maps to normal maps:

- **Online tools:** NormalMap-Online, AwesomeBump
- **Blender:** Image → Generate Normal Map
- **Command line:** `normalmap-cli` (npm package)

### From Photos

For procedural surfaces (brushed metal, concrete, fabric):

1. Take/find a high-res photo of the surface
2. Convert to grayscale (height interpretation)
3. Generate normal map from grayscale
4. Tile with seamless wrapping

### Normal Map Settings

```tsx
<meshPhysicalMaterial
  normalMap={normalTexture}
  normalScale={new THREE.Vector2(1, 1)}  // [0.5, 0.5] for subtle, [2, 2] for strong
/>
```

**Common mistake:** Flipped Y-axis. If normals look inverted (bumps appear as dents), negate the Y component:
```tsx
normalScale={new THREE.Vector2(1, -1)}
```

---

## 4. Texture Compression

### KTX2 / Basis Universal (Recommended for Production)

GPU-native texture compression. Textures stay compressed in GPU memory — 6-8x smaller than PNG/JPEG.

**Two modes:**
- **UASTC:** Higher quality, for normal maps and hero textures
- **ETC1S:** Smaller files, for diffuse and secondary assets

**Conversion:**
```bash
# Install Khronos tools
npm install -g ktx-tools  # or install from khronos.org

# Convert to KTX2 with UASTC (quality)
toktx --t2 --encode uastc --uastc_quality 2 output.ktx2 input.png

# Convert with ETC1S (size)
toktx --t2 --encode etc1s output.ktx2 input.png
```

**Loading in R3F:**
```tsx
import { useKTX2 } from '@react-three/drei'

const textures = useKTX2([
  '/textures/color.ktx2',
  '/textures/normal.ktx2',
])
```

### Size Comparison

| Format | File Size (typical 2K texture) | GPU Memory | Decode Cost |
|--------|-------------------------------|------------|-------------|
| PNG | 2-4 MB | 16 MB (uncompressed RGBA) | CPU decode |
| JPEG | 200-500 KB | 16 MB (uncompressed RGBA) | CPU decode |
| KTX2 (UASTC) | 1-2 MB | 2-4 MB (stays compressed) | GPU-native |
| KTX2 (ETC1S) | 100-300 KB | 2-4 MB (stays compressed) | GPU-native |

### GLTF Texture Optimization

For models imported as GLTF/GLB:

```bash
# Compress textures within a GLTF
npx gltf-transform optimize model.glb output.glb \
  --texture-compress ktx2 \
  --compress draco

# Or with gltfjsx (generates JSX component + optimizes)
npx gltfjsx model.glb -S -T -t
# -S = simplify geometry
# -T = transform (optimize)
# -t = TypeScript output
```

---

## 5. Free PBR Texture Sources

### ambientCG (CC0)

- 2000+ PBR materials (metal, wood, concrete, fabric, etc.)
- Available in 1K, 2K, 4K, 8K
- Full map sets: color, normal, roughness, metalness, AO, displacement
- Download: [ambientcg.com](https://ambientcg.com)

### Poly Haven (CC0)

- 500+ textures plus 600+ HDRIs and 600+ models
- Focus on photoscanned real-world materials
- Excellent metal/titanium/steel textures
- Download: [polyhaven.com/textures](https://polyhaven.com/textures)

### Quixel Megascans (Free with Unreal, paid otherwise)

- Photoscanned PBR materials at extreme resolution
- Best for cinematic quality
- May require conversion from Unreal format

---

## 6. Texture Optimization Tips

1. **Resolution matching:** Don't use 4K textures for objects that occupy <200px on screen. 512px or 1K is sufficient.
2. **Power of 2:** Texture dimensions should be powers of 2 (256, 512, 1024, 2048) for GPU mipmapping.
3. **Mipmap generation:** Three.js generates mipmaps by default (`texture.generateMipmaps = true`). This is correct for most cases.
4. **Anisotropic filtering:** Set `texture.anisotropy = renderer.capabilities.getMaxAnisotropy()` for textures viewed at oblique angles (floor tiles, etc.).
5. **Dispose on unmount:** Textures consume GPU memory until explicitly disposed. R3F handles this for declarative textures, but manually-created textures need cleanup:

```tsx
useEffect(() => {
  return () => {
    texture.dispose()
    texture.source?.data?.close?.()  // for ImageBitmap (GLTF)
  }
}, [texture])
```

6. **Monitor memory:** Check `renderer.info.memory` during development:

```tsx
useFrame(({ gl }) => {
  console.log('Textures:', gl.info.memory.textures)
  console.log('Geometries:', gl.info.memory.geometries)
})
```
