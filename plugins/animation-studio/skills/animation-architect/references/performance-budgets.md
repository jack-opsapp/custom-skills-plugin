# Performance Budgets — Comprehensive Reference

Performance engineering is what makes the best tool shippable. Every technique in this document exists to solve a specific problem that arises AFTER choosing the highest-quality animation approach. These are not reasons to downgrade — they are the engineering that eliminates the need to downgrade.

---

## Web Performance

### LCP Impact by Framework

| Framework | Parse Time | Bundle Size (gzipped) | LCP Impact | Mitigation |
|-----------|-----------|----------------------|------------|------------|
| CSS | 0ms JS | 0KB JS | None | Already optimal |
| Framer Motion 12 | ~2ms parse | ~15KB | Negligible if tree-shaken | Include in main bundle — small enough |
| GSAP core | ~5ms parse | ~23KB | Low | Dynamic import if not above fold |
| GSAP + ScrollTrigger | ~8ms parse | ~30KB | Low-Medium | Dynamic import, init on scroll |
| GSAP + SplitText + ScrollTrigger | ~10ms parse | ~38KB | Medium | Dynamic import all plugins |
| Three.js core | ~25ms parse | ~150KB | High | MUST lazy load. Never in critical path. |
| Three.js + R3F + Drei | ~40ms parse | ~200KB | High | React.lazy + Suspense with static fallback |
| lottie-web | ~15ms parse | ~50KB | Medium | Dynamic import, start on viewport entry |

### Code Splitting Patterns

**GSAP — Dynamic import with plugin registration:**

```typescript
// gsap-loader.ts — centralized lazy loader
let gsapInstance: typeof import("gsap") | null = null;
let scrollTriggerLoaded = false;

export async function getGSAP() {
  if (!gsapInstance) {
    gsapInstance = await import("gsap");
  }
  return gsapInstance;
}

export async function getGSAPWithScroll() {
  const gsap = await getGSAP();
  if (!scrollTriggerLoaded) {
    const { ScrollTrigger } = await import("gsap/ScrollTrigger");
    gsap.gsap.registerPlugin(ScrollTrigger);
    scrollTriggerLoaded = true;
  }
  return gsap;
}

// Usage in component
useEffect(() => {
  const init = async () => {
    const { gsap } = await getGSAPWithScroll();
    const { ScrollTrigger } = await import("gsap/ScrollTrigger");
    // Now animate
    gsap.to(ref.current, {
      scrollTrigger: { trigger: ref.current, scrub: true },
      y: -100,
    });
  };
  init();

  return () => {
    // Cleanup — critical for GSAP in React
    ScrollTrigger.getAll().forEach(t => t.kill());
  };
}, []);
```

**Three.js / R3F — React.lazy with static first frame:**

```tsx
import { Suspense, lazy } from "react";

// Static fallback — the first frame of the 3D scene as an image or CSS
const SceneFallback = () => (
  <div
    className="w-full h-full bg-cover bg-center"
    style={{ backgroundImage: "url(/scene-first-frame.webp)" }}
  />
);

const Scene3D = lazy(() => import("./Scene3D"));

export function HeroSection() {
  return (
    <Suspense fallback={<SceneFallback />}>
      <Scene3D />
    </Suspense>
  );
}
```

**Framer Motion — typically small enough to include in main bundle.** If you need to split:

```tsx
// Only needed if you're using heavy FM features (layout, AnimatePresence)
// and the animation is below the fold
const AnimatedSection = lazy(() => import("./AnimatedSection"));
```

### Intersection Observer — Off-Screen Pause

Every continuous animation (particle systems, ambient effects, Canvas loops) MUST pause when off-screen. This is not optional.

```typescript
class AnimationController {
  private observer: IntersectionObserver;
  private rafId: number | null = null;
  private isVisible = false;
  private element: HTMLElement;
  private animateFn: (time: number) => void;

  constructor(element: HTMLElement, animateFn: (time: number) => void) {
    this.element = element;
    this.animateFn = animateFn;

    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !this.isVisible) {
          this.isVisible = true;
          this.start();
        } else if (!entry.isIntersecting && this.isVisible) {
          this.isVisible = false;
          this.stop();
        }
      },
      { threshold: 0.05 } // Start when 5% visible
    );

    this.observer.observe(element);
  }

  private start() {
    const loop = (time: number) => {
      if (!this.isVisible) return;
      this.animateFn(time);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.stop();
    this.observer.disconnect();
  }
}
```

### requestIdleCallback — Deferred Init

For animations below the fold or non-critical ambient effects, defer initialization until the browser is idle.

```typescript
function deferAnimation(initFn: () => void) {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(initFn, { timeout: 2000 }); // Max 2s wait
  } else {
    // Safari fallback (requestIdleCallback landed in Safari 17.4 but may not be available on older targets)
    setTimeout(initFn, 100);
  }
}

// Usage
useEffect(() => {
  deferAnimation(() => {
    initParticleSystem(canvasRef.current);
  });
}, []);
```

### Web Worker Offloading — OffscreenCanvas

For CPU-intensive Canvas animations (particle physics, complex procedural generation), offload computation and rendering to a Web Worker.

```typescript
// main.ts
const canvas = document.getElementById("particles") as HTMLCanvasElement;
const offscreen = canvas.transferControlToOffscreen();
const worker = new Worker(
  new URL("./particle-worker.ts", import.meta.url),
  { type: "module" }
);
worker.postMessage({ type: "init", canvas: offscreen }, [offscreen]);

// Send interaction events to worker
canvas.addEventListener("pointermove", (e) => {
  const rect = canvas.getBoundingClientRect();
  worker.postMessage({
    type: "pointer",
    x: (e.clientX - rect.left) * devicePixelRatio,
    y: (e.clientY - rect.top) * devicePixelRatio,
  });
});
```

```typescript
// particle-worker.ts
let ctx: OffscreenCanvasRenderingContext2D;
let width: number;
let height: number;

self.onmessage = (e) => {
  if (e.data.type === "init") {
    const canvas = e.data.canvas as OffscreenCanvas;
    ctx = canvas.getContext("2d")!;
    width = canvas.width;
    height = canvas.height;
    requestAnimationFrame(loop);
  }
  if (e.data.type === "pointer") {
    // Update pointer position for particle interaction
    pointerX = e.data.x;
    pointerY = e.data.y;
  }
};

function loop(time: number) {
  updateParticles(time);
  renderParticles(ctx, width, height);
  requestAnimationFrame(loop);
}
```

### DPI-Aware Canvas Setup

Every Canvas element must account for `devicePixelRatio` to avoid blurry rendering on high-DPI displays.

```typescript
function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  // Set canvas buffer size to match physical pixels
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // Set CSS size to match layout size
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr); // Scale all drawing operations

  return ctx;
}

// Handle resize
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    setupCanvas(entry.target as HTMLCanvasElement);
  }
});
resizeObserver.observe(canvas);
```

### Time-Based Animation (requestAnimationFrame)

Always use time-based animation — never assume a constant frame rate. Monitors run at 60Hz, 120Hz, 144Hz, and variable refresh rates.

```typescript
let lastTime = 0;

function loop(currentTime: number) {
  const deltaTime = (currentTime - lastTime) / 1000; // seconds
  lastTime = currentTime;

  // Cap deltaTime to prevent explosion after tab-away
  const dt = Math.min(deltaTime, 0.1); // Max 100ms step

  // Update positions using dt, not frame count
  particles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  });

  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame((time) => {
  lastTime = time;
  requestAnimationFrame(loop);
});
```

### Performance Monitoring

Use `PerformanceObserver` to detect long animation frames in production.

```typescript
// Detect animation frames exceeding budget (16.6ms for 60fps)
if ("PerformanceObserver" in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        // Long animation frame — potential jank source
        console.warn(
          `[animation-perf] Long frame: ${entry.duration.toFixed(1)}ms`,
          entry
        );
      }
    }
  });

  try {
    observer.observe({ type: "long-animation-frame", buffered: true });
  } catch {
    // long-animation-frame not supported — fall back to longtask
    observer.observe({ type: "longtask", buffered: true });
  }
}
```

### Device Capability Detection

Detect low-end devices and reduce animation quality (not remove animation).

```typescript
interface DeviceCapability {
  tier: "low" | "mid" | "high";
  maxParticles: number;
  enableBloom: boolean;
  enableShadows: boolean;
  targetFPS: number;
}

function detectCapability(): DeviceCapability {
  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as any).deviceMemory || 2; // GB, Chrome-only
  const gpu = getGPUTier(); // Use @pmndrs/detect-gpu for accurate GPU tier

  // Connection-aware: reduce quality on slow connections
  const connection = (navigator as any).connection;
  const isSlow = connection?.effectiveType === "2g"
    || connection?.effectiveType === "slow-2g";

  if (cores <= 4 || memory <= 2 || isSlow) {
    return {
      tier: "low",
      maxParticles: 100,
      enableBloom: false,
      enableShadows: false,
      targetFPS: 30,
    };
  }

  if (cores <= 8 || memory <= 4) {
    return {
      tier: "mid",
      maxParticles: 500,
      enableBloom: true,
      enableShadows: false,
      targetFPS: 60,
    };
  }

  return {
    tier: "high",
    maxParticles: 2000,
    enableBloom: true,
    enableShadows: true,
    targetFPS: 60,
  };
}
```

---

## iOS Performance

### ProMotion (120Hz) — CADisplayLink Configuration

ProMotion displays refresh at up to 120Hz. To take advantage of this, configure `CADisplayLink` with `preferredFrameRateRange`.

```swift
// Target 120fps when possible, minimum 60fps, preferred 120fps
let displayLink = CADisplayLink(target: self, selector: #selector(step))
displayLink.preferredFrameRateRange = CAFrameRateRange(
    minimum: 60,
    maximum: 120,
    preferred: 120  // Float — the preferred rate when system can sustain it
)
displayLink.add(to: .main, forMode: .common)
```

```swift
// SwiftUI: TimelineView automatically adapts to ProMotion
// For custom Canvas drawing at display refresh rate:
TimelineView(.animation) { timeline in
    Canvas { context, size in
        let now = timeline.date.timeIntervalSinceReferenceDate
        // Draw at whatever rate the display supports
        drawParticles(context: context, size: size, time: now)
    }
}
```

### Metal GPU Budget

The GPU frame budget on iOS devices at 120Hz is ~8.3ms per frame. At 60Hz, ~16.6ms. Keep compute shaders well under these limits.

```swift
// Profile compute shader execution time
let startTime = CACurrentMediaTime()
computeEncoder.dispatchThreadgroups(threadGroups, threadsPerThreadgroup: threadsPerGroup)
computeEncoder.endEncoding()
commandBuffer.commit()
commandBuffer.waitUntilCompleted()
let elapsed = CACurrentMediaTime() - startTime
// Target: <6ms for 120fps (leaves ~2ms headroom for render pass)
// Target: <12ms for 60fps (leaves ~4ms headroom)
```

**Optimization strategies:**
- Use `MTLBuffer` with `.storageModeShared` for CPU/GPU shared data (particles) — avoids copy
- Prefer `simd_float4` over `simd_float3` for alignment (GPU reads aligned data faster)
- Use instanced rendering for particles: one draw call for all particles
- Keep thread group size at 256 for Apple GPUs (matches SIMD width)

### CADisplayLink vs Timer

**Always use `CADisplayLink` for visual animations.** `Timer` is not synchronized with the display refresh cycle and will produce jank.

```swift
// CORRECT: CADisplayLink
class AnimationDriver {
    private var displayLink: CADisplayLink?
    private var lastTimestamp: CFTimeInterval = 0

    func start() {
        displayLink = CADisplayLink(target: self, selector: #selector(step))
        displayLink?.preferredFrameRateRange = CAFrameRateRange(
            minimum: 60, maximum: 120, preferred: 120
        )
        displayLink?.add(to: .main, forMode: .common)
    }

    @objc private func step(_ link: CADisplayLink) {
        let dt = lastTimestamp == 0 ? 0 : link.timestamp - lastTimestamp
        lastTimestamp = link.timestamp
        // Cap dt to prevent explosion after app resume
        let clampedDt = min(dt, 0.1)
        updateAnimation(deltaTime: clampedDt)
    }

    func stop() {
        displayLink?.invalidate()
        displayLink = nil
        lastTimestamp = 0
    }
}
```

```swift
// WRONG: Timer — not synced with display, causes tearing
// Timer.scheduledTimer(withTimeInterval: 1/60, repeats: true) { ... }
// NEVER DO THIS for visual animation
```

### @State vs @Observable for Animation-Driving State

SwiftUI state changes trigger view re-evaluation. For animation-driving state that changes every frame, this matters.

```swift
// For per-frame updates (particle positions, time-based animation):
// Use Canvas + TimelineView — NO state changes per frame
TimelineView(.animation) { timeline in
    Canvas { context, size in
        // Read time directly — no @State updates, no view diffing
        let time = timeline.date.timeIntervalSinceReferenceDate
        drawScene(context: context, size: size, time: time)
    }
}

// For infrequent animation triggers (button tap, state change):
// @State / @Observable is fine — SwiftUI handles the diffing
@State private var isExpanded = false

Button("Expand") {
    withAnimation(.spring(response: 0.35, dampingFraction: 0.75)) {
        isExpanded.toggle()
    }
}
```

**Key rule:** If the value changes every frame, do NOT store it in `@State` or `@Observable`. Use `TimelineView` + `Canvas` or `CADisplayLink` with direct layer manipulation. If the value changes on user interaction or state transitions, `@State` and `@Observable` are correct.

### Background/Foreground Transitions

Pause all animations when the app goes to background. Resume when it returns. This prevents wasted battery and avoids animation state corruption.

```swift
// SwiftUI
@Environment(\.scenePhase) private var scenePhase

.onChange(of: scenePhase) { _, newPhase in
    switch newPhase {
    case .active:
        animationController.resume()
    case .inactive:
        // Optional: pause here too if needed
        break
    case .background:
        animationController.pause()
    @unknown default:
        break
    }
}
```

```swift
// UIKit / Core Animation
NotificationCenter.default.addObserver(
    self,
    selector: #selector(appDidEnterBackground),
    name: UIApplication.didEnterBackgroundNotification,
    object: nil
)

NotificationCenter.default.addObserver(
    self,
    selector: #selector(appWillEnterForeground),
    name: UIApplication.willEnterForegroundNotification,
    object: nil
)

@objc private func appDidEnterBackground() {
    displayLink?.isPaused = true
    // For CAEmitterLayer: set birthRate to 0
    emitterLayer.birthRate = 0
}

@objc private func appWillEnterForeground() {
    displayLink?.isPaused = false
    emitterLayer.birthRate = 1
}
```

### Instruments Profiling

When animation performance is suspect, profile with Instruments — do not guess.

**Core Animation Instrument:**
- Shows committed CATransaction time per frame
- Identifies offscreen rendering (yellow overlay)
- Shows blended layers (green overlay) — reduce transparency to improve compositing
- Measures GPU utilization

**Metal System Trace:**
- Shows per-frame GPU timeline: compute, vertex, fragment stages
- Identifies pipeline stalls and buffer contention
- Measures shader execution time per draw call

**Time Profiler:**
- Identify CPU bottlenecks in animation callbacks
- Look for main thread stalls during animation (disk I/O, network, heavy computation)

**Tips:**
- Always profile on a real device — Simulator uses macOS GPU, completely different performance
- Profile on the lowest-spec device you support (iPhone SE 3rd gen, iPad 9th gen)
- `CALayer.shouldRasterize = true` can improve performance for complex static sublayer trees — but rasterized layers use memory and become blurry when scaled. Use carefully.

### Thermal Throttling

iOS devices throttle CPU/GPU under sustained load. Account for this in long-running animations.

```swift
// Monitor thermal state
let thermalState = ProcessInfo.processInfo.thermalState

switch thermalState {
case .nominal:
    // Full quality
    particleCount = 1000
    targetFrameRate = 120
case .fair:
    // Slightly reduced — user won't notice
    particleCount = 750
    targetFrameRate = 120
case .serious:
    // Noticeably reduced — prevent thermal shutdown
    particleCount = 300
    targetFrameRate = 60
case .critical:
    // Minimal — device is about to throttle hard
    particleCount = 100
    targetFrameRate = 30
@unknown default:
    particleCount = 500
    targetFrameRate = 60
}

// React to changes
NotificationCenter.default.addObserver(
    forName: ProcessInfo.thermalStateDidChangeNotification,
    object: nil,
    queue: .main
) { _ in
    adjustAnimationQuality()
}
```

---

## Cross-Platform

### Reduced Motion

This is a mandatory requirement, not an optimization. Every animation must handle reduced motion.

**Web:**

```typescript
// Detect at runtime
const prefersReduced = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// React to changes (user can toggle during session)
const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
mediaQuery.addEventListener("change", (e) => {
  updateAnimations(e.matches);
});

// CSS — media query
@media (prefers-reduced-motion: reduce) {
  .parallax-hero {
    /* Replace parallax with gentle crossfade */
    animation: none;
    transition: opacity 0.5s ease;
  }

  .particle-field {
    /* Replace particles with static gradient */
    animation: none;
    background: linear-gradient(to bottom, var(--color-canvas), var(--color-surface));
  }
}

// Framer Motion — global config
<MotionConfig reducedMotion="user">
  {/* All children respect system preference */}
  {/* "user" = use system setting, "always" = always reduce, "never" = ignore */}
</MotionConfig>
```

**iOS:**

```swift
// SwiftUI
@Environment(\.accessibilityReduceMotion) var reduceMotion

// Provide alternative animation — NEVER just disable
var entryAnimation: Animation {
    reduceMotion
        ? .easeInOut(duration: 0.3)  // Gentle, no spring, no bounce
        : .spring(response: 0.4, dampingFraction: 0.7)  // Full spring
}

// For particle effects
var particleBirthRate: Float {
    reduceMotion ? 0 : 50  // No particles — use static gradient instead
}

// UIKit
if UIAccessibility.isReduceMotionEnabled {
    // Alternative path
}

// React to changes
NotificationCenter.default.addObserver(
    forName: UIAccessibility.reduceMotionStatusDidChangeNotification,
    object: nil,
    queue: .main
) { _ in
    adjustForReducedMotion()
}
```

**The rule:** Provide a DIFFERENT animation that achieves the same emotional beat. Never disable animation entirely — that removes the emotional impact. A particle burst becomes a radial pulse. A spring bounce becomes a smooth ease. A parallax scroll becomes a gentle opacity fade. The beat remains; the motion adapts.

### Battery Impact

| Animation Type | Approximate Battery Cost | Mitigation |
|---------------|------------------------|------------|
| Continuous `requestAnimationFrame` / `CADisplayLink` at 60fps | ~3-5% per hour | IntersectionObserver/scenePhase pause when off-screen/backgrounded |
| WebGL/Metal rendering at 60fps | ~5-8% per hour | Pause off-screen, reduce to 30fps when not in focus |
| CSS transitions (event-driven) | Negligible | None needed — fires only on state change |
| Canvas particle system (100 particles, 60fps) | ~2-3% per hour | Pause off-screen, reduce count on low battery |
| Ambient CSS animation (continuous) | ~0.5-1% per hour | `animation-play-state: paused` when off-screen |

**Low battery detection (web):**
```typescript
if ("getBattery" in navigator) {
  const battery = await (navigator as any).getBattery();
  if (battery.level < 0.2 && !battery.charging) {
    // Reduce animation intensity
    reduceParticleCount(0.5); // 50% of normal
    // Pause ambient animations
    pauseAmbientAnimations();
  }
}
```

**Low battery detection (iOS):**
```swift
UIDevice.current.isBatteryMonitoringEnabled = true
let batteryLevel = UIDevice.current.batteryLevel // 0.0 to 1.0
let batteryState = UIDevice.current.batteryState

if batteryLevel < 0.2 && batteryState != .charging {
    reduceAnimationIntensity()
}
```

### Memory Budgets

| Resource | Budget per animation | Notes |
|----------|---------------------|-------|
| Canvas 2D (web) | width * height * 4 bytes * dpr^2 | A 1920x1080 canvas at 2x DPI = ~33MB. Off-screen buffers double this. |
| WebGL textures | Sum of all texture sizes. 2048x2048 RGBA = 16MB. | Use power-of-two sizes. Compress with basis/KTX2. |
| Three.js scene | Geometry + textures + render targets | Dispose unused geometries/textures. Use `useDispose` from Drei. |
| CAEmitterLayer (iOS) | ~50 bytes per particle * count * lifetime | 1000 particles * 3s lifetime = ~150KB active at once |
| Metal buffers (iOS) | Explicit — you allocate it | Double-buffer: 2 * particleCount * stride. 10000 * 32 bytes * 2 = 640KB. |

**Cleanup pattern (web):**
```typescript
// React: always clean up in useEffect return
useEffect(() => {
  const animation = initAnimation();
  return () => {
    animation.destroy(); // Kill rAF, remove listeners, release Canvas
  };
}, []);

// GSAP: use gsap.context for automatic cleanup
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.to(".box", { x: 100 });
    ScrollTrigger.create({ trigger: ".section", ... });
  }, containerRef);

  return () => ctx.revert(); // Kills all animations and ScrollTriggers in context
}, []);
```

**Cleanup pattern (iOS):**
```swift
// SwiftUI: stop in .onDisappear
.onDisappear {
    displayLink?.invalidate()
    displayLink = nil
    emitterLayer.removeFromSuperlayer()
}

// Metal: release buffers
deinit {
    particleBuffer = nil
    pipelineState = nil
    commandQueue = nil
    // MTLDevice is shared — don't release it
}
```
