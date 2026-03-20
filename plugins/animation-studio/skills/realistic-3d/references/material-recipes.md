# PBR Material Recipes

Copy-paste-ready `MeshPhysicalMaterial` configurations for real-world surfaces. Every value is physically motivated — roughness, IOR, and metalness are calibrated to measured material properties, not artistic guesses.

---

## Metals

### Brushed Titanium (iPhone 16 Pro Frame)

```tsx
<meshPhysicalMaterial
  color="#8a8a8e"
  metalness={1}
  roughness={0.35}
  anisotropy={0.7}
  anisotropyRotation={Math.PI / 2}  // horizontal brushing direction
  clearcoat={0.1}                    // very faint protective layer
  clearcoatRoughness={0.4}
  envMapIntensity={1.2}
/>
```

**Why these values:** Titanium is fully metallic. Roughness 0.35 gives the satin finish of Apple's titanium. Anisotropy 0.7 stretches reflections along the brush direction (perpendicular to the frame length). The faint clearcoat simulates the PVD coating Apple applies.

### Brushed Titanium — Natural / Desert / White Variants

Adjust `color` for different titanium finishes while keeping all other properties identical:

| Variant | Color | Notes |
|---------|-------|-------|
| Black Titanium | `#8a8a8e` → darken to `#3a3a3d` | Darker PVD coating |
| Natural Titanium | `#b0a899` | Warm silver-beige |
| Desert Titanium | `#a09080` | Warm sand tone |
| White Titanium | `#c8c5c0` | Cool silver-white |

### Polished Chrome / Mirror Metal

```tsx
<meshPhysicalMaterial
  color="#cccccc"
  metalness={1}
  roughness={0.05}
  envMapIntensity={2}
/>
```

**Why:** Near-zero roughness creates mirror reflections. High envMapIntensity amplifies environment reflections for that chrome pop.

### Matte Aluminum (Space Gray)

```tsx
<meshPhysicalMaterial
  color="#7d7e80"
  metalness={0.9}
  roughness={0.45}
  envMapIntensity={0.8}
/>
```

**Why:** Anodized aluminum is not perfectly metallic — the oxide layer reduces metalness slightly. Roughness 0.45 gives the soft matte finish. Lower envMapIntensity prevents over-reflection.

### Gold (18K)

```tsx
<meshPhysicalMaterial
  color="#d4a843"
  metalness={1}
  roughness={0.2}
  envMapIntensity={1.5}
/>
```

### Rose Gold

```tsx
<meshPhysicalMaterial
  color="#b76e53"
  metalness={1}
  roughness={0.25}
  envMapIntensity={1.3}
/>
```

### Copper (Polished)

```tsx
<meshPhysicalMaterial
  color="#c87533"
  metalness={1}
  roughness={0.15}
  envMapIntensity={1.4}
/>
```

### Copper (Aged/Patina)

```tsx
<meshPhysicalMaterial
  color="#6b8e6b"
  metalness={0.6}
  roughness={0.7}
  envMapIntensity={0.5}
/>
```

**Why:** Patina (copper carbonate) is partially dielectric, reducing metalness. High roughness for the chalky oxide surface.

### Stainless Steel (Brushed)

```tsx
<meshPhysicalMaterial
  color="#c0c0c0"
  metalness={1}
  roughness={0.3}
  anisotropy={0.5}
  anisotropyRotation={0}  // vertical brushing
  envMapIntensity={1.0}
/>
```

---

## Glass & Transparent

### iPhone Glass Screen (Gorilla Glass / Ceramic Shield)

```tsx
<meshPhysicalMaterial
  color="#111111"
  metalness={0}
  roughness={0.05}
  transmission={0}          // opaque — screen content shows through texture, not transmission
  clearcoat={1}
  clearcoatRoughness={0}
  reflectivity={0.5}
  ior={1.52}                // Gorilla Glass measured IOR
  envMapIntensity={1.5}
/>
```

**Why:** The screen is opaque (content is a CanvasTexture mapped to the surface). Clearcoat 1.0 with zero roughness creates the glassy surface reflections. IOR 1.52 matches borosilicate/Gorilla Glass.

### Clear Glass (Window, Screen Protector)

```tsx
<meshPhysicalMaterial
  color="#ffffff"
  metalness={0}
  roughness={0}
  transmission={1}
  thickness={0.5}
  ior={1.5}
  clearcoat={1}
  clearcoatRoughness={0}
  envMapIntensity={1}
  transparent={true}
/>
```

### Frosted Glass

```tsx
<meshPhysicalMaterial
  color="#ffffff"
  metalness={0}
  roughness={0.7}           // blur from frosting
  transmission={1}
  thickness={1}
  ior={1.5}
/>
```

### Tinted Glass (Amber/Bottle)

```tsx
<meshPhysicalMaterial
  color="#ffffff"
  metalness={0}
  roughness={0}
  transmission={1}
  thickness={2}
  ior={1.52}
  attenuationColor="#cc6600"   // amber tint absorbed into volume
  attenuationDistance={0.5}     // stronger tint (shorter distance = deeper color)
/>
```

### Crystal (Prismatic / Dispersive)

```tsx
<meshPhysicalMaterial
  color="#ffffff"
  metalness={0}
  roughness={0}
  transmission={1}
  thickness={3}
  ior={2.0}
  dispersion={0.3}             // rainbow splitting through volume
  envMapIntensity={2}
/>
```

---

## Camera & Optical

### Camera Lens Glass (with Anti-Reflective Coating)

```tsx
<meshPhysicalMaterial
  color="#1a1a2e"
  metalness={0}
  roughness={0}
  transmission={0.3}           // partially see-through (sensor behind)
  thickness={2}
  ior={1.8}                    // high-refraction optical glass
  clearcoat={1}
  clearcoatRoughness={0}
  iridescence={0.3}            // anti-reflective coating shimmer
  iridescenceIOR={2.2}
  iridescenceThicknessRange={[100, 400]}  // nanometers — thin-film interference
  envMapIntensity={2}
/>
```

**Why:** Camera lenses use high-IOR optical glass (1.7-1.9). The iridescence simulates the purple/green/blue shimmer of multi-layer anti-reflective coatings. Low transmission (0.3) lets you glimpse the dark sensor behind.

### Camera Lens Ring (Polished Metal Barrel)

```tsx
<meshPhysicalMaterial
  color="#888888"
  metalness={1}
  roughness={0.1}
  envMapIntensity={1.8}        // catch environment for specular ring highlights
/>
```

### Flash Diffuser

```tsx
<meshPhysicalMaterial
  color="#f5f0e0"
  metalness={0}
  roughness={0.6}
  transmission={0.4}
  thickness={0.5}
  ior={1.49}                   // PMMA/acrylic
/>
```

### LiDAR Scanner Dot

```tsx
<meshPhysicalMaterial
  color="#0a0a12"
  metalness={0}
  roughness={0.3}
  clearcoat={0.5}
  clearcoatRoughness={0.2}
  envMapIntensity={0.5}
/>
```

---

## Plastics & Polymers

### Glossy Plastic (ABS / Polycarbonate)

```tsx
<meshPhysicalMaterial
  color="#222222"
  metalness={0}
  roughness={0.15}
  clearcoat={0.8}
  clearcoatRoughness={0.1}
  ior={1.58}                   // polycarbonate measured IOR
  envMapIntensity={1}
/>
```

### Matte Plastic

```tsx
<meshPhysicalMaterial
  color="#333333"
  metalness={0}
  roughness={0.6}
  ior={1.46}                   // general plastic
  envMapIntensity={0.4}
/>
```

### Matte Rubber / Silicone (Case Material)

```tsx
<meshPhysicalMaterial
  color="#333333"
  metalness={0}
  roughness={0.9}
  ior={1.52}
  envMapIntensity={0.3}
/>
```

### Glossy Ceramic

```tsx
<meshPhysicalMaterial
  color="#f0ece4"
  metalness={0}
  roughness={0.1}
  clearcoat={1}
  clearcoatRoughness={0.05}
  ior={1.65}                   // ceramic
  envMapIntensity={1.2}
/>
```

---

## Fabric & Organic

### Fabric / Cloth

```tsx
<meshPhysicalMaterial
  color="#444444"
  metalness={0}
  roughness={0.8}
  sheen={1}
  sheenColor="#666666"
  sheenRoughness={0.5}
/>
```

**Why:** Sheen creates the characteristic edge glow of fabric (Fresnel scattering from fiber microstructure). No clearcoat — fabric has no gloss layer.

### Leather (Smooth)

```tsx
<meshPhysicalMaterial
  color="#3a2a1a"
  metalness={0}
  roughness={0.5}
  clearcoat={0.3}              // light surface finish
  clearcoatRoughness={0.3}
  ior={1.52}
  envMapIntensity={0.6}
/>
```

### Leather (Matte/Suede)

```tsx
<meshPhysicalMaterial
  color="#5a4a3a"
  metalness={0}
  roughness={0.85}
  sheen={0.5}
  sheenColor="#7a6a5a"
  sheenRoughness={0.7}
/>
```

---

## Composites

### Carbon Fiber

```tsx
<meshPhysicalMaterial
  color="#1a1a1a"
  metalness={0.2}              // semi-metallic sheen
  roughness={0.3}
  clearcoat={1}                // clear resin topcoat
  clearcoatRoughness={0.05}
  anisotropy={0.4}             // weave direction reflection
  anisotropyRotation={Math.PI / 4}  // 45° diagonal weave
  envMapIntensity={1}
/>
```

**Why:** Carbon fiber is a composite — the fibers are conductive (slight metalness), the epoxy resin is dielectric. The clearcoat represents the resin top layer. Anisotropy at 45° simulates the twill weave pattern.

### Wood (Polished / Lacquered)

```tsx
<meshPhysicalMaterial
  color="#6b4423"
  metalness={0}
  roughness={0.4}
  clearcoat={0.8}              // lacquer finish
  clearcoatRoughness={0.1}
  ior={1.52}
  envMapIntensity={0.7}
/>
```

### Concrete

```tsx
<meshPhysicalMaterial
  color="#888880"
  metalness={0}
  roughness={0.95}
  ior={1.5}
  envMapIntensity={0.2}
/>
```

---

## Special Effects

### Holographic / Oil Slick

```tsx
<meshPhysicalMaterial
  color="#222222"
  metalness={0.8}
  roughness={0.15}
  iridescence={1}
  iridescenceIOR={1.8}
  iridescenceThicknessRange={[200, 600]}
  envMapIntensity={1.5}
/>
```

### Soap Bubble

```tsx
<meshPhysicalMaterial
  color="#ffffff"
  metalness={0}
  roughness={0}
  transmission={0.95}
  thickness={0.01}
  ior={1.33}                   // water
  iridescence={1}
  iridescenceIOR={1.33}
  iridescenceThicknessRange={[100, 500]}
  transparent={true}
  opacity={0.3}
/>
```

### Emissive Screen (Self-Lit Display)

```tsx
<meshPhysicalMaterial
  color="#000000"
  metalness={0}
  roughness={0.05}
  clearcoat={1}
  clearcoatRoughness={0}
  emissive="#ffffff"
  emissiveMap={screenTexture}     // CanvasTexture or rendered content
  emissiveIntensity={0.8}         // 0.5-1.0 depending on scene brightness
  envMapIntensity={1.5}
  toneMapped={false}              // set true if emissive blows out with bloom
/>
```

**Why:** Self-lit screens emit light (emissive) while also reflecting the environment (clearcoat + envMap). The `emissiveMap` carries the screen content. Setting `toneMapped={false}` allows the emissive to exceed the tone mapping range for natural screen brightness — but set back to `true` if bloom post-processing overblows it.

---

## Material Debugging Checklist

When a material doesn't look right:

1. **Too dark?** Check `envMapIntensity` — metals need environment reflections to have any color
2. **Too shiny/plastic?** Roughness is probably too low for the surface type
3. **Flat/dead looking?** Missing environment map — add `<Environment>` to the scene
4. **Black reflections?** No environment or lights in the scene to reflect
5. **Metals look painted?** `metalness` is not 1.0, or using `MeshStandardMaterial` instead of `MeshPhysicalMaterial`
6. **Glass invisible?** `transmission` set but no `thickness` — needs volume depth for refraction
7. **Colors look wrong?** Check color space — albedo textures must be sRGB, data textures must be Linear
8. **Anisotropy not visible?** Need a bright environment or Lightformer to catch the stretched reflections
9. **Iridescence too subtle?** Increase `iridescenceThicknessRange` spread or raise `iridescence` intensity
10. **Clearcoat invisible?** Needs environment reflections — clearcoat only shows in reflected light
