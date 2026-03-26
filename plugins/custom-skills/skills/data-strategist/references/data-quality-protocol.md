# Data Quality Protocol

The framework for Phase 1's data gap assessment. Before analyzing or visualizing anything, inventory what's available, identify what's missing, and assess the impact of each gap.

---

## Assessment Hierarchy (Strict Order)

### Step 1 — Catalog What's Present

For every data dimension (column, field, property):

| Attribute | Document |
|-----------|----------|
| **Name** | Field name exactly as it appears |
| **Type** | Numeric (int/float), categorical, temporal, boolean, text, ID |
| **Range** | Min, max, distinct values |
| **Granularity** | Per-transaction, daily, weekly, monthly |
| **Completeness** | % non-null. Flag if <90%. |
| **Freshness** | When was this last updated? |
| **Time range** | Earliest to latest record |
| **Update frequency** | Real-time, daily, weekly, monthly, manual |

### Step 2 — Classify Each Dimension

Every dimension falls into one of these categories:

| Category | What It Is | Examples |
|----------|-----------|----------|
| **Identifier** | Who/what | Customer ID, job ID, campaign ID, employee ID |
| **Measure** | How much | Revenue, cost, duration, count, rating |
| **Dimension** | What kind | Job type, lead source, region, plan tier, trade |
| **Temporal** | When | Date, timestamp, period, cohort month |
| **Derived** | Computable from others | Margin (revenue - cost), utilization (billable / available), conversion rate |

### Step 3 — Cross-Reference Against Domain KPIs

Load the appropriate reference:
- Service business → `references/service-business-kpis.md`
- SaaS → `references/saas-kpis.md`

For each KPI in the reference, classify as:

| Status | Meaning | Action |
|--------|---------|--------|
| **Computable** | All required dimensions present | Include in analysis |
| **Partial** | Some dimensions present, result approximate | Note the approximation. Proceed with caveat. |
| **Missing** | Key dimensions absent | Assess gap impact. Ask user. |

### Step 4 — Gap Impact Assessment

For each missing dimension, document:

**1. What analysis it unlocks**
Be specific. Not "better insights" but "cohort retention curves showing whether users who complete onboarding in <5 minutes retain better than those who take >1 hour."

**2. Impact tier**

| Tier | Criteria |
|------|----------|
| **Critical** | Without this, the most important metrics cannot be computed. The entire analysis is compromised. |
| **High** | A major metric is missing or approximate. The analysis will have a significant blind spot. |
| **Medium** | A useful breakdown or comparison is unavailable. Analysis is complete but less actionable. |
| **Low** | A nice-to-have dimension for deeper drill-down. Core analysis unaffected. |

**3. Proxy possibility**
Can another available dimension approximate this one?
- Signup date as proxy for acquisition date
- Last login date as proxy for engagement
- Job count as proxy for revenue (if pricing is consistent)
- Note the proxy's limitations.

**4. Likely data source**
Where would this data come from?
- CRM (HubSpot, Salesforce, Jobber, ServiceTitan)
- Accounting software (QuickBooks, Xero, FreshBooks)
- Ad platforms (Google Ads, Meta Ads, LSA)
- Analytics (Mixpanel, Amplitude, PostHog, GA4)
- Payment processor (Stripe, Square)
- The app's own database

### Step 5 — Present to User

Structure the presentation as:

**Critical gaps** (must resolve before meaningful analysis):
> "Without [dimension], we cannot compute [metric], which is the most important indicator of [business outcome]. This data likely lives in [source]. Do you have access to it?"

**High-impact gaps** (would significantly improve analysis):
> "Adding [dimension] would unlock [specific analysis], which would tell us [specific insight]. Currently we can approximate with [proxy] but the result will be [limitation]."

**Medium/low gaps** (nice to have):
> "For deeper drill-down, [dimension] would enable [analysis]. Not blocking, but worth noting."

**Always ask**: "Do you have access to any of these? Even partial data would improve the analysis."

**Hard gate**: Do not proceed to Phase 2 until the user confirms the data scope — either providing additional data or confirming to proceed with what's available.

---

## Data Quality Red Flags

### Survivorship Bias
Only seeing active customers, not churned ones. Missing churn data means retention metrics are fiction.
- **Detection**: If there are no records of customers who stopped using the product, churn analysis is impossible.
- **Ask**: "Does this data include former customers / cancelled subscriptions / lost clients?"

### Aggregation Loss
Monthly summaries when daily data exists. Aggregation destroys distribution information.
- **Detection**: Suspiciously round numbers or consistent granularity (all monthly, no daily).
- **Ask**: "Is more granular data available? Daily or weekly data would reveal patterns that monthly summaries hide."

### Selection Bias
Data only from one channel, one time period, or one segment.
- **Detection**: Unusually consistent patterns. No variance. Suspiciously good metrics.
- **Ask**: "Does this represent all customers/all channels/all time, or is it filtered to a subset?"

### Stale Data
Dashboard recommendations based on old data are dangerous.
- **Detection**: Check the latest timestamp. If the data is >30 days old for operational metrics, flag it.
- **Flag**: "This data ends [date]. Metrics may not reflect current performance. When can fresh data be pulled?"

### Inconsistent Units
Revenue in different currencies. Dates in different formats. Costs with and without tax.
- **Detection**: Scan numeric fields for unusual ranges. Check date fields for format consistency.
- **Fix before analysis**: Normalize to consistent units. Document assumptions.

### Duplicate Records
Same transaction/event recorded multiple times.
- **Detection**: Check for duplicate IDs. Look for identical timestamps with identical values.
- **Impact**: Inflates counts, sums, and averages. Must deduplicate before analysis.

### Outlier Contamination
One $500,000 job in a dataset of $5,000 jobs destroys averages.
- **Detection**: Compare mean vs median. If mean >> median, outliers are present.
- **Treatment**: Report both mean and median. Consider trimmed mean. Visualize distribution to show the outlier explicitly.

---

## Data Sufficiency Thresholds

### Minimum Data for Meaningful Analysis

| Analysis Type | Minimum Data | Why |
|---------------|-------------|-----|
| Trend line | 6+ data points | Fewer = unreliable trend. 12+ for seasonality. |
| Distribution | 30+ observations | Central limit theorem. <30 = show individual points, not histogram. |
| Correlation | 15+ paired observations | Fewer = spurious correlation risk. |
| Cohort analysis | 3+ complete cohorts | Fewer = no comparison possible. Need 6+ for trend. |
| Seasonal comparison | 2+ full years | Need at least one prior year for YoY. 3+ for seasonal pattern confidence. |
| A/B comparison | Statistical significance | Check sample size. Small differences with small samples are noise. |

### When to Flag Insufficient Data
If available data falls below these thresholds, explicitly warn:
> "There are only [N] data points for [metric]. This is below the [threshold] needed for reliable [analysis type]. Recommend collecting more data before making decisions based on this."

Never present a trend line through 3 data points as if it were meaningful. Three points can support any narrative.

---

## Assessment Output Template

After completing the 5-step assessment, structure the findings as:

```markdown
## Data Inventory Summary
- **Dimensions**: [count] fields cataloged
- **Time range**: [start] to [end]
- **Granularity**: [finest resolution available]
- **Domain detected**: [Service Business / SaaS]
- **Overall completeness**: [%]

## Computable KPIs
[List of KPIs that can be fully computed with available data]

## Partial KPIs (Approximations)
[KPI] — missing [dimension], approximated via [proxy]. Limitation: [what's lost].

## Data Gaps

### Critical
- **[Missing dimension]**: Unlocks [metric/analysis]. Impact: [specific insight lost]. Source: [likely location].

### High Impact
- ...

### Medium / Low
- ...

## Red Flags
[Any quality issues detected: survivorship bias, stale data, outliers, etc.]

## Recommendation
[Proceed with caveats / Request additional data before analysis / Data insufficient for reliable analysis]
```
