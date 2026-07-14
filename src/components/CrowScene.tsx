"use client";

import { useRef, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

/* ─── GLSL — BIRD UNTOUCHED ──────────────────────────────────────────────── */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uScroll;
  uniform float uHover;
  uniform vec2 uMouseWorld;
  uniform sampler2D uTexture;
  uniform float uHeadRotationY;
  uniform vec3 uNeckPivot;
  attribute float aIsHead;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main() {
    vUv = uv;
    vec4 tex = texture2D(uTexture, uv);
    float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    if (lum > 0.45) {
      gl_Position = vec4(9999.0, 9999.0, 9999.0, 1.0);
      gl_PointSize = 0.0;
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

    float rnd = hash(uv);
    float speed = 2.0 + rnd * 2.0;
    pos.x += sin(uTime * speed + rnd * 100.0) * 0.003;
    pos.y += cos(uTime * speed * 0.8 + rnd * 100.0) * 0.003;
    pos.z += sin(uTime * speed * 1.2 + rnd * 100.0) * 0.005;
    vec2 toMouse = pos.xy - uMouseWorld;
    float dist = length(toMouse);
    float force = smoothstep(0.18, 0.0, dist) * uHover;
    vec2 dir = normalize(toMouse + 0.0001);
    pos.xy += dir * force * 0.015;
    pos.z += force * 0.03;
    float scrollEase = uScroll * uScroll * 2.5;
    vec3 explodeDir = normalize(vec3(pos.xy, (rnd - 0.5) * 0.5));
    pos += explodeDir * scrollEase * 45.0;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 2.0 * (5.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uScroll;
  void main() {
    vec2 coord = gl_PointCoord - 0.5;
    if (length(coord) > 0.5) discard;
    float alpha = clamp(1.0 - uScroll * 1.5, 0.0, 1.0);
    gl_FragColor = vec4(0.067, 0.067, 0.067, alpha);
  }
`;

/* ─── R3F MESH — UNTOUCHED ───────────────────────────────────────────────── */

// ── Head segmentation constants (tune these after visual inspection) ──────────
// HEAD_Y_THRESHOLD: local Y above which particles are "head" (range -0.5..0.5)
const HEAD_Y_THRESHOLD = 0.18;
// Blend zone half-width — smoothstep transition (0 = hard cutoff)
const HEAD_Y_BLEND = 0.05;
// Neck pivot in local object space — rotation center
const NECK_PIVOT_Y = 0.12;

function CrowShaderMesh({ scrollRef, mouseRef, isHoveringRef }: {
  scrollRef: { current: number };
  mouseRef: { current: { x: number; y: number } };
  isHoveringRef: { current: boolean };
}) {
  const { viewport, camera } = useThree();
  const texture = useTexture("/crow-particles.webp");
  texture.colorSpace = THREE.SRGBColorSpace;
  const meshW = Math.min(viewport.width * 0.85, 6.0);
  const meshH = meshW / 2;

  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const headRotation = useRef(0);
  const reducedMotion = useRef(
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const uniforms = useMemo(() => ({
    uTexture:       { value: texture },
    uTime:          { value: 0 },
    uScroll:        { value: 0 },
    uHover:         { value: 0 },
    uMouseWorld:    { value: new THREE.Vector2(0, 0) },
    uHeadRotationY: { value: 0 },
    uNeckPivot:     { value: new THREE.Vector3(0.0, NECK_PIVOT_Y, 0.0) },
  }), [texture]);

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

  const hoverTarget = useRef(0);
  const mouseWorld  = useRef(new THREE.Vector2(0, 0));
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

    uniforms.uTime.value += dt;
    uniforms.uScroll.value += (scrollRef.current - uniforms.uScroll.value) * 0.14;
    hoverTarget.current = isHoveringRef.current ? 1.0 : 0.0;
    uniforms.uHover.value += (hoverTarget.current - uniforms.uHover.value) * 0.1;
    ndcVec.set(mouseRef.current.x, mouseRef.current.y);
    raycaster.setFromCamera(ndcVec, camera);
    if (raycaster.ray.intersectPlane(zPlane, hitVec)) {
      mouseWorld.current.lerp(new THREE.Vector2((hitVec.x + 0.3) / meshW, hitVec.y / meshH), 0.15);
    }
    uniforms.uMouseWorld.value.copy(mouseWorld.current);

    // Head rotation — idle sway + cursor follow (hover only)
    let target: number;
    if (reducedMotion.current) {
      target = 0.15;
    } else {
      const time = state.clock.getElapsedTime();
      const idle = Math.sin(time * 0.15) * 0.05;
      let mouseInfluence = 0;
      if (isHoveringRef.current) {
        const adjusted = mouseRef.current.x - 0.15;
        mouseInfluence = adjusted * 0.3;
      }
      target = Math.max(-0.3, Math.min(0.3, idle + mouseInfluence));
    }
    headRotation.current += (target - headRotation.current) * dt * 1.4;
    uniforms.uHeadRotationY.value = headRotation.current;
  });

  const isMobile = viewport.width < 4.0;
  const xOffset  = isMobile ? -0.05 : -0.3;
  return (
    <points scale={[meshW, meshH, 1]} position={[xOffset, 0, 0]}>
      <planeGeometry ref={geometryRef} args={[1, 1, 256, 256]} />
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
        gl={{ alpha: true, antialias: true }}
      >
        <CrowShaderMesh scrollRef={scrollRef} mouseRef={mouseRef} isHoveringRef={isHoveringRef} />
      </Canvas>
    </Suspense>
  );
}
