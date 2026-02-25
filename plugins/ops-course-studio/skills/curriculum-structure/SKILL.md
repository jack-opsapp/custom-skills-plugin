---
name: curriculum-structure
version: 1.0.0
description: >
  Use when designing course structure, organizing modules, planning lesson flow, placing assessments
  and interactive tools, determining pacing, or creating a course outline. Triggers on "structure this course",
  "design the curriculum", "plan the modules", "lesson flow", "assessment placement",
  "course outline", or when transitioning from research to concrete course design.
---

# Curriculum Structure

## Purpose

Transform a research brief (from curriculum-research) or topic description into a complete, insertable course structure: modules, lessons, assessment placement, interactive tool placement, sort orders, and duration estimates.

## Design Principles

1. **Progressive complexity**: Each module builds on the previous. Early modules establish foundations, later modules apply and extend.
2. **Single-topic lessons**: Each lesson teaches ONE concept well. 10-20 minutes. If it takes longer, split it.
3. **Learn-then-apply rhythm**: Teach a concept (lesson) → check understanding (quiz) → apply it (assignment) → prove mastery (test).
4. **Trades-first**: Every lesson should connect to real contractor scenarios. No abstract theory without practical grounding.
5. **Engagement through interactivity**: Place interactive tools where students benefit from exploring their own numbers or scenarios.

## Course Structure Rules

### Modules
- **3-5 modules per course**
- Each module has a clear theme and measurable outcome
- Module names should be action-oriented or outcome-oriented (e.g., "Getting Clients" not "Marketing Theory")
- Modules sort_order: 10, 20, 30, 40, 50

### Lessons
- **3-5 lessons per module**
- Each lesson has a single topic focus
- Duration: 10-20 minutes (mix of video, text, tools)
- First lesson of first module can be `is_preview: true` for marketing
- Lessons sort_order within module: 10, 20, 30, 40, 50
- Slug format: `kebab-case-title` (lowercase, hyphens, no special characters)

### Assessment Placement
- **Quiz**: After every 1-2 lessons. Quick comprehension check. 3-5 questions. sort_order between the lessons it follows (e.g., 15, 25).
- **Assignment**: After key conceptual lessons where practical application matters. 1-3 questions. sort_order after the lesson it relates to (e.g., 35).
- **Test**: At the END of each module. Comprehensive. 5-8 questions. Highest sort_order in the module (e.g., 50, 60).

### Interactive Tool Placement
- Place within lessons (as content blocks) where hands-on exploration adds value
- Best for: financial concepts (calculators), decision-making (comparison tools), planning (builders), self-assessment (diagnostics)
- Not every lesson needs a tool — only where interactivity creates an "aha moment"

## Output Format

Present the course structure as a detailed outline:

```
# Course: [Title] ([slug])
Price: $X | Estimated Duration: Y min | Status: published

## Module 1: [Title] (sort: 10)
Outcome: [What the student can do after this module]

  [10] Lesson: [Title] (slug: xxx, ~15 min, preview: true/false)
       Content: video intro → text (core concept) → action item
  [20] Lesson: [Title] (slug: xxx, ~12 min)
       Content: text → interactive tool: [tool name] → text → action item
  [25] Quiz: [Title] (slug: xxx, 3 questions, ~30 pts)
  [30] Lesson: [Title] (slug: xxx, ~18 min)
       Content: video → text → download (worksheet) → action item
  [35] Assignment: [Title] (slug: xxx, 1 workbook question, ~40 pts)
  [50] Test: [Module] Test (slug: xxx, 5-8 questions, ~100 pts)

## Module 2: [Title] (sort: 20)
...
```

## Process

1. **Review input**: Research brief or user description of course topic
2. **Define modules**: 3-5 themes with clear progression
3. **Break into lessons**: 3-5 per module, single-topic, with duration estimates
4. **Place assessments**: Quiz after concepts, assignment after application lessons, test at end
5. **Place tools**: Identify lessons where interactivity adds value, describe the tool concept
6. **Assign sort_orders**: 10-based for everything
7. **Generate slugs**: kebab-case, descriptive, unique within scope
8. **Present to user for review**

## After Approval

Once the user approves the structure:
1. Use `mcp__plugin_supabase_supabase__execute_sql` with project_id `ijeekuhbatykdomumfjx` to INSERT:
   - The course row
   - All module rows
   - All lesson rows (content blocks come later via lesson-copywriter)
   - Assessment placeholders (questions come later via quiz/assignment/test-authoring skills)
2. Report all created IDs
3. Suggest next steps: "Structure inserted. Ready to create content? Start with lesson-copywriter for lesson content, then quiz/assignment/test-authoring for assessments."
