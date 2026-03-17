/**
 * AppDemoMockup — 3D device mockup with CSS perspective transforms
 *
 * A phone frame that tilts toward the mouse cursor using CSS 3D transforms.
 * Animated screen content cycles through frames at timed intervals.
 * Touch point indicators appear at hotspot locations with a pulse animation.
 *
 * Dependencies: React only (no animation libraries).
 */

'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TouchPoint {
  /** Percentage from left (0-100) */
  x: number;
  /** Percentage from top (0-100) */
  y: number;
  /** Delay in ms before this point appears */
  delayMs: number;
  /** Optional label shown near the indicator */
  label?: string;
}

interface ScreenFrame {
  /** React node to render as screen content */
  content: React.ReactNode;
  /** Duration in ms to show this frame */
  durationMs: number;
  /** Touch points that appear during this frame */
  touchPoints?: TouchPoint[];
}

interface AppDemoMockupProps {
  /** Sequence of screen frames to display */
  frames: ScreenFrame[];
  /** Whether to loop the sequence (default: true) */
  loop?: boolean;
  /** Device width in px (default: 320) */
  deviceWidth?: number;
  /** Maximum rotation in degrees (default: 12) */
  maxRotation?: number;
  /** Resting rotation when mouse is not over the component */
  restRotation?: { x: number; y: number };
  /** Optional class name for the outer container */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DEVICE_ASPECT = 19.5 / 9;
const CORNER_RADIUS = 44;
const PERSPECTIVE = 1200;
const MOUSE_FOLLOW_EASE = 0.12;
const RESET_EASE = 0.06;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AppDemoMockup({
  frames,
  loop = true,
  deviceWidth = 320,
  maxRotation = 12,
  restRotation = { x: 5, y: -5 },
  className,
}: AppDemoMockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, inside: false });
  const rotationRef = useRef({ x: restRotation.x, y: restRotation.y });
  const [currentFrame, setCurrentFrame] = useState(0);
  const [activeTouchPoints, setActiveTouchPoints] = useState<TouchPoint[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const frameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const deviceHeight = deviceWidth * DEVICE_ASPECT;

  /* ---- Clear all timers ---- */

  const clearTimers = useCallback(() => {
    if (frameTimerRef.current) clearTimeout(frameTimerRef.current);
    for (const t of touchTimersRef.current) clearTimeout(t);
    touchTimersRef.current = [];
  }, []);

  /* ---- Schedule touch points for a frame ---- */

  const scheduleTouchPoints = useCallback((frame: ScreenFrame) => {
    setActiveTouchPoints([]);
    if (!frame.touchPoints) return;

    for (const tp of frame.touchPoints) {
      const timer = setTimeout(() => {
        setActiveTouchPoints(prev => [...prev, tp]);
      }, tp.delayMs);
      touchTimersRef.current.push(timer);
    }
  }, []);

  /* ---- Advance to next frame ---- */

  const advanceFrame = useCallback(() => {
    setCurrentFrame(prev => {
      const next = prev + 1;
      if (next >= frames.length) {
        return loop ? 0 : prev;
      }
      return next;
    });
  }, [frames.length, loop]);

  /* ---- Frame sequencing ---- */

  useEffect(() => {
    if (frames.length === 0) return;

    const frame = frames[currentFrame];
    if (!frame) return;

    // Transition in
    setIsTransitioning(true);
    const transitionTimer = setTimeout(() => setIsTransitioning(false), 50);

    // Schedule touch points
    scheduleTouchPoints(frame);

    // Schedule advance to next frame
    frameTimerRef.current = setTimeout(() => {
      advanceFrame();
    }, frame.durationMs);

    return () => {
      clearTimeout(transitionTimer);
      clearTimers();
    };
  }, [currentFrame, frames, scheduleTouchPoints, advanceFrame, clearTimers]);

  /* ---- Mouse tracking + 3D tilt animation ---- */

  useEffect(() => {
    const container = containerRef.current;
    const device = deviceRef.current;
    if (!container || !device) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseRef.current = {
        x: ((e.clientX - centerX) / (rect.width / 2)) * maxRotation,
        y: -((e.clientY - centerY) / (rect.height / 2)) * maxRotation,
        inside: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.inside = false;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    function animate() {
      const mouse = mouseRef.current;
      const rot = rotationRef.current;

      if (mouse.inside) {
        rot.y += (mouse.x - rot.y) * MOUSE_FOLLOW_EASE;
        rot.x += (mouse.y - rot.x) * MOUSE_FOLLOW_EASE;
      } else {
        rot.y += (restRotation.y - rot.y) * RESET_EASE;
        rot.x += (restRotation.x - rot.x) * RESET_EASE;
      }

      device.style.transform = `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`;
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxRotation, restRotation]);

  /* ---- Cleanup on unmount ---- */

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        perspective: `${PERSPECTIVE}px`,
        perspectiveOrigin: '50% 50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Device frame */}
      <div
        ref={deviceRef}
        style={{
          width: deviceWidth,
          height: deviceHeight,
          borderRadius: CORNER_RADIUS,
          border: '3px solid rgba(255, 255, 255, 0.12)',
          background: '#0A0A0A',
          overflow: 'hidden',
          position: 'relative',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          boxShadow: [
            '0 0 0 1px rgba(255,255,255,0.05)',
            '0 25px 50px rgba(0,0,0,0.5)',
            'inset 0 0 0 1px rgba(255,255,255,0.03)',
          ].join(', '),
        }}
      >
        {/* Dynamic island */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 100,
            height: 28,
            borderRadius: 14,
            background: '#000',
            zIndex: 10,
          }}
        />

        {/* Screen content area */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            borderRadius: CORNER_RADIUS - 3,
          }}
        >
          {/* Current frame content */}
          {frames.map((frame, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: idx === currentFrame ? 1 : 0,
                transform: idx === currentFrame
                  ? 'translateY(0)'
                  : 'translateY(20px)',
                transition: 'opacity 0.35s cubic-bezier(0.32, 0.72, 0, 1), transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
                pointerEvents: idx === currentFrame ? 'auto' : 'none',
              }}
            >
              {frame.content}
            </div>
          ))}

          {/* Touch point indicators */}
          {activeTouchPoints.map((tp, idx) => (
            <div
              key={`tp-${currentFrame}-${idx}`}
              style={{
                position: 'absolute',
                left: `${tp.x}%`,
                top: `${tp.y}%`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 20,
              }}
            >
              {/* Pulse ring */}
              <div
                style={{
                  position: 'absolute',
                  width: 40,
                  height: 40,
                  left: -20,
                  top: -20,
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  animation: 'tp-pulse 1.2s ease-out infinite',
                }}
              />
              {/* Center dot */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.7)',
                  position: 'absolute',
                  left: -4,
                  top: -4,
                  boxShadow: '0 0 12px rgba(255, 255, 255, 0.3)',
                }}
              />
              {/* Label */}
              {tp.label && (
                <div
                  style={{
                    position: 'absolute',
                    top: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    fontSize: 11,
                    fontFamily: '"Kosugi", sans-serif',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    animation: 'tp-label-in 0.3s ease-out forwards',
                    opacity: 0,
                  }}
                >
                  {tp.label}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Frame indicator dots */}
        {frames.length > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 6,
              zIndex: 10,
            }}
          >
            {frames.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: idx === currentFrame
                    ? 'rgba(255, 255, 255, 0.8)'
                    : 'rgba(255, 255, 255, 0.2)',
                  transition: 'background 0.3s ease',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Keyframe animations (injected once) */}
      <style>{`
        @keyframes tp-pulse {
          0% { transform: scale(0); opacity: 0.8; }
          60% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes tp-label-in {
          0% { opacity: 0; transform: translateX(-50%) translateY(4px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
