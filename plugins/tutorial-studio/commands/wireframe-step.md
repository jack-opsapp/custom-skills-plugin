---
description: Wireframe a specific tutorial step or phase
argument-hint: [phase-name]
---

# Wireframe Step

Wireframe a specific tutorial phase using tutorial-ux-design skill knowledge.

Phase to wireframe: $ARGUMENTS

## Process

1. Load the project design system (check `.interface-design/system.md`)
2. Establish context for this specific phase (screen, overlay state, target element)
3. Map the complete overlay state:
   - Spotlight position and size
   - Tooltip position and content
   - Action bar button configuration
   - Gesture indicator if applicable
4. Generate wireframe variants showing the tutorial overlay on the screen
5. Evaluate each variant:
   - Is the spotlight target clearly visible?
   - Is the tooltip readable and not blocking important content?
   - Is the action bar accessible?
   - Does the progress indicator show correctly?
6. Recommend one variant with reasoning
7. Apply design tokens from the brand file
8. Output a design spec for this phase

If no phase name provided, ask which phase to wireframe.
