# Per-Step Audit Checklist

Copy this template for each wizard step. Fill every row — no "N/A" without justification.

## Step: `[step_id]` — "[INSTRUCTION TEXT]"

### Basic Info

| Field | Value |
|---|---|
| Step index | |
| Target screen | |
| Completion notification | |
| Can skip | |
| Required permission (if any) | |

### Notification Source Trace

| Question | Answer |
|---|---|
| File where notification is posted | |
| Line number | |
| What triggers the post? (user action / lifecycle event) | |
| Can notification fire from a different context? | |
| Can notification fire prematurely? | |
| Can notification fire multiple times? | |

### Role Feasibility Matrix

| Role | Can see target UI? | Can perform action? | Data visible? | Outcome |
|---|---|---|---|---|
| Admin | | | | |
| Owner | | | | |
| Office | | | | |
| Operator | | | | |
| Crew | | | | |
| Unassigned | | | | |

Outcome values: `works` / `auto-skip` / `skip available` / `STUCK` / `N/A`

### Navigation

| Question | Answer |
|---|---|
| Which main tab must be active? | |
| Which sub-tab/section must be active? | |
| Does `navigateToCurrentStep()` handle the sub-tab? | |
| What happens if user is on wrong sub-tab? | |
| Does crew (no section picker) get auto-navigated? | |

### Data Requirements

| Question | Answer |
|---|---|
| What data must exist for this step? | |
| For scoped users, is the data filtered to assigned/own? | |
| What if data exists but is empty? (e.g., 0 closed projects) | |
| What if data is in a terminal state? (e.g., all completed) | |
| Is data check local (SwiftData) or remote (Supabase)? | |

### Edge Cases

| Scenario | What happens? | Severity | Fix needed? |
|---|---|---|---|
| User on wrong tab | | | |
| User on wrong sub-tab | | | |
| User lacks permission for action | | | |
| User has 0 entities | | | |
| All entities in terminal state | | | |
| User performs action on wrong entity type | | | |
| Sheet/modal opens over target | | | |
| User swipe-dismisses a sheet mid-step | | | |
| User backgrounds app during step | | | |
| User force-quits during step | | | |
| Another user modifies data via sync | | | |
| Step action fires notification twice | | | |
| Network offline during data-modifying action | | | |
| Instruction says "scroll" but not enough content | | | |
| Instruction says "swipe" but gesture is disabled | | | |
| `canSkip` is false but action is impossible | | | |

### Findings

| # | Severity | Description | Recommended Fix |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
