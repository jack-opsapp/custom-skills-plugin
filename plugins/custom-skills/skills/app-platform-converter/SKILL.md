---
name: app-platform-converter
description: Use when converting a mobile app from one platform to another — iOS to Android, Android to iOS, or other cross-platform migrations. Triggers on "convert this app", "port to Android", "build an Android version", "convert Swift to Kotlin", or when user points at a source project directory and asks to migrate it to a different platform.
---

# App Platform Converter

## Overview

Converts a mobile app from one platform/language to another using a two-phase pipeline: plan first, execute second. Produces production-ready output files and a living translation log.

**Announce at start:** "I'm using the app-platform-converter skill."

```
Phase 0: Setup  →  Phase 1: Analyze & Plan  →  Phase 2: Execute
                    (skip if plan exists)
```

---

## Phase 0: Project Setup

### 1. Detect source platform

Glob the project root for these markers:

| Detected | Source platform |
|---|---|
| `*.xcodeproj`, `*.xcworkspace`, `Package.swift` | iOS/Swift |
| `build.gradle`, `AndroidManifest.xml` | Android/Kotlin |
| `package.json` + `react-native` in deps | React Native |
| `pubspec.yaml` | Flutter |

Announce: "I can see this is an [platform] project."

### 2. Confirm target

Ask: "What's the target platform? (e.g. Kotlin + Jetpack Compose, SwiftUI + SwiftData)"

### 3. Load reference file

Based on source → target, read the full reference file before doing anything else:

| Conversion | Reference file |
|---|---|
| iOS → Android | `references/ios-to-android.md` |
| Android → iOS | `references/android-to-ios.md` |

**REQUIRED:** Read the full reference file now. Do not rely on general knowledge for pattern mappings — use the reference. This is where OPS-specific rules live.

### 4. Discover existing plan

Check in order:
1. `.conversion/config.md`
2. `android-plan-v2/`, `android-plan/`, or any `*-plan*/` directory at project root
3. `conversion-config.md` at project root

- **Found:** Confirm with user: "I found a conversion plan at `[path]`. Use this?" — wait for confirmation.
- **Not found:** Proceed to Phase 1.

---

## Phase 1: Analysis & Planning

*Skip entirely if Phase 0 found and confirmed a plan.*

### Step 1: Confirm paths

Ask:
- "What is the source project path?"
- "Where should the target project be created?"
- "Any known constraints or preferences?"

### Step 2: Dispatch analysis agent

Use Task tool (subagent_type=Explore) to analyze the source project and return:
- Full directory tree with file count by type
- Architecture pattern (MVVM, MVC, etc.)
- All data models and their properties
- Networking: base URLs, endpoints, auth pattern
- UI component inventory
- Third-party dependencies with versions
- Assets: fonts, color values, image assets
- Build configuration

### Step 3: Generate plan docs

Write to `[target-path]/.conversion/`:
- `config.md` — project configuration (paths, platforms, constraints)
- `file-mapping.md` — source path | target path | layer | status
- `library-substitutions.md` — source library → target equivalent
- `critical-notes.md` — gotchas, known issues, items requiring manual review

### Step 4: Human review gate

Present this summary and **STOP**:

```
Conversion Plan Summary
-----------------------
Source: [path] ([N] files, [platform])
Target: [path] ([platform])
Files to convert: N  |  N/A (platform-specific): N
Key substitutions: [list top 5]
Critical notes: [list all]

Ready to proceed with Phase 2? (yes/no)
```

Do not write any target code until the user explicitly confirms.

---

## Phase 2: Execution

### Layer order — sequential between layers, parallel within

```
Layer 1: Build system     → Gradle, manifest, project structure, dependencies
Layer 2: Data             → Entities, DAOs, repositories, DTOs, enums
Layer 3: Network          → API service, interceptors, auth, sync
Layer 4: Business logic   → ViewModels, managers, services, utilities
Layer 5: UI foundation    → Theme, design system, shared components
Layer 6: Screens          → Individual screen implementations
Layer 7: Resources        → Assets, fonts, strings, drawables
Layer 8: Infrastructure   → DI modules, navigation graph, workers
```

### Dispatch per layer

For each layer:
1. Identify all files in this layer from `file-mapping.md`
2. Dispatch one subagent per file (or logical group) **in parallel** using Task tool
3. Wait for all agents in the layer to complete before starting the next layer
4. Collect translation log entries, append to `conversion-log.md`
5. Run layer verification checklist before proceeding

### Per-agent instructions

Each conversion subagent must:
1. Read the source file completely
2. Read the loaded reference file for all pattern mappings — do not rely on general knowledge
3. Read `.conversion/config.md` for project-specific conventions
4. Write a **complete, production-ready** target file — no TODOs, no stubs, no placeholders
5. Return a translation log entry:
   ```
   | [source file] | [target file] | ✅ Done | [key decisions, comma-separated] |
   ```

### Layer verification checklist

After each layer, confirm before proceeding:
- [ ] All expected files exist at correct target paths
- [ ] No source-platform idioms remain in target code
- [ ] Files follow target platform conventions from reference file
- [ ] Translation log updated with all entries for this layer

---

## Outputs

### `conversion-log.md` (target project root)

Updated after every file converted:

```markdown
# Conversion Log: [source] → [target]
Generated: YYYY-MM-DD | [source platform] → [target platform]

## Progress
Total: N | Converted: N | Pending: N | N/A: N

## File Status
| Source File | Target File | Status | Key Decisions |
|-------------|-------------|--------|---------------|

## Global Translation Decisions
[Decisions applied across all files]
```

### `.conversion/config.md`

Reusable project config. Phase 0 loads this on future runs — no re-analysis needed.

---

## Adding New Conversion Paths

1. Create `references/[source]-to-[target].md` following the same structure as `ios-to-android.md`
2. Add a row to the reference lookup table in Phase 0, Step 3
3. Core SKILL.md needs no other changes
