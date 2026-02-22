---
name: design-from-references
description: Use when given company names or website URLs as design references to generate an interface design manual. Apply when user wants to derive a design system from brand references, competitor sites, or visual inspiration sources.
---

# Design From References

## Overview

Given company names and/or website URLs, fetch each reference, extract visual design tokens, identify conflicts, and synthesize a unified interface design manual in `system.md` format (compatible with the interface-design skill).

## Token-First Principle

**All values in the Patterns section MUST reference tokens from the Tokens section — never hardcode colors, fonts, spacing, or radius values.**

The Tokens section defines a single centralized `:root {}` block (CSS custom properties). Every component pattern then references those variables. This means:

- Colors → `var(--accent)`, `var(--foreground)`, `var(--border)`, etc.
- Spacing → `var(--space-4)`, `var(--space-8)`, etc. (or named sizes if defined)
- Radius → `var(--radius-sm)`, `var(--radius-md)`, `var(--radius-lg)`
- Typography → `var(--font-sans)`, `var(--font-size-sm)`, `var(--font-weight-medium)`

**Good:**
```
### Button Primary
- Background: var(--accent)
- Color: var(--accent-foreground)
- Radius: var(--radius-md)
- Font: var(--font-size-sm) / var(--font-weight-medium)
```

**Bad:**
```
### Button Primary
- Background: #417394
- Color: #E5E5E5
- Radius: 6px
- Font: 14px / 500
```

Raw values (px, hex) appear ONLY in the Tokens section where the variables are defined. Everywhere else: variable references only.

## Input Format

References passed as comma-separated values after the skill name:

```
/design-from-references Linear, Vercel, https://stripe.com
```

## Workflow

### Step 1 — Resolve URLs

For each **company name** (no URL provided):
- Use WebSearch to find their main product URL (prefer app/dashboard over marketing)
- Try: `[company] app`, `[company] dashboard`, `[company] design system`
- Prefer: `app.company.com`, `dashboard.company.com`, or primary logged-in interface

For each **URL**: use directly.

### Step 2 — Fetch & Analyze Each Reference

For each reference, fetch 2–3 pages to capture different design contexts:
- **Marketing/landing** page → brand personality, color palette
- **App or dashboard** page → functional components, density, depth
- **Docs or pricing** page → typography, information hierarchy

For each page, extract:

**Colors**
- Background / surface colors (hex or CSS var values)
- Text: primary, secondary, muted
- Accent / brand color + foreground on accent
- Border color
- Error and success state colors

**Typography**
- Font family (from `font-family` declarations or identifiable names)
- Size scale (px or rem values seen in text)
- Weights (400/500/600/700)
- Line heights

**Spacing**
- Base unit (4px or 8px)
- Common padding in cards, buttons, inputs
- Gap values in grids and flex layouts

**Depth Strategy**
- Shadow usage (`box-shadow` values or none)
- Border radius and border colors
- Multiple surface levels (background hierarchy)

**Component Patterns**
- Button: height, padding, radius, font weight, style variants
- Card: border, padding, radius, shadow, background
- Input / Textarea: height, border, radius, label style, focus state
- Navigation: style, height, active state
- Chip / Tag: padding, radius, border, background, text size
- Badge: size, style (filled/outlined/dot), state colors
- Toggle / Switch: track size, thumb size, on/off colors
- Segmented control / Picker: background, selected state, radius, text style
- Modal / Sheet: overlay opacity, panel radius, header style, shadow
- Tab bar: active indicator style, item spacing, label size
- Tooltip: background, text color, radius, padding
- Dropdown / Select: border, radius, option height, chevron style

**Personality Signal** — classify as one of:
`Precision & Density` | `Warmth & Approachability` | `Sophistication & Trust` | `Boldness & Clarity` | `Utility & Function` | `Data & Analysis`

### Step 3 — Identify Conflicts & Consult User

After analyzing all references, identify every dimension where they diverge. Synthesize each conflict into a clear choice.

**Conflict dimensions to check:**
- Overall personality / design character
- Spacing density (base unit, component padding)
- Depth strategy (borders vs. shadows vs. elevation)
- Color temperature (warm / cool / neutral)
- Border radius style (sharp / soft / rounded)
- Typography approach (system fonts / premium sans / display)
- Component density (compact vs. generous sizing)

**For any dimension with a clear conflict**, present it as a synthesized question. Do not ask the user to read raw reference data — do the synthesis work yourself and present concrete options.

**Workflow for conflict consultation:**

Enter plan mode (`EnterPlanMode`) before presenting conflict questions.
Use `AskUserQuestion` inside plan mode to collect answers (max 4 questions per call).
After all answers are collected, call `ExitPlanMode` with the synthesis plan, then proceed to Step 4.

**Format for conflict consultation:**

```
I analyzed your references and found some design conflicts to resolve before building your system. Quick questions:

**1. Overall character**
Your references pull in different directions:
- Option A — [Ref]: [synthesized description, e.g. "Tight and technical — dense info, no decoration, purely functional"]
- Option B — [Ref]: [synthesized description, e.g. "Warm and approachable — generous space, soft depth, friendly feel"]
Which fits your project?

**2. Spacing density**
- Compact (4px base) — [e.g. "Like Linear: data tables, power users, maximum information"]
- Generous (8px base) — [e.g. "Like Airbnb: breathing room, consumer-friendly, easier scanning"]

**3. Depth strategy**
- Borders-only — [e.g. "Clean and flat, edges define surfaces, zero visual noise"]
- Subtle shadows — [e.g. "Soft lift, slight elevation between surfaces, warmer feel"]
- Layered shadows — [e.g. "Clear elevation hierarchy, modals and cards pop off the page"]

**4. Color temperature**
- Cool — [e.g. "Slate/zinc/blue-grey tones, professional, technical"]
- Warm — [e.g. "Stone/amber/sand tones, approachable, human"]
- Neutral — [e.g. "Pure grey, no temperature bias, timeless"]

**5. Radius style**
- Sharp (2–6px) — tight, technical, precise
- Soft (8–12px) — modern, clean, widely used
- Rounded (16px+) — friendly, consumer-focused

[Only include questions where genuine conflict exists. Skip dimensions where references agree.]
```

Wait for user answers before proceeding to synthesis. Apply answers directly to Step 4.

**For minor conflicts** (slight variation in font scale, border opacity, specific component size): resolve silently by choosing the more refined value, and note the choice in the Decisions table.

### Step 4 — Synthesize

After conflicts are resolved:
1. Identify the strongest common patterns across all references
2. Build a unified token set from those patterns
3. Populate the Decisions table with source and rationale for non-obvious choices

### Step 5 — Output Manual

Display the full manual in this exact format:

---

```markdown
# Design System

## Direction

**Personality:** [one of the six directions]
**Foundation:** [warm | cool | neutral | tinted]
**Depth:** [borders-only | subtle-shadows | layered-shadows]
**Inspired by:** [Reference 1], [Reference 2], ...

## Tokens

All values live in a single centralized `:root {}` block. Components reference these — never hardcode.

```css
:root {
  /* Spacing */
  --space-1:  [value];   /* e.g. 4px */
  --space-2:  [value];   /* e.g. 8px */
  --space-3:  [value];   /* e.g. 12px */
  --space-4:  [value];   /* e.g. 16px */
  --space-6:  [value];   /* e.g. 24px */
  --space-8:  [value];   /* e.g. 32px */
  --space-12: [value];   /* e.g. 48px */
  --space-16: [value];   /* e.g. 64px */

  /* Colors */
  --background:         [hex];
  --surface:            [hex];
  --surface-raised:     [hex];
  --foreground:         [hex];
  --secondary:          [hex];
  --muted:              [hex];
  --border:             [hex or rgba];
  --accent:             [hex];
  --accent-foreground:  [hex];
  --error:              [hex];
  --error-foreground:   [hex];
  --success:            [hex];
  --success-foreground: [hex];
  --warning:            [hex];
  --overlay:            [rgba];

  /* Radius */
  --radius-xs: [value];  /* e.g. 2px */
  --radius-sm: [value];  /* e.g. 4px */
  --radius-md: [value];  /* e.g. 6px */
  --radius-lg: [value];  /* e.g. 8px */
  --radius-xl: [value];  /* e.g. 12px */
  --radius-full: 9999px;

  /* Typography */
  --font-sans:   [family stack];
  --font-mono:   [family stack or none];
  --font-size-xs:   [value];  /* e.g. 11px */
  --font-size-sm:   [value];  /* e.g. 13px */
  --font-size-base: [value];  /* e.g. 14px */
  --font-size-md:   [value];  /* e.g. 16px */
  --font-size-lg:   [value];  /* e.g. 18px */
  --font-size-xl:   [value];  /* e.g. 24px */
  --font-size-2xl:  [value];  /* e.g. 32px */
  --font-weight-normal:   400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;
  --font-weight-bold:     700;
  --line-height-tight:  [value];  /* e.g. 1.2 */
  --line-height-base:   [value];  /* e.g. 1.5 */
  --line-height-loose:  [value];  /* e.g. 1.75 */

  /* Shadows */
  --shadow-sm: [value or none];
  --shadow-md: [value or none];
  --shadow-lg: [value or none];
}
```

### Spacing base
[4px | 8px] — [rationale]

## Patterns

All color, font, spacing, and radius values MUST use `var(--token)` references. Raw values appear only in the Tokens block above.

### Button Primary
- Height: [raw px — sizing exception]
- Padding: var(--space-[n]) var(--space-[n])
- Radius: var(--radius-[size])
- Font: var(--font-size-sm) / var(--font-weight-medium)
- Background: var(--accent)
- Color: var(--accent-foreground)
- Style: [description]

### Button Secondary
- Height: [raw px]
- Padding: var(--space-[n]) var(--space-[n])
- Radius: var(--radius-[size])
- Background: var(--surface)
- Color: var(--foreground)
- Border: 1px solid var(--border)
- Style: [description]

### Card
- Background: var(--surface)
- Border: 1px solid var(--border)
- Padding: var(--space-[n])
- Radius: var(--radius-[size])
- Shadow: var(--shadow-[size] or none)

### Input
- Height: [raw px]
- Background: var(--surface)
- Border: 1px solid var(--border)
- Radius: var(--radius-[size])
- Color: var(--foreground)
- Placeholder: var(--muted)
- Label: var(--font-size-sm) / var(--font-weight-medium) / var(--secondary)
- Focus: border-color: var(--accent) [or ring style]

### Textarea
- Background: var(--surface)
- Border: 1px solid var(--border)
- Radius: var(--radius-[size])
- Color: var(--foreground)
- Min-height: [raw px]
- Resize: [none | vertical | both]

### Chip / Tag
- Padding: var(--space-1) var(--space-2)
- Radius: var(--radius-[size or full])
- Background: var(--surface-raised)
- Border: 1px solid var(--border) [or none]
- Color: var(--foreground)
- Font: var(--font-size-xs) / var(--font-weight-medium)
- Removable: [icon style or none]

### Badge
- Sizes: sm / md
- Style: [filled | outlined | dot]
- Variants use semantic tokens: var(--success), var(--error), var(--warning), var(--accent)
- Foreground uses matching *-foreground tokens
- Radius: var(--radius-full) [or --radius-sm]
- Font: var(--font-size-xs) / var(--font-weight-semibold)

### Toggle / Switch
- Track size: [raw px — sizing exception]
- Track on: var(--accent)
- Track off: var(--border)
- Thumb: background: var(--background); shadow: var(--shadow-sm)
- Transition: [duration]ms ease

### Segmented Control / Picker
- Container background: var(--surface)
- Container radius: var(--radius-[size])
- Container padding: var(--space-1)
- Selected background: var(--surface-raised)
- Selected color: var(--foreground)
- Unselected color: var(--muted)
- Font: var(--font-size-sm) / var(--font-weight-medium)
- Selected radius: var(--radius-[size — 1 step smaller than container])

### Tab Bar
- Active indicator: [underline | pill | background]
- Indicator color: var(--accent)
- Background: var(--background)
- Item spacing: var(--space-[n])
- Font: var(--font-size-sm) / var(--font-weight-medium)
- Active color: var(--foreground)
- Inactive color: var(--muted)

### Modal / Dialog
- Overlay: var(--overlay)
- Panel background: var(--surface)
- Panel radius: var(--radius-xl)
- Panel shadow: var(--shadow-lg)
- Max-width: [raw px — layout exception]
- Header: var(--font-size-md) / var(--font-weight-semibold) / var(--foreground)
- Header padding: var(--space-4) var(--space-6)
- Body padding: var(--space-4) var(--space-6)
- Footer padding: var(--space-4) var(--space-6)
- Footer: [left | right | center aligned buttons]
- Close button: [icon style, top-right position]

### Bottom Sheet
- Handle: color: var(--border); radius: var(--radius-full)
- Panel background: var(--surface)
- Panel radius: var(--radius-xl) var(--radius-xl) 0 0
- Panel shadow: var(--shadow-lg)
- Overlay: var(--overlay)
- Max-height: [raw % — layout exception]

### Dropdown / Select
- Background: var(--surface)
- Border: 1px solid var(--border)
- Radius: var(--radius-[size])
- Shadow: var(--shadow-md)
- Option height: [raw px]
- Option padding: var(--space-2) var(--space-3)
- Selected background: var(--surface-raised)
- Selected color: var(--foreground)
- Hover background: var(--surface-raised)
- Chevron color: var(--muted)

### Tooltip
- Background: var(--foreground)
- Color: var(--background)
- Radius: var(--radius-sm)
- Padding: var(--space-1) var(--space-2)
- Font: var(--font-size-xs)
- Arrow: [yes | no]
- Max-width: [raw px — layout exception]

### Navigation
- Height: [raw px — layout exception]
- Style: [sidebar | topbar | bottom tabs]
- Background: var(--background)
- Border: 1px solid var(--border) [or none]
- Active item background: var(--surface)
- Active item color: var(--foreground)
- Inactive item color: var(--muted)
- Item spacing: var(--space-[n])

## Decisions

| Decision | Source | Rationale |
|----------|--------|-----------|
| [token or choice] | [Reference] | [why this over alternatives] |

## Per-Reference Notes

### [Reference 1]
Key traits: [comma-separated list]

### [Reference 2]
Key traits: [comma-separated list]
```

---

After displaying, ask:

> Would you like me to save this design system? If so, what project name should I use?
> (e.g. "opsapp", "client-acme", "dashboard-v2")

### Storage Model

Named systems live in `.interface-design/systems/[name].md`.
The active system is always `.interface-design/system.md` — this is what the interface-design skill loads automatically.

```
.interface-design/
  system.md              ← active system (loaded automatically)
  systems/
    opsapp.md
    client-acme.md
    dashboard-v2.md
```

**On save:**
1. Write to `.interface-design/systems/[name].md`
2. Ask: "Set this as the active system? (replaces `.interface-design/system.md`)"
3. If yes: copy to `system.md` and confirm which project is now active

**If `system.md` already exists when activating:** warn the user which project it belongs to (read the `**Inspired by:**` and first line of the file), then confirm before replacing.

### Managing Systems

When user asks to **list** systems:
- List all files in `.interface-design/systems/`
- Show which one matches the current `system.md` (mark as active)

When user asks to **switch** to a saved system:
- Copy `.interface-design/systems/[name].md` → `.interface-design/system.md`
- Confirm: "Switched active system to [name]"

When user asks to **show** a system by name:
- Read and display `.interface-design/systems/[name].md`

When user asks to **delete** a system:
- Remove `.interface-design/systems/[name].md`
- If it was active, warn: "This was the active system. `system.md` still exists but may be stale."

**Shorthand triggers to recognize:**
- "switch to [name]" → activate that system
- "list my design systems" → list all saved systems
- "show [name] design system" → display it
- "save this as [name]" → save current session output under that name

---

## Tailwind Class Reference (for inference)

| Class | Value |
|-------|-------|
| `text-xs` | 12px |
| `text-sm` | 14px |
| `text-base` | 16px |
| `text-lg` | 18px |
| `p-1`, `gap-1` | 4px |
| `p-2`, `gap-2` | 8px |
| `p-3`, `gap-3` | 12px |
| `p-4`, `gap-4` | 16px |
| `p-6`, `gap-6` | 24px |
| `rounded-sm` | 2px |
| `rounded` | 4px |
| `rounded-md` | 6px |
| `rounded-lg` | 8px |
| `rounded-xl` | 12px |
| `rounded-2xl` | 16px |
| `shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) |
| `shadow-md` | 0 4px 6px rgba(0,0,0,0.07) |
| `font-normal` | 400 |
| `font-medium` | 500 |
| `font-semibold` | 600 |
| `font-bold` | 700 |

## Common Design Signals

**Precision & Density:** 4px base, borders-only, cool/neutral palette, system or mono fonts, compact components

**Warmth & Approachability:** 8px base, soft shadows, warm palette, rounded radius, generous padding

**Sophistication & Trust:** Cool palette, layered shadows, subtle borders, serif or premium sans, high contrast

**Boldness & Clarity:** High contrast, large type scale, dramatic space, strong accent, minimal decoration

**Utility & Function:** Muted palette, 4px base, minimal radius, monospace for data, no shadows

**Data & Analysis:** Dense layout, tabular numbers, cool palette, chart-optimized backgrounds, minimal chrome

## Limitations

- Sites behind auth: Analyze public marketing/login page; note in output that app-level tokens are estimated
- CSS-in-JS / compiled styles: Infer from visual language and class names when raw CSS isn't visible
- Dark mode only sites: Extract dark mode tokens; note in Direction section
