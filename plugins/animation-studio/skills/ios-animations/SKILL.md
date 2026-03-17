---
name: ios-animations
description: iOS animation implementation — SwiftUI native, Core Animation, Metal shaders, UIKit Dynamics. Includes haptic patterns and ProMotion awareness.
metadata:
  priority: 8
  pathPatterns:
    - "**/*.swift"
    - "**/*.metal"
    - "**/Animations/**"
    - "**/Effects/**"
  importPatterns:
    - "withAnimation"
    - "PhaseAnimator"
    - "KeyframeAnimator"
    - "CAAnimation"
    - "CAEmitterLayer"
    - "MTLDevice"
    - "ShaderLibrary"
    - "UIImpactFeedbackGenerator"
    - "CHHapticEngine"
  promptSignals:
    phrases:
      - "swiftui animation"
      - "ios animation"
      - "core animation"
      - "metal shader"
      - "haptic"
      - "matched geometry"
---

# iOS Animations

Platform-specific implementation skill for iOS animation work within the `animation-studio` plugin. This skill receives a structured brief from `animation-architect` (emotional beat, framework recommendation, haptic plan, brand tokens) and produces complete, buildable Swift code.

This skill covers four tiers of iOS animation capability, from declarative SwiftUI to raw GPU compute. Every tier includes haptic integration, reduced motion alternatives, and ProMotion awareness.

---

## 1. The Four Tiers

### Tier 1: SwiftUI Native

The default tier. Handles 80% of iOS animation needs with zero bridging, zero manual lifecycle management, and full integration with the SwiftUI state system.

**Capabilities:**
- `withAnimation` / `.animation()` — implicit and explicit animation
- Spring, easeIn, easeOut, easeInOut, linear, custom `CustomAnimation` protocol conformance
- `PhaseAnimator` (iOS 17+) — multi-step animation sequences driven by phase arrays
- `KeyframeAnimator` (iOS 17+) — keyframe-based per-property animation tracks
- `Canvas` + `TimelineView` — high-performance custom drawing at display refresh rate
- `.contentTransition(.numericText())` / `.contentTransition(.symbolEffect)` — semantic content transitions
- `.symbolEffect()` — SF Symbol animations (bounce, pulse, variableColor, replace, scale, appear, disappear, rotate, breathe, wiggle)
- `MeshGradient` (iOS 18+) — two-dimensional gradient with animated control points
- `matchedGeometryEffect` — hero transitions between views sharing a namespace
- `.navigationTransition(.zoom)` (iOS 18+) — system zoom transitions for NavigationStack
- `sensoryFeedback` modifier (iOS 17+) — declarative haptic pairing
- `GeometryReader` / `.onScrollGeometryChange` — scroll-position-driven animation

**When to use:** State-driven animations, view transitions, scroll effects, symbol animations, any animation that maps cleanly to a SwiftUI state change.

**Reference:** `references/swiftui-native.md`, `references/phase-keyframe-animators.md`, `references/matched-geometry.md`

### Tier 2: Core Animation

The power tier. Direct access to CALayer-based animation with explicit timing, grouping, and particle systems. Required when SwiftUI's declarative model cannot express the animation (explicit keyframe paths, particle emitters, shape layer line drawing, replicator patterns).

**Capabilities:**
- `CAKeyframeAnimation` — animate along arbitrary keyframe paths with per-keyframe timing
- `CAAnimationGroup` — synchronize multiple property animations with shared timing
- `CASpringAnimation` — physics-based spring with mass, stiffness, damping, initialVelocity
- `CAEmitterLayer` + `CAEmitterCell` — GPU-accelerated particle systems
- `CAShapeLayer` — strokeEnd line drawing, path morphing
- `CAReplicatorLayer` — instance replication with per-instance transform offsets
- `CATransform3D` — full 3D transforms with perspective
- `CADisplayLink` — frame-synchronized callbacks at display refresh rate

**Bridging:** All Core Animation usage in SwiftUI requires `UIViewRepresentable` (or `UIViewControllerRepresentable`). Every bridge must implement `makeUIView`, `updateUIView`, and cleanup via `Coordinator` or `dismantleUIView`.

**When to use:** Particle systems, complex keyframe paths, line drawing animations, replicator patterns, any animation requiring explicit timeline control outside SwiftUI's state system.

**Reference:** `references/core-animation.md`

### Tier 3: Metal Shaders

The GPU tier. Custom fragment shaders for per-pixel effects that no higher-level API can produce. SwiftUI integrates Metal shaders directly via `ShaderLibrary` (iOS 17+).

**Capabilities:**
- `.colorEffect()` — per-pixel color transformation (tint, invert, posterize, chromatic aberration)
- `.distortionEffect()` — per-pixel position displacement (ripple, wave, warp, fisheye)
- `.layerEffect()` — full layer access for complex compositing (blur, glow, sampling neighbors)
- Custom `.metal` files with `[[ stitchable ]]` functions
- Shader math: Perlin/Simplex noise, signed distance fields, polar coordinates, UV remapping
- `MTLDevice` / `MTLComputePipelineState` — compute shaders for GPU particle systems
- `CAMetalLayer` — direct Metal rendering in a layer (via `UIViewRepresentable`)
- `MTLTexture` — texture sampling in fragment shaders

**When to use:** Ripple/dissolve/noise effects, custom transition shaders, GPU-accelerated particle fields (1000+ particles), any per-pixel effect.

**Reference:** `references/metal-shaders.md`

### Tier 4: UIKit Dynamics

The physics simulation tier. Real physics engine for gravity, collision, snap, push, and attachment behaviors. Rarely needed — use only when true multi-body physics simulation produces a better result than manual spring/keyframe animation.

**Capabilities:**
- `UIDynamicAnimator` — the physics simulation engine
- `UIGravityBehavior` — gravitational force on items
- `UICollisionBehavior` — boundary and inter-item collision detection
- `UISnapBehavior` — spring-snap to a target point with configurable damping
- `UIPushBehavior` — instantaneous or continuous force application
- `UIAttachmentBehavior` — spring or rigid attachment between items or to anchor points
- `UIDynamicItemBehavior` — per-item physics properties (elasticity, friction, density, resistance)

**When to use:** Multi-body interactions (items falling and colliding), physics puzzles, realistic throw-and-bounce, any scenario where multiple items must react to each other physically. If only one item needs spring physics, use SwiftUI `.spring()` instead.

**Reference:** `references/uikit-dynamics.md`

---

## 2. Haptic Integration

Haptics are not optional. Every user-initiated animation that produces a discrete state change must include haptic feedback. This is enforced at the skill level.

### Haptic Pattern Library

These are the standard haptic patterns for iOS. Use these unless the animation-architect brief specifies a custom pattern.

| Pattern Name | Emotional Beat | API | Parameters | Timing |
|-------------|---------------|-----|-----------|--------|
| `entry` | Arrival | `sensoryFeedback(.impact(flexibility: .solid, intensity: 0.6))` | Trigger: landing state | At element's final position |
| `selection` | Discovery | `sensoryFeedback(.selection)` | Trigger: selected item | Immediately on interaction |
| `commit` | Commitment | `UIImpactFeedbackGenerator(.medium)` + `UINotificationFeedbackGenerator(.success)` | Beat 1: intensity 0.8. Beat 2: 200ms after | At action acceptance |
| `achievement` | Achievement | `CHHapticEngine` crescendo | 3 transients (0.4/0.6/0.9) + continuous buzz (0.3) | At peak visual moment |
| `error` | Error | `sensoryFeedback(.error)` | Trigger: error state | At error visual (shake/flash) |
| `transition` | Transition | `sensoryFeedback(.impact(flexibility: .soft, intensity: 0.4))` | Trigger: midpoint state | At transition midpoint |
| `ambient` | Ambient | None (default) | Skip haptics | N/A |

### Haptic-Animation Sync Rule

The haptic fires at the **moment of peak visual change**, not at animation start. For spring animations, this is approximately `response * 0.4` seconds after initiation (the moment of maximum velocity). For ease-out animations, this is at the landing frame. For multi-phase animations, this is at the most dramatic phase transition.

When using `sensoryFeedback`, the trigger value must represent the arrival/completion state, not the initiation state. If precise timing is required (e.g., midpoint of a Core Animation sequence), use `UIImpactFeedbackGenerator` with `DispatchQueue.main.asyncAfter` or a `CADisplayLink` callback.

### Generator Pre-warming

Always call `.prepare()` on feedback generators 100-200ms before the expected fire time. For drag interactions, call `.prepare()` in `.onChanged` (first touch). For button interactions, call `.prepare()` on touch-down (not tap). The Taptic Engine has ~50ms spin-up latency that `.prepare()` eliminates.

---

## 3. ProMotion Awareness

Devices with ProMotion displays (iPhone 13 Pro and later, iPad Pro) run at up to 120Hz. Animations on these devices must target 120fps to avoid visible frame drops that would not be noticeable on 60Hz displays.

### Rules

1. **SwiftUI animations automatically adapt** — `withAnimation`, `PhaseAnimator`, `KeyframeAnimator` all render at the display's native refresh rate. No additional work needed.

2. **`TimelineView(.animation)`** updates at the display's refresh rate. On ProMotion, this is 120Hz. Ensure your `Canvas` draw call or computation completes within ~8ms (not 16ms).

3. **`CADisplayLink`** reports the actual display refresh rate via `targetTimestamp - timestamp`. Use delta time for all animation math — never hardcode 1/60.

```swift
// WRONG: Hardcoded 60fps assumption
position += velocity * (1.0 / 60.0)

// RIGHT: Delta-time based
let dt = displayLink.targetTimestamp - displayLink.timestamp
position += velocity * dt
```

4. **Metal render loops** must match the display's refresh rate. Set `CAMetalLayer.preferredFramesPerSecond` to 0 (system-managed) or the display's maximum rate.

5. **Thermal throttling check:** Under thermal pressure, the system may reduce ProMotion to 60Hz. Detect via `ProcessInfo.processInfo.thermalState` and reduce animation complexity if `.serious` or `.critical`.

---

## 4. Reduced Motion

Every animation must have a reduced motion alternative. This is not optional. The alternative must serve the same emotional beat through different means.

```swift
@Environment(\.accessibilityReduceMotion) private var reduceMotion

// Spring entry → Fade entry
withAnimation(reduceMotion
    ? .easeInOut(duration: 0.3)
    : .spring(response: 0.4, dampingFraction: 0.7)
) {
    isVisible = true
}

// Particle burst → Radial opacity pulse
if reduceMotion {
    withAnimation(.easeOut(duration: 0.5)) { pulseOpacity = 1.0 }
} else {
    emitParticleBurst()
}

// Matched geometry hero → Crossfade
if reduceMotion {
    withAnimation(.easeInOut(duration: 0.25)) { showDetail = true }
} else {
    withAnimation(.spring(response: 0.5, dampingFraction: 0.85)) { showDetail = true }
}
```

The reduced motion alternative still receives haptic feedback (haptics are not motion). Only the visual animation changes.

---

## 5. Brand Config Integration

Read brand motion tokens from `.claude/animation-studio.local.md` (if present). Apply these tokens to all animation code.

```swift
// Standard brand animation extensions (generate from brand config)
extension Animation {
    /// Brand entry — sharp ease-out, things arrive with purpose
    static let brandEntry = Animation.easeOut(duration: 0.2)

    /// Brand exit — clean ease-in, things leave without lingering
    static let brandExit = Animation.easeIn(duration: 0.2)

    /// Brand spring — moderate stiffness, controlled
    static let brandSpring = Animation.spring(
        response: 0.35,
        dampingFraction: 0.75,
        blendDuration: 0
    )

    /// Brand slow — for ambient/atmospheric
    static let brandSlow = Animation.easeInOut(duration: 0.6)
}
```

If the brand config specifies "no bouncy animations," "no playful overshoot," or similar constraints — enforce them. A spring with `dampingFraction: 0.5` (visible bounce) violates a "no bouncy" constraint. Use `dampingFraction: 0.75+` for controlled springs that land without oscillation.

---

## 6. Memory Management

Every animation that allocates resources must clean up on disappear.

### SwiftUI Cleanup

```swift
// TimelineView + Canvas: no explicit cleanup needed — SwiftUI manages lifecycle

// @State arrays for particle data: clear on disappear
.onDisappear {
    particles.removeAll()
}
```

### Core Animation Cleanup (UIViewRepresentable)

```swift
func dismantleUIView(_ uiView: UIView, coordinator: Coordinator) {
    // Remove all animations
    uiView.layer.removeAllAnimations()

    // Nil out emitter layers
    if let emitter = uiView.layer.sublayers?.first(where: { $0 is CAEmitterLayer }) as? CAEmitterLayer {
        emitter.emitterCells = nil
        emitter.removeFromSuperlayer()
    }

    // Invalidate display links
    coordinator.displayLink?.invalidate()
    coordinator.displayLink = nil
}
```

### CHHapticEngine Cleanup

```swift
// Stop engine when view disappears
.onDisappear {
    hapticEngine?.stop(completionHandler: { _ in })
    hapticEngine = nil
}

// Handle engine reset (audio session interruption)
engine.resetHandler = { [weak self] in
    do {
        try self?.hapticEngine?.start()
    } catch {
        // Engine failed to restart — degrade to UIFeedbackGenerator fallback
    }
}
```

### Metal Resources Cleanup

```swift
// Release Metal resources explicitly
.onDisappear {
    computePipeline = nil
    particleBuffer = nil
    // MTLDevice is shared — never release it
}
```

---

## 7. Standards

Every Swift file produced by this skill must meet these standards:

1. **Complete and buildable.** Every file includes all necessary `import` statements and compiles with Xcode 16+ targeting iOS 17+ (unless the animation uses iOS 18+ APIs, in which case `@available(iOS 18.0, *)` is applied).

2. **Proper state management.** Use `@Observable` (iOS 17+) for reference-type view models. Use `@State` / `@Binding` for value-type view state. Never use `@ObservedObject` with `@Observable` classes.

3. **Haptic pairing.** Every user-initiated animation includes the appropriate haptic from the pattern library. Ambient/passive animations explicitly omit haptics.

4. **Reduced motion.** Every animation reads `@Environment(\.accessibilityReduceMotion)` and provides an alternative that serves the same emotional beat.

5. **Physics comments.** Any animation involving spring parameters, bezier control points, or physics simulation includes a brief comment explaining why those specific values were chosen (e.g., `// dampingFraction 0.75 = controlled landing, no visible bounce`).

6. **Memory cleanup.** Any animation that allocates resources (display links, emitter layers, haptic engines, Metal buffers) includes cleanup in `.onDisappear` or `dismantleUIView`.

7. **ProMotion safe.** All time-based calculations use delta time, never hardcoded frame duration.

8. **Fallback patterns.** iOS 18+ APIs (`MeshGradient`, `.navigationTransition(.zoom)`) include `if #available` checks with appropriate iOS 17 fallbacks.

---

## 8. Reference Index

| Reference | Covers |
|-----------|--------|
| `references/swiftui-native.md` | withAnimation, .animation(), springs, easeIn/Out, CustomAnimation, Canvas + TimelineView, contentTransition, symbolEffect, MeshGradient, GeometryReader scroll tracking, sensoryFeedback |
| `references/phase-keyframe-animators.md` | PhaseAnimator multi-step sequences, KeyframeAnimator per-property tracks, state transitions, multi-phase entry patterns |
| `references/matched-geometry.md` | matchedGeometryEffect hero transitions, list-to-detail, tab transitions, card expansion, namespace management, iOS 18 NavigationTransition zoom |
| `references/core-animation.md` | CAKeyframeAnimation, CAAnimationGroup, CAEmitterLayer particles, CAShapeLayer line drawing, CAReplicatorLayer, CATransform3D, CADisplayLink, CASpringAnimation, UIViewRepresentable bridging |
| `references/metal-shaders.md` | ShaderLibrary + SwiftUI modifiers, custom .metal shaders, ripple/dissolve/noise/chromatic, compute shaders, MTLTexture, CAMetalLayer, shader math |
| `references/uikit-dynamics.md` | UIGravityBehavior, UICollisionBehavior, UISnapBehavior, UIPushBehavior, UIAttachmentBehavior, physics sim vs manual animation |
| `references/ios-haptics.md` | All feedback generators, CHHapticEngine patterns, sensoryFeedback modifier, haptic pattern library, haptic-animation sync, battery, pre-warming |

## 9. Example Index

| Example | Demonstrates |
|---------|-------------|
| `examples/spring-card.swift` | DragGesture + spring physics, rotation/scale from offset, haptic on release |
| `examples/phase-animator-loader.swift` | PhaseAnimator 3-phase loading indicator, reduced motion alternative |
| `examples/matched-geometry-hero.swift` | matchedGeometryEffect list-to-detail hero transition with overlay |
| `examples/particle-emitter.swift` | CAEmitterLayer wrapped in UIViewRepresentable, configurable particles |
| `examples/metal-ripple.swift` | Metal shader ripple via .distortionEffect, animated time + touch point |
| `examples/haptic-sequence.swift` | CHHapticEngine pattern builder, composable named sequences |
