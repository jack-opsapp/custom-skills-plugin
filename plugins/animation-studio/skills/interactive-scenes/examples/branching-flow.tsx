/**
 * BranchingFlow — Multi-path Canvas particle system with selection transitions
 *
 * Two branches with distinct particle behaviors (color palette, speed, turbulence,
 * direction). The user hovers to preview a branch and clicks to commit. Selection
 * transitions smoothly — the unselected branch fades and slows while the selected
 * branch accelerates and brightens.
 *
 * Pure Canvas 2D API — no animation libraries.
 * Dependencies: React only.
 */

'use client';

import { useRef, useEffect, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BranchConfig {
  /** Unique key for this branch */
  key: string;
  /** Display label */
  label: string;
  /** Primary color */
  color: { r: number; g: number; b: number };
  /** Secondary/accent color for variation */
  colorAlt: { r: number; g: number; b: number };
  /** Base particle speed (normalized units/frame, e.g. 0.002) */
  speed: number;
  /** Turbulence amplitude (0 = straight lines, 0.001+ = wavy) */
  turbulence: number;
  /** Flow direction angle in radians (0 = right, PI/2 = down) */
  flowAngle: number;
  /** Particle count for this branch */
  particleCount: number;
}

interface BranchingFlowProps {
  /** Two branch configurations */
  branches: [BranchConfig, BranchConfig];
  /** Called when a branch is selected */
  onSelect: (key: string) => void;
  /** Called on hover change (null = no hover) */
  onHoverChange?: (key: string | null) => void;
  /** Previously selected branch key (for restoring state) */
  savedSelection?: string;
  /** Optional className */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Particle                                                           */
/* ------------------------------------------------------------------ */

interface Particle {
  x: number;         // normalized 0-1
  y: number;         // normalized 0-1
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  phase: number;
  colorMix: number;  // 0 = primary, 1 = alt color
  branch: number;    // 0 or 1
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const HIT_RADIUS_FACTOR = 0.12; // fraction of canvas width
const NEUTRAL = { r: 120, g: 120, b: 120 };
const TRANSITION_SPEED = 2.0; // progress units per second

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

function generateParticles(branches: [BranchConfig, BranchConfig]): Particle[] {
  const particles: Particle[] = [];
  for (let b = 0; b < 2; b++) {
    const cfg = branches[b];
    for (let i = 0; i < cfg.particleCount; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        vx: 0,
        vy: 0,
        size: 1.5 + Math.random() * 3,
        baseAlpha: 0.12 + Math.random() * 0.18,
        phase: Math.random() * Math.PI * 2,
        colorMix: Math.random(),
        branch: b,
      });
    }
  }
  return particles;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function BranchingFlow({
  branches,
  onSelect,
  onHoverChange,
  savedSelection,
  className,
}: BranchingFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[] | null>(null);
  const timeRef = useRef(0);
  const hoveredRef = useRef<number>(-1);
  const selectedRef = useRef<number>(-1);
  const selProgressRef = useRef(0); // 0 = no selection, 1 = fully committed
  const onSelectRef = useRef(onSelect);
  const onHoverChangeRef = useRef(onHoverChange);
  const branchesRef = useRef(branches);

  onSelectRef.current = onSelect;
  onHoverChangeRef.current = onHoverChange;
  branchesRef.current = branches;

  // Restore saved selection
  if (savedSelection !== undefined && selectedRef.current < 0) {
    const idx = branches.findIndex(b => b.key === savedSelection);
    if (idx >= 0) {
      selectedRef.current = idx;
      selProgressRef.current = 1;
    }
  }

  if (!particlesRef.current) {
    particlesRef.current = generateParticles(branches);
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
    let prevHovered = -1;

    // Branch node positions: left quarter, right quarter (vertically centered)
    const getNodePositions = (w: number, h: number) => [
      { x: w * 0.25, y: h * 0.5 },
      { x: w * 0.75, y: h * 0.5 },
    ];

    /* ---- Event handlers ---- */

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = e.clientY - rect.top;
    };

    const handleClick = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = parseFloat(canvas.style.width) || canvas.width;
      const h = parseFloat(canvas.style.height) || canvas.height;
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const nodes = getNodePositions(w, h);
      const hitR = w * HIT_RADIUS_FACTOR;

      for (let i = 0; i < 2; i++) {
        const dx = mx - nodes[i].x;
        const dy = my - nodes[i].y;
        if (Math.sqrt(dx * dx + dy * dy) < hitR) {
          if (selectedRef.current !== i) {
            selectedRef.current = i;
            selProgressRef.current = 0;
            onSelectRef.current(branchesRef.current[i].key);
          }
          return;
        }
      }
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
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = parseFloat(canvas.style.width) || canvas.width;
      const h = parseFloat(canvas.style.height) || canvas.height;
      const rect = container.getBoundingClientRect();
      const mx = t.clientX - rect.left;
      const my = t.clientY - rect.top;
      const nodes = getNodePositions(w, h);
      const hitR = w * HIT_RADIUS_FACTOR;

      for (let i = 0; i < 2; i++) {
        const dx = mx - nodes[i].x;
        const dy = my - nodes[i].y;
        if (Math.sqrt(dx * dx + dy * dy) < hitR) {
          if (selectedRef.current !== i) {
            selectedRef.current = i;
            selProgressRef.current = 0;
            onSelectRef.current(branchesRef.current[i].key);
          }
          return;
        }
      }
    };

    container.addEventListener('touchend', handleTouchEnd);

    /* ---- Animation loop ---- */

    const particles = particlesRef.current!;
    let prevTimestamp: number | null = null;

    function draw(timestamp: number) {
      if (prevTimestamp === null) prevTimestamp = timestamp;
      const dt = Math.min((timestamp - prevTimestamp) / 1000, 0.05);
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
      const cfgs = branchesRef.current;
      const nodes = getNodePositions(w, h);
      const hitR = w * HIT_RADIUS_FACTOR;

      ctx.clearRect(0, 0, w, h);

      /* ---- Selection progress ---- */

      if (selected >= 0 && selProgressRef.current < 1) {
        selProgressRef.current = Math.min(1, selProgressRef.current + dt * TRANSITION_SPEED);
      }
      const selProgress = selProgressRef.current;

      /* ---- Hover detection ---- */

      let hoverIdx = -1;
      if (mousePos.x > -9000) {
        for (let i = 0; i < 2; i++) {
          const dx = mousePos.x - nodes[i].x;
          const dy = mousePos.y - nodes[i].y;
          if (Math.sqrt(dx * dx + dy * dy) < hitR) {
            hoverIdx = i;
            break;
          }
        }
      }
      hoveredRef.current = hoverIdx;
      container.style.cursor = hoverIdx >= 0 ? 'pointer' : 'default';

      // Fire hover change callback
      if (hoverIdx !== prevHovered) {
        prevHovered = hoverIdx;
        onHoverChangeRef.current?.(hoverIdx >= 0 ? cfgs[hoverIdx].key : null);
      }

      /* ---- Update + draw particles ---- */

      for (const p of particles) {
        const cfg = cfgs[p.branch];
        const isSelectedBranch = p.branch === selected;
        const isUnselectedBranch = selected >= 0 && !isSelectedBranch;
        const isHoveredBranch = p.branch === hoverIdx;

        // Compute effective speed and turbulence
        let effectiveSpeed = cfg.speed;
        let effectiveTurbulence = cfg.turbulence;
        let alphaScale = 1.0;

        if (isSelectedBranch) {
          // Selected: accelerate, brighten
          effectiveSpeed *= 1.0 + selProgress * 0.8;
          alphaScale = 1.0 + selProgress * 0.4;
        } else if (isUnselectedBranch) {
          // Unselected: decelerate, fade
          effectiveSpeed *= 1.0 - selProgress * 0.7;
          effectiveTurbulence *= 1.0 - selProgress * 0.5;
          alphaScale = 1.0 - selProgress * 0.65;
        } else if (isHoveredBranch && selected < 0) {
          // Hovered (no selection yet): slight boost
          effectiveSpeed *= 1.2;
          alphaScale = 1.15;
        }

        // Flow direction
        const flowCos = Math.cos(cfg.flowAngle);
        const flowSin = Math.sin(cfg.flowAngle);

        // Base flow velocity
        const flowVx = flowCos * effectiveSpeed;
        const flowVy = flowSin * effectiveSpeed;

        // Turbulence (sinusoidal cross-flow jitter)
        const turbX = Math.sin(time * 1.5 + p.phase * 3) * effectiveTurbulence;
        const turbY = Math.cos(time * 1.2 + p.phase * 2.7) * effectiveTurbulence;

        // Apply
        p.vx += (flowVx + turbX - p.vx) * 0.05;
        p.vy += (flowVy + turbY - p.vy) * 0.05;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;
        if (p.y < -0.05) p.y = 1.05;
        if (p.y > 1.05) p.y = -0.05;

        // ---- Color ----

        // Mix between primary and alt color based on particle's colorMix
        const branchColor = lerpColor(cfg.color, cfg.colorAlt, p.colorMix * 0.6);

        // When no selection: proximity to own node intensifies color
        // When selected: full branch color for selected, neutral for unselected
        let displayColor: { r: number; g: number; b: number };
        let alpha: number;

        if (selected >= 0) {
          if (isSelectedBranch) {
            // Full branch color, intensifying with progress
            const colorT = 0.5 + selProgress * 0.5;
            displayColor = lerpColor(NEUTRAL, branchColor, colorT);
          } else {
            // Fade toward neutral
            const colorT = Math.max(0, 0.5 - selProgress * 0.45);
            displayColor = lerpColor(NEUTRAL, branchColor, colorT);
          }
        } else if (hoverIdx >= 0) {
          // Proximity-based coloring for hovered branch
          const node = nodes[p.branch];
          const dx = p.x - node.x / w;
          const dy = p.y - node.y / h;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const proximity = Math.max(0, 1 - dist / 0.5);
          const colorT = isHoveredBranch ? 0.3 + proximity * 0.5 : 0.2;
          displayColor = lerpColor(NEUTRAL, branchColor, colorT);
        } else {
          // Ambient: subtle branch tinting
          displayColor = lerpColor(NEUTRAL, branchColor, 0.25);
        }

        alpha = p.baseAlpha * alphaScale;
        // Breathing
        alpha += Math.sin(time * 0.5 + p.phase) * 0.02;
        alpha = Math.max(0, Math.min(1, alpha));

        // Draw
        const px = p.x * w;
        const py = p.y * h;
        ctx.fillStyle = `rgba(${displayColor.r | 0}, ${displayColor.g | 0}, ${displayColor.b | 0}, ${alpha})`;
        ctx.fillRect(px - p.size / 2, py - p.size / 2, p.size, p.size);
      }

      /* ---- Draw branch nodes ---- */

      for (let i = 0; i < 2; i++) {
        const cfg = cfgs[i];
        const node = nodes[i];
        const isHovered = hoverIdx === i;
        const isSelected = selected === i;
        const hasSelection = selected >= 0;

        let nodeSize: number;
        let nodeAlpha: number;
        let nodeColor: { r: number; g: number; b: number };

        if (isSelected) {
          nodeSize = 14;
          nodeAlpha = 0.95;
          nodeColor = cfg.color;
        } else if (isHovered && !hasSelection) {
          nodeSize = 11;
          nodeAlpha = 0.7;
          nodeColor = cfg.color;
        } else if (hasSelection) {
          // Unselected after selection
          nodeSize = 6 + (1 - selProgress) * 2;
          nodeAlpha = 0.15 + (1 - selProgress) * 0.2;
          nodeColor = lerpColor(NEUTRAL, cfg.color, 1 - selProgress * 0.7);
        } else {
          nodeSize = 8;
          nodeAlpha = 0.45;
          nodeColor = lerpColor(NEUTRAL, cfg.color, 0.4);
        }

        // Glow for selected/hovered
        if (isSelected) {
          ctx.shadowColor = `rgba(${cfg.color.r}, ${cfg.color.g}, ${cfg.color.b}, 0.5)`;
          ctx.shadowBlur = 20;
        } else if (isHovered && !hasSelection) {
          ctx.shadowColor = `rgba(${cfg.color.r}, ${cfg.color.g}, ${cfg.color.b}, 0.3)`;
          ctx.shadowBlur = 12;
        }

        ctx.fillStyle = `rgba(${nodeColor.r | 0}, ${nodeColor.g | 0}, ${nodeColor.b | 0}, ${nodeAlpha})`;
        ctx.fillRect(
          node.x - nodeSize / 2,
          node.y - nodeSize / 2,
          nodeSize,
          nodeSize,
        );

        if (isSelected || (isHovered && !hasSelection)) {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }

        // Label
        const labelAlpha = isSelected
          ? 0.95
          : isHovered && !hasSelection
            ? 0.85
            : hasSelection && !isSelected
              ? 0.2 + (1 - selProgress) * 0.2
              : 0.6;

        ctx.font = (isSelected || isHovered) ? '600 13px "Kosugi", sans-serif' : '400 12px "Kosugi", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = `rgba(255, 255, 255, ${labelAlpha})`;
        ctx.fillText(cfg.label, node.x, node.y + nodeSize / 2 + 14);
      }

      /* ---- Dividing line (faint vertical center) ---- */

      if (selected < 0) {
        const centerX = w / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, h * 0.15);
        ctx.lineTo(centerX, h * 0.85);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
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
    };
  }, [resize]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%' }}
      role="radiogroup"
      aria-label="Choose a path"
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
