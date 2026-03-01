---
name: app-analyzer
description: This skill should be used when the user asks to "analyze an app for tutorial opportunities", "scan a codebase for onboarding", "map app features and flows", "identify tutorial opportunities", "create an app profile", or needs to understand an app's architecture before designing a tutorial.
---

# App Analyzer

## Purpose

Serve as the first step in every tutorial production pipeline. Scan a codebase to map its features, screens, user flows, navigation architecture, and interactive elements into a structured App Profile document. This profile becomes the foundation for every downstream skill — onboarding strategy, flow architecture, copywriting, animations, and auditing all depend on a complete and accurate App Profile.

Never skip this step. Never assume the shape of an app without running the analysis. An incomplete or inaccurate profile cascades errors through the entire pipeline.

---

## Analysis Process

### Step 1: Identify Platform

Determine the platform by checking for platform-specific markers in the project root and subdirectories.

**iOS indicators:**
- `.xcodeproj` or `.xcworkspace` directories
- `.swift` files
- `Info.plist`
- `Package.swift` (SwiftPM)
- `Podfile` or `Cartfile`

**Web indicators:**
- `package.json` with framework dependencies (React, Next.js, Vue, Angular, Svelte)
- `next.config.js` / `next.config.ts`
- `vite.config.ts`
- `tsconfig.json` or `jsconfig.json`
- `public/index.html` or `app/layout.tsx`

**Cross-platform indicators:**
- Both iOS and web markers present
- React Native (`react-native` in package.json, `.tsx` files alongside iOS native code)
- Flutter (`pubspec.yaml`, `.dart` files)

Record the platform as `iOS`, `Web`, `Cross-Platform (React Native)`, `Cross-Platform (Flutter)`, or `Both (native iOS + web)`. If both a native iOS app and a web app exist in the same repository, treat them as separate analysis targets and produce two screen tables.

### Step 2: Map Screens

Enumerate every user-facing screen in the application. The technique differs by platform.

**For SwiftUI (iOS):**
- Scan all files ending in `View.swift` or containing `struct ... : View`.
- Check directories named `Views/`, `Screens/`, `Pages/`, `Features/`.
- Look for `NavigationStack`, `NavigationView`, `TabView`, `.sheet`, `.fullScreenCover` to find screens presented modally or via navigation.
- Exclude internal component files (cells, rows, buttons) — only list top-level screens a user would perceive as a distinct page.

**For Next.js (Web):**
- Scan `app/` directory for `page.tsx` or `page.js` files. Each represents a route/screen.
- Scan `pages/` directory if using Pages Router.
- Check for dynamic routes (`[slug]`, `[id]`).
- Look for modal/dialog components that function as virtual screens (e.g., form sheets, detail overlays).

**For React (non-Next.js):**
- Check router configuration (`react-router-dom`, `@tanstack/router`).
- Scan for route definitions to enumerate pages.
- Check `src/pages/`, `src/views/`, `src/screens/`.

For each screen, record:
- **Name**: the component/view name and the route (if web)
- **Description**: one sentence describing what the user sees and does on this screen
- **Interactive Elements**: count and type (forms, buttons, gestures, pickers, toggles)

### Step 3: Identify Navigation

Determine the primary navigation pattern and document the hierarchy.

**iOS navigation patterns to detect:**
- `TabView` — bottom tab bar (check for `.tabItem` modifiers, count tabs)
- `NavigationStack` / `NavigationView` — hierarchical push/pop
- `NavigationSplitView` — sidebar + detail (iPad/Mac)
- `.sheet` / `.fullScreenCover` — modal presentation
- Custom navigation (state-driven view switching)

**Web navigation patterns to detect:**
- Tab bar components (bottom or top)
- Sidebar/drawer navigation
- Header navigation with dropdowns
- Breadcrumb hierarchies
- Route-based navigation (check router config for nesting)

Document: the navigation type, the number of top-level destinations, the maximum navigation depth (how many screens deep a user can push), and whether navigation is persistent (always visible) or contextual (appears on certain screens).

### Step 4: Map Core User Journey

Trace the path a first-time user takes from app launch to first value delivery. This is the critical path — the shortest route to the aha moment.

Process:
1. Start at the entry point (launch screen, landing page, or post-login home screen).
2. Identify the first meaningful action the app expects (create something, view something, interact with something).
3. Follow the screen transitions required to complete that action.
4. Note each screen, the action taken on it, and the transition to the next.
5. Count total taps/clicks required.
6. Count total time estimated (assume 3-5 seconds per screen for reading + action).

Format the journey as a linear flow:
`[Entry] → [Screen 1: action] → [Screen 2: action] → ... → [Value Delivery]`

If the app has role-based or goal-based branching (e.g., "owner" vs "crew member"), map the primary path first, then note branching points.

### Step 5: Catalog Interactive Elements

Perform a comprehensive inventory of every interactive element type in the app. Organize by category:

- **Forms**: list each form, its field count, field types (text, email, phone, date, picker, toggle), and validation rules if visible.
- **Primary Action Buttons**: buttons that drive the core workflow (Create Project, Submit, Save, Send).
- **Secondary Actions**: edit, delete, archive, share, export.
- **Gestures** (iOS): swipe-to-delete, drag-to-reorder, pinch-to-zoom, long-press context menus, pull-to-refresh.
- **Pickers and Selectors**: date pickers, color pickers, dropdown menus, segmented controls, multi-select.
- **Modals and Sheets**: bottom sheets, alerts, confirmation dialogs, full-screen modals.
- **Navigation Actions**: back buttons, tab switches, deep links, search.
- **Media**: camera capture, photo library access, file upload, document scanning.
- **Maps and Location**: map views, location pins, address autocomplete.

This catalog directly informs which tutorial interactions are possible and which are most important to teach.

### Step 6: Identify the Aha Moment

Determine the single action where the user first receives meaningful value from the app. This is the most important output of the analysis — every tutorial strategy optimizes for reaching this moment as fast as possible.

Guidelines by app category:

| App Type | Typical Aha Moment |
|----------|-------------------|
| Project Management | Creating the first project and seeing it appear in the list |
| Scheduling / Calendar | Seeing a populated schedule with real or sample data |
| Communication / Messaging | Sending and receiving a first message |
| E-Commerce / Marketplace | Finding a desired item and adding to cart |
| SaaS Dashboard | Seeing first data insight or report populated |
| Social / Content | Publishing first post and receiving first interaction |
| Finance / Budgeting | Seeing all accounts aggregated in one view |
| Fitness / Health | Completing first workout or logging first meal |
| Education / Learning | Completing first lesson and seeing progress |

To identify the aha moment precisely:
1. Ask: "What is the one thing this app does that nothing else does as well?"
2. Ask: "At what point does a user say 'okay, this is useful'?"
3. The aha moment is always an ACTION (verb), not a screen (noun). "Creating a project" not "the project list."

Record the specific action, the value delivered to the user, and the estimated time from app launch to reaching this moment.

### Step 7: Detect Existing Onboarding/Tutorial Code

Search the codebase for any existing onboarding, tutorial, or walkthrough implementation.

Search terms (case-insensitive):
- `tutorial`, `onboarding`, `walkthrough`, `coach`, `tooltip`, `spotlight`, `overlay`, `coachmark`
- `first_launch`, `firstLaunch`, `isFirstTime`, `hasSeenTutorial`, `onboardingComplete`
- `TutorialPhase`, `OnboardingStep`, `WalkthroughState`
- `progress`, `checklist` (in onboarding context)

For each match, record:
- File path and line number
- Type (full tutorial system, simple tooltip, feature callout, onboarding modal)
- Number of phases/steps
- Flow type: linear (step 1 → 2 → 3), branching (role-based paths), or contextual (triggered by user action)
- Whether it uses real app views or mock/placeholder screens
- Whether analytics events are tracked

### Step 8: Score Complexity

Assign a complexity score from 1 to 5 based on the analysis:

| Score | Criteria |
|-------|----------|
| 1 | Single-screen utility. 0-1 forms. No navigation. (Calculator, timer, converter) |
| 2 | 3-5 screens, linear flow. Simple navigation. 1-2 forms. (Simple to-do, note app) |
| 3 | 5-10 screens with tab or stack navigation. 3-5 forms. Multiple interactive element types. (Habit tracker, simple project tool) |
| 4 | 10-20 screens, multi-flow navigation. Role-based views. 5-10 forms. Complex interactions (gestures, maps, media). (Project management, scheduling platform) |
| 5 | 20+ screens, complex branching flows. Multiple user roles. 10+ forms. Integrations, real-time features, advanced interactions. (Enterprise SaaS, marketplace, social platform) |

Justify the score in one sentence referencing the specific counts from the analysis.

---

## Output Format

Produce the App Profile in exactly this structure. Do not omit sections. If a section has no findings, state "None detected" rather than removing it.

```markdown
## App Profile

**Platform:** [iOS / Web / Cross-Platform / Both]
**Complexity:** [1-5] — [one-line justification]

### Screens
| Screen | Description | Interactive Elements |
|--------|-------------|---------------------|
| [ScreenName] | [One-sentence description] | [count and types] |

### Navigation
- **Type:** [tab bar / sidebar / stack / drawer / hybrid]
- **Top-level destinations:** [count]
- **Max depth:** [number of levels]
- **Structure:** [describe hierarchy — e.g., "Tab bar with 4 tabs; each tab has a NavigationStack allowing 2-3 levels of push"]

### Core User Journey
[Entry] → [Screen 1: action] → [Screen 2: action] → ... → [Value Delivery]

**Total interactions:** [count]
**Estimated time:** [seconds]

### Aha Moment
**Action:** [specific user action, as a verb phrase]
**Value delivered:** [what the user gets or sees]
**Estimated time from launch:** [seconds]

### Existing Tutorial
**Found:** [Yes / No]
**Location:** [file paths, or "N/A"]
**Phase count:** [number, or "N/A"]
**Flow type:** [linear / branching / contextual / none]
**Uses real views:** [Yes / No / N/A]
**Analytics tracked:** [Yes / No / N/A]

### Interactive Elements Catalog
- **Forms:** [list each form with field count and types]
- **Primary actions:** [list of main action buttons]
- **Secondary actions:** [list]
- **Gestures:** [list with gesture types]
- **Pickers/Selectors:** [list with types]
- **Modals/Sheets:** [list with trigger context]
- **Media:** [list or "None"]
- **Maps/Location:** [list or "None"]
```

---

## Multi-Platform Handling

When the codebase contains both an iOS app and a web app:

1. Produce separate screen tables for each platform.
2. Note feature parity gaps — features present on one platform but not the other.
3. Note platform-specific interactions that affect tutorial design (gestures on iOS, hover states on web, keyboard shortcuts on desktop).
4. Identify shared aha moment — verify it is the same on both platforms. If different, document both.
5. Produce a single unified App Profile with platform-specific subsections rather than two separate profiles.

---

## Tips by App Category

- **SaaS Dashboards**: Focus on data sources. The aha moment is almost always seeing real or realistic data visualized. Map data input flows carefully — they are often the highest-friction part.
- **Project Management**: The aha moment is creating the first project/task and seeing it organized. Pay special attention to form complexity — project creation forms with 10+ fields are a tutorial risk.
- **Social / Messaging**: The aha moment requires another party (message recipient, follower). Determine whether the app provides simulated interactions or requires real contacts. This fundamentally changes tutorial strategy.
- **E-Commerce / Marketplace**: Browse-before-signup is critical. Map the guest flow separately from the authenticated flow. The aha moment is finding a desired item, not completing purchase.
- **Scheduling / Calendar**: The aha moment is seeing populated time slots. Determine whether the app pre-populates sample data or requires manual entry. Empty calendar syndrome is a major retention killer.

---

## After Completion

Once the App Profile is complete, inform the user that it is ready for downstream use. The immediate next steps are:
- **Onboarding Strategist** — to design the onboarding strategy based on this profile
- **Tutorial Auditor** — if existing tutorial code was detected, to score it against best practices
- **Flow Architect** — to design the phase-by-phase tutorial flow

Do not proceed to downstream skills automatically. Present the completed profile and ask the user which direction to take next.
