---
name: interactive-tool-builder
version: 1.0.0
description: >
  Use when designing interactive learning tools for ops-learn lessons. This includes calculators,
  scenario simulators, comparison tools, decision trees, visual builders, timelines, diagnostic
  assessments, ROI analyzers, scoring matrices, or ANY interactive component that helps students
  engage with course material. Triggers on "create an interactive tool", "build a calculator",
  "add an interactive element", "create a simulator", "build a comparison tool", "design a tool",
  or any task involving interactive learning component creation.
---

# Interactive Tool Builder

## Purpose

Design and create interactive learning tools that go inside lessons as content blocks. Tools create "aha moments" — the student inputs their real numbers or makes real choices and gets personalized insight.

**Tools are NOT graded.** They are purely interactive learning aids. No submissions, no database persistence of inputs.

## Tool Types

This is a non-exhaustive list. Any interactive format that helps the student engage with the material is valid.

### Formula-Driven Tools (config-based)
These use the existing `interactive_tool` content block type with JSONB config. No custom code needed.

- **Calculators**: Input numbers → computed outputs (profit margin, break-even, pricing, ROI)
- **Scenario simulators**: Change one input, see how all outputs shift
- **ROI analyzers**: Multi-variable return calculations
- **Cost comparisons**: Compare two scenarios side-by-side using different input sets

### Custom Component Tools (React/TSX)
These require writing a new React component. Use when the tool needs UI beyond simple inputs/outputs.

- **Decision trees**: Branching question flows with tailored recommendations
- **Visual builders**: Drag/arrange interfaces (schedule builder, org chart, workflow designer)
- **Timeline explorers**: Interactive progress/growth visualizations
- **Diagnostic assessments**: Non-graded self-assessment with personalized feedback
- **Interactive checklists**: Step-by-step process guides with progress tracking
- **Scoring matrices**: Weighted decision frameworks with visual output
- **Before/after comparisons**: Toggle between states
- **Sliders/gauges**: Visual range exploration tools

## Formula-Driven Tool Config

Stored in `content_blocks.content` as JSONB:

```json
{
  "tool_type": "descriptive_snake_case_name",
  "title": "User-Facing Title",
  "description": "One sentence explaining what this tool does and why it's useful.",
  "inputs": [
    {
      "id": "variable_name",
      "label": "Human-Readable Label ($)",
      "type": "currency",
      "placeholder": "2500",
      "default": 0
    }
  ],
  "outputs": [
    {
      "id": "variable_name",
      "label": "Human-Readable Output Label",
      "formula": "math_expression_using_input_ids",
      "format": "currency",
      "highlight": true
    }
  ]
}
```

### Input Types
| Type | Description | Example |
|------|-------------|---------|
| `currency` | Dollar amount, formatted with $ | Job revenue, material costs |
| `number` | Plain number | Hours, crew count, jobs per month |
| `percentage` | Percentage value (user enters 15, means 15%) | Overhead %, markup % |

### Output Formats
| Format | Description |
|--------|-------------|
| `currency` | Formatted as $X,XXX.XX |
| `number` | Plain number with commas |
| `percentage` | Formatted as XX.X% |

### Formula Syntax

Safe math expressions only. **No code execution.**

**Supported operators:** `+` `-` `*` `/` `%` `(` `)` `>` `<` `>=` `<=` `==` `!=` `?` `:`

**Variable references:** Use `id` values from inputs and earlier outputs as variable names.

**Ternary guards:** ALWAYS guard division: `divisor > 0 ? numerator / divisor : 0`

**Examples:**
```
labor_hours * hourly_rate
revenue - total_costs
revenue > 0 ? (profit / revenue) * 100 : 0
profit_per_job > 0 ? monthly_fixed / profit_per_job : 0
(base_salary * 52 / 12) + benefits_monthly + (base_salary * payroll_tax_pct / 100 * 52 / 12)
```

### Complete Working Example

```json
{
  "tool_type": "break_even_calculator",
  "title": "Break-Even Calculator",
  "description": "Find out how many jobs you need per month to cover your fixed costs.",
  "inputs": [
    { "id": "monthly_fixed", "label": "Monthly Fixed Costs ($)", "type": "currency", "placeholder": "5000" },
    { "id": "avg_revenue", "label": "Average Revenue Per Job ($)", "type": "currency", "placeholder": "2500" },
    { "id": "avg_cost", "label": "Average Cost Per Job ($)", "type": "currency", "placeholder": "1200" }
  ],
  "outputs": [
    { "id": "profit_per_job", "label": "Profit Per Job", "formula": "avg_revenue - avg_cost", "format": "currency" },
    { "id": "margin_per_job", "label": "Margin Per Job", "formula": "avg_revenue > 0 ? (profit_per_job / avg_revenue) * 100 : 0", "format": "percentage" },
    { "id": "breakeven_jobs", "label": "Break-Even Jobs/Month", "formula": "profit_per_job > 0 ? monthly_fixed / profit_per_job : 0", "format": "number", "highlight": true },
    { "id": "breakeven_revenue", "label": "Break-Even Revenue/Month", "formula": "breakeven_jobs * avg_revenue", "format": "currency", "highlight": true }
  ]
}
```

## Design Principles

1. **Create an "aha moment"**: The student should see their real numbers and gain insight they didn't have before
2. **Minimal inputs**: 3-6 inputs ideal. More than 8 is overwhelming. Ask only what's needed.
3. **Sensible defaults/placeholders**: Use realistic trades numbers so the tool works even before the student enters their own
4. **Highlight key outputs**: Use `"highlight": true` on the 1-3 most important metrics
5. **Plain language labels**: "Job Revenue ($)" not "Gross Revenue Per Unit"
6. **Guard all division**: Always use ternary to prevent divide-by-zero
7. **Outputs should tell a story**: Order them logically — intermediate calculations first, key insights last

## Custom Component Tools

When the tool needs more than formula-driven inputs/outputs:

1. **Write a React component** in `src/components/tools/ToolName.tsx`
2. **Use OPS design tokens**: `ops-surface`, `ops-border`, `ops-accent`, `ops-text-primary`, `ops-text-secondary`
3. **Use Framer Motion** for animations and transitions
4. **Mobile-first**: Must work on phones (field crews use mobile)
5. **No database persistence**: All state is client-side only
6. **Import into InteractiveTool.tsx**: Add a new `tool_type` case to the switch

For custom tools, the `content_blocks.content` JSONB stores a `tool_type` that maps to the custom component, plus any config the component needs.

## Insert Template (Formula-Driven)

```sql
INSERT INTO content_blocks (lesson_id, type, content, sort_order)
VALUES (
  'LESSON_UUID',
  'interactive_tool',
  '{TOOL_CONFIG_JSON}'::jsonb,
  SORT_ORDER
)
RETURNING id;
```

Use `mcp__plugin_supabase_supabase__execute_sql` with `project_id: "ijeekuhbatykdomumfjx"`.
