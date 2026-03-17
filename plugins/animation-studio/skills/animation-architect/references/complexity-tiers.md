# Complexity Tiers — Detailed Reference

Each tier represents a distinct level of capability. Higher tiers are not "better" — they are more powerful. The correct tier is the one that produces the best result for the specific animation. Using a higher tier than necessary is over-engineering. Using a lower tier than necessary is under-engineering.

---

## Web Tiers

### Tier 1: CSS

**What it excels at:** State transitions, hover/focus effects, entrance animations, scroll-driven animations, view transitions, animated gradients, staggered reveals, any animation that maps cleanly to a property change between two or more states.

**Bundle size:** 0KB. CSS is parsed by the browser engine — no JavaScript download, no parse cost.

**Key APIs (2025-2026 browser support):**

| API | What It Does | Browser Support |
|-----|-------------|-----------------|
| `@starting-style` | Defines initial styles for elements entering the DOM — enables CSS-only enter animations for `display: none` → `display: block` | Chrome 117+, Safari 17.5+, Firefox 129+ |
| `transition-behavior: allow-discrete` | Allows transitioning discrete properties like `display` and `visibility` | Chrome 117+, Safari 17.5+, Firefox 129+ |
| `@property` | Registers custom properties with type, enabling smooth interpolation of gradients, colors, lengths | Chrome 85+, Safari 16.4+, Firefox 128+ |
| `linear()` easing | Define arbitrary easing curves as a series of linear stops — replaces need for cubic-bezier for complex curves, enables spring-like easing | Chrome 113+, Safari 17.2+, Firefox 112+ |
| `scroll-timeline` / `animation-timeline: scroll()` | Bind animation progress to scroll position — declarative scroll-driven animations with zero JS | Chrome 115+, Safari TP, Firefox 110+ (behind flag) |
| `view-timeline` / `animation-timeline: view()` | Bind animation to an element's position within the scroll viewport — entrance/exit animations on scroll | Chrome 115+, Safari TP, Firefox 110+ (behind flag) |
| `view-transition-name` / `::view-transition-*` | Browser-native shared element transitions between DOM states or pages | Chrome 111+, Safari 18+, Firefox (in development) |
| `interpolate-size: allow-keywords` | Enables smooth transitions to/from `auto`, `min-content`, `max-content` for height/width | Chrome 129+, Safari (in development) |
| `calc-size()` | Explicit size calculation including keyword sizes — `calc-size(auto, size + 20px)` | Chrome 129+ |
| `anchor()` positioning | Position elements relative to anchors — enables tooltip/popover animations relative to triggers | Chrome 125+, Safari (in development) |

**When it produces the best result:** When the animation is a direct response to a state change (hover on/off, class toggle, route change, scroll position) and does not require JavaScript-driven sequencing, spring physics, or layout animation. If CSS can do it, CSS should do it — zero runtime cost is unbeatable.

**Limitations:** No imperative timeline control. No spring physics (though `linear()` can approximate). No layout animations (animating between two layouts). No exit animations without `@starting-style` + `transition-behavior`. Limited gesture integration.

---

### Tier 2: Framer Motion 12+

**What it excels at:** React component animations, layout animations (elements smoothly moving when siblings change), shared layout transitions (morphing between components), spring physics, gesture-driven animations (drag, hover, tap, pan), AnimatePresence (mount/unmount animations), scroll-linked motion values.

**Bundle size:** ~15KB gzipped (core). Tree-shakeable — only pay for features used.

**Key APIs:**

| API | What It Does |
|-----|-------------|
| `motion.div` / `motion()` | Animated component wrapper — accepts `animate`, `initial`, `exit`, `whileHover`, `whileTap` props |
| `AnimatePresence` | Tracks component mount/unmount, enables exit animations before DOM removal |
| `layoutId` | Shared layout animation — elements with the same `layoutId` morph between positions when one mounts and the other unmounts |
| `layout` prop | Enables automatic layout animation when an element's position/size changes due to sibling changes |
| `useMotionValue` | Imperative motion value — no re-renders. Drives transforms, opacity, etc. via `style` prop |
| `useTransform` | Maps one motion value to another — e.g., scroll position to opacity |
| `useScroll` | Tracks scroll progress of viewport or container — returns `scrollY`, `scrollYProgress` as motion values |
| `useSpring` | Spring-smoothed motion value — useful for following cursor, smooth scroll indicators |
| `useDragControls` | Imperative drag initiation — enables drag-from-handle patterns |
| `Reorder` | Built-in drag-to-reorder list primitives with layout animations |
| `useAnimate` | Imperative animation API — `animate(element, keyframes, options)` for timeline-like sequencing |
| `useInView` | Intersection Observer wrapper — triggers animation when element enters viewport |
| `spring` transition | Physics-based spring: `stiffness`, `damping`, `mass` parameters |

**When it produces the best result:** React applications where animations are tightly coupled to component state. Layout animations (no other web tool does this). Shared element transitions within a React app. Gesture-driven interactions (drag, swipe). Any animation where React's component lifecycle must drive the animation lifecycle.

**Limitations:** React-only. No text splitting. No SVG morphing. ScrollTrigger-style pinning requires workarounds. Timeline composition is less expressive than GSAP.

---

### Tier 3: GSAP 3.12+

**What it excels at:** Complex timelines, scroll-driven narratives, text animation (SplitText), SVG morphing (MorphSVG), path following (MotionPath), FLIP animations, pin-and-scrub scroll effects, stagger orchestration, and any animation requiring precise timeline control across many elements.

**Bundle size:** Core ~23KB gzipped. Each plugin adds 3-8KB. Typical: core + ScrollTrigger + SplitText = ~35KB.

**Key APIs:**

| API / Plugin | What It Does |
|-------------|-------------|
| `gsap.to()` / `gsap.from()` / `gsap.fromTo()` | Core tweens — animate any numeric property with any easing |
| `gsap.timeline()` | Sequence tweens with relative positioning (`"-=0.2"`, `"+=0.5"`, `"<"`) — frame-perfect orchestration |
| `ScrollTrigger` | Bind timeline progress to scroll. `scrub` for direct scroll binding. `pin` to freeze elements during scroll. `snap` for scroll-snap-like behavior. `onEnter`/`onLeave` callbacks. |
| `SplitText` | Split text into chars/words/lines, each wrapped in a span — enables per-character animation with stagger |
| `MorphSVG` | Morph between SVG paths with automatic point matching — handles different point counts |
| `DrawSVG` | Animate `stroke-dashoffset` / `stroke-dasharray` — line drawing effect on any SVG path |
| `MotionPath` | Animate elements along SVG paths — with `align`, `autoRotate`, `start`/`end` control |
| `Flip` | Record state → change DOM → animate from old state to new. Declarative FLIP (First, Last, Invert, Play) |
| `Observer` | Detect scroll, touch, pointer events normalized across devices — useful for custom scroll hijacking |
| `gsap.matchMedia()` | Responsive animation contexts — different animations for different breakpoints, cleaned up on resize |
| `stagger` | Stagger objects: `{ each: 0.05, from: "center", grid: "auto" }` — distributes delay across elements with spatial awareness |

**When it produces the best result:** Multi-step scroll-driven narratives. Per-character text reveals. SVG path morphing. Any animation requiring a timeline with precise relative positioning of multiple tweens. Pin-and-scrub effects. FLIP-based layout changes outside React. Framework-agnostic projects (vanilla JS, Vue, Svelte, Astro).

**Limitations:** Imperative — requires manual cleanup in React (`useEffect` return, `gsap.context`). No built-in React component wrappers (though `@gsap/react` provides `useGSAP` hook). No layout animations (use Flip plugin for FLIP). Larger bundle than Framer Motion for equivalent React features.

---

### Tier 4: Three.js r170+ / React Three Fiber

**What it excels at:** Real-time 3D rendering — models, environments, lighting, materials, shaders, physics, post-processing. Any animation that exists in true 3D space.

**Bundle size:** Three.js core ~150KB gzipped. R3F adds ~20KB. Drei (helpers) adds 10-30KB depending on tree shaking. Post-processing adds 20-40KB.

**Key APIs:**

| API / Package | What It Does |
|-------------|-------------|
| `@react-three/fiber` | React renderer for Three.js — declarative scene graph, `useFrame` hook for per-frame updates, automatic disposal |
| `@react-three/drei` | Utilities: `OrbitControls`, `Environment`, `Float`, `Text3D`, `MeshTransmissionMaterial`, `useGLTF`, `ContactShadows` |
| `@react-three/postprocessing` | Bloom, depth of field, chromatic aberration, vignette, noise — composable post-processing stack |
| `@react-three/rapier` | Physics engine (Rapier) integration — rigid bodies, colliders, joints, raycasting |
| `THREE.ShaderMaterial` | Custom GLSL vertex/fragment shaders — unlimited visual effects |
| `THREE.InstancedMesh` | GPU instancing — render thousands of identical meshes in a single draw call |
| `THREE.Points` / `THREE.BufferGeometry` | Point-based rendering for particle systems with custom attributes |
| `useFrame((state, delta) => {})` | Per-frame callback with clock, delta time, camera, scene — the animation loop |

**When it produces the best result:** Product visualizers. 3D data visualization. Immersive hero scenes. Any effect requiring real perspective, lighting, depth, or 3D model rendering. Particle systems that need to exist in 3D space with depth sorting.

**Limitations:** Heavy bundle. Requires WebGL/WebGPU. Mobile GPU varies wildly. Not suitable for simple 2D animations — massive overkill. Accessibility is difficult (3D content is inherently non-accessible; provide 2D fallbacks).

---

### Tier 5: Canvas 2D / WebGL / WebGPU (Custom)

**What it excels at:** Anything that requires direct pixel control — custom particle systems with bespoke physics, generative art, fluid simulation, procedural effects, extremely high element counts (10,000+), effects that no framework supports.

**Bundle size:** 0KB (custom code). The cost is in the custom JavaScript — typically 2-10KB for a complete particle system or generative effect.

**Key APIs:**

| API | What It Does |
|-----|-------------|
| `CanvasRenderingContext2D` | 2D drawing — paths, fills, strokes, images, compositing. Immediate-mode rendering. |
| `OffscreenCanvas` | Canvas in a Web Worker — offload particle physics/drawing from main thread |
| `WebGLRenderingContext` / `WebGL2RenderingContext` | Direct GPU access — custom shaders (GLSL), textures, framebuffers, instanced drawing |
| `GPUDevice` (WebGPU) | Next-gen GPU API — compute shaders (WGSL), more efficient draw calls, explicit resource management |
| `requestAnimationFrame` | The animation loop — time-based updates for smooth frame-rate-independent animation |
| `devicePixelRatio` | DPI-aware canvas setup — scale canvas buffer to match display resolution |
| `PerformanceObserver('long-animation-frame')` | Monitor animation frame budget — detect jank at the source |

**When it produces the best result:** When no framework provides the required effect. High-count particle systems (1,000+ on Canvas 2D, 100,000+ on WebGL/WebGPU). Custom physics simulations. Generative/procedural art. Real-time audio visualization with custom rendering. Shader-driven effects (noise, fluid, raymarching) without Three.js overhead.

**Limitations:** No declarative API — everything is imperative. No built-in accessibility. Requires manual DPI handling. Debugging is difficult (no DOM to inspect). Memory management is manual.

---

## iOS Tiers

### Tier 1: SwiftUI Native

**What it excels at:** State-driven animations, view transitions, gesture response, layout morphing, keyframe sequences, phase-based multi-step animations, mesh gradients, and any animation that maps to SwiftUI view state changes. The declarative model means you describe what the end state looks like, and SwiftUI figures out how to animate there.

**iOS version requirements:** Core animations work on iOS 15+. The best APIs require iOS 17+. The latest (MeshGradient, `onScrollGeometryChange`) require iOS 18+.

**Key APIs:**

| API | iOS Min | What It Does |
|-----|---------|-------------|
| `withAnimation(.spring())` | 15.0 | Wraps state changes — SwiftUI animates all affected views with the specified curve |
| `.animation(.easeOut, value:)` | 15.0 | Binds animation to a specific value — animates when that value changes |
| `matchedGeometryEffect(id:in:)` | 15.0 | Shared element transition — source and destination views morph frame, position, and appearance |
| `AnimatableModifier` | 15.0 | Custom animatable property — conform to `Animatable` to animate any custom value |
| `TimelineView(.animation)` | 15.0 | Continuous update schedule — body re-evaluates every frame. Combine with `Canvas` for custom drawing. |
| `Canvas { context, size in }` | 15.0 | Immediate-mode 2D drawing — like `drawRect` but in SwiftUI. Use with `TimelineView` for animation. |
| `PhaseAnimator(phases)` | 17.0 | Cycles through an array of phases automatically — each phase defines a different visual state |
| `KeyframeAnimator(initialValue:)` | 17.0 | Per-property keyframe tracks — `KeyframeTrack` for each animatable property with individual timing |
| `contentTransition(.numericText())` | 17.0 | Animated content replacement — numbers count up, text morphs character by character |
| `.sensoryFeedback(.impact, trigger:)` | 17.0 | Declarative haptic — fires haptic when trigger value changes. Pairs haptic with animation in one modifier. |
| `MeshGradient` | 18.0 | Animated multi-point gradient mesh — control points define a smooth gradient field, animatable |
| `.onScrollGeometryChange` | 18.0 | Scroll position/content size callbacks — drive animations from scroll offset without GeometryReader hacks |
| `NavigationTransition` | 18.0 | Custom push/pop transition — define how views enter/exit during navigation |
| `.visualEffect { content, proxy in }` | 17.0 | Apply Metal shaders, geometry transforms, or offset effects to any view based on geometry proxy |

**When it produces the best result:** Any animation where the visual change maps directly to a state change. Hero transitions between views. Spring-based gesture responses. Phase-based onboarding sequences. Staggered list entrances. Basically, if the animation is "when X changes, animate to Y," SwiftUI native is the answer.

**Limitations:** No direct particle systems (use `Canvas` + `TimelineView` for basic, CAEmitterLayer for complex). No custom shaders without Metal (iOS 17+ `ShaderLibrary` integration helps). Animation timing control is less precise than Core Animation — you describe the destination, not the frame-by-frame path. Complex choreography across many elements can be awkward.

---

### Tier 2: Core Animation

**What it excels at:** Precise layer-based animation, particle systems (CAEmitterLayer), path-based shape animation (CAShapeLayer), keyframe sequences, animation groups, 3D transforms, and any animation requiring frame-level timing control or hardware-accelerated layer compositing.

**iOS version requirements:** All APIs available since iOS 2.0+. Stable, battle-tested, decades-old.

**Key APIs:**

| API | What It Does |
|-----|-------------|
| `CABasicAnimation` | Animate a single property from one value to another — `keyPath` targets any layer property |
| `CAKeyframeAnimation` | Multi-point animation — `values` array with `keyTimes` and per-segment `timingFunctions` |
| `CASpringAnimation` | Physics spring — `stiffness`, `damping`, `mass`, `initialVelocity`. Auto-calculates `duration` from spring parameters. |
| `CAAnimationGroup` | Run multiple animations simultaneously on one layer with synchronized timing |
| `CATransaction` | Batch animation changes with custom duration, timing function, completion handler |
| `CAEmitterLayer` + `CAEmitterCell` | Hardware-accelerated particle system — birth rate, lifetime, velocity, spin, acceleration, scale, color ranges. Nested cells for complex effects. |
| `CAShapeLayer` | Vector path rendering — animatable `path`, `strokeEnd`, `strokeStart`, `lineDashPhase` |
| `CAGradientLayer` | Animatable gradients — `colors`, `locations`, `startPoint`, `endPoint` all animatable |
| `CAReplicatorLayer` | Replicate sublayers with incremental transforms — perfect for loading indicators, audio bars |
| `CATransform3D` | Full 3D matrix transforms — perspective, rotation around any axis, scale in 3D space |
| `CADisplayLink` | Synchronized frame callback — fires at display refresh rate (120Hz on ProMotion). Use `preferredFrameRateRange` for ProMotion targeting. |

**When it produces the best result:** Particle systems (CAEmitterLayer is the gold standard under 500-1000 particles). Path animations (drawing, morphing). Any animation requiring precise timing control that SwiftUI's declarative model makes awkward. 3D perspective transforms. Replicator-based effects (reflection, ripple grids). Performance-critical animations where you need to guarantee compositor-level rendering.

**Limitations:** Imperative. Requires bridging to SwiftUI via `UIViewRepresentable`. Model/presentation layer distinction can cause bugs (layer state doesn't update until animation completes unless you explicitly set the model). Not declarative — you must manage start, stop, remove, and cleanup yourself.

---

### Tier 3: Metal

**What it excels at:** GPU-compute particle systems (10,000+ particles), custom shader effects (distortion, noise, fluid), real-time image processing, anything requiring per-pixel GPU control. Maximum power, maximum control.

**iOS version requirements:** Metal is available on all iOS devices since iPhone 5s (2013). `ShaderLibrary` integration with SwiftUI requires iOS 17+.

**Key APIs:**

| API | What It Does |
|-----|-------------|
| `MTLDevice` | GPU interface — create buffers, textures, pipeline states |
| `MTLCommandQueue` / `MTLCommandBuffer` | Queue GPU work — encode compute and render passes into command buffers |
| `MTLComputePipelineState` | GPU compute — run compute shaders (particle physics, fluid sim, image processing) |
| `MTLRenderPipelineState` | GPU rendering — custom vertex/fragment shaders for drawing |
| `MTLBuffer` | GPU memory — shared or private. Store particle positions, velocities, colors. |
| `MTLTexture` | GPU texture — render targets, sprite sheets, noise textures |
| `MTKView` | Metal-backed UIView — CADisplayLink-driven render loop. Bridge to SwiftUI via `UIViewRepresentable`. |
| `ShaderLibrary` (iOS 17+) | Compile `.metal` shaders accessible from SwiftUI — `ShaderLibrary.myShader(.float(value))` |
| `.colorEffect(ShaderLibrary.myShader())` | Apply fragment shader to SwiftUI view as color transformation |
| `.layerEffect(ShaderLibrary.myShader())` | Apply shader that can sample the view's layer at arbitrary coordinates (distortion, ripple) |
| `.distortionEffect(ShaderLibrary.myShader())` | Apply shader that offsets pixel positions (wave, lens, displacement) |

**When it produces the best result:** 10,000+ particle systems with custom physics. Fluid simulation. Custom visual effects that no built-in API provides (ink spread, fire, volumetric fog). Real-time shader effects on SwiftUI views via `ShaderLibrary` (ripple, glitch, thermal, chromatic aberration). Any animation that is fundamentally a per-pixel or per-vertex computation.

**Limitations:** Complex to implement — requires Metal Shading Language (MSL), pipeline state management, buffer synchronization. Debugging requires Xcode GPU debugger. Overkill for anything achievable with SwiftUI or Core Animation. `ShaderLibrary` simplifies the SwiftUI bridge but custom `MTKView` setups are still significant work.

---

### Tier 4: UIKit Dynamics

**What it excels at:** Real-time physics simulation — gravity, collision, attachment, snap, push. Objects respond to forces and interact with boundaries and each other in physically plausible ways. This is the iOS physics engine.

**iOS version requirements:** Available since iOS 7.0. Stable, well-documented.

**Key APIs:**

| API | What It Does |
|-----|-------------|
| `UIDynamicAnimator` | Physics engine container — add behaviors, manages simulation loop |
| `UIGravityBehavior` | Apply gravity vector to items — configurable direction and magnitude |
| `UICollisionBehavior` | Collision detection and response — items bounce off boundaries and each other |
| `UISnapBehavior` | Spring-snap item to a point — configurable damping |
| `UIPushBehavior` | Instantaneous or continuous force — flick, throw, wind |
| `UIAttachmentBehavior` | Spring or rigid attachment between items or to anchor points — rubber band, pendulum |
| `UIDynamicItemBehavior` | Per-item physics properties — elasticity, friction, resistance, density, angular resistance |

**When it produces the best result:** Interactive physics simulations where objects must respond to forces, collide with each other and boundaries, and settle naturally. Throw-to-dismiss gestures with realistic deceleration. Gravity-based reveals. Spring-loaded menus that settle with physics. Any UI where the user expects physical-world behavior.

**Limitations:** UIKit-only — requires `UIViewRepresentable` to bridge to SwiftUI. Limited to 2D. No GPU acceleration (runs on CPU). Performance degrades with many items (cap at ~50 interacting bodies). Not suitable for particle effects or visual effects — this is a physics simulation engine, not a rendering engine.

---

## Tier Selection Cheat Sheet

### Web: "Which tier do I need?"

```
Can CSS handle this?
├── Yes → Tier 1 (CSS)
│   Signals: state transition, hover/focus, scroll-triggered entrance,
│            no JS-driven sequencing, no spring physics, no exit animations
│            (unless @starting-style works)
│
├── No → Is this a React app with state-driven animation?
│   ├── Yes → Does it need layout animation or shared elements?
│   │   ├── Yes → Tier 2 (Framer Motion)
│   │   └── No → Does it need timeline composition or text splitting?
│   │       ├── Yes → Tier 3 (GSAP)
│   │       └── No → Tier 2 (Framer Motion)
│   │
│   └── No → Does it need timeline, scroll-pin, or text splitting?
│       ├── Yes → Tier 3 (GSAP)
│       └── No → Does it need 3D or complex shaders?
│           ├── Yes, with models/lighting → Tier 4 (Three.js / R3F)
│           ├── Yes, shader-only → Tier 5 (WebGL/WebGPU custom)
│           └── No → Does it have 100+ animated elements?
│               ├── Yes → Tier 5 (Canvas 2D)
│               └── No → Re-evaluate — CSS or FM likely handles it
```

### iOS: "Which tier do I need?"

```
Is this a state-driven animation (X changes, animate to Y)?
├── Yes → Tier 1 (SwiftUI)
│   Signals: view state changes, navigation transitions, gesture response,
│            spring/easing animations, phased sequences, staggered lists
│
├── No → Does it need particles, path drawing, or precise layer control?
│   ├── Particles → How many?
│   │   ├── <1000 → Tier 2 (CAEmitterLayer)
│   │   └── 1000+ with custom physics → Tier 3 (Metal compute)
│   ├── Path drawing/morphing → Tier 2 (CAShapeLayer)
│   ├── 3D layer transforms → Tier 2 (CATransform3D)
│   └── Precise keyframe timing → Tier 2 (CAKeyframeAnimation)
│
├── No → Does it need custom shader effects?
│   ├── On a SwiftUI view (ripple, distortion, color) → Tier 3 (ShaderLibrary, iOS 17+)
│   ├── Full-screen GPU rendering → Tier 3 (MTKView + Metal)
│   └── No
│
├── No → Does it need real-time physics simulation?
│   ├── Yes → Tier 4 (UIKit Dynamics via UIViewRepresentable)
│   └── No → Re-evaluate — SwiftUI likely handles it
```
