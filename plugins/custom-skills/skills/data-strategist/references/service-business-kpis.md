# Service Business KPIs

Domain reference for trades businesses — HVAC, plumbing, electrical, roofing, landscaping, general contracting, cleaning, pest control, and similar field service operations. These metrics define what matters, how they relate, and what benchmarks to compare against.

---

## Revenue & Profitability

### Revenue Per Job
The single most important metric for a trades business. Trend over time + breakdown by job type reveals whether the business is moving upmarket or downmarket.
- **Visualization**: Line chart (trend) + horizontal bar (by job type)
- **Companion**: Job count. Revenue per job can rise while total revenue falls if volume drops.
- **Benchmark context**: Varies wildly by trade. Track against own historical average, not industry.

### Job Profitability
Revenue minus direct costs (labor hours × rate, materials, subcontractors) per job.
- **Visualization**: Waterfall chart (revenue → labor → materials → subs → profit). Scatter plot (revenue vs profit) to identify outlier jobs.
- **Key insight**: Often reveals that a business's most popular service is its least profitable.

### Gross Margin %
By job type, by crew, by client. The metric that separates thriving shops from struggling ones.
- **Visualization**: Horizontal bar sorted by margin. Color-code: green (>target), yellow (near target), red (below target).
- **Benchmark**: 50-65% gross margin is healthy for most trades. Below 40% is a problem.

### Average Ticket Size
Trend + distribution. Rising average ticket can indicate upselling success or loss of small-job customers.
- **Visualization**: Line (trend) + histogram (distribution shape). Bimodal distribution suggests two distinct customer segments.

### Revenue by Source
Referral, repeat, advertising, walk-in, partnerships.
- **Visualization**: Stacked area over time (composition shift) or donut (current snapshot).
- **Key insight**: Healthy businesses derive 40-60% from repeat/referral. Heavy ad dependence is fragile.

---

## Pipeline & Sales

### Close Rate
Proposals sent vs won. The conversion efficiency metric.
- **Visualization**: Funnel chart (lead → estimate → proposal → signed). Break down by: job type, lead source, estimator.
- **Benchmark**: 30-50% is typical for residential trades. Below 20% = pricing or qualification problem.

### Pipeline Velocity
Days from lead → estimate → proposal → signed → scheduled → completed. Each stage transition is a metric.
- **Visualization**: Horizontal stacked bar per stage showing average days. Or Gantt-style timeline showing median flow.
- **Key insight**: Bottlenecks appear as disproportionately long stages. A 2-day estimate that takes 14 days to become a proposal = follow-up problem.

### Pipeline Value
Total dollar value of open proposals weighted by close probability.
- **Visualization**: Big number + sparkline (trend). Stacked bar by stage.
- **Companion**: Days aging in current stage. Old proposals are effectively dead.

### Backlog Depth
Weeks/months of signed work not yet started. THE health indicator.
- **Visualization**: Area chart (trend). Gauge or bullet chart (current vs healthy range).
- **Benchmark**: 2-6 weeks is healthy for most trades. <2 weeks = feast-or-famine risk. >8 weeks = capacity constraint or scheduling problem.
- **Color zones**: Green (3-6 weeks), yellow (1-2 or 7-8), red (<1 or >8).

### Booking Rate
New jobs booked per week/month. The leading indicator for future revenue.
- **Visualization**: Bar chart (weekly) + trend line. Compare YoY for seasonal context.

---

## Operations & Productivity

### Employee Utilization
Billable hours / available hours. By crew member.
- **Visualization**: Horizontal bar per employee, sorted by utilization. Color-coded against target.
- **Benchmark**: 70-85% is healthy. Below 60% = underutilized. Above 90% = burnout risk.
- **Key insight**: The gap between top and bottom utilization often reveals scheduling inefficiency, not effort difference.

### Jobs Per Crew Per Week
Throughput metric. Trend + comparison across crews.
- **Visualization**: Small multiples (one panel per crew) or grouped bar.
- **Companion**: Average job duration. More jobs ≠ more productivity if jobs are smaller.

### Schedule Adherence
% of jobs completed on the day they were scheduled.
- **Visualization**: Line chart (trend). Target line overlay.
- **Benchmark**: 80-90% is good. Below 70% = systemic scheduling or scoping problem.

### Rework/Callback Rate
Jobs requiring return visits. Quality and estimating accuracy indicator.
- **Visualization**: Line chart (trend) with target. Break down by job type and crew.
- **Benchmark**: <5% is good. >10% = training or process problem.

### Actual vs Estimated Duration
By job type. Reveals estimating accuracy.
- **Visualization**: Scatter plot (estimated vs actual) with 45° reference line. Points above = over-budget. Dumbbell chart per job type showing estimate vs actual average.
- **Key insight**: Systematic over-estimation is as bad as under-estimation — it limits capacity.

---

## Advertising & Acquisition

### ROAS (Return on Ad Spend)
Revenue generated / ad spend. The king metric.
- **Visualization**: Line chart (trend) with break-even reference line. Break down by platform/campaign.
- **Benchmark**: 3-5x is healthy. Below 2x often means the channel isn't covering fully-loaded costs.
- **Danger zone**: Declining ROAS + rising CPC = bid inflation. Show as dual-axis or stacked chart.

### CPC (Cost Per Click)
By platform, campaign, keyword.
- **Visualization**: Horizontal bar (by campaign, sorted by CPC). Time series (trend).
- **Companion**: CTR. Low CPC + low CTR = irrelevant traffic. High CPC + high CTR = competitive keyword.

### CAC (Customer Acquisition Cost)
Total marketing spend / new customers acquired.
- **Visualization**: Line (trend). Stacked bar (by channel). Compare against LTV.
- **Key insight**: CAC by channel varies wildly. One channel at $50 CAC and another at $500 is common.

### CTR (Click-Through Rate)
By ad creative, platform, audience segment.
- **Visualization**: Horizontal bar (by creative, sorted). Time series (trend after creative changes).
- **Benchmark**: 2-5% is typical for local services. Below 1% = creative or targeting problem.

### Cost Per Lead
Ad spend / leads generated. Before close rate applies.
- **Visualization**: Line (trend). Funnel (ad spend → clicks → leads → booked jobs → revenue).
- **Companion**: Lead quality — cost per QUALIFIED lead matters more than cost per any lead.

### Lead-to-Close Ratio by Source
Which channels produce buyers vs browsers.
- **Visualization**: Grouped bar (leads vs closed, by source). Or funnel per source.
- **Key insight**: The cheapest leads are often the worst converters. Optimize for cost per closed job, not cost per lead.

---

## Client Retention

### Repeat Client Rate
% of revenue from returning clients. The cheapest revenue source.
- **Visualization**: Donut (repeat vs new revenue). Area chart (trend over time).
- **Benchmark**: 30-50% repeat revenue is healthy for residential. Higher for commercial/maintenance.

### Client Lifetime Value
Total revenue per client over the relationship. By client segment.
- **Visualization**: Distribution histogram. Compare segments. Top-10 client table.
- **Companion**: Acquisition cost. LTV:CAC ratio should be >3x.

### Time Between Jobs
For repeat clients, how long between engagements.
- **Visualization**: Histogram (distribution). Identify re-engagement windows.
- **Key insight**: If most repeats happen at 12-18 months, schedule outreach at 10 months.

### Review Ratings / NPS
If tracked. Trend over time.
- **Visualization**: Line (trend). Distribution bar (star ratings). Bullet chart (NPS vs target).

---

## Seasonal Patterns

Trades businesses are highly seasonal. The skill must account for:

- **YoY comparison is more meaningful than MoM** for almost every metric.
- **Booking rate in spring predicts summer revenue.** This is the most important leading indicator.
- **Winter slowdown is normal** in most trades — do NOT flag a December dip as a problem unless it deviates from prior December patterns.
- **Holiday weeks distort weekly metrics.** Flag or normalize.
- **Weather affects everything.** If data includes geography, cross-reference with seasonal weather patterns.

### How to Handle Seasonality in Visualizations
- Default to YoY overlay (this year's line overlaid on last year's, same x-axis months)
- Use 12-month rolling average for trend isolation
- Shade seasonal "normal range" as a reference band
- Compare same-period only: "March 2026 vs March 2025" not "March vs February"

---

## Metric Relationship Map

```
Ad Spend → Leads → Close Rate → Bookings → Backlog Depth
                                    ↓
                              Crew Utilization → Revenue/Job → Gross Margin
                                    ↓
                              Schedule Adherence → Client Satisfaction → Repeat Rate
                                                                            ↓
                                                                      Repeat Revenue → LTV → LTV:CAC
```

### Causal Chains to Surface
1. **Acquisition efficiency**: Ad Spend → CPC → CPL → Close Rate → CAC → LTV:CAC
2. **Operational health**: Bookings → Backlog → Utilization → Schedule Adherence → Callbacks
3. **Growth quality**: Revenue → Gross Margin → Repeat Rate → Revenue Stability
4. **Pricing power**: Ticket Size → Job Profitability → Margin % (across job types reveals pricing gaps)
