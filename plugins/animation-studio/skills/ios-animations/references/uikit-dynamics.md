# UIKit Dynamics — Complete Reference

Real-time physics simulation engine for iOS. Gravity, collision, snap, push, and attachment behaviors applied to views or `UIDynamicItem` conforming objects. Use when true multi-body physics produces a better result than manual animation.

---

## 1. When to Use UIKit Dynamics vs Manual Animation

| Scenario | Use UIKit Dynamics | Use SwiftUI/CA |
|----------|-------------------|----------------|
| Items falling under gravity with collision | Yes | No — too many inter-body interactions |
| Drag-and-release with realistic throw | Maybe — `UISnapBehavior` is great for snap-back | SwiftUI `.spring()` often sufficient for single item |
| Multiple items bouncing off each other | Yes | No — collision detection between N items is complex |
| Magnetic/gravity wells | Yes — `UIFieldBehavior` | No — field simulation is hard to hand-roll |
| Single element spring animation | No — overkill | SwiftUI `.spring()` is simpler and declarative |
| Pull-to-refresh bounce | No | SwiftUI scroll behavior or CA spring |
| Physics puzzle or game-like interactions | Yes | No |

**Rule of thumb:** If you have 1-2 items with spring physics, use SwiftUI. If you have 3+ items that must interact physically (collide, repel, attract), UIKit Dynamics is the right tool.

---

## 2. Architecture

```
UIDynamicAnimator     — The simulation engine, attached to a reference view
    │
    ├── UIGravityBehavior     — Applies gravitational force
    ├── UICollisionBehavior   — Boundary and inter-item collision
    ├── UISnapBehavior        — Spring-snap to a point
    ├── UIPushBehavior        — Instantaneous or continuous force
    ├── UIAttachmentBehavior  — Spring or rigid connections
    └── UIDynamicItemBehavior — Per-item physical properties
```

All behaviors are added to the `UIDynamicAnimator`. The animator runs the simulation at the display refresh rate and updates the `center` and `transform` of each `UIDynamicItem`.

---

## 3. UIGravityBehavior

Applies a constant gravitational force to items.

```swift
class GravityScene {
    let animator: UIDynamicAnimator
    let gravity: UIGravityBehavior

    init(referenceView: UIView, items: [UIView]) {
        animator = UIDynamicAnimator(referenceView: referenceView)

        gravity = UIGravityBehavior(items: items)
        gravity.gravityDirection = CGVector(dx: 0, dy: 1.0)
        // dx: 0 = no horizontal gravity
        // dy: 1.0 = standard downward gravity (1 UIKit gravity = 1000 points/s^2)
        // dy: 2.0 = double gravity (faster fall)

        animator.addBehavior(gravity)
    }

    func setAngle(_ angle: CGFloat, magnitude: CGFloat = 1.0) {
        gravity.angle = angle
        gravity.magnitude = magnitude
    }
}
```

---

## 4. UICollisionBehavior

Detects collisions between items and with boundaries.

```swift
func setupCollision(
    animator: UIDynamicAnimator,
    items: [UIView],
    referenceView: UIView
) -> UICollisionBehavior {
    let collision = UICollisionBehavior(items: items)

    // Use the reference view bounds as collision boundaries
    collision.translatesReferenceBoundsIntoBoundary = true

    // Custom boundary: add a line segment
    collision.addBoundary(
        withIdentifier: "shelf" as NSCopying,
        from: CGPoint(x: 0, y: 400),
        to: CGPoint(x: referenceView.bounds.width, y: 400)
    )

    // Custom boundary: add a bezier path
    let rampPath = UIBezierPath()
    rampPath.move(to: CGPoint(x: 0, y: 300))
    rampPath.addLine(to: CGPoint(x: 200, y: 400))
    collision.addBoundary(
        withIdentifier: "ramp" as NSCopying,
        for: rampPath
    )

    // Collision delegate for haptic pairing
    collision.collisionDelegate = /* your delegate */
    // Delegate method:
    // func collisionBehavior(_ behavior: UICollisionBehavior,
    //     beganContactFor item: UIDynamicItem,
    //     withBoundaryIdentifier identifier: NSCopying?,
    //     at p: CGPoint)
    // → Fire UIImpactFeedbackGenerator(.medium) here

    collision.collisionMode = .everything  // .items, .boundaries, or .everything

    animator.addBehavior(collision)
    return collision
}
```

---

## 5. UISnapBehavior

Spring-snaps an item to a target point. Creates a satisfying "magnetic" feel.

```swift
func snapItem(_ item: UIView, to point: CGPoint, animator: UIDynamicAnimator) {
    // Remove any existing snap behavior for this item
    animator.behaviors
        .compactMap { $0 as? UISnapBehavior }
        .filter { $0.items.contains(where: { $0 === item }) }
        .forEach { animator.removeBehavior($0) }

    let snap = UISnapBehavior(item: item, snapTo: point)
    snap.damping = 0.6
    // damping: 0 = infinite oscillation around target
    //          1 = critically damped (smooth approach, no overshoot)
    //        0.6 = slight overshoot, settles quickly (good default)

    animator.addBehavior(snap)

    // Haptic when snap engages
    UIImpactFeedbackGenerator(style: .rigid).impactOccurred(intensity: 0.7)
}
```

---

## 6. UIPushBehavior

Applies a force — either instantaneous (impulse) or continuous.

```swift
// Instantaneous push — like flicking an item
func flick(_ item: UIView, velocity: CGVector, animator: UIDynamicAnimator) {
    let push = UIPushBehavior(items: [item], mode: .instantaneous)
    push.pushDirection = velocity
    push.magnitude = sqrt(velocity.dx * velocity.dx + velocity.dy * velocity.dy) * 0.01
    // Scale the magnitude to feel natural

    // Auto-remove after application
    push.action = { [weak animator, weak push] in
        guard let push = push else { return }
        if !push.active {
            animator?.removeBehavior(push)
        }
    }

    animator.addBehavior(push)
}

// Continuous push — like wind
func applyWind(
    to items: [UIView],
    direction: CGVector,
    magnitude: CGFloat,
    animator: UIDynamicAnimator
) -> UIPushBehavior {
    let push = UIPushBehavior(items: items, mode: .continuous)
    push.pushDirection = direction
    push.magnitude = magnitude  // Points/s^2 of acceleration
    animator.addBehavior(push)
    return push
}
```

---

## 7. UIAttachmentBehavior

Connect items together or to anchor points with spring or rigid attachments.

```swift
// Spring attachment: item follows finger with springy lag
func createDragAttachment(
    item: UIView,
    anchorPoint: CGPoint
) -> UIAttachmentBehavior {
    let attachment = UIAttachmentBehavior(item: item, attachedToAnchor: anchorPoint)
    attachment.length = 0         // Anchor directly (no rod length)
    attachment.damping = 0.8      // Higher = less oscillation
    attachment.frequency = 3.0    // Higher = stiffer spring (Hz)
    return attachment
}

// Rigid attachment between two items
func connectItems(
    _ item1: UIView,
    _ item2: UIView
) -> UIAttachmentBehavior {
    let attachment = UIAttachmentBehavior(item: item1, attachedTo: item2)
    attachment.length = 50  // Fixed distance between items
    attachment.damping = 1.0
    attachment.frequency = 0  // 0 = rigid (no spring)
    return attachment
}

// Pin attachment: allows rotation around a point
func createPin(
    item: UIView,
    point: CGPoint
) -> UIAttachmentBehavior {
    let pin = UIAttachmentBehavior.pinAttachment(
        with: item,
        attachedTo: item, // Self-pin = pivot
        attachmentAnchor: point
    )
    return pin
}

// Dragging with attachment (smooth, physics-based drag)
// Update the anchor point on drag gesture to make the item follow
func updateDragPosition(attachment: UIAttachmentBehavior, to point: CGPoint) {
    attachment.anchorPoint = point
}
```

---

## 8. UIDynamicItemBehavior

Per-item physical properties that affect how items respond to all behaviors.

```swift
func configureItemPhysics(
    _ items: [UIView],
    animator: UIDynamicAnimator
) -> UIDynamicItemBehavior {
    let itemBehavior = UIDynamicItemBehavior(items: items)

    itemBehavior.elasticity = 0.6
    // 0 = no bounce, 1 = perfectly elastic collision. 0.6 = realistic

    itemBehavior.friction = 0.5
    // 0 = frictionless (ice), 1 = maximum friction

    itemBehavior.density = 1.0
    // Relative mass. Higher = harder to push, more momentum

    itemBehavior.resistance = 0.1
    // Air resistance / linear damping. 0 = no drag, higher = slows faster

    itemBehavior.angularResistance = 0.3
    // Resistance to rotation. 0 = spins freely, higher = stops rotating sooner

    itemBehavior.allowsRotation = true
    // Set false to prevent rotation during collisions

    animator.addBehavior(itemBehavior)
    return itemBehavior
}

// Add linear velocity programmatically (for throw gesture)
func throwItem(
    _ item: UIView,
    velocity: CGPoint,
    behavior: UIDynamicItemBehavior
) {
    behavior.addLinearVelocity(velocity, for: item)
}

// Add angular velocity (spin)
func spinItem(
    _ item: UIView,
    angularVelocity: CGFloat,
    behavior: UIDynamicItemBehavior
) {
    behavior.addAngularVelocity(angularVelocity, for: item)
}
```

---

## 9. Complete UIViewRepresentable Bridge

Full example: items that fall under gravity, bounce off walls and each other, and can be flicked by the user.

```swift
import SwiftUI
import UIKit

struct PhysicsPlayground: UIViewRepresentable {
    let itemCount: Int
    let isActive: Bool

    func makeUIView(context: Context) -> UIView {
        let container = UIView()
        container.backgroundColor = .clear
        container.clipsToBounds = true
        return container
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        if isActive && context.coordinator.animator == nil {
            context.coordinator.setup(in: uiView, count: itemCount)
        } else if !isActive {
            context.coordinator.tearDown()
        }
    }

    static func dismantleUIView(_ uiView: UIView, coordinator: Coordinator) {
        coordinator.tearDown()
        uiView.subviews.forEach { $0.removeFromSuperview() }
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    class Coordinator: NSObject, UICollisionBehaviorDelegate {
        var animator: UIDynamicAnimator?
        var items: [UIView] = []
        private let haptic = UIImpactFeedbackGenerator(style: .medium)

        func setup(in containerView: UIView, count: Int) {
            // Create item views
            items = (0..<count).map { _ in
                let view = UIView()
                let size = CGFloat.random(in: 20...50)
                view.frame = CGRect(
                    x: CGFloat.random(in: 0...containerView.bounds.width - size),
                    y: CGFloat.random(in: 0...100),
                    width: size,
                    height: size
                )
                view.layer.cornerRadius = size / 2
                view.backgroundColor = UIColor(
                    red: 0.35, green: 0.47, blue: 0.58,
                    alpha: CGFloat.random(in: 0.5...1.0)
                )
                containerView.addSubview(view)
                return view
            }

            // Create animator
            let anim = UIDynamicAnimator(referenceView: containerView)
            self.animator = anim

            // Gravity
            let gravity = UIGravityBehavior(items: items)
            gravity.magnitude = 1.2  // Slightly stronger than default for snappy feel
            anim.addBehavior(gravity)

            // Collision
            let collision = UICollisionBehavior(items: items)
            collision.translatesReferenceBoundsIntoBoundary = true
            collision.collisionDelegate = self
            anim.addBehavior(collision)

            // Item properties
            let itemBehavior = UIDynamicItemBehavior(items: items)
            itemBehavior.elasticity = 0.5
            itemBehavior.friction = 0.3
            itemBehavior.resistance = 0.1
            anim.addBehavior(itemBehavior)
        }

        func tearDown() {
            animator?.removeAllBehaviors()
            animator = nil
            items.forEach { $0.removeFromSuperview() }
            items.removeAll()
        }

        // MARK: - UICollisionBehaviorDelegate

        func collisionBehavior(
            _ behavior: UICollisionBehavior,
            beganContactFor item: UIDynamicItem,
            withBoundaryIdentifier identifier: NSCopying?,
            at p: CGPoint
        ) {
            // Haptic on boundary collision
            haptic.impactOccurred(intensity: 0.5)
        }

        func collisionBehavior(
            _ behavior: UICollisionBehavior,
            beganContactFor item1: UIDynamicItem,
            with item2: UIDynamicItem,
            at p: CGPoint
        ) {
            // Haptic on item-to-item collision (lighter)
            haptic.impactOccurred(intensity: 0.3)
        }
    }
}
```

---

## 10. Memory Management

UIKit Dynamics allocates and runs a simulation that persists until explicitly removed. Always clean up.

```swift
// In UIViewRepresentable Coordinator:
func tearDown() {
    // 1. Remove all behaviors (stops simulation)
    animator?.removeAllBehaviors()

    // 2. Nil the animator (releases reference to reference view)
    animator = nil

    // 3. Remove item views from hierarchy
    items.forEach { $0.removeFromSuperview() }
    items.removeAll()
}

// Trigger cleanup:
// - static func dismantleUIView calls tearDown
// - isActive toggles call tearDown when false
// - .onDisappear on the SwiftUI wrapper can also drive cleanup via binding
```

### Battery Considerations

UIKit Dynamics runs the simulation at the display refresh rate as long as items are in motion. On ProMotion devices, this means 120 physics updates per second.

1. **The simulation auto-pauses** when all items reach rest (velocity < threshold). No manual work needed.
2. **Set `resistance` and `angularResistance`** on `UIDynamicItemBehavior` to ensure items come to rest rather than drifting indefinitely.
3. **For background/inactive scenes**, check `scenePhase` and call `animator?.removeAllBehaviors()` when `.inactive` or `.background`, then re-add when `.active`.
