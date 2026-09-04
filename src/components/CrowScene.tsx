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

// Texture aspect — the point plane is twice as wide as it is tall
const MESH_ASPECT = 2;
// Free space left on each side of the cell when the mesh is fitted into it
const CELL_PADDING = 0.08;
// The crow texture's sparse trailing particles extend further left than the
// dense body extends right, so the dense mass sits inherently right of the
// mesh's own geometric centre — by a fraction of meshW that stays constant
// (measured via alpha-weighted pixel centroid), not a fixed world-unit amount.
// Shifting by that fraction puts the body, not the plane, in the cell's middle.
// Used only by the contain fallback now: both real fits measure the dense box
// itself, which gives the same answer without a constant to keep in sync.
const MASS_BIAS = 0.1336;

// ── Dense-body measurement ───────────────────────────────────────────────────
// A contain fit keeps the whole cloud inside the cell, sparse tail and all. In
// a width-limited cell that is expensive: the tail alone occupies the left
// quarter of the texture, and paying for it plus CELL_PADDING plus the
// 2 x MASS_BIAS centring budget leaves the bird itself at ~60% of the width it
// could have. Both layouts fit and aim the dense body instead, and let the
// tail run off the cell's left edge where it has to — the cell clips it.
//
// DENSE_THRESHOLD is a fraction of the peak column density: the dense body's
// left edge is the first column carrying at least that much ink. The texture
// has a plateau there (0.12 -> 0.2667 of the width, 0.15 -> 0.2678) and jumps
// to 0.3356 at 0.18, which is the wing — 0.15 is the last value before the cut
// stops being tail, and it drops 1.65% of the mass. The other three edges are
// the ink extent rather than the threshold: the tail is a horizontal feature,
// and a box that excluded low-density columns on the right would push the beak
// out of the cell, where the crow cell's overflow would clip it.
const DENSE_THRESHOLD = 0.15;
// A column or row holding less than this share of the peak is a stray speck
const INK_FLOOR = 0.02;
// ── Dense-body fit (stacked layout only) ─────────────────────────────────────
// Dense body relative to the cell: width is the target, height the ceiling
const DENSE_W_OF_CELL = 0.88;
const DENSE_H_MAX_OF_CELL = 0.7;
// The dense body is centred, but never closer than this to the cell's edge
const DENSE_MIN_GAP_PX = 16;

// ── Row-layout placement (desktop) ───────────────────────────────────────────
// In the row layout the crow is not centred in its own cell: it is centred on
// the *viewport*, so the bird reads as the middle of the page rather than the
// middle of the leftover column. One gap keeps that from pushing it out of the
// cell: the dense body stays this far inside both cell edges, and that clamp is
// the only thing that ever moves the bird off the viewport's centre line. The
// sparse tail runs past the gap and is cut by the cell's own overflow — see the
// mask on .crow-cell in globals.css, whose ramp is this same 48px, so the fade
// is spent entirely on tail and has always finished by the leftmost position
// the body can be clamped to.
const BODY_MIN_GAP_PX = 48;
// The dense body is this share of the *viewport's* width. Sizing off the
// viewport rather than off the cell is what keeps the bird growing evenly with
// the page: the cell is whatever the text column leaves over, and that column's
// clamp(560px, 30vw, 760px) makes the cell grow at three different rates as the
// clamp goes fixed -> 30vw -> fixed, which a cell-relative size would inherit.
const BODY_W_OF_VIEWPORT = 0.4;
// The stacked/column split is the hero grid's own condition — the same query,
// so the crow can never disagree with the layout it is sitting in
const ROW_LAYOUT_QUERY = "(orientation: landscape) and (min-width: 640px)";

type DenseBox = { x0: number; x1: number; w: number; h: number; cx: number; cy: number };

// Measured once per session — the texture never changes and the result is pure
// geometry (fractions of the mesh), so it survives remounts and resizes
let denseBoxCache: DenseBox | null | undefined;

/**
 * Column/row ink profiles of the crow texture, using the shader's own test for
 * what becomes a particle (luminance <= 0.45). Returns the dense body's box as
 * fractions of the mesh — x from the left in UV, y from the bottom — matching
 * the plane's UV space, so the caller maps it straight onto meshW/meshH.
 */
function measureDenseBox(image: HTMLImageElement): DenseBox | null {
  if (denseBoxCache !== undefined) return denseBoxCache;
  try {
    const W = image.naturalWidth || image.width || 0;
    const H = image.naturalHeight || image.height || 0;
    if (!W || !H) return null;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, W, H).data;

    const STEP = 2; // every other pixel — 4x cheaper, same profile shape
    const cols = new Float32Array(W);
    const rows = new Float32Array(H);
    for (let y = 0; y < H; y += STEP) {
      for (let x = 0; x < W; x += STEP) {
        const i = (y * W + x) * 4;
        const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        if (lum <= 0.45) { cols[x]++; rows[y]++; }
      }
    }
    let peakCol = 0, peakRow = 0;
    for (let x = 0; x < W; x++) if (cols[x] > peakCol) peakCol = cols[x];
    for (let y = 0; y < H; y++) if (rows[y] > peakRow) peakRow = rows[y];
    if (!peakCol || !peakRow) return null;

    const first = (a: Float32Array, t: number) => { for (let i = 0; i < a.length; i++) if (a[i] >= t) return i; return 0; };
    const last  = (a: Float32Array, t: number) => { for (let i = a.length - 1; i >= 0; i--) if (a[i] >= t) return i; return a.length - 1; };
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

    const denseLeft = first(cols, peakCol * DENSE_THRESHOLD);
    const inkRight  = last(cols, peakCol * INK_FLOOR) + STEP;
    const inkTop    = first(rows, peakRow * INK_FLOOR);
    const inkBottom = last(rows, peakRow * INK_FLOOR) + STEP;

    const x0 = clamp01(denseLeft / W);
    const x1 = clamp01(inkRight / W);
    // The texture is flipped on upload, so image row 0 is the top of the mesh
    const y0 = clamp01(1 - inkBottom / H);
    const y1 = clamp01(1 - inkTop / H);
    if (x1 <= x0 || y1 <= y0) return null;

    denseBoxCache = { x0, x1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
    return denseBoxCache;
  } catch {
    denseBoxCache = null; // tainted canvas or no 2d context — fall back to contain
    return null;
  }
}

/** Tracks the hero grid's own layout query, so the fit follows the layout. */
function useRowLayout() {
  const [isRow, setIsRow] = useState(
    () => typeof window !== "undefined" && window.matchMedia(ROW_LAYOUT_QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(ROW_LAYOUT_QUERY);
    const apply = () => setIsRow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return isRow;
}

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
  const { viewport, camera, gl, size } = useThree();
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
  const [segments] = useState(() => (isMobileViewport ? 160 : 288));

  // ── Fit ────────────────────────────────────────────────────────────────────
  // The canvas fills one grid cell of the hero, so `viewport` here describes
  // that cell in world units — not the window. There are two ways to fill it,
  // chosen by the same media query the hero grid uses, so the crow and the
  // layout can never disagree about which one they are in.
  const isRowLayout = useRowLayout();
  const dense = measureDenseBox(texture.image as HTMLImageElement);
  // The cell's own place in the page, in CSS px. The row fit needs it: its
  // reference is the viewport, and the cell knows nothing about the viewport
  // except through this rect. Read every render — `size` changes on resize, so
  // this is re-read exactly when the geometry it describes can have moved.
  const cellRect = gl.domElement.getBoundingClientRect();
  const canPlaceInViewport = dense !== null && size.width > 0 && cellRect.width > 0;

  let meshW: number;
  let xOffset: number;
  let yOffset: number;

  if (!isRowLayout && dense) {
    // Stacked layout — fit the dense body rather than the cloud. The cell is
    // wide and short here, so width is the binding constraint and every unit
    // spent on the sparse tail is a unit the bird does not get. Size the dense
    // box to DENSE_W_OF_CELL of the width, cap it at DENSE_H_MAX_OF_CELL of the
    // height, take whichever scale is smaller, and centre that box — not the
    // plane — in the cell. The tail then hangs off the left edge and the crow
    // cell clips it. No CELL_PADDING and no MASS_BIAS budget here: both exist
    // to keep the tail inside, which is no longer the goal.
    const worldPerPx = size.width > 0 ? viewport.width / size.width : 0;
    const minGap = DENSE_MIN_GAP_PX * worldPerPx;
    // Centred at DENSE_W_OF_CELL the gap is already ~6% of the cell, but on a
    // narrow enough cell 6% is under 16px — then the gap, not the target, sets
    // the width, so the body's right edge never crowds the cell's edge.
    const targetW = Math.min(
      DENSE_W_OF_CELL * viewport.width,
      Math.max(0, viewport.width - 2 * minGap)
    );
    const byWidth  = targetW / dense.w;
    const byHeight = (DENSE_H_MAX_OF_CELL * viewport.height * MESH_ASPECT) / dense.h;
    meshW = Math.min(byWidth, byHeight);
    const meshHeight = meshW / MESH_ASPECT;
    // Put the dense box's centre on the cell's centre, both axes
    xOffset = -(dense.cx - 0.5) * meshW;
    yOffset = -(dense.cy - 0.5) * meshHeight;
  } else if (isRowLayout && dense && canPlaceInViewport) {
    // Row layout — the bird is centred on the *viewport*, not on its cell.
    // The cell is the hero grid's right-hand column, so its middle sits well
    // right of the page's middle; centring in it reads as a bird shoved into
    // the corner. The axis is the dense body's own bbox centre (the same
    // measurement the stacked fit uses) so the sparse tail, which is a long
    // horizontal feature, cannot drag the bird off the mark it is aimed at.
    const worldPerPx = viewport.width / size.width;
    const halfCell = viewport.width / 2;
    const bodyGap = BODY_MIN_GAP_PX * worldPerPx;
    // documentElement.clientWidth, not innerWidth — getBoundingClientRect and
    // the layout viewport both exclude a classic scrollbar, innerWidth does not.
    const clientWidthPx = document.documentElement.clientWidth;

    // Size: the dense body's width, as the smallest of three ceilings. Each one
    // is non-decreasing in the viewport's width, so their minimum is too — the
    // bird can never shrink as the page grows.
    //   - the share of the viewport it is aiming for;
    //   - the cell's vertical budget, CELL_PADDING free above and below (the
    //     contain fit's, unchanged), which is flat in width;
    //   - the width that still leaves the body its own margin at both cell
    //     edges, so the clamp below always has somewhere to put it. This one
    //     binds only where the cell is barely wider than the body it has to
    //     hold — around 1024px, where 40vw is 410px and the cell is 423px.
    const byViewport = BODY_W_OF_VIEWPORT * clientWidthPx * worldPerPx / dense.w;
    const byHeight   = viewport.height * (1 - 2 * CELL_PADDING) * MESH_ASPECT;
    const byBodyFit  = Math.max(0, viewport.width - 2 * bodyGap) / dense.w;
    meshW = Math.min(byViewport, byHeight, byBodyFit);

    // Target, in the cell's own world coordinates: the viewport's centre line.
    const cellCentrePx = cellRect.left + cellRect.width / 2;
    const target = (clientWidthPx / 2 - cellCentrePx) * worldPerPx;

    // Placement, as a position for the dense body's centre. Narrow desktops
    // put the viewport's centre inside — or left of — the text column, where
    // the body cannot follow it: the clamp then parks the body as far left as
    // its margin allows, which is as close to the target as it can get.
    const place = (w: number) => {
      const leftArm  = (dense.cx - dense.x0) * w;
      const rightArm = (dense.x1 - dense.cx) * w;
      return Math.min(
        Math.max(target, -halfCell + bodyGap + leftArm),
        halfCell - bodyGap - rightArm
      );
    };
    // The sparse tail runs left past the body's margin and out of the cell,
    // where the cell's overflow-hidden cuts it and the cell's mask dissolves
    // the cut — exactly as it is stacked, and also why it can never reach the
    // text column. Nothing about the tail is allowed to cost the body width.
    const bodyCentre = place(meshW);

    // Body centre -> plane centre. Vertically the reference is still the cell,
    // but the axis is the dense box's centre here too, not the plane's.
    xOffset = bodyCentre - (dense.cx - 0.5) * meshW;
    yOffset = -(dense.cy - 0.5) * (meshW / MESH_ASPECT);
  } else {
    // Contain fit — the fallback when the texture cannot be measured (tainted
    // canvas, no 2d context) or the cell has not been laid out yet, since it
    // needs nothing but the aspect ratio. The mesh's whole box goes into the
    // cell the way object-fit: contain would: the texture's 2:1 aspect
    // preserved, CELL_PADDING free on every side, no hand-tuned offsets. The
    // horizontal budget also pays for MASS_BIAS: the mesh is pushed left by
    // that fraction of its own width so the dense mass — not the plane's
    // geometric centre — lands in the middle of the cell, which costs an extra
    // 2 x MASS_BIAS of width before the shifted box is symmetric about it.
    const availW = viewport.width * (1 - 2 * CELL_PADDING);
    const availH = viewport.height * (1 - 2 * CELL_PADDING);
    meshW = Math.min(availW / (1 + 2 * MASS_BIAS), availH * MESH_ASPECT);
    xOffset = -MASS_BIAS * meshW;
    yOffset = 0;
  }

  const meshH = meshW / MESH_ASPECT;

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
      // World → mesh-local: undo the mesh's own transform, both axes, so the
      // repel field stays centred on the body wherever the fit has put it
      mouseWorld.current.lerp(
        new THREE.Vector2((hitVec.x - xOffset) / meshW, (hitVec.y - yOffset) / meshH),
        0.15
      );
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

  return (
    <points ref={pointsRef} scale={[meshW, meshH, 1]} position={[xOffset, yOffset, 0]}>
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
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: false }}
      >
        <CrowShaderMesh scrollRef={scrollRef} mouseRef={mouseRef} isHoveringRef={isHoveringRef} />
      </Canvas>
    </Suspense>
  );
}
