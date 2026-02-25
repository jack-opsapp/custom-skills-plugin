---
name: schema-reference
version: 1.0.0
description: >
  Auto-loaded reference for ops-learn database schema, JSONB formats, and conventions.
  This skill activates whenever working on course content, assessments, lessons, interactive tools,
  or any ops-learn database operations. It provides the ground truth for all data formats.
---

# OPS-Learn Schema Reference

This is a reference skill. It does not perform actions — it provides the canonical data formats, table schemas, and conventions that all other ops-course-studio skills depend on.

**Supabase Project ID:** `ijeekuhbatykdomumfjx`

Use `mcp__plugin_supabase_supabase__execute_sql` with `project_id: "ijeekuhbatykdomumfjx"` for all database operations.

---

## Database Tables

### courses
```sql
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  thumbnail_url text,
  price_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',  -- 'draft' | 'published'
  sort_order integer NOT NULL DEFAULT 0,
  estimated_duration_minutes integer,
  created_at timestamptz DEFAULT now()
);
```

### modules
```sql
CREATE TABLE modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

### lessons
```sql
CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  duration_minutes integer,
  sort_order integer NOT NULL DEFAULT 0,
  is_preview boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(module_id, slug)
);
```

### content_blocks
```sql
CREATE TABLE content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type content_block_type NOT NULL,  -- enum below
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

**content_block_type enum values:** `video`, `text`, `download`, `action_item`, `quiz`, `interactive_tool`

### assessments
```sql
CREATE TABLE assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  type assessment_type NOT NULL,  -- enum below
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  instructions text,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  passing_score integer NOT NULL DEFAULT 70,
  max_retakes integer NOT NULL DEFAULT 3,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(module_id, slug)
);
```

**assessment_type enum values:** `quiz`, `assignment`, `test`

### assessment_submissions
```sql
CREATE TABLE assessment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL DEFAULT 1,
  answers jsonb NOT NULL,
  score integer,
  feedback jsonb,
  status text NOT NULL DEFAULT 'submitted',  -- 'submitted' | 'graded'
  created_at timestamptz NOT NULL DEFAULT now(),
  graded_at timestamptz,
  UNIQUE(user_id, assessment_id, attempt_number)
);
```

### course_grades
```sql
CREATE TABLE course_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  overall_score numeric(5,2),
  assessment_count integer NOT NULL DEFAULT 0,
  graded_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);
```

### enrollments
```sql
CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);
```

### lesson_progress
```sql
CREATE TABLE lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'completed',
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
```

---

## Content Block JSONB Formats

### video
```json
{
  "url": "https://example.com/video.mp4",
  "poster": "https://example.com/thumb.jpg"
}
```
OR for embeds:
```json
{
  "embed_html": "<iframe src=\"https://www.youtube.com/embed/...\" width=\"100%\" height=\"100%\" frameborder=\"0\" allowfullscreen></iframe>"
}
```

### text
```json
{
  "html": "<h2>Section Title</h2><p>Body text with <strong>emphasis</strong> and <em>italics</em>.</p><ul><li>List item</li></ul>"
}
```
Allowed HTML tags: h1, h2, h3, h4, p, br, strong, em, a, ul, ol, li, blockquote, code, pre, img, span, div.
Allowed attributes: href, src, alt, class, target, rel.

### download
```json
{
  "url": "https://example.com/file.pdf",
  "title": "Business Planning Template",
  "description": "Download this worksheet to map your business on one page."
}
```

### action_item
```json
{
  "text": "Before the next lesson, calculate your actual profit margin on your last three jobs using the calculator above."
}
```

### quiz (inline, non-graded quick check)
```json
{
  "question": "What percentage of your revenue should go to overhead costs?"
}
```

### interactive_tool
```json
{
  "tool_type": "profit_calculator",
  "title": "Calculate Your Profit Margin",
  "description": "Input your numbers to see what you actually take home.",
  "inputs": [
    { "id": "revenue", "label": "Job Revenue ($)", "type": "currency", "placeholder": "2500" },
    { "id": "materials", "label": "Material Costs ($)", "type": "currency", "placeholder": "400" },
    { "id": "labor_hours", "label": "Labor Hours", "type": "number", "placeholder": "8" },
    { "id": "hourly_rate", "label": "Crew Hourly Rate ($)", "type": "currency", "placeholder": "25" },
    { "id": "overhead_pct", "label": "Overhead (%)", "type": "percentage", "default": 15 }
  ],
  "outputs": [
    { "id": "labor_cost", "label": "Total Labor Cost", "formula": "labor_hours * hourly_rate", "format": "currency" },
    { "id": "total_costs", "label": "Total Job Cost", "formula": "materials + labor_cost + (materials + labor_cost) * overhead_pct / 100", "format": "currency" },
    { "id": "profit", "label": "Net Profit", "formula": "revenue - total_costs", "format": "currency", "highlight": true },
    { "id": "margin", "label": "Profit Margin", "formula": "revenue > 0 ? (profit / revenue) * 100 : 0", "format": "percentage", "highlight": true },
    { "id": "effective_hourly", "label": "Your Effective Hourly Rate", "formula": "labor_hours > 0 ? profit / labor_hours : 0", "format": "currency", "highlight": true }
  ]
}
```

**Input types:** `currency`, `number`, `percentage`
**Output formats:** `currency`, `number`, `percentage`

---

## Assessment Question JSONB Formats

All questions stored in `assessments.questions` as a JSONB array.

### multiple_choice
```json
{
  "id": "q1",
  "type": "multiple_choice",
  "question": "What is the 'Owner's Trap' primarily about?",
  "options": [
    "Not having enough tools or equipment",
    "Being the bottleneck in every part of your business",
    "Hiring too many employees too quickly",
    "Charging too little for your services"
  ],
  "correct_answer": 1,
  "points": 10
}
```
- `correct_answer`: 0-based index into `options` array
- `points`: typically 10 per MC question
- Grading: automatic (exact index match)

### short_answer
```json
{
  "id": "q2",
  "type": "short_answer",
  "question": "Explain the difference between working IN your business versus working ON your business. Give a specific example from the trades.",
  "rubric": "Full credit for a clear explanation distinguishing tactical/daily work (IN) from strategic/systems work (ON), with a specific trades example. Partial credit for correct concept without example. No credit for vague or unrelated answers.",
  "points": 20
}
```
- `rubric`: guides AI grader (gpt-4o-mini) on scoring criteria
- `points`: typically 15-20 per short answer
- Grading: AI via OpenAI gpt-4o-mini

### workbook
```json
{
  "id": "q3",
  "type": "workbook",
  "question": "Map your business on one page.",
  "parts": [
    { "id": "revenue_streams", "prompt": "List your top 3 revenue streams (services you sell)", "type": "textarea" },
    { "id": "key_bottleneck", "prompt": "What is the single biggest bottleneck in your business right now?", "type": "textarea" },
    { "id": "ideal_week", "prompt": "Describe what your ideal work week looks like as an owner (not a technician)", "type": "textarea" },
    { "id": "first_system", "prompt": "What is one process you could systematize this month to free up your time?", "type": "textarea" }
  ],
  "rubric": "Award full points for thoughtful, specific answers that show the student applied concepts from the module to their real business. Partial credit for vague or generic answers. Each part is worth roughly equal credit.",
  "points": 40
}
```
- `parts[].type`: `text` (short input) or `textarea` (long input)
- `rubric`: guides AI grader on all parts collectively
- `points`: typically 30-50 per workbook question
- Grading: AI via OpenAI gpt-4o-mini

---

## Safe Math Formula Reference

Interactive tool output formulas use a safe expression parser (NO code execution). Supported operators:

| Operator | Example |
|----------|---------|
| `+` `-` `*` `/` | `revenue - total_costs` |
| `%` (modulo) | `value % 100` |
| `( )` (grouping) | `(a + b) * c` |
| `>` `<` `>=` `<=` `==` `!=` | `revenue > 0` |
| `? :` (ternary) | `revenue > 0 ? profit / revenue * 100 : 0` |

**Variable references:** Use input/output `id` values as variable names. Outputs can reference earlier outputs in the array.

**Invalid expressions return 0.** Always use ternary guards for division: `divisor > 0 ? numerator / divisor : 0`

---

## Sort Order Conventions

- Use **10-based numbering** for all sort_order values (10, 20, 30...) to leave room for insertions
- Lessons: 10, 20, 30...
- Quizzes: placed between lessons (e.g., 15, 25)
- Assignments: placed after conceptual lessons (e.g., 35)
- Tests: highest sort_order in module (e.g., 50, 60)
- Content blocks within a lesson: 10, 20, 30...

---

## SQL Insert Templates

### Insert a course
```sql
INSERT INTO courses (title, slug, description, price_cents, status, sort_order, estimated_duration_minutes)
VALUES ('Course Title', 'course-slug', 'Description here.', 0, 'published', 10, 120)
RETURNING id, title, slug;
```

### Insert a module
```sql
INSERT INTO modules (course_id, title, description, sort_order)
VALUES ('COURSE_UUID', 'Module Title', 'Module description.', 10)
RETURNING id, title;
```

### Insert a lesson
```sql
INSERT INTO lessons (module_id, title, slug, description, duration_minutes, sort_order, is_preview)
VALUES ('MODULE_UUID', 'Lesson Title', 'lesson-slug', 'Lesson description.', 15, 10, false)
RETURNING id, title, slug;
```

### Insert a content block
```sql
INSERT INTO content_blocks (lesson_id, type, content, sort_order)
VALUES ('LESSON_UUID', 'text', '{"html": "<h2>Title</h2><p>Content.</p>"}'::jsonb, 10)
RETURNING id, type;
```

### Insert an assessment
```sql
INSERT INTO assessments (module_id, type, title, slug, description, instructions, questions, passing_score, max_retakes, sort_order)
VALUES (
  'MODULE_UUID',
  'quiz',
  'Assessment Title',
  'assessment-slug',
  'Brief description.',
  'Instructions for the student.',
  '[{"id":"q1","type":"multiple_choice","question":"...","options":["A","B","C","D"],"correct_answer":1,"points":10}]'::jsonb,
  70,
  3,
  25
)
RETURNING id, title, type;
```

### Query course tree (for /course-status)
```sql
SELECT
  c.id as course_id, c.title as course_title, c.slug as course_slug,
  c.status, c.price_cents, c.estimated_duration_minutes,
  m.id as module_id, m.title as module_title, m.sort_order as module_sort,
  l.id as lesson_id, l.title as lesson_title, l.slug as lesson_slug,
  l.duration_minutes, l.sort_order as lesson_sort,
  a.id as assessment_id, a.title as assessment_title, a.slug as assessment_slug,
  a.type as assessment_type, a.sort_order as assessment_sort,
  cb.id as block_id, cb.type as block_type, cb.sort_order as block_sort
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN lessons l ON l.module_id = m.id
LEFT JOIN content_blocks cb ON cb.lesson_id = l.id
LEFT JOIN assessments a ON a.module_id = m.id
WHERE c.slug = 'COURSE_SLUG'
ORDER BY m.sort_order, COALESCE(l.sort_order, a.sort_order + 1000), cb.sort_order;
```
