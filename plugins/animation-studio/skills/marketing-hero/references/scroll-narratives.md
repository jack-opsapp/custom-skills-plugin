# Scroll Narratives & Ambient Backgrounds — Reference

Two related domains: (1) scroll-driven storytelling with pinned sections, parallax layers, and text reveals, and (2) ambient background effects that create atmosphere without demanding attention. Both serve the hero and marketing surface goal of communicating sophistication through motion.

---

# Part 1: Scroll Narratives

## 1. Core Concept

A scroll narrative transforms passive scrolling into active storytelling. The user's scroll position becomes the playhead of a timeline. Elements build, transform, and dissolve as the user progresses. Done right, the user feels like they're directing a film. Done wrong, it feels like a broken page that won't let them scroll.

### Key Terminology

| Term | Meaning |
|------|---------|
| **Pin** | Fixing an element to the viewport while the user scrolls past it. The page scrolls, the element stays. |
| **Scrub** | Linking animation progress directly to scroll position (0% at top → 100% at bottom). User controls playback. |
| **Trigger** | The scroll position that starts/ends an animation or pin. |
| **Parallax** | Moving layers at different rates relative to scroll speed, creating depth illusion. |
| **Snap** | Scroll positions that the page "snaps" to, creating chapter-like stopping points. |

---

## 2. GSAP ScrollTrigger (Recommended for Complex Narratives)

### Pin and Scrub Pattern

The fundamental pattern: pin a container, scrub a timeline through it.

```typescript
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Pin the hero container for 3x its height of scrolling
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '.hero-narrative',
    start: 'top top',           // Pin starts when top of trigger hits top of viewport
    end: '+=300%',              // Pin lasts for 3x viewport heights of scrolling
    pin: true,                  // Pin the trigger element
    scrub: 0.5,                 // Smooth scrub with 0.5s lag (feels polished, not jittery)
    snap: {
      snapTo: [0, 0.33, 0.66, 1],  // Snap to chapter points
      duration: { min: 0.2, max: 0.6 },
      ease: 'power2.inOut',
    },
  },
});

// Chapter 1: Title enters (scroll 0% → 15%)
tl.fromTo('.hero-title', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.15 }, 0);

// Chapter 1 → 2: Title exits while product enters (scroll 15% → 33%)
tl.to('.hero-title', { opacity: 0, y: -40, duration: 0.1 }, 0.2);
tl.fromTo('.product-showcase', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.15 }, 0.2);

// Chapter 2 → 3: Product moves aside, features list enters (scroll 33% → 66%)
tl.to('.product-showcase', { x: '-30%', duration: 0.2 }, 0.4);
tl.fromTo('.features-list', { opacity: 0, x: 100 }, { opacity: 1, x: 0, duration: 0.2 }, 0.4);

// Chapter 3: CTA enters (scroll 66% → 100%)
tl.fromTo('.hero-cta', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.15 }, 0.75);
```

### Relative Timeline Positioning

GSAP timelines use position parameters for precise choreography:

```
tl.to(el, { x: 100 }, 0)         // Start at 0 seconds
tl.to(el, { x: 100 }, 0.5)       // Start at 0.5 seconds
tl.to(el, { x: 100 }, '<')        // Start at same time as previous
tl.to(el, { x: 100 }, '<0.2')     // Start 0.2s after previous starts
tl.to(el, { x: 100 }, '>-0.1')    // Start 0.1s before previous ends (overlap)
tl.to(el, { x: 100 }, '+=0.3')    // Start 0.3s after previous ends (gap)
```

### React Integration

GSAP in React requires careful cleanup. Use `gsap.context()` for automatic cleanup:

```typescript
import { useGSAP } from '@gsap/react';

function ScrollNarrative() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=300%',
        pin: true,
        scrub: 0.5,
      },
    });

    tl.fromTo('.hero-title', { opacity: 0 }, { opacity: 1 });
    // ... more tweens

    return () => {
      // useGSAP handles cleanup automatically via gsap.context
    };
  }, { scope: containerRef }); // Scope all selectors to this container

  return (
    <div ref={containerRef}>
      <h1 className="hero-title">...</h1>
    </div>
  );
}
```

### Text Reveal Patterns

Per-character and per-word reveals timed to scroll position:

```typescript
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

// Split text into words
const split = new SplitText('.hero-headline', { type: 'words,chars' });

// Stagger words into view as user scrolls
tl.fromTo(
  split.words,
  { opacity: 0, y: 20 },
  {
    opacity: 1,
    y: 0,
    stagger: 0.02,   // 20ms between each word
    duration: 0.1,    // Each word takes 10% of timeline
  },
  0.1               // Start at 10% of scroll progress
);
```

### Scroll-Driven Counter

Numbers that count up as the user scrolls:

```typescript
const counter = { value: 0 };
tl.to(counter, {
  value: 2847,
  duration: 0.3,
  ease: 'power1.out',
  onUpdate: () => {
    document.querySelector('.metric-value')!.textContent =
      Math.round(counter.value).toLocaleString();
  },
}, 0.5);
```

---

## 3. Framer Motion useScroll (For React-Native Parallax)

When the scroll narrative doesn't require pinning or complex timelines — just parallax layers and scroll-linked transforms — Framer Motion's `useScroll` is simpler and stays within the React paradigm.

### Basic Scroll Progress

```typescript
import { motion, useScroll, useTransform } from 'framer-motion';

function ParallaxSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],  // 0 when element enters, 1 when it leaves
  });

  // Background moves at 50% of scroll speed
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);
  // Foreground moves at 120% of scroll speed
  const fgY = useTransform(scrollYProgress, [0, 1], ['0%', '10%']);
  // Opacity fades in during first 30% of scroll
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <div ref={ref} className="relative h-screen overflow-hidden">
      <motion.div style={{ y: bgY }} className="absolute inset-0 bg-layer" />
      <motion.div style={{ y: fgY, opacity }} className="relative z-10 content" />
    </div>
  );
}
```

### Spring-Smoothed Scroll Values

Raw scroll values can feel jittery. Pipe through `useSpring` for smoothing:

```typescript
import { useScroll, useTransform, useSpring } from 'framer-motion';

const { scrollYProgress } = useScroll({ target: ref });
const rawY = useTransform(scrollYProgress, [0, 1], [0, -200]);
const smoothY = useSpring(rawY, { stiffness: 100, damping: 30 });

<motion.div style={{ y: smoothY }} />
```

---

## 4. Multi-Layer Parallax Architecture

### Layer Configuration

```typescript
interface ParallaxLayer {
  /** Unique key */
  id: string;
  /** Content of this layer (image, component, etc.) */
  content: ReactNode;
  /** Depth factor: 0 = static, 1 = moves at scroll speed, >1 = foreground, <1 = background */
  depth: number;
  /** Opacity range as [start, end] mapped to scroll progress [0, 1] */
  opacityRange?: [number, number];
  /** Z-index for stacking */
  zIndex: number;
}

// Example layer configuration
const layers: ParallaxLayer[] = [
  { id: 'sky', content: <GradientSky />, depth: 0.1, zIndex: 0 },
  { id: 'mountains', content: <MountainsSVG />, depth: 0.3, zIndex: 1 },
  { id: 'device', content: <DeviceMockup />, depth: 0.6, zIndex: 2 },
  { id: 'text', content: <HeroText />, depth: 0.8, zIndex: 3, opacityRange: [0, 0.5] },
  { id: 'foreground', content: <FloatingParticles />, depth: 1.2, zIndex: 4 },
];
```

### Implementation Pattern

```typescript
function ParallaxHero({ layers }: { layers: ParallaxLayer[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  return (
    <div ref={ref} className="relative h-[200vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {layers.map(layer => (
          <ParallaxLayerRenderer
            key={layer.id}
            layer={layer}
            scrollProgress={scrollYProgress}
          />
        ))}
      </div>
    </div>
  );
}

function ParallaxLayerRenderer({
  layer,
  scrollProgress,
}: {
  layer: ParallaxLayer;
  scrollProgress: MotionValue<number>;
}) {
  const y = useTransform(
    scrollProgress,
    [0, 1],
    ['0%', `${-layer.depth * 50}%`]
  );

  const opacity = layer.opacityRange
    ? useTransform(
        scrollProgress,
        layer.opacityRange,
        [0, 1]
      )
    : undefined;

  return (
    <motion.div
      style={{ y, opacity, zIndex: layer.zIndex }}
      className="absolute inset-0"
    >
      {layer.content}
    </motion.div>
  );
}
```

---

## 5. Device Mockup Pattern

A common marketing pattern: phone/laptop mockup scrolling at a different rate than the background, with the screen content visible.

```typescript
function DeviceMockup({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  // Device floats upward as user scrolls
  const y = useTransform(scrollProgress, [0, 1], ['20%', '-30%']);
  // Slight rotation for 3D feel
  const rotateX = useTransform(scrollProgress, [0, 0.5, 1], [5, 0, -5]);
  const scale = useTransform(scrollProgress, [0, 0.5, 1], [0.9, 1, 0.95]);

  return (
    <motion.div
      style={{ y, rotateX, scale, transformPerspective: 1000 }}
      className="relative mx-auto w-[280px]"
    >
      {/* Phone frame */}
      <img src="/device-frame.png" alt="" className="relative z-10" />
      {/* Screen content — could be a video, scrolling screenshot, or live component */}
      <div className="absolute inset-[8%] rounded-[24px] overflow-hidden">
        <motion.img
          src="/app-screenshot.png"
          alt="App interface"
          style={{ y: useTransform(scrollProgress, [0.2, 0.8], ['0%', '-60%']) }}
          className="w-full"
        />
      </div>
    </motion.div>
  );
}
```

---

## 6. Snap Points

For chapter-like progression, scroll snap creates discrete stopping points:

### CSS Scroll Snap (Simple)

```css
.narrative-container {
  scroll-snap-type: y mandatory;
  overflow-y: scroll;
  height: 100vh;
}

.narrative-chapter {
  scroll-snap-align: start;
  height: 100vh;
}
```

### GSAP Snap (With Timeline)

```typescript
scrollTrigger: {
  snap: {
    snapTo: 'labelsDirectional',  // Snap to timeline labels
    duration: { min: 0.2, max: 0.5 },
    delay: 0.1,
    ease: 'power2.inOut',
  },
}

// Add labels at chapter points
tl.addLabel('chapter1', 0);
tl.addLabel('chapter2', 0.33);
tl.addLabel('chapter3', 0.66);
tl.addLabel('end', 1);
```

---

## 7. Reduced Motion for Scroll Narratives

Replace scrub-linked animations with instant state changes at scroll thresholds:

```typescript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (prefersReducedMotion) {
  // No scrub — use threshold-based visibility instead
  ScrollTrigger.create({
    trigger: '.chapter-1',
    start: 'top 80%',
    onEnter: () => gsap.set('.chapter-1-content', { opacity: 1 }),
    onLeaveBack: () => gsap.set('.chapter-1-content', { opacity: 0 }),
  });
} else {
  // Full scrub timeline
  const tl = gsap.timeline({ scrollTrigger: { scrub: 0.5, pin: true, ... } });
  // ...
}
```

---

## 8. Performance Considerations

### Pin Spacing

When using `pin: true`, GSAP adds padding below the pinned element to compensate for the space it takes up. If multiple pinned sections are stacked, this can cause layout issues. Use `pinSpacing: false` and manually manage the layout:

```typescript
scrollTrigger: {
  pin: true,
  pinSpacing: false,  // Don't add padding — we handle layout ourselves
}
```

### Will-Change Management

Only apply `will-change: transform` to elements that are actively being scrubbed. Remove it when the section scrolls past.

```typescript
scrollTrigger: {
  onToggle: ({ isActive }) => {
    const el = document.querySelector('.hero-narrative');
    if (isActive) {
      el?.style.setProperty('will-change', 'transform');
    } else {
      el?.style.removeProperty('will-change');
    }
  },
}
```

### Mobile Scroll Performance

Mobile browsers handle scroll differently (passive event listeners, compositor-driven scroll). Key rules:

1. Never call `preventDefault()` on scroll events
2. Use `passive: true` on all scroll listeners
3. Prefer `transform` over `position` changes
4. GSAP ScrollTrigger handles this automatically — don't add manual scroll listeners alongside it

---

# Part 2: Ambient Backgrounds

## 9. Purpose

Ambient backgrounds create atmosphere. They are the visual equivalent of background music — felt, not listened to. Gradient meshes that slowly shift, noise-based organic motion, subtle grain overlays. The vibe is "this page is alive" without "this page is distracting."

### The Attention Test

Show the page to someone for 10 seconds. Ask them what they noticed. If they mention the background animation, it's too prominent. If they say the page "felt premium" or "felt alive" without identifying why, the ambient background is working.

---

## 10. Gradient Mesh Animation

Slowly morphing multi-stop gradients that create an organic, living background.

### CSS Implementation (Lightest)

```css
.ambient-gradient {
  background: linear-gradient(135deg, var(--g1), var(--g2), var(--g3), var(--g4));
  background-size: 400% 400%;
  animation: ambient-shift 20s ease-in-out infinite;
}

@keyframes ambient-shift {
  0%, 100% { background-position: 0% 50%; }
  25% { background-position: 100% 0%; }
  50% { background-position: 100% 100%; }
  75% { background-position: 0% 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .ambient-gradient {
    animation: none;
    background-position: 0% 50%;
  }
}
```

### Canvas Implementation (More Control)

For organic, noise-driven motion that CSS cannot achieve:

```typescript
// Simplex noise displacement
import { createNoise3D } from 'simplex-noise';

const noise3D = createNoise3D();
const SPEED = 0.0003;  // Very slow
const SCALE = 0.003;   // Large features

function drawGradient(ctx: CanvasRenderingContext2D, time: number) {
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let x = 0; x < width; x += 2) {  // Skip every other pixel for performance
    for (let y = 0; y < height; y += 2) {
      const n = noise3D(x * SCALE, y * SCALE, time * SPEED);
      const t = (n + 1) / 2;  // Normalize to 0-1

      // Interpolate between two brand colors
      const r = lerp(color1.r, color2.r, t);
      const g = lerp(color1.g, color2.g, t);
      const b = lerp(color1.b, color2.b, t);

      // Fill 2x2 block (since we skip pixels)
      for (let dx = 0; dx < 2; dx++) {
        for (let dy = 0; dy < 2; dy++) {
          const i = ((y + dy) * width + (x + dx)) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = 255;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
```

### WebGL Shader Implementation (Smoothest)

For the highest quality with minimal CPU:

```glsl
// Fragment shader — noise-based gradient
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
varying vec2 vUv;

// Simplex noise function (include snoise3D)

void main() {
  float n1 = snoise(vec3(vUv * 3.0, uTime * 0.1));
  float n2 = snoise(vec3(vUv * 2.0 + 5.0, uTime * 0.08));

  vec3 color = mix(uColor1, uColor2, smoothstep(-0.5, 0.5, n1));
  color = mix(color, uColor3, smoothstep(-0.3, 0.7, n2));

  gl_FragColor = vec4(color, 1.0);
}
```

---

## 11. Grain Overlay

A subtle noise texture layered over content creates a film-like quality. It's the difference between "digital" and "cinematic."

### CSS SVG Filter (Zero JS)

```css
.grain-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.04;  /* Very subtle */
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
  mix-blend-mode: overlay;
  z-index: 1;
}
```

### Animated Grain (Subtle Flicker)

For a more cinematic feel, shift the grain pattern slightly every few frames:

```typescript
function AnimatedGrain({ opacity = 0.04 }: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const size = 128;  // Small texture, tiled
    canvas.width = size;
    canvas.height = size;

    let frame = 0;
    const imageData = ctx.createImageData(size, size);

    function generateGrain() {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
    }

    function tick() {
      frame++;
      // Update grain every 3rd frame (10fps at 30fps) for subtle flicker
      if (frame % 3 === 0) generateGrain();
      rafId = requestAnimationFrame(tick);
    }

    let rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none mix-blend-overlay"
      style={{ opacity, imageRendering: 'pixelated' }}
      aria-hidden="true"
    />
  );
}
```

---

## 12. Battery-Efficient Animation Loop

Ambient animations run continuously but must not drain battery. Key techniques:

### 30fps Cap

Most ambient effects look identical at 30fps vs 60fps. Cap the frame rate:

```typescript
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
let lastFrameTime = 0;

function animate(now: number) {
  rafId = requestAnimationFrame(animate);
  const delta = now - lastFrameTime;
  if (delta < FRAME_INTERVAL) return;
  lastFrameTime = now - (delta % FRAME_INTERVAL);

  // Actual rendering here
  draw(now);
}
```

### Pause When Off-Screen

```typescript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        resumeAnimation();
      } else {
        pauseAnimation();
      }
    });
  },
  { threshold: 0.01 }
);

observer.observe(canvasElement);
```

### Pause When Tab Is Hidden

```typescript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pauseAnimation();
  } else {
    resumeAnimation();
  }
});
```

### Reduce Quality on Low-End Devices

```typescript
const isLowEnd =
  navigator.hardwareConcurrency <= 4 ||
  (navigator as any).deviceMemory <= 4;

// For canvas-based ambient:
const resolution = isLowEnd ? 0.25 : 0.5;  // Render at quarter/half res
canvas.width = containerWidth * resolution * devicePixelRatio;
canvas.height = containerHeight * resolution * devicePixelRatio;
// CSS stretches it to full size — blur hides the low resolution
canvas.style.filter = 'blur(20px)';  // Ambient gradients look fine blurred
```

---

## 13. Color Interpolation

Ambient backgrounds interpolate between brand colors. Use perceptually uniform interpolation (not RGB) for smooth, natural-looking transitions.

### HSL Interpolation

```typescript
function hslLerp(
  color1: { h: number; s: number; l: number },
  color2: { h: number; s: number; l: number },
  t: number
): { h: number; s: number; l: number } {
  // Handle hue wraparound (e.g., 350° → 10° should go through 0°, not through 180°)
  let dh = color2.h - color1.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;

  return {
    h: (color1.h + dh * t + 360) % 360,
    s: color1.s + (color2.s - color1.s) * t,
    l: color1.l + (color2.l - color1.l) * t,
  };
}
```

### OKLCH Interpolation (Best Quality, Modern Browsers)

```css
/* CSS native — browser handles perceptual interpolation */
.gradient {
  background: linear-gradient(
    in oklch,
    oklch(0.3 0.05 250),   /* Dark brand blue */
    oklch(0.2 0.03 200)    /* Darker brand teal */
  );
}
```

---

## 14. Composition Pattern

Combine gradient mesh + grain + optional vignette for a complete ambient background:

```typescript
function AmbientBackground({
  colors,
  grainOpacity = 0.04,
  vignetteOpacity = 0.3,
}: AmbientBackgroundProps) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Layer 1: Animated gradient mesh */}
      <MeshGradient colors={colors} />

      {/* Layer 2: Grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay"
        style={{
          opacity: grainOpacity,
          backgroundImage: `url("data:image/svg+xml,...")`,
          backgroundSize: '256px 256px',
        }}
      />

      {/* Layer 3: Vignette (darkened edges) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: vignetteOpacity,
          background: 'radial-gradient(ellipse at center, transparent 40%, black 100%)',
        }}
      />
    </div>
  );
}
```
