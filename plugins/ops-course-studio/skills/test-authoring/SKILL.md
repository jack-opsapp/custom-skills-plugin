---
name: test-authoring
version: 1.0.0
description: >
  Use when creating module tests, comprehensive end-of-module evaluations, or assessments that mix
  multiple question types (MC, short answer, workbook). Triggers on "create a module test",
  "end of module assessment", "comprehensive test", "mixed question assessment",
  or any task involving test creation that covers an entire module.
---

# Test Authoring

## Purpose

Create comprehensive module tests that evaluate mastery across ALL major concepts from a module. Tests mix question types and progress from recall to application.

## Test Specifications

- **Scope**: 5-8 questions covering the entire module
- **Total points**: ~100
- **Question types**: Mix of `multiple_choice`, `short_answer`, and `workbook`
- **Recommended mix**: 3 MC (30 pts) + 2 short answer (30 pts) + 1 workbook (40 pts) = 100 pts
- **passing_score**: 70 (default)
- **max_retakes**: 3 (default)
- **Difficulty balance**: ~40% straightforward, ~40% moderate, ~20% challenging

## Question Progression

Tests should follow this progression:

### 1. Recall (Multiple Choice) — 30% of points
- Test factual understanding of key concepts
- 3 MC questions, 10 pts each
- Cover different lessons within the module
- See quiz-authoring skill for MC writing rules

### 2. Understanding (Short Answer) — 30% of points
- Test ability to explain and connect concepts
- 2 short answer questions, 15 pts each
- Ask "why" and "how" questions, not just "what"
- Require specific trades examples

### 3. Application (Workbook) — 40% of points
- Test ability to apply concepts to their real business
- 1 workbook with 3-5 parts, 40 pts
- Parts should synthesize multiple lessons from the module
- See assignment-authoring skill for workbook writing rules

## Coverage Requirements

Before writing questions:
1. **List ALL major concepts** taught across all lessons in the module
2. **Ensure every concept** is tested by at least one question
3. **No concept** should appear in more than 2 questions
4. **Balance coverage** across lessons — don't over-test one lesson

## Example Test Structure

For a "Foundation" module with lessons on Owner's Trap, Business Mindset, and Business Planning:

```json
[
  {
    "id": "ft1",
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
  },
  {
    "id": "ft2",
    "type": "multiple_choice",
    "question": "When calculating your true profit margin, which cost do most contractors forget to include?",
    "options": [
      "Material costs",
      "Subcontractor payments",
      "Their own time at a fair hourly rate",
      "Equipment rental"
    ],
    "correct_answer": 2,
    "points": 10
  },
  {
    "id": "ft3",
    "type": "multiple_choice",
    "question": "What is the primary purpose of systematizing a business process?",
    "options": [
      "To make the business look more professional",
      "To reduce costs by eliminating staff",
      "To enable the work to happen without the owner doing it",
      "To increase the speed of each individual job"
    ],
    "correct_answer": 2,
    "points": 10
  },
  {
    "id": "ft4",
    "type": "short_answer",
    "question": "Explain the difference between working IN your business versus working ON your business. Give a specific example of each from the trades.",
    "rubric": "Full credit for a clear explanation distinguishing tactical daily work (IN: doing jobs, quoting, buying materials) from strategic systems work (ON: building processes, training, planning growth), with a specific trades example for each. Partial credit for correct concept with only one example or vague examples. No credit for irrelevant or confused answers.",
    "points": 15
  },
  {
    "id": "ft5",
    "type": "short_answer",
    "question": "Why is 'being busy' a dangerous metric for measuring business success? What should a contractor track instead?",
    "rubric": "Full credit for explaining that busyness doesn't equal profitability (can be busy and losing money), with at least 2 alternative metrics (e.g., profit margin, effective hourly rate, revenue per employee, close rate). Partial credit for understanding the concept but weak on alternatives. No credit for generic answers.",
    "points": 15
  },
  {
    "id": "ft6",
    "type": "workbook",
    "question": "Apply the Foundation module concepts to your business.",
    "parts": [
      { "id": "trap_identification", "prompt": "Describe the #1 way YOU are currently trapped in your business. What tasks consume your time that someone else could do?", "type": "textarea" },
      { "id": "true_hourly", "prompt": "Calculate your true hourly rate: what did you take home last month after all expenses, divided by total hours worked (including admin, quoting, travel)?", "type": "textarea" },
      { "id": "first_system", "prompt": "Identify one process in your business you will systematize this month. Describe exactly what the system looks like: what triggers it, what steps happen, and what the output is.", "type": "textarea" },
      { "id": "one_year_vision", "prompt": "Describe what your business looks like in one year if you successfully work ON it instead of IN it. Be specific: how many crew, what revenue, how many hours do YOU work?", "type": "textarea" }
    ],
    "rubric": "Award full points for specific, personal answers that reference their actual business situation and demonstrate understanding of module concepts (owner's trap, working ON vs IN, systematization). Each part worth ~10 points. Look for: named tasks they're trapped doing, real math on hourly rate, a specific system with clear steps, and a measurable vision with numbers. Partial credit for generic but conceptually correct answers. No credit for placeholder responses.",
    "points": 40
  }
]
```

## Process

1. **List all lessons** in the module with their key concepts
2. **Create a coverage map**: concept → question that tests it
3. **Write MC questions first** (recall layer) — cover 3 different concepts
4. **Write short answer questions** (understanding layer) — cover 2 more concepts with depth
5. **Write workbook question** (application layer) — synthesize multiple concepts into one practical exercise
6. **Verify point distribution** — should sum to ~100
7. **Review rubrics** — are they specific enough for AI grading?
8. **Assign unique IDs** with a module-related prefix

## Insert Template

```sql
INSERT INTO assessments (module_id, type, title, slug, description, instructions, questions, passing_score, max_retakes, sort_order)
VALUES (
  'MODULE_UUID',
  'test',
  '[Module Name] Module Test',
  '[module-name]-test',
  'Comprehensive test covering the [Module Name] module.',
  'Complete all questions. You have 3 attempts to achieve a passing score of 70%.',
  '[QUESTIONS_JSON]'::jsonb,
  70,
  3,
  SORT_ORDER
)
RETURNING id, title;
```

Use `mcp__plugin_supabase_supabase__execute_sql` with `project_id: "ijeekuhbatykdomumfjx"`.
