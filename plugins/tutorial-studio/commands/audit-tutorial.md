---
description: Audit an existing tutorial against 12 best-practice dimensions
argument-hint: [path-to-project]
---

# Audit Tutorial

Audit the existing tutorial in this project against onboarding best practices.

Target project: $ARGUMENTS

If no path provided, use the current working directory.

## Phase 1 — Analysis

Activate app-analyzer skill knowledge. If no App Profile exists yet, create one first by scanning the codebase.

## Phase 2 — Audit

Activate tutorial-auditor skill knowledge. Read the existing tutorial code and score across all 12 dimensions:
1. Time-to-first-value
2. Interactivity
3. Progressive disclosure
4. Skip options
5. Personalization
6. Permission timing
7. Copy quality
8. Animation quality
9. Analytics coverage
10. Gamification
11. Platform conventions
12. Accessibility

## Output

Output the Audit Report:
- Overall score (out of 120) with interpretation
- Per-dimension score table with specific code references
- Top 3 highest-impact improvements with before/after recommendations
- Priority ranking by impact vs effort

## Next Steps

After completion, suggest:
- "Run /design-tutorial to redesign the tutorial based on these findings"
