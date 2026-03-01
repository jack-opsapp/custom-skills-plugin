---
name: tutorial-copywriter
description: This skill should be used when writing tutorial tooltip text, crafting onboarding button labels, writing completion screen copy, creating empty state guidance, writing tutorial error messages, writing swipe or gesture hint text, or generating any text content for onboarding tutorials.
---

# Tutorial Copywriter

## Purpose

Write all text content for onboarding tutorials — tooltips, buttons, celebrations, error recovery, empty states, and gesture hints. Every string the user reads during a tutorial flow is authored using this skill.

**Announce at start:** "I'm using the tutorial-copywriter skill to write tutorial copy."

**Workflow position:**
```
flow-architect  →  tutorial-copywriter  →  tutorial-ux-design  →  implementation
```

## When to Use

- Writing tooltip headlines and descriptions for tutorial phases
- Choosing button labels for continue, skip, and action buttons
- Writing celebration/completion screen copy
- Writing empty state guidance text
- Writing error and recovery messages within tutorials
- Writing gesture hint text (swipe, drag, pinch instructions)
- Reviewing or editing existing tutorial copy

**NOT for:** Designing flow structure or phase sequences (use `flow-architect`). Marketing copy, app store descriptions, or website text (use `ops-copywriter`). General UI labels outside of tutorials.

---

## Copy Principles

Follow these 10 rules for every piece of tutorial text. Violations of any rule require revision before delivery.

### Rule 1: Action Verbs First

Start every headline with a verb. The user should know what to do before finishing the first word.

- CORRECT: "Tap the + button to create a project"
- WRONG: "The + button is used to create new projects"
- WRONG: "Projects can be created by tapping +"

### Rule 2: 6-8 Words Per Headline Maximum

Tooltip headlines must be 6-8 words. Count them. If the headline exceeds 8 words, cut. No exceptions.

- CORRECT: "Create your first project" (5 words)
- CORRECT: "Drag the project to accepted" (6 words)
- WRONG: "Here you can create your very first project in the system" (11 words)

### Rule 3: 1-2 Lines Per Description Maximum

Tooltip descriptions support the headline with context. Maximum 2 lines of text at the tooltip's display width (approximately 40-50 characters per line). If it takes more than 2 lines, the description is too long.

### Rule 4: No Jargon

Write at a 5th-8th grade reading level. Field crews, not software engineers, are the audience. Avoid technical terms, acronyms without explanation, and abstract business language.

- CORRECT: "See all your jobs for the week"
- WRONG: "View your aggregated project pipeline"
- WRONG: "Access the CRUD interface for tasks"

### Rule 5: Encouraging But Not Patronizing

Save celebration language for real milestones. Do not praise trivial actions.

- CORRECT after completing a form: "Nice work — your first project is live."
- WRONG after tapping a button: "Great job tapping that button!"
- WRONG after reading a tooltip: "You're doing amazing!"

Reserve "Nice work," "Well done," and equivalent phrases for: completing a multi-step form, finishing a section of the tutorial, completing the entire tutorial.

### Rule 6: Platform Tone

Adjust formality slightly by platform:

| Platform | Verb | Tone |
|----------|------|------|
| iOS | "Tap" | Slightly formal, concise, Apple-style |
| Web | "Click" or "Tap" (touch devices) | Slightly casual, conversational |

iOS copy should feel like Apple's onboarding — clean, minimal, precise. Web copy can be slightly warmer and more conversational.

### Rule 7: Present Tense, Imperative Mood

Every instruction uses present tense and imperative mood. No future tense ("You will see..."), no conditional ("You could tap..."), no passive voice ("The button can be tapped...").

- CORRECT: "Tap the calendar tab"
- WRONG: "You'll want to tap the calendar tab"
- WRONG: "The calendar tab should be tapped"

### Rule 8: Specific Over Vague

Name the exact element, screen, or action. Avoid generic instructions.

- CORRECT: "Create your first project"
- WRONG: "Get started"
- CORRECT: "Swipe left to see next week"
- WRONG: "Navigate the calendar"

### Rule 9: Benefit-Oriented When Possible

When the phase is orientation (not action), explain the benefit rather than the mechanism.

- CORRECT: "See your schedule at a glance"
- WRONG: "View the calendar screen"
- CORRECT: "Track every job from bid to close"
- WRONG: "This is the project list"

### Rule 10: Consistent Terminology

Choose one term for each concept and use it throughout the entire tutorial. Do not alternate between synonyms.

| Concept | Choose ONE | Do NOT alternate with |
|---------|------------|----------------------|
| A unit of work | "project" | job, task, assignment, gig |
| A team member | "crew member" | worker, employee, team member, assignee |
| The main list | "job board" | project list, dashboard, home |
| A time entry | "schedule" | calendar, agenda, planner |

Document the chosen terms at the start of the copywriting process and reference them throughout.

---

## Copy Types

### Tooltip Headlines

**Pattern:** `[Verb] [object]` or `[Verb] [object] [context]`

| Example | Word Count | Phase Type |
|---------|------------|------------|
| "Create your first project" | 5 | Action |
| "Assign a crew member" | 4 | Action |
| "Drag to the accepted column" | 6 | Gesture |
| "Swipe to close the project" | 6 | Gesture |
| "Check your weekly schedule" | 5 | Orientation |
| "Welcome to your job board" | 6 | Orientation |
| "Set the project start date" | 6 | Form |
| "Add a client name" | 4 | Form |

### Tooltip Descriptions

**Pattern:** `[What it does] + [why it matters]`

Descriptions add context the headline cannot fit. They answer "so what?" for the user.

| Headline | Description |
|----------|-------------|
| "Create your first project" | "Projects organize your work by client and location." |
| "Assign a crew member" | "Crew members get notified and can track their assignments." |
| "Drag to the accepted column" | "Accepted projects show up on your schedule." |
| "Check your weekly schedule" | "See every assigned job for the week ahead." |
| "Set the project start date" | "Your crew will see this on their calendar." |
| "Welcome to your job board" | "This is where all your projects live — from new leads to completed work." |

Rules for descriptions:
- First sentence: what the feature does (functional)
- Second sentence (optional): why it matters (benefit)
- Never repeat the headline in different words
- End with a period, not an exclamation point

### Continue Button Labels

Default label is "Continue." Use phase-specific variants only when the context calls for it.

| Label | When to Use |
|-------|-------------|
| "Continue" | Default. Most phases. Neutral progression. |
| "Next" | Sequential phases where the user is moving through a series. |
| "Got it" | After an explanation or orientation phase. Signals understanding. |
| "Let's go" | Final phase before the user enters the real app. Energy and momentum. |
| "Done" | Completion screen. The tutorial is over. |
| "Try it" | Before an action phase. Invites the user to perform the action. |
| "See how" | Before a demonstration phase. Curiosity driver. |

Never use "OK" as a button label. It is ambiguous and lacks direction.

### Skip Labels

| Label | When to Use |
|-------|-------------|
| "Skip" | Default skip button. Neutral. Advances to the next phase. |
| "I know this" | Empowering variant. Use when the phase teaches a common pattern. |
| "Skip tutorial" | Full escape. Exits the entire tutorial. Place in the action bar, not the tooltip. |

Never use "Dismiss," "Close," or "Cancel" for skip actions — these imply error or accident.

### Celebration Copy

Celebration copy appears at milestone phases and at tutorial completion.

**Structure:** `[Acknowledgment] + [Stat or specific detail]`

#### By completion speed:

| Speed | Duration | Example |
|-------|----------|---------|
| Fast | <45 seconds | "Speed demon. You've got the basics down." |
| Standard | 45-90 seconds | "Nice work — you're ready to run your first project." |
| Slow | >90 seconds | "You're all set. Time to put it into action." |

#### By milestone:

| Milestone | Example |
|-----------|---------|
| First action completed | "First project created. You're officially in business." |
| Midpoint reached | "Halfway there. Just a few more things to cover." |
| Tutorial complete | "That's everything. Your job board is ready." |

Include a completion stat when available: "Completed in 38 seconds" or "3 of 3 features explored."

Never use: "Congratulations!" (too formal), "Yay!" (too juvenile), "You did it!" (patronizing for adults).

### Error and Recovery Copy

Tutorial errors include: feature failed to load, network issue during tutorial, state corruption, or the user got lost.

**Pattern:** `[What happened] + [What to do]`

| Situation | Copy |
|-----------|------|
| Generic error | "Something went wrong. Tap here to try again." |
| Network error | "Looks like you're offline. Reconnect to continue." |
| Resuming after exit | "Let's pick up where you left off." |
| State mismatch | "Let's start this step over." |

Rules:
- Never blame the user ("You did something wrong")
- Never use technical language ("Error 500," "State desynchronized")
- Always provide a clear next action
- Keep error copy to one sentence plus one action

### Empty State Guidance

Empty states appear on screens with no data. Each empty state is a mini-tutorial that teaches what belongs here.

**Pattern:** `[What belongs here] + [How to fill it]`

| Screen | Copy |
|--------|------|
| Job Board (empty) | "No projects yet — tap + to create your first." |
| Calendar (empty) | "Your schedule is empty — create a project to see it here." |
| Crew list (empty) | "No crew members added — invite your first team member." |
| Expense list (empty) | "No expenses logged — add one from a project." |

Rules:
- Start with the empty state ("No [items] yet")
- Follow with the action to resolve it ("tap/click [element] to [action]")
- Use an em dash to connect the two parts
- One line maximum

### Gesture Hint Text

Text that accompanies animated gesture indicators (swipe arrows, drag hands, pinch circles).

| Gesture | Hint Text |
|---------|-----------|
| Swipe right | "Swipe right to accept" |
| Swipe left | "Swipe left to dismiss" |
| Drag | "Press and drag to move" |
| Pinch out | "Pinch to zoom in" |
| Pinch in | "Pinch to zoom out" |
| Long press | "Press and hold for options" |
| Pull down | "Pull down to refresh" |

Rules:
- Name the gesture first ("Swipe," "Press and drag," "Pinch")
- State the direction ("right," "left," "down")
- State the result ("to accept," "to move," "to zoom in")
- Maximum 5 words

---

## Copy Review Checklist

Run this checklist on every piece of tutorial copy before delivery:

1. [ ] Every headline starts with a verb
2. [ ] Every headline is 8 words or fewer
3. [ ] Every description is 2 lines or fewer
4. [ ] No jargon or acronyms without context
5. [ ] No passive voice in any instruction
6. [ ] Celebration copy is reserved for real milestones only
7. [ ] Terminology is consistent (same word for same concept throughout)
8. [ ] Button labels match the label conventions table (no "OK," no "Dismiss")

---

## Do's and Don'ts

| Do | Don't |
|----|-------|
| Start with a verb | Start with "This is" or "Here you can" |
| Name the specific element | Say "the button" when there are multiple buttons |
| Write at 5th-8th grade level | Use words like "aggregate," "leverage," "utilize" |
| Use present tense imperative | Use future tense ("You will see...") |
| Keep headlines to 6-8 words | Write headline sentences longer than 10 words |
| End descriptions with periods | End descriptions with exclamation points |
| Use "Tap" (iOS) or "Click" (web) | Use "Press" for tap actions (ambiguous) |
| Save praise for milestones | Praise every single action |
| Provide a clear next action in errors | Blame the user or show error codes |
| Use em dash for empty states | Use colons or semicolons in empty states |
| Test copy by reading it aloud | Ship copy without reading it at natural speed |
| Match the app's existing terminology | Invent new terms for existing features |

---

## Tone Calibration Guide

Tutorial copy sits on a spectrum from formal to casual. Calibrate based on the app's brand, audience, and platform.

### The Spectrum

```
Formal ◄──────────────────────────────► Casual

Banking app    Enterprise SaaS    Consumer iOS    Social app    Game
"Review your    "View your        "Check your     "See what's   "Let's
 account        project           schedule"        happening"    gooo!"
 summary"       dashboard"
```

### OPS App Calibration

OPS sits at **Consumer iOS** on the spectrum — professional but approachable. The audience is field service contractors, not corporate executives.

| Formal (too stiff) | OPS target | Casual (too loose) |
|--------------------|------------|-------------------|
| "Review your project portfolio" | "Check your projects" | "Yo, here are your gigs" |
| "Navigate to the scheduling interface" | "See your weekly schedule" | "Peep your calendar real quick" |
| "The system will process your submission" | "Your project is live" | "Boom! Nailed it!" |

### Adjusting for Different Apps

When writing for apps other than OPS, ask:
1. What is the audience's reading level? (Match it.)
2. Is the brand playful or serious? (Match it.)
3. What platform? (iOS slightly more formal, web slightly more casual.)
4. What do competitors' tutorials sound like? (Differentiate slightly — do not copy.)

Document the tone position at the start of the copywriting session and reference it throughout.
