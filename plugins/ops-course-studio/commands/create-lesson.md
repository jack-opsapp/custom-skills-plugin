---
name: create-lesson
description: "Add a lesson to a module in an ops-learn course. Prompts for details and inserts into Supabase."
---

# Create Lesson

You are adding a new lesson to an ops-learn course. Follow these steps:

## Step 1: Select Course

Query and display available courses:

```sql
SELECT id, title, slug FROM courses WHERE status = 'published' ORDER BY sort_order;
```

Use `mcp__plugin_supabase_supabase__execute_sql` with `project_id: "ijeekuhbatykdomumfjx"`.

Ask the user to select a course (or accept a slug if provided as argument).

## Step 2: Select Module

Query modules for the selected course:

```sql
SELECT id, title, sort_order FROM modules WHERE course_id = '[COURSE_ID]' ORDER BY sort_order;
```

Ask the user to select a module.

## Step 3: Show Existing Items

Show what's already in this module:

```sql
SELECT 'lesson' as kind, title, slug, sort_order, duration_minutes::text as detail
FROM lessons WHERE module_id = '[MODULE_ID]'
UNION ALL
SELECT 'assessment', title, slug, sort_order, type as detail
FROM assessments WHERE module_id = '[MODULE_ID]'
ORDER BY sort_order;
```

## Step 4: Gather Lesson Details

Ask the user for:
1. **Lesson title**
2. **Description** (1 sentence)
3. **Duration** in minutes (estimate)
4. **Is preview?** (true/false — preview lessons are accessible without enrollment)
5. **Sort order** (suggest the next logical position based on existing items)

Generate **slug** from title: lowercase, hyphens, no special characters.

## Step 5: Confirm and Insert

```sql
INSERT INTO lessons (module_id, title, slug, description, duration_minutes, sort_order, is_preview)
VALUES ('[MODULE_ID]', '[title]', '[slug]', '[description]', [duration], [sort_order], [is_preview])
RETURNING id, title, slug;
```

## Step 6: Next Steps

After creation, ask:
- "Lesson created. Want to write content for it?" → invoke lesson-copywriter skill
- "Want to add an interactive tool to this lesson?" → invoke interactive-tool-builder skill
- "Done for now?" → show the lesson ID

Always report the created **lesson ID**.
