---
name: Content Brief
description: This skill should be used when the user asks to "write a content brief", "create a brief for a landing page", "plan a blog post", "SEO content brief", "generate content outline", "what should this page cover", or wants a structured brief for an SEO-optimized piece of content targeting a specific keyword cluster or trade vertical.
version: 0.1.0
---

# Content Brief Generator

Generate structured, SEO-optimized content briefs for landing pages, blog posts, comparison pages, and vertical pages targeting the FSM / trade contractor market. Each brief is ready to hand to a writer or use directly for content creation.

## When to Use

- Before writing any marketing content for OPS
- When planning content calendar items
- When entering a new trade vertical
- When creating competitor comparison pages
- When turning keyword research into actionable content

## Process

### Step 1: Load Intelligence

Read stored keyword strategy and competitor intelligence:

```
Read: C:\Users\j4cks\.claude\projects\C--OPS\memory\project_seo_keyword_strategy.md
Read: C:\Users\j4cks\.claude\projects\C--OPS\memory\project_competitor_intelligence.md
```

### Step 2: Define the Brief Target

Determine from the user:
- **Target keyword/cluster** — What search query is this content for?
- **Content type** — Landing page, blog post, comparison page, vertical page?
- **Intent tier** — Buyer intent, problem-aware, or vertical long-tail?

If not specified, recommend the highest-priority unfilled content gap from the keyword strategy.

### Step 3: Research the Keyword

Run a quick WebSearch for the target keyword to assess:
- What currently ranks in top 5?
- Quality of existing content (thin? outdated? generic?)
- What questions people ask (People Also Ask, related searches)
- Whether AI Overview appears (if yes, adjust strategy)

### Step 4: Generate the Brief

Use the template from `references/brief-templates.md` matching the content type. Every brief includes:

**Header Block:**
```
## Content Brief: [Title]
- Target keyword: [primary keyword]
- Secondary keywords: [3-5 related terms]
- Intent tier: [Buyer / Problem-Aware / Vertical]
- Content type: [Landing page / Blog / Comparison / Vertical]
- Target word count: [range]
- Competitor gaps to exploit: [specific weaknesses]
```

**Structural Outline:**
- H1 headline (with OPS voice — direct, trade-authentic)
- H2 sections with purpose and key points for each
- Recommended CTAs per section
- Internal linking opportunities

**SEO Requirements:**
- Primary keyword placement (title, H1, first 100 words, URL slug)
- Secondary keyword distribution
- Schema markup recommendations
- Meta title and description drafts

**OPS Voice Requirements:**
- Crew-first framing (not owner-first)
- Specific pain points to name (from competitor intelligence)
- Competitor weaknesses to exploit (specific to this keyword)
- Tone: direct, professional, trade-authentic
- No anti-patterns (no "all-in-one", no "streamline", no buzzwords)

**Differentiation Angles:**
- What competitors say about this topic (and where they're wrong/weak)
- What OPS offers that competitors don't
- Social proof / data points to include

### Step 5: Review with User

Present the brief and ask:
- Does the keyword target match your priority?
- Any specific features or angles to emphasize?
- Who is writing this — need more or less detail?
- Target publish date?

## Content Type Quick Guide

| Type | Best For | Word Count | Key Feature |
|---|---|---|---|
| **Comparison page** | Buyer intent "[X] vs [Y]" | 1,500-2,500 | Side-by-side feature/price tables |
| **Vertical landing page** | "[trade] software" | 800-1,500 | Trade-specific pain points + CTA |
| **Problem-solution blog** | Problem-aware queries | 1,200-2,000 | Lead with pain, solve with OPS |
| **Switching guide** | "[competitor] alternative" | 1,500-2,500 | Migration steps + comparison |
| **Pricing transparency** | "[competitor] pricing" | 800-1,200 | Clear pricing table + value comparison |

## Additional Resources

### Reference Files
- **`references/brief-templates.md`** — Full templates for each content type with fill-in sections
