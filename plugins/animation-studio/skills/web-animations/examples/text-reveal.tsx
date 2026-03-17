"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "motion/react";

// ---------------------------------------------------------------------------
// TextReveal
// ---------------------------------------------------------------------------
// Character-level text animation with multiple modes:
//
//   - "typewriter"  — Characters appear one at a time with a blinking cursor.
//   - "stagger-in"  — All characters animate from hidden to visible with a
//                     stagger delay between each.
//   - "wave"        — Characters oscillate vertically in a sine wave that
//                     propagates along the text.
//   - "scramble"    — Characters rapidly cycle through random glyphs before
//                     resolving to the correct character. Inspired by airport
//                     departure boards.
//
// Trigger modes:
//   - "mount"        — Plays immediately on component mount.
//   - "intersection" — Plays when the element enters the viewport (IO).
//   - "manual"       — Plays when `play` prop is set to `true`.
//
// All modes respect `prefers-reduced-motion`: text appears instantly with a
// simple opacity fade.
// ---------------------------------------------------------------------------

type AnimationMode = "typewriter" | "stagger-in" | "wave" | "scramble";
type TriggerMode = "mount" | "intersection" | "manual";

interface TextRevealProps {
  /** The text string to animate. */
  text: string;
  /** Animation mode. */
  mode?: AnimationMode;
  /** When to trigger the animation. */
  trigger?: TriggerMode;
  /** For `trigger: "manual"` — set to true to play. */
  play?: boolean;
  /** Per-character stagger delay in seconds (stagger-in, typewriter). */
  staggerDelay?: number;
  /** Total animation speed multiplier. 1 = default, 2 = twice as fast. */
  speed?: number;
  /** Accent color for the cursor (typewriter) or highlight. */
  accentColor?: string;
  /** Text color. */
  color?: string;
  /** Font family. */
  fontFamily?: string;
  /** CSS class on the wrapper element. */
  className?: string;
  /** HTML tag for the wrapper. Default "span". */
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "div";
  /** Callback when the animation completes. */
  onComplete?: () => void;
}

export function TextReveal({
  text,
  mode = "stagger-in",
  trigger = "mount",
  play = false,
  staggerDelay = 0.03,
  speed = 1,
  accentColor = "#597794",
  color,
  fontFamily,
  className = "",
  as: Tag = "span",
  onComplete,
}: TextRevealProps) {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [isActive, setIsActive] = useState(trigger === "mount");

  // Characters split — preserves spaces as non-breaking for correct layout.
  const characters = useMemo(() => text.split(""), [text]);

  // ---- Trigger logic ----

  // Intersection Observer trigger.
  useEffect(() => {
    if (trigger !== "intersection") return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [trigger]);

  // Manual trigger.
  useEffect(() => {
    if (trigger === "manual" && play) {
      setIsActive(true);
    }
  }, [trigger, play]);

  // ---- Reduced motion ----

  if (prefersReduced) {
    return (
      <Tag
        ref={ref as React.RefObject<HTMLElement & HTMLSpanElement & HTMLParagraphElement & HTMLHeadingElement & HTMLDivElement>}
        className={className}
        style={{ color, fontFamily }}
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {text}
        </motion.span>
      </Tag>
    );
  }

  // ---- Animated modes ----

  return (
    <Tag
      ref={ref as React.RefObject<HTMLElement & HTMLSpanElement & HTMLParagraphElement & HTMLHeadingElement & HTMLDivElement>}
      className={className}
      style={{ color, fontFamily, display: "inline-block" }}
      aria-label={text}
    >
      {mode === "typewriter" && (
        <TypewriterMode
          characters={characters}
          isActive={isActive}
          staggerDelay={staggerDelay / speed}
          accentColor={accentColor}
          onComplete={onComplete}
        />
      )}

      {mode === "stagger-in" && (
        <StaggerInMode
          characters={characters}
          isActive={isActive}
          staggerDelay={staggerDelay / speed}
          onComplete={onComplete}
        />
      )}

      {mode === "wave" && (
        <WaveMode
          characters={characters}
          isActive={isActive}
          speed={speed}
        />
      )}

      {mode === "scramble" && (
        <ScrambleMode
          characters={characters}
          isActive={isActive}
          speed={speed}
          accentColor={accentColor}
          onComplete={onComplete}
        />
      )}
    </Tag>
  );
}

// ---- Typewriter Mode ----

function TypewriterMode({
  characters,
  isActive,
  staggerDelay,
  accentColor,
  onComplete,
}: {
  characters: string[];
  isActive: boolean;
  staggerDelay: number;
  accentColor: string;
  onComplete?: () => void;
}) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= characters.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, staggerDelay * 1000);

    return () => clearInterval(interval);
  }, [isActive, characters.length, staggerDelay, onComplete]);

  return (
    <span aria-hidden="true">
      {characters.map((char, i) => (
        <span
          key={i}
          style={{
            visibility: i < visibleCount ? "visible" : "hidden",
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
      {/* Blinking cursor */}
      {isActive && visibleCount < characters.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
          style={{
            display: "inline-block",
            width: "2px",
            height: "1em",
            backgroundColor: accentColor,
            marginLeft: "1px",
            verticalAlign: "text-bottom",
          }}
        />
      )}
    </span>
  );
}

// ---- Stagger-In Mode ----

function StaggerInMode({
  characters,
  isActive,
  staggerDelay,
  onComplete,
}: {
  characters: string[];
  isActive: boolean;
  staggerDelay: number;
  onComplete?: () => void;
}) {
  const totalDuration = staggerDelay * characters.length + 0.35;

  useEffect(() => {
    if (!isActive || !onComplete) return;
    const timer = setTimeout(onComplete, totalDuration * 1000);
    return () => clearTimeout(timer);
  }, [isActive, totalDuration, onComplete]);

  return (
    <span aria-hidden="true">
      {characters.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={
            isActive
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 12 }
          }
          transition={{
            duration: 0.35,
            delay: i * staggerDelay,
            ease: [0.16, 1, 0.3, 1], // expo-out
          }}
          style={{ display: "inline-block" }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

// ---- Wave Mode ----

function WaveMode({
  characters,
  isActive,
  speed,
}: {
  characters: string[];
  isActive: boolean;
  speed: number;
}) {
  // Wave is a continuous animation, not a one-shot. Each character bobs
  // vertically in a sine wave propagating left to right.
  //
  // y(i, t) = amplitude * sin(2π * frequency * t - i * phaseOffset)
  //
  // amplitude: 6px — subtle but visible.
  // frequency: 1.5 Hz — gentle oscillation.
  // phaseOffset: 0.3 rad per character — the wave "travels" along the text.

  return (
    <span aria-hidden="true">
      {characters.map((char, i) => (
        <motion.span
          key={i}
          animate={
            isActive
              ? {
                  y: [0, -6, 0, 6, 0],
                  transition: {
                    duration: 1.5 / speed,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.06 / speed,
                  },
                }
              : { y: 0 }
          }
          style={{ display: "inline-block" }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

// ---- Scramble Mode ----

// Glyphs to cycle through during the scramble effect.
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";

function ScrambleMode({
  characters,
  isActive,
  speed,
  accentColor,
  onComplete,
}: {
  characters: string[];
  isActive: boolean;
  speed: number;
  accentColor: string;
  onComplete?: () => void;
}) {
  const [display, setDisplay] = useState<string[]>(characters.map(() => " "));
  const [resolved, setResolved] = useState<boolean[]>(characters.map(() => false));

  useEffect(() => {
    if (!isActive) return;

    // Each character resolves after a staggered delay.
    // During the scramble phase, it cycles through random glyphs every 40ms.
    const resolveDelay = 60 / speed; // ms between each character resolving
    const scrambleInterval = 40 / speed; // ms between glyph changes

    let frame: number;
    let startTime: number | null = null;

    function tick(now: number) {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;

      const newDisplay = [...characters];
      const newResolved = characters.map(() => false);
      let allResolved = true;

      for (let i = 0; i < characters.length; i++) {
        const charResolveTime = i * resolveDelay;

        if (characters[i] === " ") {
          // Spaces resolve instantly.
          newDisplay[i] = "\u00A0";
          newResolved[i] = true;
          continue;
        }

        if (elapsed >= charResolveTime) {
          // This character has resolved — show the real character.
          newDisplay[i] = characters[i];
          newResolved[i] = true;
        } else {
          // Still scrambling — pick a random glyph.
          allResolved = false;
          const randomIndex = Math.floor(
            Math.random() * SCRAMBLE_CHARS.length,
          );
          newDisplay[i] = SCRAMBLE_CHARS[randomIndex];
          newResolved[i] = false;
        }
      }

      setDisplay(newDisplay);
      setResolved(newResolved);

      if (allResolved) {
        onComplete?.();
        return;
      }

      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [isActive, characters, speed, onComplete]);

  return (
    <span aria-hidden="true">
      {display.map((char, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            color: resolved[i] ? undefined : accentColor,
            transition: "color 0.15s ease",
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}
