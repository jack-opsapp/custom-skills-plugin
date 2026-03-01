---
name: flow-architect
description: This skill should be used when designing tutorial phase sequences, defining tutorial flow structure, creating branching tutorial logic, specifying phase timing and auto-advance rules, designing phase transitions, or producing a phase-by-phase tutorial specification for iOS or web apps.
---

# Flow Architect

## Purpose

Design concrete phase-by-phase tutorial flows with timing, interactions, and branching logic. Transform an onboarding strategy into a precise, implementable flow specification that defines every phase, transition, spotlight target, and user interaction in the tutorial sequence.

**Announce at start:** "I'm using the flow-architect skill to design a tutorial flow specification."

**Workflow position:**
```
onboarding-strategist  →  flow-architect  →  tutorial-copywriter  →  tutorial-ux-design  →  implementation
```

## When to Use

- Designing a new tutorial flow from scratch
- Converting an onboarding strategy document into phase-level detail
- Defining branching logic for role-based or goal-based tutorials
- Specifying phase timing, auto-advance rules, and pacing rhythm
- Producing a phase-by-phase specification for handoff to copywriting and UX design

**NOT for:** Writing tooltip text (use `tutorial-copywriter`). Designing overlay visuals or positioning (use `tutorial-ux-design`). High-level strategy before specific flows exist (use `onboarding-strategist`).

---

## Prerequisites

Before beginning flow design, confirm the following inputs exist:

1. **Onboarding Strategy document** — from the onboarding-strategist skill or equivalent. Must include: target user personas, activation metrics, key features to teach, and high-level flow approach.
2. **Screen inventory** — list of screens/tabs available in the app. Identify which screens the tutorial will touch.
3. **Platform target** — iOS, web, or both. This affects timing defaults, haptic availability, and gesture vocabulary.

If any prerequisite is missing, stop and ask for it before proceeding.

---

## Step 1: Choose a Flow Template

Select a flow template from `references/flow-templates.md` based on app complexity and user needs:

| Template | Best For | Phase Count | Time Range |
|----------|----------|-------------|------------|
| Linear | Simple apps, single user role | 6-12 | 30-60s |
| Branching | Apps with distinct user types | 8-18 per branch | 30-90s |
| Hub-and-Spoke | Dashboard-centric apps | 10-20 | 45-90s |
| Progressive Unlock | Complex apps, multi-session | 15-30 | 60-120s |

State the chosen template and justify the choice with one sentence referencing the app's complexity, user types, or structure.

---

## Step 2: Define the Phase Sequence

List every phase in order. For each phase, assign:

- A sequential number (1, 2, 3...)
- A target screen/tab where the phase takes place
- A brief purpose statement (one sentence: what the user learns or does)

Group phases by screen. Minimize screen transitions — complete all phases on one screen before moving to the next, unless the flow logic requires interleaving.

Example sequence outline:
```
Phase 1-3:  Job Board (orientation, FAB discovery, first interaction)
Phase 4-6:  Project Form (fill fields, assign crew, submit)
Phase 7-9:  Calendar (view result, navigate weeks, understand schedule)
Phase 10:   Completion (celebration + next steps)
```

---

## Step 3: Specify Phase Properties

For each phase, define ALL of the following properties. Do not skip any property — set explicit values or `none`/`false` for unused fields.

### Required Phase Properties

| Property | Type | Description |
|----------|------|-------------|
| `phaseName` | string | Kebab-case, max 30 chars. Format: `screen-action` (e.g., `job-board-intro`, `project-form-client`) |
| `screen` | string | Which screen/tab is active during this phase |
| `tooltipText` | string | Headline text, 6-8 words, verb-first. Placeholder OK — copywriter finalizes later. |
| `tooltipDescription` | string | Supporting detail, 1-2 lines max. Placeholder OK. |
| `userAction` | enum | `tap` / `swipe` / `drag` / `type` / `pinch` / `long-press` / `none` |
| `autoAdvanceMs` | integer | Milliseconds. `0` = no auto-advance. Range `2000-6000` for auto phases. |
| `continueButton` | enum | `immediate` / `delayed` / `none` |
| `continueLabel` | string | `"Continue"` / `"Next"` / `"Got it"` / `"Let's Go"` / custom |
| `spotlightTarget` | string | Element identifier or description. `"none"` for no spotlight. |
| `spotlightPadding` | integer | Pixels. Default `8`. Use `16` for small elements. |
| `hapticType` | enum | `lightTap` / `mediumImpact` / `success` / `error` / `warning` / `none`. iOS only — set `none` for web. |
| `showsSwipeHint` | boolean | Whether a swipe gesture indicator is displayed |
| `swipeDirection` | enum | `left` / `right` / `up` / `down` / `none` |
| `requiresUserAction` | boolean | Whether the phase blocks until the user performs the specified action |
| `isActionPhase` | boolean | `true` shows 3-button action bar (Back/Skip/Continue). `false` shows single continue. |
| `estimatedDurationSec` | integer | Expected seconds the user spends on this phase. Used for pacing and total time. |

### Property Defaults by Phase Type

Apply these defaults, then override as needed:

**Orientation phase** (introducing a screen): `userAction: none`, `autoAdvanceMs: 0`, `continueButton: delayed`, `hapticType: lightTap`, `estimatedDurationSec: 4`

**Action phase** (user performs a gesture): `userAction: tap/swipe/etc`, `autoAdvanceMs: 0`, `continueButton: none`, `requiresUserAction: true`, `isActionPhase: true`, `estimatedDurationSec: 6`

**Form phase** (user fills a field): `userAction: type`, `autoAdvanceMs: 0`, `continueButton: immediate`, `requiresUserAction: true`, `estimatedDurationSec: 10`

**Auto-advance phase** (brief info flash): `userAction: none`, `autoAdvanceMs: 3000`, `continueButton: none`, `hapticType: none`, `estimatedDurationSec: 3`

**Celebration phase** (milestone reached): `userAction: none`, `autoAdvanceMs: 0`, `continueButton: immediate`, `continueLabel: "Let's Go"`, `hapticType: success`, `estimatedDurationSec: 4`

---

## Step 4: Design Branching Logic

If the chosen template is Branching, define:

1. **Decision point phase** — the phase where the user makes a choice (e.g., role selection, goal selection)
2. **Branch conditions** — what determines which branch is taken (user selection, data from profile, feature flag)
3. **Branch definitions** — for each branch:
   - Branch name (e.g., `branch-field-crew`, `branch-office-admin`)
   - Phase sequence within the branch
   - Number of phases
   - Estimated time for the branch
4. **Merge point** — the phase where branches reconverge (shared completion, shared feature)

For non-branching flows, state "No branching — linear flow" and move to Step 5.

### Branching Rules

- Maximum 3 branches from a single decision point
- Each branch must be self-contained (no cross-branch dependencies)
- All branches must reach a merge point or a distinct completion phase
- Branch length difference should not exceed 50% (if one branch is 6 phases, the other should be 4-9)

---

## Step 5: Calculate Total Estimated Time

Sum `estimatedDurationSec` for all phases in the primary path (longest branch if branching).

| Target | Mobile | Web |
|--------|--------|-----|
| Ideal | 30-60s | 45-90s |
| Acceptable | 60-90s | 90-120s |
| Too long | >90s | >120s |

If the total exceeds the acceptable range:
- Remove phases that teach non-critical features
- Merge adjacent phases that share a screen and teach related concepts
- Convert read-only phases to auto-advance to reduce active time
- Split the flow into Session 1 (core) and Session 2 (advanced) using the Progressive Unlock template

Consult `references/timing.md` for per-phase timing benchmarks when adjusting.

---

## Step 6: Review Pacing Rhythm

Apply the following pacing rules and adjust the sequence if any rule is violated:

1. **Alternate action and passive phases.** Never place more than 4 action phases in a row without a passive/orientation break.
2. **Limit auto-advance streaks.** Maximum 3 auto-advance phases in a row. Users lose agency if they watch too many phases play without interaction.
3. **Place celebration phases every 4-6 phases.** Celebrations mark milestones, reset cognitive load, and provide motivation to continue.
4. **Start gentle.** The first 2-3 phases should be orientation/passive. Do not open with an action phase.
5. **End strong.** The final phase must be a celebration or clear call-to-action — never an auto-advance.
6. **Vary spotlight targets.** Do not spotlight the same element in consecutive phases unless the second phase requires interaction with it after an orientation phase introduced it.

### Pacing Checklist

- [ ] No more than 4 consecutive action phases
- [ ] No more than 3 consecutive auto-advance phases
- [ ] Celebration every 4-6 phases
- [ ] First 2-3 phases are passive/orientation
- [ ] Final phase is celebration or CTA
- [ ] Spotlight targets vary across consecutive phases
- [ ] Total time within target range for the platform

---

## Step 7: Design Skip Behavior

Define skip behavior for the flow:

- **Default:** All phases are skippable. The user can tap "Skip" on any phase to advance.
- **Critical phases:** Flag phases that should warn before skipping (e.g., "This step is important for getting started. Skip anyway?"). Limit to 2-3 critical phases max.
- **Full skip:** Allow the user to exit the entire tutorial at any point via a "Skip Tutorial" option in the action bar.
- **Skip memory:** If a user skips, record the last completed phase so the tutorial can be resumed later.

List critical phases by name and explain why each is critical.

---

## Output: Flow Specification

Produce the complete flow specification in the following format. This is the primary deliverable of the flow-architect skill.

```markdown
## Flow Specification: [Flow Name]

**Template:** [linear / branching / hub-and-spoke / progressive-unlock]
**Platform:** [iOS / web / both]
**Total phases:** [count]
**Estimated time:** [seconds]s ([minutes]m [seconds]s)
**Branches:** [none / list branch names]
**Critical phases:** [list phase names]

### Phase Table

| # | Phase Name | Screen | Action | Auto-Advance | Continue | Spotlight Target | Haptic | Duration |
|---|-----------|--------|--------|-------------|----------|-----------------|--------|----------|
| 1 | job-board-intro | Job Board | none | 0 | delayed | none | lightTap | 4s |
| 2 | fab-discovery | Job Board | none | 0 | delayed | FAB button | lightTap | 4s |
| 3 | fab-tap | Job Board | tap | 0 | none | FAB button | mediumImpact | 6s |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

### Phase Details

#### Phase 1: job-board-intro
- **phaseName:** job-board-intro
- **screen:** Job Board
- **tooltipText:** "Welcome to your Job Board"
- **tooltipDescription:** "This is where all your projects live."
- **userAction:** none
- **autoAdvanceMs:** 0
- **continueButton:** delayed
- **continueLabel:** "Next"
- **spotlightTarget:** none
- **spotlightPadding:** 8
- **hapticType:** lightTap
- **showsSwipeHint:** false
- **swipeDirection:** none
- **requiresUserAction:** false
- **isActionPhase:** false
- **estimatedDurationSec:** 4

[Repeat for every phase]

### Flow Diagram

```
[1] job-board-intro
 │
 ▼
[2] fab-discovery
 │
 ▼
[3] fab-tap ← USER ACTION
 │
 ▼
[4] project-form-intro
 │
 ▼
...
 │
 ▼
[N] celebration-complete ★
```

### Branching Diagram (if applicable)

```
[1] role-select
 │
 ├──► Branch A: field-crew (phases 2a-6a)
 │                 │
 │                 ▼
 │    [merge] shared-features
 │                 │
 └──► Branch B: office-admin (phases 2b-5b)
                   │
                   ▼
      [merge] shared-features
```

### Pacing Analysis

- **Total phases:** [count]
- **Action phases:** [count] ([percentage]%)
- **Auto-advance phases:** [count] ([percentage]%)
- **Passive/orientation phases:** [count] ([percentage]%)
- **Celebration points:** phases [list numbers]
- **Longest action streak:** [count] phases (phases [range])
- **Longest passive streak:** [count] phases (phases [range])
- **Screen transitions:** [count] ([list screen changes])
```

---

## Phase Naming Convention

Follow the `screen-action` format consistently:

| Screen | Example Phase Names |
|--------|-------------------|
| Job Board | `job-board-intro`, `job-board-fab-tap`, `job-board-project-card` |
| Project Form | `project-form-client`, `project-form-date`, `project-form-crew` |
| Calendar | `calendar-week-view`, `calendar-swipe-week`, `calendar-day-tap` |
| Schedule | `schedule-intro`, `schedule-drag-assign` |
| Settings | `settings-profile`, `settings-notifications` |
| Completion | `celebration-complete`, `celebration-midpoint` |

Rules:
- Kebab-case only. No camelCase, no underscores.
- Maximum 30 characters.
- Screen name comes first, action/element comes second.
- Use verbs for action phases (`tap`, `swipe`, `drag`, `fill`, `select`).
- Use nouns for orientation phases (`intro`, `overview`, `summary`).

---

## Reference Files

Consult these reference documents during flow design:

- `references/patterns.md` — 8 tutorial flow patterns with implementation guidance
- `references/flow-templates.md` — 4 reusable flow structures with diagrams and use cases
- `references/timing.md` — Timing guidelines, attention span data, and pacing benchmarks
