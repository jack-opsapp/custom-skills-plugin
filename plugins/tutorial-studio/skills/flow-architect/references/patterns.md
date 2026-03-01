# Tutorial Flow Patterns

Eight proven tutorial flow patterns for onboarding design. Each pattern includes a description, when to use it, when NOT to use it, implementation steps, and platform considerations for iOS and web.

---

## 1. Progressive Disclosure

### Description

Reveal features in layers rather than all at once. Layer 1 covers core CRUD operations — the minimum a user needs to get value. Layer 2 introduces team and collaboration features. Layer 3 covers advanced features, reporting, and customization. Each layer is a separate tutorial session or unlockable section.

### When to Use

- The app has 10+ features and showing them all at once would overwhelm
- Features have natural dependency chains (create a project before assigning crew)
- Users have varying expertise levels — beginners need Layer 1 only, power users advance faster
- Retention strategy calls for sustained engagement over days, not just day-one activation

### When NOT to Use

- The app has fewer than 6 features — progressive disclosure adds unnecessary complexity
- All features are equally important with no hierarchy
- Users need full capability immediately (e.g., emergency response tools)

### Implementation Steps

1. Categorize every feature into Layer 1 (core), Layer 2 (collaboration), or Layer 3 (advanced).
2. Design a complete tutorial flow for Layer 1 only. Target 6-10 phases, 30-60 seconds.
3. At Layer 1 completion, show a celebration phase that teases Layer 2: "Next up: learn to collaborate with your crew."
4. Gate Layer 2 behind a trigger: completion of Layer 1 + at least one real action (e.g., created a real project).
5. Repeat for Layer 3. Gate behind Layer 2 completion + usage milestone (e.g., 3 projects created).
6. Track layer completion in user state. Allow re-entry to any completed layer.

### Platform Considerations

- **iOS:** Store layer completion in UserDefaults or the tutorial state manager. Use notification-style prompts to trigger Layer 2/3.
- **Web:** Store in localStorage or user profile API. Show a banner or modal to trigger next layers. Consider email nudges for Layer 2/3 if the user does not return within 48 hours.

---

## 2. Contextual Trigger

### Description

Guidance appears in response to user behavior rather than following a fixed sequence. Instead of a linear walkthrough, the system monitors for trigger conditions and shows the relevant tutorial phase at the right moment. Triggers include first-time feature opens, idle periods, and interaction with unfamiliar UI elements.

### When to Use

- Users arrive with varying levels of experience — a fixed flow would bore experts
- The app has exploration-driven navigation (no single correct path)
- The primary goal is reducing support tickets for specific confusing features
- Re-engagement is needed for users who completed the initial tutorial but missed features

### When NOT to Use

- The app requires a specific setup sequence (account config, permissions, initial data entry)
- First-time experience must be controlled for compliance or safety reasons
- The tutorial needs to deliver a specific narrative arc with emotional payoff

### Implementation Steps

1. Define trigger conditions as a list: `{ feature: "calendar", trigger: "first-open", phase: "calendar-intro" }`.
2. Track feature-first-use flags in a dictionary: `{ "calendar-opened": false, "project-created": false }`.
3. On each trigger condition match, show the relevant phase with a tooltip and spotlight.
4. Mark the trigger as consumed after the phase completes or is skipped.
5. Set a global cooldown — do not show more than one triggered phase per 60-second window to avoid annoyance.
6. Implement idle detection: if the user is on a screen for more than 10 seconds without interaction, check if there is an unshown phase for that screen.

### Platform Considerations

- **iOS:** Use view lifecycle hooks (`onAppear`) to detect first-time screen visits. Store trigger state in the tutorial state manager.
- **Web:** Use route change listeners or intersection observers. Store trigger state in a React context or global store. Consider showing triggers as non-blocking toasts rather than modal overlays to match web conventions.

---

## 3. Empty State as Onboarding

### Description

Empty screens become the tutorial. Instead of an overlay walkthrough, each empty screen contains guidance copy, an illustration, and a CTA that teaches the user what belongs here and how to fill it. The tutorial is the empty state itself — once the user creates content, the tutorial naturally disappears.

### When to Use

- The app's value is only clear once the user has created their own data
- The tutorial needs to feel embedded, not layered on top
- The product is content-driven (projects, documents, schedules)
- Minimizing tutorial engineering effort — empty states are needed anyway

### When NOT to Use

- The app has pre-populated data (demo content, templates) that prevents empty states
- Multiple features need to be taught that are not tied to empty screens
- The user needs to understand navigation and structure before creating content

### Implementation Steps

1. Identify every screen that can be empty on first use (job board, calendar, crew list, etc.).
2. For each empty screen, write copy using the formula: **2 parts instruction + 1 part delight + CTA**.
   - Instruction part 1: What belongs on this screen ("This is where your projects live.")
   - Instruction part 2: Why it matters ("Track every job from bid to completion.")
   - Delight: A light touch of personality or illustration
   - CTA: The exact action to take ("Tap + to create your first project")
3. Design the empty state component: centered layout, illustration or icon at top, copy below, primary CTA button at bottom.
4. Wire the CTA to the creation flow. On successful creation, the empty state disappears and the real content takes its place.
5. Track which empty states the user has seen and acted on. Use this data for engagement metrics.

### Platform Considerations

- **iOS:** Use a reusable `EmptyStateView` component. Include Lottie animation or SF Symbol illustration. CTA button follows the app's primary button style.
- **Web:** Use a reusable empty state component. Consider inline SVG illustrations for fast loading. Ensure the CTA is above the fold on mobile viewports.

---

## 4. Delayed Registration

### Description

Allow the user to experience the app's core value before requiring signup. The user enters as a guest, interacts with real features, and only hits a registration wall when they attempt an action that requires an account (saving data, collaboration, etc.). By this point, they have experienced the value and are motivated to register.

### When to Use

- The app's value proposition is experiential — users need to feel it, not read about it
- Signup friction is high (requires organization details, payment info, etc.)
- Competition is high and users will abandon before understanding the product
- The app has a strong demo or sandbox mode

### When NOT to Use

- Personalization is essential from the first screen (the app cannot function without user identity)
- Compliance or security requires authentication before any data access
- The app has no meaningful anonymous/guest experience

### Implementation Steps

1. Define the "value delivery moment" — the earliest point where the user experiences the core benefit. Example: seeing their first project on the calendar.
2. Build a guest mode that allows all actions up to and including the value delivery moment. No signup required.
3. Place the registration wall immediately after the value delivery moment. Frame it as "Save your progress" rather than "Sign up to continue."
4. Design the registration wall as a tutorial phase: spotlight the signup form, tooltip explains what they keep by signing up.
5. Offer social login alongside email/password to minimize friction at the registration moment.
6. Migrate guest data to the authenticated account seamlessly — never make the user re-do work.

### Platform Considerations

- **iOS:** Use anonymous authentication (Firebase Anonymous Auth or similar). Migrate anonymous UID to authenticated UID on registration.
- **Web:** Store guest data in localStorage. On registration, POST localStorage data to the API to associate with the new account. Show a progress bar during migration.

---

## 5. Permission Priming

### Description

Explain the benefit of a system permission before triggering the native dialog. The native permission dialog (notifications, location, camera) gets one chance — if the user denies it, recovery is painful (Settings app on iOS). A priming screen explains why the permission matters in the user's context before the native dialog appears.

### When to Use

- The app requires permissions that users commonly deny (notifications, location)
- The permission is critical to core functionality
- The feature value is not obvious from the native dialog text alone
- The app targets an audience less comfortable with technology

### When NOT to Use

- The permission is optional and the app works fine without it
- The user has already been shown a clear benefit (e.g., they just took a photo, so camera permission is obvious)
- Regulatory requirements mandate immediate permission requests

### Implementation Steps

1. Identify every system permission the app needs. Prioritize by importance to core functionality.
2. For each permission, design a priming screen as a tutorial phase:
   - Headline: benefit-oriented ("Get notified when crew updates arrive")
   - Description: specific value ("Never miss a schedule change or project update")
   - Illustration: show what the notification or feature looks like
   - Primary CTA: "Enable Notifications" (or equivalent)
   - Secondary CTA: "Not Now" (not "Deny" — softer language)
3. On primary CTA tap, trigger the native permission dialog.
4. On secondary CTA tap, skip the permission and continue the tutorial. Record the skip so the app can re-prompt later at a contextual moment.
5. If the user denied the native dialog, show a recovery path in settings with clear instructions.

### Platform Considerations

- **iOS:** Use `UNUserNotificationCenter.requestAuthorization()` only after the priming screen CTA. Check `authorizationStatus` before showing the priming screen — skip if already granted.
- **Web:** Use the Notification API. The priming screen is a modal overlay before calling `Notification.requestPermission()`. Browser-specific: Chrome shows the prompt at top-left, Safari uses a different UX. Design the priming screen to account for the native prompt position.

---

## 6. Interactive Walkthrough

### Description

The user performs real actions as part of the tutorial. Each phase requires an actual gesture, tap, or input — not just reading. The spotlight highlights the target element, the tooltip instructs the action, and the tutorial advances only when the user completes it. This is the most hands-on pattern and produces the highest retention of learned features.

### When to Use

- The app has gesture-based interactions that are not discoverable (swipe actions, drag-and-drop, long-press menus)
- Feature retention is more important than speed — the user must remember how to use features after the tutorial
- The app targets users who learn by doing, not by reading
- The tutorial teaches a workflow (multi-step process with dependencies)

### When NOT to Use

- The user needs to understand the overall structure before performing actions
- Actions have real consequences that cannot be undone (e.g., sending a message to real people)
- The app's actions require real data that does not exist yet (empty database)

### Implementation Steps

1. List every interaction the user must perform. Order them by the workflow sequence.
2. For each interaction, create an action phase:
   - Spotlight the target element with a cutout in the overlay
   - Write a tooltip that instructs the exact gesture ("Tap the + button to create a project")
   - Set `requiresUserAction: true` and `userAction: tap/swipe/drag/type`
   - Block all other interactions — only the spotlighted element responds to touches
3. Use tutorial environment values for form fields (pre-populated demo data) so the user can complete forms without thinking about content.
4. After each action, provide immediate feedback: haptic, brief auto-advance confirmation phase, or inline success state.
5. If the user does not act within 10 seconds, pulse the spotlight or show a gesture hint animation.

### Platform Considerations

- **iOS:** Use hit-testing overrides to restrict taps to the spotlight cutout. Inject tutorial environment values via the state manager. Use `UIImpactFeedbackGenerator` for haptic responses.
- **Web:** Use pointer-events CSS to block interactions outside the cutout. Inject demo data via React context or props. Use CSS animations for gesture hints (no haptic available, use visual + audio cues instead).

---

## 7. Endowed Progress

### Description

Give the user credit before they start. Pre-check the first step, show "1 of 6 complete" on the progress indicator, or mark the account setup as already partially done. This creates a psychological commitment — the user has already "started" and abandoning feels like losing progress.

### When to Use

- The tutorial has 6+ phases and abandonment risk is high
- The first meaningful action is 3+ phases into the flow (long orientation section)
- Signup or account creation was already a multi-step process — reward that effort
- A/B testing shows high drop-off at the first action phase

### When NOT to Use

- The tutorial is very short (under 6 phases) — endowed progress feels patronizing
- The first phase IS the first action — no need to pre-credit
- The user arrived from a deep link and expects to see specific content, not a tutorial

### Implementation Steps

1. At tutorial start, set the progress indicator to show completion of step 1 (e.g., "1 of 8 complete").
2. Display a brief celebration for the "completed" step: "Account created — you're already on your way."
3. Frame the remaining steps as a continuation, not a beginning: "Just 7 more steps to get fully set up."
4. Pre-fill any form fields that can be derived from signup data (name, email, company).
5. If the user completed onboarding questions before the tutorial, mark those as completed steps in the progress bar.

### Platform Considerations

- **iOS:** Update the progress bar state in the tutorial state manager before the first phase renders. Use a brief animation that fills from 0 to the endowed amount.
- **Web:** Set initial progress in the tutorial context/store. Animate the progress bar on mount. Consider a confetti micro-animation for the pre-credited step.

---

## 8. Branching Flow

### Description

The tutorial path diverges based on the user's role, goal, or initial selection. A decision point early in the flow asks the user to self-identify (e.g., "I'm a field crew member" vs. "I manage the office"). Each branch shows features relevant to that role. Branches may converge at shared features before the completion phase.

### When to Use

- The app serves distinct user roles with different feature sets
- Showing irrelevant features would confuse or frustrate users
- Personalization is a core product value — the tutorial should reflect it
- The app has 2-3 clearly defined user personas

### When NOT to Use

- All users need the same features (single-role app)
- User roles are fluid and change frequently — a fixed branch would become inaccurate
- The role distinction is minor (same features, slightly different UI)
- More than 3 branches would be needed — complexity becomes unmanageable

### Implementation Steps

1. Design the decision point as a selection phase: cards, buttons, or a picker showing 2-3 options.
2. Define branches. For each branch:
   - Name it clearly (e.g., `branch-field-crew`, `branch-office-admin`)
   - List the phases specific to that branch
   - Set the phase sequence within the branch
   - Calculate the branch-specific estimated time
3. After the decision point, route to the corresponding branch's first phase.
4. At the end of each branch, route to the merge point — a shared phase that all branches reach.
5. From the merge point, continue with shared phases (features common to all roles) until completion.
6. Store the selected branch in user state for analytics and future personalization.

### Platform Considerations

- **iOS:** Use an enum for branch selection in the tutorial state manager. The phase sequence is computed dynamically based on the selected branch. Store branch choice in UserDefaults.
- **Web:** Use a switch/match on the branch selection value to render the correct phase sequence. Store in the tutorial context and persist to the user profile API. URL routing is not needed — branches are internal to the tutorial overlay, not separate pages.
