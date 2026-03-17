// Seed implementation — built before animation-studio. Serves as a reference
// for the pattern, not a quality ceiling. The plugin's framework decision
// engine and motion principles should produce an improved version.

/**
 * ForcedChoiceFork — Canvas particle field with two nodes
 *
 * Particles float in ambient state. Hovering left/right gravitates particles
 * toward that side with increased brightness. Selection triggers a horizontal
 * stream — particles flow from the opposite edge, through the selected node,
 * and out the other side. Blue for left, orange for right. Hovering the
 * unselected node slows the stream.
 *
 * Pure Canvas 2D API — no animation libraries.
 */

'use client';

import { useRef, useEffect, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ForcedChoiceForkProps {
  options: { key: string; text: string }[];
  onSelect: (key: string) => void;
  autoAdvance?: boolean;
  onSelectionChange?: (value: string) => void;
  onAnimationComplete?: () => void;
  savedAnswer?: string;
}

interface Particle {
  x: number;       // normalized 0-1
  y: number;       // normalized 0-1
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  phase: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PARTICLE_COUNT = 80;
const HIT_RADIUS = 60;
const SELECT_DELAY_MS = 500;
const CANVAS_HEIGHT_CLASS = 'h-[320px] md:h-[380px]';

// Node positions (normalized)
const LEFT_NODE = { nx: 0.25, ny: 0.45 };
const RIGHT_NODE = { nx: 0.75, ny: 0.45 };

// Colors
const NEUTRAL = { r: 160, g: 160, b: 160 };
const BLUE    = { r: 89,  g: 140, b: 200 };
const ORANGE  = { r: 210, g: 140, b: 60  };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateParticles(): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      size: 2 + Math.random() * 3.5,
      baseAlpha: 0.15 + Math.random() * 0.15,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return particles;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function lerpColor(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number,
) {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ForcedChoiceFork({
  options,
  onSelect,
  autoAdvance = true,
  onSelectionChange,
  onAnimationComplete,
  savedAnswer,
}: ForcedChoiceForkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const hoveredRef = useRef<number>(-1);
  const selectedRef = useRef<number>(-1);
  const onSelectRef = useRef(onSelect);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const onAnimationCompleteRef = useRef(onAnimationComplete);
  const autoAdvanceRef = useRef(autoAdvance);
  const optionsRef = useRef(options);
  const selectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeRef = useRef(0);
  const particlesRef = useRef<Particle[] | null>(null);
  const selProgressRef = useRef(0);

  onSelectRef.current = onSelect;
  onSelectionChangeRef.current = onSelectionChange;
  onAnimationCompleteRef.current = onAnimationComplete;
  autoAdvanceRef.current = autoAdvance;
  optionsRef.current = options;

  // Apply savedAnswer on mount
  if (savedAnswer !== undefined && selectedRef.current < 0) {
    const savedIdx = options.findIndex(o => o.key === savedAnswer);
    if (savedIdx >= 0) {
      selectedRef.current = savedIdx;
      selProgressRef.current = 1;
    }
  }

  if (!particlesRef.current) {
    particlesRef.current = generateParticles();
  }

  /* ---- DPI-aware resize ---- */

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  /* ---- Main effect ---- */

  useEffect(() => {
    resize();

    const container = containerRef.current!;
    let observer: ResizeObserver | null = null;
    if (container) {
      observer = new ResizeObserver(() => resize());
      observer.observe(container);
    }

    const mousePos = { x: -9999, y: -9999 };

    /* ---- Shared selection logic ---- */

    const selectNode = (mx: number, my: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = parseFloat(canvas.style.width) || canvas.width;
      const h = parseFloat(canvas.style.height) || canvas.height;

      const nodes = [
        { x: LEFT_NODE.nx * w, y: LEFT_NODE.ny * h },
        { x: RIGHT_NODE.nx * w, y: RIGHT_NODE.ny * h },
      ];

      let closest = -1;
      let closestDist = HIT_RADIUS;
      for (let i = 0; i < nodes.length; i++) {
        const dx = mx - nodes[i].x;
        const dy = my - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      }

      if (closest >= 0 && closest < optionsRef.current.length) {
        if (selectedRef.current === closest) {
          // Same node re-clicked — re-fire callbacks without re-animating
          onSelectionChangeRef.current?.(optionsRef.current[closest].key);
          if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
          selectTimerRef.current = setTimeout(() => {
            if (autoAdvanceRef.current) {
              onSelectRef.current(optionsRef.current[closest].key);
            }
            onAnimationCompleteRef.current?.();
          }, SELECT_DELAY_MS);
          return;
        }
        selectedRef.current = closest;
        selProgressRef.current = 0;

        // Fire selection change immediately
        onSelectionChangeRef.current?.(optionsRef.current[closest].key);

        if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
        selectTimerRef.current = setTimeout(() => {
          if (autoAdvanceRef.current) {
            onSelectRef.current(optionsRef.current[closest].key);
          }
          onAnimationCompleteRef.current?.();
        }, SELECT_DELAY_MS);
      }
    };

    /* ---- Event handlers ---- */

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = e.clientY - rect.top;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      selectNode(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handleMouseLeave = () => {
      mousePos.x = -9999;
      mousePos.y = -9999;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);
    container.addEventListener('mouseleave', handleMouseLeave);

    /* ---- Touch ---- */

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return;
      const t = e.changedTouches[0];
      const rect = container.getBoundingClientRect();
      selectNode(t.clientX - rect.left, t.clientY - rect.top);
    };

    container.addEventListener('touchend', handleTouchEnd);

    /* ---- Animation loop ---- */

    const particles = particlesRef.current!;
    let prevTimestamp: number | null = null;

    function draw(timestamp: number) {
      if (prevTimestamp === null) prevTimestamp = timestamp;
      const dt = (timestamp - prevTimestamp) / 1000;
      prevTimestamp = timestamp;
      timeRef.current += dt;

      const canvas = canvasRef.current;
      if (!canvas) { animRef.current = requestAnimationFrame(draw); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { animRef.current = requestAnimationFrame(draw); return; }

      const w = parseFloat(canvas.style.width) || canvas.width;
      const h = parseFloat(canvas.style.height) || canvas.height;
      const time = timeRef.current;
      const selected = selectedRef.current;

      ctx.clearRect(0, 0, w, h);

      const leftX = LEFT_NODE.nx * w;
      const leftY = LEFT_NODE.ny * h;
      const rightX = RIGHT_NODE.nx * w;
      const rightY = RIGHT_NODE.ny * h;

      /* ---- Hover detection (always active) ---- */

      let hoverIdx = -1;
      if (mousePos.x > -9000) {
        const nodes = [
          { x: leftX, y: leftY },
          { x: rightX, y: rightY },
        ];
        let closestDist = HIT_RADIUS;
        for (let i = 0; i < nodes.length; i++) {
          const dx = mousePos.x - nodes[i].x;
          const dy = mousePos.y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < closestDist) {
            closestDist = dist;
            hoverIdx = i;
          }
        }
      }
      hoveredRef.current = hoverIdx;
      container.style.cursor = hoverIdx >= 0 ? 'pointer' : 'default';

      /* ---- Selection progress ---- */

      if (selected >= 0 && selProgressRef.current < 1) {
        selProgressRef.current = Math.min(1, selProgressRef.current + dt * 1.8);
      }
      const selProgress = selProgressRef.current;

      // Flow direction: selected LEFT → particles flow right-to-left
      //                 selected RIGHT → particles flow left-to-right
      // flowDir: -1 = leftward, +1 = rightward
      const flowDir = selected === 0 ? -1 : 1;
      const selNode = selected === 0 ? LEFT_NODE : RIGHT_NODE;
      const selColor = selected === 0 ? BLUE : ORANGE;

      // Hovering the unselected node slows the stream
      const hoveringUnselected = selected >= 0 && hoverIdx >= 0 && hoverIdx !== selected;
      const flowSpeedMult = hoveringUnselected ? 0.2 : 1.0;

      /* ---- Update + draw particles ---- */

      for (const p of particles) {
        if (selected >= 0) {
          // ---- STREAM MODE with FUNNEL ----
          const baseFlowSpeed = 0.003 * (0.3 + selProgress * 0.7) * flowSpeedMult;
          const flowVx = flowDir * baseFlowSpeed;

          // How far is this particle from the node along the flow axis?
          // distToNode: signed, negative = on entry side, positive = past node
          const distToNode = flowDir < 0
            ? (selNode.nx - p.x)
            : (p.x - selNode.nx);

          // Funnel: Y-convergence strength depends on proximity to node
          // Entry side (distToNode < 0): loose — weak Y pull, wide scatter
          // Near node (distToNode ~0): strong convergence
          // Past node (distToNode > 0): tight stream
          const approachT = Math.max(0, Math.min(1, (distToNode + 0.5) / 0.5)); // 0 at far entry, 1 at node
          const funnelStrength = (0.0003 + approachT * 0.004) * selProgress;

          const yDiff = selNode.ny - p.y;
          p.vy += yDiff * funnelStrength;
          p.vy *= 0.92;

          // Flow speed: slower on entry side, faster near/past node
          const speedMult = 0.4 + approachT * 0.6;
          p.vx += (flowVx * speedMult - p.vx) * (0.03 + selProgress * 0.06);

          // Scatter on entry side for looseness
          if (distToNode < -0.1) {
            p.vy += Math.sin(time * 1.5 + p.phase) * 0.0003 * (1 - approachT);
            p.vx += Math.cos(time * 0.8 + p.phase * 2) * 0.00008 * (1 - approachT);
          } else {
            // Slight jitter near/past node so it's not a laser line
            p.vy += Math.sin(time * 2 + p.phase) * 0.00005;
          }

          p.x += p.vx;
          p.y += p.vy;

          // Respawn on entry side with wide Y spread
          if (flowDir < 0 && p.x < -0.02) {
            p.x = 1.0 + Math.random() * 0.15;
            p.y = selNode.ny + (Math.random() - 0.5) * 0.8;
            p.vx = flowDir * baseFlowSpeed * 0.3;
            p.vy = (Math.random() - 0.5) * 0.0005;
          } else if (flowDir > 0 && p.x > 1.02) {
            p.x = -0.15 + Math.random() * 0.15;
            p.y = selNode.ny + (Math.random() - 0.5) * 0.8;
            p.vx = flowDir * baseFlowSpeed * 0.3;
            p.vy = (Math.random() - 0.5) * 0.0005;
          }

          if (p.y < -0.05) p.y = 1.05;
          if (p.y > 1.05) p.y = -0.05;

        } else if (hoverIdx >= 0) {
          // ---- HOVER ORBIT MODE ----
          const hovNode = hoverIdx === 0 ? LEFT_NODE : RIGHT_NODE;
          const dx = hovNode.nx - p.x;
          const dy = hovNode.ny - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 0.01) {
            // Radial pull — draws particles toward the node
            const pullStrength = 0.00025;
            p.vx += (dx / dist) * pullStrength;
            p.vy += (dy / dist) * pullStrength;

            // Tangential drift — makes them orbit rather than collapse
            const tangentX = -dy / dist;
            const tangentY = dx / dist;
            const orbitStrength = 0.00012;
            p.vx += tangentX * orbitStrength;
            p.vy += tangentY * orbitStrength;
          }

          // Gentle ambient breathing
          p.vx += Math.sin(time * 0.2 + p.phase) * 0.00003;
          p.vy += Math.cos(time * 0.15 + p.phase * 1.3) * 0.00003;

          p.vx *= 0.985;
          p.vy *= 0.985;

          p.x += p.vx;
          p.y += p.vy;

          // Wrap
          if (p.x < -0.05) p.x = 1.05;
          if (p.x > 1.05) p.x = -0.05;
          if (p.y < -0.05) p.y = 1.05;
          if (p.y > 1.05) p.y = -0.05;

        } else {
          // ---- AMBIENT MODE ----
          const breatheX = Math.sin(time * 0.2 + p.phase) * 0.00008;
          const breatheY = Math.cos(time * 0.15 + p.phase * 1.3) * 0.00008;

          p.vx += breatheX;
          p.vy += breatheY;

          p.vx *= 0.99;
          p.vy *= 0.99;

          p.x += p.vx;
          p.y += p.vy;

          // Wrap
          if (p.x < -0.05) p.x = 1.05;
          if (p.x > 1.05) p.x = -0.05;
          if (p.y < -0.05) p.y = 1.05;
          if (p.y > 1.05) p.y = -0.05;
        }

        // ---- COLOR + ALPHA ----

        const px = p.x * w;
        const py = p.y * h;

        let cr: number, cg: number, cb: number;
        let alpha = p.baseAlpha;

        if (selected >= 0) {
          // Signed distance past node along flow
          const passedNode = flowDir < 0
            ? (selNode.nx - p.x)
            : (p.x - selNode.nx);

          const dNode = Math.sqrt((p.x - selNode.nx) ** 2 + (p.y - selNode.ny) ** 2);
          const proximity = Math.max(0, 1 - dNode / 0.25);

          // Color: neutral on entry side, transitions to selColor at/past node
          let colorT: number;
          if (passedNode > 0) {
            colorT = Math.min(1, 0.6 + passedNode * 2);
          } else {
            colorT = Math.max(0, 1 + passedNode * 3) * 0.5;
          }
          colorT *= selProgress;

          const c = lerpColor(NEUTRAL, selColor, colorT);
          cr = c.r; cg = c.g; cb = c.b;

          alpha = p.baseAlpha * 0.7 + proximity * selProgress * 0.5;
          alpha = Math.max(alpha, p.baseAlpha * 0.5);

        } else if (hoverIdx >= 0) {
          // Proximity-based color transition: full color as they approach
          const hovNode = hoverIdx === 0 ? LEFT_NODE : RIGHT_NODE;
          const dHov = Math.sqrt((p.x - hovNode.nx) ** 2 + (p.y - hovNode.ny) ** 2);
          const proximity = Math.max(0, 1 - dHov / 0.45);
          const hoverTint = hoverIdx === 0 ? BLUE : ORANGE;
          // Strong color shift — goes to full color when close
          const c = lerpColor(NEUTRAL, hoverTint, proximity * 0.8);
          cr = c.r; cg = c.g; cb = c.b;
          alpha = p.baseAlpha + proximity * 0.2;
        } else {
          cr = NEUTRAL.r;
          cg = NEUTRAL.g;
          cb = NEUTRAL.b;
          alpha = p.baseAlpha + Math.sin(time * 0.5 + p.phase) * 0.03;
        }

        ctx.fillStyle = `rgba(${cr | 0}, ${cg | 0}, ${cb | 0}, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.fillRect(px - p.size / 2, py - p.size / 2, p.size, p.size);
      }

      /* ---- Draw nodes ---- */

      for (let i = 0; i < 2; i++) {
        const nodeX = i === 0 ? leftX : rightX;
        const nodeY = i === 0 ? leftY : rightY;
        const isHovered = hoverIdx === i;
        const isSelected = selected === i;
        const hasSelection = selected >= 0;
        const nodeColor = i === 0 ? BLUE : ORANGE;

        let nodeSize: number;
        let nodeAlpha: number;

        if (isSelected) {
          nodeSize = 12;
          nodeAlpha = 0.95;
        } else if (isHovered && hasSelection) {
          // Hovering the unselected node after selection
          nodeSize = 9;
          nodeAlpha = 0.45;
        } else if (isHovered) {
          nodeSize = 10;
          nodeAlpha = 0.65;
        } else if (hasSelection) {
          nodeSize = 6;
          nodeAlpha = 0.15;
        } else {
          nodeSize = 7;
          nodeAlpha = 0.4;
        }

        if (isSelected) {
          ctx.shadowColor = `rgba(${nodeColor.r}, ${nodeColor.g}, ${nodeColor.b}, 0.6)`;
          ctx.shadowBlur = 18;
        }

        const drawColor = (isSelected || isHovered) ? nodeColor : NEUTRAL;
        ctx.fillStyle = `rgba(${drawColor.r}, ${drawColor.g}, ${drawColor.b}, ${nodeAlpha})`;
        ctx.fillRect(
          nodeX - nodeSize / 2,
          nodeY - nodeSize / 2,
          nodeSize,
          nodeSize,
        );

        if (isSelected) {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
      }

      /* ---- Draw labels ---- */

      ctx.textBaseline = 'top';

      for (let i = 0; i < Math.min(2, optionsRef.current.length); i++) {
        const nodeX = i === 0 ? leftX : rightX;
        const nodeY = i === 0 ? leftY : rightY;
        const isHovered = hoverIdx === i;
        const isSelected = selected === i;
        const hasSelection = selected >= 0;

        let labelAlpha: number;
        if (isSelected) {
          labelAlpha = 0.95;
        } else if (isHovered && hasSelection) {
          labelAlpha = 0.75;
        } else if (isHovered) {
          labelAlpha = 0.90;
        } else if (hasSelection) {
          labelAlpha = 0.30;
        } else {
          labelAlpha = 0.65;
        }

        ctx.font = '400 12px "Kosugi", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(255, 255, 255, ${labelAlpha})`;

        const maxWidth = w * 0.30;
        const lines = wrapText(ctx, optionsRef.current[i].text, maxWidth);
        const lineHeight = 15;
        const labelStartY = nodeY + 18;

        for (let l = 0; l < lines.length; l++) {
          ctx.fillText(lines[l], nodeX, labelStartY + l * lineHeight);
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    /* ---- Cleanup ---- */

    return () => {
      cancelAnimationFrame(animRef.current);
      if (observer) observer.disconnect();
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchend', handleTouchEnd);
      if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
    };
  }, [resize]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
