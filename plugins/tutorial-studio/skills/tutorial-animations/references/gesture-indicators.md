# Gesture Indicators

Five gesture hint animations that show users what physical interaction to perform. Each indicator loops continuously until the user performs the gesture or the tutorial phase advances. All indicators must be dismissable and must respect reduced motion preferences.

---

## 1. Tap Pulse

A pulsing translucent circle centered on the tap target. Communicates "tap here" without obscuring the element.

**Timing:** Opacity 0.3 -> 0.7 -> 0.3, scale 0.8 -> 1.2 -> 0.8, looping every 1.5s.

### iOS (SwiftUI)

```swift
struct TapPulseIndicator: View {
    @State private var isPulsing = false
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    let color: Color
    let size: CGFloat

    var body: some View {
        Circle()
            .fill(color.opacity(isPulsing ? 0.7 : 0.3))
            .frame(width: size, height: size)
            .scaleEffect(isPulsing ? 1.2 : 0.8)
            .animation(
                reduceMotion ? .none :
                    .easeInOut(duration: 0.75)
                    .repeatForever(autoreverses: true),
                value: isPulsing
            )
            .onAppear {
                if !reduceMotion {
                    isPulsing = true
                }
            }
            .allowsHitTesting(false)
    }
}

// Usage: overlay on target element
ZStack {
    targetButton
    TapPulseIndicator(color: .accentColor, size: 56)
}
```

### Web (React / CSS)

```tsx
"use client"

export function TapPulse({
  color = "#597794",
  size = 56,
}: {
  color?: string
  size?: number
}) {
  return (
    <div
      className="absolute rounded-full pointer-events-none motion-safe:animate-tap-pulse"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      }}
    />
  )
}
```

Add to Tailwind config:

```js
// tailwind.config.ts
keyframes: {
  'tap-pulse': {
    '0%, 100%': { opacity: '0.3', transform: 'translate(-50%, -50%) scale(0.8)' },
    '50%': { opacity: '0.7', transform: 'translate(-50%, -50%) scale(1.2)' },
  },
},
animation: {
  'tap-pulse': 'tap-pulse 1.5s ease-in-out infinite',
},
```

**Notes:** The `motion-safe:` Tailwind prefix automatically handles `prefers-reduced-motion`. When reduced motion is active, the pulse does not animate — it shows as a static semi-transparent circle.

---

## 2. Swipe Arrow

A hand icon with an arrow that slides in the swipe direction, fades, and loops. Communicates directional swipe gestures.

**Timing:** Translate 40px in swipe direction, fade in at start and out at end, loop every 2s with a 0.5s pause between cycles.

### iOS (SwiftUI)

```swift
struct SwipeArrowIndicator: View {
    enum Direction { case left, right, up, down }
    let direction: Direction
    @State private var offset: CGFloat = 0
    @State private var opacity: Double = 0
    @Environment(\.accessibilityReduceMotion) var reduceMotion

    private var translationVector: (x: CGFloat, y: CGFloat) {
        switch direction {
        case .left:  return (-40, 0)
        case .right: return (40, 0)
        case .up:    return (0, -40)
        case .down:  return (0, 40)
        }
    }

    private var arrowSystemName: String {
        switch direction {
        case .left:  return "hand.point.left.fill"
        case .right: return "hand.point.right.fill"
        case .up:    return "hand.point.up.fill"
        case .down:  return "hand.point.down.fill"
        }
    }

    var body: some View {
        Image(systemName: arrowSystemName)
            .font(.system(size: 28))
            .foregroundColor(.secondary)
            .offset(
                x: offset * (translationVector.x / 40),
                y: offset * (translationVector.y / 40)
            )
            .opacity(opacity)
            .onAppear {
                guard !reduceMotion else {
                    opacity = 0.5 // static hint
                    return
                }
                startLoop()
            }
            .allowsHitTesting(false)
    }

    private func startLoop() {
        // Fade in + slide
        withAnimation(.easeInOut(duration: 0.8)) {
            offset = 40
            opacity = 0.7
        }
        // Fade out at end of slide
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
            withAnimation(.easeOut(duration: 0.4)) {
                opacity = 0
            }
        }
        // Reset and loop
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            offset = 0
            opacity = 0
            startLoop()
        }
    }
}
```

### Web (React / Framer Motion)

```tsx
"use client"
import { motion, useReducedMotion } from "framer-motion"

type Direction = "left" | "right" | "up" | "down"

const directionMap: Record<Direction, { x: number; y: number }> = {
  left: { x: -40, y: 0 },
  right: { x: 40, y: 0 },
  up: { x: 0, y: -40 },
  down: { x: 0, y: 40 },
}

export function SwipeArrow({ direction }: { direction: Direction }) {
  const prefersReducedMotion = useReducedMotion()
  const { x, y } = directionMap[direction]

  if (prefersReducedMotion) {
    return (
      <div className="text-secondary opacity-50 text-2xl pointer-events-none">
        {direction === "left" ? "👈" : direction === "right" ? "👉" : direction === "up" ? "👆" : "👇"}
      </div>
    )
  }

  return (
    <motion.div
      className="text-2xl pointer-events-none"
      animate={{
        x: [0, x, x],
        y: [0, y, y],
        opacity: [0, 0.7, 0],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        repeatDelay: 0.5,
        ease: "easeInOut",
        times: [0, 0.6, 1],
      }}
    >
      {direction === "right" ? "👉" : direction === "left" ? "👈" : direction === "up" ? "👆" : "👇"}
    </motion.div>
  )
}
```

**Notes:** On iOS, use SF Symbols hand icons for native consistency. On web, emoji or SVG icons both work. The 0.5s `repeatDelay` creates a visual pause that prevents the loop from feeling frantic.

---

## 3. Drag Hand

A press-hold-drag sequence showing the full drag gesture. Three phases: press (scale down), drag (translate to destination), release (scale up + fade).

**Timing:** Press 200ms, drag 800ms, release 300ms, pause 500ms, total loop ~1.8s.

### iOS (SwiftUI)

```swift
struct DragHandIndicator: View {
    let from: CGPoint
    let to: CGPoint
    @State private var position: CGPoint
    @State private var scale: CGFloat = 1.0
    @State private var opacity: Double = 0.7
    @Environment(\.accessibilityReduceMotion) var reduceMotion

    init(from: CGPoint, to: CGPoint) {
        self.from = from
        self.to = to
        _position = State(initialValue: from)
    }

    var body: some View {
        Image(systemName: "hand.point.up.fill")
            .font(.system(size: 32))
            .foregroundColor(.secondary)
            .scaleEffect(scale)
            .opacity(opacity)
            .position(position)
            .onAppear {
                guard !reduceMotion else { return }
                startLoop()
            }
            .allowsHitTesting(false)
    }

    private func startLoop() {
        position = from
        opacity = 0.7
        scale = 1.0

        // Phase 1: Press (scale down)
        withAnimation(.easeIn(duration: 0.2)) {
            scale = 0.9
        }

        // Phase 2: Drag (translate)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            withAnimation(.easeInOut(duration: 0.8)) {
                position = to
            }
        }

        // Phase 3: Release (scale up + fade)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            withAnimation(.easeOut(duration: 0.3)) {
                scale = 1.1
                opacity = 0
            }
        }

        // Reset and loop
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
            startLoop()
        }
    }
}
```

### Web (React / Framer Motion)

```tsx
"use client"
import { motion, useReducedMotion } from "framer-motion"

interface DragHandProps {
  from: { x: number; y: number }
  to: { x: number; y: number }
}

export function DragHand({ from, to }: DragHandProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) return null

  return (
    <motion.div
      className="absolute text-3xl pointer-events-none"
      style={{ left: from.x, top: from.y }}
      animate={{
        x: [0, 0, to.x - from.x, to.x - from.x],
        y: [0, 0, to.y - from.y, to.y - from.y],
        scale: [1, 0.9, 0.9, 1.1],
        opacity: [0.7, 0.7, 0.7, 0],
      }}
      transition={{
        duration: 1.8,
        repeat: Infinity,
        repeatDelay: 0.5,
        times: [0, 0.11, 0.56, 0.72],
        ease: "easeInOut",
      }}
    >
      ✋
    </motion.div>
  )
}
```

---

## 4. Pinch Indicator

Two dots moving apart (or together) to indicate a pinch/zoom gesture. Less common in tutorials but necessary for map or image interactions.

**Timing:** Dots start at center, spread apart over 1s, pause 300ms, return over 1s, pause 300ms, loop.

### iOS (SwiftUI)

```swift
struct PinchIndicator: View {
    @State private var spread: CGFloat = 0
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    let maxSpread: CGFloat = 30

    var body: some View {
        ZStack {
            Circle()
                .fill(Color.secondary.opacity(0.6))
                .frame(width: 12, height: 12)
                .offset(x: -spread, y: -spread)

            Circle()
                .fill(Color.secondary.opacity(0.6))
                .frame(width: 12, height: 12)
                .offset(x: spread, y: spread)
        }
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(
                .easeInOut(duration: 1.0)
                .repeatForever(autoreverses: true)
            ) {
                spread = maxSpread
            }
        }
        .allowsHitTesting(false)
    }
}
```

### Web (React / CSS)

```tsx
"use client"

export function PinchIndicator({ spread = 30 }: { spread?: number }) {
  return (
    <div className="relative w-16 h-16 pointer-events-none">
      <div
        className="absolute w-3 h-3 rounded-full bg-secondary/60 motion-safe:animate-pinch-out"
        style={{ left: "50%", top: "50%", "--spread": `${spread}px` } as React.CSSProperties}
      />
      <div
        className="absolute w-3 h-3 rounded-full bg-secondary/60 motion-safe:animate-pinch-out-reverse"
        style={{ left: "50%", top: "50%", "--spread": `${spread}px` } as React.CSSProperties}
      />
    </div>
  )
}
```

Tailwind keyframes:

```js
keyframes: {
  'pinch-out': {
    '0%, 100%': { transform: 'translate(-50%, -50%) translate(0, 0)' },
    '50%': { transform: 'translate(-50%, -50%) translate(calc(-1 * var(--spread)), calc(-1 * var(--spread)))' },
  },
  'pinch-out-reverse': {
    '0%, 100%': { transform: 'translate(-50%, -50%) translate(0, 0)' },
    '50%': { transform: 'translate(-50%, -50%) translate(var(--spread), var(--spread))' },
  },
},
animation: {
  'pinch-out': 'pinch-out 2.3s ease-in-out infinite',
  'pinch-out-reverse': 'pinch-out-reverse 2.3s ease-in-out infinite',
},
```

---

## 5. Long Press Ring

A circular stroke that fills over time, indicating the user needs to hold (long press) for a specific duration. The ring fills clockwise from the top.

**Timing:** Ring fills over the required hold duration (e.g., 1s). If the user releases early, the ring resets. Show a subtle pulse when the ring completes.

### iOS (SwiftUI)

```swift
struct LongPressRing: View {
    let duration: Double // required hold time in seconds
    let size: CGFloat
    let color: Color
    @State private var progress: CGFloat = 0
    @State private var isAnimating = false

    var body: some View {
        ZStack {
            // Track
            Circle()
                .stroke(color.opacity(0.2), lineWidth: 3)

            // Fill
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    color,
                    style: StrokeStyle(lineWidth: 3, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(
                    isAnimating ?
                        .linear(duration: duration) :
                        .easeOut(duration: 0.2),
                    value: progress
                )
        }
        .frame(width: size, height: size)
        .allowsHitTesting(false)
    }

    func startFilling() {
        isAnimating = true
        progress = 1.0
    }

    func reset() {
        isAnimating = false
        progress = 0
    }
}
```

### Web (React / SVG)

```tsx
"use client"
import { motion } from "framer-motion"

export function LongPressRing({
  duration = 1,
  size = 56,
  color = "#597794",
  isHolding = false,
}: {
  duration?: number
  size?: number
  color?: string
  isHolding?: boolean
}) {
  const circumference = Math.PI * (size - 6) // subtract stroke width
  const radius = (size - 6) / 2

  return (
    <svg
      width={size}
      height={size}
      className="pointer-events-none -rotate-90"
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeOpacity={0.2}
        strokeWidth={3}
      />
      {/* Fill */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{
          strokeDashoffset: isHolding ? 0 : circumference,
        }}
        transition={{
          duration: isHolding ? duration : 0.2,
          ease: isHolding ? "linear" : "easeOut",
        }}
      />
    </svg>
  )
}
```

**Notes:** The ring fill is driven by `isHolding` state. When the user presses, set `isHolding = true` — the ring fills linearly over `duration`. On release, set `isHolding = false` — the ring quickly resets with ease-out. On completion, fire a pulse glow (see celebration-library.md) and a haptic (iOS).

---

## Reduced Motion Behavior

When reduced motion is active:
- **Tap Pulse:** Show static semi-transparent circle (no animation)
- **Swipe Arrow:** Show static arrow icon pointing in direction (no movement)
- **Drag Hand:** Hide entirely (too complex to communicate statically)
- **Pinch Indicator:** Show dots at max spread position (static)
- **Long Press Ring:** Still animate the ring fill — this is functional feedback, not decorative motion. Linear fill is low-motion and communicates necessary timing information.
