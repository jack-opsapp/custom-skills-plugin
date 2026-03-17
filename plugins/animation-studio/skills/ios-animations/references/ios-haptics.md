# iOS Haptics — Complete Reference

Every haptic API on iOS: UIFeedbackGenerator family, CHHapticEngine custom patterns, SwiftUI sensoryFeedback modifier. Includes the full pattern library, animation sync rules, battery considerations, and generator pre-warming.

---

## 1. UIFeedbackGenerator Family

Three generators, each for a different class of haptic feedback. Available on iPhone 7+ (all devices with Taptic Engine).

### UIImpactFeedbackGenerator

A single transient impact. The workhorse haptic.

```swift
// Create with a style
let generator = UIImpactFeedbackGenerator(style: .medium)

// Pre-warm the Taptic Engine (call 100-200ms before firing)
generator.prepare()

// Fire the haptic
generator.impactOccurred()

// Fire with custom intensity (0.0 to 1.0)
generator.impactOccurred(intensity: 0.7)
```

| Style | Feel | Use Case |
|-------|------|----------|
| `.light` | Gentle tap. Subtle, almost a whisper. | Entry arrivals, soft selections, hover feedback |
| `.medium` | Firm tap. Clearly felt. | Button presses, threshold crossings, commitments |
| `.heavy` | Strong thud. Commanding. | Significant actions, force confirmations, drag-drop landing |
| `.rigid` | Sharp click. Precise and mechanical. | Toggle switches, snap-to-grid, detent positions |
| `.soft` | Dull rumble. Rounded, low-frequency. | Ambient pulses, background events, gentle nudges |

### UISelectionFeedbackGenerator

Ultra-light tick designed for scrolling through selectable values. Lighter than `.light` impact.

```swift
let generator = UISelectionFeedbackGenerator()
generator.prepare()
generator.selectionChanged()
```

**Ideal for:** Picker wheels, segmented controls, slider detents, scrubbing through a timeline, scrolling through a date picker.

**Frequency:** Can fire rapidly (every 50-100ms) during continuous scrubbing without feeling spammy. But only fire on discrete value changes, not on every pixel of movement.

### UINotificationFeedbackGenerator

Semantic multi-impulse patterns that users recognize from system notifications.

```swift
let generator = UINotificationFeedbackGenerator()
generator.prepare()
generator.notificationOccurred(.success)
```

| Type | Pattern Feel | Use Case |
|------|-------------|----------|
| `.success` | Two rising taps — feels like a confirmation nod | Task completed, form submitted, sync finished |
| `.warning` | Three sharp taps — feels like an alert | Destructive action confirmation, limit approaching, caution |
| `.error` | Two heavy, abrupt taps — feels like rejection | Validation failure, network error, permission denied |

**Frequency:** Sparingly. These are the "big moment" haptics. If `.success` fires on every minor action, it loses semantic meaning.

---

## 2. CHHapticEngine — Custom Patterns

For haptic sequences that the standard generators cannot produce. Full control over timing, intensity, and sharpness curves.

### Setup

```swift
import CoreHaptics

class HapticPatternPlayer {
    private var engine: CHHapticEngine?

    init() {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }

        do {
            engine = try CHHapticEngine()

            // Handle engine reset (e.g., audio session interruption)
            engine?.resetHandler = { [weak self] in
                do {
                    try self?.engine?.start()
                } catch {
                    // Engine failed to restart — fall back to UIFeedbackGenerator
                    self?.engine = nil
                }
            }

            // Handle engine stop
            engine?.stoppedHandler = { [weak self] reason in
                switch reason {
                case .audioSessionInterrupt:
                    // Will restart via resetHandler
                    break
                case .applicationSuspended:
                    // Normal — engine pauses when app backgrounds
                    break
                case .idleTimeout:
                    // Engine stopped after period of inactivity
                    break
                case .notifyWhenFinished:
                    break
                case .engineDestroyed:
                    self?.engine = nil
                case .gameControllerDisconnect:
                    break
                case .systemError:
                    self?.engine = nil
                @unknown default:
                    break
                }
            }

            try engine?.start()
        } catch {
            engine = nil
        }
    }

    func play(pattern: CHHapticPattern) {
        do {
            let player = try engine?.makePlayer(with: pattern)
            try player?.start(atTime: CHHapticTimeImmediate)
        } catch {
            // Silent failure — haptic is an enhancement, not critical
        }
    }

    func stop() {
        engine?.stop(completionHandler: { _ in })
        engine = nil
    }
}
```

### Event Types

```swift
// Transient — a sharp, discrete impulse
CHHapticEvent(
    eventType: .hapticTransient,
    parameters: [
        CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.8),
        CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.6),
    ],
    relativeTime: 0.0  // When to fire (seconds from pattern start)
)

// Continuous — a sustained vibration
CHHapticEvent(
    eventType: .hapticContinuous,
    parameters: [
        CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.5),
        CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.3),
    ],
    relativeTime: 0.0,
    duration: 0.5  // How long the continuous vibration lasts
)
```

### Parameter Guide

| Parameter | Range | 0.0 | 0.5 | 1.0 |
|-----------|-------|-----|-----|-----|
| `.hapticIntensity` | 0.0 - 1.0 | Nothing | Moderate buzz | Maximum strength |
| `.hapticSharpness` | 0.0 - 1.0 | Dull, broad rumble | Balanced tap | Sharp, precise click |

**Sharpness tuning:**
- 0.0-0.2: Deep rumble, bass feel. Good for: ambient, weight, heaviness
- 0.3-0.5: Balanced, general purpose. Good for: standard interactions
- 0.6-0.8: Crisp, defined. Good for: precise actions, confirmations
- 0.9-1.0: Sharp click/tick. Good for: snaps, toggles, detents

### Dynamic Parameter Curves

Change intensity or sharpness over time within a continuous event.

```swift
// Intensity fades out over the duration of a continuous event
let fadeOut = CHHapticParameterCurve(
    parameterID: .hapticIntensityControl,
    controlPoints: [
        CHHapticParameterCurve.ControlPoint(relativeTime: 0.0, value: 1.0),
        CHHapticParameterCurve.ControlPoint(relativeTime: 0.5, value: 0.3),
    ],
    relativeTime: 0.0  // Curve starts at pattern time 0
)

// Sharpness sweeps from dull to sharp
let sharpen = CHHapticParameterCurve(
    parameterID: .hapticSharpnessControl,
    controlPoints: [
        CHHapticParameterCurve.ControlPoint(relativeTime: 0.0, value: 0.2),
        CHHapticParameterCurve.ControlPoint(relativeTime: 0.3, value: 0.9),
    ],
    relativeTime: 0.0
)

let pattern = try CHHapticPattern(
    events: [continuousEvent],
    parameterCurves: [fadeOut, sharpen]
)
```

---

## 3. Complete Haptic Pattern Library

### Entry Pattern

Light impact at element landing.

```swift
func entryPattern() throws -> CHHapticPattern {
    let tap = CHHapticEvent(
        eventType: .hapticTransient,
        parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.6),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.5),
        ],
        relativeTime: 0.0
    )
    return try CHHapticPattern(events: [tap], parameters: [])
}
```

### Selection Pattern

Ultra-light tick for value changes.

```swift
func selectionPattern() throws -> CHHapticPattern {
    let tick = CHHapticEvent(
        eventType: .hapticTransient,
        parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.3),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.9),
            // High sharpness, low intensity = precise "tick"
        ],
        relativeTime: 0.0
    )
    return try CHHapticPattern(events: [tick], parameters: [])
}
```

### Commit Pattern

Two-beat: medium impact → success confirmation 200ms later.

```swift
func commitPattern() throws -> CHHapticPattern {
    let impact = CHHapticEvent(
        eventType: .hapticTransient,
        parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.8),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.6),
        ],
        relativeTime: 0.0
    )

    let confirm = CHHapticEvent(
        eventType: .hapticTransient,
        parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.5),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.7),
        ],
        relativeTime: 0.2  // 200ms after first beat
    )

    return try CHHapticPattern(events: [impact, confirm], parameters: [])
}
```

### Achievement Crescendo

Three rapid transients building in intensity, followed by soft sustained buzz.

```swift
func achievementPattern() throws -> CHHapticPattern {
    let tap1 = CHHapticEvent(
        eventType: .hapticTransient,
        parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.4),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.5),
        ],
        relativeTime: 0.0
    )

    let tap2 = CHHapticEvent(
        eventType: .hapticTransient,
        parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.6),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.6),
        ],
        relativeTime: 0.08
    )

    let tap3 = CHHapticEvent(
        eventType: .hapticTransient,
        parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.9),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.8),
        ],
        relativeTime: 0.16
    )

    let buzz = CHHapticEvent(
        eventType: .hapticContinuous,
        parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.3),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.2),
        ],
        relativeTime: 0.25,
        duration: 0.2
    )

    return try CHHapticPattern(events: [tap1, tap2, tap3, buzz], parameters: [])
}
```

### Error Pattern

Sharp double-tap with descending intensity.

```swift
func errorPattern() throws -> CHHapticPattern {
    let hit1 = CHHapticEvent(
        eventType: .hapticTransient,
        parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.9),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.8),
        ],
        relativeTime: 0.0
    )

    let hit2 = CHHapticEvent(
        eventType: .hapticTransient,
        parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.7),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.6),
        ],
        relativeTime: 0.12
    )

    return try CHHapticPattern(events: [hit1, hit2], parameters: [])
}
```

### Ambient Pulse

Extremely subtle, single soft event. Use sparingly (max 1 per 2 seconds).

```swift
func ambientPulsePattern() throws -> CHHapticPattern {
    let pulse = CHHapticEvent(
        eventType: .hapticContinuous,
        parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.2),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.1),
            // Very low intensity + very low sharpness = barely perceptible rumble
        ],
        relativeTime: 0.0,
        duration: 0.15
    )

    return try CHHapticPattern(events: [pulse], parameters: [])
}
```

---

## 4. sensoryFeedback Modifier (iOS 17+)

Declarative haptic pairing in SwiftUI. Fires when the trigger value changes.

### All Available Types

```swift
// Impacts with weight
.sensoryFeedback(.impact(weight: .light, intensity: 0.6), trigger: state)
.sensoryFeedback(.impact(weight: .medium, intensity: 0.8), trigger: state)
.sensoryFeedback(.impact(weight: .heavy, intensity: 1.0), trigger: state)

// Impacts with flexibility
.sensoryFeedback(.impact(flexibility: .rigid, intensity: 0.7), trigger: state)
.sensoryFeedback(.impact(flexibility: .solid, intensity: 0.6), trigger: state)
.sensoryFeedback(.impact(flexibility: .soft, intensity: 0.4), trigger: state)

// Semantic feedback
.sensoryFeedback(.selection, trigger: state)    // Ultra-light tick
.sensoryFeedback(.success, trigger: state)      // Rising confirmation
.sensoryFeedback(.warning, trigger: state)      // Alert pattern
.sensoryFeedback(.error, trigger: state)        // Rejection pattern
.sensoryFeedback(.increase, trigger: state)     // Value going up
.sensoryFeedback(.decrease, trigger: state)     // Value going down
.sensoryFeedback(.start, trigger: state)        // Activity beginning
.sensoryFeedback(.stop, trigger: state)         // Activity ending
.sensoryFeedback(.alignment, trigger: state)    // Snap/align
.sensoryFeedback(.levelChange, trigger: state)  // Discrete level step
```

### Conditional Firing

```swift
// Fire only when condition is met
.sensoryFeedback(.success, trigger: score) { oldScore, newScore in
    newScore >= 100 && oldScore < 100
    // Only fire when crossing the 100 threshold for the first time
}

// Fire different haptic based on direction
.sensoryFeedback(.increase, trigger: value) { old, new in
    new > old  // Only fire on increase
}
```

### When to Use sensoryFeedback vs UIFeedbackGenerator

| Scenario | Use sensoryFeedback | Use UIFeedbackGenerator |
|----------|-------------------|------------------------|
| Haptic tied to SwiftUI state change | Yes | No |
| Haptic needs precise timing (mid-animation) | No | Yes |
| Simple trigger on value change | Yes | Overkill |
| Custom CHHapticEngine pattern | No | Yes (use CHHapticEngine) |
| Haptic during Core Animation sequence | No | Yes |
| Haptic during gesture (not state change) | No | Yes |

---

## 5. Haptic-Animation Sync

### The Peak Visual Change Rule

The haptic fires at the **moment of peak visual change**. This is the frame where the largest visual shift occurs.

| Animation Type | Peak Visual Change Moment | Timing Formula |
|---------------|--------------------------|----------------|
| Spring entry | Element reaches target (first zero-crossing of velocity) | ~`response * 0.5` seconds |
| Ease-out entry | Element reaches final position | At animation end |
| Bounce (low damping) | Bottom of first bounce | ~`response * 0.4` seconds |
| Scale stamp | Maximum scale reached | At max scale keyframe |
| Shake | First direction reversal | ~`duration * 0.1` seconds |
| Swipe dismiss | Card crosses commit threshold | At threshold distance |
| Toggle flip | Toggle reaches opposite state | At midpoint |

### Sync Implementation Patterns

**Pattern 1: sensoryFeedback with arrival state**

```swift
@State private var hasLanded = false

CardView()
    .offset(y: isVisible ? 0 : 50)
    .sensoryFeedback(.impact(flexibility: .solid, intensity: 0.6), trigger: hasLanded)
    .onAppear {
        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
            isVisible = true
        }
        // Approximate spring landing time
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            hasLanded = true
        }
    }
```

**Pattern 2: DispatchQueue for mid-animation haptic**

```swift
func animateTransition() {
    withAnimation(.easeInOut(duration: 0.4)) {
        showNextPage = true
    }
    // Haptic at midpoint (maximum velocity)
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred(intensity: 0.4)
    }
}
```

**Pattern 3: CADisplayLink for frame-precise haptic**

```swift
// For Core Animation sequences where DispatchQueue timing is too imprecise
class HapticTimingCoordinator {
    private var displayLink: CADisplayLink?
    private var startTime: CFTimeInterval = 0
    private let targetTime: CFTimeInterval
    private let generator: UIImpactFeedbackGenerator

    init(fireAt targetTime: CFTimeInterval, style: UIImpactFeedbackGenerator.FeedbackStyle) {
        self.targetTime = targetTime
        self.generator = UIImpactFeedbackGenerator(style: style)
        generator.prepare()
    }

    func start() {
        startTime = CACurrentMediaTime()
        displayLink = CADisplayLink(target: self, selector: #selector(tick))
        displayLink?.add(to: .main, forMode: .common)
    }

    @objc private func tick(_ link: CADisplayLink) {
        let elapsed = link.timestamp - startTime
        if elapsed >= targetTime {
            generator.impactOccurred()
            displayLink?.invalidate()
            displayLink = nil
        }
    }
}
```

---

## 6. Generator Pre-warming

The Taptic Engine has ~50ms spin-up latency from cold. Pre-warming eliminates this.

```swift
// Pre-warm pattern: call prepare() when the user starts an interaction
// that will likely need haptic feedback

// On drag start:
.gesture(DragGesture()
    .onChanged { _ in
        hapticGenerator.prepare()  // Pre-warm on first touch
    }
    .onEnded { _ in
        hapticGenerator.impactOccurred()  // Zero-latency fire
    }
)

// On button touch-down (not tap — touch-down is earlier):
Button { } label: { Text("Submit") }
    .simultaneousGesture(
        DragGesture(minimumDistance: 0)
            .onChanged { _ in
                hapticGenerator.prepare()
            }
    )
```

### Pre-warm Lifetime

`.prepare()` keeps the engine spinning for ~1-2 seconds. If the interaction takes longer, call `.prepare()` again. The engine auto-idles to save battery.

### Shared Generator Pattern

```swift
@Observable
final class HapticManager {
    static let shared = HapticManager()

    private let lightImpact = UIImpactFeedbackGenerator(style: .light)
    private let mediumImpact = UIImpactFeedbackGenerator(style: .medium)
    private let heavyImpact = UIImpactFeedbackGenerator(style: .heavy)
    private let rigidImpact = UIImpactFeedbackGenerator(style: .rigid)
    private let selection = UISelectionFeedbackGenerator()
    private let notification = UINotificationFeedbackGenerator()

    private init() {}

    /// Call when user begins an interaction that will need haptic
    func prepare() {
        lightImpact.prepare()
        mediumImpact.prepare()
        selection.prepare()
        notification.prepare()
    }

    func light(intensity: CGFloat = 1.0) {
        lightImpact.impactOccurred(intensity: intensity)
    }

    func medium(intensity: CGFloat = 1.0) {
        mediumImpact.impactOccurred(intensity: intensity)
    }

    func heavy(intensity: CGFloat = 1.0) {
        heavyImpact.impactOccurred(intensity: intensity)
    }

    func rigid(intensity: CGFloat = 1.0) {
        rigidImpact.impactOccurred(intensity: intensity)
    }

    func select() {
        selection.selectionChanged()
    }

    func notify(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        notification.notificationOccurred(type)
    }
}
```

---

## 7. Battery Considerations

### Taptic Engine Power Draw

The Taptic Engine consumes measurable power. A single transient haptic is negligible, but patterns and frequency matter.

| Usage | Battery Impact | Guideline |
|-------|---------------|-----------|
| Single transient per user action | Negligible | Always appropriate |
| Notification haptic on completion | Negligible | Always appropriate |
| Selection ticks during scrub | Low | Appropriate — fire on value change only |
| Custom CHHapticEngine pattern | Low-moderate | Appropriate for significant moments |
| Continuous haptic during drag | Moderate | Limit to meaningful drags (not passive scrolling) |
| Repeating ambient haptics | High over time | Avoid — max 1 per 2 seconds |
| Haptic on every scroll frame | Unacceptable | Never |

### Rules

1. **Never fire haptics from continuous animation loops** (TimelineView, CADisplayLink, requestAnimationFrame). Haptics are for discrete events, not continuous rendering.

2. **Rate-limit ambient haptics** to maximum once per 2 seconds.

3. **Check thermal state** before intensive haptic sequences:

```swift
if ProcessInfo.processInfo.thermalState == .serious
    || ProcessInfo.processInfo.thermalState == .critical {
    // Skip non-essential haptics to reduce thermal load
    return
}
```

4. **CHHapticEngine auto-stops** when the app backgrounds. Do not attempt to keep it running. Restart in `resetHandler` or on `scenePhase` change to `.active`.

---

## 8. Device Capability Check

```swift
// All iPhones since iPhone 7 support UIFeedbackGenerator
// UIFeedbackGenerator silently no-ops on unsupported devices (no crash)

// CHHapticEngine requires iPhone 8 or later
let supportsCustomHaptics = CHHapticEngine.capabilitiesForHardware().supportsHaptics

// iPads: some models support haptics (iPad Pro with M-chip), most do not
// iPod touch: no haptic support
// Simulator: no haptic hardware (calls succeed but produce nothing)

// Safe pattern: always try, never crash
func playHaptic() {
    guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else {
        // Fallback to UIFeedbackGenerator (which silently no-ops on unsupported)
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        return
    }
    // Use CHHapticEngine for custom pattern
}
```
