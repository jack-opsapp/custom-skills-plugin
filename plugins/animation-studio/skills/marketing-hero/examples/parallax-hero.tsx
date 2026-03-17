"use client";

/**
 * ParallaxHero — Multi-layer scroll parallax hero with text reveals and a
 * device mockup layer.
 *
 * Uses Framer Motion useScroll + useTransform for scroll-linked transforms,
 * and useSpring for buttery smoothing. Each layer moves at a different rate
 * defined by its `depth` factor, creating natural depth perception.
 *
 * Supports prefers-reduced-motion: layers snap to their resting state and
 * text fades in without positional shift.
 *
 * @example
 * ```tsx
 * <ParallaxHero
 *   headline="Operations, simplified."
 *   subheadline="The all-in-one platform for field service teams."
 *   ctaLabel="Get Started"
 *   ctaHref="/signup"
 *   deviceImageSrc="/phone-mockup.png"
 *   backgroundImageSrc="/hero-bg.jpg"
 *   accentColor="#597794"
 * />
 * ```
 *
 * Dependencies: framer-motion
 */

import React, { useRef, useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
  MotionValue,
} from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParallaxHeroProps {
  /** Primary headline text. */
  headline: string;
  /** Supporting subheadline text. */
  subheadline?: string;
  /** CTA button label. */
  ctaLabel?: string;
  /** CTA link href. */
  ctaHref?: string;
  /** CTA click handler (alternative to href). */
  onCtaClick?: () => void;
  /** Device mockup image (phone/laptop). Rendered as a parallax layer. */
  deviceImageSrc?: string;
  /** Device mockup alt text. */
  deviceImageAlt?: string;
  /** Background image URL (deepest layer). */
  backgroundImageSrc?: string;
  /** Accent color for CTA button and highlights. Default "#597794". */
  accentColor?: string;
  /** Total scrollable height as a multiplier of viewport height. Default 2. */
  scrollDepth?: number;
  /** Container className. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Spring config — smooth but responsive
// ---------------------------------------------------------------------------

const SPRING_CONFIG = { stiffness: 80, damping: 30, mass: 0.5 };

// ---------------------------------------------------------------------------
// Layer component — handles depth-based transform + spring smoothing
// ---------------------------------------------------------------------------

function ParallaxLayer({
  children,
  scrollProgress,
  depth,
  opacityIn,
  opacityOut,
  className,
  style,
}: {
  children: React.ReactNode;
  scrollProgress: MotionValue<number>;
  /** 0 = static, 0.5 = half scroll speed, 1 = scroll speed, >1 = foreground */
  depth: number;
  /** Scroll progress range [start, end] where opacity transitions from 0 to 1. */
  opacityIn?: [number, number];
  /** Scroll progress range [start, end] where opacity transitions from 1 to 0. */
  opacityOut?: [number, number];
  className?: string;
  style?: React.CSSProperties;
}) {
  const rawY = useTransform(
    scrollProgress,
    [0, 1],
    ["0%", `${-depth * 40}%`]
  );
  const y = useSpring(rawY, SPRING_CONFIG);

  const opacityInVal = opacityIn
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useTransform(scrollProgress, opacityIn, [0, 1])
    : undefined;
  const opacityOutVal = opacityOut
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useTransform(scrollProgress, opacityOut, [1, 0])
    : undefined;

  // Combine opacities
  const combinedOpacity =
    opacityInVal && opacityOutVal
      ? // eslint-disable-next-line react-hooks/rules-of-hooks
        useTransform(
          [opacityInVal, opacityOutVal] as MotionValue<number>[],
          ([a, b]: number[]) => Math.min(a, b)
        )
      : opacityInVal ?? opacityOutVal ?? undefined;

  return (
    <motion.div
      className={`absolute inset-0 ${className ?? ""}`}
      style={{
        y,
        opacity: combinedOpacity,
        willChange: "transform",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Word-by-word text reveal linked to scroll
// ---------------------------------------------------------------------------

function ScrollTextReveal({
  text,
  scrollProgress,
  startAt,
  endAt,
  reducedMotion,
  className,
}: {
  text: string;
  scrollProgress: MotionValue<number>;
  /** Scroll progress (0-1) when first word starts appearing. */
  startAt: number;
  /** Scroll progress (0-1) when last word is fully visible. */
  endAt: number;
  reducedMotion: boolean;
  className?: string;
}) {
  const words = text.split(" ");
  const range = endAt - startAt;
  const step = range / words.length;

  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => {
        const wordStart = startAt + step * i;
        const wordEnd = wordStart + step;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const opacity = reducedMotion
          ? 1
          : // eslint-disable-next-line react-hooks/rules-of-hooks
            useTransform(scrollProgress, [wordStart, wordEnd], [0.15, 1]);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const y = reducedMotion
          ? 0
          : // eslint-disable-next-line react-hooks/rules-of-hooks
            useTransform(scrollProgress, [wordStart, wordEnd], [8, 0]);
        return (
          <motion.span
            key={i}
            style={{ opacity, y, display: "inline-block" }}
            className="mr-[0.3em]"
            aria-hidden="true"
          >
            {word}
          </motion.span>
        );
      })}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Device mockup parallax layer
// ---------------------------------------------------------------------------

function DeviceMockupLayer({
  src,
  alt,
  scrollProgress,
}: {
  src: string;
  alt: string;
  scrollProgress: MotionValue<number>;
}) {
  const y = useSpring(
    useTransform(scrollProgress, [0, 1], ["15%", "-25%"]),
    SPRING_CONFIG
  );
  const rotateX = useSpring(
    useTransform(scrollProgress, [0, 0.5, 1], [4, 0, -3]),
    SPRING_CONFIG
  );
  const scale = useSpring(
    useTransform(scrollProgress, [0, 0.5, 1], [0.92, 1, 0.96]),
    SPRING_CONFIG
  );

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{
        y,
        rotateX,
        scale,
        perspective: 1200,
        willChange: "transform",
        zIndex: 3,
      }}
    >
      <img
        src={src}
        alt={alt}
        className="max-h-[70vh] w-auto object-contain drop-shadow-2xl"
        loading="eager"
      />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export function ParallaxHero({
  headline,
  subheadline,
  ctaLabel,
  ctaHref,
  onCtaClick,
  deviceImageSrc,
  deviceImageAlt = "Product preview",
  backgroundImageSrc,
  accentColor = "#597794",
  scrollDepth = 2,
  className,
}: ParallaxHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Visibility gating
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // CTA opacity: fades in at 60-75% of scroll
  const ctaOpacity = reducedMotion
    ? 1
    : useTransform(scrollYProgress, [0.55, 0.7], [0, 1]);
  const ctaY = reducedMotion
    ? 0
    : useSpring(
        useTransform(scrollYProgress, [0.55, 0.7], [24, 0]),
        SPRING_CONFIG
      );

  return (
    <div
      ref={containerRef}
      className={`relative ${className ?? ""}`}
      style={{ height: `${scrollDepth * 100}vh` }}
    >
      {/* Sticky viewport — everything inside stays pinned while user scrolls the tall container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Layer 0 — Background image (deepest, slowest) */}
        {backgroundImageSrc && (
          <ParallaxLayer
            scrollProgress={scrollYProgress}
            depth={reducedMotion ? 0 : 0.15}
            className="z-0"
          >
            <img
              src={backgroundImageSrc}
              alt=""
              className="h-full w-full object-cover"
              aria-hidden="true"
              loading="eager"
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/50" />
          </ParallaxLayer>
        )}

        {/* Layer 1 — Ambient gradient (slow drift) */}
        {!backgroundImageSrc && (
          <ParallaxLayer
            scrollProgress={scrollYProgress}
            depth={reducedMotion ? 0 : 0.1}
            className="z-0"
          >
            <div
              className="h-full w-full"
              style={{
                background: `radial-gradient(ellipse at 30% 40%, ${accentColor}22 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, ${accentColor}15 0%, transparent 50%), #0A0A0A`,
              }}
            />
          </ParallaxLayer>
        )}

        {/* Layer 2 — Headline text (medium depth) */}
        <ParallaxLayer
          scrollProgress={scrollYProgress}
          depth={reducedMotion ? 0 : 0.4}
          opacityIn={[0, 0.08]}
          opacityOut={[0.35, 0.5]}
          className="z-10 flex flex-col items-center justify-center px-6"
        >
          <h1 className="text-center text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
            <ScrollTextReveal
              text={headline}
              scrollProgress={scrollYProgress}
              startAt={0}
              endAt={0.2}
              reducedMotion={reducedMotion}
            />
          </h1>
          {subheadline && (
            <p className="mt-6 max-w-xl text-center text-lg text-white/70 sm:text-xl">
              <ScrollTextReveal
                text={subheadline}
                scrollProgress={scrollYProgress}
                startAt={0.1}
                endAt={0.25}
                reducedMotion={reducedMotion}
              />
            </p>
          )}
        </ParallaxLayer>

        {/* Layer 3 — Device mockup (foreground, faster) */}
        {deviceImageSrc && !reducedMotion && (
          <DeviceMockupLayer
            src={deviceImageSrc}
            alt={deviceImageAlt}
            scrollProgress={scrollYProgress}
          />
        )}
        {deviceImageSrc && reducedMotion && (
          <div className="absolute inset-0 z-[3] flex items-center justify-center pointer-events-none">
            <img
              src={deviceImageSrc}
              alt={deviceImageAlt}
              className="max-h-[70vh] w-auto object-contain drop-shadow-2xl"
            />
          </div>
        )}

        {/* Layer 4 — CTA (appears last) */}
        {ctaLabel && (
          <motion.div
            className="absolute bottom-[15%] left-0 right-0 z-20 flex justify-center"
            style={{ opacity: ctaOpacity, y: ctaY }}
          >
            {ctaHref ? (
              <a
                href={ctaHref}
                className="inline-flex items-center gap-2 rounded-lg px-8 py-4 text-base font-semibold text-white transition-colors hover:brightness-110"
                style={{ backgroundColor: accentColor }}
              >
                {ctaLabel}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="ml-1"
                >
                  <path
                    d="M3 8h10m0 0L9 4m4 4L9 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            ) : (
              <button
                onClick={onCtaClick}
                className="inline-flex items-center gap-2 rounded-lg px-8 py-4 text-base font-semibold text-white transition-colors hover:brightness-110"
                style={{ backgroundColor: accentColor }}
              >
                {ctaLabel}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="ml-1"
                >
                  <path
                    d="M3 8h10m0 0L9 4m4 4L9 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </motion.div>
        )}

        {/* Scroll indicator — fades out as user starts scrolling */}
        <motion.div
          className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
          style={{
            opacity: reducedMotion
              ? 0.6
              : useTransform(scrollYProgress, [0, 0.08], [0.6, 0]),
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-widest text-white/50">
              Scroll
            </span>
            <motion.div
              className="h-8 w-[1px] bg-white/30"
              animate={
                reducedMotion
                  ? {}
                  : { scaleY: [0.5, 1, 0.5], opacity: [0.3, 0.6, 0.3] }
              }
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ParallaxHero;
