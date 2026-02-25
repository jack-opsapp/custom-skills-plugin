---
name: course-status
description: "View the complete structure and status of an ops-learn course: modules, lessons, assessments, content blocks."
---

# Course Status

Display the full state of an ops-learn course. Follow these steps:

## Step 1: Select Course

If a course slug was provided as an argument, use it. Otherwise, list courses:

```sql
SELECT id, title, slug, status, price_cents, estimated_duration_minutes, sort_order
FROM courses WHERE status = 'published' ORDER BY sort_order;
```

Use `mcp__plugin_supabase_supabase__execute_sql` with `project_id: "ijeekuhbatykdomumfjx"`.

## Step 2: Fetch Full Course Tree

Run this query to get everything:

```sql
SELECT
  m.title as module_title, m.sort_order as module_sort, m.id as module_id,
  'lesson' as item_kind,
  l.title as item_title, l.slug as item_slug, l.sort_order as item_sort,
  l.duration_minutes, l.is_preview,
  NULL as assessment_type, NULL as question_count, NULL as passing_score
FROM modules m
JOIN lessons l ON l.module_id = m.id
WHERE m.course_id = '[COURSE_ID]'

UNION ALL

SELECT
  m.title, m.sort_order, m.id,
  'assessment',
  a.title, a.slug, a.sort_order,
  NULL, NULL,
  a.type, jsonb_array_length(a.questions), a.passing_score
FROM modules m
JOIN assessments a ON a.module_id = m.id
WHERE m.course_id = '[COURSE_ID]'

ORDER BY module_sort, item_sort;
```

## Step 3: Fetch Content Blocks Per Lesson

For each lesson, also query its content blocks:

```sql
SELECT l.slug as lesson_slug, cb.type, cb.sort_order,
  CASE
    WHEN cb.type = 'interactive_tool' THEN cb.content->>'title'
    WHEN cb.type = 'text' THEN 'text block'
    WHEN cb.type = 'video' THEN 'video'
    WHEN cb.type = 'download' THEN cb.content->>'title'
    WHEN cb.type = 'action_item' THEN 'action item'
    WHEN cb.type = 'quiz' THEN 'quick check'
    ELSE cb.type
  END as block_label
FROM content_blocks cb
JOIN lessons l ON l.id = cb.lesson_id
JOIN modules m ON m.id = l.module_id
WHERE m.course_id = '[COURSE_ID]'
ORDER BY m.sort_order, l.sort_order, cb.sort_order;
```

## Step 4: Display Formatted Tree

Present like this:

```
Course: [Title] ([slug])
Status: [status] | Price: [free or $X] | Duration: [X] min

Module 1: [Title] (sort: 10)
  [10] Lesson: [Title] ([slug], ~15 min, preview: yes)
       - video (sort: 10)
       - text block (sort: 20)
       - interactive_tool: [Tool Title] (sort: 30)
       - action item (sort: 40)
  [20] Lesson: [Title] ([slug], ~12 min)
       - text block (sort: 10)
       - text block (sort: 20)
  [25] Quiz: [Title] ([slug], 3 questions, pass: 70%)
  [30] Lesson: [Title] ([slug], ~18 min)
       (no content blocks yet)
  [35] Assignment: [Title] ([slug], 1 question, pass: 70%)
  [50] Test: [Module] Test ([slug], 5 questions, pass: 70%)

Module 2: [Title] (sort: 20)
  ...

---
Summary:
  Modules: 3 | Lessons: 9 | Assessments: 7 (3 quizzes, 2 assignments, 2 tests)
  Content blocks: 24 | Interactive tools: 5
  Lessons without content: 2 (list slugs)
```

## Step 5: Highlight Gaps

Flag any issues:
- Lessons with no content blocks
- Modules without a test at the end
- Large sort_order gaps or ordering issues
- Modules with no quizzes or assignments
