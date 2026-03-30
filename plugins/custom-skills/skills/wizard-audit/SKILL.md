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

### Phase 2: Verify Instruction Text Matches Actual UI

For EACH step, compare the `instruction` text against the ACTUAL UI element the user must interact with:

- **Button labels:** Read the actual button/menu item label from the source code. If the instruction says `TAP "CREATE CLIENT"` but the button label is `"New Client"`, that's a mismatch. Always grep for the element's label/title string.
- **Icon references:** If the instruction references an icon (e.g., "the + button"), verify the actual SF Symbol name in the code. The FAB uses `"bolt"` (lightning bolt), not `"plus"`.
- **Element types:** If the instruction says "tap" but the element is a text field, the instruction should say "enter" or "type."

Flag every mismatch as HIGH severity.

### Phase 3: Trace the Complete User Flow (Missing Step Detection)

This is the most critical phase. The wizard definition says what steps exist, but it may be MISSING steps the user must actually perform. Read every form/view the wizard touches and trace the actual user flow.

**For EACH form the wizard enters (e.g., ClientForm, ProjectForm, TaskForm):**

1. **Read the form's `isValid` / save-button-enabled logic.** Identify every field that must be non-nil or non-empty for the form to be saveable. If the wizard doesn't have a step for a REQUIRED field, the user gets stuck with a disabled Save/Create button. Flag as CRITICAL.

2. **Read the form's body layout and evaluate semantic completeness.** Walk through every section and field in visual order. For each field, ask TWO questions:
   - **"Does the wizard guide the user through this?"** — If a required field has no wizard step, the Save button is disabled. CRITICAL.
   - **"Does it make sense to save without this?"** — Even if the form PERMITS saving without a field, the wizard is teaching a new user the correct workflow. If the wizard skips a field that a user would normally fill (task type, dates, description, status), the result is a half-built record that misrepresents how the product should be used. Flag omissions that produce low-quality data as HIGH — the wizard is a teaching tool, not just a form-filler.

   Examples: A project without tasks is technically valid but useless. A task without a task type saves but renders as "Unknown Task" on the board. A project with no dates can't appear on the calendar. Ask: "If a new user creates this entity following only the wizard steps, will they see a complete, useful result?"

3. **Check for collapsed/hidden sections.** If a wizard target is inside an `ExpandableSection` (or similar collapsible container), check its default expanded state:
   - Read the `@State` variable controlling expansion (e.g., `isTasksExpanded`)
   - If it defaults to `false` in create mode, the wizard target is INVISIBLE
   - Flag as CRITICAL — the wizard must either add a step to expand the section OR auto-expand it via a `WizardStepChanged` listener

4. **Check for form-to-form transitions.** When the wizard's steps span multiple stacked sheets (e.g., ProjectForm → TaskForm → back to ProjectForm), verify:
   - There IS a step to CLOSE/SAVE each inner form before the wizard references the outer form
   - The instruction text for "save" steps SPECIFIES WHICH FORM to save (e.g., "SAVE THE TASK" vs "SAVE THE PROJECT") — otherwise the user sees two "Create" buttons and doesn't know which one the wizard means
   - Flag ambiguous "TAP CREATE" instructions as HIGH severity when multiple forms are stacked

5. **Check for permission-gated sub-elements within forms.** A form may be accessible but individual fields within it may be hidden by permission checks. If a wizard step targets a field that's conditionally rendered based on a permission the wizard doesn't check, flag as CRITICAL.

### Phase 4: Trace Every Notification Source

For each step's `completionNotification`, grep the codebase to find EXACTLY where it is posted. Record:

- File and line number where `NotificationCenter.default.post(name: ...)` fires
- What user action or view lifecycle event triggers it
- Whether the notification can fire from an unexpected location (e.g., a different tab or sheet)
- **For text input steps:** Does the notification fire on first keystroke (wrong — user hasn't finished typing), on keyboard dismiss / field deselect (correct), or on form save (correct for save steps)? Text input completion must fire on `.onSubmit` or `.onChange(of: focusedField)`, NEVER on `.onChange(of: text)` transitioning from empty to non-empty.

### Phase 5: Role-Permission Matrix

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

### Phase 6: Prerequisites Analysis

Determine what must be true BEFORE the wizard can start. Check against local SwiftData (wizards are offline-first).

| Prerequisite Category | Questions to Answer |
|---|---|
| **Data existence** | Does the user have the entities the wizard references? (projects, tasks, clients, inventory items, etc.) For scoped roles, check ASSIGNED entity count, not total. |
| **Permission gates (compound)** | The wizard's `requiredPermission` is a SINGLE permission, but individual steps may need ADDITIONAL permissions not checked at the wizard level (e.g., wizard gates on `projects.create` but step 2 needs `clients.create` for the FAB menu item). Walk EVERY non-skippable step and list the permission it actually requires. If ANY step needs a permission beyond the wizard's gate, either add it as a prerequisite check in `WizardTriggerService` or make the step `canSkip: true` with auto-skip logic. Flag missing compound checks as CRITICAL. |
| **Feature flags** | Is the target feature behind a feature flag? Could it be disabled? |
| **Subscription state** | Could the user be in grace period or expired state? |
| **Onboarding state** | Has the user completed the 25-phase interactive tutorial? Could demo data still exist? |
| **Role validity** | Should `unassigned` role users see this wizard? (Usually no.) |
| **Concurrent wizards** | Could another wizard be active? (Only one at a time.) |

### Phase 7: Verify Wizard Target Glow on Every Element

For EACH step, verify the target UI element has `.wizardTarget()` applied with the correct style:

| Element type | Required modifier | Example |
|---|---|---|
| Button / tappable area | `.wizardTarget("step_id")` | Save button, menu item |
| Circular element (FAB) | `.wizardTarget(style: .circle, "step_id")` | FAB, avatar button |
| Text field / input | `.wizardTarget("step_id", style: .input)` | Name field, search field |
| List row / card | `.wizardTarget("step_id", style: .row)` | Settings row, project card |
| Toolbar button (UIKit nav bar) | Cannot apply — document as known limitation | Save/Create in toolbar |

**How to verify:**
1. Grep for `.wizardTarget("step_id")` in the codebase
2. If not found, identify the exact view that the user interacts with for this step
3. Determine the correct style based on element type
4. Flag missing targets as HIGH severity

**Architecture note:** The `WizardTargetModifier` uses an inner `@ObservedObject` view to observe `WizardStateManager` (which is `ObservableObject` passed via `@Environment`). If someone passes the state manager through `@Environment` without the `@ObservedObject` bridge pattern, the glow will silently fail to appear. Check that `WizardTargetModifier` uses the two-layer pattern (outer modifier reads environment, inner view uses `@ObservedObject`).

**Scroll-to-target:** Each form that contains wizard targets inside a `ScrollView` must have:
1. `ScrollViewReader` wrapping the content
2. `.onReceive(NotificationCenter.default.publisher(for: Notification.Name("WizardScrollToTarget")))` listener
3. The listener scrolls to `"wizard_active_\(stepId)"` with `.top` anchor
If missing, the target element may be off-screen when the step activates.

### Phase 8: Verify Exit Wizard Triggers

For EACH `targetScreen` value used in the wizard's steps, verify that a `WizardScreenDismissed` notification is posted when that screen closes:

| targetScreen | Where dismissal must be posted | How to check |
|---|---|---|
| `"FABMenu"` | `FloatingActionMenu.swift` — `.onChange(of: showCreateMenu)` when menu closes | Grep for `WizardScreenDismissed.*FABMenu` |
| `"ProjectDetails"` | `ProjectDetailsView.swift` — `.onDisappear` | Grep for `WizardScreenDismissed.*ProjectDetails` |
| `"ClientForm"`, `"ProjectForm"`, `"TaskForm"` | The respective sheet's dismiss path | Grep for `WizardScreenDismissed.*<screen>` |

**Key pattern:** When the user is on a step with `targetScreen: "FABMenu"` and taps the WRONG menu item (or closes the menu), the exit prompt must fire. This requires:
1. The FAB menu posts `WizardScreenDismissed` with `screen: "FABMenu"` when `showCreateMenu` transitions from true to false
2. A short delay (~150ms) before posting, so completion notifications from the CORRECT action process first

If a `targetScreen` value has no corresponding dismissal notification, the exit prompt will never fire for that screen, leaving the user stuck with no way to exit except the instruction bar EXIT button.

**Also verify:** The exit prompt dialog buttons are interactive. The dialog must use a layered approach:
- Scrim: `.allowsHitTesting(false)` (visual only)
- Dismiss layer: `Color.clear` with `.contentShape(Rectangle())` + `.onTapGesture` (behind dialog)
- Dialog card: `.contentShape(Rectangle())` (blocks taps from reaching dismiss layer)
If the scrim has `.onTapGesture` directly, it will swallow button taps from the dialog.

### Phase 9: Per-Step War Game

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

### Phase 10: Verify OPSStyle Compliance

All wizard UI must use `OPSStyle.Wizard` tokens and follow OPS design system rules:

**Color compliance:**
- All wizard accent colors must use `OPSStyle.Colors.wizardAccent` (tactical orange #EB8C26)
- NEVER use `OPSStyle.Colors.primaryAccent` (blue-gray #597794) in wizard views
- Grep all files in `OPS/OPS/Wizard/Views/` for `primaryAccent` — any occurrence is a bug

**Text alignment:**
- All wizard text must be LEFT-ALIGNED. No `.multilineTextAlignment(.center)` in wizard views
- No centered decorative icons above text. OPS aesthetic is military tactical minimalist — nothing decorative

**Instruction bar:**
- Must be full-bleed: background extends into bottom safe area via `.ignoresSafeArea(edges: .bottom)`
- Background uses `BlurView(style: .systemUltraThinMaterialDark)` with `OPSStyle.Colors.cardBackgroundDark.opacity(0.9)` overlay
- Progress bar uses `OPSStyle.Colors.wizardAccent`
- EXIT and SKIP buttons must NOT be blocked by parent tap gestures — verify that paused and active states are separate view branches

**Exit prompt dialog:**
- Left-aligned text, no centered icon
- Uses `BlurView` background with dark overlay, matching instruction bar
- Uses `OPSStyle.Layout.cardCornerRadius` and `OPSStyle.Layout.Border.standard`
- Buttons must be interactive (see Phase 6 for the layered touch handling pattern)

**Glow tokens:** All glow parameters are centralized in `OPSStyle.Wizard` (Button, Circle, Input, Row). Verify the modifier reads from these tokens, not hardcoded values.

### Phase 11: Cross-Cutting Concerns

Evaluate these system-level scenarios that apply to ALL wizards:

| Concern | Check |
|---|---|
| **Tab navigation away** | Does `WizardOverlayWindow` correctly detect leaving the target tab? Does "CONTINUE GUIDE" restore the correct sub-tab? |
| **Sheet/modal presentation** | Does the instruction bar persist above sheets? Can the user interact with the wizard while a sheet is open? |
| **App lifecycle** | Does `WizardState` persist correctly on background/kill? Does the wizard resume at the correct step? |
| **Cooldown interaction** | After "NOT NOW" (2-tap cooldown) or "NEVER" (48hr + do-not-show), does the wizard correctly suppress? |
| **Analytics** | Are all events tracked? (banner_shown, started, step_completed, step_skipped, abandoned, completed) |
| **Instruction bar layout** | Does the bar conflict with the tab bar, FAB, or keyboard? Is it full-bleed (background ignores bottom safe area)? |
| **Haptic feedback** | Do step completions fire appropriate haptics? |
| **Tutorial system conflict** | Could the 25-phase tutorial be active simultaneously? |
| **WizardTargetModifier observability** | Does the modifier use `@ObservedObject` to observe state changes? (Environment-only `WizardStateManager` won't trigger SwiftUI updates — the modifier must use the two-layer bridge pattern.) |
| **Scroll-to-target** | Do forms with wizard targets inside ScrollViews have `ScrollViewReader` + `WizardScrollToTarget` listener wired up? |
| **Collapsed sections** | Are any wizard targets inside `ExpandableSection`s that default to collapsed? If so, is there a `WizardStepChanged` listener that auto-expands the section when the step activates? |

### Phase 12: Output the Audit Report

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
- **FAB icon is a lightning bolt** (`"bolt"`), NOT a plus sign. Instructions must say "ACTION BUTTON" not "+ button"
- **FAB menu items are labeled "New X"** (e.g., "New Project", "New Client"), NOT "Create X"
- **FAB visibility varies by role** — crew only sees FAB on Schedule tab
- **Swipe-to-change-status** requires `projects.edit` (projects) or `tasks.change_status` (tasks)
- **Feature flags** can disable entire features at runtime
- **Wizards are offline-first** — all checks use local SwiftData
- **Real data, not demo data** — wizards operate on actual user data
- **Only one wizard active at a time** — `WizardStateManager` enforces this
- **Wizard accent color is orange** (`OPSStyle.Colors.wizardAccent` / #EB8C26) — never use `primaryAccent` in wizard views
- **WizardStateManager is ObservableObject via @Environment** — modifiers MUST use `@ObservedObject` bridge pattern or the glow silently fails
- **All wizard glow tokens are centralized** in `OPSStyle.Wizard` (Button, Circle, Input, Row sub-enums)
- **Toolbar buttons cannot receive `.wizardTarget()`** — UIKit-managed navigation bar items don't support SwiftUI view modifiers. Document as known limitation; instruction text must guide the user
- **Instruction bar must be full-bleed** — background ignores bottom safe area
- **Text input step completion fires on keyboard dismiss or field deselect** — NEVER on first keystroke
- **ProjectForm has collapsible optional sections** — TASKS, DESCRIPTION, NOTES, PHOTOS are all inside `ExpandableSection` containers that default to collapsed in create mode (`isTasksExpanded = false`). Any wizard step targeting elements inside these sections MUST auto-expand the section via a `WizardStepChanged` listener, or the target is invisible
- **TaskForm requires task type for validity** — `isValid` returns `false` without `selectedTaskTypeId`. Any wizard that enters the task form MUST include a step for task type selection, or the Create button is permanently disabled
- **Multi-sheet stacking is common** — ProjectForm presents TaskForm as a sheet. When wizard steps span both forms, instructions must disambiguate which form's Create/Save button to tap. "TAP CREATE" is ambiguous when two forms are stacked

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
