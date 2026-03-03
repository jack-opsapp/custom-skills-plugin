---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code. Searches available skills, references the design system, and incorporates interface-design, frontend-design, and elite-animations skills into the plan.
---

# Writing Plans (Enhanced)

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** This should be run in a dedicated worktree (created by brainstorming skill).

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## CRITICAL: Skill Discovery Before Planning

**Before writing a single line of the plan, search for and load relevant skills:**

1. **Always check for a design system file** at `.interface-design/system.md`. If it exists, read it and enforce all tokens, colors, typography, spacing, and component patterns in the plan. Every UI task in the plan must reference specific design system tokens — never hardcoded values.

2. **Search available skills** for anything relevant to the task at hand. At minimum check:
   - `interface-design` — Load for any UI/dashboard/app interface work. Follow its principles and critique process.
   - `frontend-design` — Load for any web frontend implementation. Use its component patterns and quality standards.
   - `elite-animations` — Load for ANY animation, transition, hover effect, scroll animation, or micro-interaction. This is mandatory — do not write animation code without this skill.
   - `audit-design-system` — Load when the plan touches UI to verify token compliance.
   - `mobile-ux-design` — Load for any mobile app screen design.
   - `ops-copywriter` — Load for any user-facing copy, headlines, or messaging.

3. **Reference loaded skills in the plan.** Each task that involves UI, animations, or design must include a note like:
   ```
   > **Skills:** Use `interface-design` for layout decisions, `elite-animations` for scroll effects, adhere to `.interface-design/system.md` tokens.
   ```

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

**Design System:** [Path to .interface-design/system.md if exists, or "N/A"]

**Required Skills:** [List all skills the executing agent must load]

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Skills:** [List relevant skills for this specific task]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Design tokens:** [List specific tokens from system.md this task uses, e.g., `background: #0A0A0A`, `text-primary: #FFFFFF`]

**Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

**Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## Animation Tasks

**Any task involving animations MUST:**
1. Load the `elite-animations` skill
2. Specify the animation type (scroll-reveal, micro-interaction, page transition, etc.)
3. Include performance constraints (60fps, will-change, GPU-accelerated)
4. Reference the animation library from the project (Framer Motion, GSAP, CSS, etc.)
5. Include the exact easing, duration, and delay values

## Remember
- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Reference relevant skills in every task
- All UI must use design system tokens from `.interface-design/system.md`
- All animations must use `elite-animations` skill
- DRY, YAGNI, TDD, frequent commits

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Stay in this session
- Fresh subagent per task + code review

**If Parallel Session chosen:**
- Guide them to open new session in worktree
- **REQUIRED SUB-SKILL:** New session uses superpowers:executing-plans
