# Setup Galaxy → Widget Personalization

Optional reference. Load when working on default widget selection, setup flow, or dashboard layout personalization.

## How It Works

During web onboarding, users answer 13 "starfield" questions. Answers feed a tag-based scoring system that determines which widgets appear on their dashboard and in what order.

**Source files:**
- `OPS-Web/src/stores/setup-store.ts` — questions + state
- `OPS-Web/src/lib/utils/widget-defaults.ts` — scoring logic

## Widget Tags (7 total)

| Tag | Domain |
|-----|--------|
| `essential` | Always high priority |
| `pipeline` | Deal tracking, conversion |
| `finance` | Invoicing, receivables, profit |
| `scheduling` | Job scheduling, crew assignment |
| `field-ops` | Crew management, locations, dispatch |
| `office` | Admin, reporting |
| `estimates` | Quote creation |
| `clients` | Client communication, leads |

## Key Selector Questions

### Q13: "What would move the needle most?" (PRIMARY)
- "Winning more work" → pipeline (high), estimates (high)
- "Getting paid faster" → finance (high)
- "Better organization" → office (high), scheduling (high)
- "More time back" → scheduling (high), field-ops (high)

### Q7: "Who's on the team?" (GATE)
- "solo" → Hide all crew/field-ops widgets entirely
- Others → Show field-ops tier widgets

### Q4: "Are you on top of invoicing?" (SEVERITY)
- Likert ≤2 (falling behind) → finance widgets high priority
- Likert ≥4 (locked in) → finance lower priority

### Q1: "How many jobs running?" (COMPLEXITY)
- "20+" → Maximum office/scheduling/field-ops complexity
- "1-3" → Minimal office widgets, basic scheduling

## Inference for Unanswered Questions

Minimum 4 of 13 questions required. For unanswered:
- crew="just-me" + no scheduling → scheduling low
- crew="multiple-crews" + no scheduling → scheduling high
- estimates="pen-paper" + no close_rate → pipeline high
- growth="getting-paid-faster" + no invoicing → finance high
- Uncovered tags default to medium priority

## Mapping to Default Widget Sets

After scoring, build the default dashboard:
1. All `essential`-tagged widgets included first
2. Sort remaining by tag priority (high → medium → low)
3. Cap at 6-8 widgets for initial dashboard
4. Respect permission gates (crew can't see finance widgets)

## Role Overrides

Setup answers determine the **owner's** dashboard. Other roles use fixed defaults:
- Office: schedule-heavy, admin-focused (see dashboard-strategy.md)
- Crew: minimal — today's tasks + team status only
