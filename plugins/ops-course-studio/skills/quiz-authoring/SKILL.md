---
name: quiz-authoring
version: 1.0.0
description: >
  Use when creating quiz assessments, writing multiple-choice questions, writing short-answer questions,
  or generating quick comprehension checks for ops-learn courses. Triggers on "create a quiz",
  "write quiz questions", "add a quiz after this lesson", "comprehension check",
  "multiple choice questions", or any task involving quiz question writing.
---

# Quiz Authoring

## Purpose

Create quiz assessments with well-crafted questions that test comprehension of lesson content. Quizzes are quick checks — not exhaustive evaluations.

## Quiz Specifications

- **Scope**: 3-5 questions per quiz
- **Total points**: 30-50 (typically)
- **Question types**: `multiple_choice` and `short_answer`
- **Difficulty**: Moderate — tests understanding, not memorization
- **Context**: Always reference real trades scenarios

## Question Writing Rules

### Multiple Choice

**Format:**
```json
{
  "id": "unique_id",
  "type": "multiple_choice",
  "question": "Clear, unambiguous question text?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": 1,
  "points": 10
}
```

**Rules:**
- Always 4 options
- `correct_answer` is a **0-based index** (0 = first option, 1 = second, etc.)
- One clearly correct answer
- Three plausible distractors based on common misconceptions
- Question should test UNDERSTANDING, not recall of exact wording
- Avoid "all of the above" and "none of the above"
- Avoid negative phrasing ("Which is NOT...")
- Points: 10 per MC question

**Good example:**
```json
{
  "id": "q1",
  "type": "multiple_choice",
  "question": "A contractor charges $2,500 for a job with $400 in materials, $200 in labor, and $100 in overhead. What is the profit margin?",
  "options": ["28%", "52%", "72%", "80%"],
  "correct_answer": 2,
  "points": 10
}
```

**Bad example (too vague):**
```json
{
  "question": "What is important about profit margins?",
  "options": ["They're high", "They're low", "They matter", "They don't matter"]
}
```

### Short Answer

**Format:**
```json
{
  "id": "unique_id",
  "type": "short_answer",
  "question": "Open-ended but focused question requiring 2-4 sentences.",
  "rubric": "Grading criteria for AI: what earns full credit, partial credit, no credit.",
  "points": 15
}
```

**Rules:**
- Question should be answerable in 2-4 sentences
- Ask for explanation, application, or analysis — not definitions
- Points: 15-20 per short answer
- Rubric: 2-3 sentences guiding the AI grader (gpt-4o-mini):
  - What constitutes full credit
  - What constitutes partial credit
  - What constitutes no credit
- Rubric should reward specific, applied answers over generic responses

**Good example:**
```json
{
  "id": "q3",
  "type": "short_answer",
  "question": "Explain why a contractor might be busy but not profitable. Give a specific example from the trades.",
  "rubric": "Full credit for identifying that revenue does not equal profit, with a specific trades example (e.g., underpricing jobs, not accounting for overhead, slow-paying clients). Partial credit for correct concept without specific example. No credit for vague or irrelevant answers.",
  "points": 15
}
```

## Process

1. **Read the lesson(s)** this quiz covers — understand what was taught
2. **Identify 3-5 key concepts** from the lesson content
3. **Write one question per concept** — mix MC and short answer (typically 2-3 MC + 1 short answer)
4. **Review for clarity** — would a contractor understand exactly what's being asked?
5. **Assign IDs** — use a prefix related to the quiz (e.g., `fqc1`, `fqc2` for "Foundation Quick Check")
6. **Calculate total points** — verify they sum correctly

## Insert Template

```sql
INSERT INTO assessments (module_id, type, title, slug, description, instructions, questions, passing_score, max_retakes, sort_order)
VALUES (
  'MODULE_UUID',
  'quiz',
  'Quiz Title',
  'quiz-slug',
  'Brief description of what this quiz covers.',
  'Answer these questions based on the previous lessons.',
  '[QUESTIONS_JSON]'::jsonb,
  70,
  3,
  SORT_ORDER
)
RETURNING id, title;
```

Use `mcp__plugin_supabase_supabase__execute_sql` with `project_id: "ijeekuhbatykdomumfjx"`.
