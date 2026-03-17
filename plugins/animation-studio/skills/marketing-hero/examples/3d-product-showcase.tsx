"use client";

/**
 * ProductShowcase3D — Interactive 3D product viewer with environment lighting,
 * auto-rotation, drag-to-rotate, contact shadows, and subtle bloom.
 *
 * The viewer loads lazily (React.lazy + IntersectionObserver) and displays a
 * static product image until the 3D scene is ready. Auto-rotation engages after
 * 3 seconds of idle and disengages instantly on user interaction.
 *
 * @example
 * ```tsx
 * <ProductShowcase3D
 *   modelUrl="/models/product.glb"
 *   fallbackImageUrl="/product-hero.png"
 *   environment="studio"
 *   enableBloom
 *   className="w-full aspect-[4/3]"
 * />
 * ```
 *
 * Dependencies: @react-three/fiber, @react-three/drei, @react-three/postprocessing, three
 */

import React, {
  Suspense,
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  useGLTF,
  Center,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EnvironmentPreset =
  | "studio"
  | "city"
  | "sunset"
  | "dawn"
  | "night"
  | "warehouse"
  | "apartment"
  | "forest"
  | "lobby"
  | "park";

export interface ProductShowcase3DProps {
  /** URL to a GLTF/GLB model. */
  modelUrl: string;
  /** Static fallback image shown while 3D loads. Same framing as the 3D view. */
  fallbackImageUrl?: string;
  /** Alt text for the fallback image / aria-label for the 3D section. */
  productName?: string;
  /** drei Environment preset or path to custom HDR. Default "studio". */
  environment?: EnvironmentPreset | string;
  /** Model scale multiplier. Default 1. */
  modelScale?: number;
  /** Camera field of view. Default 45. */
  fov?: number;
  /** Camera distance from origin. Default 5. */
  cameraDistance?: number;
  /** Enable subtle bloom on reflective surfaces. Default true. */
  enableBloom?: boolean;
  /** Bloom intensity. Default 0.25. */
  bloomIntensity?: number;
  /** Shadow opacity beneath the model. Default 0.35. */
  shadowOpacity?: number;
  /** Auto-rotate speed (degrees/sec). Default 1.5. */
  autoRotateSpeed?: number;
  /** Idle timeout before auto-rotation resumes (ms). Default 3000. */
  idleTimeout?: number;
  /** Minimum polar angle (radians). Default Math.PI/6. */
  minPolarAngle?: number;
  /** Maximum polar angle (radians). Default Math.PI/2.2. */
  maxPolarAngle?: number;
  /** Minimum zoom distance. Default 2. */
  minDistance?: number;
  /** Maximum zoom distance. Default 10. */
  maxDistance?: number;
  /** Background color. Default "transparent". */
  backgroundColor?: string;
  /** Container className. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Model component
// ---------------------------------------------------------------------------

function ProductModel({
  url,
  scale,
}: {
  url: string;
  scale: number;
}) {
  const { scene } = useGLTF(url);

  // Clone to avoid mutation across instances
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Enable shadows on all meshes
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  return (
    <Center>
      <primitive object={clonedScene} scale={scale} dispose={null} />
    </Center>
  );
}

// ---------------------------------------------------------------------------
// Idle detection hook
// ---------------------------------------------------------------------------

function useIdleDetection(timeoutMs: number): boolean {
  const [isIdle, setIsIdle] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const resetIdle = useCallback(() => {
    setIsIdle(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsIdle(true), timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    const events = ["pointerdown", "pointermove", "wheel"];
    events.forEach((e) =>
      window.addEventListener(e, resetIdle, { passive: true })
    );
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [resetIdle]);

  return isIdle;
}

// ---------------------------------------------------------------------------
// Responsive camera
// ---------------------------------------------------------------------------

function ResponsiveCamera({ baseFov }: { baseFov: number }) {
  const { viewport, camera } = useThree();

  useEffect(() => {
    const perspCam = camera as THREE.PerspectiveCamera;
    // Widen FOV on narrow viewports to keep product fully visible
    if (viewport.width < 5) {
      perspCam.fov = baseFov + 12;
    } else if (viewport.width < 8) {
      perspCam.fov = baseFov + 5;
    } else {
      perspCam.fov = baseFov;
    }
    perspCam.updateProjectionMatrix();
  }, [viewport.width, camera, baseFov]);

  return null;
}

// ---------------------------------------------------------------------------
// Slow rotation driver — drives OrbitControls.autoRotate externally for
// smooth start/stop without popping
// ---------------------------------------------------------------------------

function AutoRotationDriver({
  controlsRef,
  isIdle,
  speed,
}: {
  controlsRef: React.RefObject<any>;
  isIdle: boolean;
  speed: number;
}) {
  const targetSpeed = useRef(0);
  const currentSpeed = useRef(0);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    targetSpeed.current = isIdle ? speed : 0;
    // Smooth interpolation toward target
    currentSpeed.current +=
      (targetSpeed.current - currentSpeed.current) * Math.min(delta * 3, 1);
    controlsRef.current.autoRotateSpeed = currentSpeed.current;
  });

  return null;
}

// ---------------------------------------------------------------------------
// Scene composition
// ---------------------------------------------------------------------------

function SceneContents({
  modelUrl,
  modelScale,
  environment,
  enableBloom,
  bloomIntensity,
  shadowOpacity,
  autoRotateSpeed,
  idleTimeout,
  fov,
  minPolarAngle,
  maxPolarAngle,
  minDistance,
  maxDistance,
}: Omit<
  ProductShowcase3DProps,
  | "fallbackImageUrl"
  | "productName"
  | "backgroundColor"
  | "className"
  | "cameraDistance"
> & {
  modelScale: number;
  enableBloom: boolean;
  bloomIntensity: number;
  shadowOpacity: number;
  autoRotateSpeed: number;
  idleTimeout: number;
  fov: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  minDistance: number;
  maxDistance: number;
}) {
  const controlsRef = useRef<any>(null);
  const isIdle = useIdleDetection(idleTimeout);

  // Determine if environment is preset or custom HDR path
  const knownPresets = new Set([
    "studio",
    "city",
    "sunset",
    "dawn",
    "night",
    "warehouse",
    "apartment",
    "forest",
    "lobby",
    "park",
  ]);
  const isPreset = knownPresets.has(environment as string);

  return (
    <>
      <ResponsiveCamera baseFov={fov} />

      {/* Environment lighting */}
      {isPreset ? (
        <Environment preset={environment as EnvironmentPreset} background={false} />
      ) : (
        <Environment files={environment as string} background={false} />
      )}

      {/* Orbit controls */}
      <OrbitControls
        ref={controlsRef}
        enableRotate
        autoRotate
        autoRotateSpeed={0} // Driven by AutoRotationDriver
        rotateSpeed={0.5}
        enableZoom
        zoomSpeed={0.5}
        enablePan={false}
        enableDamping
        dampingFactor={0.05}
        minPolarAngle={minPolarAngle}
        maxPolarAngle={maxPolarAngle}
        minDistance={minDistance}
        maxDistance={maxDistance}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_ROTATE,
        }}
      />

      <AutoRotationDriver
        controlsRef={controlsRef}
        isIdle={isIdle}
        speed={autoRotateSpeed}
      />

      {/* Product model */}
      <ProductModel url={modelUrl} scale={modelScale} />

      {/* Contact shadows */}
      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={shadowOpacity}
        scale={12}
        blur={2.5}
        far={4}
        resolution={256}
        color="#000000"
      />

      {/* Post-processing */}
      {enableBloom && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.85}
            luminanceSmoothing={0.9}
            intensity={bloomIntensity}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export function ProductShowcase3D({
  modelUrl,
  fallbackImageUrl,
  productName = "Product",
  environment = "studio",
  modelScale = 1,
  fov = 45,
  cameraDistance = 5,
  enableBloom = true,
  bloomIntensity = 0.25,
  shadowOpacity = 0.35,
  autoRotateSpeed = 1.5,
  idleTimeout = 3000,
  minPolarAngle = Math.PI / 6,
  maxPolarAngle = Math.PI / 2.2,
  minDistance = 2,
  maxDistance = 10,
  backgroundColor = "transparent",
  className,
}: ProductShowcase3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Reduced motion: show static image only
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Intersection-based lazy loading
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 3D loaded state for crossfade from fallback
  const [sceneReady, setSceneReady] = useState(false);

  if (reducedMotion) {
    return (
      <div
        ref={containerRef}
        className={`relative ${className ?? ""}`}
        role="img"
        aria-label={`${productName} — interactive 3D view disabled (reduced motion enabled)`}
      >
        {fallbackImageUrl ? (
          <img
            src={fallbackImageUrl}
            alt={productName}
            className="h-full w-full object-contain"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: backgroundColor }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${className ?? ""}`}
      role="img"
      aria-label={`Interactive 3D view of ${productName}. Drag to rotate. Scroll to zoom.`}
    >
      {/* Static fallback — always rendered, fades out when 3D is ready */}
      {fallbackImageUrl && (
        <img
          src={fallbackImageUrl}
          alt={productName}
          className="absolute inset-0 h-full w-full object-contain transition-opacity duration-700"
          style={{ opacity: sceneReady ? 0 : 1, pointerEvents: "none" }}
          loading="eager"
        />
      )}

      {/* 3D Canvas — loads when in viewport */}
      {inView && (
        <Canvas
          camera={{
            position: [0, 0, cameraDistance],
            fov,
            near: 0.1,
            far: 100,
          }}
          dpr={[1, 2]}
          style={{
            background: backgroundColor,
            opacity: sceneReady ? 1 : 0,
            transition: "opacity 700ms ease-out",
          }}
          onCreated={() => {
            // Small delay to ensure first frame renders
            setTimeout(() => setSceneReady(true), 100);
          }}
          aria-hidden="true"
        >
          <Suspense fallback={null}>
            <SceneContents
              modelUrl={modelUrl}
              modelScale={modelScale}
              environment={environment}
              enableBloom={enableBloom}
              bloomIntensity={bloomIntensity}
              shadowOpacity={shadowOpacity}
              autoRotateSpeed={autoRotateSpeed}
              idleTimeout={idleTimeout}
              fov={fov}
              minPolarAngle={minPolarAngle}
              maxPolarAngle={maxPolarAngle}
              minDistance={minDistance}
              maxDistance={maxDistance}
            />
          </Suspense>
        </Canvas>
      )}

      {/* Keyboard instructions (screen reader only) */}
      <p className="sr-only">
        Use arrow keys to rotate. Plus and minus keys to zoom in and out.
      </p>
    </div>
  );
}

export default ProductShowcase3D;
