# Tutorial Audit Checklist

Concise yes/no checklist organized by audit dimension. Run through every item after completing the 12-dimension scoring to catch specific issues that may not surface in dimensional analysis.

Mark each item as pass or fail. Any failed item should be cross-referenced with the dimensional score and added to the improvement recommendations if not already covered.

---

## 1. Time-to-First-Value

- [ ] User reaches meaningful product value within 60 seconds of tutorial start
- [ ] No unnecessary steps exist between launch and value delivery (every step is strictly required)
- [ ] The value moment is unmistakable — visual confirmation, animation, or state change makes it obvious
- [ ] Email verification is deferred to after value delivery (not blocking)
- [ ] Profile completion beyond essential fields is deferred to after value delivery
- [ ] Pre-filled defaults reduce user effort where possible (date defaults to today, name defaults from account)

## 2. Interactivity Level

- [ ] Every tutorial phase requires a meaningful user action (not just "Next")
- [ ] Actions are performed on real app elements, not mock/demo screens
- [ ] User-created data from the tutorial persists in the app (not deleted after tutorial ends)
- [ ] No phase consists solely of reading text or watching an animation
- [ ] Interactive elements respond to the user's actual tap/click (not pre-scripted)
- [ ] At least one phase involves the user creating something new (project, task, message, item)

## 3. Progressive Disclosure

- [ ] Features are organized into 2-3 disclosure layers
- [ ] First session exposes a maximum of 3-4 core features
- [ ] Advanced features are hidden or visually de-emphasized during the tutorial
- [ ] Feature layers unlock based on usage milestones, not calendar time
- [ ] Contextual prompts introduce deferred features at the moment of relevance
- [ ] Settings and configuration options are not shown during the tutorial unless essential

## 4. Skip/Escape Options

- [ ] Every tutorial phase has a visible skip or dismiss option
- [ ] Skip is labeled positively ("I know this" or "Skip") — no guilt-inducing copy
- [ ] A persistent "Exit Tutorial" or "Explore on my own" option is accessible throughout the flow
- [ ] Tutorial progress is preserved on exit — resume is possible on next session
- [ ] A re-entry point exists to restart or revisit the tutorial (settings, help menu)
- [ ] Skipping a phase does not break subsequent phases
- [ ] Back navigation works correctly during the tutorial (iOS swipe-back, browser back button)

## 5. Personalization

- [ ] Tutorial includes a role or goal selection step (if app has distinct user types)
- [ ] Selected role/goal produces a visibly different tutorial path
- [ ] Tutorial skips phases for actions the user has already performed independently
- [ ] Personalization choices are made after signup, not before (commitment before personalization)
- [ ] The personalization step offers 2-4 clear options, not more
- [ ] Personalization data is used beyond the tutorial (affects ongoing app experience)

## 6. Permission Timing

- [ ] No system permissions are requested at app launch
- [ ] Each permission is requested at the moment the user first accesses the feature requiring it
- [ ] A custom pre-permission screen explains the specific benefit before the system dialog
- [ ] The benefit explanation is concrete and feature-specific (not generic)
- [ ] Graceful degradation exists for every declined permission (alternative input, reduced functionality)
- [ ] Declined permissions do not break the tutorial flow
- [ ] Permission rationale complies with App Store / Play Store guidelines

## 7. Copy Quality

- [ ] Headlines are 8 words or fewer
- [ ] Body text is 20 words or fewer per phase
- [ ] Copy is benefit-focused ("See all your tasks at a glance") not feature-focused ("Advanced kanban board")
- [ ] Active voice is used throughout ("Create your first project" not "A project can be created")
- [ ] Button labels use specific action verbs ("Create Project" not "Next" or "Continue")
- [ ] Zero jargon or technical terms without explanation
- [ ] Tone is consistent across all phases
- [ ] Copy creates anticipation for the next step where appropriate

## 8. Animation Quality

- [ ] Phase transitions are smooth and render at 60fps
- [ ] Transition duration is 200-400ms (not too fast, not too slow)
- [ ] Spotlight/highlight animations target the correct element precisely
- [ ] Attention-drawing animations (pulse, glow) stop after user interaction
- [ ] Celebration animations are under 2 seconds and do not block interaction
- [ ] No animations loop indefinitely
- [ ] Animations respect "Reduce Motion" / "prefers-reduced-motion" settings
- [ ] No blank screens or loading spinners during phase transitions

## 9. Analytics Coverage

- [ ] `tutorial_started` event fires with user properties and source context
- [ ] Each phase fires `phase_started` and `phase_completed` events with timestamps
- [ ] `phase_skipped` events fire separately from completion events
- [ ] `tutorial_completed` event fires with total duration and phase completion summary
- [ ] `tutorial_exited` event fires with last active phase identifier
- [ ] Duration (time spent) is tracked per phase
- [ ] A funnel report or dashboard is available for analyzing dropoff between phases

## 10. Gamification

- [ ] A persistent progress indicator is visible throughout the tutorial
- [ ] Progress starts with at least one pre-completed step (endowed progress)
- [ ] Milestone celebrations appear at appropriate intervals (every 4-6 phases)
- [ ] A completion screen summarizes what the user accomplished
- [ ] Progress indicator uses filled/unfilled visual states (not just a number)
- [ ] Celebrations do not block user interaction for more than 2 seconds

## 11. Platform Conventions

- [ ] Tutorial uses native or platform-appropriate UI components
- [ ] Back navigation (swipe-back on iOS, back button on Android, browser back on web) works correctly
- [ ] Modal sheets follow platform presentation conventions (drag-to-dismiss on iOS, proper close on web)
- [ ] Tutorial renders correctly on all supported device sizes
- [ ] Keyboard behavior is correct (fields scroll above keyboard, dismissal works, tab order is logical)
- [ ] Safe area insets are respected (notch, home indicator, status bar on iOS)
- [ ] Dark mode is supported if the app supports dark mode
- [ ] Dynamic Type / font scaling is respected

## 12. Accessibility

- [ ] All tutorial elements have descriptive accessibility labels
- [ ] VoiceOver / TalkBack / screen reader can navigate the entire tutorial in correct order
- [ ] Tutorial phase changes are announced to screen readers
- [ ] Animations respect "Reduce Motion" / "prefers-reduced-motion" with appropriate alternatives
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI elements)
- [ ] Touch targets are at minimum 44x44pt (iOS) or 48x48dp (Android)
- [ ] Color is not the sole indicator of state — icons or text alternatives are present
- [ ] Full keyboard navigation with visible focus indicators (web)
