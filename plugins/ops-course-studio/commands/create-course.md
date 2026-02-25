---
name: create-course
description: "Scaffold a new course in ops-learn. Prompts for course details and inserts into Supabase."
---

# Create Course

You are creating a new course in the ops-learn platform. Follow these steps exactly:

## Step 1: Gather Course Details

Ask the user for:
1. **Course title** (e.g., "Estimating & Bidding for Contractors")
2. **Description** (1-2 sentences about what the course teaches)
3. **Price** (0 for free, or dollar amount — will be stored as cents)
4. **Estimated total duration** in minutes

Generate the **slug** automatically from the title: lowercase, hyphens, no special characters (e.g., "estimating-and-bidding-for-contractors").

## Step 2: Determine Sort Order

Query existing courses to find the next sort_order:

```sql
SELECT slug, title, sort_order FROM courses ORDER BY sort_order;
```

Use `mcp__plugin_supabase_supabase__execute_sql` with `project_id: "ijeekuhbatykdomumfjx"`.

Set sort_order to the highest existing + 10.

## Step 3: Confirm and Insert

Show the user the full details and SQL, then execute:

```sql
INSERT INTO courses (title, slug, description, price_cents, status, sort_order, estimated_duration_minutes)
VALUES ('[title]', '[slug]', '[description]', [price_cents], 'published', [sort_order], [duration])
RETURNING id, title, slug;
```

## Step 4: Next Steps

After creation, ask:
- "Course created. Want to research curriculum for this course?" → invoke curriculum-research skill
- "Want to design the module/lesson structure?" → invoke curriculum-structure skill
- "Done for now?" → show the course ID for reference

Always report the created **course ID** — it's needed for all subsequent operations.
