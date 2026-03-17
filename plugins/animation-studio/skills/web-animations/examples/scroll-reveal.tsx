"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";

// ---------------------------------------------------------------------------
// ScrollReveal
// ---------------------------------------------------------------------------
// A GSAP ScrollTrigger pinned section with a multi-step timeline. The section
// pins at the top of the viewport and scrubs through a sequence of content
// steps as the user scrolls.
//
// Each step fades in, holds, then fades out before the next step appears.
// A horizontal progress bar tracks overall completion.
//
// All GSAP imports are dynamic to enable code-splitting — GSAP core (~28 kb)
// and ScrollTrigger (~12 kb) are only loaded when this component mounts.
// ---------------------------------------------------------------------------

interface RevealStep {
  /** Unique key for the step. */
  id: string;
  /** Small label above the heading (e.g. "STEP 1"). */
  overline?: string;
  /** Main heading. */
  title: string;
  /** Body copy. */
  body: string;
}

interface ScrollRevealProps {
  /** Ordered list of content steps to scrub through. */
  steps: RevealStep[];
  /** Accent color for the progress bar and overline text. */
  accentColor?: string;
  /** Background color of the pinned section. */
  backgroundColor?: string;
  /** Text color for headings. */
  headingColor?: string;
  /** Text color for body copy. */
  bodyColor?: string;
  /**
   * Total scroll distance (in pixels) over which the pinned section scrubs.
   * More distance = slower scrub.  Default 3000.
   */
  scrollDistance?: number;
}

export function ScrollReveal({
  steps,
  accentColor = "#597794",
  backgroundColor = "#0A0A0A",
  headingColor = "#FFFFFF",
  bodyColor = "#A1A1AA",
  scrollDistance = 3000,
}: ScrollRevealProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const mm = gsap.matchMedia();

      // ---- Animated path (prefers motion) ----
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const stepCount = steps.length;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: `+=${scrollDistance}`,
            pin: true,
            scrub: 1, // 1 s smoothing — buttery but responsive
            snap: {
              // Snap to each step boundary. With N steps there are N-1 gaps,
              // so each snap increment is 1/(N-1).
              snapTo: 1 / Math.max(stepCount - 1, 1),
              duration: { min: 0.2, max: 0.5 },
              ease: "power2.inOut",
            },
          },
        });

        // Build the timeline: each step fades in → holds → fades out.
        // The hold duration (the `+=0.4` gap) controls how long a step is
        // visible at full opacity before transitioning.
        steps.forEach((step, i) => {
          const el = `[data-reveal-step="${step.id}"]`;

          if (i === 0) {
            // First step starts visible — animate it IN from below.
            tl.from(el, {
              opacity: 0,
              y: 50,
              duration: 0.4,
              ease: "power3.out",
            });
          }

          if (i < stepCount - 1) {
            // Hold briefly, then fade out.
            tl.to(el, {
              opacity: 0,
              y: -40,
              duration: 0.4,
              ease: "power3.in",
            }, `+=${0.4}`);

            // Fade in next step.
            const nextEl = `[data-reveal-step="${steps[i + 1].id}"]`;
            tl.from(nextEl, {
              opacity: 0,
              y: 50,
              duration: 0.4,
              ease: "power3.out",
            });
          }
        });

        // Progress bar: scrubs from scaleX 0 → 1 over the full timeline.
        tl.fromTo(
          "[data-reveal-progress]",
          { scaleX: 0 },
          { scaleX: 1, ease: "none", duration: tl.duration() },
          0, // Start at timeline time 0
        );

        // Step counter: update the visible step number.
        steps.forEach((step, i) => {
          if (i === 0) return;
          const progress = i / Math.max(stepCount - 1, 1);
          tl.call(
            () => {
              const counter = sectionRef.current?.querySelector(
                "[data-reveal-counter]",
              );
              if (counter) counter.textContent = String(i + 1);
            },
            [],
            progress * tl.duration(),
          );
        });
      });

      // ---- Reduced motion path ----
      mm.add("(prefers-reduced-motion: reduce)", () => {
        // Show all steps stacked vertically — no pinning, no scroll hijack.
        gsap.set("[data-reveal-step]", {
          opacity: 1,
          y: 0,
          position: "relative",
        });
        gsap.set("[data-reveal-progress]", { scaleX: 1 });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col"
      style={{ backgroundColor }}
    >
      {/* ---- Top bar: step counter + progress ---- */}
      <div className="absolute top-0 inset-x-0 z-10">
        {/* Progress track */}
        <div className="h-[3px] w-full" style={{ backgroundColor: `${accentColor}22` }}>
          <div
            data-reveal-progress
            className="h-full origin-left"
            style={{
              backgroundColor: accentColor,
              transform: "scaleX(0)",
            }}
          />
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 pt-4 text-xs tracking-widest uppercase">
          <span style={{ color: accentColor }}>
            Step <span data-reveal-counter>1</span> / {steps.length}
          </span>
        </div>
      </div>

      {/* ---- Content area ---- */}
      <div className="flex-1 flex items-center justify-center relative">
        {steps.map((step, i) => (
          <div
            key={step.id}
            data-reveal-step={step.id}
            className="absolute max-w-xl px-8 text-center"
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            {step.overline && (
              <span
                className="block text-xs tracking-[0.2em] uppercase mb-4"
                style={{ color: accentColor }}
              >
                {step.overline}
              </span>
            )}
            <h2
              className="text-3xl md:text-5xl font-bold mb-6 leading-tight"
              style={{ color: headingColor }}
            >
              {step.title}
            </h2>
            <p
              className="text-base md:text-lg leading-relaxed"
              style={{ color: bodyColor }}
            >
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
