---
name: tutorial-analytics
description: This skill should be used when instrumenting tutorial analytics events, designing tutorial completion tracking, implementing dropoff detection, creating tutorial funnel analysis, defining onboarding KPIs, setting up A/B testing for tutorials, or adding any measurement and tracking to onboarding flows.
---

# Tutorial Analytics

Ensure every tutorial ships with proper analytics instrumentation. If it is not measured, it cannot be improved. This skill covers event design, platform implementation, funnel analysis, KPI definition, and A/B testing for onboarding tutorials on iOS (SwiftUI) and web (React/Next.js).

---

## Principle

A tutorial without analytics is a tutorial that will never improve. Every tutorial must answer three questions from day one:

1. **Where do users drop off?** Phase-by-phase funnel visibility.
2. **How long does it take?** Total time and per-phase time.
3. **Does it work?** Completion rate and post-tutorial feature adoption.

All other metrics are refinements. These three are non-negotiable for launch.

---

## Instrumentation Process

Follow these six steps in order. Do not write implementation code until the event schema and funnel are designed.

### Step 1: Define Events

Establish the event schema — what fires, when, and with what data. The standard tutorial event set covers the full lifecycle from session start to completion or dropoff.

**Standard event set (9 events):**

| Event | When Fired | Key Fields |
|---|---|---|
| `tutorial_session_start` | Tutorial begins | sessionId, flow, platform, variant |
| `tutorial_phase_start` | Phase begins | phase, phaseIndex, totalPhases |
| `tutorial_phase_complete` | Phase completed via user action | phase, duration, action, phaseIndex |
| `tutorial_phase_skip` | Phase skipped via Skip button | phase, phaseIndex, timeBeforeSkip |
| `tutorial_phase_back` | User navigates backward | phase, fromPhase, phaseIndex |
| `tutorial_dropoff` | User abandons tutorial | lastPhase, totalTime, phasesCompleted |
| `tutorial_complete` | Tutorial finished (all phases or CTA pressed) | totalTime, phasesCompleted, phasesSkipped |
| `tutorial_action` | User interacts within a phase | phase, actionType, target |
| `tutorial_experiment` | A/B variant assigned | experimentId, variant, sessionId |

Full event definitions with all fields, types, and example payloads are in `references/event-schema.md`.

### Step 2: Map Events to Phases

Create a mapping table that specifies which events fire for each tutorial phase. This mapping is essential for validating instrumentation — every phase must fire at least `phase_start` and either `phase_complete`, `phase_skip`, or `dropoff`.

Example mapping:

| Phase | Events |
|---|---|
| welcome | phase_start, phase_complete (auto-advance or tap) |
| create_project | phase_start, tutorial_action (form fields), phase_complete, phase_skip |
| navigate_tabs | phase_start, tutorial_action (tab taps), phase_complete, phase_skip |
| assign_task | phase_start, tutorial_action (form fields), phase_complete, phase_skip |
| completion | phase_start, tutorial_complete |

For every phase, ensure the `phase_start` event fires immediately when the phase becomes active. The `phase_complete` event fires only when the phase's success condition is met (not when the user merely views it).

### Step 3: Set KPI Targets

Define success metrics before launch. Without targets, data is just numbers.

| KPI | Target | Definition |
|---|---|---|
| Completion rate | >60% | Users who reach `tutorial_complete` / users who fire `tutorial_session_start` |
| Time to first value (TTFV) | <60 seconds | Median total time from `session_start` to `tutorial_complete` |
| Per-phase dropoff | <15% per phase | Users who drop off at phase N / users who started phase N |
| Per-phase skip rate | <30% per phase | Users who skip phase N / users who started phase N |
| Post-tutorial feature adoption | >40% | Users who perform the tutorial's core action (e.g., create a real project) within 24h of completing the tutorial |

These targets are baselines. Adjust based on product context — a complex B2B tool may accept higher TTFV; a consumer app should target lower.

### Step 4: Design the Funnel

Build a phase-by-phase funnel using `phase_start` events as the entry markers for each stage. The funnel shows how many users reach each phase and where they fall off.

Funnel stages = ordered list of `phase_start` events. Each stage's count is the number of unique sessions that fired `phase_start` for that phase. Dropoff at stage N = stage N count minus stage N+1 count.

See `references/funnel-analysis.md` for how to build, interpret, and act on funnel data.

### Step 5: Add A/B Testing Hooks

Every tutorial should be A/B testable from launch, even if no experiment is running initially. The cost of adding hooks later is high; the cost of including them from day one is nearly zero.

**Implementation:**
1. On `tutorial_session_start`, assign the user to a variant (control vs. treatment). Use a deterministic hash of userId or sessionId for consistent assignment.
2. Fire `tutorial_experiment` event with the variant assignment.
3. Include the `variant` field on ALL subsequent events in that session. This allows filtering every metric by variant.
4. Store the variant assignment in session state (not just the event) so all downstream events inherit it without re-computation.

**Important:** Do not assign variants to users who have already completed the tutorial. Re-tutorial users (if allowed) should get the same variant they received originally.

### Step 6: Generate Instrumentation Code

Produce platform-specific analytics code that:
- Fires all events from the schema
- Includes all required fields with correct types
- Manages session state (sessionId, startTime, variant)
- Handles edge cases (app backgrounding, network loss, duplicate events)

See platform implementation patterns below.

---

## Platform Implementation Patterns

### iOS (SwiftUI)

Create a `TutorialAnalytics` manager class with static methods for each event type. Use `NotificationCenter` or a `TutorialStateManager` callback to trigger events from state changes.

```swift
import Foundation

final class TutorialAnalytics {
    static let shared = TutorialAnalytics()

    private var sessionId: String = ""
    private var sessionStartTime: Date = Date()
    private var phaseStartTime: Date = Date()
    private var variant: String = "control"
    private var phasesCompleted: Int = 0
    private var phasesSkipped: Int = 0

    func startSession(flow: String) {
        sessionId = UUID().uuidString
        sessionStartTime = Date()
        phasesCompleted = 0
        phasesSkipped = 0
        // Assign variant
        variant = assignVariant(sessionId: sessionId)

        track("tutorial_session_start", properties: [
            "sessionId": sessionId,
            "flow": flow,
            "platform": "ios",
            "variant": variant,
        ])

        track("tutorial_experiment", properties: [
            "experimentId": "onboarding_v1",
            "variant": variant,
            "sessionId": sessionId,
        ])
    }

    func phaseStart(phase: String, phaseIndex: Int, totalPhases: Int) {
        phaseStartTime = Date()
        track("tutorial_phase_start", properties: [
            "sessionId": sessionId,
            "phase": phase,
            "phaseIndex": phaseIndex,
            "totalPhases": totalPhases,
            "variant": variant,
        ])
    }

    func phaseComplete(phase: String, phaseIndex: Int, action: String) {
        let duration = Date().timeIntervalSince(phaseStartTime)
        phasesCompleted += 1
        track("tutorial_phase_complete", properties: [
            "sessionId": sessionId,
            "phase": phase,
            "phaseIndex": phaseIndex,
            "duration": duration,
            "action": action,
            "variant": variant,
        ])
    }

    func phaseSkip(phase: String, phaseIndex: Int) {
        let timeBeforeSkip = Date().timeIntervalSince(phaseStartTime)
        phasesSkipped += 1
        track("tutorial_phase_skip", properties: [
            "sessionId": sessionId,
            "phase": phase,
            "phaseIndex": phaseIndex,
            "timeBeforeSkip": timeBeforeSkip,
            "variant": variant,
        ])
    }

    func dropoff(lastPhase: String) {
        let totalTime = Date().timeIntervalSince(sessionStartTime)
        track("tutorial_dropoff", properties: [
            "sessionId": sessionId,
            "lastPhase": lastPhase,
            "totalTime": totalTime,
            "phasesCompleted": phasesCompleted,
            "variant": variant,
        ])
    }

    func complete() {
        let totalTime = Date().timeIntervalSince(sessionStartTime)
        track("tutorial_complete", properties: [
            "sessionId": sessionId,
            "totalTime": totalTime,
            "phasesCompleted": phasesCompleted,
            "phasesSkipped": phasesSkipped,
            "variant": variant,
        ])
    }

    private func track(_ event: String, properties: [String: Any]) {
        // Replace with actual analytics SDK call
        // e.g., Mixpanel.track(event, properties: properties)
        // e.g., Amplitude.instance().logEvent(event, withEventProperties: properties)
        print("[Analytics] \(event): \(properties)")
    }

    private func assignVariant(sessionId: String) -> String {
        // Deterministic assignment based on sessionId hash
        let hash = sessionId.hashValue
        return hash % 2 == 0 ? "control" : "treatment"
    }
}
```

**Dropoff detection on iOS:** Observe `UIApplication.willResignActiveNotification` and `scenePhase` changes. If the user backgrounds the app during the tutorial and does not return within 30 seconds, fire `tutorial_dropoff`. If they return, resume the session.

### Web (React / Next.js)

Create a `useTutorialAnalytics` hook with a `track` function. Use React Context for session state management. Provide integration points for Mixpanel, Amplitude, PostHog, or custom backends.

```tsx
"use client"
import { createContext, useContext, useRef, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"

interface AnalyticsContext {
  startSession: (flow: string) => void
  phaseStart: (phase: string, phaseIndex: number, totalPhases: number) => void
  phaseComplete: (phase: string, phaseIndex: number, action: string) => void
  phaseSkip: (phase: string, phaseIndex: number) => void
  dropoff: (lastPhase: string) => void
  complete: () => void
  action: (phase: string, actionType: string, target: string) => void
}

const TutorialAnalyticsContext = createContext<AnalyticsContext | null>(null)

export function TutorialAnalyticsProvider({ children }: { children: React.ReactNode }) {
  const sessionRef = useRef({
    sessionId: "",
    startTime: 0,
    phaseStartTime: 0,
    variant: "control",
    phasesCompleted: 0,
    phasesSkipped: 0,
  })

  const track = useCallback((event: string, properties: Record<string, unknown>) => {
    // Replace with actual analytics call
    // e.g., mixpanel.track(event, properties)
    // e.g., posthog.capture(event, properties)
    console.log(`[Analytics] ${event}`, properties)
  }, [])

  const startSession = useCallback((flow: string) => {
    const sessionId = uuidv4()
    const variant = parseInt(sessionId.replace(/-/g, "").slice(0, 8), 16) % 2 === 0
      ? "control" : "treatment"

    sessionRef.current = {
      sessionId,
      startTime: Date.now(),
      phaseStartTime: Date.now(),
      variant,
      phasesCompleted: 0,
      phasesSkipped: 0,
    }

    track("tutorial_session_start", {
      sessionId, flow, platform: "web", variant,
    })
  }, [track])

  // ... additional methods follow the same pattern as iOS

  return (
    <TutorialAnalyticsContext.Provider value={{
      startSession, phaseStart, phaseComplete, phaseSkip, dropoff, complete, action,
    }}>
      {children}
    </TutorialAnalyticsContext.Provider>
  )
}

export function useTutorialAnalytics() {
  const context = useContext(TutorialAnalyticsContext)
  if (!context) throw new Error("useTutorialAnalytics must be used within TutorialAnalyticsProvider")
  return context
}
```

**Dropoff detection on web:** Listen for `visibilitychange` and `beforeunload` events. On `visibilitychange` to "hidden", start a 30-second timer. If the page becomes visible again, cancel the timer. On `beforeunload`, fire `tutorial_dropoff` using `navigator.sendBeacon` to ensure the event reaches the server before the page unloads.

---

## Code Generation Output Format

When an implementing agent generates instrumentation code, produce three artifacts:

1. **Event schema file** — TypeScript types (web) or Swift structs (iOS) defining all event shapes.
2. **Analytics manager** — The class/hook shown above, integrated with the project's analytics SDK.
3. **Instrumentation mapping** — A comment block or config file mapping each tutorial phase to its events, placed in the tutorial's state manager file.

---

## Post-Launch Monitoring Checklist

Verify these seven items within 24 hours of tutorial launch:

1. **Events are firing.** Check the analytics dashboard for all 9 event types. Missing event types indicate broken instrumentation.
2. **Funnel is populated.** Every phase should show entries. A phase with zero entries indicates a dead code path or a mis-named phase string.
3. **No missing phases.** The funnel should have one stage per tutorial phase. Missing stages mean `phase_start` is not firing for that phase.
4. **Dropoff events are reasonable.** Dropoff should be >0 (some users always leave) and <50% per phase. If dropoff is 0, the detection logic is broken. If >50% at any single phase, that phase needs immediate attention.
5. **A/B variant distribution is balanced.** Control and treatment should be within 5% of 50/50. Imbalanced assignment indicates a hash function problem.
6. **Session IDs are unique.** Check for duplicate sessionIds. Duplicates indicate the session is not being reset between tutorial restarts.
7. **Time calculations are correct.** Spot-check a few sessions: does `totalTime` on `tutorial_complete` equal the sum of all phase durations plus any transition time? Large discrepancies indicate timer bugs.

---

## KPI Review Cadence

- **Week 1-4 (launch month):** Review weekly. Focus on completion rate and per-phase dropoff. Iterate rapidly on phases with >15% dropoff.
- **Month 2+:** Review monthly. Shift focus from funnel fixes to optimization (TTFV reduction, post-tutorial adoption).
- **Quarterly:** Review cohort retention data. Compare Day 7 and Day 30 retention for tutorial completers vs. non-completers. This is the ultimate measure of tutorial effectiveness.

---

## Reference Files

- `references/event-schema.md` — Full event definitions with all fields, types, required flags, and example JSON payloads for all 9 events.
- `references/metrics-framework.md` — HEART framework adapted for tutorials with 5 metric categories, measurement methods, benchmarks, and calculation formulas.
- `references/funnel-analysis.md` — How to build, interpret, and act on tutorial funnel data, including dropoff diagnosis and optimization playbook.
