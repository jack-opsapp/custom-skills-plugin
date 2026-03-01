---
description: Analyze a codebase for tutorial opportunities
argument-hint: [path-to-project]
---

# Analyze App

Activate the app-analyzer skill knowledge to scan and analyze the target codebase.

Target project: $ARGUMENTS

If no path provided, analyze the current working directory.

## Process

Follow the app-analyzer skill process:
1. Identify the platform (iOS, web, or both)
2. Map all user-facing screens with descriptions
3. Identify navigation patterns and hierarchy
4. Map the core user journey from entry to value
5. Catalog all interactive elements (forms, buttons, gestures, navigation)
6. Identify the "aha moment" — the action where user first gets value
7. Detect existing tutorial or onboarding code
8. Score complexity (1-5)

Output the structured App Profile document.

## Next Steps

After completion, suggest next steps:
- "Run /audit-tutorial to score an existing tutorial against best practices"
- "Run /design-tutorial to design a new tutorial flow from this analysis"
