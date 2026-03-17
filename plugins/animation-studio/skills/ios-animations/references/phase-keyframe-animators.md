# PhaseAnimator & KeyframeAnimator — Complete Reference

iOS 17+ multi-step and keyframe-based animation systems. These replace the need for chained `DispatchQueue.main.asyncAfter` sequences and manual timer-based animation state machines.

---

## 1. PhaseAnimator (iOS 17+)

Automatically cycles through a collection of phases, animating content as each phase becomes active. Each phase defines a discrete visual state.

### Basic Structure

```swift
// PhaseAnimator as a container view
PhaseAnimator(phases) { phase in
    // View content — receives the current phase
    Circle()
        .scaleEffect(phase.scale)
        .opacity(phase.opacity)
} animation: { phase in
    // Animation to use when transitioning TO this phase
    phase.animation
}

// phaseAnimator as a view modifier (convenience)
Circle()
    .phaseAnimator(phases) { content, phase in
        content
            .scaleEffect(phase.scale)
            .opacity(phase.opacity)
    } animation: { phase in
        phase.animation
    }
```

### Continuous Looping (No Trigger)

When no trigger is provided, the animator cycles continuously.

```swift
enum PulsePhase: CaseIterable {
    case idle
    case expand
    case contract

    var scale: CGFloat {
        switch self {
        case .idle: 1.0
        case .expand: 1.15
        case .contract: 0.95
        }
    }

    var opacity: Double {
        switch self {
        case .idle: 0.8
        case .expand: 1.0
        case .contract: 0.6
        }
    }

    var animation: Animation {
        switch self {
        case .idle: .easeInOut(duration: 0.8)
        case .expand: .easeOut(duration: 0.4)
        case .contract: .easeIn(duration: 0.3)
        }
    }
}

struct PulsingIndicator: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        if reduceMotion {
            // Reduced motion: static with subtle opacity pulse
            Circle()
                .fill(.blue)
                .frame(width: 12, height: 12)
                .opacity(0.8)
        } else {
            Circle()
                .fill(.blue)
                .frame(width: 12, height: 12)
                .phaseAnimator(PulsePhase.allCases) { content, phase in
                    content
                        .scaleEffect(phase.scale)
                        .opacity(phase.opacity)
                } animation: { phase in
                    phase.animation
                }
        }
    }
}
```

### Trigger-Based (One-Shot)

When a trigger is provided, the animator cycles through all phases once when the trigger changes, then rests at the first phase.

```swift
enum SuccessPhase: CaseIterable {
    case initial
    case stamp      // Quick scale up
    case settle     // Scale back to normal
    case glow       // Brief brightness pulse
    case rest       // Return to baseline

    var scale: CGFloat {
        switch self {
        case .initial: 0.5
        case .stamp: 1.1
        case .settle: 1.0
        case .glow: 1.0
        case .rest: 1.0
        }
    }

    var opacity: Double {
        switch self {
        case .initial: 0.0
        case .stamp: 1.0
        case .settle: 1.0
        case .glow: 1.0
        case .rest: 0.85
        }
    }

    var brightness: Double {
        switch self {
        case .glow: 0.3
        default: 0.0
        }
    }
}

struct SuccessStamp: View {
    @State private var triggerCount = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Image(systemName: "checkmark.circle.fill")
            .font(.system(size: 64))
            .foregroundStyle(.green)
            .phaseAnimator(
                SuccessPhase.allCases,
                trigger: triggerCount
            ) { content, phase in
                content
                    .scaleEffect(reduceMotion ? 1.0 : phase.scale)
                    .opacity(phase.opacity)
                    .brightness(reduceMotion ? 0 : phase.brightness)
            } animation: { phase in
                switch phase {
                case .initial: .easeOut(duration: 0.01)
                case .stamp: .spring(response: 0.2, dampingFraction: 0.6)
                    // dampingFraction 0.6 = slight overshoot on stamp, then settle
                case .settle: .spring(response: 0.15, dampingFraction: 0.9)
                    // dampingFraction 0.9 = smooth controlled return
                case .glow: .easeOut(duration: 0.15)
                case .rest: .easeInOut(duration: 0.3)
                }
            }
            .sensoryFeedback(
                .impact(weight: .medium, intensity: 0.8),
                trigger: triggerCount
            )
    }

    func triggerSuccess() {
        triggerCount += 1
    }
}
```

### Complete Loading Indicator (3+ Phases)

```swift
enum LoadingPhase: CaseIterable {
    case rest
    case rotateRight
    case scaleUp
    case rotateLeft
    case scaleDown

    var rotation: Angle {
        switch self {
        case .rest: .zero
        case .rotateRight: .degrees(120)
        case .scaleUp: .degrees(120)
        case .rotateLeft: .degrees(240)
        case .scaleDown: .degrees(240)
        }
    }

    var scale: CGFloat {
        switch self {
        case .rest: 1.0
        case .rotateRight: 1.0
        case .scaleUp: 1.3
        case .rotateLeft: 1.3
        case .scaleDown: 1.0
        }
    }

    var opacity: Double {
        switch self {
        case .rest: 0.5
        case .rotateRight: 0.7
        case .scaleUp: 1.0
        case .rotateLeft: 0.7
        case .scaleDown: 0.5
        }
    }
}

struct BrandLoadingIndicator: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Group {
            if reduceMotion {
                // Reduced motion: simple opacity pulse
                Image(systemName: "circle.dotted")
                    .font(.title)
                    .foregroundStyle(.secondary)
                    .phaseAnimator([0.4, 0.8]) { content, opacity in
                        content.opacity(opacity)
                    } animation: { _ in
                        .easeInOut(duration: 1.0)
                    }
            } else {
                // Full animation: rotation + scale + opacity
                ZStack {
                    ForEach(0..<3, id: \.self) { index in
                        Circle()
                            .fill(Color(red: 0.35, green: 0.47, blue: 0.58))
                            // Brand accent #597794
                            .frame(width: 8, height: 8)
                            .offset(y: -16)
                            .phaseAnimator(LoadingPhase.allCases) { content, phase in
                                content
                                    .rotationEffect(phase.rotation + .degrees(Double(index) * 120))
                                    .scaleEffect(phase.scale)
                                    .opacity(phase.opacity)
                            } animation: { phase in
                                switch phase {
                                case .rest:
                                    .easeInOut(duration: 0.4)
                                case .rotateRight, .rotateLeft:
                                    .easeInOut(duration: 0.5)
                                case .scaleUp, .scaleDown:
                                    .spring(response: 0.3, dampingFraction: 0.8)
                                }
                            }
                    }
                }
                .frame(width: 48, height: 48)
            }
        }
    }
}
```

---

## 2. KeyframeAnimator (iOS 17+)

Animates properties along keyframe tracks. Unlike PhaseAnimator (which defines discrete states), KeyframeAnimator defines specific points in time and interpolates between them per property.

### Basic Structure

```swift
struct AnimationValues {
    var scale: CGFloat = 1.0
    var yOffset: CGFloat = 0
    var rotation: Angle = .zero
    var opacity: Double = 1.0
}

struct KeyframeExample: View {
    @State private var trigger = false

    var body: some View {
        Image(systemName: "star.fill")
            .font(.largeTitle)
            .keyframeAnimator(
                initialValue: AnimationValues(),
                trigger: trigger
            ) { content, value in
                content
                    .scaleEffect(value.scale)
                    .offset(y: value.yOffset)
                    .rotationEffect(value.rotation)
                    .opacity(value.opacity)
            } keyframes: { _ in
                KeyframeTrack(\.scale) {
                    SpringKeyframe(1.5, duration: 0.2, spring: .snappy)
                    SpringKeyframe(1.0, duration: 0.3, spring: .smooth)
                }

                KeyframeTrack(\.yOffset) {
                    LinearKeyframe(-20, duration: 0.15)
                    SpringKeyframe(0, duration: 0.4, spring: .bouncy)
                }

                KeyframeTrack(\.rotation) {
                    LinearKeyframe(.degrees(15), duration: 0.1)
                    LinearKeyframe(.degrees(-10), duration: 0.1)
                    SpringKeyframe(.zero, duration: 0.3, spring: .smooth)
                }
            }
    }
}
```

### Keyframe Types

```swift
// Linear interpolation between keyframes
LinearKeyframe(targetValue, duration: seconds)

// Spring interpolation — feels physical
SpringKeyframe(targetValue, duration: seconds, spring: .bouncy)
SpringKeyframe(targetValue, duration: seconds, spring: .init(
    mass: 1, stiffness: 200, damping: 15
))

// Cubic bezier interpolation
CubicKeyframe(targetValue, duration: seconds)
// Uses Catmull-Rom spline through sequential CubicKeyframes

// Move to value instantly (no interpolation)
MoveKeyframe(targetValue)
```

### Multi-Property Entry Animation

```swift
struct EntryAnimationValues {
    var yOffset: CGFloat = 30
    var opacity: Double = 0
    var scale: CGFloat = 0.9
    var blur: CGFloat = 4
}

struct AnimatedEntryCard: View {
    @State private var hasAppeared = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        CardContent()
            .keyframeAnimator(
                initialValue: EntryAnimationValues(),
                trigger: hasAppeared
            ) { content, value in
                content
                    .offset(y: reduceMotion ? 0 : value.yOffset)
                    .opacity(value.opacity)
                    .scaleEffect(reduceMotion ? 1.0 : value.scale)
                    .blur(radius: reduceMotion ? 0 : value.blur)
            } keyframes: { _ in
                KeyframeTrack(\.opacity) {
                    LinearKeyframe(1.0, duration: 0.3)
                }

                KeyframeTrack(\.yOffset) {
                    SpringKeyframe(0, duration: 0.5, spring: .init(
                        response: 0.4, dampingFraction: 0.85
                        // dampingFraction 0.85 = smooth arrival, no bounce
                    ))
                }

                KeyframeTrack(\.scale) {
                    SpringKeyframe(1.0, duration: 0.45, spring: .init(
                        response: 0.35, dampingFraction: 0.8
                        // Slightly faster than offset to create subtle offset between properties
                    ))
                }

                KeyframeTrack(\.blur) {
                    LinearKeyframe(0, duration: 0.25)
                }
            }
            .sensoryFeedback(
                .impact(flexibility: .solid, intensity: 0.6),
                trigger: hasAppeared
            )
            .onAppear {
                hasAppeared = true
            }
    }
}
```

### Staggered List Entry with KeyframeAnimator

```swift
struct StaggeredListValues {
    var xOffset: CGFloat = -20
    var opacity: Double = 0
}

struct StaggeredList: View {
    let items: [String]
    @State private var hasAppeared = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                Text(item)
                    .keyframeAnimator(
                        initialValue: StaggeredListValues(),
                        trigger: hasAppeared
                    ) { content, value in
                        content
                            .offset(x: reduceMotion ? 0 : value.xOffset)
                            .opacity(value.opacity)
                    } keyframes: { _ in
                        // Stagger delay: each item waits (index * 60ms) before animating
                        let delay = Double(index) * 0.06

                        KeyframeTrack(\.opacity) {
                            // Hold at 0 during delay
                            LinearKeyframe(0, duration: delay)
                            // Fade in
                            LinearKeyframe(1.0, duration: 0.25)
                        }

                        KeyframeTrack(\.xOffset) {
                            // Hold at offset during delay
                            LinearKeyframe(-20, duration: delay)
                            // Slide in with spring
                            SpringKeyframe(0, duration: 0.4, spring: .init(
                                response: 0.35, dampingFraction: 0.8
                            ))
                        }
                    }
            }
        }
        .onAppear {
            hasAppeared = true
        }
    }
}
```

---

## 3. State Transition Patterns

### Phase-Driven State Machine

Use PhaseAnimator with an explicit trigger to animate between app states.

```swift
enum FormState: Equatable {
    case idle
    case submitting
    case success
    case error(String)
}

enum SubmitPhase: CaseIterable {
    case compress   // Button shrinks to loading indicator
    case spin       // Loading spinner
    case expand     // Expand to result

    var width: CGFloat {
        switch self {
        case .compress: 48
        case .spin: 48
        case .expand: 280
        }
    }

    var cornerRadius: CGFloat {
        switch self {
        case .compress: 24
        case .spin: 24
        case .expand: 12
        }
    }
}

struct SubmitButton: View {
    @Binding var formState: FormState
    @State private var submitTrigger = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Group {
            switch formState {
            case .idle:
                Button("Submit") {
                    formState = .submitting
                    submitTrigger += 1
                }
                .buttonStyle(BrandButtonStyle())

            case .submitting:
                ProgressView()
                    .phaseAnimator(SubmitPhase.allCases, trigger: submitTrigger) { content, phase in
                        content
                            .frame(width: reduceMotion ? 48 : phase.width, height: 48)
                            .background(
                                RoundedRectangle(cornerRadius: reduceMotion ? 24 : phase.cornerRadius)
                                    .fill(Color(red: 0.35, green: 0.47, blue: 0.58))
                            )
                    } animation: { phase in
                        switch phase {
                        case .compress: .spring(response: 0.25, dampingFraction: 0.9)
                        case .spin: .linear(duration: 0.8)
                        case .expand: .spring(response: 0.3, dampingFraction: 0.85)
                        }
                    }

            case .success:
                Image(systemName: "checkmark")
                    .font(.title2.bold())
                    .foregroundStyle(.white)
                    .transition(.scale.combined(with: .opacity))

            case .error:
                Image(systemName: "xmark")
                    .font(.title2.bold())
                    .foregroundStyle(.red)
                    .transition(.scale.combined(with: .opacity))
            }
        }
        .animation(
            reduceMotion ? .easeInOut(duration: 0.2) : .spring(response: 0.35, dampingFraction: 0.8),
            value: formState
        )
        .sensoryFeedback(.success, trigger: formState) { _, newState in
            newState == .success
        }
        .sensoryFeedback(.error, trigger: formState) { _, newState in
            if case .error = newState { return true }
            return false
        }
    }
}
```

### Multi-Phase Entry Sequence

Combine PhaseAnimator with staggered delays for complex entry choreography.

```swift
enum EntryPhase: CaseIterable {
    case hidden
    case headerIn
    case bodyIn
    case actionsIn

    var headerOpacity: Double {
        switch self {
        case .hidden: 0
        default: 1
        }
    }

    var bodyOpacity: Double {
        switch self {
        case .hidden, .headerIn: 0
        default: 1
        }
    }

    var actionsOpacity: Double {
        switch self {
        case .hidden, .headerIn, .bodyIn: 0
        case .actionsIn: 1
        }
    }

    var headerOffset: CGFloat {
        switch self {
        case .hidden: -20
        default: 0
        }
    }

    var bodyOffset: CGFloat {
        switch self {
        case .hidden, .headerIn: 20
        default: 0
        }
    }

    var actionsOffset: CGFloat {
        switch self {
        case .actionsIn: 0
        default: 30
        }
    }
}

struct ChoreographedEntry: View {
    @State private var entryTrigger = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        PhaseAnimator(EntryPhase.allCases, trigger: entryTrigger) { phase in
            VStack(spacing: 16) {
                Text("TITLE")
                    .font(.headline)
                    .opacity(phase.headerOpacity)
                    .offset(y: reduceMotion ? 0 : phase.headerOffset)

                Text("Body content goes here with details about the item.")
                    .font(.body)
                    .opacity(phase.bodyOpacity)
                    .offset(y: reduceMotion ? 0 : phase.bodyOffset)

                HStack {
                    Button("Action 1") {}
                    Button("Action 2") {}
                }
                .opacity(phase.actionsOpacity)
                .offset(y: reduceMotion ? 0 : phase.actionsOffset)
            }
        } animation: { phase in
            switch phase {
            case .hidden: .easeOut(duration: 0.01)
            case .headerIn: .easeOut(duration: 0.25)
            case .bodyIn: .easeOut(duration: 0.3)
            case .actionsIn: .spring(response: 0.35, dampingFraction: 0.85)
            }
        }
        .onAppear {
            entryTrigger += 1
        }
        .sensoryFeedback(
            .impact(flexibility: .solid, intensity: 0.5),
            trigger: entryTrigger
        )
    }
}
```
