---
name: new-testament
description: This skill should be used when creating, auditing, or updating a software bible — a comprehensive, authoritative project reference document. Applies when the user asks to "create a software bible", "document this project", "generate project documentation", "update the bible", "audit documentation", "create a project reference", or mentions "software bible" or "codebase documentation".
---

# New Testament — Software Bible Maintenance

## Overview

Zero-touch software bible maintenance. When this skill is present, a `[project-name]-software-bible/` directory materializes at the project root and stays perfectly current. No manual invocation required.

A software bible is the single authoritative reference for a software project. Any question about the project — architecture, features, API endpoints, data flow, dependencies, env vars — can be answered by reading it. From it, a pitch deck, feature plan, or onboarding guide can be written.

## How It Works

### Automatic Mode (Primary)

A PostToolUse hook detects every `git commit` command. When triggered:

1. The `bible-updater` agent (sonnet, background) is spawned
2. Agent reads the commit diff to identify what changed
3. If no bible exists → full codebase scan, scaffold entire bible
4. If bible exists → update only affected sections
5. Per-file changelog appended to each modified file
6. Auto-committed: `docs: update software bible`

The user never interacts with this process. It runs in the background after every commit.

### Manual Audit

Invoke manually for a full audit or to rebuild from scratch. Read the bible directory, compare against the current codebase, and reconcile any drift.

## Bible Structure

Standard files, created only when relevant to the project:

| # | File | Covers |
|---|------|--------|
| — | `README.md` | Index, quick reference, stats |
| 00 | `EXECUTIVE_SUMMARY.md` | What, who, stack, key stats |
| 01 | `PRODUCT_REQUIREMENTS.md` | Features, stories, rules |
| 02 | `USER_EXPERIENCE.md` | Flows, screens, interactions |
| 03 | `DATA_ARCHITECTURE.md` | Models, schemas, relationships, migrations |
| 04 | `API_AND_INTEGRATION.md` | Endpoints, auth, sync, third-party |
| 05 | `DESIGN_SYSTEM.md` | Colors, type, components, layout |
| 06 | `TECHNICAL_ARCHITECTURE.md` | Code structure, patterns, state |
| 07 | `SPECIALIZED_FEATURES.md` | Complex feature deep-dives |
| 08 | `DEPLOYMENT_AND_OPERATIONS.md` | Build, env vars, CI/CD, ops |
| 09 | `ECOSYSTEM_AND_DEPENDENCIES.md` | Sub-projects, services, packages, deps |

## Key Capabilities

The `bible-updater` agent automatically:
- **Maps changed files to correct bible sections** based on file type and path
- **Queries Supabase** (when available) for tables, migrations, edge functions, and schema
- **Maintains a complete env var registry** in `08_DEPLOYMENT_AND_OPERATIONS.md` to prevent duplicates
- **Cross-references** Supabase schema with local model definitions to catch drift

## Formatting Rules

See `references/formatting-guide.md` for the complete formatting specification.

Core rules:
- Every file has: title, Last Updated, Status, Purpose, TOC, content, changelog
- Use tables for structured data (models, endpoints, env vars)
- Use code blocks for exact values (colors, constants, commands)
- Cross-reference between files with markdown links
- Changelog table at the bottom of every file

## Principles

1. **Code is truth** — Read source, never guess
2. **Zero-context assumption** — A stranger can understand the full project
3. **Only document what exists** — No aspirational content
4. **Byte-perfect accuracy** — Exact values from source
5. **Cross-reference** — Link related sections across files
6. **No secrets** — Never document actual API keys or credentials

## Additional Resources

### Reference Files

- **`references/bible-structure.md`** — Complete templates for all bible files with section starters
- **`references/formatting-guide.md`** — Formatting rules, header format, table conventions, changelog format
