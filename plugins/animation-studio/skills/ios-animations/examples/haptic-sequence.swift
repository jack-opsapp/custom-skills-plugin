// haptic-sequence.swift
// CHHapticEngine custom pattern builder utility.
// Composable transient/continuous events into named sequences.
// Requires: iOS 17+ | Xcode 16+

import SwiftUI
import UIKit
import CoreHaptics

// MARK: - Haptic Event Builder

/// A single event in a haptic sequence.
/// Either a transient impulse or a continuous vibration.
enum HapticEvent {
    /// A sharp, discrete impulse at a point in time.
    case transient(
        intensity: Float,
        sharpness: Float,
        relativeTime: TimeInterval
    )

    /// A sustained vibration over a duration.
    case continuous(
        intensity: Float,
        sharpness: Float,
        relativeTime: TimeInterval,
        duration: TimeInterval
    )

    /// Convert to a CHHapticEvent.
    func toCHEvent() -> CHHapticEvent {
        switch self {
        case .transient(let intensity, let sharpness, let time):
            return CHHapticEvent(
                eventType: .hapticTransient,
                parameters: [
                    CHHapticEventParameter(parameterID: .hapticIntensity, value: intensity),
                    CHHapticEventParameter(parameterID: .hapticSharpness, value: sharpness),
                ],
                relativeTime: time
            )

        case .continuous(let intensity, let sharpness, let time, let duration):
            return CHHapticEvent(
                eventType: .hapticContinuous,
                parameters: [
                    CHHapticEventParameter(parameterID: .hapticIntensity, value: intensity),
                    CHHapticEventParameter(parameterID: .hapticSharpness, value: sharpness),
                ],
                relativeTime: time,
                duration: duration
            )
        }
    }
}

// MARK: - Haptic Sequence

/// A named, reusable haptic sequence composed of events.
/// Build sequences declaratively, then play them via HapticSequencePlayer.
struct HapticSequence {
    let name: String
    let events: [HapticEvent]
    let parameterCurves: [CHHapticParameterCurve]

    init(
        name: String,
        events: [HapticEvent],
        parameterCurves: [CHHapticParameterCurve] = []
    ) {
        self.name = name
        self.events = events
        self.parameterCurves = parameterCurves
    }

    /// Convert to a CHHapticPattern.
    func toPattern() throws -> CHHapticPattern {
        try CHHapticPattern(
            events: events.map { $0.toCHEvent() },
            parameterCurves: parameterCurves
        )
    }
}

// MARK: - Built-in Sequences

extension HapticSequence {
    // ---- ACHIEVEMENT CRESCENDO ----
    // Three rapid transients building in intensity, followed by a soft sustained buzz.
    // Use for: task completion, milestone reached, form submitted.
    // Emotional beat: Achievement — restrained celebration.
    static let achievementCrescendo = HapticSequence(
        name: "achievementCrescendo",
        events: [
            // Three taps building in intensity and sharpness
            .transient(intensity: 0.4, sharpness: 0.5, relativeTime: 0.0),
            .transient(intensity: 0.6, sharpness: 0.6, relativeTime: 0.08),
            .transient(intensity: 0.9, sharpness: 0.8, relativeTime: 0.16),
            // Soft sustained buzz after the peak — the "afterglow"
            .continuous(intensity: 0.3, sharpness: 0.2, relativeTime: 0.25, duration: 0.2),
        ]
    )

    // ---- ERROR BUZZ ----
    // Sharp double-tap with descending intensity.
    // Use for: validation failure, permission denied, network error.
    // Emotional beat: Error — clear rejection signal.
    static let errorBuzz = HapticSequence(
        name: "errorBuzz",
        events: [
            // First hit: strong and sharp
            .transient(intensity: 0.9, sharpness: 0.8, relativeTime: 0.0),
            // Second hit: slightly softer — the "echo" of rejection
            .transient(intensity: 0.7, sharpness: 0.6, relativeTime: 0.12),
        ]
    )

    // ---- SELECTION TICK ----
    // Ultra-precise single tick.
    // Use for: picker scroll, segmented control change, list item highlight.
    // Emotional beat: Discovery — encouraging exploration.
    static let selectionTick = HapticSequence(
        name: "selectionTick",
        events: [
            // High sharpness + low intensity = precise, delicate tick
            .transient(intensity: 0.3, sharpness: 0.9, relativeTime: 0.0),
        ]
    )

    // ---- COMMIT CONFIRM ----
    // Two-beat: medium impact → confirmation 200ms later.
    // Use for: button press that submits, swipe that commits, toggle that saves.
    // Emotional beat: Commitment — weight + acknowledgment.
    static let commitConfirm = HapticSequence(
        name: "commitConfirm",
        events: [
            // Beat 1: the commitment moment
            .transient(intensity: 0.8, sharpness: 0.6, relativeTime: 0.0),
            // Beat 2: the confirmation — "received and processed"
            .transient(intensity: 0.5, sharpness: 0.7, relativeTime: 0.2),
        ]
    )

    // ---- ENTRY LANDING ----
    // Single controlled impact at element arrival.
    // Use for: card appearing, modal presenting, element sliding into place.
    // Emotional beat: Entry — confident arrival.
    static let entryLanding = HapticSequence(
        name: "entryLanding",
        events: [
            // Solid, moderate impact — "I have arrived"
            .transient(intensity: 0.6, sharpness: 0.5, relativeTime: 0.0),
        ]
    )

    // ---- WARNING ALERT ----
    // Three escalating taps that demand attention.
    // Use for: destructive action confirmation, limit approaching, caution state.
    // Emotional beat: Warning — "are you sure?"
    static let warningAlert = HapticSequence(
        name: "warningAlert",
        events: [
            .transient(intensity: 0.5, sharpness: 0.7, relativeTime: 0.0),
            .transient(intensity: 0.7, sharpness: 0.7, relativeTime: 0.1),
            .transient(intensity: 0.9, sharpness: 0.8, relativeTime: 0.2),
        ]
    )

    // ---- DRAG THRESHOLD ----
    // Rigid snap when crossing a commit threshold during drag.
    // Use for: swipe-to-dismiss threshold, drag-to-reorder snap, pull-to-refresh trigger.
    // Emotional beat: Transition — spatial anchor.
    static let dragThreshold = HapticSequence(
        name: "dragThreshold",
        events: [
            // Rigid, sharp snap — like crossing a physical detent
            .transient(intensity: 0.7, sharpness: 0.9, relativeTime: 0.0),
        ]
    )

    // ---- AMBIENT PULSE ----
    // Extremely subtle continuous vibration. Max once per 2 seconds.
    // Use for: heartbeat on a critical screen, breathing rhythm sync.
    // Emotional beat: Ambient — atmosphere without attention.
    static let ambientPulse = HapticSequence(
        name: "ambientPulse",
        events: [
            // Barely perceptible rumble — felt, not noticed
            .continuous(intensity: 0.2, sharpness: 0.1, relativeTime: 0.0, duration: 0.15),
        ]
    )

    // ---- DELETE CONFIRM ----
    // Heavy impact followed by a descending continuous buzz.
    // Use for: item deleted, batch cleared, data wiped.
    // Emotional beat: Commitment (destructive variant).
    static let deleteConfirm = HapticSequence(
        name: "deleteConfirm",
        events: [
            // Heavy initial impact — the "weight" of deletion
            .transient(intensity: 1.0, sharpness: 0.5, relativeTime: 0.0),
            // Descending buzz — the "fading away" of the deleted item
            .continuous(intensity: 0.4, sharpness: 0.3, relativeTime: 0.1, duration: 0.3),
        ],
        parameterCurves: [
            // Intensity fades over the continuous event
            CHHapticParameterCurve(
                parameterID: .hapticIntensityControl,
                controlPoints: [
                    CHHapticParameterCurve.ControlPoint(relativeTime: 0.0, value: 1.0),
                    CHHapticParameterCurve.ControlPoint(relativeTime: 0.3, value: 0.1),
                ],
                relativeTime: 0.1
            ),
        ]
    )
}

// MARK: - Haptic Sequence Player

/// Manages CHHapticEngine lifecycle and plays HapticSequence patterns.
/// Create one instance per view or feature area. Clean up on disappear.
@Observable
final class HapticSequencePlayer {
    private var engine: CHHapticEngine?
    private var isEngineRunning = false

    /// Whether the device supports custom haptic patterns.
    var supportsHaptics: Bool {
        CHHapticEngine.capabilitiesForHardware().supportsHaptics
    }

    init() {
        setupEngine()
    }

    // MARK: Engine Lifecycle

    private func setupEngine() {
        guard supportsHaptics else { return }

        do {
            let engine = try CHHapticEngine()

            engine.resetHandler = { [weak self] in
                do {
                    try self?.engine?.start()
                    self?.isEngineRunning = true
                } catch {
                    self?.isEngineRunning = false
                }
            }

            engine.stoppedHandler = { [weak self] reason in
                self?.isEngineRunning = false
                // Engine auto-stops on background, audio interruption, idle timeout.
                // resetHandler will restart it when needed.
            }

            try engine.start()
            self.engine = engine
            self.isEngineRunning = true
        } catch {
            engine = nil
            isEngineRunning = false
        }
    }

    // MARK: Playback

    /// Play a named haptic sequence.
    func play(_ sequence: HapticSequence) {
        guard supportsHaptics else { return }

        // Check thermal state — skip non-essential haptics under thermal pressure
        let thermalState = ProcessInfo.processInfo.thermalState
        if thermalState == .serious || thermalState == .critical {
            // Fall back to simple UIFeedbackGenerator for essential patterns only
            if sequence.name == "errorBuzz" || sequence.name == "warningAlert" {
                UINotificationFeedbackGenerator().notificationOccurred(
                    sequence.name == "errorBuzz" ? .error : .warning
                )
            }
            return
        }

        // Ensure engine is running
        if !isEngineRunning {
            do {
                try engine?.start()
                isEngineRunning = true
            } catch {
                // Fall back to UIFeedbackGenerator
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                return
            }
        }

        do {
            let pattern = try sequence.toPattern()
            let player = try engine?.makePlayer(with: pattern)
            try player?.start(atTime: CHHapticTimeImmediate)
        } catch {
            // Silent failure — haptic is an enhancement
        }
    }

    /// Stop the engine and release resources.
    /// Call this in .onDisappear.
    func shutdown() {
        engine?.stop(completionHandler: { _ in })
        engine = nil
        isEngineRunning = false
    }
}

// MARK: - SwiftUI Integration

/// View modifier that provides a HapticSequencePlayer to child views.
struct HapticPlayerKey: EnvironmentKey {
    static let defaultValue: HapticSequencePlayer? = nil
}

extension EnvironmentValues {
    var hapticPlayer: HapticSequencePlayer? {
        get { self[HapticPlayerKey.self] }
        set { self[HapticPlayerKey.self] = newValue }
    }
}

// MARK: - Demo View

/// Interactive demo showing all built-in haptic sequences.
struct HapticSequenceDemo: View {
    @State private var player = HapticSequencePlayer()

    var body: some View {
        ScrollView {
            VStack(spacing: 1) {
                Text("HAPTIC SEQUENCES")
                    .font(.caption.weight(.semibold))
                    .tracking(2)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 20)
                    .padding(.top, 16)
                    .padding(.bottom, 12)

                sequenceButton("Achievement Crescendo", .achievementCrescendo)
                sequenceButton("Error Buzz", .errorBuzz)
                sequenceButton("Selection Tick", .selectionTick)
                sequenceButton("Commit Confirm", .commitConfirm)
                sequenceButton("Entry Landing", .entryLanding)
                sequenceButton("Warning Alert", .warningAlert)
                sequenceButton("Drag Threshold", .dragThreshold)
                sequenceButton("Ambient Pulse", .ambientPulse)
                sequenceButton("Delete Confirm", .deleteConfirm)
            }
        }
        .background(Color(red: 0.04, green: 0.04, blue: 0.04))
        .preferredColorScheme(.dark)
        .onDisappear {
            player.shutdown()
        }
    }

    @ViewBuilder
    private func sequenceButton(_ label: String, _ sequence: HapticSequence) -> some View {
        Button {
            player.play(sequence)
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(label)
                        .font(.body.weight(.medium))

                    Text(sequenceDescription(sequence))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Image(systemName: "waveform")
                    .font(.body)
                    .foregroundStyle(Color(red: 0.35, green: 0.47, blue: 0.58))
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background(Color(.systemGray6).opacity(0.3))
        }
        .buttonStyle(.plain)
    }

    private func sequenceDescription(_ sequence: HapticSequence) -> String {
        let transientCount = sequence.events.filter {
            if case .transient = $0 { return true }
            return false
        }.count

        let continuousCount = sequence.events.filter {
            if case .continuous = $0 { return true }
            return false
        }.count

        var parts: [String] = []
        if transientCount > 0 { parts.append("\(transientCount) transient") }
        if continuousCount > 0 { parts.append("\(continuousCount) continuous") }
        return parts.joined(separator: " + ")
    }
}

// MARK: - Preview

#Preview {
    HapticSequenceDemo()
}
