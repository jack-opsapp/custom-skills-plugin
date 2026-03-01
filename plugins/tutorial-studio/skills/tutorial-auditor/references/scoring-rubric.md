# Tutorial Scoring Rubric

Detailed criteria for scoring each of the 12 audit dimensions on a 1-10 scale. For each dimension, specific measurable criteria are defined for scores of 1 (minimum), 5 (adequate), and 10 (excellent). Intermediate scores are interpolated between these anchor points.

When scoring, use the lower anchor if the tutorial falls between two defined levels. Note what is missing for the higher score in the audit justification.

---

## 1. Time-to-First-Value

Measures elapsed time from tutorial start to the moment the user first receives meaningful product value (the aha moment).

### Score 1
- Time-to-value exceeds 5 minutes.
- User must complete 15+ interactions before any value delivery.
- Value delivery is deferred behind mandatory setup steps (email verification, team invite, profile completion, settings configuration) that could be deferred.
- The user cannot see, use, or create anything meaningful until all setup is complete.

### Score 5
- Time-to-value is 2-3 minutes.
- User completes 8-12 interactions before value delivery.
- Some non-essential setup steps have been deferred, but the path still includes 2-3 deferrable steps.
- The user creates or sees something meaningful, but it requires moderate effort.

### Score 10
- Time-to-value is under 60 seconds.
- User completes 5-8 interactions or fewer before value delivery.
- Every step between launch and value is strictly necessary — nothing deferrable remains in the path.
- The aha moment is unmistakable: the user creates something, sees a result, or experiences the core value with clear visual confirmation.
- Pre-filled defaults reduce interaction count where possible.

---

## 2. Interactivity Level

Measures the ratio of interactive phases (user performs a meaningful action) to passive phases (user reads text or watches animation without acting).

### Score 1
- Tutorial is entirely passive: a series of text screens, screenshots, or video segments.
- The only user interaction is tapping "Next" or "Continue."
- No actions are performed on real app elements.
- No user-created data results from the tutorial.
- This is a click-through slideshow.

### Score 5
- Tutorial is mixed: approximately 50% of phases require meaningful user action.
- Some phases highlight real app elements and wait for user interaction.
- Some phases are still passive (explanatory text screens, animated demonstrations).
- User creates at least one piece of data during the tutorial.
- Some actions are performed on simulated/demo elements rather than real app views.

### Score 10
- Every phase (100%) requires a meaningful user action on a real app element.
- Zero passive read-and-continue screens.
- Actions include: tapping real buttons, filling real forms, performing real gestures, navigating real screens.
- All actions produce visible, persistent results (created items appear in real lists, settings actually change).
- The tutorial uses the actual app interface, not mock screens or overlays.

---

## 3. Progressive Disclosure

Measures how effectively the tutorial layers feature exposure over time rather than showing everything at once.

### Score 1
- All features are exposed on the first session.
- No features are deferred or hidden.
- The user sees the full complexity of the app from moment one.
- No concept of layers, phases, or gradual feature introduction.

### Score 5
- Features are loosely organized into 2 groups (basic and advanced).
- Advanced features are accessible but not prominently displayed during onboarding.
- There is some concept of "learn this first, learn that later."
- Feature unlock is time-based (show after 3 days) rather than usage-based.

### Score 10
- Features are organized into 2-3 clearly defined layers.
- Layer 1 (first session) exposes only core workflow features (3-4 max).
- Subsequent layers unlock based on usage milestones (created N items, completed N sessions), not calendar time.
- Hidden features are surfaced contextually ("Now that you have 3 projects, try filtering...").
- The user never encounters a feature they have no context to understand.

---

## 4. Skip/Escape Options

Measures the user's ability to skip individual phases, exit the tutorial entirely, and resume later.

### Score 1
- Tutorial is entirely forced and unskippable.
- No skip buttons on any phase.
- No way to exit the tutorial without completing it.
- No way to resume a partially completed tutorial.
- Back button / swipe-back is disabled during tutorial.

### Score 5
- Some phases can be skipped, but not all.
- Tutorial can be exited, but progress is lost (restarts from the beginning).
- Skip option exists but is visually de-emphasized or uses guilt-inducing copy ("Are you sure you want to skip? You might miss important information.").

### Score 10
- Every phase has a clearly visible skip/dismiss option.
- Skip is labeled positively ("I know this" or "Skip").
- A persistent "Exit Tutorial" or "Explore on my own" option is visible throughout the flow.
- Progress is preserved on exit — the user can resume from where they left off.
- A re-entry point exists (settings menu, help section) to restart or revisit any phase.
- Skipping does not break the tutorial state — subsequent phases work correctly regardless of which prior phases were skipped.

---

## 5. Personalization

Measures how well the tutorial adapts to different user types, roles, goals, or behavior.

### Score 1
- Tutorial is identical for all users.
- No role selection, goal selection, or preference gathering.
- No behavior-based adaptation.
- A CEO and an intern, a power user and a novice, all see exactly the same flow.

### Score 5
- Basic personalization exists: role selection or goal selection (2-3 options).
- The selected option changes some tutorial content (different copy or different phase order).
- No behavior-based adaptation — the tutorial does not respond to user actions outside the guided flow.
- Personalization is surface-level (different greeting text) rather than structural (different phases or features shown).

### Score 10
- Multi-dimensional personalization: role-based paths AND goal-based paths AND behavior-based adaptation.
- Role selection produces genuinely different tutorial paths (different phases, different features highlighted, different aha moments if applicable).
- Behavior-based adaptation: if the user performs an action before the tutorial teaches it, that phase is automatically skipped.
- If the user spends extended time on a screen, contextual help is offered.
- Tutorial depth adapts: power users get a compressed flow, novices get the full flow.
- Personalization choices are revisitable — the user can change their role or goal and get a new path.

---

## 6. Permission Timing

Measures when and how system permissions (location, camera, notifications, contacts, etc.) are requested relative to value delivery and feature use.

### Score 1
- All permissions are requested at app launch or during the first screen.
- No context is provided for why each permission is needed.
- Permissions are requested before the user has seen any product value.
- No graceful degradation if the user declines — features break or error without explanation.

### Score 5
- Permissions are requested during onboarding but not at launch — placed after 2-3 setup steps.
- Some context is provided ("We need location for nearby features").
- At least one permission is deferred to the moment of feature use.
- Basic degradation exists for declined permissions (feature is hidden or shows a re-prompt).

### Score 10
- Every permission is requested at the exact moment the user first accesses the feature requiring it.
- A custom pre-permission screen explains the specific benefit before the system dialog appears.
- The benefit explanation is concrete and feature-specific ("See job sites within 10 miles of you" not "Allow location access").
- Graceful degradation for every declined permission: alternative input method, manual entry, or the feature works with reduced functionality.
- No permissions are requested during the initial onboarding flow unless the aha moment requires one.

---

## 7. Copy Quality

Measures the clarity, conciseness, and effectiveness of all user-facing text in the tutorial.

### Score 1
- Copy is verbose — paragraphs of text per phase.
- Jargon-heavy or technical language without explanation.
- Feature-focused rather than benefit-focused ("Our advanced project management system uses kanban methodology" vs "See all your tasks at a glance").
- Inconsistent tone, grammatical errors, or placeholder text.
- No clear call to action — the user does not know what to do.

### Score 5
- Copy is moderately concise — 2-3 sentences per phase.
- Language is clear but sometimes feature-focused rather than benefit-focused.
- Headlines are present but may exceed 10 words.
- Call-to-action buttons have clear labels.
- Tone is consistent but may be generic.

### Score 10
- Headlines are 8 words or fewer, every one.
- Body text is 20 words or fewer per phase.
- Every sentence focuses on user benefit, not feature description.
- Active voice throughout ("Create your first project" not "A project can be created").
- Button labels use specific verbs ("Create Project" not "Next" or "Continue").
- Tone matches the product brand — professional, friendly, or playful as appropriate.
- Zero jargon unless the audience is technical and the jargon is standard for the domain.
- Copy creates anticipation for the next step ("Next: add your first task").

---

## 8. Animation Quality

Measures whether animations guide attention, provide feedback, create delight, and avoid impeding the flow.

### Score 1
- No animations at all — abrupt screen transitions with no visual feedback.
- OR: animations are present but harmful — jarring transitions, slow loading animations blocking interaction, animations that loop indefinitely, animations that play every time (not just first time).
- No attention guidance — the user must scan the entire screen to find the tutorial target.

### Score 5
- Basic animations exist: fade transitions between phases, simple highlight/pulse on target elements.
- Transitions are smooth but generic (standard iOS/web transitions).
- Some attention guidance through highlighting, but not always precise (large area highlights instead of element-specific).
- No celebration animations at milestones.
- Animations are functional but not delightful.

### Score 10
- All transitions are smooth, purposeful, and render at 60fps.
- Transition duration is appropriate: 200-400ms for phase transitions, under 2 seconds for celebrations.
- Spotlight/highlight animations precisely target the interactive element with appropriate padding.
- Attention-drawing animations (pulse, glow, bounce) are used sparingly and stop after the user interacts.
- Celebration micro-animations play at key milestones (first creation, tutorial completion).
- Animations respect the "Reduce Motion" accessibility setting — alternative non-animated indicators are provided.
- Loading states use skeleton screens or shimmer effects, never blank screens or spinners blocking interaction.
- Entrance and exit animations give spatial context (new element slides in from where it was triggered).

---

## 9. Analytics Coverage

Measures the instrumentation of the tutorial for measuring engagement, dropoff, and effectiveness.

### Score 1
- No analytics events are tracked during the tutorial.
- No way to measure how many users start, complete, skip, or abandon the tutorial.
- No way to measure time spent per phase.
- No funnel visualization possible.

### Score 5
- Basic analytics: tutorial_started and tutorial_completed events are tracked.
- Phase-level events exist but are inconsistent (some phases tracked, others not).
- Time-per-phase is not measured.
- Skip events are not tracked separately from completion events.
- Basic funnel is constructible but lacks granularity.

### Score 10
- Every phase fires: `phase_started`, `phase_completed`, `phase_skipped` events.
- Each event includes: timestamp, duration, phase identifier, user properties (role, platform, device).
- `tutorial_started` fires with source/trigger context.
- `tutorial_completed` fires with total duration, phases completed, phases skipped.
- `tutorial_exited` fires with last active phase and total duration.
- Interaction events within phases are tracked (button taps, form fills, gesture completions).
- A funnel dashboard or report is available showing dropoff between each phase.
- Error events are tracked (tutorial state failures, unexpected navigation, phase loading failures).
- A/B test variant identifiers are included in events if variants exist.

---

## 10. Gamification

Measures the use of progress indicators, celebrations, and motivational mechanics.

### Score 1
- No progress indicator of any kind.
- No feedback on advancement — the user does not know how many phases remain or how far they have progressed.
- No celebration or acknowledgment at milestones.
- No completion summary.

### Score 5
- A progress indicator exists (dots, bar, or step counter).
- Progress starts at zero (no endowed progress).
- A basic completion message appears at the end ("Tutorial complete" or "You're all set").
- No intermediate celebrations between start and finish.
- No summary of accomplishments.

### Score 10
- A persistent, visually clear progress indicator is visible throughout the tutorial.
- Endowed progress: the first step (signup/launch) is pre-completed, so progress starts at 1/N.
- Milestone celebrations appear every 4-6 phases (subtle animations, congratulatory copy).
- Celebration duration is under 2 seconds — delightful but not obstructive.
- A completion screen summarizes what the user accomplished ("You created a project, added 2 tasks, and invited a team member").
- Optional: achievement badges for completing optional phases or advanced features.
- Optional: team progress indicator for multi-user onboarding.

---

## 11. Platform Conventions

Measures adherence to platform-specific design guidelines and interaction patterns.

### Score 1
- Tutorial uses non-native controls (custom buttons that do not match platform style, non-standard navigation patterns).
- Back button, swipe-back, or swipe-to-dismiss is disabled or broken during the tutorial.
- Tutorial navigation conflicts with app navigation (both try to handle gestures).
- Modal presentation does not follow platform conventions (no drag-to-dismiss on iOS sheets, no proper dialog behavior on web).
- Tutorial elements render inconsistently across device sizes.

### Score 5
- Tutorial uses mostly native or platform-appropriate controls.
- Standard navigation gestures work during the tutorial.
- Tutorial renders correctly on the primary device size but may have layout issues on edge cases (very small screens, very large screens, landscape).
- Overall feel is native but some elements betray a non-native implementation (web view inside native app, non-standard animations).

### Score 10
- Tutorial uses exclusively native components and follows platform HIG (Human Interface Guidelines for iOS, Material Design for Android, platform-appropriate patterns for web).
- All platform gestures work correctly during the tutorial (swipe-back, swipe-to-dismiss, long-press, pull-to-refresh).
- Tutorial adapts to device size, orientation, and display settings (Dynamic Type on iOS, font scaling on web, dark mode, display zoom).
- Keyboard handling is correct: text fields raise above keyboard, dismissal works via standard gestures, tab-order is logical (web).
- Tutorial respects platform conventions for modal presentation, navigation hierarchy, and transition animations.
- Safe area insets are respected (notch, home indicator, status bar).

---

## 12. Accessibility

Measures usability with assistive technologies and adherence to accessibility standards.

### Score 1
- No accessibility labels on tutorial elements.
- VoiceOver/TalkBack/screen reader cannot navigate the tutorial.
- Animations cannot be reduced or disabled.
- Color is the only indicator of state (no icons or text alternatives).
- Touch targets are smaller than platform minimums (44x44pt iOS, 48x48dp Android).
- No keyboard navigation support (web).

### Score 5
- Accessibility labels exist on primary interactive elements (buttons, inputs).
- VoiceOver/screen reader can navigate most of the tutorial, though ordering may be incorrect.
- Some animations respect reduced-motion preferences, but not all.
- Color contrast meets WCAG AA for body text (4.5:1) but may not for all elements.
- Touch targets meet minimum sizes for most elements.
- Basic keyboard navigation works (web) but focus management is incomplete.

### Score 10
- All tutorial elements have descriptive accessibility labels (not just element type — "Create your first project" not "Button").
- VoiceOver/TalkBack/screen reader navigates the entire tutorial with correct reading order and grouping.
- All animations respect the "Reduce Motion" / "prefers-reduced-motion" setting with appropriate alternatives (crossfade instead of slide, static indicator instead of pulse).
- Color contrast meets WCAG AA (4.5:1 for text, 3:1 for large text and UI elements) throughout.
- Touch targets are at minimum 44x44pt (iOS) or 48x48dp (Android) for all interactive elements.
- Tutorial spotlight/overlay does not trap focus — VoiceOver can still access the skip/exit controls.
- Full keyboard navigation with visible focus indicators (web).
- Screen reader announcements fire when tutorial phases change, progress updates, and actions complete.
- Captions or transcripts available for any audio/video content.
- Tutorial works correctly with display zoom, large text, and bold text settings enabled.
