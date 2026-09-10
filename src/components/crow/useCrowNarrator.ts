"use client";

import { useEffect, useMemo, useRef } from "react";
import { useLenis } from "lenis/react";
import type { CrowAnchorMap } from "./CrowAnchors";

/**
 * The scroll position, as the crow needs it. One subscription feeds this, and
 * every consumer reads the same object — a second listener could only disagree
 * with the first about how far down the page we are.
 */
export type CrowScrollState = {
  /** Lenis's animated scroll position in px, not window.scrollY. */
  y: number;
  /** Signed px per frame. Zero when the page is still. */
  velocity: number;
  /** The hero's own height, the denominator below. */
  heroHeight: number;
  /** y / heroHeight. 0 at the top of the hero, 1 one hero-height down. */
  heroProgress: number;
};

/**
 * How much motion the device has earned. Nothing consumes this yet — S2's
 * swarm is the first state cheap enough to be worth switching off, and it
 * does not exist. It is measured from rata 1 so the numbers are already
 * honest by the time something reads them.
 */
export type CrowTier = "full" | "reduced";

export type CrowNarrator = {
  scrollRef: React.RefObject<CrowScrollState>;
  tierRef: React.RefObject<CrowTier>;
};

/**
 * heroProgress at which S0 hands the bird over to S1's take-off, and the lower
 * edge of the band it condenses back across.
 *
 * They are not the same number on purpose. A single threshold would let a
 * page resting within a pixel of it run take-off, condense, take-off... — each
 * one to completion, since neither transition can be interrupted, so the bird
 * would loop for as long as the reader held still. The gap is what makes
 * scrubbing across 12% cost one take-off and one condense, and no more.
 */
export const TAKEOFF_AT = 0.12;
export const CONDENSE_AT = 0.1;

// Below this median, for this long, the device is not keeping up.
const FPS_DROP_BELOW = 50;
const FPS_DROP_WINDOW_MS = 2000;
// ...and it has to hold this much better, for this much longer, to earn the
// full tier back. The asymmetry is the hysteresis: without it a device sitting
// at 50fps would flip tiers several times a second, and every flip is a
// visible change of what is on screen.
const FPS_RECOVER_ABOVE = 55;
const FPS_RECOVER_WINDOW_MS = 5000;
// Sorting the frame buffer every frame to find a median would itself cost
// frames. Four times a second is far finer than the windows above.
const FPS_EVAL_EVERY_MS = 250;

function median(sorted: number[]): number {
  const n = sorted.length;
  if (!n) return 0;
  const mid = n >> 1;
  return n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * The crow's single source of scroll truth, plus a frame-rate tier.
 *
 * Lives in the stage rather than in the scene: the stage is a plain React
 * component under the Lenis provider, while the scene runs inside the
 * react-three-fiber reconciler, where the provider's context does not reach.
 */
export function useCrowNarrator(anchors: React.RefObject<CrowAnchorMap> | null): CrowNarrator {
  const scrollRef = useRef<CrowScrollState>({
    y: 0,
    velocity: 0,
    heroHeight: 0,
    heroProgress: 0,
  });
  const tierRef = useRef<CrowTier>("full");
  // Measured off the layout rather than read per scroll event: offsetHeight is
  // a layout read, and the hero's height changes when the layout changes, not
  // when the page moves.
  const heroHeightRef = useRef(0);

  const write = (y: number, velocity: number) => {
    const heroHeight = heroHeightRef.current;
    const s = scrollRef.current;
    s.y = y;
    s.velocity = velocity;
    s.heroHeight = heroHeight;
    // No hero on this route means no hero to be a fraction of. 0 keeps every
    // consumer in the "still in the hero" branch, which is the branch that
    // draws nothing when there is also no cell to draw into.
    s.heroProgress = heroHeight > 0 ? y / heroHeight : 0;
  };

  // The one subscription. Lenis emits for smooth and native scrolling alike
  // (its own native-scroll handler re-emits), so this stays correct when
  // smoothWheel is off under reduced motion.
  useLenis((lenis) => {
    write(lenis.scroll, lenis.velocity);
  }, []);

  const lenis = useLenis();

  // Hero height: whatever the layout currently says, kept fresh by an observer
  // on the element itself plus a window resize for the cases the observer
  // cannot see (a viewport change that leaves the box alone).
  useEffect(() => {
    let raf = 0;
    const sync = () => {
      const hero = anchors?.current.hero ?? null;
      const next = hero ? hero.offsetHeight : 0;
      if (next === heroHeightRef.current) return;
      heroHeightRef.current = next;
      write(lenis?.scroll ?? window.scrollY, lenis?.velocity ?? 0);
    };
    // The anchor can be registered after this effect runs (the page commits
    // its refs in the same pass), so take a look on the next frame too.
    sync();
    raf = requestAnimationFrame(sync);

    const hero = anchors?.current.hero ?? null;
    const ro = new ResizeObserver(sync);
    if (hero) ro.observe(hero);
    window.addEventListener("resize", sync);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
    // anchors is a stable ref object, so this subscribes once per Lenis
    // instance and the sync below always reads whatever is current in it.
  }, [anchors, lenis]);

  // Frame-rate sampling. Its own rAF rather than a hook into the scene's
  // frame loop, because the tier has to keep meaning something on routes
  // where the scene is drawing nothing at all.
  useEffect(() => {
    let raf = 0;
    let stamps: number[] = [];
    let lastEval = 0;
    let recoveringSince = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (document.hidden) {
        // A backgrounded tab throttles rAF to a crawl. Those gaps are not the
        // device failing to keep up, so drop the history rather than let it
        // condemn the tier on return.
        stamps = [];
        return;
      }
      stamps.push(now);
      const keepFrom = now - Math.max(FPS_DROP_WINDOW_MS, FPS_RECOVER_WINDOW_MS);
      let drop = 0;
      while (drop < stamps.length && stamps[drop] < keepFrom) drop++;
      if (drop) stamps.splice(0, drop);

      if (now - lastEval < FPS_EVAL_EVERY_MS) return;
      lastEval = now;

      const fpsOver = (windowMs: number) => {
        const from = now - windowMs;
        const start = stamps.findIndex((t) => t >= from);
        if (start < 0 || stamps.length - start < 2) return null;
        // Not enough history yet to make a claim about this window.
        if (stamps[start] > from + FPS_EVAL_EVERY_MS) return null;
        const deltas: number[] = [];
        for (let i = start + 1; i < stamps.length; i++) deltas.push(stamps[i] - stamps[i - 1]);
        deltas.sort((a, b) => a - b);
        const m = median(deltas);
        return m > 0 ? 1000 / m : null;
      };

      if (tierRef.current === "full") {
        const fps = fpsOver(FPS_DROP_WINDOW_MS);
        if (fps !== null && fps < FPS_DROP_BELOW) {
          tierRef.current = "reduced";
          recoveringSince = now;
        }
      } else {
        const fps = fpsOver(FPS_RECOVER_WINDOW_MS);
        if (fps === null || fps <= FPS_RECOVER_ABOVE) {
          recoveringSince = now;
        } else if (now - recoveringSince >= FPS_RECOVER_WINDOW_MS) {
          tierRef.current = "full";
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return useMemo(() => ({ scrollRef, tierRef }), []);
}
