"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useCrowAnchors, useCrowAnchorsVersion } from "./CrowAnchors";
import { TAKEOFF_AT, useCrowNarrator } from "./useCrowNarrator";

// Three.js/@react-three still travels in its own chunk, fetched on the client
// after first paint. `loading` is null rather than the hero-coloured block it
// used to be: that block was the size of the hero and sat behind the copy, and
// this host is the size of the viewport — the same fill here would paint over
// the whole page while the chunk arrived.
const CrowScene = dynamic(() => import("@/components/CrowScene").then((m) => m.CrowScene), {
  ssr: false,
  loading: () => null,
});

/**
 * The crow's canvas, hoisted out of the hero and into the root layout.
 *
 * One host, one canvas, one WebGL context, for the whole session — including
 * across route changes, which is the point: from rata 2 the cloud has to
 * survive a navigation it used to be destroyed by. Nothing about where the
 * bird is drawn lives here; the scene still measures the hero's own boxes
 * (see CrowAnchors) and places itself against them.
 *
 * ── z-index ──────────────────────────────────────────────────────────────
 * 5. The host is fixed, so it is a positioned box in the root stacking
 * context, and it has to land in the one gap in the page's z scale:
 *
 *   above  <main>'s background and all of its in-flow content, which paint
 *          below every positioned box — this is where the bird was already,
 *          when it was a z-10 layer inside the hero;
 *   below  every positioned box the page gives a z-index to, all of which are
 *          higher: the hero copy (30), #projects and #about (20), #contact
 *          (30), the navbar (200), the cursor (9998/9999), the noise overlay
 *          (99999) and the preloader.
 *
 * Any value in 1..19 does that. 5 is low in the gap on purpose: it leaves room
 * for a later crow-adjacent layer to sit between the bird and the copy without
 * having to renumber the page. Do not raise it past 19 — #projects would go
 * behind the bird. Verified with getComputedStyle, not by reading the classes:
 * see the diagnostics dump in the rata 1 verification run.
 */
export function CrowStage() {
  const { t } = useLanguage();
  const ctx = useCrowAnchors();
  // Re-renders when the page mounts or unmounts its anchors, which is exactly
  // when "is there a bird on this route" changes.
  const version = useCrowAnchorsVersion();
  const narrator = useCrowNarrator(ctx?.anchors ?? null);

  const stageRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isHoveringRef = useRef(false);

  const hasHero = !!ctx?.anchors.current.hero;

  // Cursor tracking, moved off the hero section and onto the window. The
  // section's own handlers could not survive the canvas leaving it, and the
  // window is the honest source anyway: the pointer's NDC is taken against
  // this host's box, which is the box the canvas is stretched over.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onMove = (e: PointerEvent) => {
      // Touch is deliberately not a cursor. Today a touch moves nothing —
      // the hero listened for mousemove — and rata 1 changes no touch
      // behaviour; DeviceOrientation is a later rata's problem.
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      // Past the take-off the bird is gone, and a repel field aimed at a
      // cloud that is not there is work for nothing.
      if (narrator.scrollRef.current.heroProgress >= TAKEOFF_AT) {
        isHoveringRef.current = false;
        return;
      }
      const r = stage.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      mouseRef.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      isHoveringRef.current = true;
    };
    const onLeave = () => { isHoveringRef.current = false; };

    window.addEventListener("pointermove", onMove, { passive: true });
    // Leaving the document entirely, or the tab losing focus, both end the
    // hover — otherwise the head keeps following a cursor that is elsewhere.
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [narrator]);

  return (
    <div
      ref={stageRef}
      // Described to assistive tech only where there is something to describe.
      // On a case study route the canvas is still here, holding its context,
      // but it draws nothing, and an image with a name and no picture is worse
      // than no image at all.
      {...(hasHero
        ? { role: "img" as const, "aria-label": t("hero.aria.crow") }
        : { "aria-hidden": true as const })}
      className="crow-canvas pointer-events-none fixed inset-0 z-[5]"
    >
      <CrowScene
        anchors={ctx?.anchors ?? null}
        anchorsVersion={version}
        scrollRef={narrator.scrollRef}
        tierRef={narrator.tierRef}
        mouseRef={mouseRef}
        isHoveringRef={isHoveringRef}
      />
    </div>
  );
}
