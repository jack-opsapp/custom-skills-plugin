# Widget Reference

Per-widget specifications. Each widget answers one business question, maps to specific data sources, and has defined content at each size tier.

---

## MONEY — "Am I making money?"

### Revenue Pulse
**Question:** How much have I collected this period?
**Data:** `Payments.amount` (non-voided) grouped by month. `Invoices.amountPaid` as cross-reference.
**Permission:** `invoices.view`
**Tags:** `essential`, `finance`

| Tier | Content |
|------|---------|
| **XS** | Hero: MTD collected (formatted currency). Delta arrow vs prior month. |
| **SM** | Hero + sparkline (trailing 6 months). YTD total below. Footer: "View Invoices" |
| **MD** | Hero + bar chart (monthly revenue, YoY ghost bars). Bottom summary: MTD vs YTD. |
| **LG** | Bar chart + top 5 clients by revenue this period (list with amounts). Action: tap client → navigate. |

**Empty state:** Show "$0" as the hero number + "No payments received" subtitle. Never show a floating icon in empty space.
**Benchmark:** Gross margin target overlay at 50-55% when expense data available.
**Color:** Bars use `WT.revenue`. Current month full opacity, prior months 60%. YoY ghost at 20%.

---

### Receivables Aging
**Question:** Who owes me money and how long have they owed it?
**Data:** `Invoices` where `balanceDue > 0` and status not void/paid. Buckets by `dueDate` age: Current, 1-30d, 31-60d, 61-90d, 90d+.
**Permission:** `invoices.view`
**Tags:** `essential`, `finance`

| Tier | Content |
|------|---------|
| **XS** | Hero: Total outstanding AR. Color shifts by severity (accent if healthy, warning if > 30d balance exists, error only if 90d+ exists). |
| **SM** | Hero + horizontal stacked bar showing bucket proportions. Footer: "View Invoices" |
| **MD** | Hero + individual bucket bars (horizontal, proportional width). Each bucket labeled with count + total. Top 3 overdue invoices listed. |
| **LG** | Full bucket breakdown + scrollable invoice list per bucket. Action: tap invoice → navigate. "Send Reminder" button on 30d+ invoices. |

**Color severity tiers (NOT binary red/green):**
- Current: `WT.accent`
- 1-30d: `WT.warning`
- 31-60d: `WT.receivables`
- 61-90d: blend toward error
- 90d+: `WT.error` (only tier that uses error red)

---

### Profit Gauge
**Question:** Am I actually profitable?
**Data:** Revenue (`Payments.amount` non-voided) minus Expenses (`Expenses.amount` approved) for the selected period.
**Permission:** `invoices.view`
**Tags:** `finance`

| Tier | Content |
|------|---------|
| **XS** | Hero: Margin percentage. Color: success if >= 50%, warning if 30-50%, error if < 30%. |
| **SM** | Hero margin % + revenue and expense totals as supporting stats. |
| **MD** | Margin % + horizontal split bar (revenue vs expenses, proportional). Revenue and expense breakdowns. |
| **LG** | Split bar + expense category breakdown (pie or horizontal bars). Trend: margin % over last 6 months. |

**Benchmark overlay:** Target line at 50% margin (industry standard for trades).

---

### Expense Tracker
**Question:** Where is money going?
**Data:** `Expenses` grouped by `categoryId` (9 default categories). `expense_categories` for labels.
**Permission:** `expenses.view`
**Tags:** `finance`

| Tier | Content |
|------|---------|
| **XS** | Hero: Total expenses this period. Delta vs prior period. |
| **SM** | Hero + top 3 categories as colored dots with amounts. |
| **MD** | Hero + horizontal bar chart by category (sorted by amount descending). Period selector toggle. |
| **LG** | Category bars + scrollable expense list (recent, grouped by date). Action: tap expense → navigate. Pending approval count badge. |

---

### Cash Position
**Question:** What direction is my cash flow heading?
**Data:** `Payments.amount` (in) minus `Expenses.amount` (out) per period. Net cash flow.
**Permission:** `invoices.view`
**Tags:** `finance`

| Tier | Content |
|------|---------|
| **XS** | Hero: Net cash flow this month (positive = green, negative = red). Arrow indicating direction. |
| **SM** | Hero + "In" and "Out" supporting stats below. |
| **MD** | Hero + dual-bar chart (payments in vs expenses out, monthly). Net line overlay. |
| **LG** | Dual-bar chart + upcoming obligations (invoices due to you, expenses pending). Cash forecast. |

---

## PIPELINE — "Is future work coming?"

### Pipeline Funnel
**Question:** What's my pipeline health across stages?
**Data:** `Opportunities` grouped by `stage` (active stages only). `estimatedValue` per stage.
**Permission:** `projects.view`
**Tags:** `essential`, `pipeline`

| Tier | Content |
|------|---------|
| **XS** | Hero: Active pipeline count. Weighted value below. |
| **SM** | Hero count + mini funnel bars (4 stages, proportional width). Total pipeline value. |
| **MD** | Funnel bars with stage labels, counts, and values. Bars proportional to count within max. |
| **LG** | Funnel + top 2 opportunities per stage (name, value, days in stage). Action: tap opportunity → navigate. Conversion rate between stages. |

**Color:** Uses `PROJECT_STATUS_COLORS` (semantic status colors from models.ts — these are app-wide constants, not hardcoded).

---

### Win Rate
**Question:** Am I closing deals?
**Data:** `Opportunities` where stage = `won` vs `lost` over selected period. `Estimates` approved vs declined as secondary signal.
**Permission:** `estimates.view`
**Tags:** `pipeline`, `estimates`

| Tier | Content |
|------|---------|
| **XS** | Hero: Win rate percentage. Color: success if >= 60%, warning if 40-60%, muted if < 40%. |
| **SM** | Hero % + won/lost/total counts. Trend arrow vs prior period. |
| **MD** | Hero % + pie or ring chart (won vs lost vs active). Average deal size. Average sales cycle length. |
| **LG** | Win rate trend over time (line chart). Loss reason breakdown (if `lostReason` populated). Top converting lead sources. |

---

### Backlog Depth
**Question:** How many weeks of signed work do I have ahead?
**Data:** `Projects` where status = accepted or in_progress. Sum of remaining task durations.
**Permission:** `projects.view`
**Tags:** `essential`, `pipeline`

| Tier | Content |
|------|---------|
| **XS** | Hero: "X weeks" of backlog. Color: success if 4-8 weeks, warning if < 2 or > 12 weeks. |
| **SM** | Hero + horizontal bar showing fill against 8-week target. New bookings this month count. |
| **MD** | Hero + stacked bar showing accepted vs in-progress. Monthly booking trend (trailing 6 months). |

**Benchmark:** 4-8 weeks is the healthy range for most trades businesses.

---

### Booking Rate
**Question:** Am I adding new work consistently?
**Data:** `Projects` with status = accepted, grouped by month created. Count and total value.
**Permission:** `projects.view`
**Tags:** `pipeline`

| Tier | Content |
|------|---------|
| **XS** | Hero: Projects booked this month. Delta vs prior month. |
| **SM** | Hero + sparkline (trailing 6 months bookings). |
| **MD** | Hero + bar chart (monthly bookings, trailing 6-12 months). Average booking value. |

---

### Lead Sources
**Question:** Where do my best leads come from?
**Data:** `Opportunities.source` distribution. Win rate per source. Value per source.
**Permission:** `pipeline.view`
**Tags:** `pipeline`

| Tier | Content |
|------|---------|
| **XS** | Hero: Top source name + count. |
| **SM** | Top 3 sources with counts. |
| **MD** | Horizontal bar chart: all sources, sorted by count or value. Win rate annotation per source. |
| **LG** | Source bars + conversion funnel per source. ROI indicators if cost data available. |

---

## OPERATIONS — "What needs doing today?"

### Task Pulse
**Question:** Are we on track with current work?
**Data:** `ProjectTasks` (active, not deleted). Categorized: overdue (startDate < today), due today, in progress, upcoming (next 7 days).
**Permission:** `tasks.view`
**Tags:** `essential`, `scheduling`

| Tier | Content |
|------|---------|
| **XS** | Hero: If overdue > 0, show overdue count (colored warning/error). Otherwise show total open. |
| **SM** | Hero count + segmented horizontal bar (proportional by category). Category counts below bar. |
| **MD** | Segmented bar + top 4-5 actionable tasks (overdue first, then today, then in-progress). Left border color = category. |
| **LG** | Full bar + scrollable task list grouped by category. Action: tap task → navigate to project. Mark complete inline. |

**Color severity for segments:**
- Overdue: `WT.error` (muted — see color note below)
- Due today: `WT.warning`
- In progress: `WT.accent`
- Upcoming: `WT.muted`

**Color note:** The overdue segment should use a MUTED version of the error color for chart fills, not the raw `#93321A` which is too dark/heavy at scale. The raw error color is reserved for status badges and critical alerts. For data visualization fills, use `WT.error` at 70-80% opacity or define a `WT.errorMuted` token.

---

### Today's Schedule
**Question:** What's happening today and who's going where?
**Data:** `ProjectTasks` scheduled today (via `startDate`). `CalendarUserEvents` for today. Team member assignments.
**Permission:** `calendar.view`
**Tags:** `essential`, `scheduling`

| Tier | Content |
|------|---------|
| **XS** | Hero: Count of events/tasks today. "X jobs today" |
| **SM** | Hero + next upcoming event (name, time, location). |
| **MD** | Timeline list: today's tasks sorted by time, showing task name, project, assigned crew, location. |
| **LG** | Full timeline + tomorrow preview. Crew assignment view (who's going where). Tap task → navigate. |

---

### Crew Board
**Question:** Is my team loaded right?
**Data:** `Users` (active, role = crew/operator). `ProjectTasks` assigned to each user. Utilization = assigned tasks / available slots.
**Permission:** `team.view`
**Tags:** `essential`, `field-ops`
**Conditional:** Hidden if setup answer crew = "solo"

| Tier | Content |
|------|---------|
| **XS** | Hero: Team utilization % (average across crew). Color by health. |
| **SM** | Hero + crew member avatars with status dots (busy/available/idle). |
| **MD** | Crew list: each member with name, current task, utilization bar. Color-coded by load. |
| **LG** | Full crew list + weekly utilization heatmap. Action: tap member → view their schedule. Assignment suggestions for unassigned tasks. |

**Utilization color:**
- Overloaded (>100%): `WT.error`
- Healthy (60-100%): `WT.success`
- Light (20-60%): `WT.warning`
- Idle (<20%): `WT.muted`

---

## ALERTS — "What needs my attention?"

### Action Required
**Question:** What's urgent right now that I need to act on?
**Data:** Cross-entity aggregation:
- Overdue tasks: `ProjectTasks` where startDate < today, not completed
- Past-due invoices: `Invoices` where dueDate < today, balanceDue > 0, not void
- Expiring estimates: `Estimates` where validUntil within 7 days, status = sent/viewed
- Stale follow-ups: `FollowUps` where dueAt < today, status = pending
**Permission:** `tasks.view`
**Tags:** `essential`

| Tier | Content |
|------|---------|
| **XS** | Hero: Total action items count. Color: error if > 5, warning if 1-5, success if 0. |
| **SM** | Hero count + category breakdown dots (overdue tasks, past-due invoices, etc. with counts). |
| **MD** | Priority-sorted flat list. Each item: icon, description, age ("3w overdue"), amount if applicable. Top 5 shown. |
| **LG** | Grouped by category. Expanded list with inline actions: "Send Reminder" for invoices, "View Project" for tasks, "Follow Up" for stale leads. |

**Priority ordering:**
1. Past-due invoices > 90 days (money at risk)
2. Overdue tasks
3. Past-due invoices 30-90 days
4. Expiring estimates (about to lose the deal)
5. Stale follow-ups
6. Past-due invoices < 30 days

**This is the "tell me what to do" widget.** At LG+, every item should have a clear action the user can take immediately.

---

### Activity Feed
**Question:** What's been happening across my business?
**Data:** `Activities` sorted by `createdAt` descending. Types: note, email, call, meeting, estimateSent, invoiceSent, paymentReceived, stageChange, etc.
**Permission:** None (always visible)
**Tags:** `office`

| Tier | Content |
|------|---------|
| **XS** | Not offered — activity feed needs list space. |
| **SM** | Latest 3 activities with type icon, description, relative time. |
| **MD** | Scrollable activity list (10-15 items). Type filter toggles (all/projects/pipeline/invoices). |
| **LG** | Full activity feed + entity filter. Tap activity → navigate to entity. |

---

## NEW WIDGETS (To Build)

### Project Profitability
**Question:** Was this job actually profitable?
**Data:** Per-project: `Invoices.amountPaid` (revenue) minus `Expenses.amount` allocated via `expense_project_allocations.percentage`. Requires joining invoices + expenses through project.
**Permission:** `invoices.view`
**Tags:** `finance`
**Status:** NEW — not yet implemented

| Tier | Content |
|------|---------|
| **XS** | Hero: Average margin % across completed projects. Color by health (success ≥50%, warning 30-50%, error <30%). |
| **SM** | Hero avg margin + completed project count. Sparkline of margin trend (trailing 6 months). |
| **MD** | Top 5 projects sorted by profit (or loss). Each row: project name, revenue, cost, margin %. Horizontal bar showing margin. |
| **LG** | Full project list (scrollable). Sort toggle: by margin %, by revenue, by loss. Tap project → navigate. Flag projects with negative margin. |

**Why this matters:** #1 requested missing metric in trades software. Nobody tracks per-job profitability well. This is a competitive differentiator.
**Benchmark:** 50-55% gross margin target overlay.

---

### Revenue Forecast
**Question:** What revenue is likely coming in the next 30/60/90 days?
**Data:** Three sources summed:
1. `Opportunities` active: `estimatedValue × winProbability / 100` (weighted pipeline)
2. `Invoices` sent/awaiting payment: `balanceDue` (expected collections)
3. `Projects` accepted but not yet invoiced: estimated value from linked estimates
**Permission:** `invoices.view`
**Tags:** `finance`, `pipeline`
**Status:** NEW — not yet implemented

| Tier | Content |
|------|---------|
| **XS** | Hero: 30-day forecast total. Delta arrow vs current month actual. |
| **SM** | Hero + breakdown: "Pipeline: $X · Invoiced: $Y · Booked: $Z" |
| **MD** | Hero + stacked horizontal bar (3 sources, proportional). 30/60/90 day toggle. Confidence indicator (high if mostly invoiced, low if mostly pipeline). |
| **LG** | Bar chart by month (next 3 months). Source breakdown per month. Top upcoming deals list with probability. |

**Why this matters:** Answers "can I make payroll next month?" before it's a crisis. Trades owners check cash position every morning — this extends the view forward.
**Color:** Invoiced (high confidence) = `WT.accent`. Pipeline (weighted) = `WT.warning`. Booked (not yet invoiced) = `WT.muted`.

---

### Collection Efficiency
**Question:** How fast am I getting paid?
**Data:** `Invoices` where status = paid. `AVG(paidAt - sentAt)` = days to payment. `SUM(amountPaid) / SUM(total)` = collection rate. Trend over trailing 6 months.
**Permission:** `invoices.view`
**Tags:** `finance`
**Status:** NEW — not yet implemented

| Tier | Content |
|------|---------|
| **XS** | Hero: Average days to payment. Color: success ≤15d, warning 16-30d, error >30d. |
| **SM** | Hero days + collection rate %. Trend arrow vs prior period. |
| **MD** | Hero + bar chart: average days to payment by month (trailing 6). Collection rate trend line overlay. |
| **LG** | Monthly chart + breakdown by payment method. Slowest-paying clients list (top 5). Action: "Send Reminder" for clients with avg >30d. |

**Benchmark:** ≤15 days is excellent. 16-30 is acceptable. >30 is a cash flow risk.

---

### Follow-Up Compliance
**Question:** Is my team following up on time?
**Data:** `FollowUps`: completed vs pending vs skipped vs overdue. `completedAt - dueAt` = response time. Grouped by assignee.
**Permission:** `pipeline.view`
**Tags:** `pipeline`, `office`
**Status:** NEW — not yet implemented

| Tier | Content |
|------|---------|
| **XS** | Hero: Compliance rate % (completed on time / total due). Color: success ≥80%, warning 60-80%, error <60%. |
| **SM** | Hero % + overdue count badge. "X overdue" in warning color. |
| **MD** | Hero % + horizontal bar (completed / pending / overdue / skipped proportions). This week vs last week comparison. |
| **LG** | Per-team-member compliance breakdown. Each member: name, rate %, overdue count. Action: tap overdue → navigate to follow-up. Trend chart (weekly compliance rate). |

**Why this matters:** Research shows follow-up discipline is the #1 predictor of close rate. Making it visible drives behavior change.

---

### Business Health Score
**Question:** How's my business doing right now, in one number?
**Data:** Composite score (0-100) derived from 5 sub-scores:
1. **Cash Flow** (25%): Net cash flow direction + AR aging health
2. **Pipeline** (20%): Weighted pipeline value vs monthly revenue target (backlog coverage)
3. **Operations** (20%): Overdue task count + crew utilization
4. **Collections** (15%): Collection rate + avg days to payment
5. **Growth** (20%): Win rate + booking rate trend
**Permission:** None (always visible, uses available data)
**Tags:** `essential`
**Status:** NEW — not yet implemented

| Tier | Content |
|------|---------|
| **XS** | Hero: Score (0-100) with radial ring fill. Color: success ≥70, warning 40-70, error <40. |
| **SM** | Hero ring + 5 sub-score dots (colored by individual health). Weakest area label below. |
| **MD** | Hero ring + 5 sub-score horizontal bars with labels and individual scores. Weakest area highlighted with suggestion text. |
| **LG** | Full breakdown with sparkline trends per sub-score. "Your weakest area is Collections (avg 34 days to payment). 3 invoices past 30 days." Action: tap sub-score → navigate to relevant page. |

**Why this matters:** The ultimate morning check widget. One glance tells you if things are OK. The sub-scores tell you where to look if they're not. This is the "temperature check" users described wanting.
**Design note:** The radial ring should be the signature visual — a single arc from 0 to score, with the score number centered. Military gauge aesthetic. No playful colors.

---

### Lead Source ROI
**Question:** Where do my best leads come from — and which channels are wasting money?
**Data:** `Opportunities.source` → group by source. For each: count, won count, win rate (`won / (won + lost)`), total won value (`SUM(actualValue)`). Derived: cost per acquisition if marketing spend data available.
**Permission:** `pipeline.view`
**Tags:** `pipeline`
**Status:** NEW — not yet implemented

| Tier | Content |
|------|---------|
| **XS** | Hero: Top source name + win rate %. |
| **SM** | Top 3 sources: name, lead count, win rate. Color dot by effectiveness. |
| **MD** | Horizontal bar chart: all sources sorted by won value. Each bar annotated with win rate %. Lead count as secondary label. |
| **LG** | Full source breakdown with: leads, won, lost, win rate, avg deal size, total revenue. Sort toggles. "Referrals: 11 won at 73%, avg $18K. Google Ads: 8 won at 20%, avg $8K." |

**Why this matters:** "A $50 lead that never closes is infinitely more expensive than a $150 lead that turns into a $20,000 job." Most contractors can't attribute revenue to source. This is a competitive weapon.

---

### Estimate Accuracy
**Question:** How accurate are my quotes? Am I consistently underbidding?
**Data:** For completed projects: `Estimate.total` (what was quoted) vs `SUM(Expenses allocated to project)` (what it actually cost) vs `Invoice.total` (what was billed). Variance = `(actual - estimated) / estimated * 100`.
**Permission:** `estimates.view`
**Tags:** `finance`, `estimates`
**Status:** NEW — not yet implemented

| Tier | Content |
|------|---------|
| **XS** | Hero: Average estimate variance % (e.g., "-18%" means underbidding by 18%). Color: success if ±5%, warning if ±5-15%, error if >15%. |
| **SM** | Hero variance + "X of Y jobs over budget" count. Trend arrow vs prior quarter. |
| **MD** | Per-completed-project list: project name, estimated, actual, variance %. Color bar showing over/under. Sorted by worst variance first. |
| **LG** | Project list + breakdown by line item type: "Labor estimates: -18% avg. Material estimates: +3% avg." Recommendation: "Consider adding 20% labor buffer to future estimates." |

**Why this matters:** "Contractors systematically underprice by 11-18%." Without comparing quote vs actual, pricing stays stuck at whatever "felt right" years ago. This closes the feedback loop.

---

### Client Lifetime Value
**Question:** Who are my most valuable long-term clients?
**Data:** Per client: `SUM(Invoices.amountPaid)` across all projects. Project count. Average project value. Days since last project. First project date.
**Permission:** `clients.view`
**Tags:** `clients`
**Status:** NEW — not yet implemented

| Tier | Content |
|------|---------|
| **XS** | Hero: Average CLV across all clients. |
| **SM** | Hero CLV + top client name and their total. Repeat rate (clients with 2+ projects / total clients). |
| **MD** | Top 10 clients by lifetime value. Each row: name, total revenue, project count, last project date. Clients inactive >6 months flagged. |
| **LG** | Full client list sortable by: lifetime value, recency, project count. "Dormant clients" section: clients with no project in 6+ months (re-engagement targets). Action: tap client → navigate. |

**Why this matters:** "Average HVAC customer lifetime value: $15,340." Knowing which clients are repeat buyers and which are dormant re-engagement targets drives revenue without marketing spend.

---

### Seasonal Revenue Map
**Question:** What are my strong months and when should I plan for slowdowns?
**Data:** `Payments.amount` grouped by month, trailing 12-24 months. Compare same month year-over-year. Identify seasonal patterns.
**Permission:** `invoices.view`
**Tags:** `finance`
**Status:** NEW — not yet implemented

| Tier | Content |
|------|---------|
| **XS** | Hero: Current month vs same month last year (delta %). |
| **SM** | Hero + 12-month sparkline with current month highlighted. "Strongest: Jun. Weakest: Dec." |
| **MD** | 12-month heatmap grid (months as columns, intensity = revenue). Or bar chart with this year vs last year ghost bars. Monthly labels. |
| **LG** | Full 24-month view. YoY comparison per month. "Your Dec-Feb revenue drops 40% vs summer. Consider: maintenance agreements to smooth seasonal dips." |

**Why this matters:** "Start building your off-season pipeline 3-4 months before the slowdown begins." Seeing the seasonal pattern makes planning proactive instead of reactive.

---

### Crew Productivity
**Question:** Which team members generate the most value?
**Data:** Per team member: tasks completed count, projects assigned, revenue attributed (`SUM(Invoice.amountPaid)` for their assigned projects / number of assigned members on that project). Utilization rate.
**Permission:** `team.view`
**Tags:** `field-ops`
**Status:** NEW — not yet implemented
**Conditional:** Hidden if setup crew = "solo"

| Tier | Content |
|------|---------|
| **XS** | Hero: Average revenue per team member. Benchmark indicator. |
| **SM** | Hero + top performer name and their revenue. Team size count. |
| **MD** | Per-member horizontal bars: name, revenue attributed, tasks completed. Sorted by revenue desc. Benchmark line ($180K-$280K/yr for top performers). |
| **LG** | Full team scorecard: revenue, tasks completed, utilization %, projects active. Sort toggles. Trend: trailing 3-month revenue per member. |

**Why this matters:** "A tech earning $52K/year should generate $260K-$370K in annual revenue." Owners can't see which team members are profitable. This visibility drives coaching and hiring decisions.
**Benchmark:** Revenue per tech: $180K-$280K/yr (top 10%), $80K-$120K (bottom 25%).

---

### Time Saved
**Question:** How much admin time is OPS saving me?
**Data:** Count automated actions: auto-created clients (from pipeline wins), auto-generated tasks (from estimate approval), receipt scans processed (OCR), estimates converted to invoices, auto-generated follow-ups. Multiply by estimated manual time per action.
**Permission:** None (always visible)
**Tags:** `essential`
**Status:** NEW — not yet implemented

| Tier | Content |
|------|---------|
| **XS** | Hero: "X hrs saved this week" or "X hrs this month". |
| **SM** | Hero hours + breakdown: "3 auto-invoices, 12 receipt scans, 2 auto-clients" as compact counts. |
| **MD** | Hero + category breakdown bars: invoicing, receipt scanning, client creation, task generation, follow-up scheduling. Each with count and estimated time saved. |

**Why this matters:** "The average tradesperson spends 14 hours per week on administrative tasks." Quantifying time saved reinforces the product's value and reduces churn. Users see the ROI in concrete terms every time they open the dashboard.
**Design note:** This is a product marketing widget as much as a business intelligence widget. Keep it understated — present as fact, not celebration.

---

## DEFAULT DASHBOARD LAYOUTS BY ROLE

### Owner (Strategic — "Morning Check")
7 widgets, 2-minute scan:
1. Business Health Score (XS) — "How's my business?" (the temperature check)
2. Revenue Pulse (SM) — "Am I collecting?"
3. Cash Position (XS) — "Can I make payroll?"
4. Receivables Aging (XS) — "Who owes me?"
5. Pipeline Funnel (SM) — "Is work coming?"
6. Action Required (MD) — "What needs attention?"
7. Today's Schedule (MD) — "What's happening today?"

### Office Manager (Tactical)
6 widgets:
1. Action Required (MD)
2. Today's Schedule (MD)
3. Task Pulse (SM)
4. Receivables Aging (SM)
5. Estimates Overview (SM)
6. Activity Feed (SM)

### Field Crew (Operational)
3 widgets:
1. Today's Schedule (MD) — My tasks today
2. Task Pulse (XS) — Overdue count
3. Crew Board (SM) — Team status

---

## COLOR PHILOSOPHY FOR DATA VISUALIZATION

**Problem:** The raw error color `#93321A` is too heavy for chart fills. It was designed as a status badge color, not a data visualization fill. When it represents the largest segment (e.g., 13 overdue tasks), it dominates the dashboard.

**Solution: Severity tiers, not binary pass/fail.**

| Visual Context | Color Approach |
|----------------|----------------|
| Status badge (tiny) | Full saturation: `WT.error`, `WT.warning`, `WT.success` |
| Chart segment/bar fill | Muted: 70% opacity or lightened variant |
| Background tint | Very subtle: 10-15% opacity |
| Threshold/benchmark line | Dashed, 40% opacity |

**Never use the raw error color as a chart fill.** Reserve it for:
- Status badge backgrounds
- Critical alert icons
- "This is broken" indicators

For chart fills, use opacity modulation: `WT.error` at 70% opacity is softer but still communicates urgency.

**Neutral chart bars** (no semantic meaning): Use `WT.accent` at 40-60% opacity. This keeps the accent color present without creating meaning where none exists.
