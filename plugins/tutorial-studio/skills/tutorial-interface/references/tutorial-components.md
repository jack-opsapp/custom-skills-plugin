# Tutorial Components

Full design specifications for seven tutorial UI components. Each component includes measurements, padding, typography, color tokens, and code examples for both iOS (SwiftUI) and web (React/Next.js with Tailwind).

All specifications reference the OPS design system. Substitute the appropriate tokens from the project's design system files when values differ.

---

## 1. Tooltip

The primary communication element of the tutorial. Anchored to the spotlight target with an arrow pointing at the element.

### Visual Spec

| Property | Value | Notes |
|---|---|---|
| Background | Surface +2 elevation | Slightly lighter than app bg in dark mode |
| Border | 1px, rgba(255,255,255,0.08) | Dark mode. Light mode: rgba(0,0,0,0.06) |
| Border radius | 12px (iOS), 8px (web) | Match app card radius convention |
| Padding | 16px horizontal, 12px vertical | Consistent on all sides |
| Max width | 320px (mobile), 400px (desktop/web) | Prevent text walls |
| Min width | 200px | Prevent narrow tooltips on short text |
| Shadow | 0 4px 16px rgba(0,0,0,0.3) | Dark mode. Light mode: 0 4px 16px rgba(0,0,0,0.08) |

### Arrow

| Property | Value |
|---|---|
| Shape | Equilateral triangle |
| Size | 8px base, 6px height |
| Fill | Same as tooltip background |
| Border | Continues tooltip border on two visible edges |
| Position | Centered on the edge closest to spotlight target |

### Text Hierarchy

| Element | Font | Size | Weight | Color |
|---|---|---|---|---|
| Headline | Mohave (heading font) | 16px / 16pt | Bold (700) | Primary text color |
| Description | Kosugi (body font) | 14px / 14pt | Regular (400) | Secondary text color |
| Phase label | Kosugi (body font) | 12px / 12pt | Regular (400) | Tertiary text color |

### Integrated Progress Bar

A thin bar at the very top of the tooltip, inside the border radius.

| Property | Value |
|---|---|
| Height | 2px |
| Position | Top of tooltip, inside border |
| Track color | Border color (same as tooltip border) |
| Fill color | Accent color (#597794) |
| Animation | Width transition, 300ms ease-out |
| Border radius | Follows tooltip top corners |

### iOS (SwiftUI)

```swift
struct TutorialTooltip: View {
    let headline: String
    let description: String
    let progress: Double // 0.0 to 1.0
    let arrowEdge: Edge

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.secondary.opacity(0.15))
                    Rectangle()
                        .fill(Color.accentColor)
                        .frame(width: geo.size.width * progress)
                        .animation(.easeOut(duration: 0.3), value: progress)
                }
            }
            .frame(height: 2)
            .clipShape(
                UnevenRoundedRectangle(
                    topLeadingRadius: 12,
                    topTrailingRadius: 12
                )
            )

            VStack(alignment: .leading, spacing: 6) {
                Text(headline)
                    .font(.custom("Mohave", size: 16).weight(.bold))
                    .foregroundColor(.primary)

                Text(description)
                    .font(.custom("Kosugi", size: 14))
                    .foregroundColor(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .frame(maxWidth: 320)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground).opacity(0.95))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.3), radius: 8, y: 4)
        )
    }
}
```

### Web (React / Tailwind)

```tsx
interface TooltipProps {
  headline: string
  description: string
  progress: number // 0 to 1
  arrowDirection: "top" | "bottom" | "left" | "right"
}

export function TutorialTooltip({
  headline,
  description,
  progress,
  arrowDirection,
}: TooltipProps) {
  return (
    <div className="relative max-w-[320px] min-w-[200px] md:max-w-[400px] rounded-lg border border-white/[0.08] bg-surface-elevated shadow-lg shadow-black/30">
      {/* Progress bar */}
      <div className="h-0.5 w-full overflow-hidden rounded-t-lg bg-border">
        <div
          className="h-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <h3 className="font-mohave text-base font-bold text-primary">
          {headline}
        </h3>
        <p className="mt-1.5 font-kosugi text-sm text-secondary">
          {description}
        </p>
      </div>

      {/* Arrow (positioned by parent based on arrowDirection) */}
      <div className={`
        absolute w-0 h-0
        border-[6px] border-transparent
        ${arrowDirection === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 border-b-surface-elevated' : ''}
        ${arrowDirection === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 border-t-surface-elevated' : ''}
        ${arrowDirection === 'left' ? 'right-full top-1/2 -translate-y-1/2 border-r-surface-elevated' : ''}
        ${arrowDirection === 'right' ? 'left-full top-1/2 -translate-y-1/2 border-l-surface-elevated' : ''}
      `} />
    </div>
  )
}
```

---

## 2. Overlay

Full-screen surface that darkens the app and contains the spotlight cutout.

### Standard Overlay

| Property | Value |
|---|---|
| Background | rgba(0, 0, 0, 0.6) — dark mode |
| Background (light) | rgba(0, 0, 0, 0.4) — light mode |
| Position | Fixed, full viewport |
| Z-index | 50 (web) |
| Transition | Opacity 200ms ease |

### Premium Overlay (Blur Variant)

| Property | Value |
|---|---|
| Background | rgba(0, 0, 0, 0.4) |
| Backdrop filter | blur(8px) |
| Position | Fixed, full viewport |
| Z-index | 50 (web) |
| Transition | Opacity 200ms ease |

**Performance warning:** Backdrop blur is expensive on low-end devices. Test on the target device range. Fall back to standard overlay if frame rate drops below 45fps during transitions.

### Cutout

| Property | Value |
|---|---|
| Shape | Rounded rectangle |
| Bounds | Target element bounds + padding |
| Padding | 8px on all sides |
| Border radius | Target element radius + 4px |
| Implementation | SVG mask (web), reverse mask compositing (iOS) |

### iOS

```swift
// Standard overlay
Color.black.opacity(0.6)
    .reverseMask {
        RoundedRectangle(cornerRadius: cutoutRadius)
            .frame(width: cutoutFrame.width, height: cutoutFrame.height)
            .position(x: cutoutFrame.midX, y: cutoutFrame.midY)
    }
    .ignoresSafeArea()
    .transition(.opacity.animation(.easeInOut(duration: 0.2)))

// Premium overlay with blur
Rectangle()
    .fill(.ultraThinMaterial)
    .reverseMask {
        RoundedRectangle(cornerRadius: cutoutRadius)
            .frame(width: cutoutFrame.width, height: cutoutFrame.height)
            .position(x: cutoutFrame.midX, y: cutoutFrame.midY)
    }
    .ignoresSafeArea()
```

### Web

```tsx
// Standard overlay with SVG mask
<div className="fixed inset-0 z-50 transition-opacity duration-200">
  <svg className="absolute inset-0 w-full h-full">
    <defs>
      <mask id="overlay-mask">
        <rect width="100%" height="100%" fill="white" />
        <rect
          x={cutout.x} y={cutout.y}
          width={cutout.width} height={cutout.height}
          rx={cutout.radius}
          fill="black"
        />
      </mask>
    </defs>
    <rect
      width="100%" height="100%"
      fill="rgba(0,0,0,0.6)"
      mask="url(#overlay-mask)"
    />
  </svg>
</div>

// Premium overlay (add backdrop-blur)
<div className="fixed inset-0 z-50 backdrop-blur-sm">
  {/* Same SVG mask structure, fill rgba(0,0,0,0.4) */}
</div>
```

---

## 3. Action Bar

Fixed bottom bar containing tutorial navigation controls.

### Layout Spec

| Property | Value |
|---|---|
| Position | Fixed bottom |
| Background | Surface color (same as tooltip bg) |
| Top border | 1px, rgba(255,255,255,0.08) |
| Padding | 16px horizontal, 12px vertical + safe area bottom |
| Z-index | 51 (above overlay) |
| Layout | Flexbox, space-between |

### Buttons

| Button | Style | Min Height | Min Width | Font |
|---|---|---|---|---|
| Continue | Accent bg, white text, full rounded | 44px | 120px | Mohave 14px bold |
| Skip | Text-only, secondary color | 44px | — | Kosugi 14px |
| Back | Ghost, chevron + "Back" | 44px | — | Kosugi 14px |

### Button Layout Rules

- Back button on the left, Skip in the center (or absent), Continue on the right.
- If no Back is available (first phase), the left side is empty — Continue stays on the right.
- If no Skip is available, the center is empty.
- Continue button is always the rightmost element and the most visually prominent.

### iOS

```swift
struct TutorialActionBar: View {
    let canGoBack: Bool
    let canSkip: Bool
    let onBack: () -> Void
    let onSkip: () -> Void
    let onContinue: () -> Void

    var body: some View {
        HStack {
            if canGoBack {
                Button(action: onBack) {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 14, weight: .medium))
                        Text("Back")
                            .font(.custom("Kosugi", size: 14))
                    }
                    .foregroundColor(.secondary)
                }
                .frame(minHeight: 44)
            }

            Spacer()

            if canSkip {
                Button(action: onSkip) {
                    Text("Skip")
                        .font(.custom("Kosugi", size: 14))
                        .foregroundColor(.secondary)
                }
                .frame(minHeight: 44)
            }

            Spacer()

            Button(action: onContinue) {
                Text("Continue")
                    .font(.custom("Mohave", size: 14).weight(.bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 24)
                    .frame(minHeight: 44, minWidth: 120)
                    .background(Color.accentColor)
                    .clipShape(Capsule())
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .padding(.bottom, safeAreaBottomInset)
        .background(
            Color(.systemBackground)
                .opacity(0.95)
                .overlay(alignment: .top) {
                    Divider().opacity(0.08)
                }
        )
    }
}
```

### Web

```tsx
export function TutorialActionBar({
  canGoBack,
  canSkip,
  onBack,
  onSkip,
  onContinue,
}: {
  canGoBack: boolean
  canSkip: boolean
  onBack: () => void
  onSkip: () => void
  onContinue: () => void
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[51] border-t border-white/[0.08] bg-surface/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
      <div className="flex items-center justify-between">
        <div className="min-w-[80px]">
          {canGoBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sm text-secondary hover:text-primary min-h-[44px]"
            >
              <svg className="w-3.5 h-3.5" /* chevron left */ />
              <span className="font-kosugi">Back</span>
            </button>
          )}
        </div>

        {canSkip && (
          <button
            onClick={onSkip}
            className="font-kosugi text-sm text-secondary hover:text-primary min-h-[44px]"
          >
            Skip
          </button>
        )}

        <div className="min-w-[120px] flex justify-end">
          <button
            onClick={onContinue}
            className="font-mohave text-sm font-bold text-white bg-accent hover:bg-accent/90 rounded-full px-6 min-h-[44px] min-w-[120px] transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 4. Progress Indicator

Two variants: bar and dots.

### Bar Variant

| Property | Value |
|---|---|
| Height | 2px |
| Width | Full tooltip width (inside tooltip) or full screen width (standalone) |
| Track | Border color, full width |
| Fill | Accent color, width = progress percentage |
| Animation | Width 300ms ease-out |
| Milestone pulse | At 25%, 50%, 75%: accent brightens to accent-light for 200ms |

### Dots Variant

| Property | Value |
|---|---|
| Dot size | 6px diameter |
| Dot gap | 8px between centers |
| Filled color | Accent |
| Unfilled color | Border color |
| Current dot | 8px diameter (slightly larger) |
| Animation | Color transition 200ms, size transition 150ms spring |

### iOS

```swift
// Bar variant (inside tooltip, shown above)

// Dots variant
struct ProgressDots: View {
    let totalPhases: Int
    let currentPhase: Int

    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<totalPhases, id: \.self) { index in
                Circle()
                    .fill(index <= currentPhase ? Color.accentColor : Color.secondary.opacity(0.15))
                    .frame(
                        width: index == currentPhase ? 8 : 6,
                        height: index == currentPhase ? 8 : 6
                    )
                    .animation(.spring(response: 0.15), value: currentPhase)
            }
        }
    }
}
```

### Web

```tsx
// Dots variant
export function ProgressDots({
  total,
  current,
}: {
  total: number
  current: number
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`
            rounded-full transition-all duration-150
            ${i <= current ? "bg-accent" : "bg-border"}
            ${i === current ? "w-2 h-2" : "w-1.5 h-1.5"}
          `}
        />
      ))}
    </div>
  )
}
```

---

## 5. Swipe Indicator

Visual hint positioned near the target element to indicate a swipe gesture is needed.

### Spec

| Property | Value |
|---|---|
| Hand icon | 24px, secondary color |
| Arrow icon | 16px chevron, secondary color |
| Position | Center of cutout area, or below cutout |
| Animation | See tutorial-animations gesture-indicators.md |
| Z-index | Above overlay, below tooltip |

Delegate all animation behavior to `tutorial-animations/references/gesture-indicators.md`. This component spec covers only visual styling and positioning.

---

## 6. Completion Screen

Full-screen celebration view when the tutorial finishes.

### Layout Spec

| Property | Value |
|---|---|
| Layout | Centered vertical stack |
| Background | App background with subtle overlay or blur |
| Padding | 24px horizontal |
| Content alignment | Center |

### Content Hierarchy

1. **Completion icon/animation** — checkmark or celebration, 80px, centered
2. **Headline** — "Tutorial Complete" or similar, Mohave 24px bold, primary color, 16px below icon
3. **Time display** — Mohave 48px bold, accent color, 24px below headline. Shows seconds with "s" suffix.
4. **Secondary stats** — Cards in a horizontal row or 2-column grid, 16px below time
   - Each card: 8px padding, surface+1 bg, border, rounded
   - Icon (20px) + number (Mohave 20px bold) + label (Kosugi 12px secondary)
5. **CTA button** — "Start Using OPS", accent bg, white text, full width, 32px below stats
   - Same styling as Continue button but larger: 52px height, Mohave 16px bold

### Celebration Layer

Confetti or particles render BEHIND the content (lower z-index than the stats and button). See `tutorial-animations/references/celebration-library.md` for implementation.

### iOS

```swift
struct TutorialCompletionScreen: View {
    let completionTime: Int // seconds
    let phasesCompleted: Int
    let totalPhases: Int

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            // Checkmark
            AnimatedCheckmark(size: 80, color: .accentColor)

            // Headline
            Text("Tutorial Complete")
                .font(.custom("Mohave", size: 24).weight(.bold))
                .foregroundColor(.primary)
                .padding(.top, 16)

            // Time
            Text("\(completionTime)s")
                .font(.custom("Mohave", size: 48).weight(.bold))
                .foregroundColor(.accentColor)
                .padding(.top, 24)

            // Stats row
            HStack(spacing: 12) {
                StatCard(icon: "checkmark.circle", value: "\(phasesCompleted)", label: "Completed")
                StatCard(icon: "clock", value: "\(completionTime)", label: "Seconds")
            }
            .padding(.top, 16)

            Spacer()

            // CTA
            Button(action: { /* dismiss tutorial */ }) {
                Text("Start Using OPS")
                    .font(.custom("Mohave", size: 16).weight(.bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(Color.accentColor)
                    .clipShape(Capsule())
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 32)
        }
        .padding(.horizontal, 24)
    }
}
```

---

## 7. Inline Sheet

A bottom sheet used during tutorial phases that require form interaction.

### Spec

| Property | Value |
|---|---|
| Background | Surface elevated +1 |
| Top corners | 16px radius |
| Bottom corners | 0px (attached to screen bottom) |
| Max height | 70% of screen height |
| Drag handle | None — tutorial controls the sheet |
| Dismiss gesture | Disabled — tutorial controls dismissal |
| Content | Scrollable if exceeds height |
| Padding | 20px horizontal, 16px vertical top, safe area bottom |
| Border | Top border only, 1px, rgba(255,255,255,0.08) |
| Shadow | 0 -4px 16px rgba(0,0,0,0.2) |

### Behavior

- The sheet appears and disappears based on the tutorial phase, not user gesture.
- Content inside the sheet is the actual app form/view — not a tutorial mock.
- Reduce chrome: no title bar, no close button, no drag indicator. The tutorial overlay and tooltip provide all navigation context.
- If content exceeds max height, enable vertical scrolling. Show a subtle fade gradient at the bottom to indicate more content.

### iOS

```swift
struct TutorialInlineSheet<Content: View>: View {
    let content: Content
    @State private var contentHeight: CGFloat = 0
    let maxHeight: CGFloat

    init(maxHeight: CGFloat = UIScreen.main.bounds.height * 0.7,
         @ViewBuilder content: () -> Content) {
        self.maxHeight = maxHeight
        self.content = content()
    }

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            ScrollView {
                content
                    .padding(.horizontal, 20)
                    .padding(.top, 16)
                    .padding(.bottom, 16)
            }
            .frame(maxHeight: maxHeight)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(Color(.secondarySystemBackground))
                    .overlay(alignment: .top) {
                        Rectangle()
                            .fill(Color.white.opacity(0.08))
                            .frame(height: 1)
                    }
            )
            .clipShape(
                UnevenRoundedRectangle(
                    topLeadingRadius: 16,
                    topTrailingRadius: 16
                )
            )
            .shadow(color: .black.opacity(0.2), radius: 8, y: -4)
        }
        .ignoresSafeArea(edges: .bottom)
    }
}
```

### Web

```tsx
export function TutorialInlineSheet({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[52] max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-white/[0.08] bg-surface-elevated shadow-[0_-4px_16px_rgba(0,0,0,0.2)]">
      <div className="px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        {children}
      </div>
    </div>
  )
}
```

---

## Component Relationships

The tutorial UI layers stack as follows (bottom to top):

1. **App content** — real app views, z-index auto
2. **Overlay** — semi-transparent with cutout, z-index 50
3. **Spotlight border** (optional) — subtle ring around cutout, z-index 50
4. **Swipe indicator** — gesture hint, z-index 50
5. **Tooltip** — anchored to spotlight, z-index 51
6. **Inline sheet** — bottom sheet, z-index 52
7. **Action bar** — fixed bottom, z-index 53
8. **Celebration layer** — confetti/particles, z-index 54

This ordering ensures that tooltips are always readable, the action bar is always accessible, and celebrations appear above everything.
