---
name: audit-design-system
description: Use when checking whether a codebase matches the active design system. Applies when finding hardcoded color, spacing, radius, or font values instead of token references, or when components deviate from design system pattern specs, or when identifying missing component implementations.
---

# Audit Design System

## Overview

Read the active design system, scan the codebase for deviations, and produce a prioritized violation report. Covers token misuse, pattern deviations, and missing components.

## Workflow

### Step 1 — Load the Design System

Read `.interface-design/system.md`. If not found:
- Check `.interface-design/systems/` for named systems
- Ask the user which to use, or ask them to activate one first

Extract:
- All token names and values from the `:root {}` block
- All pattern specs (every component section)

### Step 2 — Identify Platform

Determine codebase type from structure:

| Platform | Signals |
|----------|---------|
| **Web** | `.css`, `.tsx`, `.jsx`, `.vue`, `.svelte` files |
| **Android** | `.kt` files + `res/` directory |
| **iOS** | `.swift` files |

### Step 3 — Scan for Token Violations

**Web:**
- Grep for bare hex values (`#[0-9a-fA-F]{3,8}`) outside `:root {}` blocks
- Grep for hardcoded `px` values in spacing/radius positions within component styles
- Flag `var(--token)` references that don't exist in the active `system.md`

**Android:**
- Check `ui/theme/Color.kt` and `ui/theme/Theme.kt` — verify values match system tokens
- Grep composables for hardcoded color literals: `Color(0xFF...)`, `.color(...)`, raw hex strings
- Grep for hardcoded `dp` spacing values not drawn from a spacing scale
- `MaterialTheme.colorScheme.*` is acceptable if the theme is wired to system tokens

**iOS:**
- Check `Color+Extensions.swift` or equivalent — verify values match system tokens
- Grep `.swift` for `Color(red:green:blue:)` or hex string literals
- Grep `padding()`, `cornerRadius()`, `font(.system(size:))` for hardcoded values

### Step 4 — Check Pattern Compliance

For each pattern in the system (Button Primary, Card, Input, etc.):
1. Find the implementation in the codebase
2. Compare spec vs implementation for: radius, background, border, font-weight, padding, height
3. Flag deviations with exact file:line references

### Step 5 — Identify Missing Components

List every pattern defined in `system.md` that has no corresponding implementation. These are **gaps**, not violations — flag separately.

### Step 6 — Output Report

#### Violations
| Severity | File | Line | Issue | Expected | Found |
|----------|------|------|-------|----------|-------|
| Critical | `Button.kt` | 42 | Hardcoded color | `var(--accent)` | `#948b72` |
| Warning | `Card.tsx` | 18 | Wrong radius | `var(--radius-sm)` | `8px` |

#### Pattern Deviations
For each component that exists but differs from spec — describe what's wrong and what the spec requires.

#### Missing Components
List of system patterns with no implementation found.

#### Passed
Brief list of what was checked and matched correctly.

---

## Severity Scale

| Level | Meaning |
|-------|---------|
| **Critical** | Hardcoded value where a token exists — breaks system-wide consistency |
| **Warning** | Wrong token used — still systematic, but non-compliant with spec |
| **Info** | Missing component — a gap, not a regression |

## Notes

- **Start with token violations** — one token fix can resolve dozens of instances
- **Skip vendor/third-party directories** — only audit first-party code
- **Unspecified values are acceptable** — if the design system has no token for something (e.g. icon size, animation duration), hardcoding is fine; note it as unspecified rather than flagging it
- **Ask the user for scope** if the codebase is large — offer to audit one layer at a time (theme, components, screens)
