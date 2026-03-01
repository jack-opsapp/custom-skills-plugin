---
description: Generate tutorial implementation code from approved design
argument-hint: [path-to-design-doc]
---

# Generate Tutorial

Generate implementation code from an approved Tutorial Design Document.

Design document: $ARGUMENTS

If no path provided, search for the most recent tutorial design document in docs/ (files matching `tutorial-design-*.md` or containing "Tutorial Design Document").

## Process

1. Read and validate the design document (must contain Flow Specification with phase table)
2. Ask which platforms to generate: **iOS (SwiftUI)**, **Web (React/Next.js)**, or **Both**
3. For iOS: launch the **ios-tutorial-builder** agent
   - Generate TutorialPhase enum, StateManager, Wrapper, UI components
   - Include analytics instrumentation
   - Follow existing SwiftUI patterns
4. For Web: launch the **web-tutorial-builder** agent
   - Generate phase config, state hook, shell component, mock components
   - Include analytics tracking hooks
   - Follow existing Next.js patterns
5. Present all generated code for review before writing to files
6. After approval, write files to the project

Both builders read the same design spec and produce platform-appropriate implementations with feature parity.
