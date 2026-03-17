"use client";

import { useRef, useEffect, useCallback, useState } from "react";

// ---------------------------------------------------------------------------
// DeviceMockup
// ---------------------------------------------------------------------------
// A CSS 3D phone that shifts perspective on mouse movement, with a Canvas 2D
// overlay rendering animated data particles flowing across the screen surface.
//
// Combines two tiers:
//   - Tier 1 (CSS): 3D perspective transform driven by pointer position.
//   - Tier 5 (Canvas 2D): DPI-aware particle system drawn on the phone screen.
//
// Math notes:
//   - Perspective rotation: ±12 deg max on both axes. The rotation values are
//     linear interpolations of the pointer's normalised offset from the
//     element center (range [-1, 1]). rotateY follows the X axis (tilts left-
//     right) and rotateX follows the *negative* Y axis (tilts toward/away).
//   - Particle physics: constant horizontal velocity with a slight sinusoidal
//     vertical drift. When a particle exits right it wraps to the left edge.
// ---------------------------------------------------------------------------

interface DeviceMockupProps {
  /** Width of the phone frame in CSS px. */
  width?: number;
  /** Aspect ratio height/width of the phone body. Default 2.0 (typical phone). */
  aspectRatio?: number;
  /** Accent color for screen particles. */
  accentColor?: string;
  /** Phone bezel / frame color. */
  frameColor?: string;
  /** Screen background color. */
  screenColor?: string;
  /** Max rotation in degrees on each axis. */
  maxRotation?: number;
  /** Number of data particles on the screen overlay. */
  particleCount?: number;
  /** Additional CSS class on the outer container. */
  className?: string;
}

export function DeviceMockup({
  width = 280,
  aspectRatio = 2.0,
  accentColor = "#597794",
  frameColor = "#1A1A1A",
  screenColor = "#0A0A0A",
  maxRotation = 12,
  particleCount = 80,
  className = "",
}: DeviceMockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prefersReduced, setPrefersReduced] = useState(false);

  // Track rotation as state so the style updates on every pointermove.
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ---- Pointer tracking for 3D tilt ----

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (prefersReduced) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Normalised offset from center: -1 (left/top) to +1 (right/bottom).
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      // rotateY follows X (left-right tilt), rotateX follows -Y (forward-back tilt).
      setRotation({
        y: nx * maxRotation,
        x: -ny * maxRotation,
      });
    },
    [prefersReduced, maxRotation],
  );

  const handlePointerLeave = useCallback(() => {
    setRotation({ x: 0, y: 0 });
  }, []);

  // ---- Canvas 2D particle overlay ----

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      canvas!.style.width = `${rect.width}px`;
      canvas!.style.height = `${rect.height}px`;
    }
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return () => observer.disconnect();

    const rgb = hexToRgb(accentColor);

    // Initialise particles with random positions and velocities.
    const particles = Array.from({ length: particleCount }, () => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: 0.3 + Math.random() * 1.2,           // px per frame at 60fps
        size: 0.8 + Math.random() * 1.5,
        opacity: 0.15 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,        // for vertical drift
        driftAmplitude: 0.3 + Math.random() * 0.7, // vertical drift magnitude
        driftSpeed: 0.5 + Math.random() * 1.0,     // vertical drift frequency
      };
    });

    if (prefersReduced) {
      // Static: draw once.
      const rect = canvas.getBoundingClientRect();
      ctx.scale(dpr, dpr);
      particles.forEach((p) => {
        ctx.globalAlpha = p.opacity * 0.5;
        ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
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

      const rect = canvas!.getBoundingClientRect();

      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.scale(dpr, dpr);

      const elapsed = now / 1000;

      for (const p of particles) {
        // Horizontal movement.
        p.x += p.vx * dt * 60;

        // Sinusoidal vertical drift: y oscillates around initial lane.
        // sin(elapsed * driftSpeed + phase) gives a smooth wobble unique to each particle.
        const dy = Math.sin(elapsed * p.driftSpeed + p.phase) * p.driftAmplitude;
        const drawY = p.y + dy;

        // Wrap right → left.
        if (p.x > rect.width + p.size * 2) {
          p.x = -p.size * 2;
          p.y = Math.random() * rect.height;
        }

        // Glow circle.
        ctx!.globalAlpha = p.opacity * 0.15;
        ctx!.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        ctx!.beginPath();
        ctx!.arc(p.x, drawY, p.size * 3, 0, Math.PI * 2);
        ctx!.fill();

        // Core dot.
        ctx!.globalAlpha = p.opacity;
        ctx!.beginPath();
        ctx!.arc(p.x, drawY, p.size, 0, Math.PI * 2);
        ctx!.fill();

        // Short trail.
        const trailLen = p.vx * 6;
        const grad = ctx!.createLinearGradient(p.x - trailLen, drawY, p.x, drawY);
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.opacity * 0.4})`);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = p.size * 0.6;
        ctx!.beginPath();
        ctx!.moveTo(p.x - trailLen, drawY);
        ctx!.lineTo(p.x, drawY);
        ctx!.stroke();
      }

      ctx!.globalAlpha = 1;
      animId = requestAnimationFrame(frame);
    }

    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, [accentColor, particleCount, prefersReduced]);

  // ---- Render ----

  const height = width * aspectRatio;
  const bezelWidth = 8;
  const cornerRadius = 28;
  const screenRadius = cornerRadius - bezelWidth + 2;

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`inline-block ${className}`}
      style={{ perspective: "1000px" }}
    >
      {/* Phone body — CSS 3D transformed */}
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: `${cornerRadius}px`,
          backgroundColor: frameColor,
          padding: `${bezelWidth}px`,
          transform: prefersReduced
            ? "none"
            : `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: prefersReduced ? "none" : "transform 0.15s ease-out",
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.06),
            0 20px 60px rgba(0,0,0,0.5),
            0 8px 20px rgba(0,0,0,0.3)
          `,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Notch / dynamic island */}
        <div
          style={{
            position: "absolute",
            top: `${bezelWidth + 6}px`,
            left: "50%",
            transform: "translateX(-50%)",
            width: "80px",
            height: "24px",
            borderRadius: "12px",
            backgroundColor: frameColor,
            zIndex: 10,
          }}
        />

        {/* Screen area */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: `${screenRadius}px`,
            backgroundColor: screenColor,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Canvas particle overlay — fills the screen */}
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          />

          {/* Optional: faint grid overlay for "dashboard" feel */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                linear-gradient(${accentColor}08 1px, transparent 1px),
                linear-gradient(90deg, ${accentColor}08 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Bottom bar indicator */}
        <div
          style={{
            position: "absolute",
            bottom: `${bezelWidth + 6}px`,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100px",
            height: "4px",
            borderRadius: "2px",
            backgroundColor: "rgba(255,255,255,0.15)",
          }}
        />
      </div>
    </div>
  );
}

// ---- Utility ----

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
