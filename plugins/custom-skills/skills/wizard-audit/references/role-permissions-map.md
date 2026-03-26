# OPS Role-Permission Map for Wizard Audits

Complete reference for which roles can perform which actions. Use this during Phase 3 of the audit.

## Role Hierarchy

| Role | Hierarchy | Wizard Tier | Description |
|---|---|---|---|
| Admin | 1 | Admin | Full system access including billing and role assignment |
| Owner | 2 | Admin | Full access except billing and role assignment |
| Office | 3 | Office | Full project and financial access. No company settings |
| Operator | 4 | Office | Lead tech. Scoped to assigned work. Creates estimates |
| Crew | 5 | Field | Field-only. Views and edits assigned work |
| Unassigned | 6 | Field | New team member. Role not yet set by admin |

## Tab Visibility

| Tab | Admin | Owner | Office | Operator | Crew | Unassigned |
|---|---|---|---|---|---|---|
| Home | Yes | Yes | Yes | Yes | Yes | Yes |
| Pipeline | Yes | Yes | Yes | No | No | No |
| Job Board | Yes | Yes | Yes | Yes | Yes | Yes |
| Inventory | Yes | Yes | Yes | No | No | No |
| Schedule | Yes | Yes | Yes | Yes | Yes | Yes |
| Settings | Yes | Yes | Yes | Yes | Yes | Yes |

## Job Board Sections

| Section | Admin | Owner | Office | Operator | Crew | Unassigned |
|---|---|---|---|---|---|---|
| PROJECTS | Default | Default | Default | Yes | No | No |
| TASKS | Yes | Yes | Yes | Yes | No | No |
| BOARD (Kanban) | Yes | Yes | Yes | Yes | No | No |
| MY TASKS | No | No | No | No | Default | Default |
| MY PROJECTS | No | No | No | No | Yes | Yes |
| Section picker visible | Yes | Yes | Yes | Yes | **No** | **No** |

**Key**: Crew and Unassigned have NO section picker. They see MY TASKS + MY PROJECTS with MY TASKS as default.

**Permission controlling sections**: `job_board.manage_sections`

## Project & Task Permissions

| Permission | Admin | Owner | Office | Operator | Crew | Unassigned |
|---|---|---|---|---|---|---|
| `projects.view` | all | all | all | all | assigned | assigned |
| `projects.edit` | all | all | all | assigned | **No** | **No** |
| `projects.create` | Yes | Yes | Yes | Yes | No | No |
| `projects.delete` | Yes | Yes | No | No | No | No |
| `tasks.view` | all | all | all | all | assigned | assigned |
| `tasks.edit` | all | all | all | assigned | assigned | No |
| `tasks.change_status` | all | all | all | assigned | assigned | No |
| `tasks.create` | Yes | Yes | Yes | Yes | No | No |

## Financial Permissions

| Permission | Admin | Owner | Office | Operator | Crew | Unassigned |
|---|---|---|---|---|---|---|
| `pipeline.view` | Yes | Yes | Yes | No | No | No |
| `estimates.create` | Yes | Yes | Yes | Yes | No | No |
| `expenses.create` | Yes | Yes | Yes | Yes | Yes | No |
| `expenses.approve` | Yes | Yes | Yes | No | No | No |
| `finances.view` | Yes | Yes | Yes | No | No | No |

## System Permissions

| Permission | Admin | Owner | Office | Operator | Crew | Unassigned |
|---|---|---|---|---|---|---|
| `job_board.manage_sections` | Yes | Yes | Yes | Yes | **No** | **No** |
| `settings.company` | Yes | Yes | No | No | No | No |
| `settings.billing` | Yes | No | No | No | No | No |
| `team.assign_roles` | Yes | No | No | No | No | No |
| `team.invite` | Yes | Yes | Yes | No | No | No |
| `inventory.view` | Yes | Yes | Yes | No | No | No |
| `inventory.manage` | Yes | Yes | Yes | No | No | No |
| `crew_location.view` | Yes | Yes | No | No | No | No |

## FAB (Floating Action Button) Visibility

| Context | Admin | Owner | Office | Operator | Crew |
|---|---|---|---|---|---|
| Home tab | Yes | Yes | Yes | Yes | No |
| Job Board tab | Yes | Yes | Yes | Yes | No |
| Schedule tab | Yes | Yes | Yes | Yes | **Yes** (personal events only) |
| Inventory tab | Yes | Yes | Yes | N/A | N/A |
| Project Details | Yes | Yes | Yes | Yes | No |
| Settings tab | No | No | No | No | No |
| Pipeline tab | Yes | Yes | Yes | N/A | N/A |

## Swipe Capabilities

| Entity | Admin | Owner | Office | Operator | Crew | Gate |
|---|---|---|---|---|---|---|
| Swipe project status | Yes | Yes | Yes | Assigned only | **No** | `projects.edit` |
| Swipe task status | Yes | Yes | Yes | Assigned only | Assigned only | `tasks.change_status` |
| Swipe estimate | Yes | Yes | Yes | Own only | No | `estimates.create` |
| Swipe invoice | Yes | Yes | Yes | No | No | `finances.view` |

## Scope Filtering Impact

When a permission has scope `assigned` or `own` instead of `all`:

| Scope | Effect on Data |
|---|---|
| `all` | User sees all company data |
| `assigned` | User sees only entities where they are in `teamMembers` |
| `own` | User sees only entities they created |

**Critical for wizard audits**: When checking "does the user have projects?", check ASSIGNED project count for crew/operator, not total company count.
