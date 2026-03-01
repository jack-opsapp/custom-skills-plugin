# Flow Templates

Four reusable tutorial flow structures. Each template includes an ASCII diagram, use cases, phase count ranges, time ranges, and example apps.

Select one template as the foundation for the flow specification. Templates can be combined (e.g., a Linear flow within one branch of a Branching template).

---

## 1. Linear

### Structure

A straight sequence from start to finish. Every user sees every phase in the same order. No branching, no choices, no skipped sections.

```
[Start]
  │
  ▼
[Phase 1] ──► [Phase 2] ──► [Phase 3] ──► ... ──► [Phase N]
  │                                                     │
  │                                                     ▼
  │                                               [Complete]
  │                                                     │
  └──────────── Skip Tutorial ──────────────────────────┘
```

### Specifications

| Attribute | Value |
|-----------|-------|
| Phase count | 6-12 |
| Time range | 30-60 seconds |
| Branching | None |
| Best for | Simple apps, single user role, first-time builders |
| Complexity to build | Low |

### When to Use

- The app has a single primary workflow (create → view → manage)
- All users follow the same path and use the same features
- The tutorial teaches a sequential process where step order matters
- The team wants to ship a tutorial quickly with minimal state management

### When NOT to Use

- The app serves multiple user roles with different feature needs
- The app has a dashboard/hub structure where exploration order does not matter
- More than 12 phases are needed — linear fatigue sets in after 60 seconds

### Design Guidelines

1. Open with 2-3 orientation phases (no user action required).
2. Transition to 3-5 action phases where the user performs real gestures.
3. Place a celebration phase at the midpoint if the flow exceeds 8 phases.
4. Close with a completion celebration and a CTA for the next action.
5. Keep screen transitions to 2-3 maximum — complete all phases on a screen before moving.

### Example Apps

- **Simple task manager:** Create task → Set priority → View list → Complete task → Done
- **Weather app:** Location permission → Current view → Forecast swipe → Settings → Done
- **Note-taking app:** Create note → Format text → Organize into folder → Done

---

## 2. Branching

### Structure

A decision point early in the flow forks the user into one of 2-3 branches. Each branch teaches role-specific or goal-specific features. Branches converge at a merge point for shared features before completion.

```
                    [Start]
                      │
                      ▼
                [Decision Point]
                 /      |      \
                /       |       \
               ▼        ▼        ▼
          [Branch A] [Branch B] [Branch C]
          (4-8 ph)  (4-8 ph)   (4-8 ph)
               \       |       /
                \      |      /
                 ▼     ▼     ▼
               [Merge Point]
                      │
                      ▼
              [Shared Phases]
              (2-4 phases)
                      │
                      ▼
                 [Complete]
```

### Specifications

| Attribute | Value |
|-----------|-------|
| Phase count | 8-18 per branch (including shared) |
| Time range | 30-90 seconds per path |
| Branching | 2-3 branches |
| Best for | Multi-role apps, personalized onboarding |
| Complexity to build | Medium-High |

### When to Use

- The app has 2-3 distinct user roles (field crew vs. office manager vs. owner)
- Features vary significantly by role — showing all features to all users would confuse
- Personalization is a product value — the tutorial should feel tailored
- The decision can be made with a simple selection (role picker, goal chooser)

### When NOT to Use

- Roles are fluid — users switch frequently and need all features
- The role distinction is cosmetic (same features, different labels)
- More than 3 branches are needed — build separate tutorials instead
- The decision point requires information the user does not have yet

### Design Guidelines

1. The decision point phase should be the 2nd or 3rd phase (after a brief welcome).
2. Present options as large, tappable cards with icons and 1-line descriptions.
3. Allow changing the selection — do not lock the user into a branch permanently.
4. Keep branch length within 50% of each other (if Branch A is 6, Branch B should be 4-9).
5. The merge point phase should acknowledge the branch: "Now let's look at features everyone uses."
6. Shared phases after the merge should be 2-4 maximum — most content belongs in branches.

### Example Apps

- **Field service app:** Field crew branch (schedule, check-in) vs. Office branch (dispatch, reporting)
- **E-commerce platform:** Buyer branch (browse, cart, checkout) vs. Seller branch (list items, manage orders)
- **Project management:** Individual contributor branch vs. Team lead branch

---

## 3. Hub-and-Spoke

### Structure

A central screen (dashboard, home, hub) is the anchor. The tutorial radiates outward from the hub, teaching one feature per spoke, then returning to the hub before exploring the next spoke. The user always knows where they are because they keep returning to a familiar center.

```
                    [Start]
                      │
                      ▼
                  [Hub Intro]
                 /    |    \
                /     |     \
               ▼      ▼      ▼
          [Spoke 1] [Spoke 2] [Spoke 3]
          (2-4 ph)  (2-4 ph)  (2-4 ph)
               \      |      /
                \     |     /
                 ▼    ▼    ▼
               [Return to Hub]
                      │
                      ▼
                 [Complete]

  Each spoke:
  [Hub] ──► [Navigate to Feature] ──► [Learn Feature] ──► [Return to Hub]
```

### Specifications

| Attribute | Value |
|-----------|-------|
| Phase count | 10-20 (2-4 hub phases + 2-4 per spoke) |
| Time range | 45-90 seconds |
| Branching | None (sequential spokes, not user-chosen) |
| Best for | Dashboard apps, tab-based apps, feature-rich apps |
| Complexity to build | Medium |

### When to Use

- The app has a clear home/dashboard screen with navigation to multiple features
- Features are independent — learning about the calendar does not require knowing the job board
- The user needs a mental map of the app's structure before diving deep
- The app uses tab-based navigation

### When NOT to Use

- The app has a single linear workflow — Hub-and-Spoke adds unnecessary navigation
- Features are deeply interdependent (must learn A before B makes sense)
- The hub screen is not the primary entry point (deep-link-first apps)

### Design Guidelines

1. Start with 2-3 phases on the hub: welcome, orient to the layout, highlight the navigation.
2. Visit spokes in priority order — most important feature first.
3. Each spoke is 2-4 phases: navigate there (1), learn the feature (1-2), return to hub (1 auto-advance).
4. The return-to-hub phase can be auto-advance (2-3 seconds) to keep momentum.
5. After all spokes, a final hub phase summarizes what was learned and provides a CTA.
6. Limit to 3-5 spokes. More than 5 makes the tutorial too long.

### Example Apps

- **OPS app:** Hub (Job Board) → Spoke 1 (Calendar) → Spoke 2 (Create Project) → Spoke 3 (Settings) → Complete
- **Banking app:** Hub (Account Summary) → Spoke 1 (Transfers) → Spoke 2 (Bills) → Spoke 3 (Budgets)
- **Fitness app:** Hub (Dashboard) → Spoke 1 (Workouts) → Spoke 2 (Nutrition) → Spoke 3 (Progress)

---

## 4. Progressive Unlock

### Structure

The tutorial is divided into tiers. Each tier is a self-contained mini-tutorial that unlocks the next tier upon completion. Tiers can span multiple sessions — the user completes Tier 1 on day one, Tier 2 is triggered on day two or after a usage milestone.

```
  ┌─────────────────────────────────────────┐
  │              TIER 1: Core               │
  │  [Phase 1] → [Phase 2] → ... → [Done]  │
  │         (6-10 phases, 30-60s)           │
  └──────────────────┬──────────────────────┘
                     │
              Unlock trigger:
              Tier 1 complete +
              1 real action taken
                     │
  ┌──────────────────▼──────────────────────┐
  │          TIER 2: Collaboration          │
  │  [Phase 1] → [Phase 2] → ... → [Done]  │
  │         (6-10 phases, 30-60s)           │
  └──────────────────┬──────────────────────┘
                     │
              Unlock trigger:
              Tier 2 complete +
              3 real actions taken
                     │
  ┌──────────────────▼──────────────────────┐
  │           TIER 3: Advanced              │
  │  [Phase 1] → [Phase 2] → ... → [Done]  │
  │         (6-10 phases, 30-60s)           │
  └─────────────────────────────────────────┘
```

### Specifications

| Attribute | Value |
|-----------|-------|
| Phase count | 15-30 total (5-10 per tier) |
| Time range | 60-120 seconds total (split across sessions) |
| Tiers | 2-4 |
| Best for | Complex apps, enterprise tools, multi-session onboarding |
| Complexity to build | High |

### When to Use

- The app is complex with 15+ features that cannot be taught in one session
- Users need to practice core features before advanced features make sense
- Retention over multiple sessions is a key metric
- The app has clear feature tiers (basic → team → enterprise)

### When NOT to Use

- The app is simple enough for a single-session tutorial (under 12 phases)
- Users need all features immediately (no time for progressive learning)
- The team cannot invest in multi-session tutorial infrastructure (trigger systems, state persistence)

### Design Guidelines

1. Each tier must be self-contained — a complete tutorial with its own celebration.
2. Tier 1 must deliver standalone value. If the user never does Tier 2, they can still use the app.
3. Unlock triggers should combine completion + real usage (not just completion alone).
4. Prompt the next tier with a non-blocking notification or banner — never force it.
5. Allow the user to dismiss the prompt and access the next tier later from settings.
6. Each tier follows Linear or Hub-and-Spoke structure internally.

### Example Apps

- **OPS app:** Tier 1 (Create project, view calendar), Tier 2 (Assign crew, manage expenses), Tier 3 (Reports, integrations)
- **Figma:** Tier 1 (Draw shapes, move objects), Tier 2 (Components, auto-layout), Tier 3 (Prototyping, dev mode)
- **Salesforce:** Tier 1 (Contacts, deals), Tier 2 (Pipeline, forecasting), Tier 3 (Reports, dashboards, automation)

---

## Template Selection Decision Tree

Use this decision tree to select the right template:

```
How many distinct user roles does the app serve?
│
├── 1 role (or all users use the same features)
│   │
│   ├── Does the app have a central hub/dashboard?
│   │   ├── Yes → Hub-and-Spoke
│   │   └── No → Linear
│   │
│   └── Are there more than 12 features to teach?
│       ├── Yes → Progressive Unlock
│       └── No → Linear or Hub-and-Spoke
│
├── 2-3 roles
│   └── Branching
│
└── 4+ roles
    └── Build separate tutorials per role (do not use Branching)
```
