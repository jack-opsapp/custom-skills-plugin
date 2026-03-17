// spring-card.swift
// Card with spring physics on drag/release.
// DragGesture + withAnimation(.spring), rotation/scale from offset, haptic on release.
// Requires: iOS 17+ | Xcode 16+

import SwiftUI
import UIKit
import CoreHaptics

// MARK: - Spring Card View

/// A card that responds to drag with spring physics.
/// Tilts and scales based on drag offset. Snaps back with a spring on release.
/// Includes haptic feedback at threshold crossing and on release.
struct SpringCard: View {
    // MARK: State

    @State private var offset: CGSize = .zero
    @State private var isDragging = false
    @State private var hasPassedThreshold = false
    @State private var releaseCount = 0

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    // MARK: Configuration

    /// Distance in points before the card is considered "committed"
    private let commitThreshold: CGFloat = 120

    /// Maximum rotation angle in degrees at full drag
    private let maxRotation: Double = 12

    /// Scale range: card shrinks slightly while dragging
    private let dragScale: CGFloat = 0.95

    // MARK: Body

    var body: some View {
        cardContent
            .offset(offset)
            .scaleEffect(isDragging ? dragScale : 1.0)
            .rotationEffect(
                reduceMotion
                    ? .zero
                    : .degrees(rotationAngle),
                anchor: .bottom
            )
            // rotation proportional to horizontal offset
            // anchor at bottom creates a natural "pivoting" feel
            .animation(
                isDragging
                    ? .interactiveSpring(response: 0.15, dampingFraction: 0.86)
                    // During drag: fast follow, high damping = no lag, no bounce
                    : reduceMotion
                        ? .easeInOut(duration: 0.25)
                        : .spring(response: 0.5, dampingFraction: 0.7, blendDuration: 0),
                        // On release: slower spring, moderate damping = satisfying overshoot
                value: offset
            )
            .animation(
                isDragging
                    ? .easeOut(duration: 0.15)
                    : .spring(response: 0.4, dampingFraction: 0.75),
                value: isDragging
            )
            .gesture(dragGesture)
            .sensoryFeedback(
                .impact(weight: .medium, intensity: 0.7),
                trigger: releaseCount
            )
    }

    // MARK: Drag Gesture

    private var dragGesture: some Gesture {
        DragGesture()
            .onChanged { value in
                offset = value.translation
                isDragging = true

                // Check threshold crossing for haptic
                let distance = hypot(value.translation.width, value.translation.height)
                let crossed = distance > commitThreshold

                if crossed && !hasPassedThreshold {
                    hasPassedThreshold = true
                    // Haptic when crossing commit threshold
                    let generator = UIImpactFeedbackGenerator(style: .rigid)
                    generator.impactOccurred(intensity: 0.6)
                } else if !crossed && hasPassedThreshold {
                    hasPassedThreshold = false
                    // Lighter haptic when retreating back below threshold
                    let generator = UIImpactFeedbackGenerator(style: .light)
                    generator.impactOccurred(intensity: 0.4)
                }
            }
            .onEnded { value in
                isDragging = false
                hasPassedThreshold = false

                let distance = hypot(value.translation.width, value.translation.height)

                if distance > commitThreshold {
                    // Committed: animate off screen in the drag direction
                    let direction = normalizedDirection(value.translation)
                    withAnimation(reduceMotion
                        ? .easeOut(duration: 0.25)
                        : .spring(response: 0.35, dampingFraction: 0.85)
                        // Fast spring, high damping = decisive exit
                    ) {
                        offset = CGSize(
                            width: direction.width * 500,
                            height: direction.height * 500
                        )
                    }
                    // Success haptic for commit
                    UINotificationFeedbackGenerator().notificationOccurred(.success)
                } else {
                    // Not committed: snap back to center
                    releaseCount += 1  // triggers sensoryFeedback
                    withAnimation(reduceMotion
                        ? .easeInOut(duration: 0.2)
                        : .spring(response: 0.5, dampingFraction: 0.7)
                        // dampingFraction 0.7 = slight overshoot on snap-back
                        // feels like the card "bounces" back into place
                    ) {
                        offset = .zero
                    }
                }
            }
    }

    // MARK: Computed Properties

    /// Rotation angle proportional to horizontal offset.
    /// Clamped to maxRotation degrees.
    private var rotationAngle: Double {
        let normalized = offset.width / 300
        return Double(normalized) * maxRotation
    }

    /// Normalize a translation to a unit direction vector.
    private func normalizedDirection(_ translation: CGSize) -> CGSize {
        let magnitude = hypot(translation.width, translation.height)
        guard magnitude > 0 else { return .zero }
        return CGSize(
            width: translation.width / magnitude,
            height: translation.height / magnitude
        )
    }

    // MARK: Card Content

    @ViewBuilder
    private var cardContent: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Circle()
                    .fill(Color(red: 0.35, green: 0.47, blue: 0.58))
                    // Brand accent #597794
                    .frame(width: 40, height: 40)

                VStack(alignment: .leading, spacing: 2) {
                    Text("PROJECT CARD")
                        .font(.caption.weight(.semibold))
                        .tracking(1.5)
                        .foregroundStyle(.secondary)

                    Text("Foundation Repair")
                        .font(.headline)
                }

                Spacer()
            }

            Divider()

            Text("Drag to interact. Release past threshold to dismiss.")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            // Threshold indicator
            HStack {
                let progress = min(
                    hypot(offset.width, offset.height) / commitThreshold,
                    1.0
                )

                RoundedRectangle(cornerRadius: 2)
                    .fill(
                        progress >= 1.0
                            ? Color.green
                            : Color(red: 0.35, green: 0.47, blue: 0.58)
                    )
                    .frame(width: progress * 100, height: 4)
                    .animation(.easeOut(duration: 0.1), value: progress)

                Spacer()
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemGray6))
                .shadow(
                    color: .black.opacity(isDragging ? 0.2 : 0.1),
                    radius: isDragging ? 20 : 8,
                    y: isDragging ? 10 : 4
                )
        )
        .padding(.horizontal, 24)
    }
}

// MARK: - Preview

#Preview {
    ZStack {
        Color(red: 0.04, green: 0.04, blue: 0.04)
            .ignoresSafeArea()

        SpringCard()
    }
    .preferredColorScheme(.dark)
}
