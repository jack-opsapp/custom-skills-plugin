# Haptic Principles — Cross-Platform Reference

Haptic feedback is not decoration. It is a sensory channel that, when paired correctly with visual animation, creates a visceral sense of physicality that visuals alone cannot achieve. A well-timed haptic makes a digital interaction feel real. A poorly timed haptic makes it feel broken.

This document covers the theory, the platform APIs, the pairing rules, and the anti-patterns.

---

## Core Theory: When to Pair Haptics

### The Peak Visual Change Rule

A haptic fires at the **moment of peak visual change** — the instant where the most dramatic visual shift occurs within an animation. This is the moment the eye perceives "something happened." The haptic reinforces that perception through touch.

**Examples of peak visual change:**
- A bouncing element hits its lowest point (maximum compression)
- A snapping element reaches its target position
- A scaling element reaches full extension or full contraction
- A swiped card crosses the threshold and commits to dismissal
- A toggle flips from one state to the other
- A drawer reaches its fully open or fully closed position

**NOT peak visual change:**
- The start of an ease-out animation (the element has barely moved)
- The end of a slow fade (the change is imperceptible at that point)
- Any arbitrary point in a linear animation (no peak exists — reconsider the animation)

### One Haptic Per Beat

Each animation beat (entry, selection, confirmation, etc.) gets exactly ONE haptic event. Not zero (incomplete), not two (confusing). One.

The exception: **achievement celebrations** may use a rapid sequence of haptics (a crescendo pattern) because the beat itself is multi-phase — building to a peak. But even here, the sequence is experienced as one continuous haptic moment, not discrete separate events.

### Haptics Are Earned

A haptic must be paired with a meaningful interaction — one that the user initiated or one that communicates important state change. Not every animation deserves haptic feedback.

**Haptic-worthy:**
- User taps a button → confirmation haptic
- User drags an item past a threshold → commit haptic
- System completes a task the user is waiting for → achievement haptic
- Navigation transition triggered by user → transition haptic
- Item snaps to grid position → snap haptic

**NOT haptic-worthy:**
- Ambient background animation → no user action, no haptic
- Loading spinner → no meaningful state change yet
- Auto-scrolling content → not user-initiated
- Skeleton loading shimmer → no interaction
- Cursor-following effect → continuous, not discrete

---

## Haptic Vocabulary

Three fundamental haptic types exist across platforms:

### Transient

A sharp, discrete impulse. Like tapping a physical surface.

- **Feel:** Instantaneous. A single "tick" or "thud."
- **Duration:** Effectively zero (the hardware produces a single impulse).
- **Use for:** Taps, snaps, landings, selections, discrete state changes.
- **iOS:** `UIImpactFeedbackGenerator` (.light / .medium / .heavy / .rigid / .soft)
- **Web:** `navigator.vibrate(10)` (10ms burst)

### Continuous

A sustained vibration or texture. Like dragging a finger across a textured surface.

- **Feel:** Ongoing. The user feels it for as long as the interaction continues.
- **Duration:** Variable — matches the duration of the interaction.
- **Use for:** Drags, scrubs, slides, long-press hold, scrolling through detents.
- **iOS:** `CHHapticEngine` with continuous event type, or `UISelectionFeedbackGenerator` fired repeatedly on value change.
- **Web:** `navigator.vibrate([duration])` — limited control, essentially on/off.

### Notification

A semantic, multi-part haptic pattern with built-in meaning. The user's device has trained them to associate these patterns with success, warning, or error.

- **Feel:** Distinct multi-impulse pattern. Each type has a unique signature.
- **Duration:** ~200-400ms total (system-defined).
- **Use for:** Task completion (success), validation failure (error), caution states (warning).
- **iOS:** `UINotificationFeedbackGenerator` (.success / .warning / .error)
- **Web:** Approximate with patterns — `navigator.vibrate([30, 50, 30])` for success-like.

---

## Emotional Beat to Haptic Mapping

Each emotional beat category (from SKILL.md §3) has a specific haptic prescription.

### Entry / Arrival

**Visual:** Element appears with crisp ease-out, lands at final position.
**Haptic:** Light transient at the moment the element reaches its destination.

| Platform | API | Parameters |
|----------|-----|-----------|
| iOS | `UIImpactFeedbackGenerator(style: .light)` | `.impactOccurred(intensity: 0.6)` |
| iOS (SwiftUI) | `.sensoryFeedback(.impact(flexibility: .solid, intensity: 0.6), trigger: hasAppeared)` | Fires when `hasAppeared` changes |
| Web | `navigator.vibrate(10)` | 10ms single burst |

**Timing:** Fire at the exact frame the element reaches its final position — not at animation start, not during the ease-out curve. At the landing.

### Discovery / Selection

**Visual:** Element responds to hover/tap with immediate feedback (scale, highlight, color shift).
**Haptic:** Selection tick — the lightest possible haptic. Encourages continued exploration.

| Platform | API | Parameters |
|----------|-----|-----------|
| iOS | `UISelectionFeedbackGenerator()` | `.selectionChanged()` |
| iOS (SwiftUI) | `.sensoryFeedback(.selection, trigger: selectedItem)` | Fires on selection change |
| Web | No equivalent | Rely on visual feedback speed (< 100ms response) |

**Timing:** Immediately on the interaction event (tap/hover), not after animation completes. The haptic IS the first response — the visual animation follows.

### Commitment / Confirm

**Visual:** Element animates with weight — deliberate deceleration, possibly a brief hold before resolution.
**Haptic:** Two-beat pattern: medium impact at the moment of commitment, success notification 200ms later.

| Platform | API | Parameters |
|----------|-----|-----------|
| iOS (beat 1) | `UIImpactFeedbackGenerator(style: .medium)` | `.impactOccurred(intensity: 0.8)` |
| iOS (beat 2) | `UINotificationFeedbackGenerator()` | `.notificationOccurred(.success)` — fire 200ms after beat 1 |
| iOS (SwiftUI) | `.sensoryFeedback(.impact(weight: .medium, intensity: 0.8), trigger: commitAction)` | For beat 1; schedule beat 2 via `.task` delay |
| Web | `navigator.vibrate([20, 150, 30])` | 20ms pulse, 150ms pause, 30ms confirmation pulse |

**Timing:** Beat 1 fires at the moment the user's action is accepted (button press registers, swipe crosses threshold, toggle commits). Beat 2 fires 200ms later as confirmation that the system has processed the action.

### Achievement

**Visual:** Restrained celebration — a stamp, a pulse, a brief flash of acknowledgment.
**Haptic:** Custom crescendo — three rapid transients building in intensity, followed by a soft sustained buzz.

| Platform | API | Parameters |
|----------|-----|-----------|
| iOS | `CHHapticEngine` | Custom pattern (see implementation below) |
| Web | `navigator.vibrate([10, 30, 15, 25, 25])` | Approximation: three pulses with pauses |

**iOS CHHapticEngine crescendo pattern:**

```swift
func playAchievementHaptic() {
    guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }

    do {
        let engine = try CHHapticEngine()
        try engine.start()

        // Three transients building in intensity
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

        // Soft sustained buzz after peak
        let buzz = CHHapticEvent(
            eventType: .hapticContinuous,
            parameters: [
                CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.3),
                CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.2),
            ],
            relativeTime: 0.25,
            duration: 0.2
        )

        let pattern = try CHHapticPattern(events: [tap1, tap2, tap3, buzz], parameters: [])
        let player = try engine.makePlayer(with: pattern)
        try player.start(atTime: CHHapticTimeImmediate)
    } catch {
        // Haptic engine unavailable — degrade silently
    }
}
```

**Timing:** The first transient fires at the peak visual moment (the stamp lands, the checkmark appears, the element reaches full scale). The subsequent taps and buzz follow automatically from the CHHapticPattern timing.

### Transition

**Visual:** View moves between states — slide, scale, morph.
**Haptic:** Light impact at the midpoint of the transition — the moment of maximum velocity.

| Platform | API | Parameters |
|----------|-----|-----------|
| iOS | `UIImpactFeedbackGenerator(style: .light)` | `.impactOccurred(intensity: 0.4)` |
| iOS (SwiftUI) | `.sensoryFeedback(.impact(flexibility: .soft, intensity: 0.4), trigger: transitionPhase)` | Fire at midpoint |
| Web | `navigator.vibrate(8)` | 8ms subtle pulse |

**Timing:** At the midpoint of the transition duration. For a 300ms transition, fire at ~150ms. This is where the element is moving fastest — the haptic reinforces the sensation of motion.

**Note:** Not all transitions warrant haptics. A tab switch crossfade does not need one. A full-screen navigation push with shared elements does. The threshold: does the transition involve spatial movement that the user could perceive as physical? If yes, haptic. If it is purely opacity/color, no haptic.

### Ambient

**Visual:** Slow, continuous background animation — gradient shifts, gentle particle drift, breathing effects.
**Haptic:** Almost never. If used at all, extremely subtle and rate-limited.

| Platform | API | Parameters |
|----------|-----|-----------|
| iOS | `UIImpactFeedbackGenerator(style: .soft)` | `.impactOccurred(intensity: 0.3)` — max once every 2 seconds |
| Web | Skip entirely | Ambient haptics on web are never appropriate |

**Timing:** If paired at all, fire at a natural "pulse" point in the ambient cycle — the moment a gradient reaches its brightest, a particle field reaches maximum density, or a breathing animation reaches full expansion. Maximum frequency: once every 2000ms. Any faster and it becomes haptic noise.

**Recommendation:** Default to no haptic for ambient animations. Only add one if the ambient effect has a strong enough visual pulse that a paired haptic would enhance the atmosphere without demanding attention.

---

## iOS Haptic APIs — Detailed Reference

### UIImpactFeedbackGenerator

The workhorse haptic. Produces a single transient impact.

```swift
// Basic usage
let generator = UIImpactFeedbackGenerator(style: .medium)
generator.prepare() // Call before the moment you need it — pre-spins the Taptic Engine
generator.impactOccurred()

// With intensity control (0.0 to 1.0)
generator.impactOccurred(intensity: 0.7)
```

**Styles:**

| Style | Feel | Use Case |
|-------|------|----------|
| `.light` | Gentle tap | Entry arrivals, soft selections, subtle confirmations |
| `.medium` | Firm tap | Button presses, commitments, threshold crossings |
| `.heavy` | Strong thud | Significant actions, drag-and-drop landing, force touch |
| `.rigid` | Sharp click | Precise snaps, toggle switches, detent positions |
| `.soft` | Dull thud | Ambient pulses, gentle nudges, background events |

**Performance note:** Call `.prepare()` 100-200ms before you expect to fire the haptic. This pre-spins the Taptic Engine motor, eliminating the ~50ms startup latency that would otherwise delay the haptic relative to the visual.

### UISelectionFeedbackGenerator

A single, ultra-light tick designed for selection changes. Lighter than `.light` impact.

```swift
let generator = UISelectionFeedbackGenerator()
generator.prepare()
generator.selectionChanged()
```

**Use for:** Scrolling through picker values, hovering over selectable items, stepping through a segmented control, scrubbing a slider through detent positions.

**Frequency:** Can fire rapidly (every 50-100ms during scrub) without feeling spammy — it is designed for this. But the triggering event must be discrete value changes, not continuous motion.

### UINotificationFeedbackGenerator

Semantic haptics with built-in patterns that users recognize from system notifications.

```swift
let generator = UINotificationFeedbackGenerator()
generator.prepare()
generator.notificationOccurred(.success)
```

| Type | Pattern | Use Case |
|------|---------|----------|
| `.success` | Two rising taps | Task completed, form submitted, action confirmed |
| `.warning` | Three sharp taps | Destructive action confirmation, limit approaching |
| `.error` | Two heavy taps | Validation failure, network error, action rejected |

**Frequency:** Sparingly. These are the "big" haptics. If success fires on every minor action, it loses its meaning. Reserve for genuinely significant moments.

### CHHapticEngine — Custom Patterns

For haptic sequences that the standard generators cannot produce. Full control over timing, intensity, and sharpness curves.

```swift
import CoreHaptics

// Check hardware support
guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }

// Create and start engine
let engine = try CHHapticEngine()
engine.resetHandler = { [weak self] in
    try? self?.engine?.start()
}
engine.stoppedHandler = { reason in
    // Handle engine stop (audio session interruption, etc.)
}
try engine.start()

// Build a pattern
let events: [CHHapticEvent] = [
    // Transient events — discrete impulses
    CHHapticEvent(
        eventType: .hapticTransient,
        parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.8),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.6),
        ],
        relativeTime: 0.0
    ),
    // Continuous events — sustained vibration
    CHHapticEvent(
        eventType: .hapticContinuous,
        parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.5),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.3),
        ],
        relativeTime: 0.1,
        duration: 0.3
    ),
]

// Dynamic parameter curves — change intensity/sharpness over time
let intensityCurve = CHHapticParameterCurve(
    parameterID: .hapticIntensityControl,
    controlPoints: [
        CHHapticParameterCurve.ControlPoint(relativeTime: 0.0, value: 1.0),
        CHHapticParameterCurve.ControlPoint(relativeTime: 0.3, value: 0.2),
    ],
    relativeTime: 0.1
)

let pattern = try CHHapticPattern(events: events, parameterCurves: [intensityCurve])
let player = try engine.makePlayer(with: pattern)
try player.start(atTime: CHHapticTimeImmediate)
```

**Key parameters:**

| Parameter | Range | What It Controls |
|-----------|-------|-----------------|
| `.hapticIntensity` | 0.0 - 1.0 | Strength of the vibration. 0 = nothing, 1 = maximum. |
| `.hapticSharpness` | 0.0 - 1.0 | Character of the vibration. 0 = dull/broad, 1 = sharp/precise. |

**Sharpness guide:**
- 0.0-0.3: Soft, dull, rumble-like. Good for bass, weight, ambient.
- 0.4-0.6: Balanced. Good for general interaction, medium taps.
- 0.7-1.0: Sharp, precise, click-like. Good for snaps, detents, precise selections.

### sensoryFeedback Modifier (SwiftUI, iOS 17+)

The declarative way to pair haptics with animations in SwiftUI. Fires a haptic when a trigger value changes.

```swift
// Simple impact
Button("Submit") {
    isSubmitted = true
}
.sensoryFeedback(.impact(weight: .medium, intensity: 0.8), trigger: isSubmitted)

// Selection tick
Picker("Option", selection: $selected) { ... }
.sensoryFeedback(.selection, trigger: selected)

// Success notification
.sensoryFeedback(.success, trigger: taskCompleted)

// Available feedback types:
// .impact(weight:intensity:) — configurable impact
// .impact(flexibility:intensity:) — alternative impact config
// .selection — selection tick
// .success — success notification
// .warning — warning notification
// .error — error notification
// .increase — value increased
// .decrease — value decreased
// .start — activity started
// .stop — activity stopped
// .alignment — item aligned/snapped
// .levelChange — discrete level changed
```

**When to use `.sensoryFeedback` vs UIImpactFeedbackGenerator:**
- Use `.sensoryFeedback` when the haptic is directly tied to a SwiftUI state change — it is cleaner, declarative, and automatically handles the trigger lifecycle.
- Use `UIImpactFeedbackGenerator` (or `CHHapticEngine`) when you need precise timing control independent of SwiftUI state — e.g., firing at the midpoint of a Core Animation sequence, or building a custom pattern.

---

## Web Haptic APIs

### navigator.vibrate()

The only haptic API available on the web. Limited but useful where supported.

```typescript
// Feature detection — mandatory
if (!("vibrate" in navigator)) {
  // No haptic support. Degrade gracefully — visual-only.
  return;
}

// Single vibration (duration in milliseconds)
navigator.vibrate(15); // 15ms impulse

// Pattern: [vibrate, pause, vibrate, pause, ...]
navigator.vibrate([20, 100, 20]); // tap, 100ms pause, tap
navigator.vibrate([10, 30, 15, 25, 25]); // achievement-like crescendo

// Stop vibration
navigator.vibrate(0);
// or
navigator.vibrate([]);
```

**Browser support:**
| Browser | Support |
|---------|---------|
| Chrome (Android) | Full support |
| Edge (Android) | Full support |
| Firefox (Android) | Full support |
| Samsung Internet | Full support |
| Safari (iOS) | **Not supported** — no vibration API on iOS Safari |
| Chrome (iOS) | **Not supported** — all iOS browsers use WebKit |
| Safari (macOS) | Not applicable |
| Chrome (desktop) | Not applicable |

**The honest truth about web haptics:** On iOS — which is a primary target for many web apps — `navigator.vibrate()` does not work at all. iOS Safari does not expose the Taptic Engine to web content. This means web haptics are Android-only. Design your web animations to be complete without haptics. Where haptics are available, they are a bonus enhancement.

### Web Haptic Patterns for Common Beats

```typescript
// Utility: safe vibrate with feature detection
function haptic(pattern: number | number[]): void {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

// Entry/arrival — light tap
function hapticEntry(): void {
  haptic(10);
}

// Commitment/confirm — double tap
function hapticConfirm(): void {
  haptic([20, 150, 30]);
}

// Achievement — building crescendo
function hapticAchievement(): void {
  haptic([10, 30, 15, 25, 25]);
}

// Error — sharp double
function hapticError(): void {
  haptic([50, 50, 50]);
}

// Transition — subtle
function hapticTransition(): void {
  haptic(8);
}
```

---

## Anti-Patterns

### 1. Haptic Spam — Firing on Every Scroll Tick

**Wrong:**
```swift
// WRONG: Fires 60-120 times per second during scroll
ScrollView {
    content
}
.onScrollGeometryChange(for: CGFloat.self) { proxy in
    proxy.contentOffset.y
} action: { _, newValue in
    UIImpactFeedbackGenerator(style: .light).impactOccurred() // HAPTIC SPAM
}
```

**Right:**
```swift
// RIGHT: Fire only at discrete detent points
.onScrollGeometryChange(for: Int.self) { proxy in
    Int(proxy.contentOffset.y / detentHeight) // Discretize to detent positions
} action: { oldValue, newValue in
    if oldValue != newValue {
        UISelectionFeedbackGenerator().selectionChanged() // One tick per detent
    }
}
```

### 2. Haptic on Ambient/Background Animations

**Wrong:**
```swift
// WRONG: Background gradient shift gets haptic
TimelineView(.animation) { timeline in
    MeshGradient(/* animating */)
}
.sensoryFeedback(.impact, trigger: animationPhase) // Fires continuously — NO
```

**Right:**
```swift
// RIGHT: No haptic on ambient animation
TimelineView(.animation) { timeline in
    MeshGradient(/* animating */)
}
// No .sensoryFeedback — ambient animations don't earn haptics
```

### 3. Same Haptic for Every Interaction

**Wrong:**
```swift
// WRONG: Every single interaction gets the same medium impact
Button("Save") { save() }
    .sensoryFeedback(.impact, trigger: saveAction) // Same as...
Button("Cancel") { cancel() }
    .sensoryFeedback(.impact, trigger: cancelAction) // Same as...
Toggle(isOn: $setting) { Text("Notifications") }
    .sensoryFeedback(.impact, trigger: setting) // Same as everything else
```

When every interaction produces the same haptic, the user's brain stops registering it. The haptic becomes noise — present but meaningless.

**Right:**
```swift
// RIGHT: Each interaction gets a contextually appropriate haptic
Button("Save") { save() }
    .sensoryFeedback(.success, trigger: saveAction) // Semantic: success
Button("Cancel") { cancel() }
    // No haptic — cancel is not a positive action worth celebrating
Toggle(isOn: $setting) { Text("Notifications") }
    .sensoryFeedback(.selection, trigger: setting) // Selection tick — lightweight
```

### 4. Haptic Without Corresponding Visual Change

**Wrong:**
```swift
// WRONG: Haptic fires but nothing visually changes at that moment
func loadData() {
    UIImpactFeedbackGenerator(style: .medium).impactOccurred() // User feels THUD
    // ...loading starts, but no visual change yet — confusing
    Task {
        let data = await fetchData()
        // Visual update happens here, seconds later
    }
}
```

**Right:**
```swift
// RIGHT: Haptic fires at the moment of visual change
func loadData() {
    Task {
        let data = await fetchData()
        withAnimation(.spring()) {
            items = data // Visual change happens NOW
        }
        UINotificationFeedbackGenerator().notificationOccurred(.success) // Haptic at visual moment
    }
}
```

### 5. Haptic During Animation Start (Not Peak)

**Wrong:**
```swift
// WRONG: Haptic fires at animation START — element hasn't moved yet
func showCard() {
    UIImpactFeedbackGenerator(style: .medium).impactOccurred() // Too early
    withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
        isVisible = true // Card starts animating toward final position
    }
}
```

**Right:**
```swift
// RIGHT: Haptic fires when the card LANDS at its final position
func showCard() {
    withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
        isVisible = true
    }
    // Fire haptic at approximately the moment the spring reaches target
    // For spring(response: 0.4), the element reaches ~95% at response * 1.5 ≈ 0.6s
    // but the peak velocity (most dramatic visual change) is at ~0.15-0.2s
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred(intensity: 0.6)
    }
}
```

**Even better — use sensoryFeedback with a state that represents arrival:**
```swift
@State private var hasLanded = false

CardView()
    .opacity(isVisible ? 1 : 0)
    .offset(y: isVisible ? 0 : 50)
    .sensoryFeedback(.impact(flexibility: .solid, intensity: 0.6), trigger: hasLanded)
    .onAppear {
        withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
            isVisible = true
        }
        // Approximate landing time
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            hasLanded = true
        }
    }
```

### 6. Continuous Haptic During Drag Without Detents

**Wrong:**
```swift
// WRONG: Continuous haptic during free-form drag — annoying
.gesture(
    DragGesture()
        .onChanged { value in
            offset = value.translation
            UIImpactFeedbackGenerator(style: .light).impactOccurred() // 60+ times/sec
        }
)
```

**Right:**
```swift
// RIGHT: Haptic only at meaningful points during drag
.gesture(
    DragGesture()
        .onChanged { value in
            offset = value.translation

            // Haptic when crossing a threshold
            let crossedThreshold = abs(value.translation.width) > 100
            if crossedThreshold && !hasPassedThreshold {
                hasPassedThreshold = true
                UIImpactFeedbackGenerator(style: .medium).impactOccurred(intensity: 0.7)
            } else if !crossedThreshold && hasPassedThreshold {
                hasPassedThreshold = false
                UIImpactFeedbackGenerator(style: .light).impactOccurred(intensity: 0.4)
            }
        }
        .onEnded { value in
            if hasPassedThreshold {
                // Commit haptic
                UINotificationFeedbackGenerator().notificationOccurred(.success)
                commitAction()
            } else {
                // Snap-back haptic
                UIImpactFeedbackGenerator(style: .rigid).impactOccurred(intensity: 0.5)
                snapBack()
            }
        }
)
```

---

## Haptic Timing Cheat Sheet

| Emotional Beat | When to Fire | iOS API | Intensity | Web Pattern |
|---------------|-------------|---------|-----------|-------------|
| Entry/arrival | Element reaches final position | `.impact(.light)` | 0.6 | `vibrate(10)` |
| Selection/discovery | Immediately on tap/hover event | `.selectionChanged()` | N/A (system) | None |
| Commitment (beat 1) | Action accepted / threshold crossed | `.impact(.medium)` | 0.8 | `vibrate(20)` |
| Commitment (beat 2) | 200ms after beat 1 | `.notificationOccurred(.success)` | N/A (system) | `vibrate([20,150,30])` |
| Achievement | Peak visual moment (stamp lands) | `CHHapticEngine` crescendo | 0.4 → 0.9 | `vibrate([10,30,15,25,25])` |
| Transition | Midpoint of transition (max velocity) | `.impact(.light)` | 0.4 | `vibrate(8)` |
| Error | At error visual (shake, red flash) | `.notificationOccurred(.error)` | N/A (system) | `vibrate([50,50,50])` |
| Warning | At warning visual | `.notificationOccurred(.warning)` | N/A (system) | `vibrate([30,80,30])` |
| Ambient | Almost never. If used: at visual pulse peak | `.impact(.soft)` | 0.3, max 1/2s | Skip |

---

## Preparing Haptic Generators

On iOS, haptic generators have a startup cost. The Taptic Engine needs ~50ms to spin up from idle. For time-critical haptics (paired with animation peaks), pre-warm the generator.

```swift
// Pre-warm pattern: prepare before the interaction that will trigger the haptic
class HapticManager {
    static let shared = HapticManager()

    private let impact = UIImpactFeedbackGenerator(style: .medium)
    private let selection = UISelectionFeedbackGenerator()
    private let notification = UINotificationFeedbackGenerator()

    /// Call when user begins an interaction that will likely need haptic
    /// e.g., finger touches a draggable, button receives touchDown
    func prepare() {
        impact.prepare()
        selection.prepare()
        notification.prepare()
    }

    /// Call at the moment of peak visual change
    func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .medium, intensity: CGFloat = 1.0) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.impactOccurred(intensity: intensity)
    }

    func select() {
        selection.selectionChanged()
    }

    func notify(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        notification.notificationOccurred(type)
    }
}

// Usage in a drag interaction:
.gesture(
    DragGesture()
        .onChanged { _ in
            HapticManager.shared.prepare() // Pre-warm on first touch
        }
        .onEnded { _ in
            HapticManager.shared.notify(.success) // Zero-latency fire
        }
)
```

**Important:** `.prepare()` is valid for a short window (~1-2 seconds). If the interaction takes longer, call `.prepare()` again. The engine will idle-stop if not used promptly.

---

## Device Capability Check

Not all devices support all haptic types. Always check before using CHHapticEngine.

```swift
// Check basic haptic support (Taptic Engine present)
// All iPhones since iPhone 7 support UIFeedbackGenerator
// All iPhones since iPhone 8 support CHHapticEngine

// Check CHHapticEngine support
let supportsHaptics = CHHapticEngine.capabilitiesForHardware().supportsHaptics

// Devices WITHOUT haptics: iPod touch, some iPads, Simulator
// On these devices: UIFeedbackGenerator calls silently no-op (no crash)
// CHHapticEngine.init() throws — always use try/catch

// Safe CHHapticEngine usage
func playCustomHaptic(pattern: CHHapticPattern) {
    guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
    do {
        let engine = try CHHapticEngine()
        try engine.start()
        let player = try engine.makePlayer(with: pattern)
        try player.start(atTime: CHHapticTimeImmediate)
    } catch {
        // Haptic unavailable — no user-facing error, just skip
    }
}
```
