# Dashboard Strategy

Design principles from user research across CRM, field service, accounting, and project management software.

## Core Principles

### 1. "Tell me what to do, not just what happened"
The #1 unmet need. Every widget at LG+ should have an actionable element — a button, a link, a next step.

### 2. The 5-7 Widget Rule
>7 widgets exceeds cognitive load. Default dashboards ship with 5-7 widgets. Users add more via customize mode.

### 3. The Morning Ritual
Trades owners check 5 things every morning:
1. Cash position — current direction
2. Who owes me — AR aging
3. Revenue pace — am I on track
4. Today's schedule — who's going where
5. What needs attention — overdue items

### 4. Speed Is Non-Negotiable
Widgets render skeletons immediately, hydrate within 1-2s. No layout shift after data loads.

### 5. One Wrong Number Erodes Trust
Every computation must be verifiable. Tooltips show underlying numbers, not just derived metrics.

### 6. Role-Based Defaults
- **Owner:** Revenue, profit, pipeline, cash, action required (strategic)
- **Office:** Schedule, tasks, invoices, estimates, follow-ups (tactical)
- **Crew:** My tasks today, team status (operational, minimal)

### 7. Benchmarks Give Context
Show actuals against targets where benchmarks exist:
- Gross margin: 50-55% | Direct labor: 18-22% of revenue
- Backlog: 4-8 weeks healthy | Win rate: 60%+ | First-time fix: 80%+

## What Users Ignore
- Vanity metrics (total leads without conversion, total jobs without profitability)
- Charts for single data points — use a number with delta arrow instead
- Multiple dashboard tabs — one source of truth
- Decorative color — every color must encode meaning

## What Users Want
- Morning briefing: glance 2 min, know where business stands
- Goals with visual progress: margin target lines, revenue pace indicators
- Data embedded in workflow, not a separate destination
- Smart alerts within widgets: "3 invoices past 30 days" inside the AR widget

## Competitive Gap OPS Fills
ServiceTitan is overwhelming ($250-500/user, 6-12mo onboarding). Jobber reports are "very basic." QuickBooks forced a new dashboard "everyone hates." Salesforce "trains reps to hide in cubicles entering data."

OPS: Simple enough to scan in 2 minutes, actionable enough to drive decisions, reliable enough that users never open a spreadsheet instead.

## Color for Data Visualization

**Problem:** Raw error color `#93321A` is too heavy for chart fills. It was designed for tiny status badges, not chart segments representing 13 overdue tasks.

**Solution — severity tiers, not binary pass/fail:**

| Context | Approach |
|---------|----------|
| Status badge (tiny) | Full saturation |
| Chart bar/segment fill | 70-80% opacity (muted) |
| Background tint | 10-15% opacity |
| Threshold line | Dashed, 40% opacity |

Never use raw error color as a chart fill. Reserve for badges and critical alerts only.

## Dashboard Composition

### Default layout flow
- Top: Financial health (Revenue + Cash/AR)
- Middle: Operational pulse (Tasks + Schedule)
- Bottom: Pipeline + Action items

### Animation
- Cards stagger entry at 60ms intervals
- Data animates after card enters
- Bars grow from zero, numbers count up
- All respects `prefers-reduced-motion`

### Empty States
- Show "$0" or "0" as real values — zero is data
- Constructive subtitle: "No payments received" not "No data"
- At SM+: call-to-action ("Create your first invoice")
- Never a floating icon in empty space
