---
name: mobile-ux-design
description: Use when designing new screens, redesigning existing screens, planning user flows, or auditing UI components for a mobile app — before wireframing or writing implementation code. Triggers on any request to design, spec, or review mobile UI.
---

# Mobile UX Design

## Overview

Full-process skill for designing mobile UI/UX. Covers user flow mapping, design system application, wireframing, and producing a structured spec ready for implementation.

**Announce at start:** "I'm using the mobile-ux-design skill to plan this screen."

**Workflow position:**
```
superpowers:brainstorming  →  mobile-ux-design  →  wireframe  →  superpowers:writing-plans
```

## When to Use

- Designing any new mobile screen or component from scratch
- Redesigning or auditing an existing screen
- Planning a multi-screen user flow
- Choosing between layout approaches before building

**NOT for:** Pure layout sketching with no design decisions — call `wireframe` directly.

---

## Step 1: Load the Brand Identity

**REQUIRED:** Before designing anything, search for the project's design system file. Check these locations in order:

1. `.interface-design/system.md` — primary location
2. `.interface-design/systems/<project-name>.md` — project-specific variant
3. Any file named `design-system.md`, `brand.md`, or `DESIGN.md` in the project root

### If a file is found

**Stop and confirm before reading further:**

> "I found a design system file at `[path]`. Should I use this as the brand identity for this design session?"

Wait for user confirmation. Only proceed once confirmed.

### If no file is found

Ask the user:

> "I couldn't find a design system or brand identity file in this project. Do you have one I can reference? You can share: a file path, a company name, competitor apps, or reference URLs."

- **If they provide a reference** → use it directly (read the file, or note the reference URLs/names)
- **If they have nothing** → invoke `design-from-references` to create a brand identity first, before continuing with UX design

> **REQUIRED SUB-SKILL (when no brand identity exists):** Use `design-from-references` to generate a design system from company names or reference URLs. Return to this skill once the design system is created.

Do not proceed to Step 2 until a brand identity is established and confirmed.

---

## Step 2: Establish Context

Answer before designing:

- **Who is the user?** Role, technical comfort, context of use
- **Entry point:** How does the user arrive at this screen? What state do they carry in?
- **Primary task:** What is the single most important thing on this screen?
- **Platform:** iOS, Android, or cross-platform? This affects component conventions
- **Connectivity:** Does this screen need to work offline?

---

## Step 3: Map the User Flow

Before any layout, write the flow as text:

```
[Previous Screen]  →  [This Screen]  →  [Success Outcome / Next Screen]
                            ↓ empty state
                            ↓ error state
                            ↓ loading state
                            ↓ offline state (if applicable)
```

All states must be defined before designing the happy path.

---

## Step 4: Generate Wireframes

**REQUIRED SUB-SKILL:** Invoke `wireframe` for layout exploration — do not generate layouts manually.

The wireframe skill produces 4 variants. Evaluate each against:
- Does the primary task have dominant visual weight?
- Is the primary action reachable one-handed (bottom half of screen)?
- Does it account for persistent navigation (tab bar, bottom nav)?
- Does it handle the empty/error state gracefully?

Recommend one variant with reasoning.

---

## Step 5: Apply Design Tokens

Map every wireframe element to a token from the design system loaded in Step 1. **Never hardcode values** — use the token names from the brand file.

For each element, document:
- Which semantic token it uses (color, spacing, radius)
- Why (the design hierarchy reason, not just "it's in the system")

**Key hierarchy to enforce from any design system:**
- Background → Surface → Elevated Surface (3 levels maximum)
- Text: Primary → Secondary → Tertiary → Disabled
- Accent: reserved for the most critical interactive element per screen — do not distribute freely
- Status/semantic colors: error, success, warning — used only for their semantic meaning, never decoration

---

## Step 6: Produce the Design Spec

Output a structured spec before any code is written:

```markdown
## [Screen Name] — Design Spec

**Purpose:** [one sentence]
**Platform:** [iOS / Android / cross-platform]
**User:** [who, in what context]
**Entry:** [how they arrive]
**Primary action:** [the one CTA]

### Layout
[Winning wireframe variant — ASCII from wireframe skill]

### States
- **Loading:** [approach — skeleton, spinner, optimistic]
- **Empty (no data):** [illustration + CTA, or text only?]
- **Error:** [how displayed — inline, toast, full-screen?]
- **Offline:** [what's shown, what's disabled]
- **Success:** [confirmation feedback]

### Components
| Component | Design Token / Style | Notes |
|-----------|----------------------|-------|
| ... | ... | ... |

### Interactions
- [Gesture or tap] → [Result or destination]
- [Swipe / long press] → [Action]

### Typography assignments
- [Font role]: [which content uses it, and why]

### Anti-patterns to avoid for this screen
- [Specific risks — too many CTAs, color misuse, hierarchy problems]
```

---

## Step 7: Pre-Implementation Checklist

Run before handing off to `superpowers:writing-plans`:

**Design System Compliance**
- [ ] All colors use semantic tokens from the brand file — no hardcoded hex values
- [ ] Accent/brand color used sparingly — not on every interactive element
- [ ] Status/semantic colors used only for their semantic meaning

**Typography**
- [ ] All text roles map to the type scale from the brand file
- [ ] Text hierarchy is clear: primary, secondary, tertiary content readable in order

**Layout & Interaction**
- [ ] Touch targets meet platform minimums (44pt iOS / 48dp Android)
- [ ] Primary action is reachable one-handed
- [ ] Fixed navigation bars don't overlap content
- [ ] Platform conventions respected (iOS: top nav + back; Android: bottom nav + back gesture)

**Motion & States**
- [ ] Animations use transform/opacity — not width/height/layout properties
- [ ] Reduced-motion system setting respected with a fallback
- [ ] All states handled: loading, empty, error, offline, success

**Accessibility**
- [ ] Text contrast meets 4.5:1 minimum
- [ ] Interactive elements have descriptive labels (not just icons)
- [ ] Color is not the only differentiator for state or meaning

---

## Step 8: Hand Off to Implementation

After the spec is approved:

**REQUIRED SUB-SKILL:** Use `superpowers:writing-plans` to convert the design spec into a bite-sized implementation plan.

Include in the handoff:
- Winning wireframe variant
- Full component token table
- States spec
- Pre-implementation checklist as acceptance criteria

---

## Quick Component Reference (Platform-Agnostic)

| Component | Key design decision |
|-----------|---------------------|
| **Primary button** | Full-width or contained? When does it disable? Loading state? |
| **Secondary button** | Ghost vs outline vs text-only — pick one convention, stay consistent |
| **Bottom sheet** | Snap points, dismiss behavior, scrim opacity |
| **List row** | Minimum touch target, divider style, swipe actions |
| **Empty state** | First-time (illustration + CTA) vs filtered-empty (text only) |
| **Tab bar** | Active indicator style — filled icon, underline, or pill highlight |
| **FAB** | Single action vs expanding menu — expanding adds complexity |
| **Toast / Snackbar** | Position (top vs bottom), duration, action button |
| **Segmented control** | Underline vs filled pill — pick one and never mix |
| **Search field** | Persistent in header vs summoned on tap |

---

## Common Mobile UX Mistakes

| Mistake | Fix |
|---------|-----|
| Primary action buried in scroll | Primary CTA in fixed footer or above fold |
| Icon-only buttons with no label | Add labels or tooltips — icons alone are ambiguous |
| Full-page loading blocks | Skeleton screens or optimistic UI — show structure immediately |
| Color as the only state signal | Pair color with icon, text, or pattern |
| Inconsistent back navigation | Follow platform conventions strictly |
| Destructive action with one tap | Always confirm destructive actions |
| Empty state with no path forward | Every empty state needs a CTA or explanation |
