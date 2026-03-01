# Celebration Library

Five celebration animation implementations for tutorial completion moments. Each celebration is a Tier 3 animation — use only for explicit completion events (phase completion, tutorial completion, milestone achievement). Lazy load all celebration components.

---

## 1. Confetti Burst

Particles explode from a completion point and fall with gravity and drag. The classic celebration. Use for tutorial completion (the final moment) or major milestone completions.

### iOS (SwiftUI + CAEmitterLayer)

```swift
import SwiftUI
import UIKit

struct ConfettiView: UIViewRepresentable {
    let origin: CGPoint
    let colors: [UIColor]
    let particleCount: Int

    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)
        view.backgroundColor = .clear
        view.isUserInteractionEnabled = false

        let emitter = CAEmitterLayer()
        emitter.emitterPosition = origin
        emitter.emitterShape = .point
        emitter.emitterSize = CGSize(width: 1, height: 1)
        emitter.renderMode = .additive

        let cells = colors.map { color -> CAEmitterCell in
            let cell = CAEmitterCell()
            cell.birthRate = Float(particleCount) / Float(colors.count)
            cell.lifetime = 3.0
            cell.velocity = 300
            cell.velocityRange = 100
            cell.emissionLongitude = -.pi / 2 // upward
            cell.emissionRange = .pi / 4 // 45 degree spread
            cell.yAcceleration = 400 // gravity
            cell.spin = 4
            cell.spinRange = 8
            cell.scale = 0.04
            cell.scaleRange = 0.02
            cell.color = color.cgColor
            cell.contents = UIImage(systemName: "circle.fill")?.cgImage
            return cell
        }

        emitter.emitterCells = cells
        view.layer.addSublayer(emitter)

        // Stop emission after a burst
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            emitter.birthRate = 0
        }

        // Remove layer after particles settle
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.5) {
            emitter.removeFromSuperlayer()
        }

        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {}
}

// Usage
ConfettiView(
    origin: CGPoint(x: UIScreen.main.bounds.midX, y: UIScreen.main.bounds.midY),
    colors: [.systemBlue, .systemGreen, .systemYellow, .systemOrange, .systemPink],
    particleCount: 80
)
.allowsHitTesting(false)
.ignoresSafeArea()
```

### Web (React / canvas-confetti)

```tsx
"use client"
import { useEffect } from "react"
import dynamic from "next/dynamic"

// Lazy load confetti
const fireConfetti = async (origin: { x: number; y: number }) => {
  const confetti = (await import("canvas-confetti")).default
  confetti({
    particleCount: 80,
    spread: 70,
    origin: {
      x: origin.x / window.innerWidth,
      y: origin.y / window.innerHeight,
    },
    colors: ["#597794", "#4CAF50", "#FFD700", "#FF6B6B", "#9C27B0"],
    ticks: 200,
    gravity: 1.2,
    scalar: 0.9,
    drift: 0,
  })
}

// Usage in component
export function TutorialComplete({ originPoint }: { originPoint: { x: number; y: number } }) {
  useEffect(() => {
    fireConfetti(originPoint)
  }, [originPoint])

  return null // confetti renders on its own canvas
}
```

**Notes:** `canvas-confetti` creates its own full-screen canvas element. Install with `npm install canvas-confetti @types/canvas-confetti`. It self-cleans after particles finish.

---

## 2. Pulse Glow

The target element (or a completion icon) pulses with a colored glow that expands outward and fades. Subtle and elegant. Use for individual phase completions or quiet milestones.

### iOS (SwiftUI)

```swift
struct PulseGlow: View {
    let color: Color
    @State private var isPulsing = false

    var body: some View {
        Circle()
            .fill(color.opacity(0.3))
            .scaleEffect(isPulsing ? 1.8 : 1.0)
            .opacity(isPulsing ? 0 : 0.6)
            .animation(
                .easeOut(duration: 0.6),
                value: isPulsing
            )
            .onAppear {
                isPulsing = true
            }
    }
}

// Overlay on target element
ZStack {
    targetView
    PulseGlow(color: .accentColor)
        .frame(width: 60, height: 60)
        .allowsHitTesting(false)
}
```

For a repeating pulse (use sparingly):

```swift
.animation(
    .easeOut(duration: 0.8)
    .repeatCount(3, autoreverses: false),
    value: isPulsing
)
```

### Web (React / CSS)

```tsx
"use client"
import { motion } from "framer-motion"

export function PulseGlow({ color = "#597794" }: { color?: string }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{ backgroundColor: color }}
      initial={{ scale: 1, opacity: 0.6 }}
      animate={{ scale: 1.8, opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    />
  )
}
```

CSS-only alternative (no Framer Motion needed):

```css
@keyframes pulse-glow {
  0% {
    transform: scale(1);
    opacity: 0.6;
    box-shadow: 0 0 0 0 rgba(89, 119, 148, 0.4);
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
    box-shadow: 0 0 20px 10px rgba(89, 119, 148, 0);
  }
}

.pulse-glow {
  animation: pulse-glow 0.6s ease-out forwards;
}
```

---

## 3. Checkmark Animation

An animated checkmark draws itself stroke-by-stroke inside a circle. Communicates "done" with satisfying visual feedback. Use for phase completion confirmations.

### iOS (SwiftUI)

```swift
struct AnimatedCheckmark: View {
    @State private var trimEnd: CGFloat = 0
    @State private var circleScale: CGFloat = 0.8
    let size: CGFloat
    let color: Color

    var body: some View {
        ZStack {
            // Background circle
            Circle()
                .fill(color.opacity(0.15))
                .scaleEffect(circleScale)

            // Checkmark path
            CheckmarkShape()
                .trim(from: 0, to: trimEnd)
                .stroke(
                    color,
                    style: StrokeStyle(
                        lineWidth: 3,
                        lineCap: .round,
                        lineJoin: .round
                    )
                )
                .frame(width: size * 0.5, height: size * 0.5)
        }
        .frame(width: size, height: size)
        .onAppear {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                circleScale = 1.0
            }
            withAnimation(
                .easeOut(duration: 0.4)
                .delay(0.15)
            ) {
                trimEnd = 1.0
            }
        }
    }
}

struct CheckmarkShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        // Start from bottom-left of check
        path.move(to: CGPoint(
            x: rect.width * 0.15,
            y: rect.height * 0.55
        ))
        // Down to bottom of check
        path.addLine(to: CGPoint(
            x: rect.width * 0.4,
            y: rect.height * 0.8
        ))
        // Up to top-right of check
        path.addLine(to: CGPoint(
            x: rect.width * 0.85,
            y: rect.height * 0.2
        ))
        return path
    }
}
```

### Web (React / SVG)

```tsx
"use client"
import { motion } from "framer-motion"

export function AnimatedCheckmark({
  size = 64,
  color = "#597794",
}: {
  size?: number
  color?: string
}) {
  const checkPath = "M 15 50 L 38 73 L 78 28"

  return (
    <div style={{ width: size, height: size }} className="relative">
      {/* Background circle */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: `${color}22` }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />

      {/* Checkmark SVG */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
      >
        <motion.path
          d={checkPath}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
            delay: 0.15,
          }}
        />
      </svg>
    </div>
  )
}
```

**Notes:** The SVG `pathLength` property in Framer Motion maps to `stroke-dasharray` and `stroke-dashoffset` under the hood. This is the idiomatic way to animate SVG path drawing in Framer Motion.

---

## 4. Stats Counter

Numbers count up from zero to their final value on the completion screen. Use for displaying tutorial completion time, phases completed, or any numeric achievement.

### iOS (SwiftUI)

```swift
struct CountingText: View {
    let targetValue: Int
    let duration: Double
    let suffix: String
    @State private var displayValue: Int = 0

    var body: some View {
        Text("\(displayValue)\(suffix)")
            .font(.system(size: 48, weight: .bold, design: .monospaced))
            .onAppear {
                startCounting()
            }
    }

    private func startCounting() {
        let steps = min(targetValue, 60) // max 60 steps for smoothness
        let interval = duration / Double(steps)

        for step in 0...steps {
            DispatchQueue.main.asyncAfter(
                deadline: .now() + interval * Double(step)
            ) {
                let progress = Double(step) / Double(steps)
                // Ease-out curve: progress decelerates
                let eased = 1 - pow(1 - progress, 3)
                displayValue = Int(Double(targetValue) * eased)
            }
        }
    }
}

// Usage
CountingText(targetValue: 45, duration: 1.0, suffix: "s")
```

### Web (React / Framer Motion)

```tsx
"use client"
import { useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect, useState } from "react"

export function CountingNumber({
  target,
  duration = 1,
  suffix = "",
}: {
  target: number
  duration?: number
  suffix?: string
}) {
  const [display, setDisplay] = useState(0)
  const motionValue = useMotionValue(0)

  useEffect(() => {
    const controls = animate(motionValue, target, {
      duration,
      ease: [0.33, 1, 0.68, 1], // ease-out cubic
      onUpdate: (v) => setDisplay(Math.round(v)),
    })

    return () => controls.stop()
  }, [target, duration, motionValue])

  return (
    <span className="font-mono text-5xl font-bold tabular-nums">
      {display}{suffix}
    </span>
  )
}
```

**Notes:** Use `tabular-nums` (CSS) or monospaced font to prevent layout shift as digits change width. The ease-out curve makes the counter start fast and decelerate, which feels natural.

---

## 5. Haptic Sequence (iOS Only)

A choreographed haptic feedback pattern for tutorial completion. Pairs with visual celebrations. Not a visual animation — this is tactile feedback.

### iOS (SwiftUI)

```swift
import UIKit

struct HapticCelebration {
    static func fire() {
        // Primary success notification
        let notification = UINotificationFeedbackGenerator()
        notification.prepare()
        notification.notificationOccurred(.success)

        // Follow-up light taps (celebration rhythm)
        let impact = UIImpactFeedbackGenerator(style: .light)
        impact.prepare()

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            impact.impactOccurred()
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
            impact.impactOccurred()
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            impact.impactOccurred(intensity: 0.5) // softer final tap
        }
    }

    /// Lighter haptic for phase completion (not full tutorial completion)
    static func phaseComplete() {
        let impact = UIImpactFeedbackGenerator(style: .medium)
        impact.prepare()
        impact.impactOccurred()
    }

    /// Subtle tap for tooltip appearance
    static func tooltipAppear() {
        let impact = UIImpactFeedbackGenerator(style: .light)
        impact.prepare()
        impact.impactOccurred(intensity: 0.4)
    }
}

// Usage
// On tutorial complete:
HapticCelebration.fire()

// On phase complete:
HapticCelebration.phaseComplete()

// On tooltip appear:
HapticCelebration.tooltipAppear()
```

**Notes:**
- Always call `.prepare()` before `.impactOccurred()` — this wakes the Taptic Engine and reduces latency.
- The celebration sequence takes ~500ms total. Time it to start simultaneously with the visual confetti or checkmark.
- Haptics are independent of `accessibilityReduceMotion`. They should still fire when visual motion is reduced.
- Web has no reliable haptic API. On web, skip this celebration type entirely.

---

## Combining Celebrations

For maximum impact on tutorial completion, layer multiple celebrations:

1. **Haptic sequence** fires immediately (iOS)
2. **Confetti burst** from center screen, simultaneous with haptic
3. **Checkmark animation** in the center, 200ms delay
4. **Stats counter** begins after checkmark completes (~600ms delay)
5. **Pulse glow** behind the CTA button when it appears

Stagger the layers. Never fire everything at the same moment — it becomes noise instead of celebration.
