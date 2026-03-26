# Visualization Taxonomy

The exhaustive reference for chart selection, perceptual science, and visualization best practices. Every recommendation traces to research from Tufte, Few, Cairo, Munzner, Cleveland, or Nussbaumer Knaflic.

---

## Perceptual Science Foundation

### Cleveland & Mackinlay's Effectiveness Rankings (Most to Least Accurate)

1. **Position on common scale** — bar charts, dot plots, scatter plots
2. **Position on non-aligned scale** — small multiples
3. **Length** — bar charts (must zero-baseline)
4. **Angle/Slope** — line charts, slope charts, pie (poor)
5. **Area** — treemaps, bubble charts (approximate only)
6. **Volume** — 3D charts (very poor for comparison)
7. **Color hue/saturation/density** — heatmaps, choropleths

**Rule**: Encode the most critical variable with position. Reserve color for secondary categorization.

### Tufte's Principles
- **Data-ink ratio**: Maximize ink devoted to data. Remove every element that doesn't convey information.
- **Chartjunk**: 3D effects, gradients, unnecessary gridlines, decorative borders — eliminate.
- **Lie Factor**: Size of effect in graphic / size of effect in data. Must equal 1.0.
- **Small multiples**: "At the heart of quantitative reasoning is a single question: Compared to what?"

### Munzner's Expressiveness & Effectiveness
- **Expressiveness**: Visual encoding should express all of, and only, the information in the dataset.
- **Effectiveness**: Most important attributes encoded with the most perceptually salient channels.
- **No unjustified 3D**: Every use of 3D must be justified by data structure, not aesthetics.

### Few's Relationship Categories
- **Part-to-whole** → bars, stacked bars. Avoid pie.
- **Deviation** → horizontal/vertical bars, lines
- **Distribution** → bars, lines, box plots, violin
- **Correlation** → scatter plots
- **Comparison over time** → lines, bars

### Preattentive Attributes (~200ms processing)
Color hue, color intensity, size, orientation, shape, position, motion (strongest). Use these to direct the eye immediately to the most important element.

### The 5-Second Rule
A well-designed chart communicates its primary message within 5 seconds of viewing. Beyond that = too much cognitive load or insufficient hierarchy.

---

## Time-Series Data

### Line Chart
- **When**: Continuous metric over time. Multiple series (handles 5+ well). Trend shape matters.
- **Avoid**: Categorical data (use bars). Fewer than 3 data points.
- **Y-axis**: Need NOT start at zero. Line encodes slope, not distance from axis.
- **Max series**: 5-7 overlaid before switching to small multiples.

### Area Chart
- **When**: Cumulative volume/magnitude matters. Part-to-whole over time with 2-3 series max.
- **Avoid**: Multiple overlapping series (occlusion). Need precise value reading.
- **Y-axis**: MUST start at zero. The filled area represents magnitude.
- **Decision vs line**: If cumulative total matters, area. If trend shapes, line.

### Stacked Area
- **When**: Total value decomposition into parts over time. Composition change emphasis.
- **Avoid**: When individual series values matter (upper series have no stable baseline). Volatile data. >4-5 categories.
- **Caveats**: Line-width/sine effect distorts perception in steep sections. Ordering matters — volatile bottom series creates bumpy baseline for all others. Only the bottom series is truly readable.
- **Alternative**: Small multiples of line charts when individual trends matter more than composition.

### Bar Chart (Time-Series)
- **When**: Discrete time intervals where comparison between periods matters more than trend continuity.
- **Y-axis**: MUST start at zero. Bar length encodes magnitude.

### Sparkline
- **When**: Inline trend context in tables or beside KPI numbers. Direction and shape, not precise values.
- **Design**: No axes, no labels. 50-100px wide. "Wordlike" — embedded at the visual weight of surrounding text (Tufte).
- **Never**: Add tooltips unless explicit hover intent. The point is glanceability.

### Candlestick/Range
- **When**: Min/max/open/close or confidence intervals matter (bid ranges, price volatility).
- **Avoid**: Audiences unfamiliar with the format.

---

## Composition / Proportion

### Donut/Pie
- **When**: Parts of a whole, 2-3 segments max. One segment is ~25%, ~50%, or ~75% (easily judged angles). Casual audience.
- **Never**: >5 segments. Similar-sized slices. Comparing across multiple pies. Analytical contexts.
- **Why pies mislead**: Humans judge angle/area poorly. Bar charts encode the same data with position (most accurate channel).

### Waffle Chart
- **When**: Part-to-whole with 100-unit grid (each square = 1%). Better proportional accuracy than pie. Infographic contexts.
- **Avoid**: Many categories. Change over time.

### Treemap
- **When**: Hierarchical part-to-whole. Many categories (handles dozens). "What takes up the most space?"
- **Avoid**: Precise comparison of similar-sized rectangles. No hierarchy. >3 nesting levels (labels unreadable).
- **Use squarified layout** (Bruls et al.) for optimal aspect ratios.

### Sunburst
- **When**: Hierarchical part-to-whole with multiple depth levels. Drill-down exploration.
- **Avoid**: >3 hierarchy levels. Precise comparison (arc length harder to judge than rectangle width).

### Waterfall
- **When**: Cumulative effect of sequential positive/negative values. Financial breakdowns (revenue → costs → profit).
- **Avoid**: Non-sequential data. >15 steps.

### Sankey
- **When**: Directional flows with magnitude. User journeys, budget allocation, energy flows. Clear source-to-destination.
- **Avoid**: Non-directional relationships (use chord). Dozens of thin flows ("spaghetti"). Precision needed (use table).
- **Research**: Users complete tasks faster and more accurately with Sankey than chord diagrams.

### Chord Diagram
- **When**: Bidirectional relationships between entities. Magnitude of connections in a network.
- **Avoid**: Directional flows (Sankey is faster and more accurate). Complex networks.

---

## Comparison

### Horizontal Bar
- **When**: Ranking. Long category labels. Many categories. Sorted by value.
- **Avoid**: Time-series (left-right convention implies time).
- **Y-axis**: MUST start at zero.

### Grouped (Clustered) Bar
- **When**: Comparing subcategory values directly across groups.
- **Avoid**: >3-4 subcategories per group (unreadable).

### Stacked Bar
- **When**: Composition AND totals both matter.
- **Avoid**: Comparing specific subcategory values (middle segments have no aligned baseline). Negative values.

### Diverging Bar
- **When**: Values above and below a meaningful center point. Likert scale data. Sentiment.
- **Avoid**: No natural center/midpoint exists.

### Bullet Chart (Stephen Few's Invention)
- **When**: KPI vs target with qualitative performance ranges. Dashboard metrics. Replaces gauges.
- **Design**: Horizontal bar showing actual value against target marker and qualitative ranges (poor/satisfactory/good).
- **Best compact benchmark visualization available.** Prefer over gauges in all cases.

### Radar/Spider
- **When**: Multivariate comparison of a single entity against benchmark. 5-8 axes. 2-3 overlapping polygons max.
- **Avoid**: >3 overlapping polygons. >8 axes. Axes not normalized to same scale.

### Slope Chart
- **When**: Comparing two (or few) time points. Direction and magnitude of change. Rank changes.
- **Avoid**: Many intersecting lines. >15 categories.

### Bump Chart
- **When**: Rank changes over multiple time periods. Competitive positioning.
- **Avoid**: Actual values matter (bump shows only rank). Many tied ranks.

### Dumbbell Chart
- **When**: Gap between two values per category (before/after, target vs actual, plan vs spend). The line length IS the gap.
- **Avoid**: >2 comparison points per category.

### Lollipop Chart
- **When**: Same as bar chart but many categories — reduces visual weight/moire effect.
- **Note**: Encodes via position (most accurate channel) rather than length. Y-axis need NOT start at zero.

### Cleveland Dot Plot
- **When**: Comparing one or two values across many categories with precision.
- **Same advantage as lollipop**: Position encoding > length encoding.

---

## Distribution

### Histogram
- **When**: Single distribution shape. Binned frequency counts.
- **Caveat**: Bin width choice significantly affects perceived shape. Test 2-3 widths.

### Density Plot
- **When**: Smooth distribution shape. Overlaying 2-3 distributions.
- **Caveat**: Bandwidth choice misleads. Implies continuity (inappropriate for discrete data).

### Violin Plot
- **When**: Comparing distributions across groups. Full shape + summary stats. Reveals bimodality that box plots hide.
- **Avoid**: Unfamiliar audiences. Single distribution (use histogram/density).

### Box Plot
- **When**: Comparing many distributions compactly. Median, quartiles, outliers at a glance.
- **Critical insight**: Two very different distributions can produce identical box plots. When distribution shape matters, use violin or density.

### Strip/Jitter Plot
- **When**: Small datasets (n < ~200). Show every individual data point. Reveal gaps and clusters.
- **Avoid**: Large datasets (overplotting).

### Ridgeline Plot
- **When**: Comparing distributions across 6+ groups. Temporal distribution shifts. Clear patterns/ranking.
- **Avoid**: <6 groups (use overlapping density or violin). No clear pattern.

### Raincloud Plot (Composite)
- **What**: Kernel density ("cloud") + box plot (summary) + jitter plot ("rain" — individual points).
- **When**: Need full distribution picture for 2-5 groups.

---

## Correlation & Relationship

### Scatter Plot
- **When**: Relationship/correlation between two numeric variables. Outliers and clusters.
- **Avoid**: One variable is categorical. Huge datasets causing overplotting (use hexbin/density).

### Bubble Chart
- **When**: Three numeric variables: x-position, y-position, size.
- **Avoid**: Precise size comparison needed (area perception is poor). >30-50 bubbles.

### Connected Scatter
- **When**: Two numeric variables tracked over time. Cyclic relationships (spirals/loops).
- **Caveat**: Viewers prone to misinterpreting time direction — encode with arrows or annotations.

### Heatmap
- **When**: Dense matrix data (time × category, feature × sample). Pattern detection across two categorical dimensions.
- **Design**: Sequential palette for magnitude. Diverging for values with meaningful midpoint. Keep <30×30 static; interactive zoom beyond that.
- **Annotate cells with values sparingly** — if every cell needs a number, consider a table.

### Correlation Matrix
- **When**: Identifying relationships among many numeric variables. Feature selection.
- **Design**: Diverging palette (-1 to +1). Only upper or lower triangle (symmetric).
- **Avoid**: <5 variables (just use scatter plots). Causation claims.

---

## Funnel & Flow

### Funnel Chart
- **When**: Linear sequential process with progressive reduction (sales pipeline, conversion).
- **Avoid**: Non-linear flows (use Sankey). Stages that don't reduce.

### Gauge
- **When**: Single hero metric needing high visual impact. Red/yellow/green status.
- **Avoid**: Multiple KPIs (wastes space). Need trend context. **Prefer bullet chart in almost all cases.**

---

## Small Multiples / Faceted Charts

**Tufte's endorsement**: "For a wide range of problems in data presentation, small multiples are the best design solution."

**When**: >3-4 overlapping series. Individual trend shapes matter. Untangling spaghetti.
**Design rules**:
1. Same scales across all panels. Non-negotiable.
2. Sort meaningfully: by value, time, geography, or alphabetically. Never random.
3. Minimize per-panel chrome: shared axes, labels on outer edges only.
4. Highlight strategy: gray reference line (mean/overall trend) behind each panel's colored data.
5. 3-4 columns landscape, 2 columns portrait/mobile.
6. Minimum ~150-200px width per panel.

---

## Micro-Visualizations

When a KPI card needs more than a number but less than a chart.

| Type | Best For | Size | Notes |
|------|----------|------|-------|
| Sparkline | Trend in table rows | 50-100px wide | No axes, no labels. Show last value as text beside it. |
| Inline bar | Relative magnitude in columns | Full cell width | Color encodes category or performance. |
| Trend arrow | Direction of change | 16-20px | Up/down/flat + percentage. Green/red/gray. |
| Status dot | Categorical state | 8-12px | Green/yellow/red/gray. |
| Progress ring | Completion % | 24-32px diameter | Circular. Shows % at a glance. |
| Delta badge | Change from period | ~60px pill | "+12%" green or "-3%" red. |
| Bullet micro | Value vs target | ~80px wide | Horizontal bar + reference line. |
| Heat cell | Intensity in matrix | Cell background | Color intensity proportional to value. |
| Win/loss strip | Binary outcome sequence | Row of tiny squares | Green=win, red=loss. |

**Rule**: Max one micro-viz column per 3-4 text columns in a table. More = visual noise.

---

## Composite Visualizations

### Bar + Line Overlay (Combo)
- Bar = absolute values, Line = rate/ratio. Requires dual y-axes.
- **Dual-axis warning**: Scale manipulation can mislead. Always zero-baseline the bar axis. Consider separate stacked charts instead.

### Scatter + Marginal Distributions
- Scatter in center + histogram/density along each axis.
- Reveals clustering, outliers, and distribution shape simultaneously.

### Chart + Table Hybrid
- Chart top 40%, table bottom 60%. Linked: clicking chart filters table.
- The most effective drill-down pattern.

### Sparkline-Enhanced Table
- Table with micro-chart columns. Precision of table + pattern recognition of chart.

---

## Interpolation Science

| Curve | Behavior | When | Danger |
|-------|----------|------|--------|
| **Linear** | Straight point-to-point | Default. Honest — zero assumptions between points. | Jagged with noisy data. |
| **MonotoneX** | Cubic spline preserving monotonicity. No spurious oscillation. | **Recommended default for smooth curves.** | Data must be sorted by x. |
| **Step** | Horizontal then vertical | Discrete state changes: pricing tiers, status, digital signals. | Implies constancy between points. |
| **Catmull-Rom** | Passes through all points, configurable tension | Aesthetic/decorative contexts only. | Overshoots — creates false peaks/valleys. |
| **Basis** | Cubic spline. Does NOT pass through interior points. | Smooth approximation only. | Misleading — line doesn't intersect data points. |
| **Cardinal** | Passes through points with adjustable tension | Control over smoothness vs fidelity. | Low tension = overshoot. |
| **Natural** | Natural cubic spline (2nd derivative = 0 at endpoints) | Mathematical/scientific contexts. | Can overshoot. |

**Rules**:
1. Default to linear unless there's a reason not to.
2. MonotoneX when smooth curves are desired without false peaks.
3. Step ONLY for genuinely discrete/constant data.
4. Never basis for analytical charts.
5. Always show data point markers alongside curves.

---

## Axis & Scale Decisions

### Zero-Baseline Rules

| Chart Type | Must Start at Zero? | Why |
|------------|-------------------|-----|
| Bar chart | **YES, always** | Bar length encodes magnitude. Truncation breaks this. |
| Area chart | **YES** | Filled area represents magnitude. |
| Line chart | **No, but caution** | Encodes change via slope. Starting at zero can flatten meaningful variation. |
| Dot plot | **No** | Position encoding, not length. |
| Scatter | **No** | Relationship matters, not distance from zero. |

**Research**: Even when viewers are told the axis is truncated, they still overestimate differences.

### Log vs Linear

| Log Scale When | Linear Scale When |
|---|---|
| Data spans multiple orders of magnitude (10 to 100,000) | Within ~1 order of magnitude |
| Proportional/percentage change matters | Absolute differences matter |
| Exponential growth/decay | Linear/additive patterns |
| **Cannot plot zero or negative values** | Any data type |

### Dual Y-Axis: Mostly Harmful
- Different baselines and maximums can produce ANY visual relationship.
- Crossing lines are meaningless (intersection depends on arbitrary scale).
- **Alternatives**: Two stacked charts with aligned x-axes. Normalize to common unit (%, z-scores, index to 100). Scatter plot of one variable against the other.
- **Only acceptable case**: Both axes share same unit, differ only in scale (Celsius/Fahrenheit).

### Aspect Ratio: Banking to 45 Degrees
Cleveland's research: set aspect ratio so average absolute slope ≈ 45°. Maximizes viewer's ability to discriminate slope differences.

---

## Color

### Palette Types

| Type | When | Examples |
|---|---|---|
| Sequential | One-direction data (low→high). Counts, %, continuous. | Blues, YlOrRd. Light-to-dark. |
| Diverging | Meaningful midpoint (zero, average, target). | RdBu, BrBG, PuOr. Two hues + neutral center. |
| Categorical | Unordered categories. | Set1, Dark2, Paired. Distinct hues. |

### Color Semantics (Default)

| Semantic | Role | Default |
|----------|------|---------|
| Primary metric | The number that matters most | Brand primary accent |
| Positive/success | Above target, profit, growth | Green-500 (#22C55E) |
| Warning | Approaching threshold | Amber-500 (#F59E0B) |
| Danger/negative | Below target, loss, decline | Red-500 (#EF4444) |
| Neutral/secondary | Supporting data, axes, gridlines | 30% opacity white (dark) / 30% opacity black (light) |
| Comparison target | Expected/planned value | Dashed stroke, 50% opacity of primary |

### Colorblind Safety (~8% of males)
- All ColorBrewer sequential palettes are safe.
- Safe diverging: BrBG, PiYG, PRGn, PuOr, RdBu, RdYlBu. **Avoid**: RdGy, RdYlGn, Spectral.
- **Never rely on red-green distinction alone.** Use blue-orange or blue-red.
- **Always supplement color with shape, pattern, or direct labels** as redundant encoding.
- Hard limit: **6-8 distinct colors** for categorical encoding. Beyond that: direct labeling, small multiples, or interactive filtering.

---

## Dark Mode

Dark mode is NOT color inversion. Luminance relationships reverse; naive inversion breaks readability.

### Background
- Never pure black (#000000) — causes eye strain. Use #1A1A2E to #1E1E2E (dark blue-gray).

### Text
- Never pure white (#FFFFFF) — causes halation. Use #E0E0E0 to #F0F0F0 primary, #A0A0A0 to #B0B0B0 secondary.

### Chart Colors
- Increase saturation 10-20% vs light mode to maintain visual weight.
- Lower lightness of very bright colors to avoid glare.
- Avoid pastels — they disappear on dark backgrounds.

### Gridlines & Axes
- Gridlines: #2A2A3E to #333355 (barely visible).
- Axis lines: #444466 (slightly brighter than grid).

### Glow Effects
- Subtle glow on key data points adds depth: `filter: drop-shadow(0 0 6px rgba(color, 0.6))`.
- Use sparingly. Glow on everything = glow on nothing.

---

## Mobile Adaptation

### Progressive Simplification (Remove in Order)
1. Legend (replace with direct labels/tooltips)
2. Axis titles (if chart title is clear)
3. Gridlines
4. Secondary annotations
5. Zoom controls
6. Data density (aggregate: daily → weekly → monthly)
7. Collapse to sparkline/micro-chart

### Chart Adaptations
- Bar: max 5-7 bars. Switch vertical → horizontal for long labels.
- Line: max 2-3 series. Small multiples for more.
- Table: convert rows to stacked cards or horizontal bars.
- Heatmap: aggregate to fewer cells + interactive zoom.
- **No dual-axis on mobile.**
- Touch targets: minimum 44px hit area.

### Three-Level Mobile Strategy
1. **KPI Cards** (default) — 3-5 headline numbers + trend indicators. Most users stop here.
2. **Supporting Chart** (tap to reveal) — slides up when tapping a KPI card.
3. **Data Table** (tap chart) — drill-down detail.

---

## Animation Timing

| Animation | Duration | Easing |
|-----------|----------|--------|
| Chart entry (first paint) | 600-800ms total, staggered | `cubic-bezier(0.16, 1, 0.3, 1)` per element |
| Data value update | 400-600ms | `cubic-bezier(0.33, 1, 0.68, 1)` |
| Hover tooltip appear | 150ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Hover tooltip dismiss | 100ms | `cubic-bezier(0.4, 0, 1, 1)` |
| Metric count-up | 800-1200ms | cubicOut or spring |
| Ring fill | 800-1000ms | Spring (stiffness: 60, damping: 15) |
| Sparkline draw | 600-800ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Dashboard card stagger | 50-80ms between cards | Each card: 400ms entry |
| Data transitions | 300-700ms | Ease-in-out |

### Animation Principles
- **Stage transitions**: Break complex changes into sequential steps (reposition → rescale → recolor).
- **Every frame must be a readable chart** — no abstract morphs.
- **Reduced motion**: Render at final state immediately. 200ms opacity fade. No stagger, no spring. Never remove the visualization itself.

---

## 3D Decision Framework

### When 3D Is Warranted
1. **Inherently 3D spatial structure** — terrain, architecture, molecular
2. **Three continuous variables with meaningful interaction** — volatility surfaces, response surfaces
3. **Topological/network relationships** — dense graphs where 2D produces hairballs
4. **Volumetric data** — CT/MRI, fluid dynamics
5. **Planetary-scale geospatial** — globe preserves geographic truth

### When 3D Is NOT Warranted
- Comparing categorical values
- Precise value reading needed
- Third dimension is decorative
- Visualization will be static/printed
- Quick comparison between elements needed

### 3D Requirements
- **Must be interactive** — orbit, zoom, pan. Static 3D on 2D screen is always worse than 2D.
- **Camera**: Orthographic for analytical comparison. Perspective for immersive/narrative.
- **Depth anchors**: Always provide at least two axis grid planes.
- **Linked 2D views**: Pair 3D exploration with 2D detail views for precise reading.
- **Accessibility fallback**: Data table + 2D projection alternatives.
- **Performance**: <1K elements = SVG. 1K-100K = Canvas/WebGL. >100K = WebGL with instancing.

### 3D Anti-Patterns
- 3D pie charts (front slices appear larger)
- Gratuitous perspective on bar charts
- Occlusion without mitigation (transparency, filtering, cross-sections)
- Static 3D on 2D medium
- High-speed rotation
- No depth anchors (floating in space)

---

## Geospatial

### When Maps Help
- Geographic position IS the insight (hotspots, clusters, routes)
- Spatial patterns matter (proximity, density, flow)

### When Maps Mislead
- Large areas with small populations dominate (Alaska effect)
- Raw totals without normalization
- The story is about non-geographic comparison (use bar chart)

### Map Types

| Type | Use | Key Rule |
|------|-----|----------|
| Choropleth | Value by region | MUST normalize (per capita). 4-6 bins. Sequential palette. |
| Cartogram | Distort geography by variable | Eliminates "big land, small population" bias. |
| Hex bins | Even-area aggregation | Regular hexagons eliminate irregular boundary bias. |
| Dot density | Individual occurrences | One dot = N records. Preserves distribution sense. |
| Flow map | Movement between locations | Arc width = magnitude. |
| Point cluster | Many overlapping points | Cluster at zoom levels, expand on zoom-in. |
| Heatmap (geo) | Continuous density surface | Kernel density estimation. |

### Binning Methods Change the Story
Natural breaks, quantiles, equal interval, and manual breaks all produce different maps from the same data. Always consider 2-3 methods and choose the one that best represents the data's true distribution.

---

## Table vs Chart

### Table Wins When
- Exact values needed
- Many variables per record
- Lookup task ("what was Q3 revenue?")
- Heterogeneous data types
- User will sort/filter/search
- Regulatory/audit context

### Chart Wins When
- Trend over time
- Distribution shape
- Category comparison
- Part-to-whole
- Correlation
- Executive/non-technical audience

### The Hybrid
Chart at top for pattern recognition + table below for drill-down. Chart acts as visual filter — clicking filters the table. The most effective dashboard pattern.

---

## Accessibility (Non-Negotiable)

### Chartability POUR-CAF Framework (50 Heuristics)
- **Perceivable**: Contrast ratios (4.5:1 text, 3:1 graphical objects), color independence
- **Operable**: Keyboard navigation (Tab to enter, arrows to navigate, Enter to select, Escape to exit)
- **Understandable**: Clear labels, consistent behavior
- **Robust**: Works across assistive technologies
- **Compromising**: Degrades gracefully (progressive enhancement)
- **Assistive**: Sonification, guided navigation, smart summaries
- **Flexible**: Adjustable scales, alternative views, data export

### Every Visualization Must Have
1. Container with `role="img"` and `aria-label` (chart type + data summary + key insight)
2. Hidden `<table>` with raw data for screen readers
3. Keyboard-focusable interactive elements with `aria-live` announcements
4. Color independence — never color as sole differentiator (add patterns, shapes, direct labels)
5. Reduced-motion alternative — data still visualized, only animation removed
6. Minimum 3:1 contrast between adjacent chart elements

### WCAG Requirements
- Text contrast: 4.5:1 (AA)
- Large text: 3:1 (AA)
- UI components: 3:1
- Non-text/graphical objects: 3:1 (1.4.11)
- Color not sole conveyor (1.4.1)
- All functionality keyboard-accessible (2.1.1)
- Visible focus indicator (2.4.7)

---

## Anti-Patterns

### Never Do
- Pie charts with >5 slices
- 3D pie charts (perspective distorts slice size)
- Dual y-axis without extreme care (scale manipulation misleads)
- Truncated bar chart y-axis (exaggerates differences)
- Stacked area with >4-5 categories (only bottom series readable)
- Color-only encoding without redundant channel
- Basis interpolation for analytical charts (line doesn't intersect data)
- Continuous/looping animations
- Gratuitous 3D on categorical data
- Rainbow color scales for sequential data
- Legend when direct labels would work
- Chartjunk: gradients, shadows, 3D effects, decorative borders

### Signs a Visualization Is Wrong
- Takes >5 seconds to understand the main message
- Requires reading a legend to decode every element
- Colors are decorative rather than semantic
- Chart type doesn't match the data relationship being shown
- User needs to mentally compute comparisons the chart should show directly
