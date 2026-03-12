---
name: SEO Research
description: This skill should be used when the user asks to "research keywords", "find SEO opportunities", "what are trade workers searching for", "keyword research", "refresh SEO intel", "find high-intent keywords", "organic search opportunities", or wants to discover what trade contractors are discussing on Reddit, X, and forums about their software pain points.
version: 0.1.0
---

# SEO Research

Pull fresh keyword and pain-point data from Reddit, X, forums, and web sources for the field service management / trade contractor software space. Update the stored keyword strategy with new findings.

## When to Use

- Monthly keyword strategy refresh
- Before creating new landing pages or blog content
- When entering a new trade vertical
- When competitor landscape shifts
- To validate content ideas with real search intent

## Process

### Step 1: Load Current Strategy

Read the stored keyword strategy:

```
Read: C:\Users\j4cks\.claude\projects\C--OPS\memory\project_seo_keyword_strategy.md
```

This contains the baseline keyword clusters and industry priorities from March 2026.

### Step 2: Define Research Scope

If the user specifies a focus (e.g., "roofing keywords" or "ServiceTitan switching intent"), narrow the research. Otherwise, run a broad scan across all trade verticals.

**Research dimensions:**
- Pain points trade workers discuss on Reddit/forums
- Software complaints and switching triggers
- Emerging search terms and trends
- Underserved verticals with low content competition
- Competitor content gaps

### Step 3: Run Research

Use the `last30days` skill if available for Reddit/X scanning. If not, use WebSearch with these query patterns:

**Pain-point discovery:**
- `[trade] software complaints site:reddit.com`
- `"switching from" [competitor] [trade]`
- `[trade] "looking for" scheduling OR dispatch OR management app`

**Keyword intent signals:**
- `best [trade] scheduling app [year]`
- `[trade] field service management software comparison`
- `[competitor] alternative for [trade]`
- `[competitor] pricing [year]`

**Vertical discovery:**
- `[niche trade] job management software`
- `[niche trade] crew scheduling`
- `[niche trade] "no good software"`

**Forum/community signals:**
- Search r/HVAC, r/Plumbing, r/electricians, r/landscaping, r/Construction, r/smallbusiness, r/Roofing
- Look for threads about software recommendations, complaints, wishlists

### Step 4: Classify Findings

Categorize all discovered keywords/topics into:

| Tier | Intent Level | Examples | Conversion Signal |
|---|---|---|---|
| **Tier 1** | Buyer intent | "[competitor] alternative", "best [trade] app" | Ready to purchase/switch |
| **Tier 2** | Problem-aware | "contractor missed calls", "replace spreadsheet" | Knows the pain, seeking solutions |
| **Tier 3** | Vertical long-tail | "[niche trade] scheduling app" | Low competition, high specificity |

### Step 5: Assess Opportunity

For each keyword cluster, evaluate:
- **Search intent strength** — transactional > informational (AI Overviews kill informational CTR)
- **Competition level** — check if top results are from major competitors or weak content
- **Content gap** — does quality content exist for this query?
- **OPS relevance** — can OPS credibly serve this need?
- **Long-tail potential** — 36% conversion on long-tail vs 11% short-tail

Consult `references/keyword-framework.md` for the full evaluation framework.

### Step 6: Report and Update

Present findings:

```
## SEO Research Report — [Date]

### New High-Intent Keywords Discovered
| Keyword | Intent Tier | Competition | Recommended Content |
|---|---|---|---|

### Trending Pain Points
1. [Pain point] — [evidence from Reddit/X] → Content angle: [suggestion]

### Vertical Opportunities
| Vertical | Opportunity Level | Key Keywords | Content Gap |
|---|---|---|---|

### Recommended Content Calendar Additions
1. [Content piece] targeting [keyword cluster]

### Changes Since Last Research
- [New trends, shifted intent, emerging competitors]
```

Ask the user if they want to update the stored keyword strategy file.

## Key Context

- OPS targets trade workers: field crews, foremen, admins, owners
- Primary verticals: HVAC, plumbing, electrical, landscaping, roofing, cleaning, pest control
- Blue ocean verticals: pool service, fencing, concrete, glass, painting
- 94% of FSM users are SMBs under 50 employees
- Price sensitivity is extreme in this market

## Additional Resources

### Reference Files
- **`references/keyword-framework.md`** — Keyword evaluation criteria, intent classification, and content-type mapping
