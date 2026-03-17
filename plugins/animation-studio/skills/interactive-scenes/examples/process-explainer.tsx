/**
 * ProcessExplainer — Step-by-step process visualization with SVG connections
 *
 * Renders a vertical sequence of step nodes that animate in on scroll via
 * IntersectionObserver. SVG connection lines draw between nodes as each
 * step becomes visible. Fully configurable step data via props.
 *
 * Dependencies: React only (no animation libraries).
 */

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ExplainerStep {
  /** Unique identifier */
  id: string;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Optional icon (React node) */
  icon?: React.ReactNode;
  /** Status for styling (default: 'pending') */
  status?: 'pending' | 'active' | 'complete';
}

interface ProcessExplainerProps {
  /** Array of steps to display */
  steps: ExplainerStep[];
  /** Layout direction (default: 'vertical') */
  layout?: 'vertical' | 'horizontal';
  /** Connection line style (default: 'curved') */
  connectionStyle?: 'straight' | 'curved';
  /** Step that should be highlighted as active */
  activeStepId?: string;
  /** Accent color as CSS color string (default: 'rgba(89, 119, 148, 1)') */
  accentColor?: string;
  /** Whether to animate on scroll or show all immediately (default: true) */
  animateOnScroll?: boolean;
  /** IntersectionObserver threshold (default: 0.3) */
  threshold?: number;
  /** Stagger delay between step animations in ms (default: 150) */
  staggerDelay?: number;
  /** Optional className for the outer container */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const NODE_SIZE = 40;
const NODE_GAP_VERTICAL = 100;
const NODE_GAP_HORIZONTAL = 160;
const LINE_DRAW_DURATION = 600;
const STEP_FADE_DURATION = 500;

/* ------------------------------------------------------------------ */
/*  SVG Path helpers                                                   */
/* ------------------------------------------------------------------ */

function computeVerticalPath(
  fromX: number, fromY: number,
  toX: number, toY: number,
  style: 'straight' | 'curved',
): string {
  if (style === 'straight') {
    return `M ${fromX} ${fromY} L ${toX} ${toY}`;
  }
  const dy = toY - fromY;
  const cp1y = fromY + dy * 0.5;
  const cp2y = toY - dy * 0.5;
  return `M ${fromX} ${fromY} C ${fromX} ${cp1y}, ${toX} ${cp2y}, ${toX} ${toY}`;
}

function computeHorizontalPath(
  fromX: number, fromY: number,
  toX: number, toY: number,
  style: 'straight' | 'curved',
): string {
  if (style === 'straight') {
    return `M ${fromX} ${fromY} L ${toX} ${toY}`;
  }
  const dx = toX - fromX;
  const cp1x = fromX + dx * 0.5;
  const cp2x = toX - dx * 0.5;
  return `M ${fromX} ${fromY} C ${cp1x} ${fromY}, ${cp2x} ${toY}, ${toX} ${toY}`;
}

/* ------------------------------------------------------------------ */
/*  Connection Line component                                          */
/* ------------------------------------------------------------------ */

function ConnectionLine({
  pathD,
  visible,
  accentColor,
  delay,
}: {
  pathD: string;
  visible: boolean;
  accentColor: string;
  delay: number;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const [length, setLength] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (!pathRef.current) return;
    const l = pathRef.current.getTotalLength();
    setLength(l);
    // Initialize with full dashoffset (hidden)
    pathRef.current.style.strokeDasharray = `${l}`;
    pathRef.current.style.strokeDashoffset = `${l}`;
  }, [pathD]);

  useEffect(() => {
    if (!visible || length === 0) return;
    const timer = setTimeout(() => setShouldAnimate(true), delay);
    return () => clearTimeout(timer);
  }, [visible, length, delay]);

  useEffect(() => {
    if (!shouldAnimate || !pathRef.current || length === 0) return;
    // Force reflow before transitioning
    pathRef.current.getBoundingClientRect();
    pathRef.current.style.transition = `stroke-dashoffset ${LINE_DRAW_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    pathRef.current.style.strokeDashoffset = '0';
  }, [shouldAnimate, length]);

  return (
    <path
      ref={pathRef}
      d={pathD}
      fill="none"
      stroke={accentColor}
      strokeWidth={1.5}
      strokeLinecap="round"
      opacity={0.5}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Step Node component                                                */
/* ------------------------------------------------------------------ */

function StepNode({
  step,
  index,
  isActive,
  isVisible,
  delay,
  accentColor,
  layout,
}: {
  step: ExplainerStep;
  index: number;
  isActive: boolean;
  isVisible: boolean;
  delay: number;
  accentColor: string;
  layout: 'vertical' | 'horizontal';
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(timer);
  }, [isVisible, delay]);

  const isComplete = step.status === 'complete';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: layout === 'vertical' ? 'row' : 'column',
        alignItems: layout === 'vertical' ? 'flex-start' : 'center',
        gap: 16,
        opacity: shown ? 1 : 0,
        transform: shown
          ? 'translateY(0)'
          : layout === 'vertical'
            ? 'translateY(20px)'
            : 'translateX(20px)',
        transition: `opacity ${STEP_FADE_DURATION}ms ease-out ${delay}ms, transform ${STEP_FADE_DURATION}ms ease-out ${delay}ms`,
        minWidth: layout === 'horizontal' ? 180 : undefined,
      }}
    >
      {/* Node circle */}
      <div
        style={{
          width: NODE_SIZE,
          height: NODE_SIZE,
          minWidth: NODE_SIZE,
          minHeight: NODE_SIZE,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${isActive ? accentColor : isComplete ? accentColor : 'rgba(255, 255, 255, 0.12)'}`,
          background: isActive
            ? `${accentColor}22`
            : isComplete
              ? `${accentColor}11`
              : 'rgba(255, 255, 255, 0.03)',
          transition: 'border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease',
          boxShadow: isActive ? `0 0 20px ${accentColor}33` : 'none',
          position: 'relative',
        }}
      >
        {step.icon ? (
          <div style={{ width: 20, height: 20, color: isActive || isComplete ? accentColor : 'rgba(255, 255, 255, 0.4)' }}>
            {step.icon}
          </div>
        ) : (
          <span
            style={{
              fontFamily: '"Mohave", sans-serif',
              fontSize: 14,
              fontWeight: 600,
              color: isActive || isComplete ? accentColor : 'rgba(255, 255, 255, 0.3)',
              transition: 'color 0.3s ease',
            }}
          >
            {index + 1}
          </span>
        )}

        {/* Active pulse ring */}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: 7,
              border: `1px solid ${accentColor}`,
              opacity: 0,
              animation: 'step-pulse 2s ease-out infinite',
            }}
          />
        )}
      </div>

      {/* Text content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: '"Mohave", sans-serif',
            fontSize: 15,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: isActive ? 'rgba(255, 255, 255, 0.95)' : isComplete ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.5)',
            marginBottom: 4,
            transition: 'color 0.3s ease',
          }}
        >
          {step.title}
        </div>
        <div
          style={{
            fontFamily: '"Kosugi", sans-serif',
            fontSize: 13,
            lineHeight: 1.55,
            color: isActive ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.35)',
            transition: 'color 0.3s ease',
          }}
        >
          {step.description}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function ProcessExplainer({
  steps,
  layout = 'vertical',
  connectionStyle = 'curved',
  activeStepId,
  accentColor = 'rgba(89, 119, 148, 1)',
  animateOnScroll = true,
  threshold = 0.3,
  staggerDelay = 150,
  className,
}: ProcessExplainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(
    animateOnScroll ? new Set() : new Set(steps.map((_, i) => i))
  );

  /* ---- IntersectionObserver ---- */

  useEffect(() => {
    if (!animateOnScroll || !containerRef.current) return;

    const nodeElements = containerRef.current.querySelectorAll('[data-step-index]');
    if (nodeElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = parseInt((entry.target as HTMLElement).dataset.stepIndex || '0', 10);
            setVisibleSteps(prev => {
              const next = new Set(prev);
              next.add(idx);
              return next;
            });
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold }
    );

    for (const el of nodeElements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [animateOnScroll, threshold, steps.length]);

  /* ---- Compute SVG connection paths ---- */

  const isVertical = layout === 'vertical';
  const gap = isVertical ? NODE_GAP_VERTICAL : NODE_GAP_HORIZONTAL;

  // Node center positions (relative to SVG origin)
  const nodePositions = steps.map((_, i) => {
    if (isVertical) {
      return { x: NODE_SIZE / 2, y: i * (NODE_SIZE + gap) + NODE_SIZE / 2 };
    }
    return { x: i * (NODE_SIZE + gap) + NODE_SIZE / 2, y: NODE_SIZE / 2 };
  });

  const svgWidth = isVertical
    ? NODE_SIZE
    : steps.length * NODE_SIZE + (steps.length - 1) * gap;
  const svgHeight = isVertical
    ? steps.length * NODE_SIZE + (steps.length - 1) * gap
    : NODE_SIZE;

  const connections: { pathD: string; fromIdx: number }[] = [];
  for (let i = 0; i < steps.length - 1; i++) {
    const from = nodePositions[i];
    const to = nodePositions[i + 1];
    const pathD = isVertical
      ? computeVerticalPath(from.x, from.y + NODE_SIZE / 2, to.x, to.y - NODE_SIZE / 2, connectionStyle)
      : computeHorizontalPath(from.x + NODE_SIZE / 2, from.y, to.x - NODE_SIZE / 2, to.y, connectionStyle);
    connections.push({ pathD, fromIdx: i });
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        gap: gap,
        padding: isVertical ? '0 0 0 0' : '0',
      }}
    >
      {/* SVG layer for connection lines */}
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        {connections.map((conn, i) => (
          <ConnectionLine
            key={i}
            pathD={conn.pathD}
            visible={visibleSteps.has(conn.fromIdx)}
            accentColor={accentColor}
            delay={conn.fromIdx * staggerDelay + STEP_FADE_DURATION * 0.5}
          />
        ))}
      </svg>

      {/* Step nodes */}
      {steps.map((step, i) => {
        const isActive = activeStepId ? step.id === activeStepId : false;
        const isVisible = visibleSteps.has(i);

        return (
          <div
            key={step.id}
            data-step-index={i}
            style={{
              position: 'relative',
              paddingLeft: isVertical ? NODE_SIZE + 16 : 0,
              paddingTop: isVertical ? 0 : NODE_SIZE + 16,
              minHeight: isVertical ? NODE_SIZE : undefined,
              minWidth: isVertical ? undefined : NODE_SIZE,
            }}
          >
            <StepNode
              step={step}
              index={i}
              isActive={isActive}
              isVisible={isVisible}
              delay={i * staggerDelay}
              accentColor={accentColor}
              layout={layout}
            />
          </div>
        );
      })}

      {/* Pulse keyframe */}
      <style>{`
        @keyframes step-pulse {
          0% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0; transform: scale(1.3); }
          100% { opacity: 0; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
