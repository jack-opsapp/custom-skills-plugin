# SaaS KPIs

Domain reference for SaaS businesses — subscription software, platform products, and recurring-revenue businesses. Covers the metrics that matter, how they relate, benchmarks, and which visualizations surface each insight best.

---

## Revenue

### MRR / ARR (Monthly/Annual Recurring Revenue)
The heartbeat of any SaaS business.
- **Visualization**: Line chart (trend) with growth rate as companion metric. Area chart for cumulative emphasis.
- **Companion**: MoM growth rate (%), net new MRR.
- **Benchmark**: 10-20% MoM early-stage. 5-8% growth-stage. <3% = stalling.

### MRR Breakdown
New MRR + Expansion MRR - Contraction MRR - Churned MRR = Net New MRR.
- **Visualization**: Waterfall chart (the canonical SaaS chart). Shows what's driving growth or decline.
- **Key insight**: Healthy SaaS has expansion > churn. The waterfall makes this immediately visible.

### ARPU (Average Revenue Per User)
Trend over time.
- **Visualization**: Line chart. Rising = upsell working or upmarket shift. Falling = downmarket drift or aggressive discounting.
- **Companion**: Distribution histogram reveals whether ARPU is pulled by a few whales or represents genuine average.

### Revenue by Plan Tier
Composition over time.
- **Visualization**: Stacked area (tier composition shift). Treemap (current snapshot with user count as secondary encoding).
- **Key insight**: If the free tier dominates user count but the enterprise tier dominates revenue, the visualization must show both dimensions.

---

## Growth & Acquisition

### New Signups
Daily/weekly/monthly. By source (organic, paid, referral, direct).
- **Visualization**: Bar chart (weekly, by source as stacked). Line (trend).
- **Companion**: Activation rate. Raw signups without activation context is a vanity metric.

### Activation Rate
% of signups who complete the key onboarding milestone (the "aha moment").
- **Visualization**: Funnel (signup → first action → milestone → paying). Cohort comparison (is activation improving over time?).
- **Benchmark**: Varies wildly by product. Track trend, not absolute number.

### Time to First Value
How long from signup to "aha moment." Distribution, not average.
- **Visualization**: Histogram (distribution shape). The median matters more than the mean — a few users who take 30 days pull the average up.
- **Key insight**: If distribution is bimodal (some activate in 5 min, others in 5 days), there are two distinct user segments with different onboarding needs.

### CAC (Customer Acquisition Cost)
By channel. Payback period = months to recover CAC from subscription revenue.
- **Visualization**: Horizontal bar (by channel, sorted). Scatter (CAC vs LTV by channel).
- **Benchmark**: <12 month payback is healthy. >18 months is dangerous without strong retention.

### LTV:CAC Ratio
The SaaS health ratio.
- **Visualization**: Bullet chart (current ratio vs benchmarks: <1x = red, 1-3x = yellow, >3x = green). Trend line.
- **Benchmark**: >3x is healthy. >5x may indicate under-investment in growth. <1x is burning.

---

## Retention & Churn

### Logo Churn
% of customers lost per period.
- **Visualization**: Line chart (trend). Target reference line.
- **Benchmark**: <2% monthly for SMB SaaS. <1% monthly for enterprise. <0.5% for best-in-class.

### Revenue Churn
$ lost per period. Can differ significantly from logo churn if large accounts churn.
- **Visualization**: Line chart alongside logo churn (compare divergence). If revenue churn > logo churn, you're losing big accounts.

### Net Revenue Retention (NRR)
Revenue from existing customers this period / same customers last period.
- **Visualization**: Line (trend). Bullet chart (vs benchmarks). This is the single most important SaaS metric for demonstrating business health.
- **Benchmark**: >100% = expansion exceeds churn (the magic threshold). >120% = exceptional (enterprise SaaS). <90% = serious problem.
- **Color zones**: Green (>110%), yellow (95-110%), red (<95%).

### Cohort Retention Curves
The most important SaaS chart. Each signup cohort as a line showing % remaining over months.
- **Visualization**: Line chart with one line per cohort. Color intensity fades for older cohorts, strongest for most recent.
- **Key patterns to identify**:
  - **Flattening**: The curve levels off → users who stay past month X stay forever. This is the goal.
  - **Continuous decline**: No flattening → product-market fit problem.
  - **Smile curve**: Users come back after initial drop → re-engagement is working.
- **Small multiples version**: One panel per cohort for cleaner comparison.

### Churn Reasons
If tracked. Composition breakdown.
- **Visualization**: Horizontal bar (sorted by frequency). Treemap if hierarchical (category → specific reason).
- **Key insight**: Distinguish voluntary ("too expensive", "don't need") from involuntary ("failed payment").

---

## Engagement & Product

### DAU / WAU / MAU
And the ratios.
- **Visualization**: Line chart (all three on same chart or small multiples). Stickiness ratio: DAU/MAU on its own line.
- **Benchmark**: DAU/MAU > 0.4 is very sticky. 0.2-0.4 is normal for B2B SaaS. <0.2 is concerning.

### Feature Adoption
% of users using each core feature. By user segment.
- **Visualization**: Heatmap (features × user segments). Horizontal bar (sorted by adoption %).
- **Key insight**: If a feature has <5% adoption, it either needs better discovery or should be deprecated.

### Session Frequency
Distribution of how often users come back.
- **Visualization**: Histogram (distribution shape). Look for: daily users vs weekly vs monthly.

### Session Duration
Distribution of how long users engage.
- **Visualization**: Histogram. Compare segments (free vs paid, new vs tenured).
- **Caveat**: Long sessions can indicate engagement OR confusion. Cross-reference with task completion.

### Power User Identification
Users above 90th percentile in usage. What do they do differently?
- **Visualization**: Feature heatmap comparing power users vs average users. Radar chart overlaying usage patterns.
- **Key insight**: The feature combination that power users use but average users don't = the product's unrealized value. Target onboarding at this.

---

## Financial Health

### Burn Rate
Monthly cash consumption.
- **Visualization**: Line (trend). Bar (monthly). Area chart showing cash balance declining.
- **Companion**: Revenue overlay. The gap between revenue and burn IS the path to profitability.

### Runway
Months of cash remaining at current burn.
- **Visualization**: Big number + sparkline. Gauge with color zones (<6 months red, 6-12 yellow, >12 green).
- **Companion**: Trend. Is burn accelerating or decelerating?

### Gross Margin
Revenue minus COGS (hosting, support, payment processing).
- **Visualization**: Waterfall (revenue → COGS → gross profit). Trend line.
- **Benchmark**: >70% for software SaaS. 50-70% if infrastructure-heavy.

### Magic Number
Net new ARR / sales & marketing spend from prior quarter.
- **Visualization**: Line (trend). Bullet chart vs benchmarks.
- **Benchmark**: >1.0 = efficient growth (invest more). 0.5-1.0 = acceptable. <0.5 = growth engine is broken.

### Rule of 40
Revenue growth rate % + profit margin % should exceed 40.
- **Visualization**: Scatter (growth rate vs margin, with 40-line diagonal). Bubble chart where size = ARR.
- **Benchmark**: >40 = healthy. The higher above 40, the more attractive the business.

---

## User Demographics

### Trade Type Distribution
What kinds of businesses use the product.
- **Visualization**: Donut/treemap (current). Stacked area (shift over time).
- **Key insight**: Is the user base diversifying or concentrating in one trade?

### Company Size Distribution
Solo operators vs crews of 5 vs crews of 20+.
- **Visualization**: Histogram (distribution). Horizontal bar (by size band).
- **Key insight**: Revenue per user often correlates with company size. Overlay ARPU by size band.

### Geographic Distribution
Where users are located.
- **Visualization**: Choropleth map (users per state/province, normalized). Dot density if precise location available.
- **Companion**: Growth rate by region. A state with 10 users growing 50% MoM matters more than a state with 500 growing 2%.

### Plan Tier Distribution
Free vs paid tiers.
- **Visualization**: Donut (current). Stacked area (shift over time).
- **Key insight**: Free-to-paid conversion rate matters more than the raw ratio. Track as funnel.

---

## Metric Relationship Map

```
Marketing Spend → Signups → Activation Rate → Paying Conversion
                                                    ↓
                                              MRR Growth → NRR → ARR
                                                    ↓
                                              Feature Adoption → Stickiness → Retention
                                                    ↓
                                              LTV → LTV:CAC Ratio → Unit Economics
```

### Causal Chains to Surface
1. **Acquisition efficiency**: Spend → CAC → Activation → Conversion → Payback Period
2. **Expansion engine**: Feature Adoption → Stickiness → Expansion MRR → NRR
3. **Retention health**: Onboarding Quality → Time to Value → Cohort Retention → Logo Churn → Revenue Churn
4. **Financial trajectory**: Revenue Growth + Margin → Rule of 40 → Runway → Fundraise Timing
5. **Product-market fit signal**: Organic Signups + NRR >100% + DAU/MAU >0.3 = PMF

### SaaS Metric Layers (In Order of Importance)
1. **NRR** — Are existing customers growing? (>100% = yes)
2. **Cohort Retention** — Do customers stay? (flattening = yes)
3. **Activation Rate** — Do signups become users? (improving = yes)
4. **CAC Payback** — Is growth efficient? (<12mo = yes)
5. **MRR Growth** — Is the business growing? (the result of the above)

If NRR and retention are strong, pour fuel on acquisition. If they're weak, spending on acquisition is burning money.
