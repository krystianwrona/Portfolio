"use client";

import { useRef, useEffect, useLayoutEffect, useMemo, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { CrowAnchorMap } from "@/components/crow/CrowAnchors";
import {
  CONDENSE_AT,
  TAKEOFF_AT,
  type CrowScrollState,
  type CrowTier,
} from "@/components/crow/useCrowNarrator";

/* ─── GLSL ───────────────────────────────────────────────────────────────── */

const vertexShader = /* glsl */ `
  varying float vAlpha;
  uniform float uTime;
  uniform float uTakeoff;
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

  // ── S1 take-off ────────────────────────────────────────────────────────────
  // Up and to the right, because the bird faces right — it leaves the way it
  // is looking. Already unit length (0.36 + 0.64 = 1), which GLSL ES needs it
  // to be: normalize() is not a constant expression.
  const vec3 TAKEOFF_DIR = vec3(0.6, 0.8, 0.0);
  // How far the direction is pulled off each particle's own scatter direction
  // and onto that heading. Not 1.0: what is left of the scatter is the only
  // thing keeping the cloud from leaving as a solid block.
  const float TAKEOFF_BIAS = 0.65;
  // Mesh widths travelled at the end of the flight.
  const float TAKEOFF_DISTANCE = 1.2;

  // Kept apart from main() because rata 2 needs exactly this displacement: S2
  // holds the cloud alive at the end of the take-off instead of hiding it, and
  // the swarm has to start from the position this leaves the particles in.
  vec3 takeoffOffset(vec3 scatterDir, float rnd, float t) {
    vec3 dir = normalize(mix(normalize(scatterDir), TAKEOFF_DIR, TAKEOFF_BIAS));
    vec3 off = dir * t * TAKEOFF_DISTANCE;
    // The assemble's own curl, applied to the offset so the cloud arcs out the
    // way it arced in rather than travelling on a straight line.
    float ang = t * (rnd - 0.5) * 2.4;
    float ca = cos(ang);
    float sa = sin(ang);
    off.xy = mat2(ca, -sa, sa, ca) * off.xy;
    return off;
  }

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

    // Take-off. Same stagger value as the assemble, read the other way round:
    // there the tail (high order) arrives last, here it leaves first, so the
    // bird empties from the tail forward. The live factor is the
    // reduced-motion guard: uTakeoff never leaves 0 for those readers, and
    // this makes that structural rather than a promise the JS keeps.
    float tOff = clamp(uTakeoff * 1.6 - (1.0 - order) * 0.6, 0.0, 1.0) * live;
    pos += takeoffOffset(scatterDir, rnd, tOff);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uPointBase * uPixelRatio * (5.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    // Each particle fades over the last 40% of its own flight, not the whole
    // cloud's, so the fade inherits the stagger instead of flattening it.
    vAlpha = smoothstep(0.0, 0.35, t) * (1.0 - smoothstep(0.6, 1.0, tOff));
  }
`;

const fragmentShader = /* glsl */ `
  varying float vAlpha;
  void main() {
    vec2 coord = gl_PointCoord - 0.5;
    float edge = smoothstep(0.5, 0.34, length(coord));
    if (edge < 0.01) discard;
    // The scroll fade that used to sit here is gone with the scroll explode:
    // the take-off carries its own per-particle fade into vAlpha now.
    float alpha = vAlpha * edge;
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
// sparse tail runs past the gap and out of the cell entirely, into the text
// column, where the spill fade in globals.css brings it in — see SPILL_* below.
// The gap is what guarantees that fade only ever lands on tail: the body's left
// edge can never come closer to the cell than this, and the fade ends well
// short of the cell.
const BODY_MIN_GAP_PX = 48;

// ── Spill (column layout) ────────────────────────────────────────────────────
// The tail is no longer cut at the cell's edge: the canvas covers the whole
// hero, and the particles run on into the text column, where one ramp fades
// them in. It starts clear of the copy by this much, which is the whole of the
// copy's protection — nothing is painted left of the ramp's start, so the box
// the copy occupies and the space above it are both untouched without a second
// mask layer to cut a hole and leave its edge showing.
const COPY_CLEARANCE_PX = 24;
// How long the fade runs. Long enough that the tail arrives as a gradient
// rather than at an edge, which is the whole point of not clipping it.
const SPILL_RUN_PX = 300;
// ...and it always reaches full ink at least this far inside the cell, so a
// narrow column cannot leave the ramp still climbing where the body starts.
const CELL_OVERSHOOT_PX = 80;
// Stacked, the only thing left of the cell is the page's own margin, and the
// margin belongs to the page: the tail stops at the cell's edge exactly as the
// old overflow box stopped it. The ramp collapses to this half-pixel there,
// which is a cut the edge cannot alias on rather than a fade.
const STACKED_CUT_PX = 0.5;
// ── Text-block exclusion (stacked layout) ────────────────────────────────────
// Stacked, the copy is below the crow rather than beside it, so the ramp — a
// horizontal one — cannot protect it and the mask cuts a hole around the text
// block's own box instead: clear by this much on every side, then this much
// again to fade back to full ink, so the exclusion never reads as an outline.
const TEXT_CLEARANCE_PX = 48;
const TEXT_FEATHER_PX = 64;
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

/** The parts of a DOMRect the fit uses, so a plain object can stand in. */
type Box = { left: number; top: number; width: number; height: number };

/** One DOM read of everything the placement depends on, in viewport px. */
type Metrics = {
  hasHero: boolean;
  canvasRect: Box;
  cellRect: Box;
  /** The hero copy's transform-free box, or null if there is none to avoid. */
  text: Box | null;
};

/** The mask's six offsets, canvas-local px, as the stylesheet wants them. */
type MaskVars = {
  spillStart: number;
  spillEnd: number;
  holeL: number;
  holeR: number;
  holeT: number;
  holeB: number;
};

type FitInput = {
  /** The cell the bird is fitted to, in viewport px. */
  rect: Box;
  /** The canvas's own box, in viewport px — the frame the answer comes back in. */
  canvasRect: Box;
  /** World units per CSS px, from the canvas's own projection. */
  worldPerPx: number;
  dense: DenseBox | null;
  isRowLayout: boolean;
  /**
   * documentElement.clientWidth, not innerWidth — getBoundingClientRect and
   * the layout viewport both exclude a classic scrollbar, innerWidth does not.
   */
  clientWidthPx: number;
  /** Canvas width in CSS px. Zero means it has not been laid out yet. */
  canvasWidthPx: number;
};

export type CrowFit = {
  meshW: number;
  meshH: number;
  xOffset: number;
  yOffset: number;
  /** Multiplier for the mesh's x scale: -1 mirrors the bird. */
  mirror: 1 | -1;
};

/**
 * Place the bird in a box.
 *
 * This was the body of the component until the canvas left the hero. It is a
 * function now for two reasons: the fit has to run per frame (a fixed canvas
 * has to follow a cell that scrolls, which a value computed during render
 * cannot do), and from rata 3 it has to run against a *second* box — the
 * contact section's landing spot, at 55% size and mirrored. Hence `scale` and
 * `mirror`; rata 1 calls it with 1 and false, which is a no-op on both.
 *
 * Everything here is unchanged from the in-component version except the two
 * parameters and the names of its inputs.
 */
function fitToRect(input: FitInput, scale = 1, mirror = false): CrowFit {
  const { rect, canvasRect, worldPerPx, dense, isRowLayout, clientWidthPx, canvasWidthPx } = input;
  const canPlaceInViewport = dense !== null && canvasWidthPx > 0 && rect.width > 0;

  // The cell, in world units, and where its centre sits relative to the
  // canvas's. Everything the fit does is expressed against the cell's centre;
  // these two carry the answer back to the canvas's centre, which is where the
  // mesh's position is actually measured from.
  const cellW = rect.width * worldPerPx;
  const cellH = rect.height * worldPerPx;
  const cellDx = (rect.left + rect.width / 2 - (canvasRect.left + canvasRect.width / 2)) * worldPerPx;
  const cellDy = (canvasRect.top + canvasRect.height / 2 - (rect.top + rect.height / 2)) * worldPerPx;

  let meshW: number;
  let xOffset: number;
  let yOffset: number;

  if (!isRowLayout && dense) {
    // Stacked layout — fit the dense body rather than the cloud. The cell is
    // wide and short here, so width is the binding constraint and every unit
    // spent on the sparse tail is a unit the bird does not get. Size the dense
    // box to DENSE_W_OF_CELL of the width, cap it at DENSE_H_MAX_OF_CELL of the
    // height, take whichever scale is smaller, and centre that box — not the
    // plane — in the cell. The tail then hangs off the cell's left edge and
    // runs on into the page's own margin, where it thins out on its own. No
    // CELL_PADDING and no MASS_BIAS budget here: both exist to keep the tail
    // inside, which is no longer the goal.
    const minGap = DENSE_MIN_GAP_PX * worldPerPx;
    // Centred at DENSE_W_OF_CELL the gap is already ~6% of the cell, but on a
    // narrow enough cell 6% is under 16px — then the gap, not the target, sets
    // the width, so the body's right edge never crowds the cell's edge.
    const targetW = Math.min(
      DENSE_W_OF_CELL * cellW,
      Math.max(0, cellW - 2 * minGap)
    );
    const byWidth  = targetW / dense.w;
    const byHeight = (DENSE_H_MAX_OF_CELL * cellH * MESH_ASPECT) / dense.h;
    // `scale` lands here, on the size the fit arrived at, rather than on any
    // of the budgets: the budgets are what the cell can hold, and a bird asked
    // to be 55% of full size still may not be wider than that.
    meshW = Math.min(byWidth, byHeight) * scale;
    const meshHeight = meshW / MESH_ASPECT;
    // Put the dense box's centre on the cell's centre, both axes
    xOffset = -(dense.cx - 0.5) * meshW + cellDx;
    yOffset = -(dense.cy - 0.5) * meshHeight + cellDy;
  } else if (isRowLayout && dense && canPlaceInViewport) {
    // Row layout — the bird is centred on the *viewport*, not on its cell.
    // The cell is the hero grid's right-hand column, so its middle sits well
    // right of the page's middle; centring in it reads as a bird shoved into
    // the corner. The axis is the dense body's own bbox centre (the same
    // measurement the stacked fit uses) so the sparse tail, which is a long
    // horizontal feature, cannot drag the bird off the mark it is aimed at.
    const halfCell = cellW / 2;
    const bodyGap = BODY_MIN_GAP_PX * worldPerPx;

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
    const byHeight   = cellH * (1 - 2 * CELL_PADDING) * MESH_ASPECT;
    const byBodyFit  = Math.max(0, cellW - 2 * bodyGap) / dense.w;
    meshW = Math.min(byViewport, byHeight, byBodyFit) * scale;

    // Target, in the cell's own world coordinates: the viewport's centre line.
    const cellCentrePx = rect.left + rect.width / 2;
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
    // The sparse tail runs left past the body's margin and out of the cell
    // into the text column, where the spill fade brings it in and the exclusion
    // hole keeps it off the copy. Nothing about the tail is allowed to cost the
    // body width — the fade is spent on whatever room the clamp happens to
    // leave, and the clamp answers to the body alone.
    const bodyCentre = place(meshW);

    // Body centre -> plane centre, and cell coordinates -> canvas ones. The
    // vertical reference is still the cell, and the axis is the dense box's
    // centre here too, not the plane's.
    xOffset = bodyCentre - (dense.cx - 0.5) * meshW + cellDx;
    yOffset = -(dense.cy - 0.5) * (meshW / MESH_ASPECT) + cellDy;
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
    const availW = cellW * (1 - 2 * CELL_PADDING);
    const availH = cellH * (1 - 2 * CELL_PADDING);
    meshW = Math.min(availW / (1 + 2 * MASS_BIAS), availH * MESH_ASPECT) * scale;
    xOffset = -MASS_BIAS * meshW + cellDx;
    yOffset = cellDy;
  }

  return { meshW, meshH: meshW / MESH_ASPECT, xOffset, yOffset, mirror: mirror ? -1 : 1 };
}

// Assembly runs this long once started (shader staggers particles within it)
const ASSEMBLY_DURATION = 2.2;
// Preloader covers the screen for 1800ms + 500ms fade — on a hard load, hold
// the assembly until it starts lifting so the flight is actually seen
const PRELOADER_MS = 1750;

// ── S1 ───────────────────────────────────────────────────────────────────────
// The take-off is one shot on a clock, not a scrub: it plays for this long
// once heroProgress crosses TAKEOFF_AT and it is never run backwards.
const TAKEOFF_DURATION = 1.4;
// The only way back to S0, and the only thing that ever is: the assemble's own
// math run from scattered to bird. Shorter than a cold assemble because this
// one is a return, not an entrance.
const CONDENSE_DURATION = 1.2;
// The column mask has to be out of the way before the cloud is even enough for
// its ramp to read as a band across it. It used to open against the scroll
// explode's spread, and the take-off has replaced that, so it opens against
// the take-off's own clock: over its first fraction going out, and over the
// last of the condense coming back, because the tail — the only thing the ramp
// ever touches — is the first to leave and the last to re-form.
const MASK_OPEN_FRACTION = 0.4;

/**
 * cubic-bezier(x1, y1, x2, y2) as a JS function of progress, Newton-Raphson on
 * the x polynomial then a straight evaluation of y. The page's easing is a CSS
 * curve everywhere else; the take-off is driven from a frame loop, so it needs
 * the same curve as a number.
 */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const a = (p1: number, p2: number) => 1 - 3 * p2 + 3 * p1;
  const b = (p1: number, p2: number) => 3 * p2 - 6 * p1;
  const c = (p1: number) => 3 * p1;
  const calc = (t: number, p1: number, p2: number) => ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t;
  const slope = (t: number, p1: number, p2: number) =>
    3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1);
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = calc(t, x1, x2) - x;
      if (Math.abs(err) < 1e-6) break;
      const d = slope(t, x1, x2);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    return calc(t, y1, y2);
  };
}

/**
 * The site's one easing curve. Both control points sit at y=1, so the output
 * is monotonic — it arrives and stops, with nothing to overshoot and come
 * back from. That is the no-bounce rule, held by the shape of the curve
 * rather than by a promise about how it is used.
 */
const easeSite = cubicBezier(0.16, 1, 0.3, 1);

/**
 * Which of the five states the bird is in. Rata 1 ships three of them, plus
 * the transitions between: S0 is `idle`, S1 is `takeoff`, and `gone` is where
 * S2's swarm will pick the cloud up instead of hiding it.
 *
 * A transition always runs to completion — `takeoff` ignores a scroll back up
 * and `condense` ignores a scroll back down. Combined with the gap between
 * TAKEOFF_AT and CONDENSE_AT that is what makes scrubbing across the threshold
 * cost one flight rather than a stutter of half-played ones, and it is also
 * what guarantees the take-off is never seen in reverse: by the time the bird
 * can condense, the take-off has finished and the cloud is invisible, so the
 * jump from the take-off's scatter to the assemble's is a jump between two
 * things nobody is looking at.
 */
type CrowPhase = "idle" | "takeoff" | "gone" | "condense";

function CrowShaderMesh({ anchors, anchorsVersion, scrollRef, mouseRef, isHoveringRef }: {
  anchors: React.RefObject<CrowAnchorMap> | null;
  anchorsVersion: number;
  scrollRef: React.RefObject<CrowScrollState>;
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

  // A cell resize used to re-render this component for free, because the
  // canvas *was* the cell. It is the viewport now, and the cell can change size
  // while the viewport does not — the language toggle reflows the hero copy, a
  // late webfont changes its height, and either moves the row boundary the cell
  // sits on. Watch all three boxes and re-run the fit when they move.
  const [, remeasure] = useState(0);
  useEffect(() => {
    const a = anchors?.current;
    const boxes = [a?.hero, a?.crowCell, a?.heroText].filter((el): el is HTMLElement => !!el);
    if (!boxes.length) return;
    const ro = new ResizeObserver(() => remeasure((n) => n + 1));
    boxes.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
    // anchorsVersion, not the elements: it changes exactly when one of them is
    // swapped, which is the only time this subscription is watching the wrong
    // boxes. Re-running on a route change is what re-attaches it to the new
    // hero without the scene ever unmounting.
  }, [anchors, anchorsVersion]);

  // ── Measurement ────────────────────────────────────────────────────────────
  // Three boxes decide everything: the crow's grid cell (where the bird goes
  // and how big it is), the hero copy (the box the mask must not paint over),
  // and the canvas's own box (the frame both answers come back in).
  //
  // They used to be measured against each other, because the canvas *was* the
  // hero section — so the copy's offset* box was already canvas-local and the
  // cell's rect only had to be offset by the section's. The canvas is fixed to
  // the viewport now, so all three are read in viewport space and converted to
  // canvas-local once, here. The arithmetic downstream is untouched: the hero
  // starts at the top of the page and is at least 100svh tall, so its rect and
  // the viewport's are the same box, and every number lands where it did.
  const isRowLayout = useRowLayout();
  const dense = measureDenseBox(texture.image as HTMLImageElement);

  const readMetrics = (): Metrics => {
    const canvasRect = gl.domElement.getBoundingClientRect();
    const a = anchors?.current;
    const heroEl = a?.hero ?? null;
    const cellEl = a?.crowCell ?? null;
    const textEl = a?.heroText ?? null;
    const heroRect = heroEl ? heroEl.getBoundingClientRect() : null;
    return {
      // No hero on this route. The canvas stays — it is holding the session's
      // only WebGL context — and simply draws nothing.
      hasHero: !!heroEl && !!cellEl,
      canvasRect,
      cellRect: cellEl ? cellEl.getBoundingClientRect() : canvasRect,
      // offsetLeft/Top, not a rect: the text block animates in on a transform,
      // and the mask belongs on the box it settles into, not on the one it is
      // passing through. offset* is measured from the hero section — the
      // block's offsetParent — so the hero's rect is what carries it into
      // viewport space.
      text: textEl && heroRect
        ? {
            left: heroRect.left + textEl.offsetLeft,
            top: heroRect.top + textEl.offsetTop,
            width: textEl.offsetWidth,
            height: textEl.offsetHeight,
          }
        : null,
    };
  };

  // World units per CSS px. Off the canvas's own projection — every
  // px-denominated budget in the fit is converted through it, so the bird's
  // size on screen does not depend on how big the canvas happens to be.
  const worldPerPx = size.width > 0 ? viewport.width / size.width : 0;

  // ── Mask geometry ──────────────────────────────────────────────────────────
  // A canvas larger than the cell can do two things it must not: start out of
  // nowhere at the cell's edge, and draw over the copy. Both are answered by
  // the mask, and both are measured here, in the canvas's own px, off the same
  // boxes the fit used. The stylesheet owns the gradients, this owns the
  // numbers. Nothing here can move the bird — the mask only decides which of
  // its particles are painted.
  const maskFor = (m: Metrics): MaskVars => {
    const cellLeftLocal = m.cellRect.left - m.canvasRect.left;
    const textRight = m.text ? m.text.left + m.text.width - m.canvasRect.left : null;

    // Where the ramp starts, and where it reaches full ink.
    let spillStart: number;
    let spillEnd: number;
    if (!isRowLayout) {
      // Stacked: both ends on the cell's left edge. The ramp is a cut and the
      // page margin stays clear — the framing the old overflow box gave.
      spillStart = cellLeftLocal - STACKED_CUT_PX;
      spillEnd = cellLeftLocal;
    } else if (textRight !== null) {
      // Column: the ramp begins just clear of the copy and climbs from there,
      // so the tail dissolves into the column instead of arriving on an edge —
      // and because nothing at all is painted before it starts, the copy needs
      // no exclusion box, whose own edge was the thing that showed.
      spillStart = textRight + COPY_CLEARANCE_PX;
      spillEnd = Math.max(spillStart + SPILL_RUN_PX, cellLeftLocal + CELL_OVERSHOOT_PX);
    } else {
      // No copy to measure — paint in full rather than vanish
      spillStart = 0;
      spillEnd = 0;
    }

    // The stacked layout's hole, from the same transform-free box. With no
    // text block to read, an empty hole off the top-left corner leaves the
    // layer opaque — the column layout ignores these four entirely.
    const tx = m.text ? m.text.left - m.canvasRect.left : 0;
    const ty = m.text ? m.text.top - m.canvasRect.top : 0;
    return {
      spillStart,
      spillEnd,
      holeL: m.text ? tx - TEXT_CLEARANCE_PX : -9999,
      holeR: m.text ? tx + m.text.width + TEXT_CLEARANCE_PX : -9999,
      holeT: m.text ? ty - TEXT_CLEARANCE_PX : -9999,
      holeB: m.text ? ty + m.text.height + TEXT_CLEARANCE_PX : -9999,
    };
  };

  // ── Placement ──────────────────────────────────────────────────────────────
  // Where the bird is, in one pass: measure, fit, mask, apply. It runs after
  // every render (so the first painted frame is already right) and again from
  // the frame loop for as long as the page is moving, because a fixed canvas
  // over a cell that scrolls has to follow it.
  const fitRef = useRef<CrowFit>({ meshW: 1, meshH: 0.5, xOffset: 0, yOffset: 0, mirror: 1 });
  const lastMask = useRef<MaskVars | null>(null);
  // Held as the string that was written, so a value that rounds to what is
  // already there costs no style write at all.
  const lastMaskOpen = useRef<string | null>(null);

  const holderEl = () => gl.domElement.closest(".crow-canvas") as HTMLElement | null;

  const applyPlacement = () => {
    const m = readMetrics();
    const fit = fitToRect(
      {
        rect: m.cellRect,
        canvasRect: m.canvasRect,
        worldPerPx,
        dense,
        isRowLayout,
        clientWidthPx: document.documentElement.clientWidth,
        canvasWidthPx: size.width,
      },
      // Rata 1 places one bird, at full size, facing the way it was drawn.
      // S3's landed crow is the same call with 0.55 and true.
      1,
      false
    );
    fitRef.current = fit;
    const pts = pointsRef.current;
    if (pts) {
      pts.scale.set(fit.meshW * fit.mirror, fit.meshH, 1);
      pts.position.set(fit.xOffset, fit.yOffset, 0);
    }

    // Publish the mask numbers to the element that carries the mask, and only
    // when they have actually moved — this runs every frame while scrolling.
    const holder = holderEl();
    if (!holder) return;
    const mask = maskFor(m);
    const prev = lastMask.current;
    if (
      prev &&
      prev.spillStart === mask.spillStart && prev.spillEnd === mask.spillEnd &&
      prev.holeL === mask.holeL && prev.holeR === mask.holeR &&
      prev.holeT === mask.holeT && prev.holeB === mask.holeB
    ) return;
    lastMask.current = mask;
    const px = (v: number) => `${v.toFixed(1)}px`;
    holder.style.setProperty("--spill-start", px(mask.spillStart));
    holder.style.setProperty("--spill-end", px(mask.spillEnd));
    holder.style.setProperty("--hole-l", px(mask.holeL));
    holder.style.setProperty("--hole-r", px(mask.holeR));
    holder.style.setProperty("--hole-t", px(mask.holeT));
    holder.style.setProperty("--hole-b", px(mask.holeB));
    // The feather rides along so the clearance and the fade that follows it
    // stay defined next to each other rather than one here and one in the CSS
    holder.style.setProperty("--hole-feather", px(TEXT_FEATHER_PX));
  };

  // Before paint, after every render — a layout the render has just changed is
  // measured and applied in the same frame the change lands in.
  useLayoutEffect(applyPlacement);

  /** How far open the column mask is, written only when it moves. */
  const setMaskOpen = (v: number) => {
    const s = v.toFixed(3);
    if (lastMaskOpen.current === s) return;
    lastMaskOpen.current = s;
    const holder = holderEl();
    if (holder) holder.style.setProperty("--mask-open", s);
  };

  // ── State ──────────────────────────────────────────────────────────────────
  const phase = useRef<CrowPhase>("idle");
  const takeoffT = useRef(0);   // linear 0..1, eased on the way to the uniform
  const condenseT = useRef(0);  // linear 0..1, the assemble's own ramp
  // NaN so the first frame always places, whatever the scroll happens to be.
  const lastPlacedY = useRef(Number.NaN);

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
    uTakeoff:       { value: 0 },
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

  // A new hero — a route change back to the homepage — is a fresh S0. The
  // scene never unmounts now, so nothing else would reset it, and the bird
  // would arrive already assembled where it used to fly in.
  useEffect(() => {
    phase.current = "idle";
    takeoffT.current = 0;
    condenseT.current = 0;
    uniforms.uTakeoff.value = 0;
    uniforms.uAssembly.value = reducedMotion.current ? 1 : 0;
    assemblyDelay.current = null;
    lastPlacedY.current = Number.NaN;
  }, [anchorsVersion, uniforms]);

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
    const points = pointsRef.current;
    const scroll = scrollRef.current;
    const heroProgress = scroll.heroProgress;
    const hasHero = !!anchors?.current.hero && !!anchors.current.crowCell;

    // No hero on this route. The canvas is still here — it is what keeps the
    // session down to one WebGL context across a navigation — but there is
    // nothing to draw and nothing to measure.
    if (!hasHero) {
      if (points) points.visible = false;
      return;
    }

    // A fixed canvas over a cell that scrolls has to follow it. Measuring
    // costs a layout read, so it happens while the page is moving and not
    // otherwise: at rest this is a single float comparison per frame.
    if (scroll.y !== lastPlacedY.current) {
      lastPlacedY.current = scroll.y;
      applyPlacement();
    }

    if (reducedMotion.current) {
      // Static assembled bird, uniforms frozen. It still has to leave when the
      // hero does — the canvas is fixed now, so a bird that stayed visible
      // would ride down the page over the sections below it.
      if (points) points.visible = heroProgress <= TAKEOFF_AT;
      setMaskOpen(0);
      return;
    }

    uniforms.uTime.value += dt;

    // ── S0 → S1 → S0 ────────────────────────────────────────────────────────
    // Each transition runs to completion before the other can start, which is
    // both what keeps a scrub across the threshold from stuttering and what
    // makes "the take-off is never reversed" true by construction.
    switch (phase.current) {
      case "idle":
        if (heroProgress > TAKEOFF_AT) {
          phase.current = "takeoff";
          takeoffT.current = 0;
        }
        break;
      case "takeoff":
        takeoffT.current = Math.min(1, takeoffT.current + dt / TAKEOFF_DURATION);
        uniforms.uTakeoff.value = easeSite(takeoffT.current);
        if (takeoffT.current >= 1) phase.current = "gone";
        break;
      case "gone":
        if (heroProgress < CONDENSE_AT) {
          phase.current = "condense";
          condenseT.current = 0;
          // Back to the bird on the assemble's own math, from nothing. The
          // switch from the take-off's scatter to the assemble's is a jump,
          // and it is invisible: at this point the take-off has run out and
          // every particle's alpha is already 0.
          uniforms.uTakeoff.value = 0;
          uniforms.uAssembly.value = 0;
        }
        break;
      case "condense":
        condenseT.current = Math.min(1, condenseT.current + dt / CONDENSE_DURATION);
        uniforms.uAssembly.value = condenseT.current;
        if (condenseT.current >= 1) phase.current = "idle";
        break;
    }

    // Once the last particle has faded there is nothing left to rasterise.
    if (points) points.visible = phase.current !== "gone";

    // The ramp gets out of the way of a cloud and comes back for a bird. Its
    // driver used to be the scroll explode's spread, computed twice — once in
    // the shader, once in page.tsx — and it is the take-off's own clock now,
    // read where the clock is.
    setMaskOpen(
      phase.current === "takeoff" ? Math.min(1, takeoffT.current / MASK_OPEN_FRACTION)
      : phase.current === "gone" ? 1
      : phase.current === "condense"
        ? 1 - Math.min(1, Math.max(0, (condenseT.current - (1 - MASK_OPEN_FRACTION)) / MASK_OPEN_FRACTION))
      : 0
    );

    if (assemblyDelay.current === null) {
      // On a hard load the preloader still covers the screen — hold the
      // assembly until it starts lifting; on soft navigation start at once
      assemblyDelay.current = Math.max(0, (PRELOADER_MS - performance.now()) / 1000);
    }
    if (assemblyDelay.current > 0) {
      assemblyDelay.current -= dt;
    } else if (phase.current === "idle" && uniforms.uAssembly.value < 1) {
      uniforms.uAssembly.value = Math.min(1, uniforms.uAssembly.value + dt / ASSEMBLY_DURATION);
    }

    hoverTarget.current = isHoveringRef.current ? 1.0 : 0.0;
    uniforms.uHover.value += (hoverTarget.current - uniforms.uHover.value) * 0.1;
    ndcVec.set(mouseRef.current.x, mouseRef.current.y);
    raycaster.setFromCamera(ndcVec, camera);
    if (raycaster.ray.intersectPlane(zPlane, hitVec)) {
      // World → mesh-local: undo the mesh's own transform, both axes, so the
      // repel field stays centred on the body wherever the fit has put it
      const fit = fitRef.current;
      mouseWorld.current.lerp(
        new THREE.Vector2((hitVec.x - fit.xOffset) / fit.meshW, (hitVec.y - fit.yOffset) / fit.meshH),
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

  // No scale or position here: both are written by applyPlacement, which is
  // the only thing that knows where the cell currently is. A prop would be a
  // second answer to that question, right for one frame out of every scrolled
  // one.
  return (
    <points ref={pointsRef}>
      <planeGeometry ref={geometryRef} args={[1, 1, segments, segments]} />
      <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} transparent depthWrite={false} />
    </points>
  );
}

/* ─── CROW SCENE — Canvas wrapper, lazy-loaded by CrowStage ─────────────────── */

export function CrowScene({ anchors, anchorsVersion, scrollRef, tierRef, mouseRef, isHoveringRef }: {
  anchors: React.RefObject<CrowAnchorMap> | null;
  anchorsVersion: number;
  scrollRef: React.RefObject<CrowScrollState>;
  /** Plumbed for rata 2's swarm; nothing in rata 1 reads it. */
  tierRef: React.RefObject<CrowTier>;
  mouseRef: { current: { x: number; y: number } };
  isHoveringRef: { current: boolean };
}) {
  void tierRef;
  return (
    // No fallback fill. It used to be the hero's own background colour behind
    // a hero-sized canvas, which was invisible; this host is the size of the
    // viewport, and the same fill would cover the page while the chunk loads.
    <Suspense fallback={null}>
      <Canvas
        // Absolute inside the fixed stage, so the canvas box is the viewport.
        // It stays out of the pointer's way entirely — the crow's cursor comes
        // from a window listener on the stage, and everything under it has to
        // keep receiving its own events.
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: false }}
      >
        <CrowShaderMesh
          anchors={anchors}
          anchorsVersion={anchorsVersion}
          scrollRef={scrollRef}
          mouseRef={mouseRef}
          isHoveringRef={isHoveringRef}
        />
      </Canvas>
    </Suspense>
  );
}
