# Core Animation — Complete Reference

Direct `CALayer`-based animation for capabilities beyond SwiftUI's declarative system. All usage in SwiftUI requires `UIViewRepresentable` bridging.

---

## 1. UIViewRepresentable Bridging Pattern

Every Core Animation usage follows this structure.

```swift
import SwiftUI
import UIKit
import QuartzCore

struct CoreAnimationView: UIViewRepresentable {
    // Input parameters from SwiftUI
    let isAnimating: Bool

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.backgroundColor = .clear
        // Setup layers, display links, etc.
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        // Respond to SwiftUI state changes
        if isAnimating {
            context.coordinator.startAnimation(on: uiView)
        } else {
            context.coordinator.stopAnimation(on: uiView)
        }
    }

    static func dismantleUIView(_ uiView: UIView, coordinator: Coordinator) {
        // CRITICAL: Clean up all resources
        coordinator.cleanup()
        uiView.layer.removeAllAnimations()
        uiView.layer.sublayers?.forEach { sublayer in
            sublayer.removeAllAnimations()
            sublayer.removeFromSuperlayer()
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    class Coordinator {
        var displayLink: CADisplayLink?
        var emitterLayer: CAEmitterLayer?

        func startAnimation(on view: UIView) { /* ... */ }
        func stopAnimation(on view: UIView) { /* ... */ }

        func cleanup() {
            displayLink?.invalidate()
            displayLink = nil
            emitterLayer?.emitterCells = nil
            emitterLayer?.removeFromSuperlayer()
            emitterLayer = nil
        }
    }
}
```

---

## 2. CAKeyframeAnimation

Animate a property along an arbitrary sequence of values with per-keyframe timing.

```swift
func createShakeAnimation() -> CAKeyframeAnimation {
    let animation = CAKeyframeAnimation(keyPath: "transform.translation.x")

    // Keyframe values: the layer oscillates left/right with decreasing amplitude
    animation.values = [0, -12, 10, -8, 6, -4, 2, 0]
    // Each value is a position the layer moves to

    // Key times: normalized (0-1) positions in the timeline
    animation.keyTimes = [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1.0]

    animation.duration = 0.5
    animation.timingFunction = CAMediaTimingFunction(name: .easeOut)

    // Important: keep the layer at its final position after animation
    animation.fillMode = .forwards
    animation.isRemovedOnCompletion = true  // true = model layer stays at original position (usually correct)
    // Set to false + fillMode .forwards if you need the layer to visually stay at the end state

    return animation
}

// Path-based keyframe: animate along a bezier curve
func createPathAnimation() -> CAKeyframeAnimation {
    let animation = CAKeyframeAnimation(keyPath: "position")

    let path = UIBezierPath()
    path.move(to: CGPoint(x: 50, y: 200))
    path.addCurve(
        to: CGPoint(x: 300, y: 200),
        controlPoint1: CGPoint(x: 100, y: 50),
        controlPoint2: CGPoint(x: 250, y: 350)
    )

    animation.path = path.cgPath
    animation.duration = 1.0
    animation.timingFunction = CAMediaTimingFunction(
        controlPoints: 0.16, 1, 0.3, 1
        // Aggressive ease-out: arrives with authority
    )
    animation.rotationMode = .rotateAuto  // Layer rotates to follow path tangent

    return animation
}
```

---

## 3. CAAnimationGroup

Synchronize multiple property animations with shared timing.

```swift
func createEntryAnimation() -> CAAnimationGroup {
    // Scale from 0.5 to 1.0
    let scale = CABasicAnimation(keyPath: "transform.scale")
    scale.fromValue = 0.5
    scale.toValue = 1.0

    // Fade from 0 to 1
    let opacity = CABasicAnimation(keyPath: "opacity")
    opacity.fromValue = 0
    opacity.toValue = 1

    // Slide from 30pt below
    let position = CABasicAnimation(keyPath: "transform.translation.y")
    position.fromValue = 30
    position.toValue = 0

    let group = CAAnimationGroup()
    group.animations = [scale, opacity, position]
    group.duration = 0.35
    group.timingFunction = CAMediaTimingFunction(
        controlPoints: 0.16, 1, 0.3, 1
        // Sharp ease-out: decisive landing
    )
    group.fillMode = .backwards  // Apply fromValue before animation starts (handles delay)
    group.isRemovedOnCompletion = true

    return group
}

// Apply the group
func animate(layer: CALayer) {
    let animation = createEntryAnimation()
    layer.add(animation, forKey: "entryAnimation")
}
```

---

## 4. CASpringAnimation

Physics-based spring with explicit mass, stiffness, damping, initialVelocity.

```swift
func createSpringAnimation(
    keyPath: String,
    from: Any,
    to: Any
) -> CASpringAnimation {
    let spring = CASpringAnimation(keyPath: keyPath)
    spring.fromValue = from
    spring.toValue = to
    spring.mass = 1.0           // Heavier = slower, more momentum
    spring.stiffness = 300      // Higher = snappier
    spring.damping = 22         // Higher = less oscillation
    spring.initialVelocity = 0  // Starting velocity in the direction of the animation

    // Important: set duration to the spring's settling time
    spring.duration = spring.settlingDuration

    return spring
}

// Usage
let bounce = createSpringAnimation(
    keyPath: "transform.scale",
    from: 0.8,
    to: 1.0
)
layer.add(bounce, forKey: "springBounce")
```

### Mapping SwiftUI Spring to CASpringAnimation

SwiftUI's `response`/`dampingFraction` map to CA's `stiffness`/`damping`:

```swift
// Approximate conversion:
// stiffness ≈ (2π / response)^2 * mass
// damping ≈ 4π * dampingFraction * mass / response

let response: CGFloat = 0.4
let dampingFraction: CGFloat = 0.8
let mass: CGFloat = 1.0

let stiffness = pow(2 * .pi / response, 2) * mass   // ≈ 246.7
let damping = 4 * .pi * dampingFraction * mass / response  // ≈ 25.1
```

---

## 5. CAEmitterLayer + CAEmitterCell

GPU-accelerated particle systems. Particles are rendered by the GPU — no per-frame Swift code runs per particle.

```swift
func createParticleEmitter(in bounds: CGRect) -> CAEmitterLayer {
    let emitter = CAEmitterLayer()

    // Emitter geometry
    emitter.emitterPosition = CGPoint(x: bounds.midX, y: bounds.midY)
    emitter.emitterShape = .circle
    emitter.emitterSize = CGSize(width: 20, height: 20)
    emitter.emitterMode = .outline  // Emit from the edge of the shape

    // Render order
    emitter.renderMode = .additive  // .additive = bright, glowing. .oldestFirst = natural layering

    // Create particle cells
    let cell = CAEmitterCell()
    cell.contents = createParticleImage()?.cgImage  // Small circle or dot image
    cell.birthRate = 40             // Particles per second
    cell.lifetime = 3.0             // Seconds each particle lives
    cell.lifetimeRange = 1.0        // ±1 second variance
    cell.velocity = 80              // Points per second initial speed
    cell.velocityRange = 30         // ±30 variance
    cell.emissionRange = .pi * 2    // Emit in all directions (full circle)
    cell.spin = 0.5                 // Radians per second rotation
    cell.spinRange = 1.0            // ±1 radian/s variance
    cell.scale = 0.15               // Scale factor
    cell.scaleRange = 0.1           // ±0.1 scale variance
    cell.scaleSpeed = -0.03         // Shrink over lifetime
    cell.alphaSpeed = -0.3          // Fade over lifetime
    cell.color = UIColor(red: 0.35, green: 0.47, blue: 0.58, alpha: 1.0).cgColor
    // Brand accent #597794
    cell.redRange = 0.1             // Color variance in red channel
    cell.greenRange = 0.1
    cell.blueRange = 0.1

    emitter.emitterCells = [cell]

    return emitter
}

// Utility: create a small circular particle image
func createParticleImage(size: CGFloat = 12) -> UIImage? {
    let renderer = UIGraphicsImageRenderer(size: CGSize(width: size, height: size))
    return renderer.image { context in
        let rect = CGRect(origin: .zero, size: CGSize(width: size, height: size))
        context.cgContext.setFillColor(UIColor.white.cgColor)
        context.cgContext.fillEllipse(in: rect)
    }
}
```

### Burst Effect (Finite Particles)

```swift
func emitBurst(from layer: CAEmitterLayer, count: Int = 50) {
    // Set a high birth rate briefly, then stop
    let burstCell = layer.emitterCells?.first
    burstCell?.birthRate = Float(count)

    // After a short interval, stop emitting
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
        burstCell?.birthRate = 0
    }
    // Existing particles continue their lifecycle and fade out naturally
}
```

### Emitter Shapes

| Shape | Behavior |
|-------|----------|
| `.point` | All particles emit from a single point |
| `.line` | Particles emit from a horizontal line |
| `.rectangle` | Particles emit from within a rectangle |
| `.circle` | Particles emit from within a circle |
| `.cuboid` | 3D box (for 3D emitters) |
| `.sphere` | 3D sphere (for 3D emitters) |

### Emitter Modes

| Mode | Behavior |
|------|----------|
| `.points` | Emit from random points within the shape |
| `.outline` | Emit from the edge/perimeter of the shape |
| `.surface` | Emit from the surface (3D shapes) |
| `.volume` | Emit from within the volume (3D shapes) |

---

## 6. CAShapeLayer — Line Drawing

Animate the drawing of a path using `strokeEnd`.

```swift
func createCheckmarkDrawAnimation(in bounds: CGRect) -> (CAShapeLayer, CABasicAnimation) {
    let shapeLayer = CAShapeLayer()

    // Checkmark path
    let path = UIBezierPath()
    let inset = bounds.insetBy(dx: bounds.width * 0.25, dy: bounds.height * 0.25)
    path.move(to: CGPoint(x: inset.minX, y: inset.midY))
    path.addLine(to: CGPoint(x: inset.midX - inset.width * 0.1, y: inset.maxY - inset.height * 0.15))
    path.addLine(to: CGPoint(x: inset.maxX, y: inset.minY))

    shapeLayer.path = path.cgPath
    shapeLayer.strokeColor = UIColor(red: 0.35, green: 0.47, blue: 0.58, alpha: 1.0).cgColor
    shapeLayer.fillColor = UIColor.clear.cgColor
    shapeLayer.lineWidth = 3
    shapeLayer.lineCap = .round
    shapeLayer.lineJoin = .round
    shapeLayer.strokeEnd = 0  // Initially hidden

    // Draw animation
    let animation = CABasicAnimation(keyPath: "strokeEnd")
    animation.fromValue = 0
    animation.toValue = 1
    animation.duration = 0.4
    animation.timingFunction = CAMediaTimingFunction(
        controlPoints: 0.22, 1, 0.36, 1
        // Ease-out: draws quickly at first, decelerates toward end
    )
    animation.fillMode = .forwards
    animation.isRemovedOnCompletion = false

    return (shapeLayer, animation)
}
```

---

## 7. CAReplicatorLayer

Create repeating patterns with per-instance transform, color, and timing offsets.

```swift
func createLoadingDots(count: Int = 3, spacing: CGFloat = 16) -> CAReplicatorLayer {
    let replicator = CAReplicatorLayer()

    // The instance that gets replicated
    let dot = CALayer()
    dot.frame = CGRect(x: 0, y: 0, width: 8, height: 8)
    dot.cornerRadius = 4
    dot.backgroundColor = UIColor(red: 0.35, green: 0.47, blue: 0.58, alpha: 1.0).cgColor

    replicator.addSublayer(dot)
    replicator.instanceCount = count
    replicator.instanceTransform = CATransform3DMakeTranslation(spacing, 0, 0)
    // Each instance is offset horizontally by `spacing`

    replicator.instanceDelay = 0.15
    // Each instance starts its animation 150ms after the previous one

    // Pulse animation on the original dot — replicator copies it with delay
    let pulse = CABasicAnimation(keyPath: "transform.scale")
    pulse.fromValue = 1.0
    pulse.toValue = 1.5
    pulse.duration = 0.4
    pulse.autoreverses = true
    pulse.repeatCount = .infinity
    pulse.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)

    dot.add(pulse, forKey: "pulse")

    // Size the replicator to contain all instances
    let totalWidth = CGFloat(count - 1) * spacing + 8
    replicator.frame = CGRect(x: 0, y: 0, width: totalWidth, height: 8)

    return replicator
}
```

---

## 8. CATransform3D

Full 3D transforms with perspective projection.

```swift
// Perspective transform
var transform = CATransform3DIdentity
transform.m34 = -1.0 / 1000  // Perspective: smaller denominator = more dramatic
// m34 controls the vanishing point distance

// Rotation around Y axis (card flip)
let flipTransform = CATransform3DRotate(transform, .pi, 0, 1, 0)

// Rotation around X axis (tilt)
let tiltTransform = CATransform3DRotate(transform, .pi / 6, 1, 0, 0)

// Combined: isometric view
var isometric = CATransform3DIdentity
isometric.m34 = -1.0 / 800
isometric = CATransform3DRotate(isometric, -.pi / 6, 1, 0, 0)  // Tilt back
isometric = CATransform3DRotate(isometric, .pi / 4, 0, 1, 0)   // Rotate right

// Animate the transform
let animation = CABasicAnimation(keyPath: "transform")
animation.fromValue = CATransform3DIdentity
animation.toValue = isometric
animation.duration = 0.6
animation.timingFunction = CAMediaTimingFunction(controlPoints: 0.16, 1, 0.3, 1)
```

---

## 9. CADisplayLink

Frame-synchronized callback at the display's refresh rate. Use for custom animation loops that cannot be expressed declaratively.

```swift
class DisplayLinkAnimator {
    private var displayLink: CADisplayLink?
    private var startTime: CFTimeInterval = 0
    private let duration: CFTimeInterval
    private let onUpdate: (CGFloat) -> Void
    private let onComplete: () -> Void

    init(duration: CFTimeInterval, onUpdate: @escaping (CGFloat) -> Void, onComplete: @escaping () -> Void) {
        self.duration = duration
        self.onUpdate = onUpdate
        self.onComplete = onComplete
    }

    func start() {
        displayLink = CADisplayLink(target: self, selector: #selector(tick))
        displayLink?.add(to: .main, forMode: .common)
        startTime = CACurrentMediaTime()
    }

    @objc private func tick(_ link: CADisplayLink) {
        let elapsed = link.timestamp - startTime

        // IMPORTANT: Use delta time, not hardcoded frame duration
        // On ProMotion displays, link fires at 120Hz
        let dt = link.targetTimestamp - link.timestamp
        _ = dt  // Available for physics calculations

        let progress = min(elapsed / duration, 1.0)

        // Ease-out curve: 1 - (1 - t)^3
        let eased = 1.0 - pow(1.0 - progress, 3)

        onUpdate(eased)

        if progress >= 1.0 {
            stop()
            onComplete()
        }
    }

    func stop() {
        displayLink?.invalidate()
        displayLink = nil
    }

    deinit {
        stop()
    }
}
```

### ProMotion Notes

- `CADisplayLink` automatically fires at the display's native refresh rate.
- On ProMotion devices, this is up to 120Hz (8.3ms per frame).
- Use `link.targetTimestamp - link.timestamp` for delta time — never assume 1/60 or 1/120.
- Set `link.preferredFrameRateRange` to control the range:

```swift
// Request high frame rate for smooth animation
displayLink?.preferredFrameRateRange = CAFrameRateRange(
    minimum: 60,
    maximum: 120,
    preferred: 120
)

// Request low frame rate for battery savings (ambient animation)
displayLink?.preferredFrameRateRange = CAFrameRateRange(
    minimum: 15,
    maximum: 30,
    preferred: 30
)
```

---

## 10. Complete UIViewRepresentable Examples

### Shake Animation

```swift
struct ShakeView: UIViewRepresentable {
    let trigger: Int  // Increment to trigger shake

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.backgroundColor = .clear
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        guard trigger > 0 else { return }

        let animation = CAKeyframeAnimation(keyPath: "transform.translation.x")
        animation.values = [0, -12, 10, -8, 6, -4, 2, 0]
        animation.keyTimes = [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1.0]
        animation.duration = 0.45
        animation.timingFunction = CAMediaTimingFunction(name: .easeOut)

        uiView.layer.add(animation, forKey: "shake-\(trigger)")
    }

    static func dismantleUIView(_ uiView: UIView, coordinator: Coordinator) {
        uiView.layer.removeAllAnimations()
    }

    func makeCoordinator() -> Coordinator { Coordinator() }
    class Coordinator {}
}

// Usage in SwiftUI
struct ErrorField: View {
    @State private var shakeTrigger = 0

    var body: some View {
        TextField("Email", text: .constant(""))
            .background(ShakeView(trigger: shakeTrigger))
            .sensoryFeedback(.error, trigger: shakeTrigger)
    }

    func showError() {
        shakeTrigger += 1
    }
}
```

### Animated Checkmark

```swift
struct AnimatedCheckmark: UIViewRepresentable {
    let isComplete: Bool

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.backgroundColor = .clear

        let shape = CAShapeLayer()
        shape.strokeColor = UIColor(red: 0.35, green: 0.47, blue: 0.58, alpha: 1.0).cgColor
        shape.fillColor = UIColor.clear.cgColor
        shape.lineWidth = 3
        shape.lineCap = .round
        shape.lineJoin = .round
        shape.strokeEnd = 0

        view.layer.addSublayer(shape)
        context.coordinator.shapeLayer = shape

        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        guard let shape = context.coordinator.shapeLayer else { return }

        // Update path to match current bounds
        let bounds = uiView.bounds
        let inset = bounds.insetBy(dx: bounds.width * 0.2, dy: bounds.height * 0.2)
        let path = UIBezierPath()
        path.move(to: CGPoint(x: inset.minX, y: inset.midY))
        path.addLine(to: CGPoint(x: inset.midX - inset.width * 0.05, y: inset.maxY - inset.height * 0.1))
        path.addLine(to: CGPoint(x: inset.maxX, y: inset.minY))
        shape.path = path.cgPath
        shape.frame = bounds

        if isComplete && shape.strokeEnd == 0 {
            let animation = CABasicAnimation(keyPath: "strokeEnd")
            animation.fromValue = 0
            animation.toValue = 1
            animation.duration = 0.35
            animation.timingFunction = CAMediaTimingFunction(controlPoints: 0.22, 1, 0.36, 1)
            animation.fillMode = .forwards
            animation.isRemovedOnCompletion = false
            shape.add(animation, forKey: "draw")
            shape.strokeEnd = 1
        } else if !isComplete {
            shape.removeAllAnimations()
            shape.strokeEnd = 0
        }
    }

    static func dismantleUIView(_ uiView: UIView, coordinator: Coordinator) {
        coordinator.shapeLayer?.removeAllAnimations()
        coordinator.shapeLayer?.removeFromSuperlayer()
        coordinator.shapeLayer = nil
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    class Coordinator {
        var shapeLayer: CAShapeLayer?
    }
}
```
