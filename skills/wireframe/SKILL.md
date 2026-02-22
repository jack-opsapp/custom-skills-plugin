---
name: wireframe
description: Generate structured wireframes and interactive design variants for UI layouts. Use when designing new screens, planning layouts, or exploring design options before coding. Generates 4+ variants and scans codebase for existing patterns.
---

# Wireframe Skill

Generate structured wireframes to visualize UI layouts and information hierarchy before writing code. Act as a seasoned UX designer for early-stage design exploration.

## When to Use

- Designing a new screen or feature
- Exploring layout options before committing to code
- Stakeholder alignment on structure before visual design
- Mapping information hierarchy and user flows

## Process

### Step 1: Scan Existing Patterns

Before proposing anything, check the codebase for:
- Existing component patterns (navigation, cards, lists, forms)
- Color tokens and spacing conventions
- Screen structure conventions (headers, FABs, bottom nav)
- Similar screens for reference

### Step 2: Produce 4 Variants

Always generate **4 distinct layout variants** — not variations on one theme, but genuinely different structural approaches:

1. **Hierarchical** — Top-down information priority, clear visual weight progression
2. **Dashboard/Grid** — Card-based, scannable, data-dense
3. **Flow-focused** — Single primary action, progressive disclosure
4. **Hybrid** — Combines elements from multiple patterns unique to this use case

### Step 3: Wireframe Format

For each variant, output:

```
VARIANT [N]: [Name]
Strategy: [1 sentence on the structural logic]

┌─────────────────────────────┐
│  [HEADER / NAV]             │
├─────────────────────────────┤
│  [PRIMARY CONTENT ZONE]     │
│    ┌──────┐  ┌──────┐      │
│    │ card │  │ card │      │
│    └──────┘  └──────┘      │
├─────────────────────────────┤
│  [SECONDARY ZONE]           │
│    • item                   │
│    • item                   │
└─────────────────────────────┘
       [FAB / ACTION]

Components: List of needed components
Navigation: How user moves in/out
Key interaction: Primary tap target
```

### Step 4: Recommend

After showing all 4, recommend ONE with reasoning:
- Why this structure fits the user's mental model
- How it aligns with existing app patterns
- What interaction pattern it best supports

### Step 5: Offer to Implement

```
Which variant? I can implement it using the existing design system.
```

## OPS Project Notes

When working in the OPS project (Android Kotlin/Jetpack Compose):
- Respect the dark theme (#000000 background, #E5E5E5 text)
- Use steel blue (#417394) for primary actions, amber (#C4A868) for accents
- 56dp touch targets, 8pt grid
- Include FloatingActionButton positioning if screen needs primary action
- Reference existing components: OpsCard, OpsTextField, OpsStatusBadge, OpsEmptyState
- Account for bottom navigation bar in layout space
