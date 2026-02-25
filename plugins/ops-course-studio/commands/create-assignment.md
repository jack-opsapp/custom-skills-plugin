---
name: create-assignment
description: "Create an assignment assessment (workbook/application exercise) for an ops-learn course module."
---

# Create Assignment

You are creating an assignment assessment. Follow these steps:

## Step 1: Select Course and Module

Query courses, then modules (same pattern as other create commands).

Use `mcp__plugin_supabase_supabase__execute_sql` with `project_id: "ijeekuhbatykdomumfjx"`.

## Step 2: Show Existing Items and Determine Placement

Show all items in the module and ask where the assignment should go.

```sql
SELECT 'lesson' as kind, title, slug, sort_order FROM lessons WHERE module_id = '[MODULE_ID]'
UNION ALL
SELECT 'assessment', title, slug, sort_order FROM assessments WHERE module_id = '[MODULE_ID]'
ORDER BY sort_order;
```

## Step 3: Gather Assignment Details

Ask for:
1. **Assignment title** (e.g., "Your Business on One Page")
2. **Description** (1 sentence about the practical exercise)

Generate **slug** from title.

## Step 4: Generate Questions

Invoke the **assignment-authoring** skill knowledge.

Ask the user: "What practical skill or concept should this assignment make the student apply?"

Generate 1-3 questions following assignment-authoring rules:
- Primary: workbook type with 3-6 parts
- Parts progress: context → analysis → planning → action
- Detailed rubrics for AI grading
- Must reference the student's real business
- Unique IDs with assignment-related prefix

Present to user for review and approval.

## Step 5: Insert

```sql
INSERT INTO assessments (module_id, type, title, slug, description, instructions, questions, passing_score, max_retakes, sort_order)
VALUES (
  '[MODULE_ID]',
  'assignment',
  '[title]',
  '[slug]',
  '[description]',
  'Complete each section thoughtfully, referencing your actual business.',
  '[QUESTIONS_JSON]'::jsonb,
  70,
  3,
  [SORT_ORDER]
)
RETURNING id, title;
```

## Step 6: Confirm

Report the created assessment ID and module position.
