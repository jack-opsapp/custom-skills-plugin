---
name: create-tool
description: "Create an interactive tool (calculator, simulator, comparison tool, etc.) within an ops-learn lesson."
---

# Create Tool

You are creating an interactive tool as a content block within a lesson. Follow these steps:

## Step 1: Select Course, Module, and Lesson

Query courses → modules → lessons:

```sql
SELECT id, title, slug FROM courses WHERE status = 'published' ORDER BY sort_order;
```
```sql
SELECT id, title, sort_order FROM modules WHERE course_id = '[COURSE_ID]' ORDER BY sort_order;
```
```sql
SELECT id, title, slug, sort_order FROM lessons WHERE module_id = '[MODULE_ID]' ORDER BY sort_order;
```

Use `mcp__plugin_supabase_supabase__execute_sql` with `project_id: "ijeekuhbatykdomumfjx"`.

## Step 2: Show Existing Content Blocks

```sql
SELECT id, type, sort_order,
  content->>'title' as tool_title,
  CASE WHEN type = 'text' THEN LEFT(content->>'html', 60) || '...' ELSE NULL END as preview
FROM content_blocks
WHERE lesson_id = '[LESSON_ID]'
ORDER BY sort_order;
```

Ask where the tool should go in the content sequence.

## Step 3: Determine Tool Concept

Ask the user: **"What concept should this tool help the student explore?"**

Based on their answer, invoke the **interactive-tool-builder** skill knowledge to design the tool.

## Step 4: Design the Tool

Determine if this is a formula-driven tool (config only) or a custom component.

**For formula-driven tools:**
- Design inputs (3-6 ideal)
- Design outputs with formulas
- Use safe math operators only
- Guard all division with ternary
- Set highlight: true on key metrics
- Use realistic placeholders for trades businesses

Present the full JSONB config to the user for review.

**For custom tools:**
- Describe the component design
- Write the React/TSX code
- Explain how it integrates with InteractiveTool.tsx
- Present the design and code for review

## Step 5: Insert (Formula-Driven)

```sql
INSERT INTO content_blocks (lesson_id, type, content, sort_order)
VALUES (
  '[LESSON_ID]',
  'interactive_tool',
  '[TOOL_CONFIG_JSON]'::jsonb,
  [SORT_ORDER]
)
RETURNING id;
```

## Step 6: Confirm

Report the created content block ID. Show where it sits in the lesson's content sequence.
