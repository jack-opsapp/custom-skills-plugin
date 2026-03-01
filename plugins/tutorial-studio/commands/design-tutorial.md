---
description: Full tutorial design pipeline — analyze, strategize, design, copy, instrument
argument-hint: [path-to-project]
---

# Design Tutorial

Launch the full tutorial design pipeline using the tutorial-orchestrator agent.

Target project: $ARGUMENTS

If no path provided, use the current working directory.

## Pipeline

The orchestrator coordinates all phases with checkpoints:
1. **Analysis** — scan codebase, produce App Profile
2. **Audit** (optional) — score existing tutorial if found
3. **Strategy** — design onboarding strategy, info gathering, progressive disclosure
4. **Flow Design** — phase-by-phase specification with timing
5. **UX/Animation/Interface** — visual layer design
6. **Copy** — all tooltip text, buttons, celebrations
7. **Analytics** — event instrumentation, KPIs, funnels
8. **Finalize** — compile into Tutorial Design Document

Each phase includes a checkpoint for approval before proceeding.
Final output: complete Tutorial Design Document saved to docs/.
