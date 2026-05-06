---
name: OPS — Project Motion Identity
version: 1
created: 2026-05-06
platforms: [web, ios]

aesthetic: "Military tactical minimalist. Dark monochrome canvas, borders carry elevation, terse and refined. Designed for trades operators who live in the UI eight hours a day, often in gloves, sunlight, and patchy connectivity."
motion_personality: "Crisp & precise — minimal & restrained. Instant-feel transitions. One easing curve, no spring or bounce. Motion confirms intent rather than celebrates it. The brand voice is 'hell. yeah.' not 'Hell yeah!' — motion follows."

speed:
  enter: "180ms"      # spatial reveal — rail open, drawer slide, panel mount
  exit: "120ms"       # dismiss, fade-out, draft swap
  transition: "150ms" # default for color/state shifts (hover, focus, active)
  complex: "240ms"    # coordinated multi-element reveal (rare; most motion stays in 120–180)

easing:
  enter: "cubic-bezier(0.22, 1, 0.36, 1)"
  exit: "cubic-bezier(0.22, 1, 0.36, 1)"
  spring: { stiffness: 0, damping: 0 }   # springs not used. drag-and-drop reorder is the lone exception — use library defaults there.

celebration: "Two-tier. Default for high-frequency actions (sending a reply, archiving, navigating, marking a task done): nothing — the result speaks. State changes, the item leaves the queue, the row disappears. For milestone moments only (thread closed, estimate accepted, invoice marked paid): a single 200ms olive #9DB582 fill or border pulse on the affected element, then gone. No confetti, no checkmark stamps, no scale bounces, no toast theatrics."

haptics: "Web: none. iOS: confirmations and errors only — never on every tap. Use OPSStyle.swift / OPSHaptics on iOS; honor reduce-motion as a haptic damper too."

colors:
  background: "#0E0F12"   # page (OPS-Web inbox surfaces); #000000 elsewhere in OPS-Web spec v2
  surface: "#16181C"      # panel — cards, rails, composer
  accent: "#6F94B0"       # steel blue — primary CTA & focus ring ONLY (one element per screen max)
  text: "#EDEDED"
  success: "#9DB582"      # olive — done, paid, accepted
  warning: "#C4A868"      # tan — overdue, awaiting, expiring (warning only)
  error: "#B58289"        # rose — urgent / overdue collections

typography:
  primary: "Mohave"                              # body, headings, UI labels
  secondary: "JetBrains Mono"                    # numbers, timestamps, micro-labels — tabular + slashed zero
  weights: [300, 400, 500, 600]
  caps_labels: true                              # Cake Mono Light 300 for uppercase display (titles, buttons, badges)
  tracking: "-0.003em body / 0.18em caps display / 0.2em mono meta"

radii:
  small: "4px"     # chip
  medium: "5px"    # btn (sidebar uses 6, modal uses 12)
  large: "10px"    # panel / card
---

## Emotional Arc

**Starting state.** A trades business owner — roofer, plumber, electrician — drowning in texts, paper, and chaos. Sticky notes on the dash. Twelve unread messages from the foreman. An estimate they were supposed to send three days ago. Tired, behind, wired, mistrustful of "tech." Walking into the app while juggling a phone in one hand and a customer waiting on a callback. Stress is the baseline.

**Target state.** Quiet relief. The sense of finally having a hand on the wheel. Not "this software is cool" — "this is the thing that gives me my life back." The app feels like a lifeline, not a tech demo. Motion is in service of that: never showy, never decorative, always pointing at the next thing that needs them. When something resolves, it just resolves.

## Brand Direction

OPS sells confidence, not software. Every motion choice should pass the question: *does this make a stressed-out operator feel like they just found something they can trust?* If the animation says "look what I can do," delete it. If it says "here's what changed, you can move on," keep it.

**Tempo and feel.** Fast and decisive. 120ms for low-meaning state changes (color shifts, draft swaps, hover-in/out). 180ms for spatial transitions (rail open, drawer reveal, modal mount). One easing curve everywhere — `cubic-bezier(0.22, 1, 0.36, 1)`, Framer Motion form `[0.22, 1, 0.36, 1]`. No spring physics. No bounce. The lone exception is drag-and-drop reorder, where library default springs are acceptable because the user is physically moving the element and the squish maps to direct manipulation.

**Celebration philosophy.** Two-tier. Most actions get nothing — the result speaks. The reply just sends. The thread just leaves the queue. The task just checks. For milestone moments only — a thread closing, an estimate being accepted, an invoice marked paid — a single 200ms olive `#9DB582` pulse (border or fill, depending on element) marks the transition, then vanishes. No checkmark stamps. No confetti. No scale bounces. No exclamation. The brand voice is "hell. yeah." not "Hell yeah!" — and motion follows.

**Provenance and the agent palette.** Anything Claude-authored renders in the lavender agent scale (`#8A7FB8` and the `agent*` tokens — `agentHi #B5ABDC`, `agentText #C9C0E6`, `agentText2 #A39CC9`, `agentBorder rgba(138,127,184,0.18)`, `agentBg rgba(138,127,184,0.04)`). Lavender is RESERVED for Claude surfaces — never for category chips, status pills, links, "Your turn" bands, or human-authored drafts. When motion happens on agent surfaces (an AI summary fading in, a Claude draft loading into the composer, the auto-sent banner appearing), easing and tempo stay identical to the rest of the system; only the color identity differs. This keeps the user's read of "who wrote what" instant and trustworthy.

**Visual depth and shadows.** Borders carry elevation, not shadows. The only allowed shadow is the composer focus ring (`0 0 0 1px rgba(111,148,176,0.4)`). Motion respects this — no animated shadows, no drop-shadow lifts, no glow effects. The olive milestone pulse is a bordered/filled element on its own, not a glow.

**Reduced motion.** `prefers-reduced-motion: reduce` is honored everywhere. Replace duration-based transitions with instant state changes — never strip the state change itself. The user must still see *what* changed, just without the in-between. iOS: also damp haptics under reduce-motion.

**Platform implementations.**
- **Web (OPS-Web)** — Framer Motion (canonical) + Tailwind + CSS transitions. Use `EASE_SMOOTH = [0.22, 1, 0.36, 1]` constant. Honor `prefers-reduced-motion` via `useReducedMotion()`. Loaded inbox/console surfaces live on `#0E0F12`; rest of OPS-Web spec v2 lives on `#000000`.
- **iOS (ops-ios)** — SwiftUI native + Core Animation. Tokens live in `OPSStyle.swift`; haptics in `OPSHaptics`. Same easing curve translated to `Animation.timingCurve(0.22, 1, 0.36, 1, duration:)`. Same tempo bands (0.12 / 0.18 / 0.24).

**The test.** Does this motion choice make a stressed-out operator feel like they found a lifeline? If yes, ship. If it feels like a tech demo, delete and try again.
