---
name: create-quiz
description: "Create a quiz assessment for an ops-learn course module. Generates questions and inserts into Supabase."
---

# Create Quiz

You are creating a quiz assessment. Follow these steps:

## Step 1: Select Course and Module

Query courses, then modules (same as create-lesson steps 1-2).

Use `mcp__plugin_supabase_supabase__execute_sql` with `project_id: "ijeekuhbatykdomumfjx"`.

## Step 2: Show Existing Items and Determine Placement

Show all items in the module:

```sql
SELECT 'lesson' as kind, title, slug, sort_order FROM lessons WHERE module_id = '[MODULE_ID]'
UNION ALL
SELECT 'assessment', title, slug, sort_order FROM assessments WHERE module_id = '[MODULE_ID]'
ORDER BY sort_order;
```

Ask: "Where should this quiz go? (after which item?)"

Calculate sort_order: midpoint between the preceding and following items, or preceding + 5 if there's room.

## Step 3: Gather Quiz Details

Ask for:
1. **Quiz title** (e.g., "Pricing Quick Check")
2. **Description** (1 sentence about what it covers)

Generate **slug** from title.

## Step 4: Generate Questions

Invoke the **quiz-authoring** skill knowledge. To write good questions, you need context about what the quiz covers.

Ask the user: "What lessons does this quiz cover?" Then read the lesson content if available, or ask the user to describe the key concepts.

Generate 3-5 questions following quiz-authoring rules:
- Mix of multiple_choice and short_answer
- 0-based correct_answer for MC
- Rubrics for short answer
- Unique IDs with quiz-related prefix
- Trades-relevant scenarios

Present the questions to the user for review and approval.

## Step 5: Insert

```sql
INSERT INTO assessments (module_id, type, title, slug, description, instructions, questions, passing_score, max_retakes, sort_order)
VALUES (
  '[MODULE_ID]',
  'quiz',
  '[title]',
  '[slug]',
  '[description]',
  'Answer these questions based on the previous lessons.',
  '[QUESTIONS_JSON]'::jsonb,
  70,
  3,
  [SORT_ORDER]
)
RETURNING id, title;
```

## Step 6: Confirm

Report the created assessment ID and show where it sits in the module order.
