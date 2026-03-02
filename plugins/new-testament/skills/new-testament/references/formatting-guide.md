# Software Bible Formatting Guide

## File Header Format

Every bible file begins with:

```markdown
# [Number]: [Title]

**Last Updated**: YYYY-MM-DD
**Status**: Comprehensive Reference | Initial Draft | Needs Review
**Purpose**: One-sentence description of what this file documents

---
```

**Status values:**
- `Comprehensive Reference` — File is complete and verified against source code
- `Initial Draft` — File has been scaffolded but not fully verified
- `Needs Review` — File may have drift from current source code

## Table of Contents

Every file with more than 3 sections includes a TOC:

```markdown
## Table of Contents

1. [Section Name](#section-name)
2. [Another Section](#another-section)
3. [Sub Section](#sub-section)

---
```

Anchor links use GitHub-flavored markdown slugs (lowercase, hyphens for spaces, strip special chars).

## Section Headers

Use `##` for top-level sections, `###` for subsections, `####` sparingly for deep nesting.

Separate major sections with horizontal rules:

```markdown
---

## New Major Section
```

## Tables

Use tables for structured data. Always include a header row:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value    | Value    | Value    |
```

### When to Use Tables

- Data model properties (name, type, nullable, description)
- API endpoints (method, path, params, response)
- Environment variables (name, purpose, required, format)
- Status values (name, color, description)
- Feature comparisons (feature, role A, role B, role C)
- Dependency lists (package, version, purpose)

### When NOT to Use Tables

- Narrative explanations → use paragraphs
- Sequential steps → use numbered lists
- Code examples → use code blocks
- Simple lists → use bullet points

## Code Blocks

Use fenced code blocks with language tags:

````markdown
```swift
struct Project: Identifiable {
    let id: UUID
    var name: String
}
```
````

### When to Use Code Blocks

- Exact color values, constants, and configuration
- Data model definitions
- API request/response examples
- Terminal commands
- File paths and directory structures
- Schema definitions (SQL, GraphQL, etc.)

### Directory Trees

Use indented text with ASCII art:

```
project/
├── src/
│   ├── models/
│   ├── views/
│   └── controllers/
├── tests/
└── config/
```

## Cross-References

Link between bible files using relative markdown links:

```markdown
See [Data Architecture](03_DATA_ARCHITECTURE.md#entity-name) for the complete model definition.

For API endpoint details, refer to [API and Integration](04_API_AND_INTEGRATION.md#endpoint-section).
```

## Diagrams

Use text-based diagrams for architecture and data flow:

```
Client App → API Gateway → Auth Middleware → Route Handler → Database
                                                    ↓
                                              Cache Layer
```

For entity relationships:

```
Company (1) ──── (N) User
Company (1) ──── (N) Project
Project (1) ──── (N) Task
Project (N) ──── (1) Client
```

## Changelog Format

Every bible file ends with a changelog table:

```markdown
---

## Changelog

| Date | Change | Commit |
|------|--------|--------|
| 2026-02-28 | Added Stripe integration section | a1b2c3d |
| 2026-02-27 | Updated data model with new fields | e4f5g6h |
| 2026-02-26 | Initial creation | i7j8k9l |
```

Rules:
- Most recent entries at the top
- Date in `YYYY-MM-DD` format
- Change description is concise (one line)
- Commit is the short hash (7 chars) of the commit that triggered the update
- Only log meaningful changes, not typo fixes

## Writing Style

- **Declarative, not narrative** — "The Project model has 12 properties" not "We created a Project model with..."
- **Present tense** — "The API returns JSON" not "The API will return JSON"
- **Specific, not vague** — "#417394 (steel blue)" not "a blue color"
- **Exact values** — Include actual hex codes, actual endpoint paths, actual env var names
- **No marketing language** — Technical documentation, not sales copy

## Content Density

- **Dense but scannable** — Use headers, tables, and code blocks to break up walls of text
- **No fluff** — Every sentence adds information
- **No redundancy** — Say it once, in the right place, and cross-reference from elsewhere
- **Complete** — Don't leave gaps with "TODO" or "TBD" — either document it or note it as unknown

## Env Var Section Format

```markdown
### Environment Variables

| Variable | Purpose | Required | Format | Files |
|----------|---------|----------|--------|-------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://...` | `src/db.ts` |
| `STRIPE_SECRET_KEY` | Stripe API key | Yes | `sk_...` | `src/payments.ts` |
| `LOG_LEVEL` | Logging verbosity | No | `debug\|info\|warn\|error` | `src/logger.ts` |
```

## Model/Entity Section Format

```markdown
### EntityName

**Source**: `path/to/model/file.ext`
**Table**: `table_name` (if database-backed)

| Property | Type | Nullable | Description |
|----------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `name` | String | No | Display name |
| `createdAt` | DateTime | No | Creation timestamp |
| `deletedAt` | DateTime | Yes | Soft delete marker |

**Relationships:**
- `EntityName` (1) → (N) `RelatedEntity` via `foreignKeyField`

**Computed Properties:**
- `isActive`: `deletedAt == nil`
```

## API Endpoint Section Format

```markdown
### GET /api/projects/:id

**Auth**: Required (Bearer token)
**Params**: `id` (UUID, path)
**Query**: `include` (optional, comma-separated: `tasks,client,notes`)

**Response** (200):
```json
{
  "id": "uuid",
  "name": "Project Name",
  "status": "active",
  "tasks": [...]
}
```

**Errors**:
- `401` — Not authenticated
- `403` — Not authorized for this project
- `404` — Project not found
```
