---
name: lesson-copywriter
version: 1.0.0
description: >
  Use when writing lesson content, creating text blocks, writing action items, structuring content block
  sequences, or writing educational copy in the OPS voice for ops-learn courses. Triggers on
  "write lesson content", "create text blocks", "write an action item", "lesson copy",
  "educational content", "write the lesson", or any task involving lesson content creation.
---

# Lesson Copywriter

## Purpose

Write lesson content in the OPS educational voice and structure it as insertable content blocks. Each lesson is a sequence of content blocks (video, text, tool, action item) that teach a single concept.

## The OPS Educational Voice

Different from the OPS marketing voice. This is teaching, not selling.

**Tone**: Like a successful contractor mentoring a peer over coffee. Direct, practical, no-BS. The authority comes from experience, not credentials.

**Characteristics:**
- Conversational but authoritative
- Uses "you" and "your" — speaks directly to the reader
- Short paragraphs (2-3 sentences max)
- Uses trades terminology naturally (not explained like a glossary)
- Concrete examples from real trades businesses
- Avoids academic language, corporate jargon, filler words
- Gets to the point fast — no long introductions
- Uses analogies from the job site to explain business concepts

**Example voice:**
> You know that feeling when you're on the third callback for the same job, your phone's blowing up with two other clients, and you still haven't sent last week's invoices? That's not a busy day. That's a broken system.
>
> Here's the truth most contractors don't want to hear: if your business can't run without you touching every job, you don't own a business. You own a job that controls your life.

**Anti-patterns:**
- "In this lesson, we will explore the fundamental principles of..." (academic)
- "Leveraging best practices for optimal outcomes..." (corporate)
- "Studies have shown that businesses which implement..." (distant)

## Content Block Sequence

Standard lesson structure (adapt as needed):

1. **Video block** (optional) — Lesson introduction, 2-5 minutes
2. **Text block** — Core teaching content (the "meat" of the lesson)
3. **Interactive tool** (optional) — Hands-on exploration of the concept
4. **Text block** (optional) — Additional context, deeper dive, or transition
5. **Action item** — One concrete thing to do TODAY
6. **Quiz block** (optional, inline) — Quick non-graded self-check

Not every lesson needs all blocks. Minimum: one text block + one action item.

## Writing Each Block Type

### Text Blocks

Content is HTML stored in JSONB: `{"html": "..."}`

**Allowed tags:** h2, h3, p, strong, em, a, ul, ol, li, blockquote, code, pre, br

**Structure rules:**
- Use `<h2>` for main sections within the lesson
- Use `<h3>` for subsections
- Use `<p>` for body text — keep paragraphs to 2-3 sentences
- Use `<strong>` for emphasis (sparingly — if everything is bold, nothing is)
- Use `<ul>` / `<ol>` for lists — trades people skim, make content scannable
- Use `<blockquote>` for key takeaways, memorable quotes, or "the bottom line"
- No inline styles, no class attributes for styling — the `prose-ops` Tailwind class handles all styling
- Escape double quotes in JSON: use `\"` or single quotes in HTML

**Good text block:**
```json
{
  "html": "<h2>The Real Cost of \"Being Busy\"</h2><p>Every contractor I've ever met says they're busy. Trucks rolling, phones ringing, crews out on jobs. But here's the question nobody wants to answer: <strong>how much of that busy actually turns into money in your pocket?</strong></p><p>Most contractors have no idea. They look at the top line — total revenue — and assume they're doing well. But revenue is vanity. Profit is sanity.</p><blockquote>If you can't tell me your profit margin on your last five jobs within 30 seconds, you're guessing. And guessing is how contractors go broke while staying busy.</blockquote>"
}
```

### Action Items

One concrete, specific task. Not vague advice.

```json
{
  "text": "Pull up your last 3 completed jobs. For each one, write down: total revenue, material cost, labor cost (including your own hours at $X/hr), and any other expenses. Calculate the actual profit on each. If you don't have exact numbers, estimate — but be honest."
}
```

**Rules:**
- ONE specific task (not a list of 5 things)
- Something they can do TODAY
- References their actual business, not a hypothetical
- Measurable — they'll know when they've done it

### Video Blocks

For lessons with video content:
```json
{
  "url": "https://storage.example.com/videos/lesson-name.mp4",
  "poster": "https://storage.example.com/thumbnails/lesson-name.jpg"
}
```

Or for YouTube/Vimeo embeds:
```json
{
  "embed_html": "<iframe src=\"https://www.youtube.com/embed/VIDEO_ID\" width=\"100%\" height=\"100%\" frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen title=\"Lesson Title\"></iframe>"
}
```

### Download Blocks

For supplementary materials:
```json
{
  "url": "https://storage.example.com/downloads/worksheet.pdf",
  "title": "Profit Margin Worksheet",
  "description": "Print this out and calculate your margins for your last 5 jobs."
}
```

### Inline Quiz Blocks (non-graded)

Quick self-check questions — not graded, just reflective:
```json
{
  "question": "Think about your last month: what percentage of your working hours were spent actually doing billable work versus admin, quoting, and travel?"
}
```

## Process

1. **Understand the lesson topic**: What single concept is this lesson teaching?
2. **Outline the block sequence**: Which block types does this lesson need?
3. **Write the text blocks**: Core teaching content in OPS voice
4. **Write the action item**: One concrete next step
5. **Add optional blocks**: Video placeholder, download, inline quiz, interactive tool reference
6. **Review**: Read it out loud. Does it sound like a contractor talking, or a textbook?

## Insert Template

```sql
INSERT INTO content_blocks (lesson_id, type, content, sort_order)
VALUES
  ('LESSON_UUID', 'text', '{"html": "..."}'::jsonb, 10),
  ('LESSON_UUID', 'action_item', '{"text": "..."}'::jsonb, 20)
RETURNING id, type, sort_order;
```

Use `mcp__plugin_supabase_supabase__execute_sql` with `project_id: "ijeekuhbatykdomumfjx"`.
