// particle-emitter.swift
// CAEmitterLayer particle system wrapped in UIViewRepresentable.
// Configurable: birth rate, velocity, color range, lifetime.
// Requires: iOS 17+ | Xcode 16+

import SwiftUI
import UIKit
import QuartzCore

// MARK: - Configuration

/// All configurable parameters for the particle system.
/// Pass this to ParticleEmitterView to control appearance and behavior.
struct ParticleConfig {
    /// Particles emitted per second.
    var birthRate: Float = 30

    /// Base velocity in points per second.
    var velocity: CGFloat = 80

    /// Velocity variance (±). Higher = more chaotic spread.
    var velocityRange: CGFloat = 30

    /// Seconds each particle lives before fading.
    var lifetime: Float = 3.0

    /// Lifetime variance (±).
    var lifetimeRange: Float = 1.0

    /// Emission angle range in radians. .pi * 2 = full circle.
    var emissionRange: CGFloat = .pi * 2

    /// Base particle scale factor.
    var scale: CGFloat = 0.15

    /// Scale variance (±).
    var scaleRange: CGFloat = 0.1

    /// Rate at which particles shrink over lifetime (negative = shrink).
    var scaleSpeed: CGFloat = -0.03

    /// Rate at which particles fade over lifetime (negative = fade).
    var alphaSpeed: Float = -0.3

    /// Spin rate in radians per second.
    var spin: CGFloat = 0.5

    /// Spin variance (±).
    var spinRange: CGFloat = 1.0

    /// Base color of particles.
    var color: UIColor = UIColor(red: 0.35, green: 0.47, blue: 0.58, alpha: 1.0)
    // Brand accent #597794

    /// Color variance in each channel (0-1).
    var colorRange: (red: Float, green: Float, blue: Float) = (0.1, 0.1, 0.15)

    /// Shape of the emission region.
    var emitterShape: CAEmitterLayerEmitterShape = .circle

    /// Size of the emission region.
    var emitterSize: CGSize = CGSize(width: 20, height: 20)

    /// Emission mode: .points (within shape), .outline (edge), .surface, .volume.
    var emitterMode: CAEmitterLayerEmitterMode = .outline

    /// Render mode: .additive (glowing), .oldestFirst (natural layering).
    var renderMode: CAEmitterLayerRenderMode = .additive

    /// Size of the particle image in points.
    var particleImageSize: CGFloat = 12

    // MARK: Presets

    /// Gentle ambient drift — for backgrounds.
    static let ambient = ParticleConfig(
        birthRate: 15,
        velocity: 30,
        velocityRange: 15,
        lifetime: 5.0,
        lifetimeRange: 2.0,
        scale: 0.08,
        scaleRange: 0.04,
        scaleSpeed: -0.01,
        alphaSpeed: -0.15,
        spin: 0.2,
        spinRange: 0.4,
        emitterShape: .rectangle,
        emitterMode: .points,
        renderMode: .additive,
        particleImageSize: 8
    )

    /// Burst celebration — for achievement moments.
    static let burst = ParticleConfig(
        birthRate: 200,
        velocity: 200,
        velocityRange: 80,
        lifetime: 1.5,
        lifetimeRange: 0.5,
        emissionRange: .pi * 2,
        scale: 0.12,
        scaleRange: 0.08,
        scaleSpeed: -0.08,
        alphaSpeed: -0.6,
        spin: 2.0,
        spinRange: 3.0,
        emitterShape: .point,
        emitterMode: .points,
        renderMode: .additive,
        particleImageSize: 10
    )

    /// Rising sparks — for upward energy.
    static let sparks = ParticleConfig(
        birthRate: 25,
        velocity: 120,
        velocityRange: 40,
        lifetime: 2.0,
        lifetimeRange: 0.8,
        emissionRange: .pi / 4,
        scale: 0.06,
        scaleRange: 0.03,
        scaleSpeed: -0.02,
        alphaSpeed: -0.4,
        spin: 1.0,
        spinRange: 2.0,
        color: UIColor(red: 0.9, green: 0.6, blue: 0.2, alpha: 1.0),
        colorRange: (0.1, 0.15, 0.05),
        emitterShape: .line,
        emitterMode: .outline,
        renderMode: .additive,
        particleImageSize: 6
    )
}

// MARK: - Particle Emitter UIViewRepresentable

/// A SwiftUI view wrapping a CAEmitterLayer particle system.
/// Configurable via `ParticleConfig`. Handles lifecycle and cleanup.
struct ParticleEmitterView: UIViewRepresentable {
    let config: ParticleConfig
    let isEmitting: Bool

    /// Optional: position the emitter at a specific point (in view coordinates).
    /// If nil, defaults to view center.
    var emitterPosition: CGPoint?

    func makeUIView(context: Context) -> ParticleHostView {
        let view = ParticleHostView()
        view.backgroundColor = .clear
        view.isUserInteractionEnabled = false

        let emitter = CAEmitterLayer()
        view.layer.addSublayer(emitter)
        context.coordinator.emitterLayer = emitter

        configureEmitter(emitter, in: view.bounds)

        return view
    }

    func updateUIView(_ uiView: ParticleHostView, context: Context) {
        guard let emitter = context.coordinator.emitterLayer else { return }

        // Update emitter position when bounds change
        let bounds = uiView.bounds
        emitter.frame = bounds
        emitter.emitterPosition = emitterPosition ?? CGPoint(x: bounds.midX, y: bounds.midY)
        emitter.emitterSize = config.emitterSize

        // Toggle emission
        emitter.emitterCells?.first?.birthRate = isEmitting ? config.birthRate : 0
    }

    static func dismantleUIView(_ uiView: ParticleHostView, coordinator: Coordinator) {
        // CRITICAL: Clean up emitter layer to prevent GPU resource leak
        coordinator.emitterLayer?.emitterCells = nil
        coordinator.emitterLayer?.removeAllAnimations()
        coordinator.emitterLayer?.removeFromSuperlayer()
        coordinator.emitterLayer = nil
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    // MARK: Configuration

    private func configureEmitter(_ emitter: CAEmitterLayer, in bounds: CGRect) {
        emitter.frame = bounds
        emitter.emitterPosition = emitterPosition ?? CGPoint(x: bounds.midX, y: bounds.midY)
        emitter.emitterShape = config.emitterShape
        emitter.emitterSize = config.emitterSize
        emitter.emitterMode = config.emitterMode
        emitter.renderMode = config.renderMode

        let cell = CAEmitterCell()
        cell.contents = ParticleImageGenerator.circleImage(size: config.particleImageSize)?.cgImage
        cell.birthRate = isEmitting ? config.birthRate : 0
        cell.lifetime = config.lifetime
        cell.lifetimeRange = config.lifetimeRange
        cell.velocity = config.velocity
        cell.velocityRange = config.velocityRange
        cell.emissionRange = config.emissionRange
        cell.spin = config.spin
        cell.spinRange = config.spinRange
        cell.scale = config.scale
        cell.scaleRange = config.scaleRange
        cell.scaleSpeed = config.scaleSpeed
        cell.alphaSpeed = config.alphaSpeed
        cell.color = config.color.cgColor
        cell.redRange = config.colorRange.red
        cell.greenRange = config.colorRange.green
        cell.blueRange = config.colorRange.blue

        emitter.emitterCells = [cell]
    }

    // MARK: Coordinator

    class Coordinator {
        var emitterLayer: CAEmitterLayer?
    }
}

// MARK: - Host View

/// Custom UIView that updates emitter frame on layout changes.
class ParticleHostView: UIView {
    override func layoutSubviews() {
        super.layoutSubviews()
        // Update emitter layer frame when view resizes
        layer.sublayers?
            .compactMap { $0 as? CAEmitterLayer }
            .forEach { $0.frame = bounds }
    }
}

// MARK: - Particle Image Generator

/// Generates small circular particle images for the emitter cell.
enum ParticleImageGenerator {
    /// Creates a white circle image at the specified size.
    /// The emitter cell's `color` property tints this white source.
    static func circleImage(size: CGFloat) -> UIImage? {
        let renderer = UIGraphicsImageRenderer(
            size: CGSize(width: size, height: size)
        )
        return renderer.image { context in
            let rect = CGRect(origin: .zero, size: CGSize(width: size, height: size))

            // Radial gradient: bright center fading to transparent edge
            // This creates a soft, glowing particle
            let colors = [UIColor.white.cgColor, UIColor.white.withAlphaComponent(0).cgColor]
            let gradient = CGGradient(
                colorsSpace: CGColorSpaceCreateDeviceRGB(),
                colors: colors as CFArray,
                locations: [0.0, 1.0]
            )!

            let center = CGPoint(x: size / 2, y: size / 2)
            context.cgContext.drawRadialGradient(
                gradient,
                startCenter: center,
                startRadius: 0,
                endCenter: center,
                endRadius: size / 2,
                options: []
            )

            _ = rect // Suppress unused warning
        }
    }
}

// MARK: - Burst Controller

/// Convenience wrapper that supports one-shot burst emission.
/// Emits at a high birth rate briefly, then stops.
struct ParticleBurstView: View {
    let config: ParticleConfig
    @Binding var trigger: Int

    @State private var isEmitting = false

    var body: some View {
        ParticleEmitterView(
            config: config,
            isEmitting: isEmitting
        )
        .allowsHitTesting(false)
        .onChange(of: trigger) { _, _ in
            // Emit burst
            isEmitting = true

            // Stop after a short interval — particles already emitted continue their lifecycle
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                isEmitting = false
            }
        }
    }
}

// MARK: - Demo View

/// Demonstrates the particle emitter with interactive controls.
struct ParticleEmitterDemo: View {
    @State private var isEmitting = true
    @State private var burstTrigger = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.04, blue: 0.04)
                .ignoresSafeArea()

            if !reduceMotion {
                // Ambient background particles
                ParticleEmitterView(
                    config: .ambient,
                    isEmitting: isEmitting
                )
                .ignoresSafeArea()

                // Burst particles on tap
                ParticleBurstView(
                    config: .burst,
                    trigger: $burstTrigger
                )
                .ignoresSafeArea()
            }

            VStack(spacing: 24) {
                Spacer()

                Text("PARTICLE EMITTER")
                    .font(.caption.weight(.semibold))
                    .tracking(2)
                    .foregroundStyle(.secondary)

                Button {
                    burstTrigger += 1
                } label: {
                    Text("BURST")
                        .font(.subheadline.weight(.semibold))
                        .tracking(1.5)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 32)
                        .padding(.vertical, 14)
                        .background(
                            Capsule()
                                .fill(Color(red: 0.35, green: 0.47, blue: 0.58))
                        )
                }
                .sensoryFeedback(
                    .impact(weight: .medium, intensity: 0.8),
                    trigger: burstTrigger
                )

                Toggle("Emitting", isOn: $isEmitting)
                    .tint(Color(red: 0.35, green: 0.47, blue: 0.58))
                    .padding(.horizontal, 40)
                    .sensoryFeedback(.selection, trigger: isEmitting)

                Spacer()
            }
        }
        .preferredColorScheme(.dark)
    }
}

// MARK: - Preview

#Preview {
    ParticleEmitterDemo()
}
