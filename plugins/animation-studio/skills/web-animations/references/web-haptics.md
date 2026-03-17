# Web Haptics Reference

## Overview

Haptic feedback on the web is fragmented. Android has solid support via the Vibration API. iOS Safari has no official Vibration API support but allows haptics through a hidden checkbox hack (Safari 17.4+). This reference covers what's actually possible, what's a workaround, and how to feature-detect honestly.

---

## Browser Support Matrix (Honest — March 2026)

| Platform | API | Support | Notes |
|----------|-----|---------|-------|
| Android Chrome | `navigator.vibrate()` | Full | Works in all Android browsers |
| Android Firefox | `navigator.vibrate()` | Full | |
| Android Samsung Internet | `navigator.vibrate()` | Full | |
| iOS Safari 17.4+ | Hidden checkbox trick | Partial | Non-standard. Only one haptic pattern. See below. |
| iOS Safari <17.4 | None | None | No haptic API of any kind |
| iOS Chrome/Firefox | None | None | All iOS browsers use WebKit — same as Safari |
| Desktop Chrome | `navigator.vibrate()` | Returns true, no hardware | No physical vibration on laptops/desktops |
| Desktop Firefox | `navigator.vibrate()` | Returns true, no hardware | Same |
| Desktop Safari | None | None | Not supported |

**Bottom line:** ~60% of mobile users can receive haptics (Android). ~35% of mobile users (iOS 17.4+) can receive haptics via workaround. ~5% get nothing.

---

## 1. navigator.vibrate() — The Standard API

### Basic Usage

```typescript
// Single vibration — duration in milliseconds
navigator.vibrate(50);  // Short tap

// Pattern — alternating [vibrate, pause, vibrate, pause, ...]
navigator.vibrate([50, 30, 50]);  // Two short taps with 30ms gap

// Cancel any ongoing vibration
navigator.vibrate(0);
// or
navigator.vibrate([]);
```

### Feature Detection

```typescript
function canVibrate(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}
```

### Haptic Pattern Library

```typescript
const HapticPatterns = {
  /** Light tap — button press, toggle, minor action */
  light: [15],

  /** Medium impact — confirmation, navigation, selection */
  medium: [30],

  /** Heavy impact — destructive action, error, major confirmation */
  heavy: [50],

  /** Success — two quick taps, like a double-check feeling */
  success: [30, 50, 30],

  /** Warning — three escalating pulses */
  warning: [20, 40, 30, 40, 50],

  /** Error — sharp buzz-buzz pattern */
  error: [50, 30, 50, 30, 80],

  /** Selection tick — barely perceptible, for scrolling through lists */
  tick: [8],
} as const;

type HapticPattern = keyof typeof HapticPatterns;

function haptic(pattern: HapticPattern): void {
  if (!canVibrate()) return;
  navigator.vibrate(HapticPatterns[pattern]);
}
```

---

## 2. iOS Safari Haptic Trick (Safari 17.4+)

Safari 17.4 introduced `<input type="checkbox" switch>` — a toggle that triggers native iOS haptic feedback when toggled. By creating a hidden one and programmatically clicking its label, you can trigger haptics.

### How It Works

1. Create an invisible `<input type="checkbox" switch>` and a `<label>` for it
2. Programmatically call `label.click()`
3. Safari triggers the checkbox toggle, which fires a haptic
4. The checkbox state change is invisible to the user

### Complete Implementation

```typescript
class iOSHaptics {
  private checkbox: HTMLInputElement | null = null;
  private label: HTMLLabelElement | null = null;
  private isSupported: boolean = false;

  constructor() {
    if (typeof document === "undefined") return;

    /* Detect iOS Safari 17.4+ with switch support */
    this.isSupported = this.detectSupport();
    if (!this.isSupported) return;

    this.createElements();
  }

  private detectSupport(): boolean {
    /* Must be iOS Safari (or any iOS browser, which all use WebKit) */
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!isIOS) return false;

    /* Test if the switch attribute is supported by creating a test input */
    const testInput = document.createElement("input");
    testInput.type = "checkbox";
    /* The switch attribute is non-standard — Safari-only */
    testInput.setAttribute("switch", "");
    /* If the browser supports it, the attribute persists */
    return testInput.hasAttribute("switch");
  }

  private createElements(): void {
    const id = `ios-haptic-${Math.random().toString(36).slice(2, 9)}`;

    this.checkbox = document.createElement("input");
    this.checkbox.type = "checkbox";
    this.checkbox.setAttribute("switch", "");
    this.checkbox.id = id;
    this.checkbox.setAttribute("aria-hidden", "true");
    this.checkbox.tabIndex = -1;

    /* Hide completely — offscreen, zero size, no pointer events */
    Object.assign(this.checkbox.style, {
      position: "fixed",
      left: "-9999px",
      top: "-9999px",
      width: "0",
      height: "0",
      opacity: "0",
      pointerEvents: "none",
    });

    this.label = document.createElement("label");
    this.label.htmlFor = id;
    this.label.setAttribute("aria-hidden", "true");
    Object.assign(this.label.style, {
      position: "fixed",
      left: "-9999px",
      top: "-9999px",
      width: "0",
      height: "0",
      opacity: "0",
      pointerEvents: "none",
    });

    document.body.appendChild(this.checkbox);
    document.body.appendChild(this.label);
  }

  /** Trigger a single haptic tap */
  trigger(): void {
    if (!this.isSupported || !this.label) return;
    this.label.click();
  }

  /** Trigger a confirm pattern (two rapid taps) */
  async confirm(): Promise<void> {
    this.trigger();
    await sleep(80);
    this.trigger();
  }

  /** Trigger an error pattern (three rapid taps) */
  async error(): Promise<void> {
    this.trigger();
    await sleep(60);
    this.trigger();
    await sleep(60);
    this.trigger();
  }

  /** Clean up DOM elements */
  destroy(): void {
    this.checkbox?.remove();
    this.label?.remove();
    this.checkbox = null;
    this.label = null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### Limitations

- **Only one haptic type** — The checkbox toggle always produces the same light tap. No intensity control.
- **Requires user gesture context** — The first trigger must be within a user gesture (tap, click). Subsequent triggers within the same event handler chain work.
- **Non-standard** — This is a Safari implementation detail, not a web standard. It could change or break in future Safari versions.
- **No pattern control** — Unlike `navigator.vibrate()` which accepts duration arrays, the iOS trick is binary: tap or no tap.

---

## 3. Unified Haptic API

A cross-platform wrapper that uses the best available method:

```typescript
type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "tick";

class WebHaptics {
  private iosHaptics: iOSHaptics | null = null;
  private method: "vibrate" | "ios-switch" | "none" = "none";

  constructor() {
    if (typeof window === "undefined") return;

    if (canVibrate()) {
      this.method = "vibrate";
    } else {
      this.iosHaptics = new iOSHaptics();
      if (this.iosHaptics["isSupported"]) {
        this.method = "ios-switch";
      }
    }
  }

  get isSupported(): boolean {
    return this.method !== "none";
  }

  trigger(style: HapticStyle): void {
    switch (this.method) {
      case "vibrate":
        navigator.vibrate(HapticPatterns[style]);
        break;

      case "ios-switch":
        /* iOS can only do a single tap pattern — map all styles to tap(s) */
        if (style === "success" || style === "medium") {
          this.iosHaptics?.confirm();
        } else if (style === "error" || style === "heavy" || style === "warning") {
          this.iosHaptics?.error();
        } else {
          this.iosHaptics?.trigger();
        }
        break;

      case "none":
        /* No haptic support — silently no-op */
        break;
    }
  }

  destroy(): void {
    this.iosHaptics?.destroy();
  }
}

// Singleton for the app
let haptics: WebHaptics | null = null;

export function getHaptics(): WebHaptics {
  if (!haptics) {
    haptics = new WebHaptics();
  }
  return haptics;
}
```

---

## 4. React Hook

```tsx
"use client";

import { useRef, useEffect, useCallback } from "react";

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "tick";

export function useHaptics() {
  const hapticsRef = useRef<WebHaptics | null>(null);

  useEffect(() => {
    hapticsRef.current = getHaptics();
    return () => {
      /* Don't destroy — singleton shared across components */
    };
  }, []);

  const trigger = useCallback((style: HapticStyle = "light") => {
    hapticsRef.current?.trigger(style);
  }, []);

  const isSupported = hapticsRef.current?.isSupported ?? false;

  return { trigger, isSupported };
}

// Usage:
function MyButton() {
  const { trigger } = useHaptics();

  return (
    <button
      onClick={() => {
        trigger("medium");
        // ... action
      }}
    >
      Confirm
    </button>
  );
}
```

---

## 5. Comparison with iOS Native Haptics

| Aspect | iOS Native (UIKit/SwiftUI) | Web (navigator.vibrate) | Web (iOS Switch Trick) |
|--------|---------------------------|------------------------|----------------------|
| **Engine** | Core Haptics (Taptic Engine) | OS-level vibration motor | Taptic Engine via checkbox |
| **Intensity levels** | Continuous (0.0–1.0) | Duration-based only | Single level |
| **Patterns** | Rich: impact, selection, notification, custom CHHapticPattern | Duration arrays | Tap only |
| **Sharpness** | Configurable | N/A | N/A |
| **Impact styles** | light, medium, heavy, rigid, soft | Duration approximation | N/A |
| **Notification styles** | success, warning, error | Duration pattern approximation | Tap count approximation |
| **Latency** | <10ms | ~20-50ms | ~30-80ms |
| **Background** | Yes (with entitlement) | No | No |
| **Audio coupling** | Yes (CHHapticPattern + audio) | No | No |

**Key takeaway:** Native iOS haptics are vastly superior. Web haptics are a meaningful enhancement on Android and a minimal enhancement on iOS. Never design an interaction that *requires* haptic feedback — it must always be an enhancement layer.

---

## 6. When to Use Web Haptics

**Good uses:**
- Button press confirmation (light tap)
- Form submission success (success pattern)
- Destructive action warning (error pattern)
- Toggle switches (tick)
- Pull-to-refresh threshold (medium)
- Swipe gesture completion (light)

**Bad uses:**
- Continuous vibration during scroll (annoying, drains battery)
- Every list item tap (haptic spam — each one should be earned)
- Background notifications (not possible on web)
- Replacing visual/audio feedback (haptics fail silently)

---

## 7. Integration with Animation Events

Pair haptics with animation milestones for multi-sensory feedback:

```tsx
"use client";

import { motion, useAnimation } from "motion/react";
import { useHaptics } from "./useHaptics";

export function SuccessAnimation({ onComplete }: { onComplete?: () => void }) {
  const controls = useAnimation();
  const { trigger } = useHaptics();

  async function playSuccess() {
    /* Scale up with haptic at peak */
    await controls.start({
      scale: [1, 1.15, 1],
      transition: { duration: 0.4, times: [0, 0.4, 1] },
    });
    trigger("success"); // Haptic fires at the settle point
    onComplete?.();
  }

  return (
    <motion.div
      animate={controls}
      initial={{ scale: 1 }}
      onClick={playSuccess}
    >
      {/* Content */}
    </motion.div>
  );
}
```

---

## Performance Notes

1. **Battery impact** — Haptics use the vibration motor, which draws power. Keep patterns short (<100ms total).
2. **Throttle** — Never fire haptics on every frame or every scroll event. Throttle to meaningful moments.
3. **User preference** — There's no `prefers-reduced-haptics` media query. Consider adding an in-app setting to disable haptics.
4. **Gesture context** — Browsers may require haptic triggers to be within a user gesture. Don't try to fire haptics from `setTimeout` or `requestAnimationFrame` — it may be silently ignored.

---

## Brand Config Integration

```tsx
interface HapticConfig {
  /** Master enable/disable for all haptics */
  enabled: boolean;
  /** Map of interaction types to haptic styles */
  patterns: {
    buttonPress: HapticStyle;
    toggleSwitch: HapticStyle;
    formSubmit: HapticStyle;
    destructiveAction: HapticStyle;
    swipeComplete: HapticStyle;
    pullToRefresh: HapticStyle;
  };
}

const defaultHapticConfig: HapticConfig = {
  enabled: true,
  patterns: {
    buttonPress: "light",
    toggleSwitch: "tick",
    formSubmit: "success",
    destructiveAction: "warning",
    swipeComplete: "light",
    pullToRefresh: "medium",
  },
};
```
