---
name: Competitor Scan
description: This skill should be used when the user asks to "scan competitors", "check competitor websites", "analyze competitor copy", "competitor messaging audit", "what are competitors doing", "refresh competitor intel", or wants to identify weaknesses in FSM competitor marketing and positioning. Fetches live competitor pages and diffs against stored intelligence.
version: 0.1.0
---

# Competitor Scan

Scan FSM competitor websites for copy, messaging, and positioning weaknesses that OPS can exploit. Compare findings against stored intelligence to identify changes and new opportunities.

## When to Use

- Refreshing competitive intelligence (recommended monthly)
- Before writing new landing pages or ad copy
- When a competitor launches new features or changes pricing
- Before major positioning decisions

## Process

### Step 1: Load Current Intelligence

Read the stored competitor intelligence from memory:

```
Read: C:\Users\j4cks\.claude\projects\C--OPS\memory\project_competitor_intelligence.md
```

This contains the baseline findings from March 2026. All new scans diff against this.

### Step 2: Select Targets

Consult `references/competitor-database.md` for the full competitor list, URLs, and pages to scan.

If the user specifies competitors, scan those. Otherwise, scan all Tier 1 competitors (ServiceTitan, Jobber, Housecall Pro, FieldPulse, Simpro, FieldEdge, BuildOps, Zuper).

### Step 3: Fetch and Analyze

For each competitor, use WebFetch on their homepage and pricing page at minimum. Analyze using this checklist:

**Copy Analysis:**
1. Hero headline — specific or generic? Changed since last scan?
2. Value proposition — differentiated or "all-in-one"?
3. Tone — corporate SaaS or trade-authentic?
4. Pain points — real problems named or feature lists?
5. CTA — "Book a demo" wall or actionable?

**Audience Analysis:**
1. Who is the copy talking to? (owner, admin, crew, foreman?)
2. Trade-specific language or generic "field service"?
3. Mobile-first positioning or desktop afterthought?
4. Non-English support mentioned?

**Pricing Analysis:**
1. Published or hidden?
2. Per-user or flat rate?
3. Add-on/upsell structure visible?

### Step 4: Diff Against Baseline

Compare findings to stored intelligence. Flag:
- **New weaknesses** not in baseline
- **Fixed weaknesses** competitors have addressed
- **Positioning shifts** (new taglines, audience changes)
- **Pricing changes** (new tiers, published pricing)
- **New competitors** emerging in the space

### Step 5: Report and Update

Present findings in this format:

```
## Competitor Scan Report — [Date]

### Changes Since Last Scan
- [Competitor]: [What changed]

### New Weaknesses Identified
- [Competitor]: [Weakness] → OPS opportunity: [angle]

### Weaknesses Competitors Fixed
- [Competitor]: [What they fixed]

### Recommended Actions for OPS
1. [Action with rationale]
```

After presenting, ask the user if they want to update the stored intelligence file with new findings.

## OPS Positioning Context

OPS differentiates on these axes — evaluate competitors against them:
- **Crew-first** (not owner/admin-first)
- **Transparent pricing** (no demo walls)
- **Instant deployment** (no multi-month onboarding)
- **Glove-friendly mobile** (56dp touch targets, works in sunlight)
- **Simple by design** (not ERP-level complexity)
- **Multi-trade** (beyond HVAC/plumbing/electrical)

## Additional Resources

### Reference Files
- **`references/competitor-database.md`** — Full competitor list with URLs, pricing, key weaknesses, and pages to scan
