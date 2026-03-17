# Dashboard Compositions — Detailed Reference

A dashboard is not a collection of charts. A dashboard is a single, unified data surface where every visualization is aware of every other visualization. The animation's job is to make the dashboard feel alive — a living system that responds as one organism, not a grid of isolated widgets. This reference covers how multiple visualizations orchestrate their animations together.

---

## Staggered Entry Sequences

When a dashboard first renders, its cards/widgets do not all appear simultaneously. They arrive in a choreographed sequence that guides the user's eye through the data in order of importance.

### Entry Order

The stagger order should follow the information hierarchy:

1. **Primary KPI** (largest card, top-left or center) — appears first
2. **Supporting metrics** (secondary cards around the primary) — appear next
3. **Detail visualizations** (charts, tables, graphs) — appear last

This creates a funnel: the user absorbs the most important number first, then context, then detail.

### Stagger Implementation

```typescript
interface DashboardCard {
  id: string;
  priority: number;  // Lower = appears first
  component: React.ReactNode;
}

const STAGGER_CONFIG = {
  /** Delay between each card's entrance */
  delayBetween: 60, // ms
  /** Duration of each card's entry animation */
  cardDuration: 400, // ms
  /** Easing for card entry */
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
};

function useDashboardEntryStagger(
  cards: DashboardCard[],
  hasEntered: boolean,
  reducedMotion: boolean
): Map<string, { visible: boolean; delay: number }> {
  const [visibilityMap, setVisibilityMap] = useState<Map<string, { visible: boolean; delay: number }>>(
    new Map(cards.map((c) => [c.id, { visible: false, delay: 0 }]))
  );

  useEffect(() => {
    if (!hasEntered) return;

    const sorted = [...cards].sort((a, b) => a.priority - b.priority);
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    sorted.forEach((card, index) => {
      const delay = reducedMotion ? 0 : index * STAGGER_CONFIG.delayBetween;
      const timeout = setTimeout(() => {
        setVisibilityMap((prev) => {
          const next = new Map(prev);
          next.set(card.id, { visible: true, delay });
          return next;
        });
      }, delay);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [hasEntered, cards, reducedMotion]);

  return visibilityMap;
}
```

### Card Entry Animation

Each card enters with:
- **Opacity:** 0 → 1 (400ms)
- **Transform:** `translateY(12px)` → `translateY(0)` (400ms, ease-out)
- **No scale.** Cards do not scale in. Scale animations on rectangular containers feel cheap.

```typescript
// CSS class for card entry
const cardEntryStyles = (visible: boolean, reducedMotion: boolean): React.CSSProperties => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(12px)',
  transition: reducedMotion
    ? 'opacity 200ms ease'
    : `opacity 400ms cubic-bezier(0.16, 1, 0.3, 1), transform 400ms cubic-bezier(0.16, 1, 0.3, 1)`,
});
```

### Nested Animation Coordination

Each card has its own internal animation (chart draw, counter tick, ring fill). These internal animations must NOT start until the card's entry animation is at least 50% complete. This prevents visual chaos — the card arrives, then its content animates.

```typescript
function useDashboardCardAnimation(
  cardVisible: boolean,
  cardDelay: number,
  reducedMotion: boolean
): { cardStyle: React.CSSProperties; contentReady: boolean } {
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    if (!cardVisible) return;

    if (reducedMotion) {
      setContentReady(true);
      return;
    }

    // Content animation starts after 50% of card entry animation
    const delay = 200; // Half of 400ms card entry
    const timeout = setTimeout(() => setContentReady(true), delay);
    return () => clearTimeout(timeout);
  }, [cardVisible, reducedMotion]);

  return {
    cardStyle: cardEntryStyles(cardVisible, reducedMotion),
    contentReady,
  };
}
```

---

## Shared Data Highlighting

The most powerful dashboard interaction: hovering a data point in one visualization highlights the corresponding data in all other visualizations.

### Architecture

Shared highlighting requires a central state that all visualizations subscribe to:

```typescript
interface HighlightState {
  /** The entity being highlighted (e.g., "project-123", "2024-Q3") */
  entityId: string | null;
  /** The dimension being highlighted (e.g., "time", "category", "project") */
  dimension: string | null;
  /** The source visualization (to avoid circular updates) */
  sourceId: string | null;
}

// Context provider at dashboard level
const DashboardHighlightContext = React.createContext<{
  highlight: HighlightState;
  setHighlight: (state: HighlightState) => void;
}>({
  highlight: { entityId: null, dimension: null, sourceId: null },
  setHighlight: () => {},
});

function DashboardHighlightProvider({ children }: { children: React.ReactNode }) {
  const [highlight, setHighlight] = useState<HighlightState>({
    entityId: null,
    dimension: null,
    sourceId: null,
  });

  return (
    <DashboardHighlightContext.Provider value={{ highlight, setHighlight }}>
      {children}
    </DashboardHighlightContext.Provider>
  );
}

// Hook for individual visualizations
function useDashboardHighlight(vizId: string) {
  const { highlight, setHighlight } = useContext(DashboardHighlightContext);

  const onHighlight = useCallback(
    (entityId: string | null, dimension: string | null) => {
      setHighlight({
        entityId,
        dimension,
        sourceId: entityId ? vizId : null,
      });
    },
    [vizId, setHighlight]
  );

  const isHighlighted = useCallback(
    (entityId: string, dimension: string): boolean | null => {
      if (highlight.entityId === null) return null; // No active highlight
      return highlight.entityId === entityId && highlight.dimension === dimension;
    },
    [highlight]
  );

  return { onHighlight, isHighlighted, activeHighlight: highlight };
}
```

### Visual Response

When an entity is highlighted:
- **Source visualization:** Emphasizes the highlighted element (increased opacity, glow, enlarged).
- **Related visualizations:** Corresponding elements highlight. Non-related elements dim to 30% opacity.
- **Transition:** 150ms opacity/color transition. Fast enough to feel responsive, slow enough to be perceptible.

### Highlight Mapping

Different visualizations may represent the same data differently. A "Q3 2024" time period is:
- A bar segment in a bar chart
- A point on a line chart
- A row in a data table
- A ring segment in a donut chart

The `dimension` and `entityId` create a shared coordinate system. All visualizations that display the "time" dimension and have a "Q3 2024" entity can respond to the highlight.

```typescript
// Bar chart responding to highlight
function getBarOpacity(
  barEntityId: string,
  barDimension: string,
  highlighted: ReturnType<typeof useDashboardHighlight>['isHighlighted']
): number {
  const state = highlighted(barEntityId, barDimension);
  if (state === null) return 1;    // No active highlight — full opacity
  if (state === true) return 1;     // This bar IS the highlighted entity
  return 0.3;                       // Another entity is highlighted — dim
}
```

---

## Responsive Reflow Animations

When the dashboard grid changes (window resize, sidebar toggle, breakpoint change), cards reflow to new positions. This reflow should be animated — cards slide to their new grid positions rather than jumping.

### CSS Grid Animation

Modern CSS can animate grid changes when combined with `layout` animations:

```typescript
// Dashboard grid with animated reflow
const dashboardGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '16px',
  // Smooth transition when grid reflows
  // Note: grid track animation is not natively supported in CSS.
  // Individual card positions must be animated instead.
};

// Card wrapper with layout animation
// Using CSS transitions on position:
function AnimatedGridCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        ...style,
        transition: 'transform 300ms cubic-bezier(0.33, 1, 0.68, 1)',
      }}
    >
      {children}
    </div>
  );
}
```

### FLIP Technique for Grid Reflow

For precise grid reflow animation, use the FLIP (First, Last, Invert, Play) technique:

```typescript
function animateGridReflow(
  container: HTMLElement,
  duration: number = 300
) {
  const cards = Array.from(container.children) as HTMLElement[];

  // FIRST: Record current positions
  const firstPositions = new Map<HTMLElement, DOMRect>();
  cards.forEach((card) => firstPositions.set(card, card.getBoundingClientRect()));

  // Trigger the layout change (e.g., grid column change)
  // ... (the caller triggers the change)

  // LAST: Record new positions
  requestAnimationFrame(() => {
    cards.forEach((card) => {
      const first = firstPositions.get(card);
      const last = card.getBoundingClientRect();
      if (!first) return;

      // INVERT: Calculate delta and apply as transform
      const dx = first.left - last.left;
      const dy = first.top - last.top;

      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return; // No meaningful change

      card.style.transform = `translate(${dx}px, ${dy}px)`;
      card.style.transition = 'none';

      // PLAY: Remove transform with transition
      requestAnimationFrame(() => {
        card.style.transition = `transform ${duration}ms cubic-bezier(0.33, 1, 0.68, 1)`;
        card.style.transform = '';

        // Cleanup after animation
        card.addEventListener(
          'transitionend',
          () => {
            card.style.transition = '';
          },
          { once: true }
        );
      });
    });
  });
}
```

---

## Loading State Patterns

Dashboard data is often asynchronous — different cards load at different speeds. Loading states must feel intentional, not broken.

### Skeleton Pattern

Each card shows a skeleton that matches its final layout dimensions exactly. The skeleton pulses subtly (opacity 0.05 → 0.1 → 0.05, 1.5s cycle). When data arrives, the skeleton crossfades to the real content (200ms).

```typescript
interface DashboardCardShellProps {
  isLoading: boolean;
  children: React.ReactNode;
  minHeight?: number;
}

function DashboardCardShell({
  isLoading,
  children,
  minHeight = 200,
}: DashboardCardShellProps) {
  return (
    <div
      style={{
        position: 'relative',
        minHeight,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Skeleton layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isLoading ? 1 : 0,
          transition: 'opacity 200ms ease',
          pointerEvents: isLoading ? 'auto' : 'none',
        }}
      >
        <SkeletonContent />
      </div>

      {/* Real content layer */}
      <div
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 200ms ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SkeletonContent() {
  return (
    <div
      style={{
        padding: 20,
        background: 'rgba(255,255,255,0.02)',
        height: '100%',
      }}
    >
      {/* Pulsing skeleton bars */}
      <div
        style={{
          height: 20,
          width: '40%',
          borderRadius: 4,
          background: 'rgba(255,255,255,0.06)',
          animation: 'skeletonPulse 1.5s ease-in-out infinite',
          marginBottom: 16,
        }}
      />
      <div
        style={{
          height: 48,
          width: '60%',
          borderRadius: 4,
          background: 'rgba(255,255,255,0.04)',
          animation: 'skeletonPulse 1.5s ease-in-out infinite 0.2s',
          marginBottom: 24,
        }}
      />
      <div
        style={{
          height: 100,
          width: '100%',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          animation: 'skeletonPulse 1.5s ease-in-out infinite 0.4s',
        }}
      />
    </div>
  );
}

// CSS keyframes (inject via <style> or CSS module)
// @keyframes skeletonPulse {
//   0%, 100% { opacity: 1; }
//   50% { opacity: 0.5; }
// }
```

### Progressive Loading

Cards should render as soon as their individual data is available — do not wait for all data to load. The stagger entry animation naturally handles progressive loading: earlier cards may already be visible and animating while later cards are still showing skeletons.

### Error States

If a card's data fails to load, show a minimal error state in the card's footprint (not a modal, not a toast). The error state should:
- Match the card's dimensions (no layout shift)
- Show a single-line message and a retry button
- Fade in with the same 200ms crossfade as the loading→content transition

```typescript
function CardErrorState({ onRetry, message }: { onRetry: () => void; message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 12,
        opacity: 0.5,
      }}
    >
      <span style={{ fontSize: 13 }}>{message}</span>
      <button
        onClick={onRetry}
        style={{
          fontSize: 12,
          padding: '6px 16px',
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'transparent',
          color: 'inherit',
          cursor: 'pointer',
        }}
      >
        Retry
      </button>
    </div>
  );
}
```

---

## Orchestration Patterns

### The Dashboard Conductor

A single orchestration hook manages the global animation timeline:

```typescript
interface OrchestratorState {
  phase: 'idle' | 'entering' | 'ready' | 'updating';
  cardStates: Map<string, 'skeleton' | 'entering' | 'visible' | 'updating'>;
  highlightState: HighlightState;
}

function useDashboardOrchestrator(cardIds: string[]) {
  const [state, setState] = useState<OrchestratorState>({
    phase: 'idle',
    cardStates: new Map(cardIds.map((id) => [id, 'skeleton'])),
    highlightState: { entityId: null, dimension: null, sourceId: null },
  });

  const { ref, hasEntered } = useIntersectionEntry(0.2);

  useEffect(() => {
    if (!hasEntered) return;

    setState((s) => ({ ...s, phase: 'entering' }));

    // Cards enter in sequence
    cardIds.forEach((id, index) => {
      setTimeout(() => {
        setState((s) => {
          const next = new Map(s.cardStates);
          next.set(id, 'entering');
          return { ...s, cardStates: next };
        });

        // Mark visible after entry animation completes
        setTimeout(() => {
          setState((s) => {
            const next = new Map(s.cardStates);
            next.set(id, 'visible');

            // Check if all cards are visible
            const allVisible = [...next.values()].every((v) => v === 'visible');
            return {
              ...s,
              phase: allVisible ? 'ready' : s.phase,
              cardStates: next,
            };
          });
        }, 400);
      }, index * 60);
    });
  }, [hasEntered, cardIds]);

  return { ref, state };
}
```

### Update Propagation

When data updates arrive:
1. The orchestrator sets the dashboard phase to `'updating'`
2. All affected cards transition to `'updating'` state
3. Cards animate their internal data changes (bar heights, counters, rings)
4. When all animations complete, phase returns to `'ready'`

During the `'updating'` phase, new hover highlights are suppressed (the data is in flux — highlighting a changing value is confusing).

### Responsive Breakpoint Orchestration

When the viewport crosses a breakpoint:
1. Grid columns change (e.g., 3 → 2 on tablet, 1 on mobile)
2. Some cards may be hidden or collapsed on smaller screens
3. The FLIP reflow animation positions cards in their new layout
4. Collapsed cards animate to their compact form (height transition, content swap)

```typescript
const DASHBOARD_BREAKPOINTS = {
  desktop: { minWidth: 1024, columns: 3 },
  tablet: { minWidth: 640, columns: 2 },
  mobile: { minWidth: 0, columns: 1 },
} as const;

function useDashboardBreakpoint(): keyof typeof DASHBOARD_BREAKPOINTS {
  const [bp, setBp] = useState<keyof typeof DASHBOARD_BREAKPOINTS>('desktop');

  useEffect(() => {
    const check = () => {
      const width = window.innerWidth;
      if (width >= 1024) setBp('desktop');
      else if (width >= 640) setBp('tablet');
      else setBp('mobile');
    };

    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return bp;
}
```

---

## Real-Time Dashboard Patterns

For dashboards displaying live data (WebSocket feeds, polling), additional animation considerations apply:

### Value Change Flash

When a metric updates, briefly flash the card's border or background to draw attention. 150ms pulse at 10% opacity of the metric's color, then fade back to normal.

```typescript
function useValueChangeFlash(value: number): React.CSSProperties {
  const prevRef = useRef(value);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (value !== prevRef.current) {
      prevRef.current = value;
      setFlashing(true);
      const timeout = setTimeout(() => setFlashing(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  return {
    boxShadow: flashing
      ? 'inset 0 0 0 1px rgba(89, 119, 148, 0.3)'
      : 'inset 0 0 0 1px transparent',
    transition: flashing
      ? 'box-shadow 100ms ease-out'
      : 'box-shadow 300ms ease-in',
  };
}
```

### Smooth Polling Updates

If data updates via polling (every 5-30 seconds), animate the transition between old and new values. The animation duration should be shorter than the polling interval (max 600ms for a 5s poll, 300ms for frequent updates).

### Connection Status Indicator

Live dashboards should show connection status. A small indicator dot in the dashboard header:
- **Green** (pulsing slowly): Connected, receiving data
- **Yellow** (solid): Connected, no recent data
- **Red** (pulsing fast): Disconnected, attempting reconnect

The status change between states uses a 300ms color crossfade.

---

## Reduced Motion

For dashboards with reduced motion:

1. **Entry stagger:** All cards appear simultaneously with a single 200ms opacity fade. No translateY.
2. **Shared highlighting:** Instant opacity change (no transition). The highlight still works — only the animated transition is removed.
3. **Grid reflow:** Instant position change. No FLIP animation.
4. **Loading skeletons:** Static (no pulse animation). Show a simple "Loading..." text instead.
5. **Value change flash:** Instant appearance/disappearance of the highlight border. No fade transition.
6. **Internal chart animations:** All charts render at their final state immediately (see charts-graphs.md reduced motion section).
