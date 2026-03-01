# Spotlight Animations

Four spotlight reveal patterns for tutorial overlays. Each pattern controls how the cutout in the overlay — the "spotlight" highlighting the target element — appears, moves, and transitions between tutorial phases.

All spotlight animations operate on a cutout within a full-screen semi-transparent overlay. The overlay itself is a fixed-position element covering the viewport, with the cutout rendered as either a CSS `clip-path`, an SVG mask, or (on iOS) a `CAShapeLayer` mask with a subtracted rounded rect path.

---

## Pattern 1: Expand From Point

The cutout starts as a 0px point at the center of the target element and expands outward to the full rounded rect. Creates a "revealing" feeling — the element was always there, the spotlight is uncovering it.

**When to use:** First spotlight in a tutorial (phase 1), or when drawing attention to a new element that was not previously highlighted. Best for "look here" moments.

### iOS (SwiftUI)

```swift
struct ExpandingSpotlight: View {
    let targetFrame: CGRect
    let padding: CGFloat = 8
    let cornerRadius: CGFloat = 12
    @State private var cutoutFrame: CGRect = .zero
    @State private var isRevealed = false

    var body: some View {
        GeometryReader { geometry in
            Color.black.opacity(0.6)
                .reverseMask {
                    RoundedRectangle(cornerRadius: isRevealed ? cornerRadius : 0)
                        .frame(
                            width: cutoutFrame.width,
                            height: cutoutFrame.height
                        )
                        .position(
                            x: cutoutFrame.midX,
                            y: cutoutFrame.midY
                        )
                }
                .ignoresSafeArea()
                .onAppear {
                    // Start at center point with zero size
                    cutoutFrame = CGRect(
                        x: targetFrame.midX,
                        y: targetFrame.midY,
                        width: 0,
                        height: 0
                    )

                    // Expand to full size with spring
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                        cutoutFrame = targetFrame.insetBy(
                            dx: -padding,
                            dy: -padding
                        )
                        isRevealed = true
                    }
                }
        }
    }
}

// Helper: reverse mask modifier
extension View {
    @ViewBuilder func reverseMask<Mask: View>(
        @ViewBuilder _ mask: () -> Mask
    ) -> some View {
        self.mask(
            ZStack {
                Rectangle()
                mask()
                    .blendMode(.destinationOut)
            }
            .compositingGroup()
        )
    }
}
```

**Performance notes (iOS):**
- The `reverseMask` modifier uses `compositingGroup()` which composites to an offscreen buffer. This is acceptable for a single overlay but avoid nesting multiple compositing groups.
- The spring animation on `cutoutFrame` animates the frame dimensions. SwiftUI handles this efficiently as a single interpolated state change.
- Haptic pairing: fire `UIImpactFeedbackGenerator(style: .light).impactOccurred()` at the start of the expansion.

### Web (React / Next.js)

```tsx
"use client"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

interface SpotlightProps {
  targetRect: DOMRect | null
  padding?: number
  borderRadius?: number
}

export function ExpandingSpotlight({
  targetRect,
  padding = 8,
  borderRadius = 12,
}: SpotlightProps) {
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (targetRect) {
      setOrigin({
        x: targetRect.left + targetRect.width / 2,
        y: targetRect.top + targetRect.height / 2,
      })
    }
  }, [targetRect])

  if (!targetRect || !origin) return null

  const finalX = targetRect.left - padding
  const finalY = targetRect.top - padding
  const finalW = targetRect.width + padding * 2
  const finalH = targetRect.height + padding * 2

  // Using clip-path with inset for the cutout
  // The overlay is full screen; the motion.div is the cutout highlight
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay with animated cutout using SVG mask */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <motion.rect
              initial={{
                x: origin.x,
                y: origin.y,
                width: 0,
                height: 0,
                rx: 0,
              }}
              animate={{
                x: finalX,
                y: finalY,
                width: finalW,
                height: finalH,
                rx: borderRadius,
              }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 25,
              }}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#spotlight-mask)"
        />
      </svg>
    </div>
  )
}
```

**Performance notes (web):**
- SVG mask with Framer Motion animating the `<rect>` attributes. This is GPU-composited and performs well.
- Alternative approach: use `clip-path: inset()` with CSS transitions — simpler but less flexible for rounded corners.
- The SVG mask approach allows arbitrary cutout shapes including rounded rects.

---

## Pattern 2: Morph Between Shapes

The cutout smoothly morphs from its previous position/size/shape to the new target. The spotlight appears to slide and resize fluidly across the screen. This is the most common transition between tutorial phases.

**When to use:** Transitioning between phases where both the previous and new target are visible on screen. The continuity of the morph reinforces the flow of the tutorial.

### iOS (SwiftUI)

```swift
struct MorphingSpotlight: View {
    let targetFrame: CGRect
    let padding: CGFloat = 8
    let cornerRadius: CGFloat = 12
    @State private var currentFrame: CGRect

    init(targetFrame: CGRect) {
        self.targetFrame = targetFrame
        _currentFrame = State(initialValue: targetFrame)
    }

    var body: some View {
        Color.black.opacity(0.6)
            .reverseMask {
                RoundedRectangle(cornerRadius: cornerRadius)
                    .frame(
                        width: currentFrame.width + padding * 2,
                        height: currentFrame.height + padding * 2
                    )
                    .position(
                        x: currentFrame.midX,
                        y: currentFrame.midY
                    )
            }
            .ignoresSafeArea()
            .onChange(of: targetFrame) { newFrame in
                withAnimation(.spring(response: 0.35, dampingFraction: 0.75)) {
                    currentFrame = newFrame
                }
            }
    }
}
```

Alternatively, use `matchedGeometryEffect` if each spotlight target has a stable identity:

```swift
// In parent view
@Namespace private var spotlightNamespace

// On the cutout shape
RoundedRectangle(cornerRadius: cornerRadius)
    .matchedGeometryEffect(id: "spotlight", in: spotlightNamespace)
```

**Performance notes (iOS):**
- `.matchedGeometryEffect` handles both position and size interpolation automatically. Preferred when using SwiftUI's view identity system.
- Manual frame animation via `onChange` gives more control over timing and spring parameters.
- Both approaches are efficient — SwiftUI animates the mask path on the compositing layer.

### Web (React / Next.js)

```tsx
"use client"
import { motion } from "framer-motion"

interface MorphSpotlightProps {
  targetRect: DOMRect
  padding?: number
  borderRadius?: number
}

export function MorphingSpotlight({
  targetRect,
  padding = 8,
  borderRadius = 12,
}: MorphSpotlightProps) {
  const x = targetRect.left - padding
  const y = targetRect.top - padding
  const w = targetRect.width + padding * 2
  const h = targetRect.height + padding * 2

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-morph-mask">
            <rect width="100%" height="100%" fill="white" />
            <motion.rect
              animate={{ x, y, width: w, height: h, rx: borderRadius }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 25,
              }}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#spotlight-morph-mask)"
        />
      </svg>
    </div>
  )
}
```

Using Framer Motion `layoutId` as an alternative:

```tsx
// When each spotlight target is a distinct component
<motion.div layoutId="spotlight-cutout" className="absolute rounded-xl" style={{
  left: targetRect.left - padding,
  top: targetRect.top - padding,
  width: targetRect.width + padding * 2,
  height: targetRect.height + padding * 2,
}} transition={{ type: "spring", stiffness: 200, damping: 25 }} />
```

**Performance notes (web):**
- Framer Motion interpolates all four SVG rect attributes simultaneously. The spring type ensures natural deceleration.
- When `targetRect` prop changes, the animation automatically transitions from current to new values — no explicit "from" state needed.
- The `layoutId` approach is cleaner but requires the component to unmount/remount between phases. Use the SVG mask approach when the spotlight persists across re-renders.

---

## Pattern 3: Fade Transition

The old cutout fades out, then the new cutout fades in at the new position. Creates a clean break between phases — no spatial continuity. The spotlight disappears and reappears.

**When to use:** When transitioning between different screens or tabs where a morph would travel across unrelated UI. Also use when the new target is far from the previous one and a morph would look disorienting.

### iOS (SwiftUI)

```swift
struct FadingSpotlight: View {
    let targetFrame: CGRect
    let padding: CGFloat = 8
    let cornerRadius: CGFloat = 12
    @State private var overlayOpacity: Double = 0

    var body: some View {
        Color.black.opacity(0.6 * overlayOpacity)
            .reverseMask {
                RoundedRectangle(cornerRadius: cornerRadius)
                    .frame(
                        width: targetFrame.width + padding * 2,
                        height: targetFrame.height + padding * 2
                    )
                    .position(
                        x: targetFrame.midX,
                        y: targetFrame.midY
                    )
            }
            .ignoresSafeArea()
            .onAppear {
                withAnimation(.easeInOut(duration: 0.3)) {
                    overlayOpacity = 1
                }
            }
    }

    func transitionToNewTarget() {
        // Fade out
        withAnimation(.easeOut(duration: 0.15)) {
            overlayOpacity = 0
        }
        // After fade out completes, update target and fade in
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            // targetFrame updates here via binding
            withAnimation(.easeIn(duration: 0.2)) {
                overlayOpacity = 1
            }
        }
    }
}
```

### Web (React / Next.js)

```tsx
"use client"
import { AnimatePresence, motion } from "framer-motion"

interface FadeSpotlightProps {
  targetRect: DOMRect
  phaseKey: string // unique key per phase to trigger AnimatePresence
  padding?: number
  borderRadius?: number
}

export function FadingSpotlight({
  targetRect,
  phaseKey,
  padding = 8,
  borderRadius = 12,
}: FadeSpotlightProps) {
  const x = targetRect.left - padding
  const y = targetRect.top - padding
  const w = targetRect.width + padding * 2
  const h = targetRect.height + padding * 2

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.svg
          key={phaseKey}
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <defs>
            <mask id={`spotlight-fade-${phaseKey}`}>
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={x} y={y} width={w} height={h}
                rx={borderRadius}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%" height="100%"
            fill="rgba(0,0,0,0.6)"
            mask={`url(#spotlight-fade-${phaseKey})`}
          />
        </motion.svg>
      </AnimatePresence>
    </div>
  )
}
```

**Performance notes:**
- The fade approach is the cheapest — only opacity is animated. No layout recalculation, no path interpolation.
- Use `AnimatePresence mode="wait"` to ensure the old spotlight fully exits before the new one enters.
- On iOS, the `DispatchQueue.main.asyncAfter` introduces a manual delay. For tighter control, use a `Transaction` with explicit completion handlers.

---

## Pattern 4: Slide + Morph

The cutout slides horizontally or vertically while simultaneously morphing size. Creates a strong directional sense — the tutorial is "moving forward" through the interface.

**When to use:** Same-screen transitions where both targets are visible and you want to emphasize directionality. Best for sequential elements (e.g., moving from one form field to the next, or from a button to a panel it opens).

### iOS (SwiftUI)

```swift
struct SlideSpotlight: View {
    let targetFrame: CGRect
    let padding: CGFloat = 8
    let cornerRadius: CGFloat = 12
    @State private var displayFrame: CGRect

    init(targetFrame: CGRect) {
        self.targetFrame = targetFrame
        _displayFrame = State(initialValue: targetFrame)
    }

    var body: some View {
        Color.black.opacity(0.6)
            .reverseMask {
                RoundedRectangle(cornerRadius: cornerRadius)
                    .frame(
                        width: displayFrame.width + padding * 2,
                        height: displayFrame.height + padding * 2
                    )
                    .position(
                        x: displayFrame.midX,
                        y: displayFrame.midY
                    )
            }
            .ignoresSafeArea()
            .onChange(of: targetFrame) { newFrame in
                // Use a slightly stiffer spring for the slide component
                // and a softer spring for the size morph
                withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                    displayFrame = newFrame
                }
            }
    }
}
```

### Web (React / Next.js)

```tsx
"use client"
import { motion } from "framer-motion"

interface SlideSpotlightProps {
  targetRect: DOMRect
  padding?: number
  borderRadius?: number
}

export function SlideSpotlight({
  targetRect,
  padding = 8,
  borderRadius = 12,
}: SlideSpotlightProps) {
  const x = targetRect.left - padding
  const y = targetRect.top - padding
  const w = targetRect.width + padding * 2
  const h = targetRect.height + padding * 2

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-slide-mask">
            <rect width="100%" height="100%" fill="white" />
            <motion.rect
              animate={{ x, y, width: w, height: h, rx: borderRadius }}
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 28,
                // Slightly stiffer than morph for snappier directional feel
              }}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#spotlight-slide-mask)"
        />
      </svg>
    </div>
  )
}
```

**Performance notes:**
- Slide + morph is essentially the same implementation as Pattern 2 (morph) but with a stiffer spring. The directional feeling comes from the spring parameters, not a different technique.
- Stiffness of 250 and damping of 28 gives a snappier feel than the standard morph (200, 25). The cutout moves quickly and settles fast.
- For long-distance slides (more than half the viewport), consider using Pattern 3 (fade) instead — a morph across the entire screen can feel slow and distracting.

---

## Choosing the Right Pattern

| Scenario | Pattern | Why |
|---|---|---|
| First spotlight appearance | Expand From Point | Draws focus to the element being introduced |
| Moving between nearby elements | Morph Between Shapes | Continuity shows relationship |
| Moving between different screens/tabs | Fade Transition | Clean break avoids disorienting travel |
| Sequential form fields or list items | Slide + Morph | Directionality reinforces progress |
| Target far from previous target | Fade Transition | Long morphs are distracting |
| Returning to a previously seen element | Morph Between Shapes | Familiarity of the morph reinforces recognition |

## Reduced Motion

When reduced motion is enabled, all four patterns collapse to the same behavior: the cutout appears instantly at the target position with no animation. Apply a 100ms opacity fade as the only transition — this is acceptable under reduced motion guidelines.
