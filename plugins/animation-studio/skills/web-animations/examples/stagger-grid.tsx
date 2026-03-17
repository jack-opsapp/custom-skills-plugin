"use client";

import { useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

// ---------------------------------------------------------------------------
// StaggerGrid
// ---------------------------------------------------------------------------
// A grid with orchestrated stagger entry animation. Each cell animates in
// with a configurable stagger delay computed from its grid position.
//
// Stagger directions:
//   - "top-left"   — items animate left-to-right, top-to-bottom (reading order).
//   - "center-out" — items closest to the grid center animate first; outer items last.
//   - "random"     — each item gets a random delay within [0, totalDuration].
//   - "diagonal"   — items along the same top-left → bottom-right diagonal animate together.
//
// Math notes (center-out):
//   Distance from grid center = √((col - centerCol)² + (row - centerRow)²)
//   Normalised to [0, 1] by dividing by the maximum distance (a corner cell).
//   Delay = normalisedDistance × totalStaggerDuration.
// ---------------------------------------------------------------------------

type StaggerDirection = "top-left" | "center-out" | "random" | "diagonal";

type EntryAnimation = "fade-up" | "fade-scale" | "flip" | "blur-in";

interface StaggerGridProps {
  /** Number of columns. */
  columns: number;
  /** Items to render in the grid. */
  items: {
    id: string;
    content: React.ReactNode;
  }[];
  /** Stagger direction pattern. */
  direction?: StaggerDirection;
  /** Entry animation type for each cell. */
  entryAnimation?: EntryAnimation;
  /** Total time (seconds) over which stagger delays are spread. */
  staggerDuration?: number;
  /** Per-item animation duration in seconds. */
  itemDuration?: number;
  /** Gap between grid cells (CSS gap value). */
  gap?: string;
  /** Accent color passed through to cell styles. */
  accentColor?: string;
  /** Background color for cells. */
  cellBackground?: string;
  /** Border radius for cells. */
  cellRadius?: string;
  /** CSS class on the outer grid. */
  className?: string;
}

export function StaggerGrid({
  columns,
  items,
  direction = "top-left",
  entryAnimation = "fade-up",
  staggerDuration = 0.6,
  itemDuration = 0.45,
  gap = "12px",
  accentColor = "#597794",
  cellBackground = "#111111",
  cellRadius = "12px",
  className = "",
}: StaggerGridProps) {
  const prefersReduced = useReducedMotion();

  // Pre-compute the delay for each item index based on direction.
  const delays = useMemo(() => {
    const total = items.length;
    const rows = Math.ceil(total / columns);

    return items.map((_, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;

      switch (direction) {
        case "top-left": {
          // Reading order: delay = (row * columns + col) / total * duration
          const linearIndex = row * columns + col;
          return (linearIndex / Math.max(total - 1, 1)) * staggerDuration;
        }

        case "center-out": {
          // Distance from grid center, normalised.
          const centerRow = (rows - 1) / 2;
          const centerCol = (columns - 1) / 2;
          const dx = col - centerCol;
          const dy = row - centerRow;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Max distance is from center to a corner.
          const maxDist = Math.sqrt(
            centerCol * centerCol + centerRow * centerRow,
          );
          const norm = maxDist > 0 ? dist / maxDist : 0;
          return norm * staggerDuration;
        }

        case "diagonal": {
          // Items on the same NW→SE diagonal (row + col = constant) animate
          // together. Normalise by the max diagonal index (rows + columns - 2).
          const diagIndex = row + col;
          const maxDiag = rows + columns - 2;
          return (diagIndex / Math.max(maxDiag, 1)) * staggerDuration;
        }

        case "random": {
          // Seeded-ish random: deterministic per index to avoid layout shift
          // on re-render. Uses a simple hash of the index.
          const hash = ((index * 2654435761) >>> 0) / 4294967296; // Knuth multiplicative hash
          return hash * staggerDuration;
        }

        default:
          return 0;
      }
    });
  }, [items.length, columns, direction, staggerDuration]);

  // Entry animation variants per type.
  const entryVariants = useMemo(() => {
    switch (entryAnimation) {
      case "fade-up":
        return {
          hidden: { opacity: 0, y: 24 },
          visible: { opacity: 1, y: 0 },
        };
      case "fade-scale":
        return {
          hidden: { opacity: 0, scale: 0.85 },
          visible: { opacity: 1, scale: 1 },
        };
      case "flip":
        return {
          hidden: { opacity: 0, rotateX: -60, transformPerspective: 800 },
          visible: { opacity: 1, rotateX: 0, transformPerspective: 800 },
        };
      case "blur-in":
        return {
          hidden: { opacity: 0, filter: "blur(8px)" },
          visible: { opacity: 1, filter: "blur(0px)" },
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        };
    }
  }, [entryAnimation]);

  // Reduced variants: opacity-only, no spatial transform.
  const reducedVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
      }}
    >
      <AnimatePresence>
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            variants={prefersReduced ? reducedVariants : entryVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{
              duration: prefersReduced ? 0.12 : itemDuration,
              delay: prefersReduced ? 0 : delays[i],
              ease: [0.16, 1, 0.3, 1], // expo-out
            }}
            style={{
              backgroundColor: cellBackground,
              borderRadius: cellRadius,
              overflow: "hidden",
            }}
          >
            {/* Subtle top-border accent line */}
            <div
              style={{
                height: "2px",
                background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
              }}
            />
            <div className="p-4">{item.content}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
