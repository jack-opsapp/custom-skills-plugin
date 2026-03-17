# SwiftUI Native Animations — Complete Reference

Everything SwiftUI provides out of the box for animation, without dropping into Core Animation or Metal. This covers iOS 17+ with iOS 18+ additions marked.

---

## 1. Implicit vs Explicit Animation

### Implicit: `.animation()` Modifier

Attaches an animation to a specific value. When that value changes, SwiftUI animates the affected properties.

```swift
struct PulseCircle: View {
    @State private var isExpanded = false

    var body: some View {
        Circle()
            .fill(.blue)
            .frame(width: isExpanded ? 120 : 60, height: isExpanded ? 120 : 60)
            .animation(.spring(response: 0.4, dampingFraction: 0.6), value: isExpanded)
            // dampingFraction 0.6 = slight bounce, feels alive without being playful
            .onTapGesture { isExpanded.toggle() }
    }
}
```

**When to use:** When a single property change drives the animation and you want to colocate the animation with the visual property.

**Pitfall:** `.animation()` without a `value:` parameter is deprecated and animates ALL state changes on the view — avoid it.

### Explicit: `withAnimation`

Wraps a state mutation in an animation block. All views affected by the state change animate.

```swift
struct CardReveal: View {
    @State private var showCard = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack {
            if showCard {
                CardView()
                    .transition(.asymmetric(
                        insertion: .scale(scale: 0.8).combined(with: .opacity),
                        removal: .opacity
                    ))
            }

            Button("Show") {
                withAnimation(reduceMotion
                    ? .easeInOut(duration: 0.25)
                    : .spring(response: 0.45, dampingFraction: 0.8)
                    // response 0.45 = fast but not jarring
                    // dampingFraction 0.8 = lands cleanly, no oscillation
                ) {
                    showCard.toggle()
                }
            }
        }
        .sensoryFeedback(.impact(flexibility: .solid, intensity: 0.6), trigger: showCard)
    }
}
```

**When to use:** When a state change affects multiple views simultaneously, or when you want precise control over which state changes are animated.

---

## 2. Animation Types

### Built-in Curves

```swift
// Linear — constant speed, mechanical feel. Rarely correct for UI.
.animation(.linear(duration: 0.3), value: progress)

// Ease in — starts slow, accelerates. Use for exits (element leaving).
.animation(.easeIn(duration: 0.2), value: isLeaving)

// Ease out — starts fast, decelerates. Use for entries (element arriving).
.animation(.easeOut(duration: 0.2), value: isArriving)

// Ease in-out — slow start and end. Use for state toggles, ambient loops.
.animation(.easeInOut(duration: 0.35), value: isToggled)

// Custom bezier — full control over the curve shape
// (0.16, 1, 0.3, 1) = aggressive ease-out, sharp landing
.animation(.timingCurve(0.16, 1, 0.3, 1, duration: 0.3), value: isVisible)
```

### Spring Animations

Springs are the gold standard for iOS animation. They feel physical and respond naturally to interruption.

```swift
// Response-based spring (recommended for most UI)
.spring(response: 0.4, dampingFraction: 0.7, blendDuration: 0)
// response = time to reach target (seconds). Lower = snappier.
// dampingFraction: 0 = infinite oscillation, 1 = no overshoot
//   0.5-0.6 = noticeable bounce (playful)
//   0.7-0.8 = controlled overshoot (professional)
//   0.85-1.0 = smooth arrival (serious/tactical)
// blendDuration: how to blend when interrupted. 0 = instant retarget.

// Stiffness-based spring (when you need physics params)
.spring(mass: 1, stiffness: 300, damping: 20)
// Higher stiffness = faster, more energetic
// Higher damping = less oscillation
// Higher mass = slower, heavier feel

// Snappy preset — quick with slight overshoot
.spring(.snappy)

// Bouncy preset — obvious bounce (use cautiously with brand constraints)
.spring(.bouncy)

// Smooth preset — gentle arrival
.spring(.smooth)

// Interruptible spring — automatically retargets when state changes mid-animation
// All SwiftUI springs are interruptible by default. Changing the animated state
// mid-flight causes the spring to smoothly redirect toward the new target,
// preserving existing velocity.
```

### CustomAnimation Protocol (iOS 17+)

For animations that built-in curves cannot express. Conforming to `CustomAnimation` gives frame-by-frame control.

```swift
struct BrandEntryAnimation: CustomAnimation {
    let duration: TimeInterval = 0.3

    func animate<V: VectorArithmetic>(
        value: V,
        time: Double,
        context: inout AnimationContext<V>
    ) -> V? {
        // Return nil when animation is complete
        guard time < duration else { return nil }

        // Custom aggressive ease-out curve
        let progress = time / duration
        // Deceleration curve: 1 - (1 - t)^3
        let eased = 1.0 - pow(1.0 - progress, 3)

        // Interpolate from start (stored in context) toward target
        let start = context.environment.accessibilityReduceMotion
            ? value  // Skip to end if reduce motion
            : value.scaled(by: 1.0 - eased)
        return start
    }

    func shouldMerge<V: VectorArithmetic>(
        previous: Animation,
        value: V,
        time: Double,
        context: inout AnimationContext<V>
    ) -> Bool {
        // Return true to merge with a previous animation of the same type
        false
    }
}

extension Animation {
    static var brandEntry: Animation {
        Animation(BrandEntryAnimation())
    }
}
```

---

## 3. Canvas + TimelineView

For high-performance custom drawing that updates every frame. SwiftUI's `Canvas` is backed by Core Graphics and does not create views — it draws directly.

```swift
struct ParticleField: View {
    @State private var particles: [Particle] = (0..<50).map { _ in Particle.random() }
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation(minimumInterval: nil, paused: reduceMotion)) { timeline in
            Canvas { context, size in
                let now = timeline.date.timeIntervalSinceReferenceDate

                for particle in particles {
                    // Calculate position based on time (delta-time safe via sin/cos)
                    let x = particle.baseX + sin(now * particle.speed + particle.phase) * particle.amplitude
                    let y = particle.baseY + cos(now * particle.speed * 0.7 + particle.phase) * particle.amplitude * 0.6

                    let rect = CGRect(
                        x: x * size.width - 2,
                        y: y * size.height - 2,
                        width: 4,
                        height: 4
                    )

                    context.fill(
                        Circle().path(in: rect),
                        with: .color(.white.opacity(particle.opacity))
                    )
                }
            }
        }
        .onDisappear {
            particles.removeAll()
        }
    }
}

struct Particle {
    let baseX: Double
    let baseY: Double
    let speed: Double
    let phase: Double
    let amplitude: Double
    let opacity: Double

    static func random() -> Particle {
        Particle(
            baseX: Double.random(in: 0...1),
            baseY: Double.random(in: 0...1),
            speed: Double.random(in: 0.3...1.2),
            phase: Double.random(in: 0...(.pi * 2)),
            amplitude: Double.random(in: 0.01...0.05),
            opacity: Double.random(in: 0.2...0.6)
        )
    }
}
```

**Performance notes:**
- `Canvas` does not create views per element — draw 1000 elements with no view overhead.
- `TimelineView(.animation)` fires at display refresh rate (120Hz on ProMotion).
- Pass `paused: true` when `reduceMotion` is on or when the view is not visible.
- Use `minimumInterval` to cap update rate if full framerate is unnecessary (saves battery).

---

## 4. Content Transitions

### Numeric Text

```swift
struct CounterView: View {
    @State private var count = 0

    var body: some View {
        Text("\(count)")
            .font(.system(size: 48, weight: .bold, design: .monospaced))
            .contentTransition(.numericText(countsDown: false))
            .onTapGesture {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                    count += 1
                }
            }
            .sensoryFeedback(.selection, trigger: count)
    }
}
```

### Symbol Effects (iOS 17+)

```swift
struct SymbolAnimations: View {
    @State private var isFavorite = false
    @State private var downloadCount = 0

    var body: some View {
        VStack(spacing: 24) {
            // Bounce on tap
            Image(systemName: "heart.fill")
                .font(.title)
                .foregroundStyle(isFavorite ? .red : .gray)
                .symbolEffect(.bounce, value: isFavorite)
                .onTapGesture { isFavorite.toggle() }

            // Pulse continuously while active
            Image(systemName: "antenna.radiowaves.left.and.right")
                .font(.title)
                .symbolEffect(.pulse, isActive: true)

            // Variable color (loading indicator)
            Image(systemName: "wifi")
                .font(.title)
                .symbolEffect(.variableColor.iterative, isActive: true)

            // Replace transition between symbols
            Image(systemName: isFavorite ? "heart.fill" : "heart")
                .font(.title)
                .contentTransition(.symbolEffect(.replace))

            // Scale effect
            Image(systemName: "star.fill")
                .font(.title)
                .symbolEffect(.scale.up, isActive: isFavorite)

            // Appear/Disappear
            Image(systemName: "checkmark.circle.fill")
                .font(.title)
                .symbolEffect(.appear, isActive: isFavorite)

            // iOS 18+: Rotate
            if #available(iOS 18.0, *) {
                Image(systemName: "arrow.clockwise")
                    .font(.title)
                    .symbolEffect(.rotate, value: downloadCount)
            }

            // iOS 18+: Breathe
            if #available(iOS 18.0, *) {
                Image(systemName: "circle.fill")
                    .font(.title)
                    .symbolEffect(.breathe, isActive: true)
            }

            // iOS 18+: Wiggle
            if #available(iOS 18.0, *) {
                Image(systemName: "bell.fill")
                    .font(.title)
                    .symbolEffect(.wiggle, value: downloadCount)
            }
        }
    }
}
```

---

## 5. MeshGradient (iOS 18+)

Two-dimensional gradient defined by a grid of positioned colors. Animatable by changing point positions and colors.

```swift
@available(iOS 18.0, *)
struct AnimatedMeshBackground: View {
    @State private var phase: CGFloat = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0, paused: reduceMotion)) { timeline in
            let t = timeline.date.timeIntervalSinceReferenceDate

            MeshGradient(
                width: 3,
                height: 3,
                points: [
                    // Row 0 — top edge
                    SIMD2<Float>(0.0, 0.0),
                    SIMD2<Float>(0.5, 0.0),
                    SIMD2<Float>(1.0, 0.0),
                    // Row 1 — middle, animated
                    SIMD2<Float>(0.0, 0.5),
                    SIMD2<Float>(
                        Float(0.5 + sin(t * 0.5) * 0.15),
                        Float(0.5 + cos(t * 0.7) * 0.15)
                    ),
                    SIMD2<Float>(1.0, 0.5),
                    // Row 2 — bottom edge
                    SIMD2<Float>(0.0, 1.0),
                    SIMD2<Float>(0.5, 1.0),
                    SIMD2<Float>(1.0, 1.0),
                ],
                colors: [
                    Color(red: 0.04, green: 0.04, blue: 0.04), // #0A0A0A (brand canvas)
                    Color(red: 0.15, green: 0.25, blue: 0.35),
                    Color(red: 0.04, green: 0.04, blue: 0.04),

                    Color(red: 0.12, green: 0.20, blue: 0.30),
                    Color(red: 0.35, green: 0.47, blue: 0.58), // #597794 (brand accent)
                    Color(red: 0.12, green: 0.20, blue: 0.30),

                    Color(red: 0.04, green: 0.04, blue: 0.04),
                    Color(red: 0.15, green: 0.25, blue: 0.35),
                    Color(red: 0.04, green: 0.04, blue: 0.04),
                ],
                smoothsColors: true
            )
            .ignoresSafeArea()
        }
    }
}

// Fallback for iOS 17
struct MeshGradientFallback: View {
    var body: some View {
        LinearGradient(
            colors: [
                Color(red: 0.04, green: 0.04, blue: 0.04),
                Color(red: 0.20, green: 0.32, blue: 0.42),
                Color(red: 0.04, green: 0.04, blue: 0.04),
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .ignoresSafeArea()
    }
}
```

**Key parameters:**
- `width`, `height`: Grid dimensions. 3x3 = 9 points, 4x4 = 16 points. Higher = more complex gradients.
- `points`: `SIMD2<Float>` positions in 0...1 normalized space. Corner/edge points should stay at edges.
- `colors`: One color per point. Interpolated via the specified `colorSpace` (default: `.device`).
- `smoothsColors`: When `true`, uses cubic interpolation for smoother color transitions.
- `background`: Fallback color for areas outside the mesh (default: clear).

---

## 6. Scroll-Driven Animation

### GeometryReader Scroll Tracking

```swift
struct ScrollParallax: View {
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(0..<20, id: \.self) { index in
                    GeometryReader { proxy in
                        let minY = proxy.frame(in: .global).minY
                        let screenHeight = UIScreen.main.bounds.height
                        // 0 when at top of screen, 1 when at bottom
                        let progress = min(max(minY / screenHeight, 0), 1)

                        ItemCard(index: index)
                            .opacity(0.3 + progress * 0.7)
                            .scaleEffect(0.9 + progress * 0.1)
                    }
                    .frame(height: 200)
                }
            }
        }
    }
}
```

### onScrollGeometryChange (iOS 18+)

```swift
@available(iOS 18.0, *)
struct ScrollOffsetView: View {
    @State private var scrollOffset: CGFloat = 0

    var body: some View {
        ScrollView {
            content
        }
        .onScrollGeometryChange(for: CGFloat.self) { proxy in
            proxy.contentOffset.y
        } action: { oldValue, newValue in
            scrollOffset = newValue
        }
        .overlay(alignment: .top) {
            HeaderView()
                .opacity(max(0, 1 - scrollOffset / 100))
        }
    }
}
```

---

## 7. sensoryFeedback Modifier (iOS 17+)

Declarative haptic pairing. Fires when the trigger value changes.

```swift
struct HapticExamples: View {
    @State private var isSubmitted = false
    @State private var selectedTab = 0
    @State private var taskComplete = false
    @State private var hasError = false
    @State private var sliderValue: Double = 0

    var body: some View {
        VStack {
            // Impact with configurable weight
            Button("Submit") {
                withAnimation(.brandSpring) { isSubmitted = true }
            }
            .sensoryFeedback(
                .impact(weight: .medium, intensity: 0.8),
                trigger: isSubmitted
            )

            // Selection tick on picker change
            Picker("Tab", selection: $selectedTab) {
                Text("One").tag(0)
                Text("Two").tag(1)
            }
            .sensoryFeedback(.selection, trigger: selectedTab)

            // Success notification
            ProgressView()
                .sensoryFeedback(.success, trigger: taskComplete)

            // Error notification
            TextField("Email", text: .constant(""))
                .sensoryFeedback(.error, trigger: hasError)

            // Alignment snap
            Slider(value: $sliderValue, in: 0...100, step: 10)
                .sensoryFeedback(.alignment, trigger: sliderValue)

            // Increase/decrease semantic feedback
            Stepper("Quantity", value: .constant(1), in: 0...99)
                .sensoryFeedback(.increase, trigger: sliderValue) { old, new in
                    new > old // Only fire when increasing
                }
        }
    }
}
```

**Available feedback types:**
| Type | Feel | Use Case |
|------|------|----------|
| `.impact(weight:intensity:)` | Configurable impact. Weight: `.light`/`.medium`/`.heavy` | Button presses, landings |
| `.impact(flexibility:intensity:)` | Configurable impact. Flexibility: `.rigid`/`.solid`/`.soft` | Snaps, collisions |
| `.selection` | Ultra-light tick | Picker changes, selections |
| `.success` | Rising double-tap | Task completion, form submit |
| `.warning` | Sharp triple-tap | Destructive action confirmation |
| `.error` | Heavy double-tap | Validation failure |
| `.increase` | Subtle upward | Value increased |
| `.decrease` | Subtle downward | Value decreased |
| `.start` | Activation feel | Process started |
| `.stop` | Deactivation feel | Process stopped |
| `.alignment` | Precise snap | Item snapped to grid/guide |
| `.levelChange` | Detent step | Discrete level changed |

**Conditional firing:**
```swift
// Only fire when condition is met
.sensoryFeedback(.success, trigger: score) { oldScore, newScore in
    newScore >= 100 && oldScore < 100  // Only on first time hitting 100
}
```
