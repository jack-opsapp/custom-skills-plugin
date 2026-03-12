# ops-market-intel

Competitive intelligence and SEO research toolkit for OPS — the operational platform for trade workers.

## What It Does

Keeps your market knowledge fresh and actionable. Scan competitors, research keywords, audit your own copy, and generate content briefs — all informed by a shared knowledge base of competitor weaknesses and keyword strategies.

## Components

### Skills (auto-activate on relevant queries)

| Skill | Trigger Phrases | Purpose |
|---|---|---|
| **competitor-scan** | "scan competitors", "check competitor websites", "refresh competitor intel" | Fetch live competitor pages, analyze copy/messaging, diff against stored intelligence |
| **seo-research** | "research keywords", "find SEO opportunities", "what are trade workers searching for" | Pull fresh keyword data from Reddit/X/forums, update strategy |
| **copy-audit** | "audit our copy", "review our landing page", "check our messaging" | Score OPS copy against competitor weaknesses and positioning principles |
| **content-brief** | "write a content brief", "plan a blog post", "SEO content brief" | Generate structured briefs for landing pages, blogs, comparison pages |

### Agent

| Agent | When It Triggers | Purpose |
|---|---|---|
| **market-intel** | Deep-dive research requests for specific verticals or competitors | Autonomous multi-source research with synthesized reports |

### Command

| Command | Usage | Purpose |
|---|---|---|
| `/intel-status` | Anytime | Quick dashboard of intelligence freshness and top opportunities |

## Knowledge Base

All skills share two memory files as persistent intelligence:

- `project_seo_keyword_strategy.md` — Keyword clusters, intent tiers, vertical priorities
- `project_competitor_intelligence.md` — Competitor weaknesses, copy analysis, positioning gaps

Skills read from these files and can update them with fresh findings.

## Installation

```bash
claude --plugin-dir /path/to/ops-market-intel
```

Or symlink into your `.claude/plugins/` directory.

## Recommended Workflow

1. Run `/intel-status` to check data freshness
2. If stale, trigger `competitor-scan` and `seo-research` to refresh
3. Before writing content, use `content-brief` for the target keyword
4. After writing, run `copy-audit` to validate against positioning principles
5. For new verticals or deep questions, use the `market-intel` agent
