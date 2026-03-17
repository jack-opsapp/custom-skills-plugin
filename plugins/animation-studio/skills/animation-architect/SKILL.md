---
name: animation-architect
description: Animation decision engine — framework selection, complexity assessment, emotional beat mapping, haptic principles, tradeoff protocol. Gateway skill for all animation work.
metadata:
  priority: 10
  pathPatterns:
    - "**/animations/**"
    - "**/animated/**"
    - "**/effects/**"
    - "**/Animations/**"
    - "**/Effects/**"
  importPatterns:
    - "framer-motion"
    - "gsap"
    - "three"
    - "@react-three/fiber"
    - "CAAnimation"
    - "withAnimation"
  promptSignals:
    phrases:
      - "animation"
      - "animate"
      - "motion"
      - "transition"
      - "haptic"
      - "particle"
      - "scroll effect"
      - "interactive"
---

# Animation Architect

The gateway skill for the `animation-studio` plugin. This skill is always loaded first — before any platform-specific or domain-specific animation skill. It is the decision engine that answers three questions for every animation request:

1. **What emotional beat does this animation serve?**
2. **What tool produces the best possible result?**
3. **What performance engineering is required to ship it?**

Every downstream skill (`web-animations`, `ios-animations`, `data-visualization`, `interactive-scenes`, `marketing-hero`) inherits the decisions made here. If this skill makes the wrong call, nothing downstream can fix it.

---

## 1. Purpose & Philosophy

### The Three Questions

Before writing a single keyframe, before importing a single library, before choosing CSS or Metal — answer these:

1. **Emotional beat.** What is the user feeling right now, and what should they feel after this animation plays? If you cannot articulate the emotional transition, the animation has no purpose. Remove it.
2. **Best tool.** Across every framework available on this platform, which one produces the highest-fidelity result for this specific animation? Not the lightest. Not the most familiar. The best.
3. **Ship path.** Given the best tool, what engineering is required to make it production-ready? Bundle splitting, lazy loading, graceful degradation, reduced motion alternatives — these are solvable problems. Solve them.

### Five Core Principles

**Principle 1: Start with the best possible result.**
Pick the tool that produces the highest quality output. If that tool has a large bundle, split it. If it requires GPU access, detect capabilities and degrade gracefully on low-end devices. If it adds complexity, manage that complexity. Never start by asking "what's the simplest tool?" Start by asking "what's the best result?" and engineer backward from there.

**Principle 2: No over-engineering — but no under-engineering either.**
A thousand lines of well-structured animation code that delivers perfection beats 200 lines that deliver 75%. Complexity is not the enemy. Unnecessary complexity is the enemy. If the animation demands a custom shader, write a custom shader. If it demands a CSS transition, write a CSS transition. Match the solution to the requirement, not to an arbitrary simplicity target.

**Principle 3: Animations serve an emotional arc.**
Every motion decision is measured against the brand's emotional transformation. For OPS: the user arrives skeptical, overwhelmed, drowning in chaos. The animation arc takes them from "this might work" through "this is impressive" to "I need this." Every easing curve, every duration, every particle trajectory either serves that arc or undermines it. There is no neutral animation.

**Principle 4: Visuals over numbers, always.**
An animation that benchmarks at 58fps but looks incredible ships. An animation that benchmarks at 60fps but feels cheap does not. Frame rate is a means, not an end. Perceived smoothness, timing, weight, and emotional resonance are the actual metrics. When in doubt, trust the eye.

**Principle 5: Haptics are part of the animation.**
On platforms that support it (iOS always, Android when available), haptic feedback is not an afterthought bolted on after the visual animation is done. It is designed simultaneously. The haptic is timed to the moment of peak visual change — the bottom of the bounce, the snap point, the moment of full extension. A beautifully animated interaction without haptics is incomplete.

---

## 2. Framework Decision Matrix

Every animation request is evaluated across six dimensions simultaneously. The combination of these dimensions determines which tool produces the best result.

### The Six Dimensions

| Dimension | Spectrum | What It Measures |
|-----------|----------|------------------|
| **Interactivity** | Passive / Reactive / Interactive / Gamified | How much does user input drive the animation? |
| **Spatial** | 2D flat / 2D+depth / Pseudo-3D / True 3D | What spatial model does the animation operate in? |
| **Trigger** | Time-driven / Scroll-driven / User-driven / State-driven / Continuous | What initiates and controls the animation? |
| **Element count** | Single / Small group (2-10) / Field (10-100) / System (100+) | How many independently animated elements? |
| **Viewport coverage** | Inline / Section / Full viewport / Multi-viewport | How much screen real estate does the animation occupy? |
| **Target frame rate** | 30fps / 60fps / 120fps (ProMotion) | What frame rate does the animation demand for perceived quality? |

### How to Use the Matrix

Score each dimension for your animation. Then find the combination in the reference tables (see `references/framework-decision-matrix.md`). The recommended stack is the one that produces the **best result** for that combination — not the lightest, not the most common.

### Quick Decision Examples

**Web:**
- Button hover ripple: Passive, 2D flat, User-driven, Single, Inline, 60fps → **CSS**
- Page transition with shared elements: Passive, 2D+depth, State-driven, Small group, Full viewport, 60fps → **Framer Motion (layout animations)**
- Scroll-driven parallax hero with text splits: Reactive, 2D+depth, Scroll-driven, Small group, Full viewport, 60fps → **GSAP ScrollTrigger + SplitText**
- Interactive 3D product viewer: Interactive, True 3D, User-driven, Single, Section, 60fps → **Three.js / R3F**
- Particle field responding to cursor: Reactive, 2D flat, Continuous, System (100+), Full viewport, 60fps → **Canvas 2D or WebGL**
- Data dashboard with animated charts: Reactive, 2D flat, State-driven, Field (10-100), Section, 60fps → **Framer Motion or D3 + Canvas**

**iOS:**
- Card expand/collapse: Passive, 2D flat, State-driven, Single, Inline, 60fps → **SwiftUI withAnimation + matchedGeometryEffect**
- Onboarding particle burst: Passive, 2D+depth, Time-driven, System (100+), Full viewport, 120fps → **Core Animation CAEmitterLayer or Metal**
- Interactive drag-to-reorder with spring physics: Interactive, 2D flat, User-driven, Small group, Section, 120fps → **SwiftUI DragGesture + spring animations**
- Achievement celebration with custom haptic sequence: Passive, 2D+depth, Time-driven, Field (10-100), Full viewport, 120fps → **Core Animation + CHHapticEngine**
- Real-time mesh gradient background: Continuous, 2D flat, Time-driven, Single, Full viewport, 120fps → **SwiftUI MeshGradient + TimelineView or Metal**

---

## 3. Emotional Beat Categories

Every animation serves one of six emotional beats. Identifying the beat is the FIRST step — before framework selection, before performance planning, before anything.

### Entry / Arrival

**What the user feels:** Skepticism. Curiosity. First impressions forming.

**What the animation must do:** Counter skepticism with confidence. Arrive with precision — crisp, clean, assured. No wobble, no bounce, no playful overshoot. The animation says "we are serious, and we are very good at this."

**Timing:** Fast entries (200-350ms). Sharp ease-out (`cubic-bezier(0.16, 1, 0.3, 1)` or equivalent spring with high stiffness, low damping). Elements arrive at their destination and stop — no settling, no ringing.

**Haptic pairing:** Light impact (`.light` at 0.6 intensity on iOS) at the moment the element reaches its final position. Not at the start of the animation — at the landing.

### Discovery

**What the user feels:** Engaged. Exploring. Testing the waters.

**What the animation must do:** Reward exploration instantly. Every hover, every tap, every scroll should produce immediate, satisfying visual feedback. The animation says "yes, this responds to you — keep going."

**Timing:** Near-instant response (50-150ms for initial feedback). Longer follow-through is acceptable (300-500ms) but the first visual change must be immediate. Spring physics work well here — they feel alive.

**Haptic pairing:** Selection feedback on iOS (`UISelectionFeedbackGenerator`). Light, precise, encouraging. On web, no haptic — rely on visual response speed.

### Commitment

**What the user feels:** Making a decision. About to act. Weight of consequence.

**What the animation must do:** Add weight to the moment. The animation acknowledges that this action matters. A button press that submits a form, a swipe that confirms a choice, a tap that starts a process — these deserve gravitas.

**Timing:** Medium duration (300-500ms). Ease curves that decelerate deliberately — the animation "lands" with weight. Consider a brief pause (100-200ms) before the confirmation state resolves.

**Haptic pairing:** Medium impact at the moment of commitment (`.medium` at 0.8 intensity), followed by success notification 200ms later (`.success`). The two-beat haptic — thud, then confirmation — communicates "received, and confirmed."

### Achievement

**What the user feels:** Satisfaction. Completion. Pride.

**What the animation must do:** Celebrate with restraint. This is the hardest beat to get right. Too much celebration feels patronizing ("good job clicking the button!"). Too little feels like the system doesn't care. The sweet spot: a clean, sharp moment of acknowledgment. A stamp, not a parade.

**Timing:** Quick primary animation (200-300ms), optional subtle follow-through (500-800ms fade/settle). The peak moment is sharp and decisive.

**Haptic pairing:** On iOS, a custom CHHapticEngine crescendo — three rapid transients increasing in intensity (0.4 → 0.6 → 0.9) over 300ms, followed by a soft continuous buzz at 0.3 for 200ms. This creates a "building to peak" sensation. On web, a single 15ms vibrate at the peak.

### Transition

**What the user feels:** Moving between contexts. Brief disorientation possible.

**What the animation must do:** Maintain spatial continuity. The user should understand where they came from and where they are going. Shared element transitions, directional slides, scale changes that preserve origin — these orient the user. The animation says "you're still in the same place, just looking at something different."

**Timing:** 250-400ms. Ease-in-out or spring with moderate damping. The animation should feel like a camera move, not a cut.

**Haptic pairing:** Light impact at the midpoint of the transition — the moment of maximum velocity. This anchors the physical sensation to the visual motion.

### Ambient

**What the user feels:** Settled. At rest. Background awareness.

**What the animation must do:** Create atmosphere without demanding attention. Ambient animations are felt, not watched. Subtle gradient shifts, gentle particle drift, slow breathing effects. The moment a user consciously notices an ambient animation, it has failed.

**Timing:** Slow (2-8 seconds per cycle). Gentle easing or linear interpolation. No sharp changes, no sudden movements.

**Haptic pairing:** Almost never. If paired at all, `.soft` at 0.3 intensity, maximum once every 2 seconds. On web, skip haptics entirely for ambient animations.

---

## 4. Performance Engineering

Performance is a problem you solve AFTER choosing the best tool. It is never a reason to choose a lesser tool. Every performance concern has an engineering solution.

### Bundle Size

**Problem:** Three.js adds ~150KB gzipped. GSAP adds ~30KB. This affects initial load.

**Solution:** Dynamic imports. No animation framework should be in the critical path.

```typescript
// Web: Load GSAP only when needed
const initScrollAnimation = async () => {
  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);
  // Now animate
};

// Web: React.lazy for R3F scenes
const Scene3D = React.lazy(() => import("./Scene3D"));
// Render with Suspense + static fallback (first frame of animation)
```

On iOS, this concern does not exist — frameworks are compiled in, not downloaded.

### Mobile CPU

**Problem:** Low-end devices cannot sustain complex animations at 60fps.

**Solution:** Detect capability and reduce QUALITY, not remove the animation.

```typescript
// Web: Detect device capability
const isLowEnd = navigator.hardwareConcurrency <= 4
  || (navigator as any).deviceMemory <= 4;

// Reduce particle count, disable blur/shadows, simplify shaders
const particleCount = isLowEnd ? 200 : 1000;
const enableBloom = !isLowEnd;
```

```swift
// iOS: Check thermal state
let isThrottled = ProcessInfo.processInfo.thermalState == .serious
    || ProcessInfo.processInfo.thermalState == .critical
// Reduce particle count, lower frame rate target
```

### LCP / First Contentful Paint

**Problem:** Animation initialization blocks rendering.

**Solution:** Static first frame, deferred initialization.

```typescript
// Web: Render a static version immediately, animate on idle
useEffect(() => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => initAnimation());
  } else {
    setTimeout(() => initAnimation(), 100);
  }
}, []);
```

On iOS, use `.task {}` or `.onAppear {}` to defer animation start after the view has rendered.

### Battery

**Problem:** Continuous `requestAnimationFrame` or `CADisplayLink` drains battery.

**Solution:** Pause when not visible.

```typescript
// Web: Intersection Observer to pause off-screen animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animation.play();
    } else {
      animation.pause();
    }
  });
}, { threshold: 0.1 });
observer.observe(animationContainer);
```

```swift
// iOS: Pause on background
.onChange(of: scenePhase) { _, newPhase in
    switch newPhase {
    case .active: resumeAnimations()
    case .background, .inactive: pauseAnimations()
    @unknown default: break
    }
}
```

### Reduced Motion

**Problem:** Users with vestibular disorders need alternatives.

**Solution:** Provide a DIFFERENT animation that achieves the same emotional beat, not a disabled state. A parallax scroll becomes a crossfade. A particle explosion becomes a radial opacity pulse. A spring bounce becomes a smooth scale-up.

```typescript
// Web
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// NOT: if (prefersReducedMotion) return; // WRONG — removes emotion
// YES: use different animation that serves same beat
const variants = prefersReducedMotion
  ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }  // gentle fade
  : { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };  // slide up
```

```swift
// iOS
@Environment(\.accessibilityReduceMotion) var reduceMotion

// Provide alternative, don't remove
withAnimation(reduceMotion ? .easeInOut(duration: 0.3) : .spring(response: 0.4, dampingFraction: 0.7)) {
    isVisible = true
}
```

See `references/performance-budgets.md` for comprehensive patterns and numbers.

---

## 5. Tradeoff Protocol

### Default Position

The default is always the highest-quality result. No exceptions. No unilateral downgrades. If the best tool for a particle field is WebGL, the recommendation is WebGL — not Canvas 2D "because it's simpler," not CSS "because it's lighter."

### When Tradeoffs Arise

Sometimes a legitimate tension exists. The best visual result requires a 200KB library on a page with a strict 100KB JS budget. The ideal animation needs WebGL but the target audience is 40% Safari 15 on older iPads. The perfect haptic sequence requires CHHapticEngine but the app's minimum deployment target is iOS 15.

When the agent identifies a legitimate tradeoff — not a preference, not a shortcut, a genuine engineering constraint — it enters **plan mode**.

### Plan Mode

Plan mode is a structured presentation of options. It is NOT a discussion. It is NOT open-ended brainstorming. It contains:

1. **The default recommendation** (best quality) with full implementation path, including how performance/compatibility concerns would be engineered around.
2. **The alternative** with a precise description of what is gained (smaller bundle, wider compatibility, simpler maintenance) and what is lost (visual fidelity, emotional impact, smoothness).
3. **The agent's honest assessment** — which option the agent believes produces the better result and why.
4. **The user decides.** The agent does not decide. The agent presents and recommends.

### When to Enter Plan Mode

- Two or more viable approaches with material tradeoffs (quality vs. bundle, fidelity vs. compatibility)
- The user's stated constraints conflict with the best-quality approach
- Platform limitations genuinely prevent the ideal solution (not "it's harder" but "it's impossible")

### When NOT to Enter Plan Mode

- The best tool is clearly identifiable with no material tradeoff — just recommend it
- The question is yes/no ("should this button have a hover effect?") — just answer it
- The question is open-ended exploration ("what kind of animation would work here?") — that is brainstorming, not tradeoff resolution
- The "tradeoff" is just implementation effort — more code is not a tradeoff, it is the job

---

## 6. Never Do List

These are absolute prohibitions. No exceptions. No "just this once."

1. **Never use `setTimeout` or `setInterval` for animation timing.** Use `requestAnimationFrame` (web) or `CADisplayLink` / `TimelineView` (iOS). Timer-based animation produces inconsistent frame pacing and janky motion.

2. **Never animate layout properties when `transform` / `opacity` achieves the same result.** Animating `width`, `height`, `top`, `left`, `margin`, or `padding` triggers layout recalculation every frame. Use `transform: translate/scale` and `opacity` — these are compositor-only and run on the GPU.

3. **Never skip reduced motion support.** Every animation must have a `prefers-reduced-motion` alternative. That alternative must serve the same emotional beat through different means — not disable the animation entirely.

4. **Never pair a haptic with an unwarranted animation.** If the animation doesn't justify haptic feedback (ambient effects, loading spinners, passive transitions the user didn't trigger), adding a haptic creates sensory noise. Haptics are earned by meaningful moments.

5. **Never add an animation that doesn't serve the emotional arc.** If you cannot articulate which emotional beat an animation serves and how it advances the user's emotional journey, the animation does not belong. Remove it.

6. **Never downgrade quality without presenting a tradeoff to the user.** The agent does not have authority to choose a lesser tool for convenience, simplicity, or bundle size without explicit user approval via the tradeoff protocol.

7. **Never use `will-change` on more than 2-3 elements simultaneously.** Excessive `will-change` promotes too many elements to compositor layers, increasing memory usage and potentially causing the GPU to thrash. Apply it only to elements that are actively animating and remove it when animation completes.

8. **Never fire-and-forget animation state.** Every animation that starts must have a defined end condition or cleanup path. Detached `requestAnimationFrame` loops, orphaned `CADisplayLink` instances, and Framer Motion variants that never resolve create memory leaks and ghost renders.

---

## 7. Brand Config Integration

The animation-studio plugin supports per-project brand configuration via `.claude/animation-studio.local.md` in the project root.

### File Format

```markdown
---
# Motion tokens
easing_default: "cubic-bezier(0.16, 1, 0.3, 1)"
easing_enter: "cubic-bezier(0.16, 1, 0.3, 1)"
easing_exit: "cubic-bezier(0.4, 0, 1, 1)"
duration_fast: "200ms"
duration_normal: "350ms"
duration_slow: "600ms"
spring_stiffness: 400
spring_damping: 30
spring_mass: 1
haptic_intensity_base: 0.6
color_primary: "#597794"
color_canvas: "#0A0A0A"
---

# Brand Motion Direction

## Character
Military tactical minimalist. Every motion is deliberate, precise, earned.

## Constraints
- No bouncy/playful animations
- No emoji-style celebrations
- No bright confetti or party effects
- Celebration = restraint. A clean stamp, a subtle pulse, a beat of silence.

## Easing Philosophy
Sharp ease-out entries (things arrive with purpose).
Clean ease-in exits (things leave without lingering).
Spring physics only where weight/physicality serves the interaction.
```

### Precedence Rules

1. **Brand motion config** (`.claude/animation-studio.local.md`) takes precedence over all other sources for motion-specific decisions: easing curves, durations, spring parameters, haptic intensity, celebration style.
2. **Interface design system** (`.interface-design/system.md`) takes precedence for spatial decisions: spacing, sizing, color, typography, layout.
3. When they conflict on a motion decision, brand motion config wins.
4. When they conflict on a spatial/visual decision, interface design system wins.
5. When neither provides guidance, the animation-architect defaults in this document apply.

### Reading the Config

The YAML frontmatter contains machine-readable tokens. Use these directly in code:

```typescript
// Web — apply brand tokens
const MOTION = {
  easing: { default: [0.16, 1, 0.3, 1], exit: [0.4, 0, 1, 1] },
  duration: { fast: 0.2, normal: 0.35, slow: 0.6 },
  spring: { stiffness: 400, damping: 30, mass: 1 },
};
```

```swift
// iOS — apply brand tokens
extension Animation {
    static let brandSpring = Animation.spring(
        response: 0.35,
        dampingFraction: 0.75,
        blendDuration: 0
    )
    static let brandEntry = Animation.easeOut(duration: 0.2)
    static let brandExit = Animation.easeIn(duration: 0.2)
}
```

The markdown body contains qualitative direction. Read it to understand the emotional intent — this guides decisions the tokens cannot encode (whether to use particles vs. solid shapes, whether a celebration is a stamp or a shimmer, how aggressive a spring should feel).

---

## 8. Skill Routing

After this skill has determined the emotional beat, framework, and performance strategy, it routes to the appropriate downstream skill for implementation.

### Decision Tree

```
Is this web code (JS/TS/CSS/HTML)?
├── Yes → animation-studio:web-animations
│
Is this iOS/Swift code?
├── Yes → animation-studio:ios-animations
│
Is this a chart, graph, metric, or data visualization?
├── Yes → animation-studio:data-visualization
│
Is this a tutorial, demo, walkthrough, or interactive explainer?
├── Yes → animation-studio:interactive-scenes
│
Is this a hero section, landing page, or marketing surface?
├── Yes → animation-studio:marketing-hero
│
None of the above?
└── Stay in animation-architect — provide framework-level guidance only
```

### Routing Notes

- **Multiple skills can apply.** A marketing hero section on web routes to both `web-animations` AND `marketing-hero`. Load both.
- **Data visualization on iOS** routes to both `ios-animations` AND `data-visualization`. The iOS skill handles platform specifics; the data-viz skill handles chart semantics.
- **Interactive tutorials** are a special case: they combine narrative pacing (interactive-scenes) with platform implementation (web-animations or ios-animations). Load the scene skill first for pacing decisions, then the platform skill for code.
- **When in doubt, load more skills.** Over-routing is better than under-routing. A skill that loads but isn't needed costs nothing. A skill that was needed but not loaded costs quality.

### What This Skill Passes Downstream

When routing, the animation-architect passes a structured brief to the downstream skill:

1. **Emotional beat** — which of the six categories this animation serves
2. **Framework recommendation** — the specific tool/library to use
3. **Performance constraints** — any engineering requirements (lazy loading, reduced motion alternative, Intersection Observer pause)
4. **Brand tokens** — the relevant motion tokens from the brand config
5. **Haptic plan** — the specific haptic feedback to pair with the animation (or explicit "no haptic" for ambient/passive)

The downstream skill does not re-evaluate these decisions. It implements them.
