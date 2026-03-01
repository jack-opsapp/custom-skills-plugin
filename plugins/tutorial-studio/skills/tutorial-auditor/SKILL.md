---
name: tutorial-auditor
description: This skill should be used when the user asks to "audit a tutorial", "score onboarding quality", "review tutorial UX", "benchmark tutorial against best practices", "identify tutorial improvements", "analyze tutorial dropoff", or needs to evaluate an existing onboarding flow against industry standards.
---

# Tutorial Auditor

## Purpose

Score an existing tutorial or onboarding flow against a 12-dimension rubric, produce a comprehensive gap analysis, and deliver prioritized improvement recommendations with specific code references. The auditor serves as quality assurance for any tutorial — whether freshly built by the tutorial-studio pipeline or inherited from a legacy codebase.

An audit is not a subjective opinion. Every score maps to measurable criteria defined in `references/scoring-rubric.md`. Every recommendation references specific code locations and provides before/after guidance.

---

## Prerequisites

Require two inputs before proceeding:

1. **App Profile** (from app-analyzer): provides the screen inventory, navigation structure, aha moment, and interactive elements catalog. Without this context, the auditor cannot assess whether the tutorial covers the right content.

2. **Existing tutorial code**: the actual implementation to audit. This can be:
   - A full tutorial system (state manager, phase definitions, overlay views)
   - A simple onboarding modal or slideshow
   - A tooltip/coach-mark implementation
   - A checklist-based progressive onboarding

If no App Profile exists, instruct the user to run app-analyzer first. If no tutorial code exists, inform the user that there is nothing to audit — suggest running onboarding-strategist and flow-architect to design one from scratch.

---

## Audit Process

### Step 1: Read Existing Tutorial Code

Perform a thorough code review of the tutorial implementation. Identify and document:

**Structure:**
- Entry point: how and when the tutorial launches (first launch check, state flag, manual trigger)
- Phase/step definitions: where phases are defined, how many exist, their sequence
- State management: how progress is tracked, persisted, and restored across sessions
- Exit conditions: how each phase completes, how the overall tutorial ends

**Content:**
- Copy: all user-facing text (headlines, body text, button labels, tooltips)
- Visual indicators: highlights, spotlights, overlays, arrows, pulse animations
- Animations: transitions between phases, attention-drawing animations, celebration moments

**Behavior:**
- User interactions per phase: what the user must do to advance (tap, fill form, navigate, gesture)
- Timing: auto-advance timers, delays, debounce intervals
- Skip/escape: whether phases can be skipped, whether the flow can be exited, re-entry paths
- Branching: role-based paths, conditional phases, behavior-adaptive logic

**Analytics:**
- Event tracking: what events are fired (phase_started, phase_completed, tutorial_skipped, etc.)
- Funnel measurement: whether drop-off between phases is measurable
- A/B testing: whether variants exist or are supported

Record file paths and line numbers for every finding. The audit report must reference specific code locations.

### Step 2: Walk Through as User

Trace the complete tutorial flow as a first-time user would experience it. Do not rely on code reading alone — follow the actual execution path.

Process:
1. Start from the app's initial state (first launch or tutorial trigger).
2. Follow each phase in sequence, noting what the user sees and does at each step.
3. Record the exact interaction required to advance each phase.
4. Time the flow: estimate seconds per phase based on copy length, interaction complexity, and animation duration.
5. Note friction points: moments where the user might be confused, stuck, or annoyed.
6. Note dead ends: states where the tutorial breaks, loops, or fails to advance.
7. Note delight moments: celebrations, animations, or copy that would make a user smile.
8. Test skip behavior: verify every skip mechanism works and does not break state.
9. Test re-entry: verify the tutorial can be resumed or restarted.

Document the walkthrough as a phase-by-phase log:
```
Phase 1: [name] — [seconds] — [interaction] — [notes]
Phase 2: [name] — [seconds] — [interaction] — [notes]
...
Total: [N] phases, ~[N] seconds
```

### Step 3: Score Each Dimension

Score each of the 12 dimensions on a scale of 1-10 using the criteria defined in `references/scoring-rubric.md`. Every score must be justified with specific observations from Steps 1 and 2.

**The 12 Dimensions:**

1. **Time-to-First-Value** — How quickly does the user reach the aha moment? Measure from tutorial start to first meaningful value delivery. Ideal: under 60 seconds. Score 1 if value takes more than 5 minutes. Score 10 if value arrives within 30 seconds.

2. **Interactivity Level** — Does the user DO things, or just READ things? Count the ratio of interactive phases (user performs an action) to passive phases (user reads or watches). Score 1 if entirely passive (click-next slideshow). Score 10 if every phase requires a meaningful user action on a real app element.

3. **Progressive Disclosure** — Does the tutorial show everything at once, or layer information? Score 1 if all features are shown on Day 0. Score 10 if features are organized into 2-3 layers with usage-based unlock triggers.

4. **Skip/Escape Options** — Can the user skip phases, exit the tutorial, and resume later? Score 1 if the tutorial is forced and unskippable. Score 10 if every phase has a skip option, the flow has a persistent exit, and re-entry is available from settings.

5. **Personalization** — Does the tutorial adapt to user type, role, or behavior? Score 1 if the tutorial is identical for all users regardless of context. Score 10 if the tutorial branches by role, adapts to behavior, and skips phases the user has already discovered.

6. **Permission Timing** — When are system permissions requested? Score 1 if all permissions are requested at launch before any value. Score 10 if each permission is requested at the moment of relevance with a pre-permission explanation and graceful decline handling.

7. **Copy Quality** — Is the text clear, concise, action-oriented, and value-focused? Score 1 if copy is verbose, jargon-heavy, or tells instead of shows. Score 10 if every headline is under 8 words, body text is under 20 words, and copy focuses on user benefit rather than feature description.

8. **Animation Quality** — Do animations guide attention, provide feedback, and create delight without slowing the flow? Score 1 if there are no animations or animations are jarring/distracting. Score 10 if animations are smooth (60fps), purposeful (draw attention to the right element), and appropriately timed (under 400ms for transitions, under 2s for celebrations).

9. **Analytics Coverage** — Can you measure where users drop off, what they skip, and how long each phase takes? Score 1 if no analytics events exist. Score 10 if every phase fires start/complete/skip events with timing data, and a funnel dashboard is available.

10. **Gamification** — Does the tutorial use progress indicators, celebrations, and motivational mechanics? Score 1 if there is no progress indicator and no feedback on advancement. Score 10 if there is a persistent progress indicator, endowed progress, milestone celebrations, and a completion summary.

11. **Platform Conventions** — Does the tutorial respect platform design guidelines and interaction patterns? Score 1 if the tutorial uses non-native controls, breaks back-button behavior, or ignores platform gesture conventions. Score 10 if the tutorial uses native components, respects platform navigation patterns, and follows Human Interface Guidelines (iOS) or Material Design (Android) or platform-appropriate web conventions.

12. **Accessibility** — Is the tutorial usable with assistive technologies? Score 1 if there are no accessibility labels, no VoiceOver/screen reader support, and animations cannot be reduced. Score 10 if all tutorial elements have accessibility labels, focus management is correct, animations respect reduced-motion preferences, contrast ratios meet WCAG AA, and touch targets are at minimum 44x44pt (iOS) or 48x48dp (Android).

### Step 4: Calculate Overall Score

Sum all 12 dimension scores to produce a total out of 120.

**Score interpretation:**

| Range | Assessment | Action |
|-------|-----------|--------|
| 0-40 | Rebuild needed | The tutorial has fundamental structural problems. Recommend designing a new tutorial from scratch using onboarding-strategist and flow-architect. Retain any working analytics or copy. |
| 41-70 | Significant improvements needed | The tutorial has a sound foundation but major gaps. Recommend targeted rewrites of lowest-scoring dimensions. |
| 71-90 | Good with targeted fixes | The tutorial works but has specific areas holding it back. Recommend 3-5 focused improvements. |
| 91-120 | Excellent | The tutorial follows best practices. Recommend minor polish and ongoing analytics monitoring. |

### Step 5: Identify Top 3 Improvements

From the 12 scored dimensions, identify the 3 improvements that would produce the largest overall score gain with the least implementation effort.

For each improvement, calculate an **impact score**:
```
Impact = (10 - current_score) × ease_multiplier
```

Ease multipliers:
- **3x**: copy changes, reordering phases, adding skip buttons, adding analytics events
- **2x**: adding progress indicators, changing permission timing, adding celebrations
- **1x**: adding personalization/branching, redesigning animations, adding accessibility

Rank all 12 dimensions by impact score. The top 3 become the priority recommendations.

### Step 6: Generate Recommendations

For each of the top 3 improvements, produce a detailed recommendation:

**Format per recommendation:**
```markdown
### Improvement [N]: [Dimension Name]
**Current score:** [X/10]
**Target score:** [Y/10]
**Impact score:** [calculated]

**Current state:**
[Describe what exists now, referencing specific files and line numbers]

**Problem:**
[Explain why this hurts the tutorial, referencing psychology or benchmark data]

**Recommendation:**
[Specific, actionable changes to make]

**Implementation notes:**
[Code-level guidance: which files to modify, what to add/change/remove]

**Expected result:**
[What the improved tutorial will look like from the user's perspective]
```

### Step 7: Cross-Check Against Audit Checklist

After completing the dimensional scoring, run through every item in `references/audit-checklist.md`. This catches specific issues that might not be reflected in dimensional scores.

For each checklist item that fails:
- Record the item
- Map it to the relevant dimension
- Add it to the recommendations if not already covered

Report the checklist results as a pass/fail summary with fail count per dimension.

---

## Output Format

Produce the Audit Report in this structure:

```markdown
## Tutorial Audit Report

**App:** [name]
**Platform:** [iOS / Web / Both]
**Audit date:** [date]
**Tutorial location:** [primary file paths]
**Phase count:** [number]
**Estimated completion time:** [seconds]

### Overall Score: [X] / 120 — [Assessment Level]

### Dimension Scores
| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Time-to-First-Value | [X/10] | [one-line finding] |
| 2 | Interactivity Level | [X/10] | [one-line finding] |
| 3 | Progressive Disclosure | [X/10] | [one-line finding] |
| 4 | Skip/Escape Options | [X/10] | [one-line finding] |
| 5 | Personalization | [X/10] | [one-line finding] |
| 6 | Permission Timing | [X/10] | [one-line finding] |
| 7 | Copy Quality | [X/10] | [one-line finding] |
| 8 | Animation Quality | [X/10] | [one-line finding] |
| 9 | Analytics Coverage | [X/10] | [one-line finding] |
| 10 | Gamification | [X/10] | [one-line finding] |
| 11 | Platform Conventions | [X/10] | [one-line finding] |
| 12 | Accessibility | [X/10] | [one-line finding] |

### Top 3 Improvements
[Detailed recommendations per Step 6 format]

### Audit Checklist Results
**Passed:** [X] / [total]
**Failed:** [Y] items

| Dimension | Failed Items |
|-----------|-------------|
| [dimension] | [list of failed checklist items] |

### Additional Observations
[Any findings that do not fit neatly into the 12 dimensions — UX issues, code quality concerns, state management bugs, edge cases]
```

---

## Scoring Integrity

Maintain strict scoring integrity across audits:

- Never inflate scores to be polite. A passive slideshow tutorial scores 1 on Interactivity regardless of how polished the slides are.
- Never deflate scores to justify a rebuild recommendation. If the tutorial has strong analytics but weak copy, score analytics honestly.
- Always tie scores to the specific criteria in `references/scoring-rubric.md`. If a score falls between two defined levels, use the lower score and note what is missing for the higher score.
- When auditing a tutorial built by this same pipeline (tutorial-studio), apply identical rigor. No favoritism for internally-produced tutorials.

---

## Re-Audit Protocol

After improvements are implemented, run a re-audit to verify score improvements:

1. Re-read the modified code (Step 1).
2. Re-walk the tutorial (Step 2).
3. Re-score only the dimensions targeted by improvements (Step 3, partial).
4. Recalculate overall score (Step 4).
5. Document delta: `Previous: X/120 → Current: Y/120 (+Z)`.
6. If new issues were introduced by the changes, flag them.

---

## Reference Documents

Consult these references during the audit:

- **`references/scoring-rubric.md`** — Detailed criteria for scores 1, 5, and 10 on each dimension. This is the authoritative scoring reference. Do not score without consulting it.
- **`references/audit-checklist.md`** — Yes/no checklist for catching specific issues. Run this after dimensional scoring as a safety net.
- **`references/psychology.md`** — Psychological principles for justifying improvement recommendations.
- **`references/benchmarks.md`** — Industry data for contextualizing scores and setting improvement targets.
- **`references/anti-patterns.md`** — Common failures to check against.
