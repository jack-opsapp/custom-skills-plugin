---
name: tutorial-ux-design
description: This skill should be used when designing tutorial overlay UX, positioning tooltips in onboarding flows, designing spotlight cutouts, creating action bar layouts, designing tutorial progress indicators, planning Z-index layering for tutorial systems, specifying guided interaction patterns, or making UX decisions for any onboarding tutorial component.
---

# Tutorial UX Design

## Overview

Full-process skill for designing the UX of tutorial overlays, spotlights, tooltips, action bars, progress indicators, and guided interaction systems. Covers every visual and interactive layer that sits between the user and the app during a tutorial flow.

**Announce at start:** "I'm using the tutorial-ux-design skill to design the tutorial overlay UX."

**Workflow position:**
```
flow-architect  →  tutorial-copywriter  →  tutorial-ux-design  →  implementation
```

## When to Use

- Designing the overlay, spotlight, and tooltip system for a tutorial
- Positioning tooltips relative to spotlight targets
- Defining Z-index layering for tutorial components
- Designing the action bar (continue, skip, back buttons)
- Choosing progress indicator style and placement
- Specifying guided interaction modes (restricted vs. free)
- Designing inline sheets within the tutorial overlay
- Making any UX decision for onboarding tutorial components

**NOT for:** Designing the app's own screens underneath the tutorial (use `mobile-ux-design`). Writing tooltip text (use `tutorial-copywriter`). Defining the phase sequence or timing (use `flow-architect`).

---

## Step 1: Load Brand Identity

**REQUIRED:** Before designing anything, search for the project's design system file. Check these locations in order:

1. `.interface-design/system.md` — primary location
2. `.interface-design/systems/<project-name>.md` — project-specific variant
3. Any file named `design-system.md`, `brand.md`, or `DESIGN.md` in the project root

### If a file is found

Stop and confirm before reading further:

> "I found a design system file at `[path]`. Should I use this as the brand identity for this tutorial design session?"

Wait for user confirmation. Only proceed once confirmed.

### If no file is found

Ask the user:

> "I couldn't find a design system or brand identity file in this project. Do you have one I can reference? You can share: a file path, a company name, competitor apps, or reference URLs."

- **If they provide a reference** — use it directly (read the file, or note the reference URLs/names)
- **If they have nothing** — invoke `design-from-references` to create a brand identity first, before continuing with UX design

Do not proceed to Step 2 until a brand identity is established and confirmed.

---

## Step 2: Establish Tutorial Context

Answer these questions before designing any tutorial overlay component:

- **Who is the user?** Role, technical comfort, device familiarity, context of use (on-site, in-office, on the go)
- **What phase is this?** Reference the flow specification from `flow-architect` — which phase number, what type (orientation, action, form, gesture, celebration)
- **What is underneath the overlay?** The actual app screen content that will be dimmed/blurred. Understanding the underlying content is critical — the overlay must not obscure elements the user needs to reference.
- **What device and conditions?** Screen size (iPhone SE vs. Pro Max, 13" laptop vs. 27" monitor), orientation (portrait locked? landscape possible?), ambient conditions (outdoor glare? dark mode?)

If the flow specification from `flow-architect` is not available, request it before proceeding. The UX design depends on knowing the phase sequence, spotlight targets, and interaction types.

---

## Step 3: Map Tutorial States

Define every possible state for each tutorial overlay component. All states must be specified before designing any individual phase.

### Component State Matrix

| Component | States | Transitions |
|-----------|--------|-------------|
| **Overlay** | on / off | Fade in 300ms on tutorial start, fade out 300ms on tutorial end |
| **Spotlight** | active (cutout visible) / inactive (full overlay) | Expand from center 300ms ease-out when target changes |
| **Tooltip** | visible with position (top/bottom/left/right) / hidden | Slide + fade 250ms from the direction of the spotlight |
| **Action bar** | visible with button count (1/2/3) / hidden | Slide up 200ms from bottom edge |
| **Sheet** | open with height / closed | Slide up 300ms spring, slide down 200ms ease-in |
| **Gesture indicator** | active with direction / inactive | Fade in 200ms, loop animation, fade out 200ms |
| **Progress bar** | visible with fill percentage / hidden | Width transition 300ms ease-out on phase change |

For each phase in the flow specification, document which components are in which state. Use a phase-state table:

```
| Phase | Overlay | Spotlight | Tooltip | Action Bar | Sheet | Gesture | Progress |
|-------|---------|-----------|---------|------------|-------|---------|----------|
| 1     | on      | inactive  | bottom  | 2-button   | closed| inactive| 8%       |
| 2     | on      | active    | bottom  | 3-button   | closed| inactive| 17%      |
| 3     | on      | active    | top     | 3-button   | closed| inactive| 25%      |
| ...   | ...     | ...       | ...     | ...        | ...   | ...     | ...      |
```

---

## Step 4: Tutorial Overlay Patterns

Three overlay types. Select the appropriate type per phase based on the phase's purpose and importance.

### Pattern 1: Dark Overlay + Cutout (Standard)

The workhorse pattern. A semi-transparent black overlay covers the entire screen with a rounded rectangle cutout revealing the spotlight target underneath.

- **Overlay color:** Black, opacity 0.5-0.7
- **Cutout shape:** Rounded rectangle matching the target element's corner radius + 4px
- **Cutout padding:** Element bounds + 8px default, 16px for small elements (under 44px)
- **Tap behavior:** Taps inside the cutout pass through to the element. Taps outside the cutout are blocked.

**Use for:** Most tutorial phases. Action phases where the user taps a specific element. Orientation phases that highlight a specific area.

### Pattern 2: Blur Overlay + Cutout (Premium)

A frosted-glass effect over the entire screen with a sharp cutout. Creates a premium, focused feel that draws maximum attention to the target.

- **Overlay effect:** `backdrop-filter: blur(8px)` (web) or `UIBlurEffect` (iOS), with a light tint overlay at opacity 0.2
- **Cutout shape:** Sharp rounded rectangle, same sizing rules as dark overlay
- **Tap behavior:** Same as dark overlay — pass through in cutout, block elsewhere

**Use for:** Important moments — first action, key milestone, permission priming. Limit to 2-3 phases per flow to preserve the premium feel. Overuse dilutes the impact.

**Performance note:** Blur is GPU-intensive. On older devices (iPhone SE, low-end Android), fall back to Pattern 1 with opacity 0.6.

### Pattern 3: Dim Overlay, No Cutout (Minimal)

A light dim over the entire screen with no cutout. The tooltip is the only focused element.

- **Overlay color:** Black, opacity 0.3
- **Cutout:** None — no element is spotlighted
- **Tap behavior:** All taps blocked except the action bar buttons

**Use for:** Tooltip-only phases with no specific target element. Welcome/intro phases. Celebration phases. Phases where the entire screen is relevant (overview of a layout).

---

## Step 5: Spotlight Mechanics

The spotlight cutout reveals a specific element beneath the overlay. Precise sizing and animation are critical — a poorly sized spotlight looks broken.

### Cutout Sizing

1. Measure the target element's bounding rect (x, y, width, height).
2. Add padding: 8px on all sides (default). Use 16px for elements smaller than 44x44px to ensure the cutout is visually significant.
3. Calculate corner radius: target element's corner radius + 4px. If the target has no corner radius, use 8px.
4. Clamp the cutout to screen bounds — never let the cutout extend off-screen.

### Cutout Animation

- **On phase transition:** The cutout animates from the previous target's position/size to the new target's position/size.
- **Duration:** 300ms, ease-out timing function.
- **First phase:** The cutout expands from the center of the target element outward (scale from 0 to 1).
- **Same-target phases:** If two consecutive phases spotlight the same element, do not re-animate. Hold the cutout steady.

### Tap-Through Behavior

- **Inside cutout:** Taps pass through the overlay to the underlying element. This enables the user to interact with the spotlighted element during action phases.
- **Outside cutout:** Taps are intercepted by the overlay. Show a subtle pulse on the spotlight to indicate "tap here instead." Do not show an error message — the visual hint is sufficient.
- **No cutout phases:** All taps intercepted except action bar buttons.

### Spotlight for Moving Elements

If the target element can move (e.g., a list item being dragged), the spotlight must track the element in real time. Update the cutout position on every animation frame during the drag.

---

## Step 6: Tooltip Positioning System

Tooltips are the primary information delivery mechanism. Correct positioning relative to the spotlight cutout is essential.

### Vertical Position Rule

Use a 0.0-1.0 coordinate system where 0.0 is the top of the screen and 1.0 is the bottom:

- **Cutout in top half (0.0-0.5):** Position tooltip BELOW the cutout
- **Cutout in bottom half (0.5-1.0):** Position tooltip ABOVE the cutout
- **No cutout:** Position tooltip at vertical center (0.5) or at `tooltipPosition` value from the flow spec

### Horizontal Positioning

- Center the tooltip horizontally relative to the cutout.
- Clamp to screen edges with 16px minimum margin on left and right.
- If the cutout is near the left edge, left-align the tooltip at 16px from the left edge.
- If the cutout is near the right edge, right-align the tooltip at 16px from the right edge.

### Arrow Direction

The tooltip arrow (pointer triangle) points toward the cutout:

- Tooltip below cutout: arrow points UP
- Tooltip above cutout: arrow points DOWN
- If no cutout: no arrow

Arrow size: 8px wide, 6px tall. Centered horizontally on the tooltip unless clamped to an edge (then offset to still point at the cutout center).

### Maximum Width

- **Mobile:** 320px maximum, 16px horizontal padding inside
- **Web:** 400px maximum, 20px horizontal padding inside
- **Minimum width:** 200px — narrower tooltips look broken

### Collision Avoidance

If the tooltip would overlap the cutout after positioning:
1. Flip the tooltip to the opposite side (above ↔ below).
2. If both sides overlap (cutout in the center), place the tooltip to the left or right of the cutout.
3. As a last resort, reduce tooltip width to fit and enable scrolling within the tooltip (rare — indicates the copy is too long).

### Tooltip Anatomy

```
┌─────────────────────────────┐
│  Headline (bold, 16-18px)   │
│  Description (regular, 14px)│
│                             │
│  [Continue Button] (opt.)   │
└──────────────▲──────────────┘
               │ arrow
          ┌────┴────┐
          │ Cutout  │
          └─────────┘
```

---

## Step 7: Z-Index Layering

The tutorial system uses an 8-layer Z-index stack. Every component must be assigned to its correct layer. Misordering causes visual bugs (tooltips behind overlays, action bars behind sheets).

### The 8-Layer Standard

| Layer | Component | Z-Index | Description |
|-------|-----------|---------|-------------|
| 1 | App content | z-0 | The real app views underneath everything. Always at base level. |
| 2 | Blocking overlay | z-10 | Full-screen opaque overlay for intro/transition screens (no cutout). |
| 3 | Tutorial spotlight | z-20 | The semi-transparent overlay with cutout. Sits above app content. |
| 4 | Gesture indicator | z-30 | Swipe/drag hint animations. Must be visible above the spotlight overlay. |
| 5 | Inline sheet (background) | z-40 | Sheet scrim/backdrop when a form sheet is open during tutorial. |
| 6 | Inline sheet (surface) | z-50 | The sheet content itself (form fields, pickers). |
| 7 | Tooltip | z-60 | Always above sheets and overlays. The primary information element. |
| 8 | Action bar | z-70 | Fixed to the bottom of the screen. Always the topmost interactive element. |

### Layer Rules

- Never place a tooltip below the spotlight overlay — it becomes unreadable.
- Never place the action bar below a sheet — the user must always be able to skip or go back.
- When a sheet is open, the spotlight layer is hidden (sheet replaces the spotlight as the focus).
- Gesture indicators must be above the spotlight but below the tooltip — the indicator animates in the cutout area while the tooltip provides instruction above.

### Platform Implementation

- **iOS (SwiftUI):** Use `.zIndex()` modifiers on ZStack children. Overlay and spotlight are a single view with a mask. Tooltip and action bar are separate views at higher zIndex.
- **Web (React/CSS):** Use `z-index` on positioned elements. Overlay is a fixed div with a CSS mask or SVG cutout. Tooltip and action bar are fixed-position divs with higher z-index. Ensure `position: fixed` on all tutorial layers to escape any `overflow: hidden` ancestors.

---

## Step 8: Action Bar Design

The action bar is fixed to the bottom of the screen and provides navigation controls for the tutorial. Three layouts cover all phase types.

### Layout 1: Three-Button (Standard)

```
┌─────────────────────────────────────────┐
│  [Back]       [Skip]       [Continue]   │
└─────────────────────────────────────────┘
```

- **Use for:** Most phases after the first. The user can go back, skip, or continue.
- **Back:** Returns to the previous phase. Disabled (hidden or grayed) on the first phase.
- **Skip:** Advances without completing the action. Label: "Skip" or "I know this."
- **Continue:** Advances to the next phase. May be disabled until an action is completed.

### Layout 2: Two-Button (First Phase)

```
┌─────────────────────────────────────────┐
│          [Skip]            [Continue]    │
└─────────────────────────────────────────┘
```

- **Use for:** The first phase of the tutorial. No "Back" because there is no previous phase.
- Also use for phases where going back does not make sense (after a form submission, after a branch decision).

### Layout 3: One-Button (Info Phases)

```
┌─────────────────────────────────────────┐
│              [Continue]                  │
│           (full width)                   │
└─────────────────────────────────────────┘
```

- **Use for:** Information-only phases, celebration phases, and completion phases. Skip is not relevant (nothing to skip), and back is not needed.

### Action Bar Specifications

| Property | Value |
|----------|-------|
| Height | 60px content + safe area inset (iOS) / 60px (web) |
| Background | Surface color from design system, or white/dark matching overlay |
| Top border | 1px separator, opacity 0.1 |
| Button height | 44px minimum (iOS touch target) / 40px minimum (web) |
| Button style | Continue = primary (filled). Skip = ghost/text. Back = ghost/text. |
| Safe area | On iOS, add bottom safe area inset (34px on Face ID devices). On web, no inset needed. |
| Position | Fixed to the bottom of the viewport. Never scrolls. |

### Button States

- **Continue (enabled):** Primary color, full opacity, tappable.
- **Continue (disabled):** Primary color at 0.4 opacity, not tappable. Use when the phase requires an action before advancing.
- **Continue (loading):** Replace label with a spinner. Use during async operations (form submission, data save).
- **Skip:** Always enabled. Ghost style (text-only or outline).
- **Back:** Enabled on all phases except the first. Ghost style.

---

## Step 9: Progress Indication

Show the user where they are in the tutorial. Four options ranked by recommendation.

### Option 1: Progress Bar (Recommended)

A thin horizontal bar at the top of the overlay that fills from left to right as phases are completed.

- **Height:** 2-3px
- **Position:** Top of the overlay, full width
- **Fill:** Left-to-right, width = (currentPhase / totalPhases) * 100%
- **Color:** Brand accent color or white at 0.8 opacity
- **Animation:** Width transition 300ms ease-out on each phase change
- **Background:** White at 0.2 opacity (subtle track)

Best for: All tutorials. Minimal, unobtrusive, universally understood.

### Option 2: Dots

Small circles representing each phase. The current phase dot is filled or enlarged.

- **Size:** 6px diameter, 8px spacing
- **Position:** Below the tooltip or above the action bar
- **Active dot:** Filled with accent color, or 8px diameter
- **Inactive dot:** Outline only, or filled at 0.3 opacity

Best for: Tutorials with fewer than 8 phases. More than 8 dots become a visual clutter problem.

### Option 3: Fraction

Text showing "3 of 12" in the tooltip or action bar.

- **Position:** Inside the tooltip header area, or in the action bar center
- **Format:** "[current] of [total]" — not "3/12" (the slash is ambiguous)
- **Font:** Secondary text style, smaller than tooltip description

Best for: Tutorials where exact position matters to the user (e.g., "almost done" reassurance).

### Option 4: Percentage (Avoid)

"25% complete" displayed somewhere in the UI.

**Avoid this option.** Percentages feel corporate and impersonal. They also create jarring jumps (8% to 17% feels wrong when "1 of 12" to "2 of 12" feels natural). Use fractions instead if a numeric indicator is needed.

---

## Step 10: Guided Interaction Modes

Two modes govern how the user interacts with the app during the tutorial.

### Restricted Mode

Only the spotlight target is interactive. All other elements are blocked by the overlay.

- **Taps inside cutout:** Pass through to the element
- **Taps outside cutout:** Blocked. Show a subtle pulse on the spotlight.
- **Scrolling:** Blocked unless the spotlight target is in a scrollable area
- **Navigation:** Blocked (tabs, back button, etc.)

**Use for:** Critical action phases where the user must perform a specific action. Phases where tapping the wrong element would break the tutorial flow. Gesture phases (swipe, drag) where the gesture must hit the correct target.

### Free Mode

The user can interact with the entire app. The tutorial overlay provides guidance but does not restrict interaction. The tutorial advances when the user performs the correct action, regardless of other interactions.

- **Taps:** All pass through. The tutorial monitors for the correct action.
- **Scrolling:** Allowed everywhere
- **Navigation:** Allowed — but the tutorial pauses if the user leaves the target screen and resumes when they return

**Use for:** Exploration phases where the user should poke around. Phases near the end of the tutorial when the user is more confident. Any phase where restricting interaction would feel frustrating.

### Mode Selection Guide

| Phase Type | Recommended Mode |
|------------|-----------------|
| First action in the tutorial | Restricted |
| Form field entry | Restricted |
| Gesture (swipe, drag) | Restricted |
| Orientation (look at this screen) | N/A (no interaction expected) |
| Mid-tutorial actions | Restricted |
| Late-tutorial actions | Free (user is experienced now) |
| Celebration | N/A (no interaction with app) |

---

## Step 11: Inline Sheet Patterns

Some tutorial phases involve forms (project creation, task details) that open as sheets within the tutorial. These inline sheets need special treatment.

### Design Rules for Tutorial Inline Sheets

| Property | Standard Sheet | Tutorial Inline Sheet |
|----------|---------------|----------------------|
| Drag handle | Visible | Hidden — prevent dismissal |
| Dismiss gesture | Swipe down to close | Disabled — tutorial controls navigation |
| Chrome | Full (title bar, close button) | Reduced (title only, no close button) |
| Surface elevation | Standard | Elevated — visually above the spotlight layer |
| Top corner radius | 12-16px | 16px — consistent, slightly more pronounced |
| Max height | 90-95% screen | 70% screen — must leave room for tooltip above |
| Scroll | Internal scroll if content exceeds height | Internal scroll, with scroll indicator |
| Background | Surface color | Elevated surface color (lighter/brighter than standard) |

### Sheet + Tutorial Interaction

When an inline sheet is open during the tutorial:
1. The spotlight overlay is hidden (the sheet IS the focus).
2. The tooltip repositions above the sheet, pointing down at the relevant field.
3. The action bar remains visible below the sheet.
4. The gesture indicator (if active) appears on the sheet's field, not on the overlay.

### Field-by-Field Guidance

For form sheets where the tutorial guides field-by-field entry:
1. Highlight the current field with a colored border (accent color, 2px).
2. Position the tooltip to point at the highlighted field.
3. Dim (opacity 0.5) all other fields in the form.
4. On field completion, animate the highlight to the next field.
5. Continue button is disabled until the current field has valid input.

---

## Step 12: Pre-Implementation Checklist

Run this checklist on every tutorial UX design before handing off to implementation.

### Overlay and Spotlight

- [ ] Overlay does not block content the user needs to reference during the phase
- [ ] Cutout padding is appropriate — 8px default, 16px for small elements
- [ ] Cutout corner radius matches target element + 4px
- [ ] Spotlight animates smoothly between phases (300ms ease-out)
- [ ] Tap-through works correctly — taps in cutout reach the element, taps outside are blocked

### Tooltip Positioning

- [ ] Tooltip is readable against both the overlay background and the cutout gap
- [ ] Tooltip does not overlap the spotlight cutout
- [ ] Tooltip arrow points toward the cutout
- [ ] Tooltip is clamped to screen edges with 16px margin
- [ ] Tooltip width does not exceed 320px (mobile) or 400px (web)

### Action Bar

- [ ] Action bar does not overlap important app elements at the bottom of the screen
- [ ] Action bar respects safe area insets (iOS bottom bar, web: no issue)
- [ ] Button touch targets meet 44px minimum (iOS) / 40px minimum (web)
- [ ] Continue button disables correctly when action is required
- [ ] Back button is hidden on the first phase

### Progress and Indicators

- [ ] Progress indicator is visible throughout the tutorial
- [ ] Progress updates on every phase transition
- [ ] Gesture hint animations are visible above the spotlight overlay
- [ ] Gesture hints replay after 8 seconds of inaction

### Layering

- [ ] Z-index stack follows the 8-layer standard
- [ ] No component is visually behind a layer it should be above
- [ ] Sheets correctly hide the spotlight when open
- [ ] Tooltip is always the topmost informational element

### Interaction Modes

- [ ] Restricted mode blocks all interaction outside the cutout
- [ ] Free mode allows full app interaction while monitoring for the correct action
- [ ] Navigation is blocked in restricted mode (tabs, back button)
- [ ] Tutorial pauses gracefully if the user leaves the target screen in free mode

### Accessibility

- [ ] Tooltip text contrast meets 4.5:1 against its background
- [ ] Action bar buttons have accessible labels (not icon-only)
- [ ] VoiceOver/screen reader announces the tooltip content on phase entry
- [ ] Reduced-motion setting disables spotlight and tooltip animations (instant show/hide instead)
- [ ] Color is not the only indicator of the active spotlight (shape and position also indicate)

### Edge Cases

- [ ] Tutorial behaves correctly on the smallest supported screen (iPhone SE / 320px web)
- [ ] Tutorial behaves correctly on the largest supported screen (iPad Pro / 1440px web)
- [ ] Tutorial handles interruptions gracefully (phone call, app backgrounding, tab switch)
- [ ] Tutorial can resume from any phase after app restart
- [ ] Dark mode and light mode are both accounted for in overlay opacity and tooltip colors
