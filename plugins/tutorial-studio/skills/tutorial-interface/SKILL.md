---
name: tutorial-interface
description: This skill should be used when designing tutorial tooltip appearance, styling tutorial overlays, creating action bar visual design, designing progress indicator aesthetics, styling completion screens, applying interface design craft to tutorial UI, or making visual design decisions for any onboarding tutorial component.
---

# Tutorial Interface

Apply interface design craft to tutorial UI components across iOS (SwiftUI) and web (React/Next.js). This skill is a specialization of the interface-design skill, narrowed to the specific domain of onboarding tutorial overlays, tooltips, action bars, and completion screens.

## OPS Project Context

**iOS app** (`OPS/OPS/`):
- SwiftUI with OPSStyle design system (`Styles/OPSStyle.swift`)
- Fonts: Mohave (headings), Kosugi (body)
- Colors: dark theme, `#597794` accent
- Tutorial uses real app views with environment values injected

**Web app** (`try-ops/`):
- Next.js 14, Tailwind CSS 3.4, design tokens in `tailwind.config.ts` and `lib/styles/OPSStyle.ts`
- Fonts: Mohave (headings), Kosugi (body), Bebas Neue (accent)
- Colors: `#0A0A0A` background, `#597794` accent, `#F5F5F5` text

Before designing any tutorial component, read the relevant design system files to extract token values. Do not invent tokens that conflict with the existing system.

---

## The Tutorial Feel

Tutorial UI is a layer ON TOP of the real app — not part of it. It must be visually distinct from application UI while remaining consistent with the app's design language. The distinction communicates: "this is temporary guidance, not permanent interface."

Achieve this through three principles:

1. **Elevation.** Tutorial elements float above app content. Overlay darkens the world below; tooltips and action bars sit on elevated surfaces that are clearly above the application layer.

2. **Focus.** The overlay eliminates visual noise. The user sees only what matters: the highlighted element and the tutorial guidance. Everything else recedes. This creates a "teaching moment" — calm, directed, one thing at a time.

3. **Transience.** Tutorial UI should feel lightweight and temporary. No heavy chrome, no complex layouts, no dense information. It appears, guides, and gets out of the way. The user should feel they are moving through the tutorial, not trapped in it.

The atmosphere to create: a skilled colleague standing beside the user, pointing at the screen and saying "here, tap this." Confident and direct. Not patronizing ("Great job!!" after every step). Not overwhelming (walls of explanation text). Not uncertain (vague instructions).

---

## Intent for Tutorial UI

Before making any visual decision, anchor to the specific user context:

**Who:** A new user, unfamiliar with the product. Possibly impatient — they want to get to work, not sit through training. Possibly in a harsh environment (field crew in bright sunlight, on a job site, wearing gloves). Possibly low technical literacy. The tutorial must work for all of these people.

**What:** Understand the core workflow in under 60 seconds. Not every feature — just enough to be functional. Create a project, assign a task, navigate between views. The tutorial is a fast track to competence, not a comprehensive manual.

**Feel:** Confident and guided. The user should feel like the app knows what it is doing. Like following a clear set of directions from someone who has done this a hundred times. The tutorial should project authority without being rigid — if the user wants to skip, let them. If they want to go back, let them.

---

## Token Decisions for Tutorial Components

Map every visual property to a decision grounded in intent. Never use arbitrary values.

**Tooltip background:** Surface elevated +2 from app background. On dark theme, this means slightly lighter than the app background — enough to float visually without being jarring. Use the design system's elevation scale if one exists; if not, increase lightness by 6-8%.

**Tooltip text:** Primary color for headline text (maximum legibility). Secondary color for description text (establishes hierarchy without competing with the headline). Never use muted/tertiary text in tooltips — readability in sunlight requires strong contrast.

**Tooltip border:** Low-opacity border matching the app's border system. The border defines the tooltip edge against the overlay without being heavy. Use rgba with 10-15% opacity — visible on inspection, invisible at a glance.

**Overlay:** 60% black opacity for dark mode, 40% for light mode. The overlay must darken enough to suppress the app UI visually but not so much that context is lost — the user should still recognize where they are. Alternative: 40% black + 8px blur for a premium feel (but test performance on low-end devices).

**Progress bar:** Accent color fill on a border-color track. The track is nearly invisible; the fill communicates progress. At milestone boundaries (25%, 50%, 75%), the accent color briefly brightens — a subtle pulse that rewards progress without being distracting.

**Action buttons:**
- Continue/Next: Accent background, white text, full rounded corners. This is the primary action — it must be the most visually prominent element in the action bar.
- Skip: Text-only button, secondary color. Available but not encouraged. No border, no background.
- Back: Ghost button with chevron icon. Even less prominent than Skip — the tutorial moves forward.

**Celebration:** Accent color for primary celebration elements (confetti, glow). Slight glow effects using the accent color at low opacity. Keep celebrations within the existing color palette — do not introduce new colors for celebration that break the design system.

---

## Component Design Specifications

Brief specifications for each tutorial component. Full detail including measurements, padding, and code examples is in `references/tutorial-components.md`.

### Tooltip
The primary communication element. Contains a headline (what to do), a description (why or how), and optionally a progress indicator. Anchored to the spotlight target with an arrow. Maximum width constrained to prevent tooltips from becoming text walls.

### Overlay
Full-screen semi-transparent surface with a cutout revealing the spotlight target. The cutout has padding around the target element and rounded corners matching the target's radius plus a few pixels.

### Action Bar
Fixed to the bottom of the screen, above the safe area. Contains navigation controls (Back, Skip, Continue). The action bar is the user's primary means of progressing through the tutorial. It must be reachable by thumb in one-handed phone use.

### Progress Indicator
Communicates overall tutorial position. Two variants: a thin bar (less intrusive, integrated into the tooltip) or dots (more explicit, good when phase count is small). Use the bar variant for tutorials with many phases; dots for tutorials with 8 or fewer phases.

### Swipe Indicator
Visual hint for gesture-based phases. Positioned near the target element or at center screen. Uses the gesture indicator animations from tutorial-animations.

### Completion Screen
Full-screen view shown when the tutorial finishes. Displays completion time, phase stats, and a CTA to start using the app. This is a celebration moment — the design should feel rewarding but not childish.

### Inline Sheet
A bottom sheet that appears during certain tutorial phases (e.g., showing a form the user needs to fill out). No drag handle, no dismiss gesture — the sheet is controlled by the tutorial, not the user. Reduced chrome to avoid competing with the tutorial overlay.

---

## Platform-Specific Considerations

### iOS (SwiftUI)

- Use OPSStyle tokens for all colors, fonts, and spacing. Do not define tutorial-specific tokens that duplicate existing ones.
- Respect safe area insets. The action bar must sit above the home indicator. Tooltips must not overlap the Dynamic Island or status bar.
- The Dynamic Island avoidance zone: keep at least 12px below the Dynamic Island's expanded state. On devices without Dynamic Island, the status bar height suffices.
- Pair visual transitions with haptic feedback. Tooltip appearance = light impact. Phase completion = medium impact. Tutorial completion = success notification + light taps. See `tutorial-animations/references/celebration-library.md`.
- Touch targets must be at least 44x44pt for all interactive elements in the action bar.

### Web (React / Next.js)

- Use Tailwind tokens defined in `tailwind.config.ts`. Extend the config if new tokens are needed, but prefer reusing existing ones.
- Responsive breakpoints: tutorial UI must work on mobile viewport (375px+), tablet (768px+), and desktop (1024px+). Tooltip max-width scales with viewport; action bar is always full-width on mobile.
- No safe area insets on web (unless targeting PWA on iOS, in which case use `env(safe-area-inset-bottom)`).
- Add hover states to action bar buttons for desktop use. Tooltips do not need hover states — they are read-only.

---

## The Craft Mandate

This is inherited from the interface-design skill and applies fully to tutorial UI.

**Before showing output, ask: "If they said this lacks craft, what would they mean?"**

That thing just identified — fix it first.

Common craft failures in tutorial UI:

- **Tooltip looks like a system alert.** If the tooltip could be mistaken for a browser dialog or OS notification, it is not designed — it is defaulted. The tooltip should feel like part of the tutorial experience, not a generic message box.
- **Overlay is too heavy or too light.** 80% opacity feels oppressive. 20% opacity fails to suppress the background. Test the overlay against real app content, not a blank screen.
- **Action bar buttons have no visual hierarchy.** If Continue, Skip, and Back all look the same, the user must read labels to navigate. Visual hierarchy (size, color, weight) should make the primary action obvious at a glance.
- **Progress indicator is invisible.** A 1px bar on a dark overlay is invisible in sunlight. Ensure sufficient contrast. Test on a bright screen.
- **Completion screen is generic.** If the completion screen looks like a default success page from any app, craft is missing. It should celebrate completion in a way specific to the product.

---

## Consistency Checks

Before delivering tutorial UI, verify:

1. **Tooltip border radius** matches the app's convention for elevated cards. Do not use a different radius.
2. **Overlay opacity** feels right — not too heavy, not too light. Test against multiple app screens, not just one.
3. **Action bar button touch targets** are at least 44x44pt (iOS) / 44x44px (web). Measure, do not estimate.
4. **Progress indicator** is visible against the overlay. View at arm's length. If it is hard to see, increase contrast.
5. **Font choices** in tooltips match the app's type system. Headline font is the heading font. Body font is the body font. No exceptions.
6. **Color usage** does not introduce new colors. Every color in tutorial UI must trace back to the design system's token set.
7. **Elevation** is consistent. All tutorial surfaces at the same visual layer should use the same elevation level.

---

## Reference Files

- `references/tutorial-components.md` — Full design specifications for all seven tutorial UI components with measurements, padding, code examples, and platform-specific notes.

## Related Skills

- `tutorial-animations` — Motion and transition specifications for tutorial UI elements.
- `interface-design` — Foundational craft principles, token architecture, depth strategies, and the full design methodology that this skill specializes.
