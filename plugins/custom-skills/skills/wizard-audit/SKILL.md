---
name: wizard-audit
description: This skill should be used when the user asks to "audit a wizard", "review wizard flow", "check wizard edge cases", "war-game a wizard", "test wizard permissions", "wizard QA", "audit tutorial flow", "wizard bug", "wizard stuck", or when designing, reviewing, or debugging any in-app guided wizard in the OPS iOS/Android apps. Provides a systematic checklist for identifying every possible failure mode in a wizard flow.
---

# Wizard Audit

Systematic audit framework for OPS in-app guided wizards. Produces a complete edge-case analysis covering prerequisites, per-step permission gating, role-variant paths, navigation failures, and cross-cutting concerns.

## When to Use

- Auditing an existing wizard after a bug report
- Designing a new wizard before implementation
- Reviewing a wizard after permission system changes
- QA pass before releasing a wizard to production

## Audit Process

Execute these phases in order. Do not skip phases.

### Phase 1: Read the Wizard Definition

Read the wizard's definition file from `OPS/OPS/Wizard/Definitions/`. Extract:

- `wizardId`, `minimumTier`, `requiredPermission`
- Every step: `id`, `instruction`, `completionNotification`, `canSkip`, `targetScreen`
- Trigger type (sequenced, contextual, data-condition) and trigger context

### Phase 2: Trace Every Notification Source

For each step's `completionNotification`, grep the codebase to find EXACTLY where it is posted. Record:

- File and line number where `NotificationCenter.default.post(name: ...)` fires
- What user action or view lifecycle event triggers it
- Whether the notification can fire from an unexpected location (e.g., a different tab or sheet)

### Phase 3: Role-Permission Matrix

Build a matrix of every role against every step. Consult these sources of truth:

- **`ops-software-bible/02_USER_EXPERIENCE_AND_WORKFLOWS.md`** section "Role-Based UI Differences"
- **`ops-software-bible/07_SPECIALIZED_FEATURES.md`** section 20 "Mobile Wizard System"
- **`OPS/OPS/Utilities/PermissionStore.swift`** for permission checking logic
- **`OPS/OPS/Views/`** for the actual UI the wizard targets — check which permission gates exist

For each step, determine:

| Check | How to Verify |
|---|---|
| Which permission is required to perform the step's action? | Read the target view's permission checks |
| Is the target UI element visible to this role? | Check conditional rendering in the view |
| Does the role see the same tab/section layout? | Check section visibility functions |
| Can the role navigate to the `targetScreen`? | Check tab bar config and section picker visibility |
| Is the data the step references visible to this role? | Check scope filtering (all vs assigned vs own) |

### Phase 4: Prerequisites Analysis

Determine what must be true BEFORE the wizard can start. Check against local SwiftData (wizards are offline-first).

| Prerequisite Category | Questions to Answer |
|---|---|
| **Data existence** | Does the user have the entities the wizard references? (projects, tasks, clients, inventory items, etc.) For scoped roles, check ASSIGNED entity count, not total. |
| **Permission gates** | Does the user have every non-skippable step's required permission? If not, is the wizard still meaningful with those steps auto-skipped? |
| **Feature flags** | Is the target feature behind a feature flag? Could it be disabled? |
| **Subscription state** | Could the user be in grace period or expired state? |
| **Onboarding state** | Has the user completed the 25-phase interactive tutorial? Could demo data still exist? |
| **Role validity** | Should `unassigned` role users see this wizard? (Usually no.) |
| **Concurrent wizards** | Could another wizard be active? (Only one at a time.) |

### Phase 5: Per-Step War Game

For EACH step, systematically evaluate every scenario below. Use the reference checklist in `references/step-checklist.md`.

**Navigation & Tab State:**
- Is the user on the correct main tab?
- Is the user on the correct sub-tab/section? (Crew have no section picker — silent auto-nav required)
- Does `navigateToCurrentStep()` handle both main tab AND sub-tab?
- What if the user navigated away and returned via "CONTINUE GUIDE"?

**Action Feasibility:**
- Can the user physically perform the required action? (permission, data, UI visibility)
- What if the target entity is in a terminal state? (e.g., all projects completed — can't swipe forward)
- What if the user has the data but it's empty? (e.g., closed projects section exists but is empty)
- Does `canSkip` match the action's feasibility? (Non-skippable + impossible = hard stuck)

**Notification Trigger Correctness:**
- Does the notification fire ONLY from the intended user action?
- Could it fire prematurely? (e.g., `onAppear` fires before user sees the content)
- Could it fire from a different context? (e.g., swiping a task when wizard expects project swipe)
- Could it fire from a sheet/modal that overlays the wizard target?

**Edge Cases:**
- What if the user performs the action twice? (notification fires again after step already completed)
- What if a sheet opens and the user swipe-dismisses it mid-step?
- What if the app backgrounds mid-step? (state persistence)
- What if network is offline during a step that modifies server data?
- What if another user changes the data the wizard references (sync conflict)?

### Phase 6: Cross-Cutting Concerns

Evaluate these system-level scenarios that apply to ALL wizards:

| Concern | Check |
|---|---|
| **Tab navigation away** | Does `WizardOverlayWindow` correctly detect leaving the target tab? Does "CONTINUE GUIDE" restore the correct sub-tab? |
| **Sheet/modal presentation** | Does the instruction bar persist above sheets? Can the user interact with the wizard while a sheet is open? |
| **App lifecycle** | Does `WizardState` persist correctly on background/kill? Does the wizard resume at the correct step? |
| **Cooldown interaction** | After "NOT NOW" (2-tap cooldown) or "NEVER" (48hr + do-not-show), does the wizard correctly suppress? |
| **Analytics** | Are all events tracked? (banner_shown, started, step_completed, step_skipped, abandoned, completed) |
| **Instruction bar layout** | Does the bar conflict with the tab bar, FAB, or keyboard? |
| **Haptic feedback** | Do step completions fire appropriate haptics? |
| **Tutorial system conflict** | Could the 25-phase tutorial be active simultaneously? |

### Phase 7: Output the Audit Report

Structure the report as follows:

```
## [Wizard Name] Audit Report

### Prerequisites
- List each prerequisite with current check status (checked/missing)
- Recommended prerequisite logic

### Role-Permission Matrix
| Step | Admin | Owner | Office | Operator | Crew | Unassigned |
|------|-------|-------|--------|----------|------|------------|
| (per step: can perform / auto-skip / stuck / N/A) |

### Per-Step Findings
For each step:
- Step ID and instruction
- Severity of each finding (CRITICAL / HIGH / MEDIUM / LOW)
- Current behavior
- Required fix

### Cross-Cutting Issues
- Any system-level problems found

### Recommended Changes (priority-ordered)
1. Critical fixes first
2. Then high, medium, low

### Prerequisite Documentation
Wizard: [name] ([id])
Trigger: [type] — [condition]
Minimum Tier: [tier]

Prerequisites:
  - [list]

Per-Step Requirements:
  Step N ([id]): [requirement] [auto-navigate/auto-skip/skippable/required]
```

## Key OPS-Specific Context

These facts apply to ALL wizard audits:

- **Crew has no section picker** — sub-tab navigation must be silent and automatic
- **Crew default tab is MY TASKS** on the job board, not projects
- **Scoped visibility**: crew sees only assigned projects/tasks. "Has projects" means "has assigned projects"
- **Operator** can see all projects but edit only assigned ones (scope=assigned)
- **FAB visibility varies by role** — crew only sees FAB on Schedule tab
- **Swipe-to-change-status** requires `projects.edit` (projects) or `tasks.change_status` (tasks)
- **Feature flags** can disable entire features at runtime
- **Wizards are offline-first** — all checks use local SwiftData
- **Real data, not demo data** — wizards operate on actual user data
- **Only one wizard active at a time** — `WizardStateManager` enforces this

## Additional Resources

### Reference Files

- **`references/step-checklist.md`** — Per-step checklist template (copy and fill for each step)
- **`references/role-permissions-map.md`** — Complete role-to-permission mapping for OPS

### Source of Truth Files

- `ops-software-bible/02_USER_EXPERIENCE_AND_WORKFLOWS.md` — Navigation, gestures, role-based UI
- `ops-software-bible/07_SPECIALIZED_FEATURES.md` § 20 — Wizard system spec and inventory
- `OPS/OPS/Wizard/Definitions/` — All wizard definition files
- `OPS/OPS/Wizard/State/WizardStateManager.swift` — State machine
- `OPS/OPS/Wizard/State/WizardTriggerService.swift` — Trigger conditions
- `OPS/OPS/Utilities/PermissionStore.swift` — Permission checking
