# 3D Product Showcase Scenes — Reference

Product showcases that transform static objects into interactive experiences. The user should feel ownership — "this is mine to explore" — not spectatorship. Auto-rotation when idle invites attention. Drag-to-rotate transfers control. Environment lighting and reflections communicate quality.

---

## 1. Core Architecture (React Three Fiber + drei)

### Scene Graph

```
<Canvas>
  <Suspense fallback={<StaticFallback />}>
    <Environment />          ← HDR environment map for lighting and reflections
    <OrbitControls />        ← User interaction (drag to rotate, scroll to zoom)
    <ProductModel />         ← The 3D model (GLTF/GLB)
    <ContactShadows />       ← Soft shadow plane beneath the product
    <PostProcessing />       ← Bloom, optional DoF
    <AutoRotation />         ← Idle rotation behavior
  </Suspense>
</Canvas>
```

### Key Decisions

| Decision | Recommendation | Why |
|----------|---------------|-----|
| Model format | GLTF/GLB | Industry standard, supported by all tools, drei's `useGLTF` handles loading |
| Lighting | HDR environment map via drei `<Environment>` | Realistic reflections without manual light placement |
| Shadows | `<ContactShadows>` | Soft, blurred shadow plane — grounds the object without shadow map complexity |
| Controls | `<OrbitControls>` from drei | Standard orbit camera with inertia, zoom limits, auto-rotate |
| Post-processing | `<EffectComposer>` + `<Bloom>` | Subtle bloom on reflective surfaces adds perceived quality |
| Fallback | Static product image, same framing | Users waiting for 3D to load see the product immediately |

---

## 2. Environment Lighting

### HDR Environment Maps

drei's `<Environment>` accepts preset names or custom HDR files. For product showcases, studio-style environments produce the best results — controlled lighting, clean reflections, no distracting scenery in reflections.

```typescript
// Using a preset
<Environment preset="studio" />

// Using a custom HDR (recommended for brand control)
<Environment files="/environments/brand-studio.hdr" />

// Environment that only affects lighting, not visible in background
<Environment preset="studio" background={false} />
```

### Preset Selection Guide

| Preset | Character | Best For |
|--------|-----------|----------|
| `studio` | Clean, neutral, even | Default choice — works for everything |
| `city` | Cool, urban reflections | Tech products, hardware |
| `sunset` | Warm, golden | Lifestyle products, wood/leather |
| `dawn` | Soft, cool-warm gradient | Delicate products, glass, jewelry |
| `night` | Dark, dramatic | Premium/luxury positioning |
| `warehouse` | Industrial, directional | Tools, equipment, rugged products |
| `apartment` | Soft, domestic | Home products, furniture |

### Custom Studio Lighting (When HDR Alone Isn't Enough)

For maximum control, supplement the environment with point/spot lights:

```typescript
<Environment preset="studio" background={false} />

{/* Key light — main illumination */}
<spotLight
  position={[5, 5, 5]}
  angle={0.3}
  penumbra={0.8}
  intensity={1.5}
  castShadow
/>

{/* Fill light — soften shadows */}
<pointLight position={[-5, 2, -3]} intensity={0.4} color="#b0c4de" />

{/* Rim light — edge definition */}
<spotLight position={[0, 3, -5]} angle={0.4} penumbra={1} intensity={0.8} />
```

---

## 3. Model Loading

### GLTF Loading Pattern

```typescript
import { useGLTF } from '@react-three/drei';

function ProductModel({ url, scale = 1 }: { url: string; scale?: number }) {
  const { scene } = useGLTF(url);

  // Center the model at origin
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    scene.position.sub(center);
  }, [scene]);

  return (
    <primitive
      object={scene}
      scale={scale}
      dispose={null}
    />
  );
}

// Preload on hover/intersection for instant display
useGLTF.preload('/models/product.glb');
```

### Model Optimization

- **Target polygon count:** 50K-200K triangles for web. Higher detail for hero showcases, lower for inline components.
- **Texture compression:** Use KTX2/Basis Universal via `<KTXLoader>` or Draco compression for geometry via drei's `useDraco()`.
- **LOD (Level of Detail):** For heavy models, provide 2-3 LOD variants and switch based on camera distance or device capability.

```typescript
import { useGLTF, useDraco } from '@react-three/drei';

// Enable Draco compression (requires decoder WASM)
function ProductModel({ url }: { url: string }) {
  const { scene } = useGLTF(url, true); // true enables Draco
  return <primitive object={scene} />;
}
```

---

## 4. Orbit Controls & Auto-Rotation

### Controls Configuration

```typescript
import { OrbitControls } from '@react-three/drei';

<OrbitControls
  // Rotation
  enableRotate={true}
  autoRotate={isIdle}          // Enable when user hasn't interacted
  autoRotateSpeed={1.5}        // Degrees per second (negative for reverse)
  rotateSpeed={0.5}            // User rotation sensitivity

  // Zoom
  enableZoom={true}
  minDistance={2}               // Closest zoom
  maxDistance={8}               // Farthest zoom
  zoomSpeed={0.5}

  // Pan
  enablePan={false}            // Disable pan for product showcases

  // Damping (inertia)
  enableDamping={true}
  dampingFactor={0.05}         // Lower = more inertia

  // Vertical rotation limits (prevent looking at bottom)
  minPolarAngle={Math.PI / 6}  // 30 degrees from top
  maxPolarAngle={Math.PI / 2}  // Horizon

  // Touch behavior
  touches={{
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_ROTATE,
  }}
/>
```

### Idle Detection for Auto-Rotation

```typescript
function useIdleDetection(timeoutMs: number = 3000): boolean {
  const [isIdle, setIsIdle] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const resetIdle = useCallback(() => {
    setIsIdle(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsIdle(true), timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    const events = ['pointerdown', 'pointermove', 'wheel'];
    events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }));
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [resetIdle]);

  return isIdle;
}
```

### Smooth Transition Between Idle and Manual

When the user starts dragging, auto-rotation should stop instantly. When they release, auto-rotation should resume smoothly after a delay, not snap to a different angle. OrbitControls handles this natively when `autoRotate` is toggled — it picks up rotation from the current camera angle.

---

## 5. Shadows & Grounding

### ContactShadows (Recommended)

drei's `<ContactShadows>` renders a shadow map from below and projects it onto a plane. It's not physically accurate but looks great and is performant.

```typescript
<ContactShadows
  position={[0, -1, 0]}   // Shadow plane position
  opacity={0.4}            // Shadow darkness
  scale={10}               // Shadow map coverage
  blur={2.5}               // Shadow softness
  far={4}                  // How far up to cast from
  resolution={256}         // Shadow map resolution
  color="#000000"
/>
```

### Shadow Plane Alternative (For Dynamic Shadows)

When the product casts shadow onto a visible surface (like a table):

```typescript
<mesh
  receiveShadow
  rotation={[-Math.PI / 2, 0, 0]}
  position={[0, -1, 0]}
>
  <planeGeometry args={[10, 10]} />
  <shadowMaterial opacity={0.3} />
</mesh>
```

---

## 6. Post-Processing

### Subtle Bloom

Bloom on metallic/reflective surfaces communicates premium quality. Must be subtle — visible on bright highlights, invisible on matte surfaces.

```typescript
import { EffectComposer, Bloom } from '@react-three/postprocessing';

<EffectComposer>
  <Bloom
    luminanceThreshold={0.9}   // Only bloom on very bright pixels
    luminanceSmoothing={0.9}   // Soft threshold edge
    intensity={0.3}            // Subtle glow
    mipmapBlur                 // Smooth, film-like bloom
  />
</EffectComposer>
```

### Depth of Field (Optional — Use Sparingly)

Shallow depth of field creates a photographic quality but can feel gimmicky. Use only when the product has clear foreground/background elements.

```typescript
import { DepthOfField } from '@react-three/postprocessing';

<DepthOfField
  focusDistance={0}        // Focus at center
  focalLength={0.02}       // Depth of field range
  bokehScale={2}           // Bokeh circle size
/>
```

---

## 7. Responsive Sizing

The 3D canvas must fill its container and adapt to resize events. R3F handles this automatically when the Canvas fills a container, but camera framing needs manual adjustment.

```typescript
// Container sets the size
<div className="relative w-full aspect-[4/3]">
  <Canvas
    camera={{ position: [0, 0, 5], fov: 45 }}
    dpr={[1, 2]}  // Limit pixel ratio for performance
  >
    <ResponsiveCamera />
    {/* ... scene */}
  </Canvas>
</div>

// Adjust camera for mobile
function ResponsiveCamera() {
  const { viewport } = useThree();
  const camera = useThree(state => state.camera);

  useEffect(() => {
    // Widen FOV on narrow viewports to show full product
    if (viewport.width < 4) {
      (camera as THREE.PerspectiveCamera).fov = 55;
      camera.updateProjectionMatrix();
    }
  }, [viewport.width, camera]);

  return null;
}
```

---

## 8. Loading Strategy

3D scenes are heavy. Never block page load.

### Progressive Loading

1. **Immediate:** Render a static product image in the container (same framing as the 3D view)
2. **Lazy:** Load the Canvas component via `React.lazy` + `Suspense`
3. **Intersection:** Only begin loading when the container enters the viewport
4. **Preload on hover:** If the 3D section is below the fold, preload the model when the user hovers a nearby element or scrolls toward it

```typescript
const ProductScene = lazy(() => import('./ProductScene'));

function ProductHero({ imageUrl, modelUrl }: Props) {
  const [inView, ref] = useInView({ triggerOnce: true, rootMargin: '200px' });

  return (
    <div ref={ref} className="relative w-full aspect-[4/3]">
      {/* Static fallback — always visible initially */}
      <img
        src={imageUrl}
        alt="Product"
        className={cn(
          "absolute inset-0 w-full h-full object-contain transition-opacity duration-500",
          inView ? "opacity-0" : "opacity-100"
        )}
      />

      {/* 3D scene — loads when in view */}
      {inView && (
        <Suspense fallback={null}>
          <ProductScene modelUrl={modelUrl} />
        </Suspense>
      )}
    </div>
  );
}
```

---

## 9. Keyboard Accessibility

3D orbit controls must be operable via keyboard for accessibility:

```typescript
function KeyboardControls({ controlsRef }: { controlsRef: RefObject<typeof OrbitControls> }) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!controlsRef.current) return;
      const camera = controlsRef.current.object;
      const speed = 0.05;

      switch (e.key) {
        case 'ArrowLeft':
          controlsRef.current.azimuthAngle -= speed;
          break;
        case 'ArrowRight':
          controlsRef.current.azimuthAngle += speed;
          break;
        case 'ArrowUp':
          controlsRef.current.polarAngle = Math.max(
            controlsRef.current.minPolarAngle,
            controlsRef.current.polarAngle - speed
          );
          break;
        case 'ArrowDown':
          controlsRef.current.polarAngle = Math.min(
            controlsRef.current.maxPolarAngle,
            controlsRef.current.polarAngle + speed
          );
          break;
        case '+':
        case '=':
          controlsRef.current.dollyIn(1.1);
          break;
        case '-':
          controlsRef.current.dollyOut(1.1);
          break;
      }
      controlsRef.current.update();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [controlsRef]);

  return null;
}
```

---

## 10. iOS / SceneKit Alternative

For native iOS product showcases, SceneKit provides equivalent functionality with native performance.

### Architecture

```swift
struct ProductShowcaseView: UIViewRepresentable {
    let modelURL: URL

    func makeUIView(context: Context) -> SCNView {
        let scnView = SCNView()
        scnView.scene = try? SCNScene(url: modelURL)
        scnView.autoenablesDefaultLighting = true
        scnView.allowsCameraControl = true           // Built-in orbit controls
        scnView.backgroundColor = .clear
        scnView.antialiasingMode = .multisampling4X

        // Auto-rotation
        let cameraNode = scnView.scene?.rootNode.childNode(withName: "camera", recursively: true)
        let rotation = CABasicAnimation(keyPath: "eulerAngles.y")
        rotation.fromValue = 0
        rotation.toValue = Float.pi * 2
        rotation.duration = 20
        rotation.repeatCount = .infinity
        cameraNode?.addAnimation(rotation, forKey: "autoRotate")

        return scnView
    }
}
```

### Key Differences from Web

| Aspect | Web (R3F) | iOS (SceneKit) |
|--------|-----------|----------------|
| Model format | GLTF/GLB | USDZ, SCN, DAE |
| Environment lighting | HDR via drei Environment | `autoenablesDefaultLighting` or manual `SCNLight` |
| Orbit controls | drei OrbitControls | `allowsCameraControl = true` (built-in) |
| Post-processing | @react-three/postprocessing | SCNTechnique (custom Metal shaders) |
| Shadows | ContactShadows or shadow maps | `castsShadow` on lights, `shadowMode` on planes |
| Performance | GPU-dependent, varies by device | Native Metal backend, consistent performance |

---

## 11. Reduced Motion

Replace the interactive 3D viewer with a high-quality static render or a slow crossfade between 2-3 angle shots.

```typescript
const prefersReducedMotion = useReducedMotion();

if (prefersReducedMotion) {
  return (
    <div className="relative w-full aspect-[4/3]">
      <img
        src={staticRenderUrl}
        alt={productName}
        className="w-full h-full object-contain"
      />
      <p className="sr-only">
        Interactive 3D view available. Enable motion in system preferences to explore.
      </p>
    </div>
  );
}
```
