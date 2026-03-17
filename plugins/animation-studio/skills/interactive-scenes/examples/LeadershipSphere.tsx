// Seed implementation — built before animation-studio. Serves as a reference
// for the pattern, not a quality ceiling. The plugin's framework decision
// engine and motion principles should produce an improved version.

/**
 * LeadershipSphere — Interactive 3D Canvas + DOM hybrid visualization
 *
 * 6 dimension vectors radiate from center in 3D space (regular octahedron
 * rotated ~12deg around Y). Each vector length corresponds to its score.
 * Mesh lines connect all octahedral edges, ~80 ambient fill lines add atmosphere.
 *
 * Enhanced with:
 * - Sub-nodes with unique colors that fan around parent dimensions
 * - Focus mode with zoom animation and camera orientation
 * - Sub-node hover detection with score display
 * - DOM description panel with frosted glass styling
 * - Free rotation (no snap-back on tilt)
 * - Smooth continuous depth transitions
 *
 * Canvas + DOM hybrid — description panel is a React element.
 * Pure Canvas 2D API for the sphere — no animation libraries.
 */

'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import type { Dimension, SimpleScores, DimensionSubScores, AssessmentVersion } from '@/lib/assessment/types';
import { DIMENSIONS } from '@/lib/assessment/types';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ACCENT = { r: 89, g: 119, b: 148 };   // #597794
const GREY = { r: 100, g: 100, b: 100 };     // #646464
const FOCAL_LENGTH = 2000;
const ROTATION_PERIOD_S = 120;
const TILT_ANGLE = 0.25;
const DRAG_SENSITIVITY = 0.005;
const DRAG_THRESHOLD = 3;
const HOVER_RADIUS = 34;
const SUB_HOVER_RADIUS = 26;
const AMBIENT_LINE_COUNT = 80;
const MIN_VECTOR_LENGTH = 0.3;
const MAX_VECTOR_LENGTH = 0.9;

export const SUB_NODE_COLORS = [
  { r: 200, g: 160, b: 80  },  // warm amber  #C8A050
  { r: 160, g: 100, b: 130 },  // dusty rose   #A06482
  { r: 80,  g: 170, b: 155 },  // teal          #50AA9B
  { r: 140, g: 115, b: 185 },  // soft violet   #8C73B9
  { r: 130, g: 170, b: 100 },  // sage          #82AA64
];

/* ------------------------------------------------------------------ */
/*  Vector helpers (used by both constants and runtime)                 */
/* ------------------------------------------------------------------ */

function normalize(v: { dx: number; dy: number; dz: number }) {
  const len = Math.sqrt(v.dx * v.dx + v.dy * v.dy + v.dz * v.dz);
  if (len === 0) return { dx: 0, dy: 1, dz: 0 };
  return { dx: v.dx / len, dy: v.dy / len, dz: v.dz / len };
}

function cross(
  a: { dx: number; dy: number; dz: number },
  b: { dx: number; dy: number; dz: number },
) {
  return {
    dx: a.dy * b.dz - a.dz * b.dy,
    dy: a.dz * b.dx - a.dx * b.dz,
    dz: a.dx * b.dy - a.dy * b.dx,
  };
}

/* ------------------------------------------------------------------ */
/*  Dimension geometry — regular octahedron rotated ~12deg around Y    */
/* ------------------------------------------------------------------ */

const DIMENSION_DIRS: Record<Dimension, { dx: number; dy: number; dz: number }> = {
  drive:        normalize({ dx:  0.208, dy: -1.0,  dz:  0.0   }),  // top
  resilience:   normalize({ dx:  0.978, dy:  0.0,  dz: -0.208 }),  // right
  vision:       normalize({ dx:  0.208, dy:  0.0,  dz: -0.978 }),  // back
  connection:   normalize({ dx: -0.978, dy:  0.0,  dz:  0.208 }),  // left
  adaptability: normalize({ dx: -0.208, dy:  0.0,  dz:  0.978 }),  // front
  integrity:    normalize({ dx: -0.208, dy:  1.0,  dz:  0.0   }),  // bottom
};

const MESH_PAIRS: [Dimension, Dimension][] = [
  // Equatorial ring
  ['resilience', 'vision'],
  ['vision', 'adaptability'],
  ['adaptability', 'connection'],
  ['connection', 'resilience'],
  // Drive (top) to equatorial
  ['drive', 'resilience'],
  ['drive', 'vision'],
  ['drive', 'adaptability'],
  ['drive', 'connection'],
  // Integrity (bottom) to equatorial
  ['integrity', 'resilience'],
  ['integrity', 'vision'],
  ['integrity', 'adaptability'],
  ['integrity', 'connection'],
];

const DIMENSION_LABELS: Record<Dimension, string> = {
  drive: 'DRIVE',
  resilience: 'RESILIENCE',
  vision: 'VISION',
  connection: 'CONNECTION',
  adaptability: 'ADAPTABILITY',
  integrity: 'INTEGRITY',
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LeadershipSphereProps {
  scores: SimpleScores;
  subScores?: DimensionSubScores;
  dimensionDescriptions?: Record<Dimension, string>;
  version?: AssessmentVersion;
  focusDimension?: Dimension | null;
  focusSubIndex?: number | null;
  onDimensionClick?: (dimension: Dimension) => void;
  comparisonScores?: SimpleScores;
  showAverages?: boolean;
  onToggleAverages?: () => void;
  className?: string;
}

interface AmbientLine {
  dx: number;
  dy: number;
  dz: number;
  baseOpacity: number;
  length: number;
}

interface Particle {
  dim: Dimension;
  t: number;
  speed: number;
}

/* ------------------------------------------------------------------ */
/*  3D helpers                                                         */
/* ------------------------------------------------------------------ */

function rotate(
  px: number, py: number, pz: number,
  yaw: number, tilt: number,
): { x: number; y: number; z: number } {
  const x1 = px * Math.cos(yaw) + pz * Math.sin(yaw);
  const z1 = -px * Math.sin(yaw) + pz * Math.cos(yaw);
  const y1 = py;
  return {
    x: x1,
    y: y1 * Math.cos(tilt) - z1 * Math.sin(tilt),
    z: y1 * Math.sin(tilt) + z1 * Math.cos(tilt),
  };
}

function project(
  x: number, y: number, z: number,
  cx: number, cy: number,
): { sx: number; sy: number; scale: number } {
  const scale = FOCAL_LENGTH / (FOCAL_LENGTH - z);
  return { sx: cx + x * scale, sy: cy + y * scale, scale };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(
  back: { r: number; g: number; b: number },
  front: { r: number; g: number; b: number },
  t: number,
) {
  return {
    r: Math.round(lerp(back.r, front.r, t)),
    g: Math.round(lerp(back.g, front.g, t)),
    b: Math.round(lerp(back.b, front.b, t)),
  };
}

/* ------------------------------------------------------------------ */
/*  Sub-node geometry                                                  */
/* ------------------------------------------------------------------ */

function computeSubNodeDirection(
  parentDir: { dx: number; dy: number; dz: number },
  index: number,
  total: number,
  spread: number,
): { dx: number; dy: number; dz: number } {
  const n = normalize(parentDir);

  const up = Math.abs(n.dy) < 0.9 ? { dx: 0, dy: 1, dz: 0 } : { dx: 1, dy: 0, dz: 0 };
  const tangent1 = normalize(cross(n, up));
  const tangent2 = normalize(cross(n, tangent1));

  const angleStep = total > 1 ? (2 * Math.PI) / total : 0;
  const theta = angleStep * index;

  const cosS = Math.cos(spread);
  const sinS = Math.sin(spread);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  return {
    dx: n.dx * cosS + (tangent1.dx * cosT + tangent2.dx * sinT) * sinS,
    dy: n.dy * cosS + (tangent1.dy * cosT + tangent2.dy * sinT) * sinS,
    dz: n.dz * cosS + (tangent1.dz * cosT + tangent2.dz * sinT) * sinS,
  };
}

/* ------------------------------------------------------------------ */
/*  Scene generation (stable across frames)                            */
/* ------------------------------------------------------------------ */

function generateAmbientLines(): AmbientLine[] {
  const lines: AmbientLine[] = [];
  const GOLDEN_ANGLE = Math.PI * (1 + Math.sqrt(5));

  for (let i = 0; i < AMBIENT_LINE_COUNT; i++) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / AMBIENT_LINE_COUNT);
    const theta = GOLDEN_ANGLE * i;

    const dx = Math.sin(phi) * Math.cos(theta);
    const dy = Math.sin(phi) * Math.sin(theta);
    const dz = Math.cos(phi);

    const baseOpacity = 0.04 + Math.random() * 0.06;
    const length = 0.15 + Math.random() * 0.35;

    lines.push({ dx, dy, dz, baseOpacity, length });
  }

  return lines;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LeadershipSphere({
  scores,
  subScores,
  dimensionDescriptions,
  version = 'deep',
  focusDimension: externalFocusDimension,
  focusSubIndex: externalFocusSubIndex,
  onDimensionClick,
  comparisonScores,
  showAverages,
  onToggleAverages,
  className,
}: LeadershipSphereProps) {
  const isQuick = version === 'quick';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ambientRef = useRef<AmbientLine[] | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const hoveredRef = useRef<Dimension | null>(null);
  const hoveredSubRef = useRef<{ dim: Dimension; index: number } | null>(null);
  const dragRef = useRef({
    active: false,
    didDrag: false,
    startX: 0,
    startY: 0,
    yawAtStart: 0,
    tiltAtStart: 0,
  });
  const dragYawOffsetRef = useRef(0);
  const dragTiltOffsetRef = useRef(0);
  const scoresRef = useRef(scores);
  const subScoresRef = useRef(subScores);
  const onClickRef = useRef(onDimensionClick);
  const comparisonScoresRef = useRef(comparisonScores);

  // Focus mode refs
  const focusedDimRef = useRef<Dimension | null>(null);
  const focusTransitionRef = useRef(0);
  const focusTargetYawRef = useRef(0);
  const focusTargetTiltRef = useRef(0);
  const prevFocusedDimRef = useRef<Dimension | null>(null);

  // Zoom animation refs
  const zoomRef = useRef(1.0);
  const centerOffsetRef = useRef({ x: 0, y: 0 });

  // React state for DOM description panel
  const [focusedDimState, setFocusedDimState] = useState<Dimension | null>(null);
  const [selectedSubIndex, setSelectedSubIndex] = useState<number | null>(null);
  const [hoveredSubIndex, setHoveredSubIndex] = useState<number | null>(null);
  const selectedSubRef = useRef<number | null>(null);
  const prevHoveredSubIndexRef = useRef<number | null>(null);
  const isQuickRef = useRef(isQuick);

  // Accumulated time ref for pulse animation
  const timeAccumRef = useRef(0);

  // Keep refs in sync with props
  scoresRef.current = scores;
  comparisonScoresRef.current = comparisonScores;
  subScoresRef.current = subScores;
  onClickRef.current = onDimensionClick;
  isQuickRef.current = isQuick;

  // External focus dimension synchronization
  useEffect(() => {
    if (externalFocusDimension === undefined) return;

    if (externalFocusDimension === null) {
      if (focusedDimRef.current !== null) {
        focusedDimRef.current = null;
        selectedSubRef.current = null;
        setSelectedSubIndex(null);
      }
    } else {
      focusedDimRef.current = externalFocusDimension;
      selectedSubRef.current = null;
      setSelectedSubIndex(null);
      const dir = DIMENSION_DIRS[externalFocusDimension];
      focusTargetYawRef.current = -Math.atan2(dir.dx, dir.dz);
      focusTargetTiltRef.current = Math.atan2(dir.dy, Math.sqrt(dir.dx * dir.dx + dir.dz * dir.dz));
    }
  }, [externalFocusDimension]);

  // External sub-node index synchronization
  useEffect(() => {
    if (externalFocusSubIndex === undefined) return;
    if (externalFocusSubIndex === null) {
      selectedSubRef.current = null;
      setSelectedSubIndex(null);
    } else {
      selectedSubRef.current = externalFocusSubIndex;
      setSelectedSubIndex(externalFocusSubIndex);
    }
  }, [externalFocusSubIndex]);

  // Generate ambient lines once
  if (!ambientRef.current) {
    ambientRef.current = generateAmbientLines();
  }

  // Initialize particles for high-score dimensions
  if (particlesRef.current.length === 0) {
    for (const dim of DIMENSIONS) {
      if (scores[dim] > 70) {
        for (let i = 0; i < 3; i++) {
          particlesRef.current.push({
            dim,
            t: Math.random(),
            speed: 0.15 + Math.random() * 0.15,
          });
        }
      }
    }
  }

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

  /* ---- Mouse handlers ---- */

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    drag.active = true;
    drag.didDrag = false;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.yawAtStart = dragYawOffsetRef.current;
    drag.tiltAtStart = dragTiltOffsetRef.current;
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const drag = dragRef.current;
    if (drag.active) {
      const deltaX = e.clientX - drag.startX;
      const deltaY = e.clientY - drag.startY;
      if (!drag.didDrag && Math.sqrt(deltaX * deltaX + deltaY * deltaY) > DRAG_THRESHOLD) {
        drag.didDrag = true;
      }
      if (drag.didDrag) {
        dragYawOffsetRef.current = drag.yawAtStart + deltaX * DRAG_SENSITIVITY;
        dragTiltOffsetRef.current = drag.tiltAtStart - deltaY * DRAG_SENSITIVITY;
      }
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -9999, y: -9999 };
    dragRef.current.active = false;
    dragRef.current.didDrag = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  }, []);

  const handleMouseUp = useCallback(() => {
    const drag = dragRef.current;
    if (drag.didDrag) {
      // Dragging exits focus mode
      if (focusedDimRef.current !== null) {
        focusedDimRef.current = null;
      }
    } else {
      // Sub-node click takes priority when focused
      if (hoveredSubRef.current !== null && focusedDimRef.current !== null) {
        const newIdx = hoveredSubRef.current.index;
        selectedSubRef.current = selectedSubRef.current === newIdx ? null : newIdx;
        setSelectedSubIndex(selectedSubRef.current);
      } else if (hoveredRef.current) {
        const clickedDim = hoveredRef.current;
        selectedSubRef.current = null;
        setSelectedSubIndex(null);

        if (focusedDimRef.current === null) {
          focusedDimRef.current = clickedDim;
          const dir = DIMENSION_DIRS[clickedDim];
          focusTargetYawRef.current = -Math.atan2(dir.dx, dir.dz);
          focusTargetTiltRef.current = Math.atan2(dir.dy, Math.sqrt(dir.dx * dir.dx + dir.dz * dir.dz));
        } else if (focusedDimRef.current !== clickedDim) {
          focusedDimRef.current = clickedDim;
          const dir = DIMENSION_DIRS[clickedDim];
          focusTargetYawRef.current = -Math.atan2(dir.dx, dir.dz);
          focusTargetTiltRef.current = Math.atan2(dir.dy, Math.sqrt(dir.dx * dir.dx + dir.dz * dir.dz));
        }

        if (onClickRef.current) {
          onClickRef.current(clickedDim);
        }
      }
    }
    drag.active = false;
    drag.didDrag = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  }, []);

  useEffect(() => {
    resize();

    const container = containerRef.current!;
    let observer: ResizeObserver | null = null;
    if (container) {
      observer = new ResizeObserver(() => resize());
      observer.observe(container);
    }

    const handleWindowMouseUp = () => {
      const drag = dragRef.current;
      if (drag.didDrag) {
        if (focusedDimRef.current !== null) {
          focusedDimRef.current = null;
        }
      } else {
        if (hoveredSubRef.current !== null && focusedDimRef.current !== null) {
          const newIdx = hoveredSubRef.current.index;
          selectedSubRef.current = selectedSubRef.current === newIdx ? null : newIdx;
          setSelectedSubIndex(selectedSubRef.current);
        } else if (hoveredRef.current) {
          const clickedDim = hoveredRef.current;
          selectedSubRef.current = null;
          setSelectedSubIndex(null);

          if (focusedDimRef.current === null) {
            focusedDimRef.current = clickedDim;
            const dir = DIMENSION_DIRS[clickedDim];
            focusTargetYawRef.current = -Math.atan2(dir.dx, dir.dz);
          focusTargetTiltRef.current = Math.atan2(dir.dy, Math.sqrt(dir.dx * dir.dx + dir.dz * dir.dz));
          } else if (focusedDimRef.current !== clickedDim) {
            focusedDimRef.current = clickedDim;
            const dir = DIMENSION_DIRS[clickedDim];
            focusTargetYawRef.current = -Math.atan2(dir.dx, dir.dz);
          focusTargetTiltRef.current = Math.atan2(dir.dy, Math.sqrt(dir.dx * dir.dx + dir.dz * dir.dz));
          }

          if (onClickRef.current) {
            onClickRef.current(clickedDim);
          }
        }
      }
      drag.active = false;
      drag.didDrag = false;
      if (containerRef.current) containerRef.current.style.cursor = 'grab';
    };
    window.addEventListener('mouseup', handleWindowMouseUp);

    /* ---- Touch support ---- */

    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      const drag = dragRef.current;

      drag.active = true;
      drag.didDrag = false;
      drag.startX = t.clientX;
      drag.startY = t.clientY;
      drag.yawAtStart = dragYawOffsetRef.current;
      drag.tiltAtStart = dragTiltOffsetRef.current;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const drag = dragRef.current;
      if (!drag.active) return;
      const t = e.touches[0];
      const deltaX = t.clientX - drag.startX;
      const deltaY = t.clientY - drag.startY;
      if (!drag.didDrag && Math.sqrt(deltaX * deltaX + deltaY * deltaY) > DRAG_THRESHOLD) {
        drag.didDrag = true;
      }
      if (drag.didDrag) {
        e.preventDefault();
        dragYawOffsetRef.current = drag.yawAtStart + deltaX * DRAG_SENSITIVITY;
        dragTiltOffsetRef.current = drag.tiltAtStart - deltaY * DRAG_SENSITIVITY;
      }
    };

    const handleTouchEnd = () => {
      const drag = dragRef.current;
      if (drag.didDrag) {
        if (focusedDimRef.current !== null) {
          focusedDimRef.current = null;
        }
      } else {
        if (hoveredSubRef.current !== null && focusedDimRef.current !== null) {
          const newIdx = hoveredSubRef.current.index;
          selectedSubRef.current = selectedSubRef.current === newIdx ? null : newIdx;
          setSelectedSubIndex(selectedSubRef.current);
        } else if (hoveredRef.current) {
          const clickedDim = hoveredRef.current;
          selectedSubRef.current = null;
          setSelectedSubIndex(null);

          if (focusedDimRef.current === null) {
            focusedDimRef.current = clickedDim;
            const dir = DIMENSION_DIRS[clickedDim];
            focusTargetYawRef.current = -Math.atan2(dir.dx, dir.dz);
          focusTargetTiltRef.current = Math.atan2(dir.dy, Math.sqrt(dir.dx * dir.dx + dir.dz * dir.dz));
          } else if (focusedDimRef.current !== clickedDim) {
            focusedDimRef.current = clickedDim;
            const dir = DIMENSION_DIRS[clickedDim];
            focusTargetYawRef.current = -Math.atan2(dir.dx, dir.dz);
          focusTargetTiltRef.current = Math.atan2(dir.dy, Math.sqrt(dir.dx * dir.dx + dir.dz * dir.dz));
          }

          if (onClickRef.current) {
            onClickRef.current(clickedDim);
          }
        }
      }
      drag.active = false;
      drag.didDrag = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    /* ---- prefers-reduced-motion ---- */

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ambientLines = ambientRef.current!;
    const particles = particlesRef.current;
    let prevTimestamp: number | null = null;
    let yaw = 0;
    const BASE_ANGULAR_SPEED = (Math.PI * 2) / ROTATION_PERIOD_S;

    /* ---- Render function ---- */

    function renderFrame(finalYaw: number, finalTilt: number, dt: number) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const currentScores = scoresRef.current;
      const currentSubScores = subScoresRef.current;
      const w = parseFloat(canvas.style.width) || canvas.width;
      const h = parseFloat(canvas.style.height) || canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = Math.min(w, h) * 0.58;
      const mouse = mouseRef.current;
      const drag = dragRef.current;
      const focusTransition = focusTransitionRef.current;
      const focusedDim = focusedDimRef.current;

      /* ---- Zoom animation ---- */

      const zoomTarget = focusedDim !== null ? 1.35 : 1.0;
      zoomRef.current += (zoomTarget - zoomRef.current) * 0.04;
      if (Math.abs(zoomRef.current - zoomTarget) < 0.001) zoomRef.current = zoomTarget;

      const radius = baseRadius * zoomRef.current;

      /* ---- Center offset animation ---- */

      if (focusedDim !== null) {
        const fDir = DIMENSION_DIRS[focusedDim];
        const fScore = currentScores[focusedDim];
        const fVecLen = MIN_VECTOR_LENGTH + (fScore / 100) * (MAX_VECTOR_LENGTH - MIN_VECTOR_LENGTH);
        const fr3 = rotate(
          fDir.dx * radius * fVecLen,
          fDir.dy * radius * fVecLen,
          fDir.dz * radius * fVecLen,
          finalYaw, finalTilt,
        );
        const fp = project(fr3.x, fr3.y, fr3.z, cx, cy);
        const targetX = (fp.sx - cx) * 0.15;
        const targetY = (fp.sy - cy) * 0.15;
        centerOffsetRef.current.x += (targetX - centerOffsetRef.current.x) * 0.04;
        centerOffsetRef.current.y += (targetY - centerOffsetRef.current.y) * 0.04;
      } else {
        centerOffsetRef.current.x += (0 - centerOffsetRef.current.x) * 0.04;
        centerOffsetRef.current.y += (0 - centerOffsetRef.current.y) * 0.04;
        if (Math.abs(centerOffsetRef.current.x) < 0.01) centerOffsetRef.current.x = 0;
        if (Math.abs(centerOffsetRef.current.y) < 0.01) centerOffsetRef.current.y = 0;
      }

      const ecx = cx + centerOffsetRef.current.x;
      const ecy = cy + centerOffsetRef.current.y;

      ctx.clearRect(0, 0, w, h);

      /* ---- Sync focusedDimState (only on change) ---- */

      if (focusedDimRef.current !== prevFocusedDimRef.current) {
        prevFocusedDimRef.current = focusedDimRef.current;
        setFocusedDimState(focusedDimRef.current);
        selectedSubRef.current = null;
        setSelectedSubIndex(null);
      }

      /* ---- Phase 1: Compute ambient line positions ---- */

      interface AmbientComputed {
        endSX: number;
        endSY: number;
        endDepth: number;
        depthNorm: number;
        color: { r: number; g: number; b: number };
        opacity: number;
        lineWidth: number;
      }

      const ambientComputed: AmbientComputed[] = [];
      let maxZ = 1;

      const ambientRotated: { x: number; y: number; z: number }[] = [];
      for (const line of ambientLines) {
        const ex = line.dx * radius * line.length;
        const ey = line.dy * radius * line.length;
        const ez = line.dz * radius * line.length;
        const r3 = rotate(ex, ey, ez, finalYaw, finalTilt);
        ambientRotated.push(r3);
        if (Math.abs(r3.z) > maxZ) maxZ = Math.abs(r3.z);
      }

      /* ---- Phase 2: Compute dimension vector endpoints ---- */

      interface DimComputed {
        dim: Dimension;
        sx: number;
        sy: number;
        depth: number;
        depthNorm: number;
        isFront: boolean;
        scale: number;
        score: number;
        color: { r: number; g: number; b: number };
        vectorLength: number;
        raw: { x: number; y: number; z: number };
      }

      const dimComputed: Map<Dimension, DimComputed> = new Map();

      for (const dim of DIMENSIONS) {
        const dir = DIMENSION_DIRS[dim];
        const score = currentScores[dim];
        const vectorLength = MIN_VECTOR_LENGTH + (score / 100) * (MAX_VECTOR_LENGTH - MIN_VECTOR_LENGTH);
        const ex = dir.dx * radius * vectorLength;
        const ey = dir.dy * radius * vectorLength;
        const ez = dir.dz * radius * vectorLength;
        const r3 = rotate(ex, ey, ez, finalYaw, finalTilt);
        if (Math.abs(r3.z) > maxZ) maxZ = Math.abs(r3.z);

        dimComputed.set(dim, {
          dim,
          sx: 0,
          sy: 0,
          depth: r3.z,
          depthNorm: 0,
          isFront: r3.z > 0,
          scale: 1,
          score,
          color: GREY,
          vectorLength,
          raw: r3,
        });
      }

      /* ---- Phase 1b: Normalize depths and project ---- */

      for (let i = 0; i < ambientLines.length; i++) {
        const line = ambientLines[i];
        const r3 = ambientRotated[i];
        const p = project(r3.x, r3.y, r3.z, ecx, ecy);
        const depthNorm = (r3.z / maxZ + 1) / 2;
        const color = lerpColor(GREY, ACCENT, depthNorm * 0.5);
        const opacity = line.baseOpacity * (0.5 + depthNorm * 0.5);
        const lineWidth = 0.3 + depthNorm * 0.3;

        ambientComputed.push({
          endSX: p.sx,
          endSY: p.sy,
          endDepth: r3.z,
          depthNorm,
          color,
          opacity,
          lineWidth,
        });
      }

      for (const dc of dimComputed.values()) {
        const p = project(dc.raw.x, dc.raw.y, dc.raw.z, ecx, ecy);
        dc.sx = p.sx;
        dc.sy = p.sy;
        dc.scale = p.scale;
        dc.depthNorm = (dc.raw.z / maxZ + 1) / 2;
        dc.isFront = dc.raw.z > 0;
        dc.color = lerpColor(GREY, ACCENT, dc.score / 100);
      }

      /* ---- Phase 2b: Compute sub-node positions ---- */

      interface SubNodeComputed {
        dim: Dimension;
        index: number;
        sx: number;
        sy: number;
        z: number;
        isFront: boolean;
        score: number;
        label: string;
        color: { r: number; g: number; b: number };
      }

      const subNodesComputed: SubNodeComputed[] = [];

      if (currentSubScores) {
        for (const dim of DIMENSIONS) {
          const dimSubs = currentSubScores[dim];
          if (!dimSubs) continue;
          const dc = dimComputed.get(dim)!;
          const dir = DIMENSION_DIRS[dim];
          const isFocused = dim === focusedDim;

          const spread = isFocused
            ? lerp(1.36, 1.48, focusTransition)
            : 1.36;

          const parentVecLen = MIN_VECTOR_LENGTH + (dc.score / 100) * (MAX_VECTOR_LENGTH - MIN_VECTOR_LENGTH);
          const tipX = dir.dx * parentVecLen * radius;
          const tipY = dir.dy * parentVecLen * radius;
          const tipZ = dir.dz * parentVecLen * radius;

          for (let si = 0; si < dimSubs.length; si++) {
            const sub = dimSubs[si];
            const subDir = computeSubNodeDirection(dir, si, dimSubs.length, spread);
            const ribLen = (sub.score / 100) * parentVecLen * 0.5 * radius;

            const sx3 = tipX + subDir.dx * ribLen;
            const sy3 = tipY + subDir.dy * ribLen;
            const sz3 = tipZ + subDir.dz * ribLen;
            const r3 = rotate(sx3, sy3, sz3, finalYaw, finalTilt);
            const p = project(r3.x, r3.y, r3.z, ecx, ecy);

            const subColor = isFocused
              ? SUB_NODE_COLORS[si % SUB_NODE_COLORS.length]
              : dc.color;

            subNodesComputed.push({
              dim,
              index: si,
              sx: p.sx,
              sy: p.sy,
              z: r3.z,
              isFront: r3.z > 0,
              score: sub.score,
              label: sub.label,
              color: subColor,
            });
          }
        }
      }

      /* ---- Phase 3: Hover detection (major nodes) ---- */

      let hoveredDim: Dimension | null = null;
      let hoveredDist = HOVER_RADIUS;

      if (!drag.didDrag) {
        for (const dc of dimComputed.values()) {
          if (!dc.isFront) continue;
          const ddx = mouse.x - dc.sx;
          const ddy = mouse.y - dc.sy;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist < hoveredDist) {
            hoveredDist = dist;
            hoveredDim = dc.dim;
          }
        }
      }

      hoveredRef.current = hoveredDim;

      /* ---- Phase 3b: Sub-node hover detection ---- */

      let hoveredSub: { dim: Dimension; index: number } | null = null;

      const detectSubHover = !drag.didDrag && (isQuickRef.current || focusedDim !== null);

      if (detectSubHover) {
        let bestDist = SUB_HOVER_RADIUS;
        for (const sn of subNodesComputed) {
          if (!isQuickRef.current && sn.dim !== focusedDim) continue;
          if (!sn.isFront) continue;
          const ddx = mouse.x - sn.sx;
          const ddy = mouse.y - sn.sy;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist < bestDist) {
            bestDist = dist;
            hoveredSub = { dim: sn.dim, index: sn.index };
          }
        }
      }

      hoveredSubRef.current = hoveredSub;

      const newHovSubIdx = hoveredSub?.index ?? null;
      if (newHovSubIdx !== prevHoveredSubIndexRef.current) {
        prevHoveredSubIndexRef.current = newHovSubIdx;
        setHoveredSubIndex(newHovSubIdx);
      }

      /* ---- Phase 4: Draw ambient lines (sorted back-to-front) ---- */

      const ambientIndices = ambientComputed.map((_, i) => i);
      ambientIndices.sort((a, b) => ambientComputed[a].endDepth - ambientComputed[b].endDepth);

      for (const idx of ambientIndices) {
        const c = ambientComputed[idx];
        const { r, g, b } = c.color;
        ctx.beginPath();
        ctx.moveTo(ecx, ecy);
        ctx.lineTo(c.endSX, c.endSY);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${c.opacity})`;
        ctx.lineWidth = c.lineWidth;
        ctx.stroke();
      }

      /* ---- Phase 5: Draw mesh connections ---- */

      ctx.setLineDash([4, 6]);
      for (const [dimA, dimB] of MESH_PAIRS) {
        const a = dimComputed.get(dimA)!;
        const b = dimComputed.get(dimB)!;
        const avgDepthNorm = (a.depthNorm + b.depthNorm) / 2;
        const meshColor = lerpColor(GREY, ACCENT, avgDepthNorm * 0.5);
        const meshOpacity = 0.06 + avgDepthNorm * 0.06;

        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.strokeStyle = `rgba(${meshColor.r}, ${meshColor.g}, ${meshColor.b}, ${meshOpacity})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      ctx.setLineDash([]);

      /* ---- Phase 5b: Comparison overlay (population averages) ---- */

      const currentComparison = comparisonScoresRef.current;

      if (currentComparison) {
        const compNodes: Map<Dimension, { dim: Dimension; sx: number; sy: number; z: number; score: number }> = new Map();

        for (const dim of DIMENSIONS) {
          const dir = DIMENSION_DIRS[dim];
          const score = currentComparison[dim];
          const vectorLength = MIN_VECTOR_LENGTH + (score / 100) * (MAX_VECTOR_LENGTH - MIN_VECTOR_LENGTH);
          const ex = dir.dx * radius * vectorLength;
          const ey = dir.dy * radius * vectorLength;
          const ez = dir.dz * radius * vectorLength;
          const r3 = rotate(ex, ey, ez, finalYaw, finalTilt);
          const p = project(r3.x, r3.y, r3.z, ecx, ecy);
          compNodes.set(dim, { dim, sx: p.sx, sy: p.sy, z: r3.z, score });
        }

        const compSorted = Array.from(compNodes.values()).sort((a, b) => a.z - b.z);

        for (const cn of compSorted) {
          const depthNorm = maxZ > 0 ? (cn.z / maxZ + 1) / 2 : 0.5;
          const rayAlpha = 0.08 + depthNorm * 0.12;
          const nodeAlpha = 0.3 + depthNorm * 0.25;

          ctx.beginPath();
          ctx.moveTo(ecx, ecy);
          ctx.lineTo(cn.sx, cn.sy);
          ctx.strokeStyle = `rgba(255, 255, 255, ${rayAlpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();

          const nodeSize = 4 * (FOCAL_LENGTH / (FOCAL_LENGTH - cn.z));
          ctx.fillStyle = `rgba(255, 255, 255, ${nodeAlpha})`;
          ctx.fillRect(cn.sx - nodeSize / 2, cn.sy - nodeSize / 2, nodeSize, nodeSize);

          const dir = DIMENSION_DIRS[cn.dim];
          const labelOffsetY = dir.dy < 0 ? -10 : 14;
          ctx.font = '400 10px "Mohave", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = dir.dy < 0 ? 'bottom' : 'top';
          ctx.fillStyle = `rgba(255, 255, 255, ${nodeAlpha * 0.9})`;
          ctx.fillText(`${cn.score}`, cn.sx, cn.sy + labelOffsetY);
        }
      }

      /* ---- Phase 6: Sort dimensions back-to-front ---- */

      const dimsSorted = Array.from(dimComputed.values()).sort((a, b) => a.depth - b.depth);

      /* ---- Phase 7: Draw rays, nodes, sub-nodes, particles, labels ---- */

      for (const dc of dimsSorted) {
        const { r, g, b } = dc.color;
        const isHovered = dc.dim === hoveredDim;
        const isFocused = dc.dim === focusedDim;

        const hasSubHovered = hoveredSub !== null && hoveredSub.dim === dc.dim;
        const isBright = isHovered || hasSubHovered;

        const focusDimAlpha = isFocused || focusedDim === null
          ? 1.0
          : 1.0 - focusTransition * 0.7;

        const rayOpacity = (isBright
          ? lerp(0.45, 0.75, dc.depthNorm)
          : lerp(0.10, 0.45, dc.depthNorm)) * focusDimAlpha;

        ctx.beginPath();
        ctx.moveTo(ecx, ecy);
        ctx.lineTo(dc.sx, dc.sy);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${rayOpacity})`;
        ctx.lineWidth = isBright ? 1.8 : (0.5 + dc.depthNorm * 0.8);
        ctx.stroke();

        const dimIdx = DIMENSIONS.indexOf(dc.dim);
        const time = timeAccumRef.current;
        const shouldPulse = focusedDim === null && !isBright;
        const pulse = shouldPulse
          ? 0.5 + 0.5 * Math.sin(time * 2.0 + dimIdx * 1.05)
          : 0;
        const basePulseSize = isBright ? 9 : shouldPulse ? (6 + pulse * 2) : 7;
        const nodeSize = basePulseSize * dc.scale;
        const defaultAlpha = shouldPulse
          ? lerp(0.30, 0.80, dc.depthNorm)
          : lerp(0.18, 0.75, dc.depthNorm);
        const nodeAlpha = (isBright ? 0.90 : defaultAlpha) * focusDimAlpha;

        const pulseGlow = isBright ? 14 : shouldPulse ? (4 + pulse * 8) : 0;
        const pulseGlowAlpha = isBright ? 0.5 : shouldPulse ? (0.10 + pulse * 0.18) : 0;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${pulseGlowAlpha * focusDimAlpha})`;
        ctx.shadowBlur = pulseGlow;

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${nodeAlpha})`;
        ctx.fillRect(
          dc.sx - nodeSize / 2,
          dc.sy - nodeSize / 2,
          nodeSize,
          nodeSize,
        );

        if (isBright) {
          ctx.fillRect(
            dc.sx - nodeSize / 2,
            dc.sy - nodeSize / 2,
            nodeSize,
            nodeSize,
          );
        }
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        /* ---- Sub-nodes for this dimension ---- */

        const dimSubNodes = subNodesComputed.filter(sn => sn.dim === dc.dim);
        const quickMode = isQuickRef.current;

        for (const sn of dimSubNodes) {
          const isSubHovered = hoveredSub !== null
            && hoveredSub.dim === sn.dim
            && hoveredSub.index === sn.index;
          const isSubSelected = !quickMode && isFocused
            && selectedSubRef.current === sn.index;

          const snColor = sn.color;

          let subSize: number;
          if (quickMode) {
            subSize = 4 * dc.scale;
            if (isSubHovered) subSize += 2;
          } else if (isFocused) {
            subSize = lerp(4, 8, focusTransition) * dc.scale;
            if (isSubSelected) subSize += 3;
            else if (isSubHovered) subSize += 2;
          } else {
            subSize = 4 * dc.scale;
            if (isSubHovered) subSize += 2;
          }

          const subAlphaFactor = quickMode
            ? 0.65
            : isFocused
              ? lerp(0.75, 0.8, focusTransition)
              : 0.75;
          const subAlpha = nodeAlpha * subAlphaFactor;

          let connLineWidth: number;
          let connOpacity: number;

          if (isSubHovered) {
            connLineWidth = 1.6;
            connOpacity = Math.min(subAlpha * 1.2, 0.9);
          } else if (quickMode) {
            connLineWidth = 0.6;
            connOpacity = subAlpha * 0.55;
          } else if (isFocused) {
            connLineWidth = lerp(0.7, isSubSelected ? 1.6 : 1.2, focusTransition);
            connOpacity = subAlpha * lerp(0.6, isSubSelected ? 0.85 : 0.75, focusTransition);
          } else {
            connLineWidth = 0.7;
            connOpacity = subAlpha * 0.55;
          }

          ctx.beginPath();
          ctx.moveTo(dc.sx, dc.sy);
          ctx.lineTo(sn.sx, sn.sy);
          ctx.strokeStyle = `rgba(${snColor.r}, ${snColor.g}, ${snColor.b}, ${connOpacity})`;
          ctx.lineWidth = connLineWidth;
          ctx.stroke();

          if (isSubSelected) {
            ctx.shadowColor = `rgba(${snColor.r}, ${snColor.g}, ${snColor.b}, 0.7)`;
            ctx.shadowBlur = 16;
          } else if (isSubHovered) {
            ctx.shadowColor = `rgba(${snColor.r}, ${snColor.g}, ${snColor.b}, 0.6)`;
            ctx.shadowBlur = 12;
          }

          const drawAlpha = !quickMode && isSubSelected ? Math.min(subAlpha + 0.2, 1) : subAlpha;
          ctx.fillStyle = `rgba(${snColor.r}, ${snColor.g}, ${snColor.b}, ${drawAlpha})`;
          ctx.fillRect(
            sn.sx - subSize / 2,
            sn.sy - subSize / 2,
            subSize,
            subSize,
          );

          if (isSubHovered || isSubSelected) {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          }

          if (quickMode) {
            const labelAlpha = isSubHovered ? 0.9 : subAlpha * 0.8;
            ctx.font = isSubHovered ? '600 11px "Kosugi", sans-serif' : '400 10px "Kosugi", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = `rgba(${snColor.r}, ${snColor.g}, ${snColor.b}, ${labelAlpha})`;
            ctx.fillText(sn.label.toUpperCase(), sn.sx, sn.sy + subSize / 2 + 5);
          } else if (isFocused && focusTransition > 0.3) {
            const labelAlpha = (focusTransition - 0.3) / 0.7 * (isSubSelected ? Math.min(subAlpha + 0.2, 1) : isSubHovered ? 0.9 : subAlpha);
            ctx.font = (isSubSelected || isSubHovered) ? '600 11px "Kosugi", sans-serif' : '400 10px "Kosugi", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = `rgba(${snColor.r}, ${snColor.g}, ${snColor.b}, ${labelAlpha})`;
            ctx.fillText(sn.label.toUpperCase(), sn.sx, sn.sy + subSize / 2 + 5);
          }

          if (isSubHovered || isSubSelected) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            if (quickMode) {
              ctx.font = '400 9px "Kosugi", sans-serif';
              ctx.fillStyle = `rgba(${snColor.r}, ${snColor.g}, ${snColor.b}, 0.6)`;
              ctx.fillText('information not available', sn.sx, sn.sy - subSize / 2 - 7);
            } else {
              ctx.font = '600 14px "Mohave", sans-serif';
              ctx.fillStyle = `rgba(${snColor.r}, ${snColor.g}, ${snColor.b}, 0.95)`;
              ctx.fillText(`${sn.score}`, sn.sx, sn.sy - subSize / 2 - 7);
            }
          }
        }

        // Draw particles along high-score vectors
        const showParticles = !prefersReduced && dc.score > 70
          && (focusedDim === null || isFocused);

        if (showParticles) {
          for (const particle of particles) {
            if (particle.dim !== dc.dim) continue;
            const pt = particle.t;
            const px = ecx + (dc.sx - ecx) * pt;
            const py = ecy + (dc.sy - ecy) * pt;
            const particleSize = 2 * dc.scale;
            const particleAlpha = nodeAlpha * 0.6 * (1 - Math.abs(pt - 0.5) * 2);

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0, particleAlpha)})`;
            ctx.fillRect(
              px - particleSize / 2,
              py - particleSize / 2,
              particleSize,
              particleSize,
            );
          }
        }

        // Draw dimension label
        const dir = DIMENSION_DIRS[dc.dim];
        const labelOffsetY = dir.dy < 0 ? -18 : 22;
        const labelX = dc.sx;
        const labelY = dc.sy + labelOffsetY;
        const labelAlpha = (isBright
          ? 0.90
          : lerp(0.10, 0.55, dc.depthNorm)) * focusDimAlpha;

        ctx.font = isBright ? '600 13px "Kosugi", sans-serif' : '400 12px "Kosugi", sans-serif';
        ctx.textBaseline = dir.dy < 0 ? 'bottom' : 'top';
        if (dir.dx < -0.1) {
          ctx.textAlign = 'right';
        } else if (dir.dx > 0.1) {
          ctx.textAlign = 'left';
        } else {
          ctx.textAlign = 'center';
        }

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${labelAlpha})`;
        ctx.fillText(DIMENSION_LABELS[dc.dim], labelX, labelY);

        // Show score value when hovered (major or sub-hover)
        if (isBright) {
          const scoreLabel = `${dc.score}`;
          const scoreLabelY = dir.dy < 0 ? labelY - 15 : labelY + 15;
          ctx.font = '600 14px "Mohave", sans-serif';
          ctx.fillStyle = `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, 0.90)`;
          ctx.fillText(scoreLabel, labelX, scoreLabelY);
        }
      }

      /* ---- Update particles ---- */
      if (!prefersReduced) {
        for (const particle of particles) {
          particle.t += particle.speed * dt;
          if (particle.t > 1) {
            particle.t = 0;
            particle.speed = 0.15 + Math.random() * 0.15;
          }
        }
      }
    }

    /* ---- Static frame for reduced motion ---- */

    if (prefersReduced) {
      renderFrame(0, TILT_ANGLE, 0);
      return () => {
        if (observer) observer.disconnect();
        window.removeEventListener('mouseup', handleWindowMouseUp);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }

    /* ---- Animation loop ---- */

    function draw(timestamp: number) {
      if (prevTimestamp === null) prevTimestamp = timestamp;
      const dt = (timestamp - prevTimestamp) / 1000;
      prevTimestamp = timestamp;
      timeAccumRef.current += dt;

      const drag = dragRef.current;
      const focusedDim = focusedDimRef.current;

      // Focus transition lerp
      if (focusedDim !== null) {
        focusTransitionRef.current += (1.0 - focusTransitionRef.current) * 0.04;
      } else {
        focusTransitionRef.current += (0.0 - focusTransitionRef.current) * 0.04;
        if (focusTransitionRef.current < 0.001) focusTransitionRef.current = 0;
      }

      if (!drag.active) {
        yaw = (yaw + dragYawOffsetRef.current) % (Math.PI * 2);
        dragYawOffsetRef.current = 0;

        if (focusedDim !== null) {
          let delta = focusTargetYawRef.current - yaw;
          delta -= Math.round(delta / (Math.PI * 2)) * (Math.PI * 2);
          yaw += delta * 0.04;

          const targetTiltOffset = focusTargetTiltRef.current - TILT_ANGLE;
          dragTiltOffsetRef.current += (targetTiltOffset - dragTiltOffsetRef.current) * 0.04;
        } else {
          yaw = (yaw + BASE_ANGULAR_SPEED * dt) % (Math.PI * 2);
        }
      }

      const finalYaw = yaw + dragYawOffsetRef.current;
      const finalTilt = TILT_ANGLE + dragTiltOffsetRef.current;

      renderFrame(finalYaw, finalTilt, dt);

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      if (observer) observer.disconnect();
      window.removeEventListener('mouseup', handleWindowMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [resize]);

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      style={{ position: 'relative', cursor: 'grab' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />

      {/* Navigation hint + average toggle — top left */}
      <div className="absolute top-2 left-2 flex flex-col gap-2">
        <p className="font-caption text-[9px] uppercase tracking-[0.2em] text-ops-text-secondary/60 pointer-events-none">
          Drag to navigate, click a node to see details
        </p>
        {onToggleAverages && (
          <button
            type="button"
            onClick={onToggleAverages}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-2 font-caption uppercase tracking-[0.15em] text-[10px] px-3 py-1.5 rounded-[3px] border transition-all duration-200 cursor-pointer w-fit ${
              showAverages
                ? 'border-white/50 text-white bg-white/10'
                : 'border-ops-border text-ops-text-secondary/50 hover:border-ops-border-hover hover:text-ops-text-secondary'
            }`}
          >
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                showAverages ? 'bg-white' : 'bg-ops-text-secondary/30'
              }`}
            />
            Population Average
          </button>
        )}
      </div>
    </div>
  );
}
