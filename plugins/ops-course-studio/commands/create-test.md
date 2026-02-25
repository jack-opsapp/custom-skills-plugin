---
name: create-test
description: "Create a comprehensive module test for an ops-learn course. Generates mixed-type questions and inserts into Supabase."
---

# Create Test

You are creating a module test — a comprehensive end-of-module assessment. Follow these steps:

## Step 1: Select Course and Module

Query courses, then modules.

Use `mcp__plugin_supabase_supabase__execute_sql` with `project_id: "ijeekuhbatykdomumfjx"`.

## Step 2: Show Module Contents

Show everything in the module to understand the full scope:

```sql
SELECT 'lesson' as kind, title, slug, sort_order FROM lessons WHERE module_id = '[MODULE_ID]'
UNION ALL
SELECT 'assessment', title, slug, sort_order FROM assessments WHERE module_id = '[MODULE_ID]'
ORDER BY sort_order;
```

Tests go at the END of the module — set sort_order to the highest existing + 10.

## Step 3: Gather Test Details

The title defaults to "[Module Name] Module Test". Ask the user to confirm or customize.

Generate **slug** from title.

## Step 4: Generate Questions

Invoke the **test-authoring** skill knowledge.

To write comprehensive questions, list ALL lessons in the module. If lesson content is available, read it. Otherwise, ask the user for the key concepts per lesson.

Generate 5-8 questions following test-authoring rules:
- **3 MC** (10 pts each = 30 pts) — recall, across different lessons
- **2 Short answer** (15 pts each = 30 pts) — understanding, connect concepts
- **1 Workbook** (40 pts) — application, synthesize the full module

Present to user for review and approval.

## Step 5: Insert

```sql
INSERT INTO assessments (module_id, type, title, slug, description, instructions, questions, passing_score, max_retakes, sort_order)
VALUES (
  '[MODULE_ID]',
  'test',
  '[title]',
  '[slug]',
  'Comprehensive test covering the [Module Name] module.',
  'Complete all questions. You have 3 attempts to achieve a passing score of 70%.',
  '[QUESTIONS_JSON]'::jsonb,
  70,
  3,
  [SORT_ORDER]
)
RETURNING id, title;
```

## Step 6: Confirm

Report the created assessment ID. Show the full module order including the new test.
