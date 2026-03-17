// metal-ripple.swift
// Metal shader ripple effect on tap.
// SwiftUI .distortionEffect with custom .metal shader. Animated time + touch point params.
// Requires: iOS 17+ | Xcode 16+
//
// IMPORTANT: This file has two parts:
// 1. The Swift view code (below)
// 2. The Metal shader code (at the bottom, must be saved as Ripple.metal in your Xcode project)

import SwiftUI
import UIKit

// MARK: - Ripple Configuration

/// Configurable parameters for the ripple effect.
struct RippleConfig {
    /// Maximum displacement of pixels in points.
    var amplitude: Float = 8.0

    /// Number of wave cycles per screen-width distance.
    var frequency: Float = 15.0

    /// How quickly the ripple fades with distance from origin.
    /// Higher = faster falloff, tighter ripple.
    var decay: Float = 0.02

    /// Speed of wave propagation in points per second.
    var speed: Float = 800.0

    /// Duration of the ripple effect in seconds.
    var duration: TimeInterval = 1.5

    /// Maximum sample offset for SwiftUI distortion.
    /// Must be >= amplitude to prevent edge clipping.
    var maxSampleOffset: CGSize {
        CGSize(width: CGFloat(amplitude) + 2, height: CGFloat(amplitude) + 2)
    }

    // MARK: Presets

    /// Subtle tap feedback ripple.
    static let subtle = RippleConfig(
        amplitude: 4.0,
        frequency: 20.0,
        decay: 0.03,
        speed: 600.0,
        duration: 1.0
    )

    /// Dramatic impact ripple.
    static let impact = RippleConfig(
        amplitude: 12.0,
        frequency: 10.0,
        decay: 0.015,
        speed: 1000.0,
        duration: 2.0
    )

    /// Slow, ambient water surface ripple.
    static let water = RippleConfig(
        amplitude: 6.0,
        frequency: 8.0,
        decay: 0.01,
        speed: 400.0,
        duration: 3.0
    )
}

// MARK: - Ripple State

/// Tracks the state of an active ripple animation.
@Observable
final class RippleState {
    var isActive = false
    var origin: CGPoint = .zero
    var startTime: Date = .now

    /// Elapsed time since ripple started, in seconds.
    var elapsed: TimeInterval {
        Date.now.timeIntervalSince(startTime)
    }

    func trigger(at point: CGPoint) {
        origin = point
        startTime = .now
        isActive = true
    }

    func stop() {
        isActive = false
    }
}

// MARK: - Ripple Modifier

/// Applies the Metal ripple distortion effect to any view.
struct RippleModifier: ViewModifier {
    let config: RippleConfig
    @Bindable var rippleState: RippleState
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        if rippleState.isActive && !reduceMotion {
            TimelineView(.animation) { timeline in
                let elapsed = timeline.date.timeIntervalSince(rippleState.startTime)

                content
                    .distortionEffect(
                        ShaderLibrary.rippleDistortion(
                            .float(Float(elapsed)),
                            .float2(
                                Float(rippleState.origin.x),
                                Float(rippleState.origin.y)
                            ),
                            .float(config.amplitude),
                            .float(config.frequency),
                            .float(config.decay),
                            .float(config.speed)
                        ),
                        maxSampleOffset: config.maxSampleOffset
                        // maxSampleOffset tells SwiftUI how far pixels can be displaced.
                        // Without this, the ripple clips at view edges.
                    )
                    .onChange(of: elapsed) { _, newElapsed in
                        if newElapsed >= config.duration {
                            rippleState.stop()
                        }
                    }
            }
        } else {
            content
        }
    }
}

// MARK: - View Extension

extension View {
    /// Adds a tap-to-ripple effect to any view.
    func rippleEffect(
        config: RippleConfig = RippleConfig(),
        state: RippleState
    ) -> some View {
        self.modifier(RippleModifier(config: config, rippleState: state))
    }
}

// MARK: - Demo View

/// Interactive demo: tap anywhere on the card to trigger a ripple.
struct MetalRippleDemo: View {
    @State private var rippleState = RippleState()
    @State private var tapCount = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private let config = RippleConfig()

    var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.04, blue: 0.04)
                .ignoresSafeArea()

            VStack(spacing: 32) {
                Text("METAL RIPPLE")
                    .font(.caption.weight(.semibold))
                    .tracking(2)
                    .foregroundStyle(.secondary)

                // Ripple target
                cardContent
                    .rippleEffect(config: config, state: rippleState)
                    .onTapGesture { location in
                        rippleState.trigger(at: location)
                        tapCount += 1

                        // Haptic at tap origin
                        UIImpactFeedbackGenerator(style: .light)
                            .impactOccurred(intensity: 0.6)
                    }

                // Image target
                imageContent
                    .rippleEffect(
                        config: .water,
                        state: rippleState
                    )
                    .onTapGesture { location in
                        rippleState.trigger(at: location)
                        tapCount += 1

                        UIImpactFeedbackGenerator(style: .light)
                            .impactOccurred(intensity: 0.5)
                    }

                if reduceMotion {
                    Text("Ripple effect disabled (Reduce Motion on)")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            }
            .padding()
        }
        .preferredColorScheme(.dark)
    }

    // MARK: Card Content

    private var cardContent: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Circle()
                    .fill(Color(red: 0.35, green: 0.47, blue: 0.58))
                    .frame(width: 36, height: 36)

                VStack(alignment: .leading, spacing: 2) {
                    Text("TAP ANYWHERE")
                        .font(.caption.weight(.semibold))
                        .tracking(1.5)
                        .foregroundStyle(.secondary)

                    Text("Ripple Effect")
                        .font(.headline)
                }

                Spacer()
            }

            Text("Tap this card to see the Metal shader ripple distortion effect propagate from your touch point.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemGray6))
        )
    }

    private var imageContent: some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(
                LinearGradient(
                    colors: [
                        Color(red: 0.15, green: 0.25, blue: 0.35),
                        Color(red: 0.35, green: 0.47, blue: 0.58),
                        Color(red: 0.15, green: 0.25, blue: 0.35),
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .frame(height: 160)
            .overlay {
                Text("TAP FOR WATER RIPPLE")
                    .font(.caption.weight(.semibold))
                    .tracking(1.5)
                    .foregroundStyle(.white.opacity(0.6))
            }
    }
}

// MARK: - Preview

#Preview {
    MetalRippleDemo()
}

// ============================================================================
// METAL SHADER — Save as "Ripple.metal" in your Xcode project
// ============================================================================
//
// #include <metal_stdlib>
// #include <SwiftUI/SwiftUI_Metal.h>
// using namespace metal;
//
// /// Ripple distortion effect.
// /// Displaces pixels in a radial sine wave pattern emanating from a touch origin.
// ///
// /// Parameters:
// ///   position — current pixel position (provided by SwiftUI)
// ///   time     — elapsed time since ripple started (seconds)
// ///   origin   — touch point in view coordinates
// ///   amplitude — maximum pixel displacement
// ///   frequency — wave cycles per unit distance
// ///   decay    — exponential decay factor with distance
// ///   speed    — wave propagation speed (points/second)
// [[ stitchable ]]
// float2 rippleDistortion(
//     float2 position,
//     float time,
//     float2 origin,
//     float amplitude,
//     float frequency,
//     float decay,
//     float speed
// ) {
//     // Vector from origin to current pixel
//     float2 delta = position - origin;
//     float distance = length(delta);
//
//     // Sine wave propagating outward from origin
//     float wave = sin(frequency * distance - speed * time);
//
//     // Amplitude envelope:
//     // - Decays exponentially with distance from origin (tighter ripple)
//     // - Fades over time (ripple dissipates)
//     float timeDecay = max(0.0, 1.0 - time * 0.5);
//     float envelope = amplitude * exp(-decay * distance) * timeDecay;
//
//     // Displace along the direction from origin (radial displacement)
//     // Adding small epsilon to avoid division by zero at exact origin
//     float2 direction = normalize(delta + float2(0.0001));
//     float2 displacement = direction * wave * envelope;
//
//     return position + displacement;
// }
