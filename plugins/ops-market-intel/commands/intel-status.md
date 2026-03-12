---
name: intel-status
description: Show current market intelligence status — freshness of data, key findings summary, and recommended next actions
allowed-tools:
  - Read
  - Grep
---

# Intel Status Command

Display a quick summary of the current competitive intelligence and SEO research state for OPS.

## Instructions

1. Read both intelligence files:
   - `C:\Users\j4cks\.claude\projects\C--OPS\memory\project_seo_keyword_strategy.md`
   - `C:\Users\j4cks\.claude\projects\C--OPS\memory\project_competitor_intelligence.md`

2. Extract and display:

```
## OPS Market Intel Status

### Data Freshness
- Competitor Intelligence: [last updated date from file]
- SEO Keyword Strategy: [last updated date from file]
- Status: [FRESH (< 30 days) | AGING (30-60 days) | STALE (> 60 days)]

### Key Numbers
- Competitors tracked: [count]
- Keyword clusters: [count]
- Trade verticals mapped: [count]
- Universal weaknesses identified: [count]

### Top 3 Opportunities Right Now
1. [Highest-priority keyword/content opportunity]
2. [Second priority]
3. [Third priority]

### Top 3 Competitor Weaknesses to Exploit
1. [Most exploitable weakness]
2. [Second]
3. [Third]

### Recommended Next Actions
- [ ] [Action based on data freshness and gaps]
- [ ] [Another recommended action]
```

3. If data is STALE (> 60 days), recommend running `/competitor-scan` and `/seo-research` to refresh.

4. Keep the output concise — this is a dashboard view, not a full report.
