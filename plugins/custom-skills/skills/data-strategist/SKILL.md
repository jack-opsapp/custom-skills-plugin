---
name: data-strategist
description: This skill should be used when the user asks to "analyze this data", "create a dashboard", "build metrics", "visualize this", "show me performance", "build analytics", "create a report", "what should we track", "make a chart", "data analysis", "digest this data", "summarize these numbers", or provides raw data (CSV, JSON, tables, query results, database exports) that needs to be turned into meaningful visualizations and insights. Analyzes data inputs, identifies trends/outliers/gaps, and produces fully opinionated visualization vision specs that downstream skills (animation-studio:data-visualization, interface-design) execute on.
metadata:
  priority: 9
  promptSignals:
    phrases:
      - "analyze"
      - "dashboard"
      - "metrics"
      - "visualize"
      - "chart"
      - "graph"
      - "analytics"
      - "report"
      - "KPI"
      - "performance"
      - "data"
      - "trends"
      - "forecast"
      - "breakdown"
      - "digest"
---

# Data Strategist

The analytical intelligence layer for data visualization. This skill does not build charts — it thinks about data, performs analysis, and produces fully opinionated vision specs that `animation-studio:data-visualization` and `interface-design` execute on.

The core principle: **analyze before you visualize.** Every chart recommendation must be justified by an analytical finding. A declining metric is WHY a danger-zone overlay exists. A bimodal distribution is WHY a violin plot beats a box plot. The analysis and the visualization spec are inseparable.

---

## Workflow (5 Phases, Strict Order)

### Phase 1 — Data Inventory & Gap Assessment

**Hard gate: do not proceed to Phase 2 until the user confirms data scope.**

1. Catalog every data dimension available: fields, types, ranges, granularity, completeness (% null).
2. Identify the domain — service-business or SaaS — from context. Load the appropriate KPI reference (`references/service-business-kpis.md` or `references/saas-kpis.md`).
3. Cross-reference available data against the KPI reference. Classify each KPI as **computable**, **partial**, or **missing**.
4. For each gap, articulate: what analysis it would unlock, how valuable that analysis is (critical/high/medium/low), whether a proxy exists, and where the data likely lives.
5. Present gaps ranked by impact. Ask what additional data is available.
6. **Conditional research trigger**: If the data has characteristics not well-covered by the reference files (novel data shapes, domain-specific conventions, or the user requests "cutting-edge" treatment), run web research on current best practices before proceeding. Search: Observable, Nightingale, Flowing Data, Storytelling with Data, Data Visualization Society. Incorporate findings into recommendations.

### Phase 2 — Analytical Deep Dive

1. Compute key findings: trends (direction, velocity, acceleration), outliers, correlations between dimensions, seasonality/cyclicality, distribution shape, segment disparities.
2. Identify the "story" — what is the single most important insight the data is telling?
3. Rank findings by actionability — a declining metric the user can influence outranks a stable one they cannot.
4. Flag anomalies that warrant investigation vs noise.
5. Identify metric relationships — what drives what? Map the causal chain.

### Phase 3 — Visualization Architecture

For each finding, recommend a specific visualization with full specification. Consult `references/visualization-taxonomy.md` for chart selection criteria. Every recommendation must include:

- **Chart type** and why this type over alternatives (cite perceptual science: Cleveland's effectiveness rankings, Tufte's data-ink ratio, Munzner's expressiveness principle)
- **Axes**: scale (linear/log), range, zero-baseline (mandatory for bars/area, optional for lines/dots), labels
- **Interpolation**: monotoneX (default smooth), linear (default honest), step (discrete states only), catmull-rom (aesthetic only). Cite reasoning.
- **Granularity**: daily/weekly/monthly tied to the data's natural rhythm and the question being asked
- **Interactivity level**: static, hover-detail, drill-down, filterable, cross-linked, 3D-explorable. Match to audience (executive = glanceable, analyst = explorable)
- **Color semantics**: every color maps to meaning, pulled from design system. Never decorative. Ensure colorblind safety (no red-green sole encoding; supplement with shape/pattern)
- **Annotations**: threshold lines, target markers, trend overlays, danger zones, anomaly callouts
- **Companion metrics**: what secondary number gives the primary context (delta, %, vs-target)
- **Accessibility**: ARIA description, reduced-motion behavior, screen reader alternative, color independence
- **Dark mode**: palette adjustments (increase saturation 10-20%, avoid pure black/white, subtle gridlines)
- **Mobile adaptation**: progressive simplification strategy

Compose individual visualizations into a layout:
- **Hero** — the most important visualization, largest, top of hierarchy
- **Supporting** — context charts that explain the hero
- **Detail** — tables, drill-down views, below the fold
- **Micro-visualizations** — sparklines, delta badges, trend arrows inline with KPI cards

### Phase 4 — Vision Presentation

1. Lead with the recommended vision — the single best way to present this data.
2. Include the analytical narrative justifying each choice.
3. Present alternatives ONLY when the trade-off is genuine (e.g., "executive summary view vs analyst workbench — depends on your audience").
4. For alternatives: clearly state gains and losses of each approach.

### Phase 5 — Structured Handoff

Output the vision spec in the format defined below. This spec is consumed directly by `animation-studio:data-visualization` for chart implementation and `interface-design` for layout/brand.

---

## Vision Spec Output Format

```markdown
# Vision Spec: [Dashboard/Visualization Name]

## Analytical Summary
[2-3 paragraph narrative: key findings, trends, anomalies, the story.
What is the single most important insight?]

## Data Gaps Noted
[Missing dimensions + impact. Or "None — data is comprehensive."]

## Layout Composition
- Information hierarchy: hero → supporting → detail
- Layout pattern: [grid / stack / sidebar+content]
- Responsive strategy: [mobile adaptation approach]
- Animation choreography: [entry sequence, stagger timing]
- Cross-chart interaction: [linked highlighting, shared filters]
- Loading states: [skeleton patterns]
- Empty states: [what to show when data is absent]

## Visualizations

### 1. [Name] — [HERO / SUPPORTING / DETAIL / MICRO]
- **Type**: [specific chart type]
- **Why**: [analytical justification — what finding does this surface?]
- **Data mapping**: X=[field] Y=[field] Color=[field] Size=[field]
- **Axes**: [scale, range, baseline, labels]
- **Interpolation**: [curve type + reasoning]
- **Granularity**: [time resolution + reasoning]
- **Interactivity**: [level + audience rationale]
- **Color semantics**: [meaning map]
- **Annotations**: [reference lines, thresholds, overlays]
- **Companion metrics**: [secondary context numbers]
- **Accessibility**: [ARIA label, reduced motion, color independence]
- **Dark mode**: [palette notes]
- **Mobile**: [simplification strategy]

### 2. [Next visualization...]
```

---

## Skill Chain

This skill produces a vision spec. It does NOT implement visualizations. The chain:

```
data-strategist (this skill) → produces vision spec
  → animation-studio:data-visualization → builds the charts per spec
  → interface-design → keeps layout and brand on point
```

---

## Decision Principles

### Chart Selection (Cleveland's Ranking, Most to Least Accurate)
1. Position on common scale → bar charts, dot plots, scatter
2. Position on non-aligned scale → small multiples
3. Length → bar charts (MUST zero-baseline)
4. Angle/Slope → line charts, slope charts
5. Area → treemaps, bubble charts (approximate only)
6. Color → heatmaps, choropleths (secondary encoding only)

**Always encode the most critical variable with position.** Reserve color for categorization, not primary quantitative comparison.

### When Simple Beats Complex
- A single number with a delta arrow beats any chart if there is one data point.
- A table beats a chart when exact values matter more than patterns.
- A bar chart beats a treemap when there are fewer than 10 categories.
- A line chart beats a stacked area when individual series trends matter.
- Small multiples beat overlaid spaghetti when there are >3 series.

### 3D Decision Gate
3D is warranted ONLY when:
- The data is inherently 3-dimensional (spatial, volumetric, molecular)
- Three continuous variables have meaningful interaction that cannot be encoded as color/size
- Geospatial data at planetary scale where projection distortion matters

3D REQUIRES interactivity (orbit, zoom, pan). Static 3D on a 2D screen is always worse than 2D alternatives. Default camera: orthographic for analysis, perspective for immersive/narrative.

### The 5-Second Rule
A well-designed chart communicates its primary message within 5 seconds. If it takes longer, the design has too much cognitive load or insufficient visual hierarchy.

---

## Reference Files

Consult these for detailed guidance:

- **`references/visualization-taxonomy.md`** — Exhaustive chart type encyclopedia with decision criteria, perceptual science, interpolation science, axis rules, color theory, animation timing, dark mode, mobile, accessibility, 3D decision framework, composite patterns, micro-visualizations, and anti-patterns
- **`references/service-business-kpis.md`** — Trades business metrics: revenue, pipeline, operations, advertising, retention, seasonal patterns, and metric relationship maps
- **`references/saas-kpis.md`** — SaaS metrics: MRR/ARR, growth, retention/churn, engagement, financial health, user demographics, and metric relationship maps
- **`references/data-quality-protocol.md`** — Data gap assessment framework: inventory, classification, cross-referencing, impact assessment, and red flags
