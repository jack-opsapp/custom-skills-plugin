"use client";

/**
 * AmbientMeshGradient — Slowly shifting gradient background driven by simplex
 * noise, with an optional grain overlay and vignette.
 *
 * Renders to a Canvas at reduced resolution (half or quarter) and relies on
 * CSS blur to hide the low-res artifacts. The result is an organic, living
 * background that never demands attention. CPU cost is kept minimal with a
 * 30fps cap, IntersectionObserver pause, and visibility-change pause.
 *
 * @example
 * ```tsx
 * <AmbientMeshGradient
 *   colors={["#0A0A0A", "#1a2a3a", "#0d1b2a", "#597794"]}
 *   speed={0.4}
 *   grainOpacity={0.04}
 *   enableVignette
 *   className="absolute inset-0 -z-10"
 * />
 * ```
 *
 * Dependencies: simplex-noise (for createNoise3D)
 */

import React, { useRef, useEffect, useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AmbientMeshGradientProps {
  /** Array of 2-6 hex color strings to interpolate between. */
  colors: string[];
  /** Animation speed multiplier. 1 = default, 0.5 = half speed. Default 0.4. */
  speed?: number;
  /** Noise spatial scale. Lower = larger gradient blobs. Default 0.003. */
  noiseScale?: number;
  /** Canvas resolution relative to container (0.25 = quarter). Default 0.35. */
  resolution?: number;
  /** CSS blur applied to the canvas (px). Default 40. */
  blurAmount?: number;
  /** Grain overlay opacity (0 = disabled). Default 0.04. */
  grainOpacity?: number;
  /** Show darkened-edge vignette. Default true. */
  enableVignette?: boolean;
  /** Vignette opacity. Default 0.3. */
  vignetteOpacity?: number;
  /** Container className. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Inline simplex noise (avoids external dependency for the example).
// In production, import { createNoise3D } from 'simplex-noise'.
// This is a minimal 3D simplex noise implementation.
// ---------------------------------------------------------------------------

function buildNoise3D(): (x: number, y: number, z: number) => number {
  // Permutation table
  const perm = new Uint8Array(512);
  const grad3 = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
  ];

  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  // Fisher-Yates shuffle
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  const F3 = 1 / 3;
  const G3 = 1 / 6;

  function dot3(g: number[], x: number, y: number, z: number) {
    return g[0] * x + g[1] * y + g[2] * z;
  }

  return function noise3D(xin: number, yin: number, zin: number): number {
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    const z0 = zin - Z0;

    let i1: number, j1: number, k1: number;
    let i2: number, j2: number, k2: number;
    if (x0 >= y0) {
      if (y0 >= z0) { i1=1;j1=0;k1=0; i2=1;j2=1;k2=0; }
      else if (x0 >= z0) { i1=1;j1=0;k1=0; i2=1;j2=0;k2=1; }
      else { i1=0;j1=0;k1=1; i2=1;j2=0;k2=1; }
    } else {
      if (y0 < z0) { i1=0;j1=0;k1=1; i2=0;j2=1;k2=1; }
      else if (x0 < z0) { i1=0;j1=1;k1=0; i2=0;j2=1;k2=1; }
      else { i1=0;j1=1;k1=0; i2=1;j2=1;k2=0; }
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const gi0 = perm[ii + perm[jj + perm[kk]]] % 12;
    const gi1 = perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12;
    const gi2 = perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12;
    const gi3 = perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12;

    let n0 = 0, n1 = 0, n2 = 0, n3 = 0;
    let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * dot3(grad3[gi0], x0, y0, z0); }
    let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * dot3(grad3[gi1], x1, y1, z1); }
    let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * dot3(grad3[gi2], x2, y2, z2); }
    let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if (t3 >= 0) { t3 *= t3; n3 = t3 * t3 * dot3(grad3[gi3], x3, y3, z3); }

    // Return value in range [-1, 1]
    return 32 * (n0 + n1 + n2 + n3);
  };
}

// ---------------------------------------------------------------------------
// Color utilities
// ---------------------------------------------------------------------------

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB {
  const v = parseInt(hex.replace("#", ""), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

/**
 * Sample a color from a multi-stop gradient at position t (0-1).
 */
function sampleGradient(colors: RGB[], t: number): RGB {
  if (colors.length === 1) return colors[0];
  const clamped = Math.max(0, Math.min(1, t));
  const segment = clamped * (colors.length - 1);
  const idx = Math.min(Math.floor(segment), colors.length - 2);
  const frac = segment - idx;
  return lerpRgb(colors[idx], colors[idx + 1], frac);
}

// ---------------------------------------------------------------------------
// Grain overlay (SVG noise texture data URI)
// ---------------------------------------------------------------------------

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export function AmbientMeshGradient({
  colors,
  speed = 0.4,
  noiseScale = 0.003,
  resolution = 0.35,
  blurAmount = 40,
  grainOpacity = 0.04,
  enableVignette = true,
  vignetteOpacity = 0.3,
  className,
}: AmbientMeshGradientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const noiseRef = useRef<ReturnType<typeof buildNoise3D> | null>(null);
  const rgbColors = useRef<RGB[]>([]);

  // Reduced motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Parse colors
  useEffect(() => {
    rgbColors.current = colors.map(hexToRgb);
  }, [colors]);

  // Initialize noise
  useEffect(() => {
    noiseRef.current = buildNoise3D();
  }, []);

  // Pause / resume helpers
  const pause = useCallback(() => {
    pausedRef.current = true;
  }, []);
  const resume = useCallback(() => {
    pausedRef.current = false;
  }, []);

  // Visibility change
  useEffect(() => {
    const handler = () => {
      if (document.hidden) pause();
      else resume();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [pause, resume]);

  // Intersection observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) resume();
        else pause();
      },
      { threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pause, resume]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let w = 0;
    let h = 0;

    function resize() {
      if (!container || !canvas || !ctx) return;
      const rect = container.getBoundingClientRect();
      w = Math.ceil(rect.width * resolution);
      h = Math.ceil(rect.height * resolution);
      canvas.width = w;
      canvas.height = h;
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // 30fps cap
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;
    let lastFrameTime = 0;

    function render(now: number) {
      rafRef.current = requestAnimationFrame(render);

      if (pausedRef.current) return;
      if (!noiseRef.current || !ctx) return;

      const delta = now - lastFrameTime;
      if (delta < FRAME_INTERVAL) return;
      lastFrameTime = now - (delta % FRAME_INTERVAL);

      const noise = noiseRef.current;
      const palette = rgbColors.current;
      if (palette.length === 0) return;

      const time = now * 0.001 * speed;
      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;

      // Render at every pixel (already low-res due to resolution multiplier)
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const nx = x * noiseScale;
          const ny = y * noiseScale;
          // Two noise octaves for richer variation
          const n1 = noise(nx, ny, time * 0.3);
          const n2 = noise(nx * 2.3 + 100, ny * 2.3 + 100, time * 0.2);
          // Combine: primary determines gradient position, secondary adds variation
          const t = (n1 * 0.7 + n2 * 0.3 + 1) / 2; // Normalize to 0-1

          const color = sampleGradient(palette, t);
          const idx = (y * w + x) * 4;
          data[idx] = color.r;
          data[idx + 1] = color.g;
          data[idx + 2] = color.b;
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }

    // For reduced motion: render one static frame
    if (reducedMotion) {
      // Wait for noise to initialize
      const checkReady = setInterval(() => {
        if (noiseRef.current && rgbColors.current.length > 0) {
          clearInterval(checkReady);
          const noise = noiseRef.current;
          const palette = rgbColors.current;
          const imageData = ctx.createImageData(w, h);
          const data = imageData.data;
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const nx = x * noiseScale;
              const ny = y * noiseScale;
              const n1 = noise(nx, ny, 0);
              const t = (n1 + 1) / 2;
              const color = sampleGradient(palette, t);
              const idx = (y * w + x) * 4;
              data[idx] = color.r;
              data[idx + 1] = color.g;
              data[idx + 2] = color.b;
              data[idx + 3] = 255;
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }
      }, 50);
      return () => clearInterval(checkReady);
    }

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
    };
  }, [resolution, noiseScale, speed, reducedMotion]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", overflow: "hidden" }}
      aria-hidden="true"
    >
      {/* Gradient canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          filter: `blur(${blurAmount}px)`,
          transform: "scale(1.15)", // Prevent blur edge artifacts
          transformOrigin: "center",
        }}
      />

      {/* Grain overlay */}
      {grainOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: grainOpacity,
            pointerEvents: "none",
            backgroundImage: GRAIN_SVG,
            backgroundRepeat: "repeat",
            backgroundSize: "256px 256px",
            mixBlendMode: "overlay",
            zIndex: 1,
          }}
        />
      )}

      {/* Vignette */}
      {enableVignette && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: vignetteOpacity,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse at center, transparent 35%, black 100%)",
            zIndex: 2,
          }}
        />
      )}
    </div>
  );
}

export default AmbientMeshGradient;
