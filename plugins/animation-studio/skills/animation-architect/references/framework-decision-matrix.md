# Framework Decision Matrix — Detailed Reference

Companion to the six-dimension evaluation in SKILL.md. Each row below represents a common animation scenario, scored across the dimensions, with a concrete recommendation.

---

## Web Framework Decision Matrix

The web ecosystem in 2026 offers five tiers of animation capability. From lightest to most powerful:

1. **CSS** — Including `@starting-style`, `scroll-driven animations` (scroll-timeline, view-timeline), `view transitions API`, `linear()` easing, `@property` for animatable custom properties. Zero JS, zero bundle cost.
2. **Framer Motion 12+** — React-native animation library. Layout animations, shared layout (AnimatePresence), spring physics, gesture integration, `useScroll`, `useMotionValue`, variants. ~15KB gzipped.
3. **GSAP 3.12+** — Timeline-based. ScrollTrigger, SplitText, MorphSVG, Flip, MotionPath, DrawSVG. Framework-agnostic. ~30KB gzipped (core + ScrollTrigger).
4. **Three.js r170+ / React Three Fiber** — WebGL/WebGPU 3D renderer. Post-processing (bloom, DOF), physics (rapier), shaders (GLSL/WGSL), instanced meshes. ~150KB gzipped.
5. **Canvas 2D / WebGL / WebGPU** — Direct pixel control. Custom particle systems, generative art, bespoke effects impossible in DOM.

| # | Scenario | Interactivity | Spatial | Trigger | Elements | Viewport | FPS | Recommended Stack | Rationale | Bundle Cost | Alternative |
|---|----------|---------------|---------|---------|----------|----------|-----|-------------------|-----------|-------------|-------------|
| 1 | Button hover ripple / focus ring | Reactive | 2D flat | User-driven | Single | Inline | 60 | **CSS** (`@starting-style` + `transition`) | Zero JS. Compositor-only properties (opacity, transform, background-color). Instant response. | 0KB | Framer Motion `whileHover` if already loaded |
| 2 | Accordion expand/collapse | Reactive | 2D flat | User-driven | Single | Inline | 60 | **CSS** (`interpolate-size: allow-keywords` + `calc-size()`) | Native height animation landed in all browsers 2025. No JS needed for auto-height transitions. | 0KB | Framer Motion `AnimatePresence` with `layout` for spring physics |
| 3 | Toast / notification enter + exit | Passive | 2D flat | State-driven | Single | Inline | 60 | **Framer Motion** (`AnimatePresence` + variants) | Exit animations require presence tracking. FM handles mount/unmount lifecycle cleanly. | 15KB | CSS `@starting-style` for enter-only (no exit animation control) |
| 4 | Page/route transition with shared elements | Passive | 2D+depth | State-driven | Small group | Full viewport | 60 | **Framer Motion** (`layoutId` + `AnimatePresence`) | Shared layout animations across routes. `layoutId` produces morphing effect between pages. | 15KB | View Transitions API (browser-native, but limited customization) |
| 5 | Tab content crossfade | Passive | 2D flat | State-driven | Small group | Section | 60 | **CSS** (View Transitions API) | `document.startViewTransition()` with `view-transition-name` per element. Native, zero-JS, hardware-accelerated. | 0KB | Framer Motion `AnimatePresence` with `mode="wait"` |
| 6 | Card stagger entrance on scroll | Passive | 2D flat | Scroll-driven | Field (10-30) | Section | 60 | **CSS** (scroll-driven animations + `animation-timeline: view()` + `nth-child` delay offsets) | Pure CSS scroll-triggered entrance. Each card uses `animation-range` with staggered `animation-delay`. | 0KB | GSAP ScrollTrigger `stagger` for complex sequencing |
| 7 | Scroll-driven parallax hero | Reactive | 2D+depth | Scroll-driven | Small group | Full viewport | 60 | **GSAP ScrollTrigger** | Multi-layer parallax with scrub, pin, and timeline composition. ScrollTrigger's `scrub` parameter gives frame-perfect scroll binding. | 30KB | CSS `scroll-timeline` for simple two-layer parallax |
| 8 | Text split + stagger reveal | Passive | 2D flat | Scroll-driven / Time-driven | Field (10-100 chars) | Section | 60 | **GSAP SplitText + ScrollTrigger** | SplitText decomposes into chars/words/lines. Timeline staggers with ScrollTrigger scrub. No other tool handles per-character animation at this fidelity. | 35KB | Framer Motion with manual char splitting (more code, less control) |
| 9 | SVG path morphing / drawing | Passive | 2D flat | Scroll-driven / Time-driven | Single | Section | 60 | **GSAP MorphSVG + DrawSVG** | Path-to-path morphing with automatic point matching. DrawSVG for stroke animation. These are GSAP's signature capabilities. | 40KB | CSS `stroke-dasharray` + `stroke-dashoffset` for simple draw-on only |
| 10 | Drag-to-reorder list with spring physics | Interactive | 2D flat | User-driven | Small group | Section | 60 | **Framer Motion** (`Reorder` + `useDragControls` + layout animations) | Built-in reorder primitives with spring-based layout shifts. Gesture handling integrated. | 15KB | Custom drag with GSAP Draggable (more control, more code) |
| 11 | Full-page scroll-snapped storytelling | Reactive | 2D+depth | Scroll-driven | Small group per section | Multi-viewport | 60 | **GSAP ScrollTrigger** (pinning + timelines per section) | Pin sections, play timelines on scroll, scrub through complex multi-step narratives. ScrollTrigger's `pin` + `scrub` is unmatched for this. | 30KB | CSS scroll-snap + scroll-driven animations (less control over timeline) |
| 12 | Interactive data dashboard with animated charts | Interactive | 2D flat | State-driven | Field (10-100) | Section | 60 | **Framer Motion** (for React integration) or **D3 + Canvas** (for large datasets) | FM for <100 data points with React state. D3+Canvas for 100+ points where DOM nodes would thrash. | 15-45KB | Chart.js/Recharts (less animation control, higher abstraction) |
| 13 | Particle field responding to cursor | Reactive | 2D flat | Continuous | System (100+) | Full viewport | 60 | **Canvas 2D** with `requestAnimationFrame` | DOM cannot handle 100+ independently moving elements. Canvas renders all particles in a single draw call. DPI-aware setup required. | 0KB (custom) | WebGL via raw shaders for 1000+ particles |
| 14 | 3D product viewer with orbit controls | Interactive | True 3D | User-driven | Single (complex mesh) | Section | 60 | **Three.js / React Three Fiber** | Real 3D model rendering with OrbitControls, environment lighting, material system. Nothing else does real-time 3D. | 150KB | CSS `transform: perspective()` for fake 3D card tilts only |
| 15 | WebGPU generative art / shader-driven background | Passive | 2D+depth | Continuous | System | Full viewport | 60 | **WebGPU / Custom WebGL** | Shader-driven effects (noise fields, fluid sim, raymarching) require GPU compute. No framework wraps this — custom GLSL/WGSL. | 0KB (custom) | Three.js ShaderMaterial for simpler shader effects with less boilerplate |
| 16 | Animated gradient mesh background | Passive | 2D flat | Continuous | Single | Full viewport | 60 | **CSS** (`@property` animated custom properties + `conic-gradient` / `radial-gradient`) | CSS Houdini `@property` enables smooth gradient color transitions. Zero JS, fully compositor-driven. | 0KB | Canvas 2D with noise function for organic motion (more control, requires rAF) |
| 17 | Lottie/bodymovin after-effects export | Passive | 2D flat | Time-driven | Single | Inline/Section | 60 | **lottie-web** or **dotlottie-player** | Pre-authored After Effects animations exported as JSON. Lottie renders to Canvas or SVG. | 50KB (player) | Rive for interactive Lottie-like with state machines |
| 18 | Scroll-driven video scrub | Reactive | 2D flat | Scroll-driven | Single | Full viewport | 30 | **GSAP ScrollTrigger** controlling `video.currentTime` | ScrollTrigger scrub mapped to video time. Requires pre-decoded video frames or canvas frame extraction for smooth scrub. | 30KB | Intersection Observer + manual scroll listener (fragile timing) |

---

## iOS Framework Decision Matrix

The iOS ecosystem offers four tiers:

1. **SwiftUI Native** — `withAnimation`, `.animation()`, `PhaseAnimator`, `KeyframeAnimator`, `matchedGeometryEffect`, `Canvas` + `TimelineView`, `MeshGradient`, `contentTransition`, `sensoryFeedback`. iOS 17+ focus.
2. **Core Animation** — `CAEmitterLayer`, `CAShapeLayer`, `CAKeyframeAnimation`, `CASpringAnimation`, `CADisplayLink`, `CATransform3D`, `CABasicAnimation`, `CAAnimationGroup`. The workhorse layer.
3. **Metal** — `ShaderLibrary` + SwiftUI visual effects, custom `.metal` compute/fragment shaders, `MTKView`, GPU particle systems. Maximum GPU power.
4. **UIKit Dynamics** — `UIDynamicAnimator`, `UIGravityBehavior`, `UICollisionBehavior`, `UISnapBehavior`, `UIPushBehavior`, `UIAttachmentBehavior`. Physics simulation. Bridged via `UIViewRepresentable`.

| # | Scenario | Interactivity | Spatial | Trigger | Elements | Viewport | FPS | Recommended Stack | Rationale | iOS Min | Alternative |
|---|----------|---------------|---------|---------|----------|----------|-----|-------------------|-----------|---------|-------------|
| 1 | Button press scale + haptic | Reactive | 2D flat | User-driven | Single | Inline | 120 | **SwiftUI** (`.scaleEffect` + `sensoryFeedback(.impact, trigger:)`) | Declarative, one line. SwiftUI spring handles ProMotion natively. | 17.0 | `withAnimation(.spring()) { scale = 0.95 }` for iOS 16 |
| 2 | Card expand to detail (hero transition) | Passive | 2D+depth | State-driven | Single | Full viewport | 120 | **SwiftUI** (`matchedGeometryEffect` + `NavigationTransition`) | Shared geometry across navigation. `matchedGeometryEffect` morphs frame + corner radius. `NavigationTransition` in iOS 18 for custom push/pop. | 17.0+ | Custom `UIViewControllerAnimatedTransitioning` for pre-17 |
| 3 | List item stagger entrance | Passive | 2D flat | State-driven | Field (10-30) | Section | 60 | **SwiftUI** (`ForEach` with index-based `.delay()` in `withAnimation`) | Each item appears with a staggered delay. Simple, declarative, handles dynamic lists. | 16.0 | `PhaseAnimator` per-item for multi-phase entrance (iOS 17) |
| 4 | Multi-phase onboarding animation | Passive | 2D+depth | Time-driven | Small group | Full viewport | 120 | **SwiftUI** (`PhaseAnimator` with custom phases enum) | `PhaseAnimator` cycles through defined phases automatically. Each phase specifies scale, opacity, rotation, offset. Perfect for scripted sequences. | 17.0 | Chained `withAnimation` + `DispatchQueue.main.asyncAfter` (fragile) |
| 5 | Keyframe-driven character animation | Passive | 2D flat | Time-driven | Single | Section | 60 | **SwiftUI** (`KeyframeAnimator` with `KeyframeTrack`) | Precise per-property keyframes with individual timing curves. Like CSS `@keyframes` but declarative Swift. | 17.0 | `CAKeyframeAnimation` via UIViewRepresentable |
| 6 | Particle burst celebration | Passive | 2D+depth | Time-driven | System (100+) | Full viewport | 120 | **Core Animation** (`CAEmitterLayer`) | `CAEmitterLayer` is hardware-accelerated, handles thousands of particles with configurable birth rate, velocity, spin, fade. Unreachable by SwiftUI alone. | 15.0 | Metal compute shader for 10,000+ particles with custom physics |
| 7 | Animated mesh gradient background | Continuous | 2D flat | Time-driven | Single | Full viewport | 120 | **SwiftUI** (`MeshGradient` + `TimelineView` + `withAnimation`) | `MeshGradient` animates control points smoothly. `TimelineView` drives continuous updates. Native API, GPU-rendered. | 18.0 | Metal fragment shader for pre-iOS 18 or custom gradient math |
| 8 | Custom loading spinner with path drawing | Passive | 2D flat | Continuous | Single | Inline | 60 | **Core Animation** (`CAShapeLayer` + `CABasicAnimation` on `strokeEnd`) | `strokeEnd` animation creates drawing effect. `CAShapeLayer` renders vector paths at any scale. Rotation via `CABasicAnimation` on `transform.rotation`. | 15.0 | SwiftUI `trim(from:to:)` with `TimelineView` |
| 9 | Physics-based ball drop / collision | Interactive | 2D flat | User-driven | Small group | Section | 60 | **UIKit Dynamics** (`UIGravityBehavior` + `UICollisionBehavior`) via `UIViewRepresentable` | Real physics simulation: gravity, collision detection, bouncing, elasticity. No other iOS API provides real-time physics with collision boundaries. | 15.0 | SpriteKit `SKPhysicsWorld` for complex multi-body physics |
| 10 | GPU particle system with user interaction | Interactive | 2D+depth | User-driven + Continuous | System (1000+) | Full viewport | 120 | **Metal** (compute shader + render pipeline) | Metal compute shaders update particle positions on GPU. Render pipeline draws instanced quads. Handles 10,000+ particles at 120fps. Touch input feeds as uniform buffer. | 15.0 | `CAEmitterLayer` for <500 particles without custom physics |
| 11 | Custom page curl / book flip transition | Interactive | Pseudo-3D | User-driven | Single | Full viewport | 60 | **Core Animation** (`CATransform3D` + `CALayer` sublayer transform) | 3D perspective transforms on layers simulate page curl. `sublayerTransform` sets vanishing point. Gesture-driven rotation around Y axis. | 15.0 | Metal for physically accurate paper simulation with shadows |
| 12 | Real-time audio visualizer | Reactive | 2D flat | Continuous | Field (30-100 bars) | Section | 120 | **SwiftUI** (`Canvas` + `TimelineView` + `AVAudioEngine` tap) | `Canvas` draws frequency bars every frame via `TimelineView`. `AVAudioEngine` `installTap` provides real-time FFT data. Canvas is immediate-mode, no view diffing overhead. | 16.0 | Metal for waveform shaders or 3D spectrum visualization |
| 13 | Drag-to-reorder with spring settle | Interactive | 2D flat | User-driven | Small group | Section | 120 | **SwiftUI** (`.draggable` / `DragGesture` + `.spring()` animation + `matchedGeometryEffect`) | Native gesture handling. Spring animation on release snaps items to grid. `matchedGeometryEffect` animates other items smoothly out of the way. | 17.0 | UIKit `UICollectionView` with custom `UICollectionViewLayout` for complex grids |
| 14 | Custom shader visual effect overlay | Passive | 2D flat | State-driven / Continuous | Single | Full viewport | 120 | **Metal** (`ShaderLibrary` + SwiftUI `.visualEffect` / `.layerEffect` / `.colorEffect`) | iOS 17 `ShaderLibrary` allows `.metal` shaders applied directly to SwiftUI views. Ripple, distortion, color grading — all GPU-accelerated, composable with SwiftUI. | 17.0 | Core Image `CIFilter` for predefined effects (less custom) |
| 15 | Scroll-linked header collapse with blur | Reactive | 2D flat | Scroll-driven | Small group | Section | 120 | **SwiftUI** (`ScrollView` + `.onScrollGeometryChange` + `withAnimation` + `.blur()`) | iOS 18 `onScrollGeometryChange` provides scroll offset. Drive header height, blur radius, and opacity from scroll position. | 18.0 | `GeometryReader` + `PreferenceKey` scroll tracking for iOS 16-17 |

---

## Cross-Platform Notes

### When Web and iOS Need the Same Animation

If an animation must exist on both platforms (e.g., a branded celebration that appears in both the web app and iOS app):

1. **Define the animation spec in platform-neutral terms** — emotional beat, timing, easing curve parameters, color values, haptic intensity.
2. **Implement natively on each platform** — do not use a cross-platform animation runtime (Lottie is the exception for pre-authored motion graphics).
3. **Match the FEEL, not the frame-by-frame output.** Native tools on each platform will produce slightly different pixel output. That is correct. What must match is the emotional impact, timing, and weight.

### Lottie as a Bridge

Lottie (After Effects export via Bodymovin) is the one legitimate cross-platform animation format. Use it when:
- A designer authored the animation in After Effects
- The animation is self-contained (no interaction, no dynamic data)
- Pixel-perfect cross-platform match is required

Do not use Lottie for interactive animations, data-driven animations, or anything that responds to user input in real time.
