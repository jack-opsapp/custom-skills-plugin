/**
 * SwipeTutorialStep — Tutorial overlay with spotlight, gesture indicator, and tooltip
 *
 * Renders a fullscreen overlay with:
 * - A spotlight cutout via CSS clip-path that isolates the target element
 * - A pulsing gesture indicator (configurable: tap, swipe-up, swipe-left)
 * - A smart-positioned tooltip with edge avoidance
 * - Framer Motion transitions for enter/exit choreography
 *
 * Dependencies: React, Framer Motion.
 */

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type GestureType = 'tap' | 'swipe-up' | 'swipe-left' | 'swipe-right';
type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface SwipeTutorialStepProps {
  /** CSS selector or ref for the target element to spotlight */
  targetSelector?: string;
  /** Direct rect override (useful when target is in a Canvas or not a DOM element) */
  targetRect?: { x: number; y: number; width: number; height: number };
  /** Title text for the tooltip */
  title: string;
  /** Description text for the tooltip */
  description: string;
  /** Gesture indicator type */
  gesture?: GestureType;
  /** Preferred tooltip placement (will auto-adjust if it doesn't fit) */
  preferredPlacement?: TooltipPlacement;
  /** Padding around the spotlight cutout in px */
  spotlightPadding?: number;
  /** Corner radius of the spotlight cutout */
  spotlightRadius?: number;
  /** Overlay darkness (0-1) */
  overlayOpacity?: number;
  /** Step indicator (e.g. "3 of 6") */
  stepLabel?: string;
  /** Called when the user completes the step action */
  onComplete?: () => void;
  /** Called when the user clicks skip */
  onSkip?: () => void;
  /** Whether this step is visible */
  visible?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TOOLTIP_MAX_WIDTH = 280;
const TOOLTIP_GAP = 14;
const VIEWPORT_PADDING = 12;
const TRANSITION_DURATION = 0.35;

/* ------------------------------------------------------------------ */
/*  Tooltip position computation                                       */
/* ------------------------------------------------------------------ */

function computeTooltipPosition(
  targetRect: { x: number; y: number; width: number; height: number },
  tooltipWidth: number,
  tooltipHeight: number,
  preferred: TooltipPlacement,
): { x: number; y: number; placement: TooltipPlacement; arrowOffset: number } {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

  const placements: TooltipPlacement[] = [
    preferred,
    ...(['bottom', 'top', 'right', 'left'] as TooltipPlacement[]).filter(p => p !== preferred),
  ];

  for (const placement of placements) {
    let x: number;
    let y: number;

    switch (placement) {
      case 'top':
        x = targetRect.x + targetRect.width / 2 - tooltipWidth / 2;
        y = targetRect.y - tooltipHeight - TOOLTIP_GAP;
        break;
      case 'bottom':
        x = targetRect.x + targetRect.width / 2 - tooltipWidth / 2;
        y = targetRect.y + targetRect.height + TOOLTIP_GAP;
        break;
      case 'left':
        x = targetRect.x - tooltipWidth - TOOLTIP_GAP;
        y = targetRect.y + targetRect.height / 2 - tooltipHeight / 2;
        break;
      case 'right':
        x = targetRect.x + targetRect.width + TOOLTIP_GAP;
        y = targetRect.y + targetRect.height / 2 - tooltipHeight / 2;
        break;
    }

    // Clamp to viewport
    x = Math.max(VIEWPORT_PADDING, Math.min(vw - tooltipWidth - VIEWPORT_PADDING, x));
    y = Math.max(VIEWPORT_PADDING, Math.min(vh - tooltipHeight - VIEWPORT_PADDING, y));

    // Check overlap with target
    const tR = { left: x, top: y, right: x + tooltipWidth, bottom: y + tooltipHeight };
    const sR = {
      left: targetRect.x,
      top: targetRect.y,
      right: targetRect.x + targetRect.width,
      bottom: targetRect.y + targetRect.height,
    };
    const overlaps =
      tR.left < sR.right && tR.right > sR.left &&
      tR.top < sR.bottom && tR.bottom > sR.top;

    if (!overlaps) {
      const arrowOffset = (targetRect.x + targetRect.width / 2) - (x + tooltipWidth / 2);
      return { x, y, placement, arrowOffset };
    }
  }

  // Fallback
  return {
    x: Math.max(VIEWPORT_PADDING, targetRect.x + targetRect.width / 2 - tooltipWidth / 2),
    y: targetRect.y + targetRect.height + TOOLTIP_GAP,
    placement: 'bottom',
    arrowOffset: 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Clip-path builder                                                  */
/* ------------------------------------------------------------------ */

function buildSpotlightClipPath(
  rect: { x: number; y: number; width: number; height: number },
  padding: number,
  radius: number,
): string {
  const x = rect.x - padding;
  const y = rect.y - padding;
  const w = rect.width + padding * 2;
  const h = rect.height + padding * 2;
  const r = Math.min(radius, w / 2, h / 2);

  // SVG-style inset with rounded corners approximated by polygon points
  // Outer rect: full viewport
  // Inner rect: cutout (counter-clockwise)
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;

  // We use an SVG-based approach embedded in a data URI for clip-path
  // This gives us true rounded corners on the cutout
  return `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${vw}' height='${vh}'>` +
    `<defs><clipPath id='c'>` +
    `<path fill-rule='evenodd' d='M0,0 L${vw},0 L${vw},${vh} L0,${vh} Z ` +
    `M${x + r},${y} ` +
    `L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} ` +
    `L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} ` +
    `L${x + r},${y + h} Q${x},${y + h} ${x},${y + h - r} ` +
    `L${x},${y + r} Q${x},${y} ${x + r},${y} Z'/>` +
    `</clipPath></defs></svg>`
  )}#c")`;
}

/* ------------------------------------------------------------------ */
/*  Gesture Indicator components                                       */
/* ------------------------------------------------------------------ */

function TapIndicator({ cx, cy }: { cx: number; cy: number }) {
  return (
    <div
      style={{ position: 'fixed', left: cx, top: cy, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 10002 }}
    >
      {/* Outer pulse */}
      <motion.div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 255, 0.35)',
          position: 'absolute',
          left: -22,
          top: -22,
        }}
        animate={{
          scale: [0.8, 1.3, 0.8],
          opacity: [0.5, 0.15, 0.5],
        }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Center dot */}
      <motion.div
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.6)',
          position: 'absolute',
          left: -5,
          top: -5,
          boxShadow: '0 0 16px rgba(255, 255, 255, 0.2)',
        }}
        animate={{
          scale: [1, 0.85, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

function SwipeIndicator({ cx, cy, direction }: { cx: number; cy: number; direction: 'up' | 'left' | 'right' }) {
  const endOffset = direction === 'up' ? { x: 0, y: -60 } : direction === 'left' ? { x: -60, y: 0 } : { x: 60, y: 0 };
  const arrowRotation = direction === 'up' ? -90 : direction === 'left' ? 180 : 0;

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: cx,
        top: cy,
        pointerEvents: 'none',
        zIndex: 10002,
      }}
    >
      <motion.svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{
          transform: `translate(-50%, -50%) rotate(${arrowRotation}deg)`,
        }}
        animate={{
          x: [0, endOffset.x, 0],
          y: [0, endOffset.y, 0],
          opacity: [0, 0.7, 0.7, 0],
        }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.1, 0.7, 1],
          repeatDelay: 0.5,
        }}
      >
        <path
          d="M5 12h14M13 5l7 7-7 7"
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function SwipeTutorialStep({
  targetSelector,
  targetRect: targetRectProp,
  title,
  description,
  gesture = 'tap',
  preferredPlacement = 'bottom',
  spotlightPadding = 12,
  spotlightRadius = 12,
  overlayOpacity = 0.75,
  stepLabel,
  onComplete,
  onSkip,
  visible = true,
}: SwipeTutorialStepProps) {
  const [targetRect, setTargetRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: TOOLTIP_MAX_WIDTH, height: 120 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  /* ---- Resolve target rect ---- */

  useEffect(() => {
    if (targetRectProp) {
      setTargetRect(targetRectProp);
      return;
    }

    if (!targetSelector) return;

    const el = document.querySelector(targetSelector);
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setTargetRect({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    resizeObserverRef.current = observer;

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [targetSelector, targetRectProp]);

  /* ---- Measure tooltip for positioning ---- */

  useEffect(() => {
    if (!tooltipRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setTooltipSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(tooltipRef.current);
    return () => observer.disconnect();
  }, []);

  if (!targetRect) return null;

  const clipPath = buildSpotlightClipPath(targetRect, spotlightPadding, spotlightRadius);
  const tooltipPos = computeTooltipPosition(targetRect, tooltipSize.width, tooltipSize.height, preferredPlacement);

  const gestureCx = targetRect.x + targetRect.width / 2;
  const gestureCy = targetRect.y + targetRect.height / 2;

  // Tooltip entrance direction based on placement
  const tooltipInitial = {
    top: { y: 10, opacity: 0 },
    bottom: { y: -10, opacity: 0 },
    left: { x: 10, opacity: 0 },
    right: { x: -10, opacity: 0 },
  }[tooltipPos.placement];

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Overlay with spotlight cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: TRANSITION_DURATION }}
            style={{
              position: 'fixed',
              inset: 0,
              background: `rgba(0, 0, 0, ${overlayOpacity})`,
              clipPath,
              zIndex: 10000,
              pointerEvents: 'auto',
            }}
            onClick={onComplete}
          />

          {/* Spotlight border glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: TRANSITION_DURATION, delay: 0.1 }}
            style={{
              position: 'fixed',
              left: targetRect.x - spotlightPadding,
              top: targetRect.y - spotlightPadding,
              width: targetRect.width + spotlightPadding * 2,
              height: targetRect.height + spotlightPadding * 2,
              borderRadius: spotlightRadius,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 0 30px rgba(255, 255, 255, 0.05)',
              pointerEvents: 'none',
              zIndex: 10001,
            }}
          />

          {/* Gesture indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: TRANSITION_DURATION + 0.15 }}
          >
            {gesture === 'tap' && <TapIndicator cx={gestureCx} cy={gestureCy} />}
            {gesture === 'swipe-up' && <SwipeIndicator cx={gestureCx} cy={gestureCy} direction="up" />}
            {gesture === 'swipe-left' && <SwipeIndicator cx={gestureCx} cy={gestureCy} direction="left" />}
            {gesture === 'swipe-right' && <SwipeIndicator cx={gestureCx} cy={gestureCy} direction="right" />}
          </motion.div>

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={tooltipInitial}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{
              duration: TRANSITION_DURATION,
              delay: 0.08,
              ease: [0.32, 0.72, 0, 1],
            }}
            style={{
              position: 'fixed',
              left: tooltipPos.x,
              top: tooltipPos.y,
              maxWidth: TOOLTIP_MAX_WIDTH,
              background: 'rgba(20, 20, 20, 0.95)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: '16px 20px',
              color: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
              zIndex: 10003,
              pointerEvents: 'auto',
            }}
          >
            {/* Step label */}
            {stepLabel && (
              <div
                style={{
                  fontSize: 10,
                  fontFamily: '"Kosugi", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginBottom: 8,
                }}
              >
                {stepLabel}
              </div>
            )}

            {/* Title */}
            <div
              style={{
                fontSize: 15,
                fontFamily: '"Mohave", sans-serif',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'rgba(255, 255, 255, 0.95)',
                marginBottom: 6,
              }}
            >
              {title}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: 13,
                fontFamily: '"Kosugi", sans-serif',
                lineHeight: 1.55,
                color: 'rgba(255, 255, 255, 0.65)',
              }}
            >
              {description}
            </div>

            {/* Skip button */}
            {onSkip && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSkip();
                }}
                style={{
                  marginTop: 12,
                  fontSize: 10,
                  fontFamily: '"Kosugi", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: 'rgba(255, 255, 255, 0.35)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                Skip tutorial
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
