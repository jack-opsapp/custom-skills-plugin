# Canvas 2D / WebGL / WebGPU Reference

## When This Produces the Best Result

Use Canvas/WebGL/WebGPU when:
- You need thousands of particles with individual physics (Canvas 2D: ~5000, WebGL: ~100k, WebGPU: ~1M+)
- The visual is generative art, data stream visualization, or procedural graphics
- You need pixel-level control that CSS/SVG cannot provide
- Performance requires GPU computation (physics simulation, fluid dynamics)
- The animation must run off-main-thread via OffscreenCanvas + Web Worker

Do NOT use Canvas/WebGL when:
- You're animating DOM elements (use CSS or Motion for React)
- The visual is a 3D scene with lighting/materials (use Three.js/R3F — it handles the WebGL boilerplate)
- The animation is simple enough for CSS (fades, transforms, scroll effects)

---

## 1. DPI-Aware Canvas 2D Setup

Every Canvas setup MUST account for `devicePixelRatio` to prevent blurry rendering on high-DPI displays:

```tsx
"use client";

import { useRef, useEffect, useCallback } from "react";

interface CanvasSize {
  width: number;
  height: number;
  dpr: number;
}

function useCanvasSetup(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onResize?: (size: CanvasSize) => void
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      /* Set the actual pixel dimensions (what the GPU renders) */
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;

      /* Set the display dimensions (what CSS sees) */
      canvas!.style.width = `${rect.width}px`;
      canvas!.style.height = `${rect.height}px`;

      /* Scale the context so drawing coordinates match CSS pixels */
      const ctx = canvas!.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      onResize?.({ width: rect.width, height: rect.height, dpr });
    }

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [canvasRef, onResize]);
}
```

---

## 2. requestAnimationFrame Loop with Delta-Time Physics

```tsx
"use client";

import { useRef, useEffect } from "react";

interface AnimationLoop {
  /** Called every frame with delta time in seconds */
  update: (dt: number, elapsed: number) => void;
  /** Draws the current state */
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

function useAnimationLoop(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  loop: AnimationLoop
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();
    const startTime = lastTime;

    /* Check reduced motion preference */
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      /* Render a single static frame, no animation loop */
      const rect = canvas.getBoundingClientRect();
      loop.update(0, 0);
      loop.draw(ctx, rect.width, rect.height);
      return;
    }

    function frame(now: number) {
      /* Delta time in seconds, clamped to prevent spiral-of-death
         on tab-switch (when dt could be 10+ seconds) */
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsed = (now - startTime) / 1000;

      const rect = canvas!.getBoundingClientRect();

      /* Clear with DPR-aware dimensions */
      ctx!.save();
      const dpr = window.devicePixelRatio || 1;
      ctx!.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.scale(dpr, dpr); // Restore DPR scale

      loop.update(dt, elapsed);
      loop.draw(ctx!, rect.width, rect.height);

      ctx!.restore();
      animationId = requestAnimationFrame(frame);
    }

    animationId = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(animationId);
  }, [canvasRef, loop]);
}
```

---

## 3. Particle System Architecture

### Struct-of-Arrays for Cache Performance

For thousands of particles, use separate typed arrays (struct-of-arrays) instead of an array of objects. This gives better CPU cache utilization because the properties accessed in a tight loop are contiguous in memory.

```tsx
interface ParticleSystem {
  count: number;
  maxCount: number;
  /* Positions — x[i], y[i] gives position of particle i */
  x: Float32Array;
  y: Float32Array;
  /* Velocities */
  vx: Float32Array;
  vy: Float32Array;
  /* Visual properties */
  radius: Float32Array;
  opacity: Float32Array;
  /* Lifecycle — 0.0 = dead, 1.0 = just born */
  life: Float32Array;
  maxLife: Float32Array;
}

function createParticleSystem(maxCount: number): ParticleSystem {
  return {
    count: 0,
    maxCount,
    x: new Float32Array(maxCount),
    y: new Float32Array(maxCount),
    vx: new Float32Array(maxCount),
    vy: new Float32Array(maxCount),
    radius: new Float32Array(maxCount),
    opacity: new Float32Array(maxCount),
    life: new Float32Array(maxCount),
    maxLife: new Float32Array(maxCount),
  };
}

function emitParticle(
  ps: ParticleSystem,
  px: number,
  py: number,
  config: {
    speed: number;
    angle: number;
    spread: number;
    radius: number;
    lifetime: number;
  }
) {
  if (ps.count >= ps.maxCount) return;
  const i = ps.count++;

  ps.x[i] = px;
  ps.y[i] = py;

  /* Velocity from angle + random spread
     spread is half-cone angle in radians */
  const a = config.angle + (Math.random() - 0.5) * config.spread;
  ps.vx[i] = Math.cos(a) * config.speed;
  ps.vy[i] = Math.sin(a) * config.speed;

  ps.radius[i] = config.radius * (0.5 + Math.random() * 0.5);
  ps.opacity[i] = 1;
  ps.life[i] = config.lifetime;
  ps.maxLife[i] = config.lifetime;
}

function updateParticles(ps: ParticleSystem, dt: number, gravity: number) {
  let i = 0;
  while (i < ps.count) {
    ps.life[i] -= dt;

    if (ps.life[i] <= 0) {
      /* Swap-remove: replace dead particle with last alive particle */
      const last = ps.count - 1;
      if (i !== last) {
        ps.x[i] = ps.x[last];
        ps.y[i] = ps.y[last];
        ps.vx[i] = ps.vx[last];
        ps.vy[i] = ps.vy[last];
        ps.radius[i] = ps.radius[last];
        ps.opacity[i] = ps.opacity[last];
        ps.life[i] = ps.life[last];
        ps.maxLife[i] = ps.maxLife[last];
      }
      ps.count--;
      continue; // Don't increment i — re-check the swapped particle
    }

    /* Semi-implicit Euler integration
       Apply gravity to velocity, then velocity to position */
    ps.vy[i] += gravity * dt;
    ps.x[i] += ps.vx[i] * dt;
    ps.y[i] += ps.vy[i] * dt;

    /* Opacity fades linearly as life approaches 0 */
    ps.opacity[i] = ps.life[i] / ps.maxLife[i];

    i++;
  }
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  ps: ParticleSystem,
  color: string
) {
  /* Parse color once outside loop for performance */
  const rgb = hexToRgb(color);

  for (let i = 0; i < ps.count; i++) {
    ctx.globalAlpha = ps.opacity[i];
    ctx.beginPath();
    ctx.arc(ps.x[i], ps.y[i], ps.radius[i], 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${ps.opacity[i]})`;
    ctx.fill();
  }

  ctx.globalAlpha = 1; // Reset
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
```

---

## 4. Color Interpolation

### Linear RGB Interpolation

```tsx
function lerpColor(colorA: string, colorB: string, t: number): string {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);

  /* Linear interpolation in sRGB space — good enough for UI,
     use okLAB for perceptually uniform gradients */
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);

  return `rgb(${r}, ${g}, ${bl})`;
}
```

### Multi-Stop Gradient

```tsx
function gradientColor(colors: string[], t: number): string {
  /* t: 0..1. Maps to position in color array.
     e.g. 3 colors: t=0 → colors[0], t=0.5 → colors[1], t=1 → colors[2] */
  const segment = t * (colors.length - 1);
  const i = Math.floor(segment);
  const frac = segment - i;

  if (i >= colors.length - 1) return colors[colors.length - 1];
  return lerpColor(colors[i], colors[i + 1], frac);
}
```

---

## 5. WebGL Shader Basics

### Minimal WebGL Setup with Shaders

```tsx
function createShaderProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram {
  function compileShader(type: number, source: string): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compile error: ${info}`);
    }
    return shader;
  }

  const program = gl.createProgram()!;
  gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${info}`);
  }

  return program;
}
```

### Vertex + Fragment Shader Pair (Particle Rendering)

```glsl
// Vertex shader
#version 300 es
in vec2 aPosition;
in float aSize;
in float aOpacity;

uniform vec2 uResolution;

out float vOpacity;

void main() {
  /* Convert pixel coordinates to clip space [-1, 1]
     Pixel (0,0) = top-left → clip (-1, 1) */
  vec2 clipPos = (aPosition / uResolution) * 2.0 - 1.0;
  clipPos.y *= -1.0; // Flip Y — canvas Y is down, clip Y is up

  gl_Position = vec4(clipPos, 0.0, 1.0);
  gl_PointSize = aSize;
  vOpacity = aOpacity;
}
```

```glsl
// Fragment shader
#version 300 es
precision mediump float;

in float vOpacity;
uniform vec3 uColor;
out vec4 fragColor;

void main() {
  /* Soft circle: distance from center of point sprite */
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;

  /* Smooth edge — antialiased circle */
  float alpha = 1.0 - smoothstep(0.35, 0.5, dist);
  fragColor = vec4(uColor, alpha * vOpacity);
}
```

---

## 6. OffscreenCanvas + Web Worker

Move heavy rendering off the main thread entirely:

### Main Thread (React Component)

```tsx
"use client";

import { useRef, useEffect } from "react";

export function WorkerCanvas({
  width = 800,
  height = 600,
  color = "#597794",
}: {
  width?: number;
  height?: number;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* Transfer control of the canvas to an OffscreenCanvas */
    const offscreen = canvas.transferControlToOffscreen();

    /* Create worker and send the offscreen canvas + config */
    const worker = new Worker(
      new URL("./canvas-worker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    worker.postMessage(
      {
        type: "init",
        canvas: offscreen,
        config: {
          width,
          height,
          dpr: window.devicePixelRatio || 1,
          color,
          reducedMotion: window.matchMedia(
            "(prefers-reduced-motion: reduce)"
          ).matches,
        },
      },
      [offscreen] // Transfer ownership — main thread can no longer use it
    );

    return () => {
      worker.postMessage({ type: "destroy" });
      worker.terminate();
    };
  }, [width, height, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
```

### Web Worker (canvas-worker.ts)

```tsx
/// <reference lib="webworker" />

interface InitMessage {
  type: "init";
  canvas: OffscreenCanvas;
  config: {
    width: number;
    height: number;
    dpr: number;
    color: string;
    reducedMotion: boolean;
  };
}

interface DestroyMessage {
  type: "destroy";
}

type WorkerMessage = InitMessage | DestroyMessage;

let animationId: number | null = null;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  if (e.data.type === "init") {
    const { canvas, config } = e.data;

    canvas.width = config.width * config.dpr;
    canvas.height = config.height * config.dpr;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(config.dpr, config.dpr);

    if (config.reducedMotion) {
      /* Static render — draw once, no loop */
      drawStaticFrame(ctx, config);
      return;
    }

    let lastTime = performance.now();

    function frame(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, config.width, config.height);
      /* Your animation logic here — same patterns as main-thread Canvas */
      drawFrame(ctx, config, dt);

      animationId = requestAnimationFrame(frame);
    }

    animationId = requestAnimationFrame(frame);
  }

  if (e.data.type === "destroy") {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
  }
};

function drawStaticFrame(
  ctx: OffscreenCanvasRenderingContext2D,
  config: { width: number; height: number; color: string }
) {
  /* Draw a single static representation */
}

function drawFrame(
  ctx: OffscreenCanvasRenderingContext2D,
  config: { width: number; height: number; color: string },
  dt: number
) {
  /* Animation logic per frame */
}
```

### Browser Support

OffscreenCanvas: all modern browsers (Chrome, Edge, Safari 16.4+, Firefox). `transferControlToOffscreen()` is the standard entry point.

---

## 7. WebGPU Progressive Enhancement

WebGPU is production-ready as of 2026 (Chrome, Edge, Safari 26, Firefox 147 — ~70% coverage). Use progressive enhancement: WebGPU primary, WebGL2 fallback, Canvas 2D last resort.

```tsx
"use client";

type RenderBackend = "webgpu" | "webgl2" | "canvas2d";

async function detectBestBackend(): Promise<RenderBackend> {
  /* Try WebGPU first */
  if ("gpu" in navigator) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        const device = await adapter.requestDevice();
        if (device) return "webgpu";
      }
    } catch {
      /* WebGPU not available — fall through */
    }
  }

  /* Try WebGL2 */
  const testCanvas = document.createElement("canvas");
  if (testCanvas.getContext("webgl2")) {
    return "webgl2";
  }

  /* Fallback to Canvas 2D */
  return "canvas2d";
}
```

### WebGPU Compute Shader (Particle Simulation)

```wgsl
// compute.wgsl — runs on the GPU, updates particle positions in parallel
struct Particle {
  pos: vec2<f32>,
  vel: vec2<f32>,
  life: f32,
  maxLife: f32,
}

struct SimParams {
  deltaTime: f32,
  gravity: f32,
  particleCount: u32,
}

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> params: SimParams;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = id.x;
  if (i >= params.particleCount) { return; }

  var p = particles[i];

  // Semi-implicit Euler: update velocity first, then position
  p.vel.y += params.gravity * params.deltaTime;
  p.pos += p.vel * params.deltaTime;
  p.life -= params.deltaTime;

  // Respawn dead particles at origin with random velocity
  if (p.life <= 0.0) {
    p.pos = vec2<f32>(0.0, 0.0);
    p.life = p.maxLife;
  }

  particles[i] = p;
}
```

---

## 8. Complete Production Pattern: Data Stream Canvas

A complete, self-contained Canvas 2D component showing data particles flowing across a surface:

```tsx
"use client";

import { useRef, useEffect, useCallback } from "react";

interface DataStreamProps {
  className?: string;
  particleColor?: string;
  backgroundColor?: string;
  particleCount?: number;
  speed?: number;
}

export function DataStream({
  className,
  particleColor = "#597794",
  backgroundColor = "#0A0A0A",
  particleCount = 200,
  speed = 1,
}: DataStreamProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      rect = canvas!.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      canvas!.style.width = `${rect.width}px`;
      canvas!.style.height = `${rect.height}px`;
    }
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const ctx = canvas.getContext("2d")!;
    const rgb = hexToRgb(particleColor);

    /* Initialize particles with random positions and horizontal velocities */
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      /* Horizontal speed: all move right, varied speed for depth illusion */
      vx: (0.5 + Math.random() * 1.5) * speed,
      /* Size correlates with speed — faster = "closer" = larger */
      size: 1 + Math.random() * 2,
      /* Opacity correlates with size — larger = brighter */
      opacity: 0.2 + Math.random() * 0.6,
    }));

    if (prefersReduced) {
      /* Static: draw particles at their initial positions */
      ctx.scale(dpr, dpr);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, rect.width, rect.height);
      particles.forEach((p) => {
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      return () => observer.disconnect();
    }

    let animId: number;
    let lastTime = performance.now();

    function frame(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx.scale(dpr, dpr);

      /* Background fill */
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, rect.width, rect.height);

      /* Update and draw particles */
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * dt * 60; // Normalize to 60fps equivalent

        /* Wrap around — particle exits right, re-enters left */
        if (p.x > rect.width + p.size) {
          p.x = -p.size;
          p.y = Math.random() * rect.height;
        }

        /* Draw particle with trail */
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        /* Short horizontal trail behind particle */
        const trailLength = p.vx * 8;
        const gradient = ctx.createLinearGradient(
          p.x - trailLength, p.y, p.x, p.y
        );
        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.opacity * 0.5})`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = p.size * 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x - trailLength, p.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(frame);
    }

    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, [particleColor, backgroundColor, particleCount, speed]);

  return <canvas ref={canvasRef} className={className} />;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
```

---

## Performance Engineering

1. **Typed arrays** — Use `Float32Array` for particle data, not object arrays. 2-4x faster iteration due to cache locality.
2. **Object pooling** — Never allocate in the render loop. Pre-allocate all particles at init. Swap-remove dead particles.
3. **Batch draw calls** — Group particles by color/opacity to minimize `fillStyle` changes.
4. **OffscreenCanvas** — For heavy simulations (>5000 particles), move the entire loop to a Web Worker.
5. **WebGL for points** — Switch to `gl.POINTS` with point sprites when Canvas 2D becomes the bottleneck (~5000+ particles).
6. **WebGPU compute** — For massive parallelism (100k+ particles), run physics in a compute shader. Render with the same buffer — no CPU readback needed.
7. **Canvas compositing** — `ctx.globalCompositeOperation = "lighter"` for additive blending (glow effects) is fast because it's GPU-accelerated on all browsers.
8. **Skip invisible** — Don't draw particles outside the visible rect. Simple AABB bounds check before `ctx.arc()`.

---

## Brand Config Integration

```tsx
interface CanvasAnimationConfig {
  particleColor?: string;
  backgroundColor?: string;
  trailColor?: string;
  particleCount?: number;
  speed?: number;
  gravity?: number;
}

const defaults: Required<CanvasAnimationConfig> = {
  particleColor: "#597794",
  backgroundColor: "#0A0A0A",
  trailColor: "#597794",
  particleCount: 200,
  speed: 1,
  gravity: 0,
};
```
