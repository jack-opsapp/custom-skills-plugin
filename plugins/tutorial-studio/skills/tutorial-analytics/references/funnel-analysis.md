# Funnel Analysis

How to build, interpret, and act on tutorial funnel data. The funnel is the single most important analytical tool for tutorial optimization — it shows exactly where users succeed and where they fail.

---

## 1. Building the Funnel

The tutorial funnel is built from `tutorial_phase_start` events. Each phase in the tutorial becomes a funnel stage. The count at each stage is the number of unique sessions that fired `phase_start` for that phase.

### Construction Steps

1. **Query all `tutorial_phase_start` events** for the time period. Group by `sessionId` and `phase`.
2. **Order phases by `phaseIndex`** (not alphabetically). The funnel must reflect the actual tutorial flow order.
3. **Count unique sessions at each phase.** A session counts toward a phase if it has at least one `phase_start` event for that phase.
4. **Calculate dropoff between stages.** Dropoff at phase N = count at phase N minus count at phase N+1.
5. **Calculate dropoff percentage.** Dropoff rate at phase N = dropoff at phase N / count at phase N * 100.

### Example Funnel

| Phase | Phase Index | Sessions | Dropoff | Dropoff % |
|---|---|---|---|---|
| welcome | 0 | 1000 | 50 | 5.0% |
| create_project | 1 | 950 | 142 | 15.0% |
| navigate_tabs | 2 | 808 | 81 | 10.0% |
| assign_task | 3 | 727 | 109 | 15.0% |
| schedule_view | 4 | 618 | 37 | 6.0% |
| settings | 5 | 581 | 52 | 9.0% |
| map_view | 6 | 529 | 26 | 5.0% |
| completion | 7 | 503 | — | — |

**Overall completion rate:** 503 / 1000 = 50.3%.

### Handling Back Navigation

Users who press Back will have multiple `phase_start` events for the same phase. Count each session only once per phase — deduplicate by sessionId. The funnel measures "reach," not "visits."

### Handling Skip

Skipping advances the user to the next phase, so the next phase's `phase_start` still fires. Skips do not create funnel gaps. However, track skip rates separately (from `tutorial_phase_skip` events) to understand which phases users find unnecessary.

---

## 2. Identifying Dropoff Hotspots

A dropoff hotspot is any phase where more than 15% of entering users drop off. These are the highest-priority optimization targets.

### Detection Rules

| Dropoff Rate | Severity | Action |
|---|---|---|
| <5% | Normal | No action needed |
| 5-10% | Low | Monitor. May be acceptable for complex phases. |
| 10-15% | Moderate | Investigate. Check time-per-phase and back-button rate. |
| 15-25% | High | Redesign required. This phase is losing too many users. |
| >25% | Critical | Emergency fix. This phase may be broken or deeply confusing. |

### Investigation Checklist for High-Dropoff Phases

When a phase exceeds 15% dropoff:

1. **Check median time-per-phase.** If <2 seconds, users may not be understanding the phase at all. If >15 seconds, users are stuck.
2. **Check back-button rate at the NEXT phase.** If users who survive the high-dropoff phase frequently go back, the phase is not building understanding — users pass through confused.
3. **Check skip rate.** If skip rate is also high (>30%), users see the phase as unnecessary or annoying. If skip rate is low, users are trying and failing.
4. **Check `tutorial_action` events within the phase.** Are users interacting with the wrong elements? Are they performing partial actions but not completing?
5. **Check platform split.** Is the dropoff specific to iOS or web? Platform-specific dropoff indicates a UI issue, not a design issue.

---

## 3. Common Dropoff Causes by Phase Type

Different phase types have characteristic failure modes. Match the phase type to its common causes to speed diagnosis.

### Form Phases (create_project, assign_task)

**Common causes:**
- Too many required fields — each additional field increases dropoff by ~3-5%
- Unclear field labels — users do not understand what to enter
- Keyboard obscures the tooltip — user cannot see instructions while typing
- Validation errors — real-time validation confuses users who are entering tutorial data

**Fixes:**
- Reduce to 1-2 fields maximum in tutorial form phases
- Pre-fill fields with placeholder data the user can accept
- Position tooltip above the keyboard zone
- Disable validation during tutorial mode

### Gesture Phases (swipe, drag, pinch)

**Common causes:**
- Gesture hint is not clear enough — user does not understand what physical motion to perform
- Gesture target is too small — user misses the interactive area
- Gesture conflicts with system gestures (swipe from edge = back navigation on iOS)
- Gesture sensitivity is wrong — too sensitive triggers accidental completion, too insensitive makes users think it is broken

**Fixes:**
- Use explicit gesture indicator animations (see tutorial-animations gesture-indicators.md)
- Enlarge the gesture target area during tutorial mode
- Disable conflicting system gestures during the tutorial phase
- Add a fallback "I can't do this" option that completes the phase without the gesture

### Auto-Advance Phases (welcome, observation)

**Common causes:**
- Too fast — user does not have time to read before the phase advances
- Too slow — user reads quickly and becomes impatient waiting
- No indication that it will auto-advance — user expects to tap Continue and nothing happens

**Fixes:**
- Minimum 3 seconds, maximum 8 seconds for auto-advance phases
- Show a visible countdown or progress indicator
- Always allow manual advance (tap Continue) even if auto-advance is enabled

### Permission Phases (camera, location, notifications)

**Common causes:**
- User declines the permission — tutorial cannot proceed with the intended action
- User does not understand why the permission is needed
- System dialog obscures the tutorial UI

**Fixes:**
- Explain the purpose BEFORE showing the system permission dialog
- Have a fallback flow for declined permissions — do not dead-end the tutorial
- After the system dialog dismisses, re-show the tutorial UI with appropriate next step

### Tab/Navigation Phases (navigate_tabs, explore_views)

**Common causes:**
- Spotlight target is not visible (element is off-screen or behind another element)
- User taps the wrong tab — tutorial does not handle incorrect navigation gracefully
- Tab switch animation conflicts with tutorial spotlight animation

**Fixes:**
- Scroll to target before showing the spotlight
- Accept incorrect taps gracefully — show a gentle redirect ("Try the Schedule tab instead")
- Coordinate tab switch and spotlight animations (see tutorial-animations tab switch timing)

---

## 4. Optimization Playbook

Specific remedies for the three most common funnel problems.

### Problem: High Dropoff at a Phase (>15%)

**Diagnosis:** Users are leaving the tutorial at this phase. They are not completing and not skipping — they are abandoning.

**Playbook:**
1. Check time-per-phase. If <3s, users are not engaging. If >15s, users are stuck.
2. Check what the phase asks the user to do. Simplify the action. Can it be reduced to a single tap?
3. Check the tooltip copy. Is the instruction in under 10 words? Can the user understand what to do without reading the description?
4. Check the visual design. Is the spotlight on the correct element? Is the tooltip readable against the overlay?
5. A/B test a simplified version of the phase against the current version.

### Problem: High Skip Rate at a Phase (>30%)

**Diagnosis:** Users see the phase and immediately decide it is not worth their time. The phase is either too long, too complex, or perceived as unnecessary.

**Playbook:**
1. Check what the phase teaches. Is this information critical? If not, remove the phase entirely.
2. If critical, shorten it. Can the phase be merged with an adjacent phase?
3. Check if the phase is redundant — does it teach something the user already demonstrated understanding of in a previous phase?
4. Change the phase from active (requires user action) to passive (observation only) if the content is informational.
5. A/B test removal of the phase. If completion rate and post-tutorial adoption are unaffected, the phase was unnecessary.

### Problem: High Back Rate at a Phase (>20% of sessions go back from this phase)

**Diagnosis:** Users reach this phase and realize they did not understand the previous phase well enough. They go back to re-read. The previous phase is not building sufficient understanding for what comes next.

**Playbook:**
1. Look at the PREVIOUS phase, not this one. The problem is upstream.
2. Check if the previous phase's tooltip copy adequately explains the concept needed for this phase.
3. Check if the previous phase auto-advanced too quickly. Users may not have had time to internalize.
4. Add a transitional element between the phases — a brief "Now that you've done X, let's do Y" bridge.
5. Consider combining the two phases into one if the concept cannot be split cleanly.

---

## 5. A/B Testing Approach

### Variant Comparison Methodology

1. **Define the hypothesis.** What specific change is being tested, and what metric is expected to improve?
2. **Define primary metric.** Usually completion rate or TTFV. Define ONE primary metric. Additional metrics are secondary.
3. **Define minimum sample size.** For a 5% minimum detectable effect on completion rate, need ~1,500 sessions per variant (assuming 50% base completion rate, 80% power, 5% significance).
4. **Run for at least 1 week.** Even if sample size is reached sooner, run for a full week to account for day-of-week effects.
5. **Compare.** Filter all events by `variant` field. Build separate funnels for control and treatment. Compare primary metric with statistical test (chi-squared for rates, Mann-Whitney for time metrics).

### What to Test

| Test Priority | What to Vary | Primary Metric |
|---|---|---|
| 1 | Phase count (fewer phases) | Completion rate |
| 2 | Tooltip copy (shorter vs. longer) | Time per phase |
| 3 | Phase order | Per-phase dropoff |
| 4 | Gesture vs. tap interactions | Phase completion rate |
| 5 | Auto-advance timing | Skip rate |
| 6 | Celebration type | Post-tutorial NPS |

### What NOT to Test

- Do not A/B test fundamental tutorial structure (with tutorial vs. without tutorial) unless prepared for a significant percentage of users to have a degraded experience.
- Do not test more than one variable at a time. Multi-variable tests require much larger sample sizes and make causation impossible to attribute.
- Do not run tests for less than 1 week or with fewer than 500 sessions per variant. Results will be noisy and unreliable.
