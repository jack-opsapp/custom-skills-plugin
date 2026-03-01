# Timing Guidelines

Timing rules for tutorial phase design. Covers total flow duration targets, per-phase timing by type, auto-advance rules, continue button timing, pacing rhythm, and attention span data.

---

## 1. Total Flow Duration Targets

### Mobile (iOS / Android)

| Rating | Duration | Notes |
|--------|----------|-------|
| Optimal | 30-45 seconds | Highest completion rate. Users feel fast and empowered. |
| Good | 45-60 seconds | Standard for apps with 8-12 features. Slight drop-off at 50s. |
| Acceptable | 60-90 seconds | Multi-role or complex apps. Expect 15-25% drop-off vs. optimal. |
| Too long | >90 seconds | Split into multiple sessions using Progressive Unlock. |

### Web

| Rating | Duration | Notes |
|--------|----------|-------|
| Optimal | 45-60 seconds | Web users tolerate slightly longer flows due to larger screens. |
| Good | 60-90 seconds | Standard for SaaS products. |
| Acceptable | 90-120 seconds | Enterprise tools with training expectations. |
| Too long | >120 seconds | Split into multiple sessions or use contextual triggers. |

### Drop-off Rate by Duration

Based on aggregated onboarding analytics across consumer and B2B apps:

| Duration | Estimated Completion Rate |
|----------|--------------------------|
| 0-30s | 85-95% |
| 30-60s | 70-85% |
| 60-90s | 55-70% |
| 90-120s | 40-55% |
| 120-180s | 25-40% |
| >180s | <25% |

Every additional 30 seconds of tutorial duration reduces completion by approximately 10-15 percentage points. This is the single most important metric to keep in mind when designing flow length.

---

## 2. Per-Phase Timing by Type

### Read-Only / Orientation Phase

The user reads a tooltip and presses continue. No interaction with the app.

| Attribute | Value |
|-----------|-------|
| Estimated duration | 2-4 seconds |
| Auto-advance | Optional (3000ms if used) |
| Continue button | `delayed` (appears after 1.5s) or `immediate` |
| Haptic | `lightTap` on phase entry |

Orientation phases should be brief. If the tooltip text requires more than 4 seconds to read, the copy is too long — shorten it.

### Simple Action Phase

The user performs a single gesture: tap a button, tap a tab, tap a card.

| Attribute | Value |
|-----------|-------|
| Estimated duration | 3-8 seconds |
| Auto-advance | Never (0ms) |
| Continue button | `none` (action itself advances) |
| Haptic | `mediumImpact` on successful action |
| Timeout hint | Pulse spotlight after 8 seconds of inaction |

The 3-8 second range accounts for read time (2-3s) plus action time (1-5s). If the user has not acted within 8 seconds, show a gesture hint or pulse the spotlight target.

### Form Entry Phase

The user types into a text field or selects from a picker.

| Attribute | Value |
|-----------|-------|
| Estimated duration | 5-15 seconds |
| Auto-advance | Never (0ms) |
| Continue button | `immediate` (visible alongside the form) |
| Haptic | `lightTap` on field focus |

Form phases are the longest individual phases. If multiple fields need filling, consider:
- Pre-populating fields with tutorial environment values (reduces to 3-5s per field)
- Splitting into one phase per field (recommended for important fields)
- Grouping 2-3 related fields into one phase (acceptable for less important fields)

### Gesture Phase

The user performs a swipe, drag, pinch, or long-press.

| Attribute | Value |
|-----------|-------|
| Estimated duration | 5-10 seconds |
| Auto-advance | Never (0ms) |
| Continue button | `none` (gesture itself advances) |
| Haptic | `success` on correct gesture |
| Shows gesture hint | `true` — always show the animated gesture indicator |

Gesture phases require the most visual guidance. Always display the gesture hint animation (animated hand or arrow showing the direction). If the user does not perform the gesture within 8 seconds, replay the hint animation.

### Celebration Phase

A milestone marker. Brief pause with positive feedback.

| Attribute | Value |
|-----------|-------|
| Estimated duration | 3-5 seconds |
| Auto-advance | Never (0ms) — let the user savor the moment |
| Continue button | `immediate` with label "Let's Go" or "Continue" |
| Haptic | `success` |

Celebration phases exist for pacing, not information. Keep them short. The user should feel a brief reward and move forward. Do not add long animations or text — a headline, a brief stat ("Completed in 32 seconds"), and a button.

### Transition / Auto-Advance Phase

Brief phase that communicates a screen change or provides context before the next action.

| Attribute | Value |
|-----------|-------|
| Estimated duration | 2-3 seconds |
| Auto-advance | 2000-3000ms |
| Continue button | `none` |
| Haptic | `none` |

Auto-advance phases should always show a visual countdown indicator (shrinking bar, fading ring) so the user knows the phase will advance on its own.

---

## 3. Auto-Advance Rules

### When to Use Auto-Advance

- Transition phases between screens ("Now let's look at the Calendar...")
- Brief confirmations after an action ("Project created!")
- Low-information phases that require no decision or interaction
- Return-to-hub phases in Hub-and-Spoke flows

### When NOT to Use Auto-Advance

- Phases with important information the user must read
- Action phases (the user must perform the action, not be auto-advanced past it)
- Celebration phases (let the user enjoy the moment and choose when to proceed)
- The first phase of the tutorial (always let the user control the start)
- The last phase of the tutorial (always let the user choose when to finish)

### Auto-Advance Duration Rules

| Duration | Use Case |
|----------|----------|
| 2000ms (2s) | Very brief transition, single phrase tooltip |
| 3000ms (3s) | Standard auto-advance, short sentence tooltip |
| 4000ms (4s) | Slightly longer content, up to 2 sentences |
| 5000-6000ms (5-6s) | Maximum — only for phases with meaningful content that is not critical |

- **Minimum:** 2000ms. Anything shorter is imperceptible and disorienting.
- **Maximum:** 6000ms. Anything longer and the user wonders why they cannot advance manually.
- **Always show a countdown indicator:** A shrinking progress bar or fading ring at the top of the tooltip.

### Streak Rules

Never auto-advance more than 3 phases in a row. After 3 auto-advance phases, the next phase must have a continue button or require user action. Three consecutive auto-advances already feel like a slideshow — four feels like the user lost control.

---

## 4. Continue Button Timing

### Immediate

The continue button is visible from the moment the phase appears.

**Use for:**
- Celebration phases (user chooses when to proceed)
- Form phases (user taps continue after filling fields)
- Phases following an action (user just acted, ready to move)

### Delayed

The continue button appears after a short delay (1.5-2 seconds).

**Use for:**
- Orientation phases with important text (forces the user to read before advancing)
- Introduction phases at the start of the tutorial
- Any phase where premature tapping would skip critical information

The delay prevents "tap-through" behavior where users rapidly tap continue without reading. A 1.5-second delay is enough to ensure the user's eyes land on the tooltip content.

### None

No continue button. The phase advances via user action or auto-advance.

**Use for:**
- Action phases (the action itself advances the flow)
- Gesture phases (the gesture itself advances the flow)
- Auto-advance phases (timer handles advancement)

---

## 5. Pacing Rhythm

### The Action-Passive Alternation Rule

Alternate between phases that require user action and phases that are passive (read-only, auto-advance). This creates a breathing rhythm:

```
Phase 1: Passive (orientation)     ← read
Phase 2: Passive (spotlight)       ← read
Phase 3: Action (tap FAB)          ← do
Phase 4: Passive (form intro)      ← read
Phase 5: Action (fill client)      ← do
Phase 6: Action (fill date)        ← do
Phase 7: Celebration               ← pause
Phase 8: Passive (calendar intro)  ← read
Phase 9: Action (swipe week)       ← do
Phase 10: Celebration + Complete   ← pause
```

### Maximum Streaks

| Type | Max Consecutive | Recovery |
|------|----------------|----------|
| Action phases | 4 | Follow with a passive or celebration phase |
| Auto-advance phases | 3 | Follow with a user-controlled phase |
| Passive/read phases | 3 | Follow with an action phase |

### Celebration Placement

Insert a celebration phase every 4-6 phases. Celebrations serve as:
- Cognitive reset points (the user can relax briefly)
- Motivation anchors (positive reinforcement to continue)
- Progress markers (the user knows how far they have come)

Place celebrations at natural milestones:
- After the first action is completed
- After a form is submitted
- At the midpoint of the flow
- At the end of the flow (required — never end without celebration)

---

## 6. Attention Span Data

### Key Metrics

| Metric | Value | Source |
|--------|-------|--------|
| Average attention per screen | 8 seconds | Mobile UX research, aggregate |
| Cognitive fatigue onset | 45 seconds | Point where error rate and abandonment increase |
| Optimal phase count | 8-15 phases | Balances coverage and fatigue |
| Maximum phases before session split | 20 phases | Beyond this, split into Progressive Unlock tiers |
| Time to first skip attempt | 25-35 seconds | When users start looking for the exit |

### Implications for Flow Design

1. **8 seconds per screen:** Each phase's tooltip text must be readable in under 8 seconds. At average reading speed (200-250 wpm), this means 25-30 words maximum per phase (headline + description combined).

2. **Fatigue at 45 seconds:** If the flow exceeds 45 seconds, front-load the most important features before the 45-second mark. Features taught after 45 seconds have lower retention.

3. **Optimal 8-15 phases:** Fewer than 8 phases may not teach enough to activate the user. More than 15 phases risks abandonment. The sweet spot for most apps is 10-12 phases.

4. **Skip at 25-35 seconds:** Ensure the skip option is always visible and accessible. Users who want to skip at 30 seconds will leave entirely if they cannot find the skip button. A visible skip option paradoxically increases completion rates — knowing the exit is available reduces anxiety.

5. **Session split at 20 phases:** If the flow requires more than 20 phases, split into 2-3 sessions using Progressive Unlock. Each session should be 8-12 phases. Trigger the next session on return visit or usage milestone, not immediately after the first.

### Mobile vs. Web Attention Differences

| Factor | Mobile | Web |
|--------|--------|-----|
| Session intent | Quick task, low patience | May be more exploratory |
| Distraction level | High (notifications, context switching) | Medium (tabs, but more focused) |
| Reading speed on screen | Slightly slower (small screen) | Slightly faster (larger screen) |
| Gesture comfort | High (native touch) | Lower (mouse/trackpad for gestures) |
| Recommended flow length | 30-60 seconds | 45-90 seconds |
| Recommended phase count | 8-12 | 10-15 |

These differences justify platform-specific timing defaults. A phase that auto-advances in 3000ms on mobile may need 4000ms on web to account for slower mouse navigation.
