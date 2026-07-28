"use client";

import { useRef, useEffect, useMemo, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

/* ─── GLSL ───────────────────────────────────────────────────────────────── */

const vertexShader = /* glsl */ `
  varying float vAlpha;
  uniform float uTime;
  uniform float uScroll;
  uniform float uHover;
  uniform float uAssembly;
  uniform float uReduced;
  uniform float uPixelRatio;
  uniform float uPointBase;
  uniform vec2 uMouseWorld;
  uniform sampler2D uTexture;
  uniform float uHeadRotationY;
  uniform vec3 uNeckPivot;
  attribute float aIsHead;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main() {
    vec4 tex = texture2D(uTexture, uv);
    float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    if (lum > 0.45) {
      gl_Position = vec4(9999.0, 9999.0, 9999.0, 1.0);
      gl_PointSize = 0.0;
      vAlpha = 0.0;
      return;
    }
    vec3 pos = position;

    // Head rotation — smooth blend controlled by aIsHead weight
    vec3 rel = pos - uNeckPivot;
    float cosA = cos(uHeadRotationY);
    float sinA = sin(uHeadRotationY);
    vec3 rotated = vec3(
      rel.x * cosA - rel.z * sinA,
      rel.y,
      rel.x * sinA + rel.z * cosA
    );
    pos = mix(pos, rotated + uNeckPivot, aIsHead);

    float rnd  = hash(uv);
    float rndB = hash(uv * 7.31);
    float rndC = hash(uv * 3.77);
    float live = 1.0 - uReduced;

    // Idle micro-motion (frozen when uTime stops under reduced motion)
    float speed = 2.0 + rnd * 2.0;
    pos.x += sin(uTime * speed + rnd * 100.0) * 0.003;
    pos.y += cos(uTime * speed * 0.8 + rnd * 100.0) * 0.003;
    pos.z += sin(uTime * speed * 1.2 + rnd * 100.0) * 0.005;

    // Cursor proximity repel
    vec2 toMouse = pos.xy - uMouseWorld;
    float dist = length(toMouse);
    float force = smoothstep(0.18, 0.0, dist) * uHover;
    vec2 dir = normalize(toMouse + 0.0001);
    pos.xy += dir * force * 0.015;
    pos.z += force * 0.03;

    // Assembly — staggered center-out flight with easeOutBack overshoot and
    // a slight curl so dots arc into place instead of travelling straight
    float order = clamp(rndC * 0.55 + distance(uv, vec2(0.5, 0.42)) * 0.9, 0.0, 1.0);
    float t = clamp(uAssembly * 1.6 - order * 0.6, 0.0, 1.0);
    float b = t - 1.0;
    float ease = 1.0 + 2.70158 * b * b * b + 1.70158 * b * b;
    float th = rnd * 6.2831;
    float ph = rndB * 3.1415;
    vec3 scatterDir = vec3(sin(ph) * cos(th), sin(ph) * sin(th), cos(ph) * 0.6);
    vec3 off = scatterDir * (0.3 + rndC * 0.75) * (1.0 - ease);
    float ang = (1.0 - ease) * (rnd - 0.5) * 2.4;
    float ca = cos(ang);
    float sa = sin(ang);
    off.xy = mat2(ca, -sa, sa, ca) * off.xy;
    pos += off;

    // Scroll explode (skipped under reduced motion — alpha fade only)
    float scrollEase = uScroll * uScroll * 2.5;
    vec3 explodeDir = normalize(vec3(pos.xy, (rnd - 0.5) * 0.5));
    pos += explodeDir * scrollEase * 45.0 * live;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uPointBase * uPixelRatio * (5.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vAlpha = smoothstep(0.0, 0.35, t);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uScroll;
  varying float vAlpha;
  void main() {
    vec2 coord = gl_PointCoord - 0.5;
    float edge = smoothstep(0.5, 0.34, length(coord));
    if (edge < 0.01) discard;
    float alpha = clamp(1.0 - uScroll * 1.5, 0.0, 1.0) * vAlpha * edge;
    gl_FragColor = vec4(0.067, 0.067, 0.067, alpha);
  }
`;

/* ─── R3F POINTS ─────────────────────────────────────────────────────────── */

// ── Head segmentation constants (tune these after visual inspection) ──────────
// HEAD_Y_THRESHOLD: local Y above which particles are "head" (range -0.5..0.5)
const HEAD_Y_THRESHOLD = 0.18;
// Blend zone half-width — smoothstep transition (0 = hard cutoff)
const HEAD_Y_BLEND = 0.05;
// Neck pivot in local object space — rotation center
const NECK_PIVOT_Y = 0.12;

// Assembly runs this long once started (shader staggers particles within it)
const ASSEMBLY_DURATION = 2.2;
// Preloader covers the screen for 1800ms + 500ms fade — on a hard load, hold
// the assembly until it starts lifting so the flight is actually seen
const PRELOADER_MS = 1750;

function CrowShaderMesh({ scrollRef, mouseRef, isHoveringRef }: {
  scrollRef: { current: number };
  mouseRef: { current: { x: number; y: number } };
  isHoveringRef: { current: boolean };
}) {
  const { viewport, camera, gl } = useThree();
  const texture = useTexture("/crow-particles.webp");
  texture.colorSpace = THREE.SRGBColorSpace;

  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const headRotation = useRef(0);
  const reducedMotion = useRef(
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Fewer grid segments on small screens — quarter the vertex count on mobile
  const isMobileViewport = typeof window !== "undefined" && window.innerWidth < 768;
  // Mobile fills more of the viewport width — desktop keeps the approved 0.85 framing
  const meshW = Math.min(viewport.width * (isMobileViewport ? 1.0 : 0.85), 6.0);
  const meshH = meshW / 2;
  const [segments] = useState(() => (isMobileViewport ? 160 : 288));

  // uPixelRatio scales gl_PointSize so dots stay crisp on retina screens, but
  // pre-"polish" dots had no DPR scaling at all (flat 2.0 base, same on every
  // screen). The Canvas's dpr={[1, 2]} clamps virtually every modern phone
  // (Pixel 10 Pro included) to a pixelRatio of 2, so multiplying the new 2.3
  // base by that factor made mobile dots up to ~2.3x larger on-screen than
  // before. Cancel the DPR factor out on mobile so the final rendered size
  // matches the pre-polish 2.0 base exactly, whatever the clamped ratio is —
  // desktop keeps the approved dpr-aware crisp sizing untouched.
  const [pointBase] = useState(() => (isMobileViewport ? 2.0 / gl.getPixelRatio() : 2.3));

  const uniforms = useMemo(() => ({
    uTexture:       { value: texture },
    uTime:          { value: 0 },
    uScroll:        { value: 0 },
    uHover:         { value: 0 },
    uAssembly:      { value: 0 },
    uReduced:       { value: 0 },
    uPixelRatio:    { value: 1 },
    uPointBase:     { value: pointBase },
    uMouseWorld:    { value: new THREE.Vector2(0, 0) },
    uHeadRotationY: { value: 0 },
    uNeckPivot:     { value: new THREE.Vector3(0.0, NECK_PIVOT_Y, 0.0) },
  }), [texture, pointBase]);

  // Track reduced-motion preference live; static users skip assembly entirely
  useEffect(() => {
    uniforms.uPixelRatio.value = gl.getPixelRatio();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      reducedMotion.current = mq.matches;
      uniforms.uReduced.value = mq.matches ? 1 : 0;
      if (mq.matches) uniforms.uAssembly.value = 1;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [gl, uniforms]);

  // Compute aIsHead attribute — smoothstep blend around HEAD_Y_THRESHOLD
  useEffect(() => {
    const geo = geometryRef.current;
    if (!geo) return;
    const positions = geo.attributes.position.array as Float32Array;
    const count = positions.length / 3;
    const isHead = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const y = positions[i * 3 + 1];
      const t = Math.max(0, Math.min(1,
        (y - (HEAD_Y_THRESHOLD - HEAD_Y_BLEND)) / (2 * HEAD_Y_BLEND)
      ));
      isHead[i] = t * t * (3 - 2 * t); // smoothstep
    }
    geo.setAttribute("aIsHead", new THREE.BufferAttribute(isHead, 1));
  }, []);

  const hoverTarget   = useRef(0);
  const mouseWorld    = useRef(new THREE.Vector2(0, 0));
  const assemblyDelay = useRef<number | null>(null); // computed on first frame
  const raycaster   = useMemo(() => new THREE.Raycaster(), []);
  const zPlane      = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const hitVec      = useMemo(() => new THREE.Vector3(), []);
  const ndcVec      = useMemo(() => new THREE.Vector2(), []);

  // Reset head rotation on tab return to avoid delta spike
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        headRotation.current = 0;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05); // cap — prevents spike after tab switch

    uniforms.uScroll.value += (scrollRef.current - uniforms.uScroll.value) * 0.14;

    // Skip the draw entirely once the bird has fully exploded/faded on scroll
    if (pointsRef.current) {
      pointsRef.current.visible = uniforms.uScroll.value < 0.99;
    }

    if (reducedMotion.current) return; // static assembled state — uniforms frozen

    uniforms.uTime.value += dt;

    if (assemblyDelay.current === null) {
      // On a hard load the preloader still covers the screen — hold the
      // assembly until it starts lifting; on soft navigation start at once
      assemblyDelay.current = Math.max(0, (PRELOADER_MS - performance.now()) / 1000);
    }
    if (assemblyDelay.current > 0) {
      assemblyDelay.current -= dt;
    } else if (uniforms.uAssembly.value < 1) {
      uniforms.uAssembly.value = Math.min(1, uniforms.uAssembly.value + dt / ASSEMBLY_DURATION);
    }

    hoverTarget.current = isHoveringRef.current ? 1.0 : 0.0;
    uniforms.uHover.value += (hoverTarget.current - uniforms.uHover.value) * 0.1;
    ndcVec.set(mouseRef.current.x, mouseRef.current.y);
    raycaster.setFromCamera(ndcVec, camera);
    if (raycaster.ray.intersectPlane(zPlane, hitVec)) {
      mouseWorld.current.lerp(new THREE.Vector2((hitVec.x + 0.3) / meshW, hitVec.y / meshH), 0.15);
    }
    uniforms.uMouseWorld.value.copy(mouseWorld.current);

    // Head rotation — idle sway + cursor follow (hover only)
    const time = state.clock.getElapsedTime();
    const idle = Math.sin(time * 0.15) * 0.05;
    let mouseInfluence = 0;
    if (isHoveringRef.current) {
      const adjusted = mouseRef.current.x - 0.15;
      mouseInfluence = adjusted * 0.3;
    }
    const target = Math.max(-0.3, Math.min(0.3, idle + mouseInfluence));
    headRotation.current += (target - headRotation.current) * dt * 1.4;
    uniforms.uHeadRotationY.value = headRotation.current;
  });

  const isMobile = viewport.width < 4.0;
  const xOffset  = isMobile ? -0.05 : -0.3;
  return (
    <points ref={pointsRef} scale={[meshW, meshH, 1]} position={[xOffset, 0, 0]}>
      <planeGeometry ref={geometryRef} args={[1, 1, segments, segments]} />
      <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} transparent depthWrite={false} />
    </points>
  );
}

/* ─── CROW SCENE — Canvas wrapper, lazy-loaded from page.tsx ────────────────── */

export function CrowScene({ scrollRef, mouseRef, isHoveringRef }: {
  scrollRef: { current: number };
  mouseRef: { current: { x: number; y: number } };
  isHoveringRef: { current: boolean };
}) {
  return (
    <Suspense fallback={<div className="absolute inset-0 bg-[#F5F5F4]" />}>
      <Canvas
        style={{ width: "100%", height: "100%" }}
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: false }}
      >
        <CrowShaderMesh scrollRef={scrollRef} mouseRef={mouseRef} isHoveringRef={isHoveringRef} />
      </Canvas>
    </Suspense>
  );
}
