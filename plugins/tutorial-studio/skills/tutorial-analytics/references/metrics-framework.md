# Metrics Framework

The HEART framework adapted for tutorial analytics. Five metric categories covering the full picture of tutorial effectiveness, from immediate user sentiment to long-term business impact.

Each category includes: what to measure, how to derive the metric from the event schema, benchmark targets, and calculation formulas.

---

## 1. Happiness

Measures how users feel about the tutorial experience. Happiness metrics answer: "Did the user enjoy this?" and "Would they recommend it?"

### Metrics

**Tutorial NPS (Net Promoter Score)**

- **What:** After tutorial completion, ask: "How helpful was this tutorial?" (1-5 scale) or "How likely are you to recommend this app?" (0-10 NPS scale).
- **How to measure:** Fire a `tutorial_action` event with `actionType: "nps_response"` and `value: "<score>"` when the user responds to the post-tutorial survey. Calculate NPS from collected scores.
- **Benchmark:** NPS > 30 for tutorials. NPS > 50 is excellent.
- **Formula:** NPS = % Promoters (9-10) - % Detractors (0-6). Scores 7-8 are passive.

**Completion Satisfaction (implicit)**

- **What:** Whether users who complete the tutorial continue using the app immediately (positive signal) or close it (negative signal).
- **How to measure:** Track whether a `tutorial_complete` event is followed by an app interaction event within 60 seconds. If yes = satisfied completion. If no = completion without engagement.
- **Benchmark:** >70% of completers should engage within 60 seconds.
- **Formula:** Satisfied completions / Total completions * 100.

**Skip Sentiment (implicit)**

- **What:** Whether skipping correlates with negative outcomes. If users who skip are equally successful post-tutorial, the skipped content may be unnecessary.
- **How to measure:** Compare post-tutorial feature adoption rates between users who skipped 0 phases, 1-2 phases, and 3+ phases.
- **Benchmark:** If high-skip users have >80% the adoption rate of zero-skip users, the skipped phases may be unnecessary.
- **Formula:** Feature adoption rate per skip-count cohort.

---

## 2. Engagement

Measures how actively users participate in the tutorial. Engagement metrics answer: "Are users paying attention?" and "Are they interacting or just clicking through?"

### Metrics

**Phase Interaction Rate**

- **What:** Percentage of phases where the user performed at least one `tutorial_action` event beyond the minimum required to advance.
- **How to measure:** For each phase in a session, count `tutorial_action` events. Phases with >1 action (beyond the advance action) are "engaged." Phases with exactly 0 or 1 action are "passive."
- **Benchmark:** >50% of phases should be engaged.
- **Formula:** Phases with >1 action / Total phases experienced * 100.

**Time Per Phase**

- **What:** How long users spend on each phase. Too short = not reading. Too long = confused or stuck.
- **How to measure:** Calculate from `tutorial_phase_start` to the next phase event (`phase_complete`, `phase_skip`, or `dropoff`). Group by phase name and compute median, p25, and p75.
- **Benchmark:** Optimal time per phase is 3-8 seconds. <2 seconds suggests blind clicking. >15 seconds suggests confusion.
- **Formula:** Median of (phase_complete.timestamp - phase_start.timestamp) per phase, in seconds.

**Time per phase threshold alerts:**

| Duration | Signal | Action |
|---|---|---|
| <2 seconds | User is not reading | Shorten or remove the phase |
| 2-4 seconds | Quick but engaged | Ideal for simple observation phases |
| 4-8 seconds | Engaged and learning | Ideal for action phases |
| 8-15 seconds | Slow but progressing | Acceptable for complex phases (forms) |
| >15 seconds | Confused or stuck | Simplify the phase or add clearer guidance |

**Back Button Usage Rate**

- **What:** Percentage of sessions that use the Back button at least once.
- **How to measure:** Count sessions with at least one `tutorial_phase_back` event / Total sessions.
- **Benchmark:** <20%. Higher rates indicate users are losing context and need to re-read.
- **Formula:** Sessions with back events / Total sessions * 100.

**Back Button Hotspots**

- **What:** Which specific phases have the highest back-button rate.
- **How to measure:** Count `tutorial_phase_back` events grouped by `fromPhase` (the phase they left). The phase with the most back events is the confusion hotspot.
- **Benchmark:** No single phase should account for >30% of all back events.
- **Formula:** Back events at phase N / Total back events * 100.

---

## 3. Adoption

Measures whether the tutorial leads to product adoption. Adoption metrics answer: "Does the tutorial work?" and "Do users start using the product?"

### Metrics

**Tutorial Start Rate**

- **What:** Percentage of eligible users who begin the tutorial.
- **How to measure:** `tutorial_session_start` count / Total new users (from app install or signup event) * 100.
- **Benchmark:** >80% for auto-triggered tutorials, >40% for opt-in tutorials.
- **Formula:** Session starts / New users * 100.

**Tutorial Completion Rate**

- **What:** Percentage of users who start the tutorial and finish it.
- **How to measure:** `tutorial_complete` count / `tutorial_session_start` count * 100.
- **Benchmark:** >60%. This is the single most important adoption metric.
- **Formula:** Complete events / Session start events * 100.

**Feature Adoption Post-Tutorial**

- **What:** Percentage of tutorial completers who perform the tutorial's core action with real data within 24 hours.
- **How to measure:** Join `tutorial_complete` events with downstream product events (e.g., "project_created", "task_assigned") within 24h by userId.
- **Benchmark:** >40% of completers should perform the core action within 24h.
- **Formula:** Users who completed tutorial AND performed core action within 24h / Users who completed tutorial * 100.

**First Real Action Latency**

- **What:** Time between tutorial completion and the user's first real product action.
- **How to measure:** Calculate the time delta between `tutorial_complete.timestamp` and the first non-tutorial product event for that userId.
- **Benchmark:** Median <5 minutes. If users complete the tutorial but do not use the product for hours, the tutorial is not creating momentum.
- **Formula:** Median of (first_real_action.timestamp - tutorial_complete.timestamp).

---

## 4. Retention

Measures whether tutorial completion impacts long-term user retention. Retention metrics answer: "Does the tutorial make users stay?"

### Metrics

**Day 1 Retention (Tutorial Completers vs. Non-Completers)**

- **What:** Percentage of users who return to the app on Day 1, split by tutorial completion status.
- **How to measure:** Cohort users by tutorial completion status (completed, dropped off, skipped entire). Check for any app event on the calendar day after tutorial interaction.
- **Benchmark:** Completers: >60% D1 retention. Non-completers: baseline varies. The delta between completers and non-completers is the key signal.
- **Formula:** Users in cohort who returned on D1 / Users in cohort * 100.

**Day 7 Retention**

- **What:** Same as D1 but measured at Day 7.
- **Benchmark:** Completers: >35% D7 retention. The completers vs. non-completers delta should be >10 percentage points.
- **Formula:** Same as D1, measured at D7.

**Day 30 Retention**

- **What:** Same as D1 but measured at Day 30.
- **Benchmark:** Completers: >20% D30 retention.
- **Formula:** Same as D1, measured at D30.

**Cohort Analysis Approach**

Build weekly cohorts of new users. For each cohort, track:
1. Tutorial start rate
2. Tutorial completion rate
3. D1, D7, D30 retention for completers
4. D1, D7, D30 retention for non-completers
5. Delta between completers and non-completers

Over time, as the tutorial improves (higher completion, lower dropoff), the retention delta should grow — indicating the tutorial is providing more value.

**Caution on causation:** Higher retention among completers does not prove the tutorial causes retention. Users who complete tutorials may be more motivated regardless. The signal is the trend: as the tutorial improves, does the retention delta increase? If yes, the tutorial is contributing to retention.

---

## 5. Task Success

Measures whether users can accomplish the tutorial's objectives efficiently. Task success metrics answer: "Can users do what the tutorial teaches?"

### Metrics

**Time to First Value (TTFV)**

- **What:** Total time from tutorial start to tutorial completion.
- **How to measure:** `tutorial_complete.totalTime` field. Compute median across all sessions.
- **Benchmark:** <60 seconds for simple tutorials, <120 seconds for complex flows.
- **Formula:** Median of tutorial_complete.totalTime across all completed sessions.

**Error Rate**

- **What:** Percentage of phases where the user's first action was incorrect (e.g., tapped the wrong element, tried to advance before completing the required action).
- **How to measure:** Track `tutorial_action` events where the target does not match the expected target for the phase. An "error" is an action on a non-target element while a tutorial phase is active.
- **Benchmark:** <10% error rate per phase. Higher rates indicate unclear instructions or confusing UI.
- **Formula:** Phases with at least one incorrect action / Total phases experienced * 100.

**Completion Time Distribution**

- **What:** Distribution of total tutorial completion times, not just the median. Reveals whether most users finish quickly or whether there is a long tail of confused users.
- **How to measure:** Histogram of `tutorial_complete.totalTime` values. Bucket into 10-second intervals.
- **Benchmark:** >80% of completers should finish within 2x the median time. A long tail (>20% taking 3x+ median) indicates a subset of users struggling significantly.
- **Formula:** Percentile distribution of totalTime.

**Phase-Level Completion Time Variance**

- **What:** How much variation exists in time spent per phase. High variance suggests the phase is easy for some users and hard for others.
- **How to measure:** Calculate standard deviation of phase duration grouped by phase name.
- **Benchmark:** Coefficient of variation (std dev / mean) should be <0.8 per phase. Higher than 0.8 indicates the phase experience is inconsistent.
- **Formula:** StdDev(phase_duration) / Mean(phase_duration) per phase.

---

## Metric Priority Matrix

Not all metrics are equally actionable. Prioritize based on what stage the tutorial is in:

| Stage | Priority Metrics | Why |
|---|---|---|
| Pre-launch | Event schema validation, instrumentation test | Cannot measure anything without working events |
| Week 1 | Completion rate, per-phase dropoff, TTFV | Identify broken phases immediately |
| Month 1 | Phase interaction rate, time per phase, skip rate | Optimize engagement and pacing |
| Month 2+ | Feature adoption, D1/D7 retention, NPS | Measure downstream impact |
| Ongoing | Cohort analysis, A/B variant comparison | Continuous improvement |

---

## Dashboard Recommendations

Build a single tutorial analytics dashboard with four sections:

1. **Funnel** — Phase-by-phase progression with dropoff percentages. This is the primary view.
2. **Timing** — Median time per phase as a bar chart. Highlight phases outside the 3-8 second optimal range.
3. **Outcomes** — Completion rate trend over time, feature adoption rate, TTFV trend.
4. **Retention** — D1/D7/D30 retention curves for completers vs. non-completers cohorts.
