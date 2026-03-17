// phase-animator-loader.swift
// Multi-phase loading indicator using PhaseAnimator.
// 3+ phases: scale, rotation, opacity. Reduced motion alternative.
// Requires: iOS 17+ | Xcode 16+

import SwiftUI

// MARK: - Phase Definition

/// Each phase defines a discrete visual state.
/// The PhaseAnimator cycles through these continuously.
enum LoaderPhase: CaseIterable {
    case rest       // Baseline: dots at normal scale, no rotation
    case gather     // Dots contract toward center, slight fade
    case spin       // Rotation with increased opacity
    case expand     // Dots push outward, full brightness
    case settle     // Return toward rest with slight overshoot

    /// Scale applied to the dot orbit radius.
    var orbitScale: CGFloat {
        switch self {
        case .rest:     1.0
        case .gather:   0.6
        case .spin:     0.7
        case .expand:   1.2
        case .settle:   1.05
        }
    }

    /// Rotation applied to the dot group (degrees).
    var rotation: Double {
        switch self {
        case .rest:     0
        case .gather:   0
        case .spin:     120
        case .expand:   180
        case .settle:   200
        }
    }

    /// Opacity of each dot.
    var dotOpacity: Double {
        switch self {
        case .rest:     0.5
        case .gather:   0.4
        case .spin:     0.8
        case .expand:   1.0
        case .settle:   0.7
        }
    }

    /// Scale of individual dots.
    var dotScale: CGFloat {
        switch self {
        case .rest:     1.0
        case .gather:   0.8
        case .spin:     0.9
        case .expand:   1.3
        case .settle:   1.0
        }
    }

    /// The animation to use when transitioning TO this phase.
    var animation: Animation {
        switch self {
        case .rest:
            // Settling back to baseline: gentle ease-in-out
            .easeInOut(duration: 0.5)
        case .gather:
            // Contracting: smooth pull inward
            .easeIn(duration: 0.3)
        case .spin:
            // Rotation: constant-ish speed
            .easeInOut(duration: 0.5)
        case .expand:
            // Burst outward: spring with slight overshoot
            .spring(response: 0.3, dampingFraction: 0.7)
            // dampingFraction 0.7 = controlled overshoot, feels energetic
        case .settle:
            // Settling from expansion: smooth deceleration
            .easeOut(duration: 0.25)
        }
    }
}

// MARK: - PhaseAnimator Loader

/// A loading indicator built entirely with PhaseAnimator.
/// Three dots orbit a center point, cycling through 5 phases.
struct PhaseAnimatorLoader: View {
    /// Number of dots in the loader
    private let dotCount = 3

    /// Radius of the dot orbit (before phase scaling)
    private let orbitRadius: CGFloat = 16

    /// Size of each dot
    private let dotSize: CGFloat = 8

    /// Brand accent color
    private let accentColor = Color(red: 0.35, green: 0.47, blue: 0.58) // #597794

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Group {
            if reduceMotion {
                reducedMotionLoader
            } else {
                fullMotionLoader
            }
        }
        .frame(width: 56, height: 56)
    }

    // MARK: Full Motion

    /// The full PhaseAnimator-driven loader.
    private var fullMotionLoader: some View {
        PhaseAnimator(LoaderPhase.allCases) { phase in
            ZStack {
                ForEach(0..<dotCount, id: \.self) { index in
                    let angle = Angle.degrees(Double(index) * (360.0 / Double(dotCount)))
                    let radius = orbitRadius * phase.orbitScale

                    Circle()
                        .fill(accentColor)
                        .frame(width: dotSize, height: dotSize)
                        .scaleEffect(phase.dotScale)
                        .opacity(phase.dotOpacity)
                        .offset(
                            x: cos(angle.radians) * radius,
                            y: sin(angle.radians) * radius
                        )
                }
            }
            .rotationEffect(.degrees(phase.rotation))
        } animation: { phase in
            phase.animation
        }
    }

    // MARK: Reduced Motion

    /// Reduced motion alternative: dots pulse opacity only, no movement.
    /// Serves the same "loading" emotional beat without vestibular triggers.
    private var reducedMotionLoader: some View {
        HStack(spacing: 8) {
            ForEach(0..<dotCount, id: \.self) { index in
                Circle()
                    .fill(accentColor)
                    .frame(width: dotSize, height: dotSize)
                    .phaseAnimator([0.3, 0.8]) { content, opacity in
                        content.opacity(opacity)
                    } animation: { _ in
                        // Each dot pulses with a slight stagger
                        .easeInOut(duration: 0.8)
                            .delay(Double(index) * 0.2)
                    }
            }
        }
    }
}

// MARK: - Composable Loader Container

/// A reusable container that displays the loader with optional label.
struct LoadingIndicator: View {
    let label: String?

    init(_ label: String? = nil) {
        self.label = label
    }

    var body: some View {
        VStack(spacing: 12) {
            PhaseAnimatorLoader()

            if let label {
                Text(label.uppercased())
                    .font(.caption2.weight(.semibold))
                    .tracking(1.5)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

// MARK: - Trigger-Based Variant

/// A one-shot success animation that cycles through phases once when triggered.
/// Use for completion states (e.g., form submitted, sync complete).
enum CompletionPhase: CaseIterable {
    case hidden     // Not visible
    case appear     // Scale in from 0
    case stamp      // Overshoot to 1.15x
    case settle     // Return to 1.0x
    case glow       // Brief brightness pulse
    case rest       // Final resting state

    var scale: CGFloat {
        switch self {
        case .hidden:   0.0
        case .appear:   0.8
        case .stamp:    1.15
        case .settle:   1.0
        case .glow:     1.0
        case .rest:     1.0
        }
    }

    var opacity: Double {
        switch self {
        case .hidden:   0.0
        case .appear:   0.8
        case .stamp:    1.0
        case .settle:   1.0
        case .glow:     1.0
        case .rest:     0.9
        }
    }

    var brightness: Double {
        switch self {
        case .glow:     0.3
        default:        0.0
        }
    }
}

struct CompletionStamp: View {
    @State private var triggerCount = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Image(systemName: "checkmark.circle.fill")
            .font(.system(size: 48))
            .foregroundStyle(Color(red: 0.35, green: 0.47, blue: 0.58))
            .phaseAnimator(
                CompletionPhase.allCases,
                trigger: triggerCount
            ) { content, phase in
                content
                    .scaleEffect(reduceMotion ? (phase == .hidden ? 0 : 1) : phase.scale)
                    .opacity(phase.opacity)
                    .brightness(reduceMotion ? 0 : phase.brightness)
            } animation: { phase in
                switch phase {
                case .hidden:
                    .easeOut(duration: 0.01)
                case .appear:
                    .easeOut(duration: 0.15)
                case .stamp:
                    .spring(response: 0.2, dampingFraction: 0.5)
                    // dampingFraction 0.5 = visible overshoot for "stamp" feel
                case .settle:
                    .spring(response: 0.2, dampingFraction: 0.9)
                    // dampingFraction 0.9 = smooth return, no bounce
                case .glow:
                    .easeOut(duration: 0.12)
                case .rest:
                    .easeInOut(duration: 0.3)
                }
            }
            .sensoryFeedback(
                .impact(weight: .medium, intensity: 0.8),
                trigger: triggerCount
            )
    }

    /// Call this to trigger the completion animation.
    func complete() {
        triggerCount += 1
    }
}

// MARK: - Preview

#Preview("Loading Indicator") {
    ZStack {
        Color(red: 0.04, green: 0.04, blue: 0.04)
            .ignoresSafeArea()

        VStack(spacing: 40) {
            LoadingIndicator("SYNCING")

            PhaseAnimatorLoader()
        }
    }
    .preferredColorScheme(.dark)
}
