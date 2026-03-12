---
name: Copy Audit
description: This skill should be used when the user asks to "audit our copy", "review our landing page", "check our messaging", "is our copy good", "compare our copy to competitors", "audit OPS website", or wants to evaluate OPS marketing copy against competitor weaknesses and positioning best practices for field service management software.
version: 0.1.0
---

# Copy Audit

Evaluate OPS landing pages, ads, or marketing copy against known competitor weaknesses and OPS positioning principles. Identify where copy is strong, where it falls into the same traps competitors use, and where opportunities are missed.

## When to Use

- After writing new landing page or ad copy
- Before publishing any marketing content
- When refreshing existing pages
- To validate positioning against competitor landscape

## Process

### Step 1: Load Intelligence

Read both stored intelligence files:

```
Read: C:\Users\j4cks\.claude\projects\C--OPS\memory\project_competitor_intelligence.md
Read: C:\Users\j4cks\.claude\projects\C--OPS\memory\project_seo_keyword_strategy.md
```

### Step 2: Get the Copy

Ask the user for the copy to audit. This can be:
- A URL to fetch with WebFetch
- A file path to read
- Pasted text directly
- A Figma design URL

### Step 3: Run the Audit

Evaluate the copy against the **Anti-Pattern Checklist** and **Strength Checklist** in `references/audit-criteria.md`.

Score each dimension 1-5 and flag specific issues.

**Critical anti-patterns to catch** (things every competitor does wrong):
1. Generic "all-in-one" or "streamline operations" language
2. Talking to owners/admins instead of crews
3. Feature dumping without connecting to pain points
4. Corporate SaaS tone instead of trade-authentic voice
5. Hidden or unclear pricing
6. "AI-powered" without explaining what AI does
7. Desktop-first framing (mobile as "feature" not core)
8. No trade-specific language

**OPS strengths to verify are present:**
1. Crew-first messaging
2. Specific pain points named (missed calls, slow quotes, text-chain chaos)
3. Trade-authentic tone (direct, professional, not corporate)
4. Mobile-native positioning
5. Transparent pricing/access
6. Glove-friendly / field-reality awareness
7. Multi-trade inclusivity (not just HVAC/plumbing/electrical)

### Step 4: Report

Present the audit as:

```
## Copy Audit Report

### Overall Score: [X/50]

### What's Working
- [Strength with specific quote from copy]

### Anti-Patterns Detected
| Issue | Severity | Where | Recommendation |
|---|---|---|---|
| [Issue] | HIGH/MED/LOW | [Quote or location] | [Specific fix] |

### Missed Opportunities
- [Opportunity based on competitor gaps or keyword strategy]

### Recommended Rewrites
[For each HIGH severity issue, provide a specific rewrite suggestion]

### Competitor Comparison
[How does this copy stack up against what competitors are saying?]
```

### Step 5: Offer Rewrites

After presenting the audit, offer to rewrite specific sections. Apply OPS voice principles:
- Concise and direct — trade workers don't read paragraphs
- Professional but not corporate — tactical, not bureaucratic
- Action-oriented — tell them what to do, not what we do
- All titles UPPERCASE per design system
- Captions in [square brackets]

## OPS Voice Guidelines

**DO say:** "Know where your crew is. Know what's next."
**DON'T say:** "Streamline your workforce management operations."

**DO say:** "One app. Download it today."
**DON'T say:** "Our comprehensive all-in-one platform empowers your business."

**DO say:** "Your crew wears gloves. We built for that."
**DON'T say:** "Mobile-optimized for field technicians."

**DO say:** "$X/month. No demo required."
**DON'T say:** "Contact sales for custom pricing."

## Additional Resources

### Reference Files
- **`references/audit-criteria.md`** — Full scoring rubric with anti-pattern checklist and strength checklist
