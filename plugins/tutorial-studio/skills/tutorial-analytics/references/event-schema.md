# Event Schema

Full definitions for all 9 tutorial analytics events. Each event includes its name, description, when it fires, all fields with type and required flag, and an example JSON payload.

All events share a common base: `sessionId` (string, required), `timestamp` (ISO 8601 string, required), `platform` ("ios" | "web", required), and `variant` (string, required — set to "control" if no experiment is running).

---

## 1. tutorial_session_start

**Description:** Fired once when the tutorial begins. Marks the start of a tutorial session and establishes the session context for all subsequent events.

**When fired:** Immediately when the tutorial view mounts and becomes visible to the user. Before any phase begins.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| sessionId | string (UUID) | yes | Unique identifier for this tutorial session |
| timestamp | string (ISO 8601) | yes | When the event occurred |
| flow | string | yes | Tutorial flow identifier (e.g., "creator_onboarding", "crew_onboarding") |
| platform | "ios" \| "web" | yes | Which platform the tutorial is running on |
| variant | string | yes | A/B test variant ("control", "treatment_a", etc.) |
| userId | string \| null | no | User ID if authenticated, null if anonymous |
| deviceType | string | no | Device model (e.g., "iPhone 15", "Chrome/Desktop") |
| appVersion | string | no | App version string |
| isReturningUser | boolean | no | Whether the user has started a tutorial session before |

**Example payload:**

```json
{
  "event": "tutorial_session_start",
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-28T14:30:00.000Z",
  "flow": "creator_onboarding",
  "platform": "ios",
  "variant": "control",
  "userId": "usr_abc123",
  "deviceType": "iPhone 15 Pro",
  "appVersion": "2.1.0",
  "isReturningUser": false
}
```

---

## 2. tutorial_phase_start

**Description:** Fired when a tutorial phase becomes active. This is the primary event for building the funnel — each phase's entry count comes from counting unique sessions with this event.

**When fired:** Immediately when the phase's UI becomes visible. If the phase has an entrance animation, fire on animation start (not completion).

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| sessionId | string (UUID) | yes | Session this phase belongs to |
| timestamp | string (ISO 8601) | yes | When the phase started |
| phase | string | yes | Phase identifier (e.g., "create_project", "navigate_tabs") |
| phaseIndex | number | yes | Zero-based index of this phase in the flow |
| totalPhases | number | yes | Total number of phases in the flow |
| variant | string | yes | A/B test variant |
| fromPhase | string \| null | no | Previous phase identifier (null for first phase) |
| navigatedVia | "continue" \| "back" \| "auto" \| "initial" | no | How the user arrived at this phase |

**Example payload:**

```json
{
  "event": "tutorial_phase_start",
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-28T14:30:05.000Z",
  "phase": "create_project",
  "phaseIndex": 1,
  "totalPhases": 8,
  "variant": "control",
  "fromPhase": "welcome",
  "navigatedVia": "continue"
}
```

---

## 3. tutorial_phase_complete

**Description:** Fired when a user successfully completes a phase's required action. This is distinct from `phase_skip` — completion means the user performed the intended interaction.

**When fired:** When the phase's success condition is met. For action phases: when the user performs the required gesture/tap/input. For auto-advance phases: when the timer expires. For observation phases: when the user taps Continue after viewing.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| sessionId | string (UUID) | yes | Session this event belongs to |
| timestamp | string (ISO 8601) | yes | When the phase was completed |
| phase | string | yes | Phase identifier |
| phaseIndex | number | yes | Zero-based phase index |
| duration | number | yes | Seconds spent on this phase (from phase_start to phase_complete) |
| action | string | yes | What the user did to complete the phase (e.g., "tapped_button", "filled_form", "swiped", "auto_advanced") |
| variant | string | yes | A/B test variant |
| interactionCount | number | no | Number of interactions within the phase before completion |

**Example payload:**

```json
{
  "event": "tutorial_phase_complete",
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-28T14:30:12.000Z",
  "phase": "create_project",
  "phaseIndex": 1,
  "duration": 7.2,
  "action": "filled_form",
  "variant": "control",
  "interactionCount": 3
}
```

---

## 4. tutorial_phase_skip

**Description:** Fired when a user skips a phase using the Skip button. The user chose not to complete the phase's intended action.

**When fired:** When the user taps/clicks the Skip button during a phase.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| sessionId | string (UUID) | yes | Session this event belongs to |
| timestamp | string (ISO 8601) | yes | When the skip occurred |
| phase | string | yes | Phase that was skipped |
| phaseIndex | number | yes | Zero-based phase index |
| timeBeforeSkip | number | yes | Seconds spent on the phase before skipping |
| variant | string | yes | A/B test variant |

**Example payload:**

```json
{
  "event": "tutorial_phase_skip",
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-28T14:30:09.000Z",
  "phase": "create_project",
  "phaseIndex": 1,
  "timeBeforeSkip": 4.1,
  "variant": "control"
}
```

---

## 5. tutorial_phase_back

**Description:** Fired when a user navigates backward to a previous phase using the Back button.

**When fired:** When the user taps/clicks the Back button.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| sessionId | string (UUID) | yes | Session this event belongs to |
| timestamp | string (ISO 8601) | yes | When the back navigation occurred |
| phase | string | yes | Phase the user navigated back TO |
| fromPhase | string | yes | Phase the user navigated back FROM |
| phaseIndex | number | yes | Index of the phase navigated to |
| variant | string | yes | A/B test variant |

**Example payload:**

```json
{
  "event": "tutorial_phase_back",
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-28T14:30:15.000Z",
  "phase": "create_project",
  "fromPhase": "navigate_tabs",
  "phaseIndex": 1,
  "variant": "control"
}
```

**Analysis note:** High back-button usage at a specific phase suggests the user is confused and trying to re-read previous instructions. This is a signal that the current phase's instructions are unclear, or that the previous phase did not build sufficient understanding.

---

## 6. tutorial_dropoff

**Description:** Fired when a user abandons the tutorial without completing it. This is a critical event for funnel analysis.

**When fired:** Under three conditions:
1. The user closes the app/tab/page during the tutorial.
2. The user backgrounds the app and does not return within 30 seconds.
3. The user navigates away from the tutorial view without completing it.

**Implementation notes:**
- On iOS: observe `UIApplication.willResignActiveNotification` and `scenePhase` changes. Use a 30-second timer for background detection.
- On web: use `visibilitychange` event with a 30-second timer, and `beforeunload` with `navigator.sendBeacon` for page close.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| sessionId | string (UUID) | yes | Session this event belongs to |
| timestamp | string (ISO 8601) | yes | When the dropoff was detected |
| lastPhase | string | yes | The last phase the user was on when they dropped off |
| lastPhaseIndex | number | yes | Index of the last phase |
| totalTime | number | yes | Total seconds from session_start to dropoff |
| phasesCompleted | number | yes | Number of phases completed before dropoff |
| phasesSkipped | number | yes | Number of phases skipped before dropoff |
| variant | string | yes | A/B test variant |
| dropoffTrigger | "app_close" \| "background" \| "navigate_away" | no | What caused the dropoff |

**Example payload:**

```json
{
  "event": "tutorial_dropoff",
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-28T14:30:25.000Z",
  "lastPhase": "navigate_tabs",
  "lastPhaseIndex": 2,
  "totalTime": 25.3,
  "phasesCompleted": 2,
  "phasesSkipped": 0,
  "variant": "control",
  "dropoffTrigger": "app_close"
}
```

---

## 7. tutorial_complete

**Description:** Fired when the user successfully finishes the tutorial. This is the terminal success event.

**When fired:** When the completion screen's CTA is pressed, or when the user reaches the final phase's success condition (whichever is the defined completion point for the flow).

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| sessionId | string (UUID) | yes | Session this event belongs to |
| timestamp | string (ISO 8601) | yes | When the tutorial was completed |
| totalTime | number | yes | Total seconds from session_start to completion |
| phasesCompleted | number | yes | Number of phases completed (not skipped) |
| phasesSkipped | number | yes | Number of phases skipped |
| totalPhases | number | yes | Total phases in the flow |
| variant | string | yes | A/B test variant |
| flow | string | yes | Tutorial flow identifier |

**Example payload:**

```json
{
  "event": "tutorial_complete",
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-28T14:30:55.000Z",
  "totalTime": 55.0,
  "phasesCompleted": 6,
  "phasesSkipped": 2,
  "totalPhases": 8,
  "variant": "control",
  "flow": "creator_onboarding"
}
```

---

## 8. tutorial_action

**Description:** Fired when the user performs an interaction within a phase. This is a granular event for understanding in-phase behavior — which buttons they tap, which fields they fill, which tabs they explore.

**When fired:** On each discrete user interaction within a tutorial phase. Not for navigation (that is captured by phase events) — for in-phase actions like tapping a highlighted button, filling a form field, swiping a view.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| sessionId | string (UUID) | yes | Session this event belongs to |
| timestamp | string (ISO 8601) | yes | When the action occurred |
| phase | string | yes | Current phase identifier |
| phaseIndex | number | yes | Current phase index |
| actionType | string | yes | Type of action (e.g., "tap", "swipe", "input", "select") |
| target | string | yes | What was interacted with (e.g., "create_button", "project_name_field", "schedule_tab") |
| variant | string | yes | A/B test variant |
| value | string \| null | no | Value associated with the action (e.g., input text length, selected option). Never include PII. |

**Example payload:**

```json
{
  "event": "tutorial_action",
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-28T14:30:08.000Z",
  "phase": "create_project",
  "phaseIndex": 1,
  "actionType": "input",
  "target": "project_name_field",
  "variant": "control",
  "value": "12"
}
```

**Privacy note:** Never include actual user input in the `value` field. Use metadata instead — string length, selected option index, boolean (filled/empty). Personally identifiable information must not appear in analytics events.

---

## 9. tutorial_experiment

**Description:** Fired once per session to record the A/B test variant assignment. This event exists as an explicit record of variant assignment, separate from the session_start event that also carries the variant.

**When fired:** Immediately after variant assignment, which occurs during `tutorial_session_start`.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| sessionId | string (UUID) | yes | Session this experiment applies to |
| timestamp | string (ISO 8601) | yes | When the variant was assigned |
| experimentId | string | yes | Identifier for the experiment (e.g., "onboarding_v2_copy") |
| variant | string | yes | The assigned variant (e.g., "control", "treatment_a", "treatment_b") |
| userId | string \| null | no | User ID if available |

**Example payload:**

```json
{
  "event": "tutorial_experiment",
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-28T14:30:00.100Z",
  "experimentId": "onboarding_v2_copy",
  "variant": "treatment_a",
  "userId": "usr_abc123"
}
```

---

## TypeScript Type Definitions (Web)

```typescript
type Platform = "ios" | "web"
type NavigationMethod = "continue" | "back" | "auto" | "initial"
type DropoffTrigger = "app_close" | "background" | "navigate_away"

interface TutorialSessionStart {
  event: "tutorial_session_start"
  sessionId: string
  timestamp: string
  flow: string
  platform: Platform
  variant: string
  userId?: string | null
  deviceType?: string
  appVersion?: string
  isReturningUser?: boolean
}

interface TutorialPhaseStart {
  event: "tutorial_phase_start"
  sessionId: string
  timestamp: string
  phase: string
  phaseIndex: number
  totalPhases: number
  variant: string
  fromPhase?: string | null
  navigatedVia?: NavigationMethod
}

interface TutorialPhaseComplete {
  event: "tutorial_phase_complete"
  sessionId: string
  timestamp: string
  phase: string
  phaseIndex: number
  duration: number
  action: string
  variant: string
  interactionCount?: number
}

interface TutorialPhaseSkip {
  event: "tutorial_phase_skip"
  sessionId: string
  timestamp: string
  phase: string
  phaseIndex: number
  timeBeforeSkip: number
  variant: string
}

interface TutorialPhaseBack {
  event: "tutorial_phase_back"
  sessionId: string
  timestamp: string
  phase: string
  fromPhase: string
  phaseIndex: number
  variant: string
}

interface TutorialDropoff {
  event: "tutorial_dropoff"
  sessionId: string
  timestamp: string
  lastPhase: string
  lastPhaseIndex: number
  totalTime: number
  phasesCompleted: number
  phasesSkipped: number
  variant: string
  dropoffTrigger?: DropoffTrigger
}

interface TutorialComplete {
  event: "tutorial_complete"
  sessionId: string
  timestamp: string
  totalTime: number
  phasesCompleted: number
  phasesSkipped: number
  totalPhases: number
  variant: string
  flow: string
}

interface TutorialAction {
  event: "tutorial_action"
  sessionId: string
  timestamp: string
  phase: string
  phaseIndex: number
  actionType: string
  target: string
  variant: string
  value?: string | null
}

interface TutorialExperiment {
  event: "tutorial_experiment"
  sessionId: string
  timestamp: string
  experimentId: string
  variant: string
  userId?: string | null
}

type TutorialEvent =
  | TutorialSessionStart
  | TutorialPhaseStart
  | TutorialPhaseComplete
  | TutorialPhaseSkip
  | TutorialPhaseBack
  | TutorialDropoff
  | TutorialComplete
  | TutorialAction
  | TutorialExperiment
```
