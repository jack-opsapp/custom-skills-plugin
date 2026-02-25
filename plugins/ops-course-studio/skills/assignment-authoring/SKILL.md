---
name: assignment-authoring
version: 1.0.0
description: >
  Use when creating assignment assessments, writing workbook exercises, designing practical application tasks,
  writing AI grading rubrics, or creating exercises where students apply concepts to their real business.
  Triggers on "create an assignment", "write a workbook exercise", "application task",
  "practical exercise", "rubric writing", or any task involving assignment creation.
---

# Assignment Authoring

## Purpose

Create assignment assessments that require students to APPLY course concepts to their real business. Assignments test application, not recall. The student should walk away having done real work on their business.

## Assignment Specifications

- **Scope**: 1-3 questions per assignment
- **Total points**: 30-70 (typically)
- **Primary question type**: `workbook` (multi-part practical exercises)
- **Secondary**: `short_answer` for focused single-topic application
- **Emphasis**: Depth over breadth — fewer questions, more substance

## Question Writing Rules

### Workbook (Primary)

**Format:**
```json
{
  "id": "unique_id",
  "type": "workbook",
  "question": "Overall prompt describing the exercise.",
  "parts": [
    { "id": "part_id", "prompt": "Specific prompt for this part.", "type": "textarea" },
    { "id": "part_id", "prompt": "Specific prompt for this part.", "type": "textarea" }
  ],
  "rubric": "Detailed grading criteria for AI.",
  "points": 40
}
```

**Design rules:**
- 3-6 parts per workbook question
- Parts should progress logically:
  1. **Context/Assessment**: "What is your current situation?" (forces the student to describe their real business)
  2. **Analysis**: "What's working? What's not? Why?" (forces critical thinking)
  3. **Planning**: "What would you change? How?" (forces strategic thinking)
  4. **Action**: "What's the first step you'll take this week?" (forces commitment)
- Every part prompt must require the student to reference THEIR business — not hypothetical scenarios
- Part types:
  - `text`: Short input (1 line — names, numbers, short phrases)
  - `textarea`: Long input (paragraph responses)
- Points: 30-50 per workbook question

**Good workbook example:**
```json
{
  "id": "bop1",
  "type": "workbook",
  "question": "Map your business on one page.",
  "parts": [
    { "id": "revenue_streams", "prompt": "List your top 3 revenue streams (services you sell) and estimate what percentage of revenue each generates.", "type": "textarea" },
    { "id": "key_bottleneck", "prompt": "What is the single biggest bottleneck in your business right now? How does it show up in your day-to-day?", "type": "textarea" },
    { "id": "ideal_week", "prompt": "Describe what your ideal work week looks like as an owner (not a technician). How many hours? Doing what?", "type": "textarea" },
    { "id": "first_system", "prompt": "What is one process you could systematize this month to free up your time? Be specific about what the system would look like.", "type": "textarea" }
  ],
  "rubric": "Award full points for thoughtful, specific answers that show the student applied concepts from the module to their real business. Look for: named services with realistic percentages, a specific bottleneck (not generic), a concrete vision for owner role, and a specific system with actionable detail. Partial credit for vague or generic answers that show understanding but lack specificity. No credit for clearly placeholder or copy-paste responses.",
  "points": 40
}
```

### Short Answer (Secondary)

Use for focused, single-topic application questions:

```json
{
  "id": "sa1",
  "type": "short_answer",
  "question": "Calculate your effective hourly rate as the business owner. Show your math: what did you take home last month, and how many hours did you work?",
  "rubric": "Full credit for showing actual calculation with real numbers from their business. Partial credit for using estimated numbers with correct methodology. No credit for theoretical answers that don't reference their own situation.",
  "points": 20
}
```

## Rubric Writing Guide

Rubrics are critical — they guide the AI grader (gpt-4o-mini). Write rubrics that:

1. **Define full credit**: What does an excellent answer look like? (specific, personal, applied)
2. **Define partial credit**: What's acceptable but lacking? (correct concept but generic, missing specifics)
3. **Define no credit**: What fails? (irrelevant, copy-paste, clearly no effort)
4. **Reward specificity**: "Named their actual services" > "Listed services"
5. **Reward application**: "Applied to their business" > "Understood the concept"
6. **Be explicit**: The AI needs clear criteria, not vibes

**Bad rubric:** "Grade based on quality of response."
**Good rubric:** "Full credit for identifying at least 2 specific bottlenecks in their business with concrete examples of how each affects daily operations. Partial credit for identifying bottlenecks that are too vague (e.g., 'time management' without specifics). No credit for generic answers not tied to their business."

## Anti-Patterns

- **No theoretical questions**: "Define profit margin" belongs in a quiz, not an assignment
- **No yes/no questions**: "Do you track your expenses?" — not useful
- **No questions with a "right" answer**: Assignments test APPLICATION, not recall
- **No hypothetical scenarios**: "Imagine you're a plumber..." — the student IS a contractor, use their reality
- **No overwhelming scope**: 1-3 questions max. Better to go deep on one exercise than shallow on five.

## Process

1. **Identify the practical takeaway** from the lesson(s) this assignment covers
2. **Design an exercise** that makes the student use the concepts on their real business
3. **Structure parts** in the context → analysis → planning → action progression
4. **Write the rubric** with explicit criteria for full/partial/no credit
5. **Review**: Would completing this assignment actually help the student's business?

## Insert Template

```sql
INSERT INTO assessments (module_id, type, title, slug, description, instructions, questions, passing_score, max_retakes, sort_order)
VALUES (
  'MODULE_UUID',
  'assignment',
  'Assignment Title',
  'assignment-slug',
  'Brief description of this assignment.',
  'Complete each section thoughtfully, referencing your actual business.',
  '[QUESTIONS_JSON]'::jsonb,
  70,
  3,
  SORT_ORDER
)
RETURNING id, title;
```

Use `mcp__plugin_supabase_supabase__execute_sql` with `project_id: "ijeekuhbatykdomumfjx"`.
