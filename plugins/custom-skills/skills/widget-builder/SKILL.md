---
name: widget-builder
description: Build and audit OPS dashboard widgets following the HUD-to-Console design system. Enforces size tiers, zone anatomy, color tokens, typography, and the 10-point quality checklist. Use when creating, modifying, or auditing any dashboard widget.
metadata:
  priority: 12
  pathPatterns:
    - "src/components/dashboard/widgets/**"
    - "**/*-widget.tsx"
    - "src/components/dashboard/widget-shell.tsx"
    - "src/components/dashboard/widget-grid.tsx"
  promptSignals:
    phrases:
      - "widget"
      - "dashboard widget"
      - "create widget"
      - "build widget"
      - "audit widget"
      - "fix widget"
      - "widget design"
      - "widget size"
      - "widget anatomy"
---

# OPS Widget Builder

Build and audit dashboard widgets following the **HUD-to-Console** design system. This skill is the single source of truth for widget conventions.

**Spec:** `docs/superpowers/specs/2026-03-30-widget-design-system.md`

## Reference Files

Load these when needed:

| File | When to Load |
|------|-------------|
| `references/widget-reference.md` | Creating or auditing a specific widget — has per-widget specs (purpose, data, content per tier, actions) |
| `references/dashboard-strategy.md` | Planning dashboard layouts, choosing defaults, making design decisions |
| `references/setup-personalization.md` | Working on default widget selection, setup flow, or onboarding personalization |

**Data model reference:** `ops-software-bible/03_DATA_ARCHITECTURE.md` (do not duplicate — read directly when needed)

## Required Companion Skills

Load these BEFORE writing any widget code:

| Skill | When |
|-------|------|
| `interface-design` | Always — surface, spacing, border rules |
| `animation-studio:animation-architect` | When the widget includes transitions or motion |
| `animation-studio:data-visualization` | When the widget includes charts, gauges, sparklines, or metric displays |
| `ops-copywriter` | When writing user-facing labels, empty states, or error messages |

---

## 1. Size Tiers

The dashboard uses a CSS grid: `grid-cols-2 md:grid-cols-4 xl:grid-cols-8 2xl:grid-cols-12` with `gridAutoRows: 140px`.

| Tier | Cols (2xl) | Row Span | Pixel Height | Content Contract |
|------|-----------|----------|-------------|------------------|
| **XS** | 1 | 1 | 140px | Hero number on top, title + subtitle below. Nothing else. |
| **SM** | 2 | 1 | 140px | Hero on top + supporting context (sparkline, secondary stat). 2-second glance max. |
| **MD** | 6 | 2 | 288px | Metric + visualization (chart, list, funnel). Up to 5 list items. |
| **LG** | 6 | 4 | 584px | Full operational detail. Lists with inline actions. Filters. |
| **XL** | 6 | 6 | 880px | Console panel. Data tables, full interactivity, bulk actions. |

**Rule:** Content is CUT at smaller tiers, never squeezed. If it doesn't fit, it doesn't render.

---

## 2. Widget Anatomy (Zone System)

### XS/SM: Hero-First Layout

At compact sizes (XS/SM), the hero number leads — it's the first thing the eye hits. Title and context sit below.

```
┌─────────────────────────────────┐
│ HERO NUMBER              [↗]   │  Hero on top. ArrowUpRight icon at SM only.
│ TITLE                          │  Kosugi, micro, uppercase, below hero.
│ supporting text / visual       │  SM only. Sparkline, trend, top category.
└─────────────────────────────────┘
```

**XS specifics:**
- `Card` with default `p-2`, inner `div` with `pt-3` (anchors hero at fixed Y position)
- Hero uses `text-display` (28px) for values ≤ 4 chars, `text-data-lg` (20px) for longer values
- No footer, no navigation icon, no detail zone

**SM specifics:**
- `Card p-0`, inner `div p-3` (uniform 12px, no double-padding)
- Hero uses `text-data-lg` (20px)
- Tiny `ArrowUpRight` icon button (w-2.5 h-2.5, p-0.5, hover:bg only) in hero row
- Supporting visual allowed (sparkline, trend chevron, single stat) — but NO lists, charts, or ring gauges
- No text footer links — the icon button replaces them

### MD+: Standard Zone System

At MD and above, the standard zone system applies:

```
┌─────────────────────────────────┐
│ HEADER                          │  Kosugi, micro (11px), uppercase, tracking-wider, text-tertiary.
├─────────────────────────────────┤
│ HERO ZONE                       │  The single most important metric.
├─────────────────────────────────┤
│ DETAIL ZONE                     │  MD+ only. Chart, list, funnel.
│                                 │  overflow-y-auto scrollbar-hide.
├─────────────────────────────────┤
│ ACTION ZONE                     │  LG+ only. Inline actions, filters.
├─────────────────────────────────┤
│ FOOTER                          │  Link to detail page.
│                                 │  Kosugi, micro (11px), uppercase, text-tertiary.
└─────────────────────────────────┘
```

**MD specifics:**
- `Card p-0`, inner `div p-3` (uniform 12px)
- Header at top (kosugi uppercase), hero below, detail zone fills remaining space
- Footer text link at bottom

| Tier | Hero First? | Header | Hero | Detail | Action | Footer/Icon |
|------|------------|--------|------|--------|--------|-------------|
| XS   | yes        | below  | yes  | —      | —      | —           |
| SM   | yes        | below  | yes  | —      | —      | icon        |
| MD   | no         | above  | yes  | yes    | —      | text        |
| LG   | no         | above  | yes  | yes    | yes    | text        |
| XL   | no         | above  | yes  | yes    | yes    | text        |

Use helpers from `@/lib/widget-tokens`:
```typescript
import { isCompact, showDetail, showActions, showFooter } from "@/lib/widget-tokens";
```

### Padding Rules

**WidgetShell provides the frosted glass backdrop.** Card adds its own background/border on top. To avoid double-padding:

| Tier | Card | Inner div | Total padding |
|------|------|-----------|---------------|
| XS   | default `p-2` | `pt-3` only | 8px sides, 20px top |
| SM   | `p-0` | `p-3` | 12px uniform |
| MD+  | `p-0` | `p-3` | 12px uniform |

---

## 3. Color Tokens

**ZERO hardcoded hex values.** Every color must come from design tokens.

### In className (preferred):
Use Tailwind classes: `text-status-warning`, `bg-financial-revenue`, `text-ops-accent`, etc.

### In inline styles (charts, SVGs):
Import from `@/lib/widget-tokens`:
```typescript
import { WT } from "@/lib/widget-tokens";

// Usage:
style={{ backgroundColor: WT.revenue }}
style={{ color: WT.success }}
style={{ fill: WT.accent }}
```

### Available tokens:

| Token | Use Case |
|-------|----------|
| `WT.revenue` | Revenue / income |
| `WT.profit` | Profit / margin |
| `WT.cost` | Cost / expense |
| `WT.receivables` | Receivables / aging |
| `WT.overdue` | Overdue / past-due |
| `WT.success` | Healthy / positive |
| `WT.warning` | Warning / attention |
| `WT.error` | Error / critical |
| `WT.accent` | Accent (sparingly) |
| `WT.accentMuted` | Accent at 40% opacity |
| `WT.accentSubtle` | Accent at 15% opacity |
| `WT.muted` | Neutral (15% white) |
| `WT.faint` | Very subtle (8% white) |

---

## 4. Typography

| Element | Font | Size | Additional |
|---------|------|------|------------|
| Widget title | `font-kosugi` | `text-micro` (11px) | `uppercase tracking-wider text-text-tertiary` |
| Hero number (XS) | `font-mono` | `text-display` (28px, ≤4 chars) or `text-data-lg` (20px, >4 chars) | `font-bold`, anchored at `pt-3` |
| Hero number (SM) | `font-mono` | `text-data-lg` (20px) | `font-bold` |
| Hero number (MD+) | `font-mono` | `text-display` (28px) | `font-bold` |
| Hero label | `font-mohave` | `text-caption-sm` | `text-text-secondary` |
| Trend indicator | Lucide chevron | `w-3 h-3` (XS/SM), `w-4 h-4` (MD+) | `ChevronUp`/`ChevronDown`/`ChevronRight` — NEVER unicode arrows |
| List item title | `font-mohave` | `text-card-body` | `font-medium text-text-primary` |
| List item subtitle | `font-mohave` | `text-caption-sm` | `text-text-tertiary` |
| Chart axis | `font-kosugi` | `text-micro-sm` | `uppercase text-text-disabled` |
| Footer link | `font-kosugi` | `text-micro` | `uppercase text-text-tertiary hover:text-text-secondary` |
| Action button | `font-mohave` | `text-button-sm` | |
| Empty state | `font-mohave` | `text-caption-sm` | `text-text-disabled` |

Use `HERO_SIZE_CLASS` from widget-tokens:
```typescript
import { HERO_SIZE_CLASS, isCompact } from "@/lib/widget-tokens";

const heroClass = isCompact(size) ? HERO_SIZE_CLASS.compact : HERO_SIZE_CLASS.expanded;
```

---

## 5. Tooltips

Use the portaled `WidgetTooltip` from `./shared/widget-tooltip`:

```typescript
import { WidgetTooltip, TooltipRow } from "./shared/widget-tooltip";

// Pass anchorRef for viewport-relative positioning:
<WidgetTooltip visible={tooltip.visible} x={tooltip.x} y={tooltip.y} anchorRef={chartRef} anchor="above">
  <TooltipRow label="Revenue" value="$12,400" color={WT.revenue} />
</WidgetTooltip>
```

**Never** use absolute-positioned tooltip elements inline — they get clipped by `overflow-hidden`.

---

## 6. Widget Component Template

Use this scaffold for every new widget:

```tsx
"use client";

import { useMemo } from "react";
import type { WidgetSize } from "@/lib/types/dashboard-widgets";
import { WT, HERO_SIZE_CLASS, isCompact, showDetail, showActions, showFooter } from "@/lib/widget-tokens";

interface [Name]WidgetProps {
  size: WidgetSize;
  config?: Record<string, unknown>;
  isLoading?: boolean;
  onNavigate?: (path: string) => void;
  // data props...
}

export function [Name]Widget({ size, config, isLoading, onNavigate }: [Name]WidgetProps) {
  const compact = isCompact(size);
  const heroClass = compact ? HERO_SIZE_CLASS.compact : HERO_SIZE_CLASS.expanded;

  if (isLoading) {
    return <WidgetLoadingSkeleton size={size} />;
  }

  return (
    <div className="h-full flex flex-col p-3">
      {/* HEADER — always */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-kosugi text-micro text-text-tertiary uppercase tracking-wider">
          Widget Title
        </span>
      </div>

      {/* HERO ZONE — always */}
      <div className="flex items-baseline gap-2">
        <span className={`font-mono font-bold text-text-primary ${heroClass}`}>
          {/* Hero number */}
        </span>
      </div>

      {/* DETAIL ZONE — MD+ */}
      {showDetail(size) && (
        <div className="flex-1 mt-3 overflow-y-auto scrollbar-hide">
          {/* Chart, list, funnel */}
        </div>
      )}

      {/* ACTION ZONE — LG+ */}
      {showActions(size) && (
        <div className="mt-3 pt-2 border-t border-border-subtle">
          {/* Inline actions */}
        </div>
      )}

      {/* FOOTER — SM+ */}
      {showFooter(size) && (
        <button
          onClick={() => onNavigate?.("/detail-page")}
          className="mt-auto pt-2 font-kosugi text-micro text-text-tertiary uppercase tracking-wider hover:text-text-secondary transition-colors text-left"
        >
          View All
        </button>
      )}
    </div>
  );
}
```

---

## 7. Creating a New Widget

1. **Data:** Identify which hooks to use (`useInvoices`, `useTasks`, etc.)
2. **Registry:** Add entry to `WIDGET_TYPE_REGISTRY` in `src/lib/types/dashboard-widgets.ts`:
   - `category`, `tags`, `supportedSizes`, `defaultSize`, `configSchema`, `requiredPermission`, `allowMultiple`
3. **Content per tier:** Define what renders in each zone at each supported size
4. **Scaffold:** Copy the template, implement zones
5. **Wire up:** Add to `renderWidgetContent()` switch in `src/app/(dashboard)/dashboard/page.tsx`
6. **Audit:** Run the 10-point checklist

---

## 8. Audit Checklist (10 Points)

Every widget MUST pass ALL 10 checks before shipping:

- [ ] **1. Colors** — Zero hardcoded hex. All from `WT.*` tokens or Tailwind classes.
- [ ] **2. Typography** — Correct font/size per the table in Section 4.
- [ ] **3. Anatomy** — Zone system followed. Each size tier shows only allowed zones.
- [ ] **4. Content budget** — XS/SM are genuinely glanceable (2-second read). No squeezed charts.
- [ ] **5. Overflow** — Detail zone wrapped in `<ScrollFade>` from `./shared/scroll-fade`. Shows gradient fades at top/bottom when content overflows.
- [ ] **6. Tooltips** — Portaled `WidgetTooltip` with `anchorRef`. No inline absolute tooltips.
- [ ] **7. Navigation** — XS/SM tap navigates to detail page. `onNavigate` wired.
- [ ] **8. Loading** — Skeleton state at every supported size.
- [ ] **9. Empty state** — Graceful display when data is empty/zero.
- [ ] **10. Reduced motion** — All animations respect `prefers-reduced-motion`.

---

## 9. Trend Indicators

**NEVER use unicode arrows** (`↑`, `↓`, `→`). Always use Lucide chevron icons:

```tsx
import { ChevronUp, ChevronDown, ChevronRight } from "lucide-react";

// XS/SM: w-3 h-3
{trend === "up" ? (
  <ChevronUp className="w-3 h-3" style={{ color: WT.success }} />
) : trend === "down" ? (
  <ChevronDown className="w-3 h-3" style={{ color: WT.error }} />
) : (
  <ChevronRight className="w-3 h-3 text-text-disabled" />
)}
```

**No +/- prefix on values.** Color denotes direction (green = positive, red = negative). Never render `+$29.8K` — just `$29.8K` with green color.

---

## 10. Status Badges

Badges use sharp corners, tight sizing, and border color matching text color:

```tsx
<span className={cn(
  "font-mohave text-[10px] px-1 py-[1px] rounded-sm uppercase tracking-wider border",
  badgeColorClasses
)}>
  {label}
</span>
```

**Badge color pattern:** `text-{color} bg-{color}/15 border-{color}/30`

| Status | Color | Use |
|--------|-------|-----|
| Draft / Inactive | `text-text-disabled bg-text-disabled/15 border-text-disabled/30` | Draft, superseded, archived |
| Sent / Pending | `text-ops-accent bg-ops-accent/15 border-ops-accent/30` | Sent, awaiting response |
| Viewed / Attention | `text-ops-amber bg-ops-amber/15 border-ops-amber/30` | Viewed, changes requested, expiring |
| Success | `text-status-success bg-status-success/15 border-status-success/30` | Approved, paid, converted |
| Error / Critical | `text-ops-error bg-ops-error/15 border-ops-error/30` | Past due, expired, declined |
| Info / Count | `text-ops-accent bg-ops-accent/10 border-ops-accent/30` | Project counts, informational |

**NEVER use `rounded-full`** for badges. Always `rounded-sm`.

---

## 11. Navigation (SM Icon Button)

At SM, navigation uses a tiny `ArrowUpRight` icon button instead of text footer links:

```tsx
import { ArrowUpRight } from "lucide-react";

// Inside the hero row, right-aligned:
<button
  onClick={(e) => { e.stopPropagation(); onNavigate("/path"); }}
  className="p-0.5 rounded-sm hover:bg-[rgba(255,255,255,0.08)] transition-colors"
>
  <ArrowUpRight className="w-2.5 h-2.5 text-text-disabled" />
</button>
```

At MD+, use text footer links as before.

---

## 12. ScrollFade (Scroll Indicators)

Every scrollable detail zone MUST use the `ScrollFade` component instead of a raw `overflow-y-auto` div:

```tsx
import { ScrollFade } from "./shared/scroll-fade";

// Replaces: <div className="flex-1 overflow-y-auto scrollbar-hide">
<ScrollFade>
  {/* list content, chart, etc. */}
</ScrollFade>
```

`ScrollFade` provides `flex-1`, `overflow-y-auto`, and `scrollbar-hide` internally. It adds gradient fade overlays at top/bottom to indicate scrollable content. Fades appear/disappear based on scroll position via `onScroll` + `ResizeObserver`.

Pass extra classes via `className` prop if needed: `<ScrollFade className="mt-3 pt-2 border-t border-border-subtle">`.

---

## 13. LG Content Density

**LG widgets (584px) must fill their space.** No large empty areas. Every pixel should earn its place.

- Remove item caps or increase them significantly at LG (`showActions(size)` branch): aim for 10-15 items, not 3-5
- Scale chart/bar heights up at LG: compact 14px → MD 20px → **LG 24px**
- Show additional context that MD doesn't have (conversion rates, project names, member tasks, expiring estimates)
- If a widget genuinely has no data, show a meaningful empty state — not just centered text with massive padding
- **Never ship a placeholder widget at LG.** Wire it to real data or don't support the size.

---

## 14. Common Violations to Watch For

| Violation | Fix |
|-----------|-----|
| `#C4A868` hardcoded | `WT.warning` or `WT.revenue` |
| `#B58289` hardcoded | `WT.error` or `WT.cost` |
| `#6B8F71` hardcoded | `WT.success` |
| `#597794` hardcoded | `WT.accent` |
| `border-border-primary` | `border-border` or `border-border-subtle` |
| `text-text-quaternary` | `text-text-disabled` |
| Chart at XS size | Remove — XS is hero number only |
| Unicode arrows `↑↓→` | Use Lucide `ChevronUp`/`ChevronDown`/`ChevronRight` |
| `+$29.8K` prefix | Remove — color denotes direction, not prefix |
| `rounded-full` on badges | Always `rounded-sm` — sharp corners per design system |
| Badge missing border color | Add `border-{color}/30` matching text color |
| Text footer at SM | Replace with `ArrowUpRight` icon button |
| `CardHeader`/`CardTitle` in widgets | Use `font-kosugi text-micro uppercase tracking-wider text-text-tertiary` directly |
| Card without `p-0` at SM/MD | Add `p-0` to Card, use `p-3` on inner div |
| Title above hero at XS/SM | Hero FIRST, title below — hero-first layout |
| No loading skeleton | Add `WidgetSkeleton` or custom skeleton |
| Fixed bar height all sizes | Scale: compact `h-[14px]`, md `h-[20px]`, lg+ `h-[24px]` |
| Empty state before size check | Size-specific empty states — XS empty must match XS layout pattern |
