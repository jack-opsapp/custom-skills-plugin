# Product Demos

Animated device mockups that showcase a product in motion. The user manipulates viewing angle, triggers hotspot sequences, and sees live screen content transition in real time.

## Core Techniques

### CSS 3D Perspective Transforms (Web)

The foundation of web-based device mockups is the `perspective` and `transform-style: preserve-3d` CSS properties applied to a container, with individual `rotateX`, `rotateY`, and `rotateZ` transforms on the device element.

```
Container:
  perspective: 1200px
  perspective-origin: 50% 50%

Device:
  transform-style: preserve-3d
  transform: rotateX(Xdeg) rotateY(Ydeg)
  transition: transform 0.15s ease-out   // for mouse-follow smoothing
```

**Mouse-follow perspective shifting:** Track mouse position relative to the container center. Map horizontal offset to Y-axis rotation (-15deg to +15deg) and vertical offset to X-axis rotation (+10deg to -10deg, inverted). Apply with a slight easing to avoid jitter.

```typescript
const handleMouseMove = (e: MouseEvent) => {
  const rect = container.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * maxRotateY;
  const rotateX = -((e.clientY - centerY) / (rect.height / 2)) * maxRotateX;
  device.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
};
```

**Reset on mouse leave:** Transition back to the resting angle (typically `rotateX(5deg) rotateY(-5deg)`) with a slower ease-out (0.4s).

### Device Frame Construction

Build the device frame from CSS rather than images for crisp scaling:

```
.device-frame {
  width: 375px;          // iPhone logical width
  aspect-ratio: 9 / 19.5;
  border-radius: 44px;   // iPhone corner radius
  border: 3px solid rgba(255, 255, 255, 0.12);
  background: #0A0A0A;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.05),
    0 25px 50px rgba(0,0,0,0.5),
    inset 0 0 0 1px rgba(255,255,255,0.03);
}
```

The notch/dynamic island can be a CSS pseudo-element positioned at the top center.

### SceneKit Patterns (iOS)

For iOS, use a `SCNNode` hierarchy:

```
SCNScene
  └── deviceNode (SCNBox with rounded corners)
       ├── screenNode (SCNPlane with SpriteKit texture)
       └── frameNode (SCNBox, thin, metallic material)
```

Apply `SCNAction.rotate` for mouse-follow equivalent (pan gesture). Use `SCNMaterial.diffuse.contents` set to a `SKScene` for live screen content.

## Animated Screen Content

### Technique 1: CSS Animation on Embedded Content

Embed actual HTML/CSS content inside the device frame using an `<iframe>` or a scaled-down container with `transform: scale(0.5)` and `transform-origin: top left`. Animate the content with CSS keyframes or intersection triggers.

### Technique 2: Sequenced Screenshots

Layer multiple screenshot images with absolute positioning. Use opacity transitions and `translateY` to simulate scroll. Timing via `setTimeout` chains or a timeline array:

```typescript
interface ScreenFrame {
  image: string;       // path to screenshot
  duration: number;    // ms to show
  transition: 'fade' | 'slide-up' | 'slide-left';
  transitionDuration: number;
}
```

### Technique 3: Canvas Screen Rendering

For maximum control, render the "screen" content on a Canvas element inside the device frame. This allows pixel-level animation (typing effects, progress bars, chart draws) without DOM overhead.

## Touch Point Indicators

Animated indicators that show where the user would tap on the device screen.

### Tap Pulse

A circle that scales up from 0 to ~30px with opacity fading from 0.8 to 0:

```css
@keyframes tap-pulse {
  0%   { transform: scale(0); opacity: 0.8; }
  60%  { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(1.5); opacity: 0; }
}
```

Duration: 0.6s. A filled dot (6px, white, opacity 0.6) remains at the center until the next hotspot.

### Timed Sequence

Define an array of hotspots with timing:

```typescript
interface TouchPoint {
  x: number;           // percentage from left (0-100)
  y: number;           // percentage from top (0-100)
  delayMs: number;     // delay before this point appears
  action?: 'tap' | 'swipe-up' | 'swipe-left' | 'long-press';
  label?: string;      // optional callout text
}
```

The sequence controller iterates through points, showing each with its tap-pulse animation, then transitioning the screen content to reflect the result of the tap.

### Swipe Indicator

An SVG arrow or a dot that translates along a curved path:

```typescript
// Swipe-up indicator
const swipePath = {
  startX: 50, startY: 70,  // percentage
  endX: 50,   endY: 30,
  curve: 'ease-in-out',
  duration: 800,
  repeatDelay: 1200,
};
```

## Screen Transition Simulation

When a touch point triggers a "navigation," the screen content transitions:

| Transition | Implementation |
|-----------|---------------|
| Push right | New screen slides in from right (`translateX(100%)` to `translateX(0)`) while current slides left |
| Fade | Cross-fade with 200ms overlap |
| Modal | New content slides up from bottom with backdrop opacity animation |
| Zoom | Scale from touch point origin using `transform-origin: Xpx Ypx` |

Each transition duration: 300-400ms with `cubic-bezier(0.32, 0.72, 0, 1)` (iOS spring approximation).

## Composition Pattern

```
<DemoContainer>              // perspective + mouse tracking
  <DeviceFrame>              // border, shadow, notch
    <ScreenContent>          // animated screens
      <TouchPointOverlay />  // tap indicators
    </ScreenContent>
  </DeviceFrame>
  <AnnotationLayer />        // callout labels outside the device
</DemoContainer>
```

## Performance Notes

- Use `will-change: transform` on the device frame element.
- Limit shadow complexity — a single `box-shadow` is cheaper than multiple.
- For sequenced screenshots, preload all images before starting the sequence.
- On iOS, use `SCNView.preferredFramesPerSecond = 60` and set `SCNView.antialiasingMode = .multisampling4X` only on capable devices.
