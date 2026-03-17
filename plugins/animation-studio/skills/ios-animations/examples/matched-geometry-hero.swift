// matched-geometry-hero.swift
// Hero transition between list row and detail view using matchedGeometryEffect.
// Namespace management, overlay rendering, timing coordination.
// Requires: iOS 17+ | Xcode 16+

import SwiftUI
import UIKit

// MARK: - Data Model

struct CrewMember: Identifiable, Hashable {
    let id = UUID()
    let name: String
    let role: String
    let color: Color
    let projectCount: Int
}

// MARK: - Main View

/// Demonstrates a list-to-detail hero transition using matchedGeometryEffect.
/// Tapping a list row expands it into a full detail view with matched elements.
struct MatchedGeometryHeroDemo: View {
    @Namespace private var heroNamespace
    @State private var selectedMember: CrewMember?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private let crew: [CrewMember] = [
        CrewMember(name: "Marcus Webb", role: "Lead Foreman", color: .blue, projectCount: 12),
        CrewMember(name: "Sarah Chen", role: "Electrician", color: .orange, projectCount: 8),
        CrewMember(name: "Jake Torres", role: "Plumber", color: .green, projectCount: 15),
        CrewMember(name: "Aisha Patel", role: "HVAC Tech", color: .purple, projectCount: 6),
    ]

    var body: some View {
        ZStack {
            // Background
            Color(red: 0.04, green: 0.04, blue: 0.04)
                .ignoresSafeArea()

            // List layer
            listView
                .opacity(selectedMember == nil ? 1 : 0.15)
                .allowsHitTesting(selectedMember == nil)

            // Detail overlay — rendered above list
            if let member = selectedMember {
                detailView(for: member)
                    .transition(.opacity)
                    .zIndex(1)
                    // zIndex ensures the hero elements render above list items
                    // during the geometry morph
            }
        }
        .sensoryFeedback(
            .impact(flexibility: .solid, intensity: 0.5),
            trigger: selectedMember?.id
        )
    }

    // MARK: List View

    private var listView: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Header
                Text("CREW")
                    .font(.caption.weight(.semibold))
                    .tracking(2)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 20)
                    .padding(.top, 16)
                    .padding(.bottom, 12)

                // List rows
                LazyVStack(spacing: 1) {
                    ForEach(crew) { member in
                        if selectedMember?.id != member.id {
                            CrewRow(
                                member: member,
                                namespace: heroNamespace
                            )
                            .onTapGesture {
                                // Pre-warm haptic engine before animation starts
                                let generator = UIImpactFeedbackGenerator(style: .medium)
                                generator.prepare()

                                withAnimation(reduceMotion
                                    ? .easeInOut(duration: 0.25)
                                    : .spring(
                                        response: 0.5,
                                        dampingFraction: 0.85
                                        // dampingFraction 0.85 = smooth morph, lands cleanly
                                        // response 0.5 = enough time for eye to track the element
                                    )
                                ) {
                                    selectedMember = member
                                }
                            }
                        } else {
                            // Placeholder maintains list layout during hero transition
                            // Without this, the list collapses and causes a jarring shift
                            Color.clear
                                .frame(height: 72)
                        }
                    }
                }
            }
        }
    }

    // MARK: Detail View

    private func detailView(for member: CrewMember) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            // Hero header area
            ZStack(alignment: .topTrailing) {
                // Background — matched geometry
                RoundedRectangle(cornerRadius: 24)
                    .fill(member.color.opacity(0.15))
                    .matchedGeometryEffect(
                        id: "\(member.id)-bg",
                        in: heroNamespace
                    )
                    .frame(height: 220)

                // Close button — fades in after hero animation
                Button {
                    withAnimation(reduceMotion
                        ? .easeInOut(duration: 0.2)
                        : .spring(response: 0.4, dampingFraction: 0.8)
                    ) {
                        selectedMember = nil
                    }
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title2)
                        .foregroundStyle(.secondary)
                        .padding(20)
                }
                // Delayed fade-in: appears after the hero has moved ~70% of the way
                .opacity(selectedMember != nil ? 1 : 0)
                .animation(
                    .easeOut(duration: 0.2).delay(0.15),
                    value: selectedMember != nil
                )
            }

            // Hero elements
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 16) {
                    // Avatar — matched geometry
                    Circle()
                        .fill(member.color)
                        .frame(width: 64, height: 64)
                        .matchedGeometryEffect(
                            id: "\(member.id)-avatar",
                            in: heroNamespace
                        )

                    VStack(alignment: .leading, spacing: 4) {
                        // Name — matched geometry
                        Text(member.name)
                            .font(.title2.bold())
                            .matchedGeometryEffect(
                                id: "\(member.id)-name",
                                in: heroNamespace
                            )

                        // Role — matched geometry
                        Text(member.role.uppercased())
                            .font(.caption.weight(.semibold))
                            .tracking(1.5)
                            .foregroundStyle(.secondary)
                            .matchedGeometryEffect(
                                id: "\(member.id)-role",
                                in: heroNamespace
                            )
                    }
                }
                .padding(.top, -40) // Overlap with the colored header
            }
            .padding(.horizontal, 20)

            // Non-hero content: fades in after hero transition
            VStack(alignment: .leading, spacing: 16) {
                Divider()
                    .padding(.top, 16)

                detailSection(title: "PROJECTS", value: "\(member.projectCount) Active")
                detailSection(title: "CERTIFICATIONS", value: "3 Current")
                detailSection(title: "SCHEDULE", value: "Mon-Fri, 6:00 AM")

                Spacer()
            }
            .padding(.horizontal, 20)
            .opacity(selectedMember != nil ? 1 : 0)
            .offset(y: selectedMember != nil ? 0 : 20)
            .animation(
                reduceMotion
                    ? .easeInOut(duration: 0.2)
                    : .easeOut(duration: 0.3).delay(0.15),
                    // Non-hero content slides up and fades in 150ms after hero starts
                    // This creates a layered, choreographed entry
                value: selectedMember != nil
            )
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(
            Color(red: 0.06, green: 0.06, blue: 0.06)
                .ignoresSafeArea()
        )
        .onTapGesture {
            withAnimation(reduceMotion
                ? .easeInOut(duration: 0.2)
                : .spring(response: 0.4, dampingFraction: 0.8)
            ) {
                selectedMember = nil
            }
        }
    }

    // MARK: Detail Section

    private func detailSection(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption2.weight(.semibold))
                .tracking(1.5)
                .foregroundStyle(.secondary)

            Text(value)
                .font(.body)
        }
    }
}

// MARK: - Crew Row

/// A list row with matched geometry elements.
/// Each element that will hero-transition gets its own matchedGeometryEffect ID.
struct CrewRow: View {
    let member: CrewMember
    let namespace: Namespace.ID

    var body: some View {
        HStack(spacing: 14) {
            // Avatar — will hero to detail
            Circle()
                .fill(member.color)
                .frame(width: 40, height: 40)
                .matchedGeometryEffect(
                    id: "\(member.id)-avatar",
                    in: namespace
                )

            VStack(alignment: .leading, spacing: 2) {
                // Name — will hero to detail
                Text(member.name)
                    .font(.body.weight(.semibold))
                    .matchedGeometryEffect(
                        id: "\(member.id)-name",
                        in: namespace
                    )

                // Role — will hero to detail
                Text(member.role.uppercased())
                    .font(.caption2.weight(.medium))
                    .tracking(1)
                    .foregroundStyle(.secondary)
                    .matchedGeometryEffect(
                        id: "\(member.id)-role",
                        in: namespace
                    )
            }

            Spacer()

            Text("\(member.projectCount)")
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.secondary)

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
        .background(
            // Background — will hero to detail header
            RoundedRectangle(cornerRadius: 0)
                .fill(Color(.systemGray6).opacity(0.3))
                .matchedGeometryEffect(
                    id: "\(member.id)-bg",
                    in: namespace
                )
        )
    }
}

// MARK: - Preview

#Preview {
    MatchedGeometryHeroDemo()
        .preferredColorScheme(.dark)
}
