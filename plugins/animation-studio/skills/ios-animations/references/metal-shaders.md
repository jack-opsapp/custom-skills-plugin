# Metal Shaders — Complete Reference

Custom GPU shaders integrated with SwiftUI views. iOS 17+ for `ShaderLibrary` integration, lower for raw `CAMetalLayer`.

---

## 1. SwiftUI Shader Integration (iOS 17+)

SwiftUI provides three shader effect modifiers that connect to Metal shader functions via `ShaderLibrary`.

### Shader Types

| Modifier | Input | Output | Use Case |
|----------|-------|--------|----------|
| `.colorEffect()` | Pixel position (`float2`) + pixel color (`half4`) | Modified color (`half4`) | Tinting, posterizing, chromatic aberration, color inversion |
| `.distortionEffect()` | Pixel position (`float2`) | New source position (`float2`) | Ripple, wave, warp, fisheye, barrel distortion |
| `.layerEffect()` | Pixel position (`float2`) + `SwiftUI::Layer` | Modified color (`half4`) | Blur, glow, edge detection (can sample neighboring pixels) |

### Metal Function Requirements

All shader functions used with SwiftUI must be marked `[[ stitchable ]]`. This attribute tells the Metal compiler the function will be called per-pixel by SwiftUI.

```metal
// In a .metal file in your project

#include <metal_stdlib>
#include <SwiftUI/SwiftUI_Metal.h>
using namespace metal;

// colorEffect signature
[[ stitchable ]]
half4 myColorEffect(float2 position, half4 color, /* custom args */) {
    return color;
}

// distortionEffect signature
[[ stitchable ]]
float2 myDistortion(float2 position, /* custom args */) {
    return position;
}

// layerEffect signature
[[ stitchable ]]
half4 myLayerEffect(float2 position, SwiftUI::Layer layer, /* custom args */) {
    return layer.sample(position);
}
```

### SwiftUI Usage

```swift
import SwiftUI

struct ShaderExample: View {
    @State private var time: CGFloat = 0

    var body: some View {
        TimelineView(.animation) { timeline in
            let elapsed = timeline.date.timeIntervalSinceReferenceDate

            Image("photo")
                .resizable()
                .aspectRatio(contentMode: .fit)
                // Apply a color effect
                .colorEffect(
                    ShaderLibrary.myColorEffect(
                        .float(elapsed)
                    )
                )
                // Apply a distortion effect
                .distortionEffect(
                    ShaderLibrary.myDistortion(
                        .float(elapsed),
                        .float2(200, 300)  // Touch point
                    ),
                    maxSampleOffset: CGSize(width: 20, height: 20)
                    // maxSampleOffset: tells SwiftUI the maximum displacement
                    // Without this, pixels that move beyond their original bounds will clip
                )
                // Apply a layer effect
                .layerEffect(
                    ShaderLibrary.myLayerEffect(
                        .float(elapsed)
                    ),
                    maxSampleOffset: CGSize(width: 10, height: 10)
                )
        }
    }
}
```

### Argument Types

Pass data from Swift to Metal via `Shader.Argument`:

```swift
ShaderLibrary.myShader(
    .float(timeValue),                          // float
    .float2(x, y),                              // float2
    .float3(r, g, b),                           // float3
    .float4(r, g, b, a),                        // float4
    .color(Color.blue),                         // half4 color
    .image(Image("texture")),                   // texture2d<half>
    .boundingRect                               // float4 (view bounds)
)
```

---

## 2. Complete Shader Implementations

### Ripple Effect

**Metal shader:**

```metal
#include <metal_stdlib>
#include <SwiftUI/SwiftUI_Metal.h>
using namespace metal;

[[ stitchable ]]
float2 ripple(
    float2 position,
    float time,
    float2 origin,
    float amplitude,
    float frequency,
    float decay,
    float speed
) {
    float2 delta = position - origin;
    float distance = length(delta);

    // Wave propagation from origin
    float wave = sin(frequency * distance - speed * time);

    // Decay with distance from origin
    float envelope = amplitude * exp(-decay * distance) * max(0.0, 1.0 - time * 0.5);

    // Displace perpendicular to the wavefront
    float2 direction = normalize(delta + float2(0.001)); // Avoid division by zero
    float2 displacement = direction * wave * envelope;

    return position + displacement;
}
```

**SwiftUI view:**

```swift
struct RippleView: View {
    @State private var rippleTime: CGFloat = 0
    @State private var rippleOrigin: CGPoint = .zero
    @State private var isRippling = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        content
            .modifier(RippleModifier(
                time: rippleTime,
                origin: rippleOrigin,
                isActive: isRippling && !reduceMotion
            ))
            .onTapGesture { location in
                rippleOrigin = location
                rippleTime = 0
                isRippling = true

                // Haptic at tap point
                UIImpactFeedbackGenerator(style: .light).impactOccurred(intensity: 0.6)
            }
    }

    @ViewBuilder
    var content: some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(Color(red: 0.35, green: 0.47, blue: 0.58))
            .frame(height: 200)
    }
}

struct RippleModifier: ViewModifier {
    let time: CGFloat
    let origin: CGPoint
    let isActive: Bool

    func body(content: Content) -> some View {
        if isActive {
            TimelineView(.animation) { timeline in
                let elapsed = timeline.date.timeIntervalSinceReferenceDate

                content
                    .distortionEffect(
                        ShaderLibrary.ripple(
                            .float(Float(elapsed)),
                            .float2(Float(origin.x), Float(origin.y)),
                            .float(8.0),    // amplitude
                            .float(15.0),   // frequency
                            .float(0.02),   // decay
                            .float(800.0)   // speed
                        ),
                        maxSampleOffset: CGSize(width: 20, height: 20)
                    )
            }
        } else {
            content
        }
    }
}
```

### Dissolve / Noise Effect

**Metal shader:**

```metal
#include <metal_stdlib>
#include <SwiftUI/SwiftUI_Metal.h>
using namespace metal;

// Simple hash-based noise (no texture needed)
float hash(float2 p) {
    float3 p3 = fract(float3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

// Smooth noise via bilinear interpolation of hash values
float noise(float2 p) {
    float2 i = floor(p);
    float2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f); // Smoothstep interpolation

    float a = hash(i);
    float b = hash(i + float2(1.0, 0.0));
    float c = hash(i + float2(0.0, 1.0));
    float d = hash(i + float2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

[[ stitchable ]]
half4 dissolve(float2 position, half4 color, float progress, float scale) {
    float n = noise(position / scale);

    // Dissolve: pixels with noise value below progress become transparent
    float edge = smoothstep(progress - 0.05, progress + 0.05, n);

    // Bright edge glow at the dissolve boundary
    float glow = smoothstep(progress - 0.08, progress, n) - smoothstep(progress, progress + 0.08, n);

    half4 glowColor = half4(0.35, 0.47, 0.58, 1.0); // Brand accent
    half4 result = mix(color, color + half4(glowColor.rgb * half(glow * 3.0), 0), half(glow));
    result.a *= half(edge);

    return result;
}
```

**SwiftUI usage:**

```swift
struct DissolveView: View {
    @State private var progress: CGFloat = 0

    var body: some View {
        Image("photo")
            .resizable()
            .colorEffect(
                ShaderLibrary.dissolve(
                    .float(Float(progress)),
                    .float(8.0)  // noise scale
                )
            )
            .onTapGesture {
                withAnimation(.easeInOut(duration: 1.5)) {
                    progress = progress < 0.5 ? 1.0 : 0.0
                }
            }
    }
}
```

### Chromatic Aberration

**Metal shader:**

```metal
#include <metal_stdlib>
#include <SwiftUI/SwiftUI_Metal.h>
using namespace metal;

[[ stitchable ]]
half4 chromaticAberration(float2 position, SwiftUI::Layer layer, float2 center, float strength) {
    float2 delta = position - center;
    float dist = length(delta) * 0.001; // Normalize distance

    float2 offsetR = delta * dist * strength;
    float2 offsetB = -delta * dist * strength;

    half4 colorR = layer.sample(position + offsetR);
    half4 colorG = layer.sample(position);
    half4 colorB = layer.sample(position + offsetB);

    return half4(colorR.r, colorG.g, colorB.b, colorG.a);
}
```

---

## 3. Shader Math Reference

### Perlin-Style Noise

```metal
// 2D gradient noise
float2 grad(float2 p) {
    float angle = hash(p) * 6.283185; // 2π
    return float2(cos(angle), sin(angle));
}

float perlinNoise(float2 p) {
    float2 i = floor(p);
    float2 f = fract(p);
    float2 u = f * f * (3.0 - 2.0 * f); // Smoothstep

    return mix(
        mix(dot(grad(i + float2(0,0)), f - float2(0,0)),
            dot(grad(i + float2(1,0)), f - float2(1,0)), u.x),
        mix(dot(grad(i + float2(0,1)), f - float2(0,1)),
            dot(grad(i + float2(1,1)), f - float2(1,1)), u.x),
        u.y
    );
}
```

### Signed Distance Fields (SDF)

```metal
// Circle SDF: negative inside, positive outside
float sdCircle(float2 p, float2 center, float radius) {
    return length(p - center) - radius;
}

// Rounded rectangle SDF
float sdRoundedRect(float2 p, float2 center, float2 halfSize, float radius) {
    float2 q = abs(p - center) - halfSize + radius;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

// Use SDF for smooth edges in shaders
// smoothstep(-pixelWidth, pixelWidth, sdfValue) gives antialiased edge
```

### Polar Coordinates

```metal
// Convert Cartesian to polar
float2 toPolar(float2 p, float2 center) {
    float2 delta = p - center;
    float r = length(delta);
    float theta = atan2(delta.y, delta.x);
    return float2(r, theta);
}

// Useful for: radial effects, spiral patterns, circular distortions
// Example: spiral distortion
float2 spiral(float2 position, float2 center, float strength, float time) {
    float2 polar = toPolar(position, center);
    float angle = polar.y + polar.x * strength * sin(time);
    return center + polar.x * float2(cos(angle), sin(angle));
}
```

### UV Remapping

```metal
// Normalize position to 0-1 range based on view bounds
float2 toUV(float2 position, float4 bounds) {
    return (position - bounds.xy) / bounds.zw;
}

// Useful for: resolution-independent effects
// bounds = .boundingRect from SwiftUI
```

---

## 4. Compute Shaders for GPU Particles

For particle systems with 1000+ particles where CPU-based updates become a bottleneck.

### Metal Compute Kernel

```metal
#include <metal_stdlib>
using namespace metal;

struct Particle {
    float2 position;
    float2 velocity;
    float life;
    float maxLife;
    float size;
};

kernel void updateParticles(
    device Particle *particles [[ buffer(0) ]],
    constant float &deltaTime [[ buffer(1) ]],
    constant float2 &gravity [[ buffer(2) ]],
    uint id [[ thread_position_in_grid ]]
) {
    Particle p = particles[id];

    // Skip dead particles
    if (p.life <= 0) return;

    // Physics update
    p.velocity += gravity * deltaTime;
    p.position += p.velocity * deltaTime;
    p.life -= deltaTime;

    // Shrink as particle dies
    float lifeRatio = p.life / p.maxLife;
    p.size = mix(0.0, p.size, lifeRatio);

    particles[id] = p;
}
```

### Swift Setup

```swift
import Metal
import MetalKit

@Observable
class GPUParticleSystem {
    private let device: MTLDevice
    private let commandQueue: MTLCommandQueue
    private let computePipeline: MTLComputePipelineState
    private var particleBuffer: MTLBuffer?
    private let particleCount: Int

    struct Particle {
        var position: SIMD2<Float>
        var velocity: SIMD2<Float>
        var life: Float
        var maxLife: Float
        var size: Float
    }

    init?(particleCount: Int = 2000) {
        guard let device = MTLCreateSystemDefaultDevice(),
              let queue = device.makeCommandQueue()
        else { return nil }

        self.device = device
        self.commandQueue = queue
        self.particleCount = particleCount

        // Load the compute function
        guard let library = device.makeDefaultLibrary(),
              let function = library.makeFunction(name: "updateParticles"),
              let pipeline = try? device.makeComputePipelineState(function: function)
        else { return nil }

        self.computePipeline = pipeline

        // Allocate particle buffer
        let bufferSize = MemoryLayout<Particle>.stride * particleCount
        self.particleBuffer = device.makeBuffer(length: bufferSize, options: .storageModeShared)

        initializeParticles()
    }

    private func initializeParticles() {
        guard let buffer = particleBuffer else { return }
        let pointer = buffer.contents().bindMemory(to: Particle.self, capacity: particleCount)

        for i in 0..<particleCount {
            pointer[i] = Particle(
                position: SIMD2<Float>(Float.random(in: 0...400), Float.random(in: 0...800)),
                velocity: SIMD2<Float>(Float.random(in: -50...50), Float.random(in: -100...(-20))),
                life: Float.random(in: 1...3),
                maxLife: 3.0,
                size: Float.random(in: 2...6)
            )
        }
    }

    func update(deltaTime: Float) {
        guard let buffer = particleBuffer,
              let commandBuffer = commandQueue.makeCommandBuffer(),
              let encoder = commandBuffer.makeComputeCommandEncoder()
        else { return }

        encoder.setComputePipelineState(computePipeline)
        encoder.setBuffer(buffer, offset: 0, index: 0)

        var dt = deltaTime
        encoder.setBytes(&dt, length: MemoryLayout<Float>.size, index: 1)

        var gravity = SIMD2<Float>(0, 150) // Downward gravity
        encoder.setBytes(&gravity, length: MemoryLayout<SIMD2<Float>>.size, index: 2)

        let threadsPerGroup = MTLSize(width: min(particleCount, 256), height: 1, depth: 1)
        let threadGroups = MTLSize(width: (particleCount + 255) / 256, height: 1, depth: 1)
        encoder.dispatchThreadgroups(threadGroups, threadsPerThreadgroup: threadsPerGroup)

        encoder.endEncoding()
        commandBuffer.commit()
        commandBuffer.waitUntilCompleted()
    }

    func getParticles() -> UnsafeBufferPointer<Particle>? {
        guard let buffer = particleBuffer else { return nil }
        let pointer = buffer.contents().bindMemory(to: Particle.self, capacity: particleCount)
        return UnsafeBufferPointer(start: pointer, count: particleCount)
    }

    func cleanup() {
        particleBuffer = nil
    }
}
```

### SwiftUI Canvas Rendering

```swift
struct GPUParticleView: View {
    @State private var particleSystem: GPUParticleSystem?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation(paused: reduceMotion)) { timeline in
            Canvas { context, size in
                guard let particles = particleSystem?.getParticles() else { return }

                for particle in particles where particle.life > 0 {
                    let lifeRatio = particle.life / particle.maxLife
                    let rect = CGRect(
                        x: CGFloat(particle.position.x) - CGFloat(particle.size / 2),
                        y: CGFloat(particle.position.y) - CGFloat(particle.size / 2),
                        width: CGFloat(particle.size),
                        height: CGFloat(particle.size)
                    )

                    context.opacity = Double(lifeRatio)
                    context.fill(
                        Circle().path(in: rect),
                        with: .color(Color(red: 0.35, green: 0.47, blue: 0.58))
                    )
                }
            }
            .onChange(of: timeline.date) { _, _ in
                particleSystem?.update(deltaTime: 1.0 / 120.0)
                // On ProMotion: ~120fps. On standard: ~60fps.
                // Using a fixed timestep here for deterministic physics.
                // For variable timestep, compute delta from CACurrentMediaTime().
            }
        }
        .onAppear {
            if !reduceMotion {
                particleSystem = GPUParticleSystem(particleCount: 2000)
            }
        }
        .onDisappear {
            particleSystem?.cleanup()
            particleSystem = nil
        }
    }
}
```

---

## 5. CAMetalLayer Direct Rendering

For full Metal rendering bypassing SwiftUI's shader modifiers. Use when you need complete control over the render pipeline.

```swift
struct MetalView: UIViewRepresentable {
    func makeUIView(context: Context) -> MTKView {
        let view = MTKView()
        view.device = MTLCreateSystemDefaultDevice()
        view.delegate = context.coordinator
        view.preferredFramesPerSecond = 120  // ProMotion
        view.colorPixelFormat = .bgra8Unorm
        view.clearColor = MTLClearColor(red: 0.04, green: 0.04, blue: 0.04, alpha: 1.0)
        view.isOpaque = false
        return view
    }

    func updateUIView(_ uiView: MTKView, context: Context) {}

    static func dismantleUIView(_ uiView: MTKView, coordinator: Coordinator) {
        uiView.delegate = nil
        coordinator.cleanup()
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    class Coordinator: NSObject, MTKViewDelegate {
        private var commandQueue: MTLCommandQueue?
        private var renderPipeline: MTLRenderPipelineState?

        func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {
            // Handle resize
        }

        func draw(in view: MTKView) {
            guard let drawable = view.currentDrawable,
                  let descriptor = view.currentRenderPassDescriptor,
                  let commandBuffer = commandQueue?.makeCommandBuffer(),
                  let encoder = commandBuffer.makeRenderCommandEncoder(descriptor: descriptor)
            else { return }

            // Set pipeline, bind buffers, draw primitives
            encoder.endEncoding()
            commandBuffer.present(drawable)
            commandBuffer.commit()
        }

        func cleanup() {
            commandQueue = nil
            renderPipeline = nil
        }
    }
}
```

---

## 6. Performance Notes

1. **`maxSampleOffset` is required** for `distortionEffect` and `layerEffect`. Without it, pixels displaced beyond their original bounds will be clipped. Set it to the maximum displacement your shader produces.

2. **Shader compilation** happens at first use and can cause a frame drop. For critical shaders, trigger a dummy render during app launch or view preloading.

3. **`.colorEffect` is cheapest** — it processes each pixel independently with no texture sampling. Prefer it when possible.

4. **`.layerEffect` is most expensive** — it creates a rasterized layer that the shader can sample freely. Use only when you need to read neighboring pixels (blur, edge detection).

5. **Texture sampling** in Metal is memory-bandwidth-bound. Minimize the number of `layer.sample()` calls per pixel. For Gaussian blur, use separable passes (horizontal then vertical).

6. **Compute shaders** run asynchronously on the GPU. Call `waitUntilCompleted()` only when you need the results immediately (e.g., before rendering). For fire-and-forget updates, skip the wait and let the GPU work in parallel with the CPU.
