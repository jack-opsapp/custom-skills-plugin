---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints. Searches and loads relevant skills before execution, enforces design system compliance, and uses elite-animations for all animation work.
---

# Executing Plans (Enhanced)

## Overview

Load plan, review critically, **search and load relevant skills**, execute tasks in batches, report for review between batches.

**Core principle:** Batch execution with checkpoints for architect review, with full skill awareness.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## The Process

### Step 0: Load Skills (MANDATORY — before anything else)

**Before reading the plan, search for and load all potentially relevant skills:**

1. **Read the design system** at `.interface-design/system.md` if it exists. All UI work must use these tokens — never hardcode colors, spacing, fonts, or radii.

2. **Check the plan header** for a `Required Skills:` field. Load every listed skill.

3. **Search available skills** and load any that match the task domain. At minimum:
   - `interface-design` — For any UI/dashboard/app interface work
   - `frontend-design` — For any web frontend implementation
   - `elite-animations` — **MANDATORY** for any animation, transition, hover effect, scroll animation, or micro-interaction. Do not write animation code without loading this skill first.
   - `audit-design-system` — For verifying design token compliance
   - `mobile-ux-design` — For any mobile screen work
   - `ops-copywriter` — For any user-facing copy

4. **For each task**, check if it has a `Skills:` note and load any additional skills specified.

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically — identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create TodoWrite and proceed

### Step 2: Execute Batch
**Default: First 3 tasks**

For each task:
1. Mark as in_progress
2. **Load any task-specific skills noted in the task**
3. **If the task involves UI: verify all values against `.interface-design/system.md` tokens**
4. **If the task involves animations: use `elite-animations` skill patterns**
5. Follow each step exactly (plan has bite-sized steps)
6. Run verifications as specified
7. Mark as completed

### Step 3: Report
When batch complete:
- Show what was implemented
- Show verification output
- **Note any design system tokens used**
- Say: "Ready for feedback."

### Step 4: Continue
Based on feedback:
- Apply changes if needed
- Execute next batch
- Repeat until complete

### Step 5: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## Design System Enforcement

**When `.interface-design/system.md` exists, every UI task must:**
- Use token names, not raw values (e.g., `var(--background)` not `#0A0A0A`)
- Follow the spacing scale defined in the system
- Use only fonts and weights from the system
- Match component patterns from the system
- If a needed token doesn't exist, flag it — don't invent one

## Animation Enforcement

**Any task with animations, transitions, or motion MUST:**
1. Load `elite-animations` skill before writing any animation code
2. Follow its performance patterns (GPU acceleration, will-change, 60fps)
3. Use the animation library already in the project (Framer Motion, GSAP, CSS)
4. Include exact easing curves, durations, and delays from the skill's reference

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker mid-batch (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly
- **A UI task has no design system tokens specified** — ask which tokens to use

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** — stop and ask.

## Remember
- **Load skills FIRST, before reading the plan**
- **Always read `.interface-design/system.md` if it exists**
- **Never write animation code without `elite-animations`**
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Between batches: just report and wait
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** — REQUIRED: Set up isolated workspace before starting
- **superpowers:writing-plans** — Creates the plan this skill executes
- **superpowers:finishing-a-development-branch** — Complete development after all tasks

**Domain skills (load as relevant):**
- **custom-skills:interface-design** — UI/app interface design principles and critique
- **custom-skills:elite-animations** — Animation patterns, performance, libraries
- **frontend-design:frontend-design** — Web frontend implementation quality
- **custom-skills:audit-design-system** — Design token compliance checking
- **custom-skills:mobile-ux-design** — Mobile screen design patterns
- **custom-skills:ops-copywriter** — User-facing copy and messaging
