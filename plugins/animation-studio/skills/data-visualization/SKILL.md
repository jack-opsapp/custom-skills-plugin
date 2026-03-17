---
name: data-visualization
description: Animated data visualization — charts, metrics displays, network graphs, dashboard compositions. Visuals over numbers, always.
metadata:
  priority: 6
  pathPatterns:
    - "**/charts/**"
    - "**/visualization/**"
    - "**/dashboard/**"
    - "**/metrics/**"
  importPatterns:
    - "d3"
    - "recharts"
    - "visx"
    - "nivo"
  promptSignals:
    phrases:
      - "chart"
      - "graph"
      - "visualization"
      - "metric"
      - "dashboard"
      - "sparkline"
      - "gauge"
      - "data viz"
---

# Data Visualization

The visualization skill for the `animation-studio` plugin. This skill governs every data display — from a single metric counter to a full dashboard of interconnected charts. The core rule is absolute: **visuals over numbers, always.** Every number in a UI is a candidate for visualization. A raw "47%" is a missed opportunity. A radial ring filling to 47% with a spring-eased count-up is communication.

---

## Philosophy

- **Every number is a candidate for visualization.** Before rendering a number as text, ask: can this be a bar, a ring, a sparkline, a gauge, a fill, a position on an axis? If yes, visualize it. Raw numbers are for spreadsheets. Interfaces are for understanding at a glance.

- **Communicate meaning, not just data.** A bar chart that shows five bars of different heights communicates data. A bar chart where the target bar pulses subtly, where the over-budget bar shifts to a warning color with a smooth transition, where hovering reveals the exact delta with a directional arrow — that communicates meaning. Data tells you what happened. Visualization tells you what it means.

- **Animated transitions are mandatory.** Data never "appears" — it arrives. Charts animate on entry (staggered bars rising, lines drawing, rings filling). Data updates morph smoothly from old values to new (bars grow or shrink, lines interpolate to new paths, counters tick up or down). Abrupt data changes are disorienting. Animated transitions preserve the user's mental model of what changed.

- **Color encodes meaning, not decoration.** Every color choice in a visualization must map to a semantic value: status (success/warning/danger), category (revenue/expense/profit), comparison (actual vs target), or emphasis (primary metric vs supporting). Never use color for visual variety alone. If two bars are different colors, those colors must mean something the user can decode without a legend.

- **Accessibility is non-negotiable.** Every visualization must work for users who cannot perceive color differences (use pattern/texture alternatives, ensure 4.5:1 contrast ratios on labels), users who cannot see (provide screen-reader-accessible data tables as hidden alternatives), and users who experience motion sickness (provide reduced-motion alternatives that still communicate the data — instant fills instead of animated ones, not removed charts). ARIA roles (`img`, `figure`), `aria-label` with data summaries, and keyboard-navigable interactive elements are baseline requirements.

---

## Domains

This skill covers four distinct domains. Each has a dedicated reference document with patterns, principles, and complete implementation guidance.

### 1. Charts & Graphs
Bar, line, area, radar, pie/donut. Every chart type animated on entry with staggered reveals. Every chart interactive with hover details and tap-to-drill. Smooth data transitions when values update — bars morph, lines interpolate, segments rotate. Custom SVG/Canvas implementations when chart libraries cannot match the required animation quality.

**Reference:** `references/charts-graphs.md`

### 2. Animated Metrics
Count-up numbers with easing and locale-aware formatting. Radial progress rings built on SVG with spring physics. Trend indicators with directional motion. Sparklines that draw on intersection. Comparison visuals — before/after, target vs actual with animated deltas. Every metric tells a micro-story through motion.

**Reference:** `references/animated-metrics.md`

### 3. Network Visualizations
Force-directed graphs with physics simulation (attraction, repulsion, centering forces). Relationship maps. Org charts with animated connection lines. Flow diagrams where data particles move along paths. Interactive: drag nodes, zoom/pan, hover to expand connections. Canvas-based for performance with hundreds of nodes.

**Reference:** `references/network-visualizations.md`

### 4. Dashboard Compositions
How multiple visualizations animate together as a unified surface. Staggered card entry sequences. Shared data highlighting (hover one chart, related data highlights in another). Responsive reflow animations when the grid rearranges. Loading state patterns for async data. Orchestration patterns that make a dashboard feel like a single living system, not a collection of independent widgets.

**Reference:** `references/dashboard-compositions.md`

---

## Examples

Five production-ready components demonstrating the core patterns:

| Example | File | Domain | Key Techniques |
|---------|------|--------|----------------|
| Animated Bar Chart | `examples/animated-bar-chart.tsx` | Charts & Graphs | SVG bars, staggered spring entry, hover tooltips, animated data updates |
| Radial Progress | `examples/radial-progress.tsx` | Animated Metrics | SVG ring, spring-eased fill, count-up center number |
| Live Metric Card | `examples/live-metric-card.tsx` | Animated Metrics | Count-up value, Canvas sparkline, trend delta, Intersection Observer |
| Network Graph | `examples/network-graph.tsx` | Network Viz | Canvas force-directed, drag/zoom/pan, hover highlight, physics sim |
| Comparison Gauge | `examples/comparison-gauge.tsx` | Animated Metrics | SVG target vs actual, animated fill, labeled ranges |

---

## Standards

### SVG vs Canvas Decision

| Scenario | Use SVG | Use Canvas |
|----------|---------|------------|
| < 100 animated elements | Yes | — |
| 100-500 elements | Depends on interaction complexity | Yes |
| 500+ elements | — | Yes |
| Need DOM event handling per element (hover, click) | Yes | — |
| Need crisp rendering at all DPIs without effort | Yes | — |
| Need pixel-level control or custom rendering | — | Yes |
| Network graphs, particle systems, heatmaps | — | Yes |
| Bar charts, line charts, pie charts, gauges | Yes | — |

### Animation Timing

| Animation Type | Duration | Easing |
|----------------|----------|--------|
| Chart entry (first paint) | 600-800ms total, staggered | `cubic-bezier(0.16, 1, 0.3, 1)` per element |
| Data value update | 400-600ms | `cubic-bezier(0.33, 1, 0.68, 1)` |
| Hover tooltip appear | 150ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Hover tooltip dismiss | 100ms | `cubic-bezier(0.4, 0, 1, 1)` |
| Metric count-up | 800-1200ms | `cubicOut` or spring |
| Ring fill | 800-1000ms | Spring (stiffness: 60, damping: 15) |
| Sparkline draw | 600-800ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Dashboard card stagger | 50-80ms between cards | Each card: 400ms entry |

### Color Semantics

Never invent visualization colors. Pull from the project's design system. When no design system exists, use these semantic defaults:

| Semantic | Role | Default |
|----------|------|---------|
| Primary metric | The number that matters most | Brand primary accent |
| Positive / success | Above target, profit, growth | `#22C55E` (green-500) |
| Warning | Approaching threshold | `#F59E0B` (amber-500) |
| Danger / negative | Below target, loss, decline | `#EF4444` (red-500) |
| Neutral / secondary | Supporting data, axes, gridlines | `rgba(255,255,255,0.3)` on dark / `rgba(0,0,0,0.3)` on light |
| Comparison target | Expected/planned value | Dashed stroke, 50% opacity of primary |

### Reduced Motion

Every animated visualization must provide a reduced-motion alternative:

- **Charts:** Render at final state immediately. No stagger, no spring. Fade in with 200ms opacity transition.
- **Count-up numbers:** Show final value immediately. No counting animation.
- **Sparklines:** Render complete path immediately. No draw animation.
- **Network graphs:** Render at equilibrium positions (pre-computed or instant simulation). No physics animation.
- **Dashboard stagger:** All cards appear simultaneously with a single 200ms fade.

The reduced-motion alternative must still communicate the same data. Only the motion is removed — never the visualization itself.

### Interaction Patterns

| Interaction | Desktop | Mobile |
|-------------|---------|--------|
| Detail on demand | Hover tooltip | Tap to show, tap elsewhere to dismiss |
| Drill down | Click | Tap |
| Compare | Hover to highlight related | Long press to pin, tap another to compare |
| Pan | Click + drag | Touch drag |
| Zoom | Scroll wheel / pinch | Pinch |
| Select range | Click + drag on axis | Touch drag on axis |

### Screen Reader Support

Every visualization must include:

1. A container with `role="img"` and `aria-label` describing the visualization type and data summary (e.g., "Bar chart showing monthly revenue. January: $45K, February: $52K, March: $48K").
2. A visually hidden `<table>` with the raw data for screen readers to navigate.
3. Interactive elements (tooltips, drill-down targets) must be keyboard-focusable and announce their content via `aria-live` regions.
