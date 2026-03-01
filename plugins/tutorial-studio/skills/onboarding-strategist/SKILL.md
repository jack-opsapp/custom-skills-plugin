---
name: onboarding-strategist
description: This skill should be used when designing onboarding strategy, planning what information to gather during signup, determining mandatory vs optional fields, designing progressive disclosure layers, planning permission request timing, engineering time-to-first-value, creating personalization strategies, or designing skip and escape mechanisms for onboarding tutorials.
---

# Onboarding Strategist

## Purpose

Serve as the strategic brain of the tutorial production pipeline. Take an App Profile (produced by app-analyzer) and design the complete onboarding strategy — the high-level plan that determines what information to collect, when to collect it, what to show first, what to defer, how to personalize, and how to get the user to their aha moment in the shortest possible time.

This skill does not design individual tutorial phases or write copy. It produces the strategic blueprint that the flow-architect, tutorial-copywriter, and tutorial-interface skills consume downstream.

---

## Prerequisites

Require a completed App Profile from the app-analyzer skill before proceeding. The strategy depends on:
- The identified aha moment (determines optimization target)
- The screen inventory (determines what can be shown or deferred)
- The interactive elements catalog (determines what interactions to teach)
- The navigation structure (determines flow complexity)
- The complexity score (determines strategy depth)

If no App Profile exists, instruct the user to run app-analyzer first. Do not attempt to design strategy from assumptions.

---

## Strategy Design Process

### Step 1: Confirm the Aha Moment

Validate or refine the aha moment identified in the App Profile. The entire onboarding strategy optimizes for reaching this moment in the shortest time with the least friction.

Validation criteria:
- The action must produce a visible, tangible result the user can see or interact with.
- The action must relate to the app's core value proposition — not a secondary feature.
- The action must be achievable on the first session — not require days of data accumulation.
- The action must be achievable solo — not require another user to respond or participate (unless the app simulates this).

If the aha moment from the App Profile fails any of these criteria, refine it. Document the original and the refinement with justification.

### Step 2: Design the 60-Second Win Path

Strip everything non-essential between app launch and aha moment. This is the minimum viable onboarding — the fastest possible route to value.

Process:
1. List every screen currently between launch and aha moment (from the Core User Journey in the App Profile).
2. For each screen, ask: "Can the user reach the aha moment without seeing this screen?" If yes, defer it.
3. For each form field on remaining screens, ask: "Can the user reach the aha moment without filling this field?" If yes, make it optional or defer it.
4. Count the remaining mandatory interactions (taps, fills, selections).
5. Target: 5-8 mandatory interactions maximum. If the count exceeds 8, further reduce by pre-filling defaults, combining steps, or deferring fields to post-aha editing.
6. Estimate time: 3-5 seconds per interaction = 15-40 seconds ideal, 60 seconds maximum.

Document the stripped-down path as a numbered list:
```
1. [Launch] — 0 interactions
2. [Screen: action] — N interactions
3. [Screen: action] — N interactions
...
N. [Aha moment achieved] — total: X interactions, ~Y seconds
```

### Step 3: Classify Information-Gathering Fields

Categorize every piece of information the app collects from the user during onboarding.

**Decision framework — apply this test to each field:**

| Question | If YES | If NO |
|----------|--------|-------|
| Does the core feature literally break without this data? | MANDATORY | Continue to next question |
| Does the aha moment become impossible without this data? | MANDATORY | Continue to next question |
| Does this data meaningfully improve the first experience? | OPTIONAL — collect during onboarding but allow skip | Continue to next question |
| Is this data only useful for advanced features? | DEFERRED — collect when feature is first accessed | DEFERRED |

Examples:
- **Company name** in a project management app → MANDATORY (projects are organized under a company)
- **Profile photo** → DEFERRED (no feature depends on it during first session)
- **Role selection** (owner vs crew) → MANDATORY if it determines which screens are shown; OPTIONAL if it only affects minor UI variations
- **Notification preferences** → DEFERRED (ask after user has seen the value of notifications)
- **Team size** → OPTIONAL (helps personalization but does not block any feature)

Produce a complete classification table:

```markdown
| Field | Classification | Justification |
|-------|---------------|---------------|
| [field name] | MANDATORY / OPTIONAL / DEFERRED | [one sentence] |
```

### Step 4: Design Progressive Disclosure Layers

Organize the app's feature set into layers that unlock progressively as the user gains familiarity.

**Layer 1 — Day 0 (First session):**
- Core workflow only: create, view, and complete the primary object (project, task, event, message).
- Maximum 3-4 features visible.
- Hide: settings, advanced options, integrations, team management, reporting.
- Trigger to advance: user completes the aha moment action.

**Layer 2 — Day 1-3 (Return sessions):**
- Team features (invite, assign, share).
- Customization (themes, preferences, notification settings).
- Secondary workflows (editing, archiving, filtering, sorting).
- Trigger to advance: user has created N items OR completed N sessions (use the lower threshold).

**Layer 3 — Day 7+ (Established user):**
- Advanced features (reporting, analytics, integrations, export).
- Power-user tools (bulk actions, keyboard shortcuts, automation).
- Administrative features (billing, permissions, audit logs).
- Trigger: user has been active for N days OR has reached N items/actions.

Rules:
- Never use more than 3 layers. Three is the maximum. Two is acceptable for simpler apps.
- Unlock by usage milestones, not calendar time. A power user who does 50 actions on Day 1 should unlock Layer 2 on Day 1.
- Each layer should feel like a natural discovery, not a paywall. Use contextual prompts ("Now that you have 3 projects, did you know you can filter them?") rather than blanket feature reveals.

Document each layer with: features included, features hidden, unlock trigger, and estimated user state at unlock.

### Step 5: Plan Permission Request Timing

Map every system permission the app requests and design the timing for each.

**Principle: request at the moment of relevance, never at launch.**

For each permission:
1. Identify the specific feature that requires it.
2. Identify the moment the user first encounters that feature.
3. Design a pre-permission prompt that explains the benefit BEFORE the system dialog appears.
4. Provide a graceful degradation path if the user declines.

Common permissions and timing:

| Permission | Request When | Pre-Prompt Copy Pattern |
|-----------|-------------|------------------------|
| Location | User taps "Map" or "Nearby" for the first time | "Enable location to see [relevant items] near you" |
| Camera | User taps "Scan" or "Take Photo" for the first time | "Allow camera access to [specific action]" |
| Notifications | After the user has received value (post-aha moment) | "Get notified when [valuable event] happens" |
| Contacts | User taps "Invite Team" or "Add Friends" | "Access contacts to quickly invite your team" |
| Calendar | User accesses scheduling feature | "Sync with your calendar to avoid conflicts" |
| Photos | User taps "Upload" or "Add Image" | "Choose photos from your library to [purpose]" |

Never batch permission requests. Never request permissions during onboarding signup flow. The only exception: if the aha moment itself requires a permission (e.g., a camera app), request it immediately before the aha action with clear context.

### Step 6: Design Personalization

If the app serves distinct user types, roles, or goals, design branching personalization.

**Role-based personalization:**
- Identify distinct user roles from the App Profile (e.g., owner vs employee, buyer vs seller, teacher vs student).
- Design a role selection step placed AFTER the user has committed (post-signup, not pre-signup).
- Map which screens, features, and tutorial phases differ by role.
- Minimize divergence — shared phases reduce maintenance cost. Only branch where the experience genuinely differs.

**Goal-based personalization:**
- Identify 2-4 primary goals users might have (e.g., "Manage projects," "Track expenses," "Schedule team").
- Design a goal selection step: "What do you want to do first?" with 2-4 clear options.
- Each goal maps to a different aha moment path, but all converge at the same destination.

**Behavior-based adaptation:**
- If the user completes an action before the tutorial teaches it, skip that tutorial phase.
- If the user spends extended time on a screen, offer contextual help.
- If the user repeatedly taps a disabled feature, explain when it unlocks.

Document the personalization strategy with: branching point, branch options, divergent phases, convergence point, and the specific UI for the selection step.

### Step 7: Design Skip and Escape Mechanisms

Every tutorial phase must be skippable. Every onboarding flow must have an exit.

**Phase-level skip:**
- Provide a "Skip" or "I know this" button on every tutorial phase.
- Skipping a phase marks it as skipped (not completed) — allow revisiting later.
- Never punish skipping. Do not show warnings or guilt-inducing copy.

**Flow-level escape:**
- Provide a persistent "Exit Tutorial" or "Explore on my own" option.
- Exiting preserves progress — the user can resume from where they left off.
- After exit, show a subtle, non-blocking prompt to resume ("Pick up where you left off?") on the next session, once only.

**Re-entry:**
- Provide a way to restart or revisit the tutorial from settings or a help menu.
- Do not auto-restart the tutorial on subsequent launches.

Reference: skippable onboarding flows show 25% higher completion rates than forced flows (see `references/benchmarks.md`). Users who skip are often power users who do not need guidance — forcing them through a tutorial they do not need creates resentment, not education.

### Step 8: Plan Gamification Elements

Design progress feedback and motivational mechanics for the onboarding flow.

**Required (every tutorial):**
- **Progress indicator**: show "Step X of Y" or a progress bar on every phase. Use filled/unfilled dots, a linear progress bar, or a checklist. The user must always know where they are and how much remains.
- **Endowed progress**: pre-complete the first step. If signup is step 1, show "1 of 6 complete" immediately after signup. This leverages the Endowed Progress Effect (see `references/psychology.md`).

**Recommended (complexity 3+):**
- **Milestone celebrations**: at the completion of every 4-6 phases, show a brief celebration (confetti, checkmark animation, congratulatory copy). Keep it under 2 seconds.
- **Completion reward**: at the end of the tutorial, show a summary of what the user accomplished ("You created your first project, added a task, and invited a team member").

**Optional (complexity 4+):**
- **Achievement badges**: for completing optional tutorial branches or advanced features.
- **Team progress**: if the app is team-based, show team onboarding progress ("3 of 5 team members completed setup").

Do not over-gamify. Gamification must serve clarity and motivation, not distract from the core workflow. If in doubt, use fewer gamification elements, not more.

---

## Output Format

Produce the Onboarding Strategy document in this structure:

```markdown
## Onboarding Strategy

### Aha Moment (Confirmed)
**Action:** [specific action]
**Value:** [what user gets]
**Target time from launch:** [seconds]

### 60-Second Win Path
1. [Step] — [interactions] interactions
2. [Step] — [interactions] interactions
...
**Total:** [N] interactions, ~[N] seconds

### Field Classification
| Field | Classification | Justification |
|-------|---------------|---------------|
| ... | MANDATORY / OPTIONAL / DEFERRED | ... |

### Progressive Disclosure
| Layer | Features | Unlock Trigger |
|-------|----------|----------------|
| Layer 1 (Day 0) | [list] | [trigger] |
| Layer 2 (Day 1-3) | [list] | [trigger] |
| Layer 3 (Day 7+) | [list] | [trigger] |

### Permission Timing
| Permission | Request Moment | Pre-Prompt | Decline Path |
|-----------|---------------|------------|--------------|
| ... | ... | ... | ... |

### Personalization
**Type:** [role-based / goal-based / behavior-based / none]
**Branching point:** [where in the flow]
**Branches:** [list]
**Convergence:** [where branches rejoin]

### Skip/Escape Design
- Phase skip: [mechanism]
- Flow exit: [mechanism]
- Re-entry: [mechanism]

### Gamification
- Progress indicator: [type]
- Endowed progress: [implementation]
- Celebrations: [frequency and type]
- Completion reward: [description]
```

---

## Reference Documents

The following reference documents provide the research basis and guardrails for strategic decisions:

- **`references/psychology.md`** — Seven psychological principles that underpin every strategic choice. Consult when justifying design decisions or resolving tradeoffs.
- **`references/benchmarks.md`** — Hard data on activation rates, retention curves, and conversion impact. Use to set targets and justify investment in onboarding improvements.
- **`references/anti-patterns.md`** — Eight retention killers with real-world data. Consult as a negative checklist — verify the strategy avoids every listed anti-pattern before finalizing.

---

## After Completion

Once the Onboarding Strategy is complete, inform the user that it is ready for downstream use. The immediate next steps are:
- **Flow Architect** — to translate the strategy into a phase-by-phase tutorial flow with specific screens, interactions, and transitions
- **Tutorial Auditor** — if an existing tutorial was detected, to score it against this strategy and identify gaps

Present the completed strategy and ask the user which direction to take next. Do not proceed automatically.
