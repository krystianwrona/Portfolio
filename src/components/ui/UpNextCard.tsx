"use client";

import { useLayoutEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { SvgOutlineTitle, type SvgOutlineTitleHandle } from "@/components/ui/SvgOutlineTitle";

/** Breathing room (px) kept between the widest line and the container edge. Also
 *  absorbs the outward half of the stroke, which getBBox() doesn't report. */
const GUTTER_PX = 12;
/** Floor, so a pathologically narrow container can never produce a 0px title. */
const MIN_FONT_PX = 20;
/** Sub-pixel churn is ignored, so a ResizeObserver pass can't chase its own tail. */
const EPSILON_PX = 0.25;

interface UpNextCardProps {
  href: string;
  projectName: string;
  /** Explicit line breaks, top to bottom. Defaults to [projectName] on one line. */
  titleLines?: string[];
  /** Brand color revealed on hover. Defaults to white when the destination has no distinct accent. */
  brand?: string;
  /** Upper bound for the fitted font-size (px). The title only ever shrinks from here. */
  maxFontPx?: number;
}

// An SVG <text> has no intrinsic wrapping, so SvgOutlineTitle writes its own
// width/height from getBBox() — a hard pixel box that does NOT shrink to fit a
// container the way HTML text does. That box plus this link's horizontal
// padding used to be a fixed width at every viewport (439px for "Ania
// Kampania"), so on any phone narrower than that the link overflowed the
// viewport and made the whole document horizontally pannable. `overflow-x:
// hidden` on <body> did not contain it: that value propagates to the viewport
// and leaves body itself visible, and mobile browsers still pan the visual
// viewport regardless.
//
// The size is therefore solved rather than hand-tuned per call site (the old
// `titleClassName="text-5xl md:text-9xl"` guesses only held at the widths
// someone happened to check). SvgOutlineTitle already exposes exactly what's
// needed for this — see the note on its handle, and ProjectTitleFit.tsx, which
// does the same thing for the five homepage rows: `ratio()` is the widest
// line's width per 1px of font-size, so the exact-fit size is one division, no
// trial rendering and no breakpoint table.
export function UpNextCard({
  href,
  projectName,
  titleLines,
  brand,
  maxFontPx = 128, // text-9xl — the size these titles have always rendered at on desktop
}: UpNextCardProps) {
  const { t } = useLanguage();
  const boxRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const titleRef = useRef<SvgOutlineTitleHandle>(null);
  const appliedRef = useRef(0);

  const lineKey = (titleLines ?? [projectName]).join("|");

  useLayoutEffect(() => {
    const fit = () => {
      const box = boxRef.current;
      const link = linkRef.current;
      const title = titleRef.current;
      if (!box || !link || !title) return;

      const ratio = title.ratio();
      if (!ratio) return;

      // The link's own padding is part of what has to fit, and it changes at
      // the sm breakpoint — read it rather than hard-coding either value.
      const cs = getComputedStyle(link);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const available = box.getBoundingClientRect().width - padX - GUTTER_PX;

      const size = Math.max(MIN_FONT_PX, Math.min(maxFontPx, available / ratio));
      if (Math.abs(size - appliedRef.current) > EPSILON_PX) {
        appliedRef.current = size;
        link.style.setProperty("--upnext-title-size", `${size}px`);
      }
      // Always re-sync: the SVG's own viewBox can be stale (language switch,
      // font swap) even when the fitted size didn't move.
      title.sync();
    };

    fit();

    let alive = true;
    // Glyph metrics move when the display face swaps in for the fallback, so
    // the first measurement can be against the wrong font.
    document.fonts?.ready.then(() => {
      if (alive) fit();
    });

    const ro = new ResizeObserver(fit);
    if (boxRef.current) ro.observe(boxRef.current);
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [maxFontPx, lineKey]);

  return (
    <section className="py-[15vh] px-[4vw] bg-[#111111] flex flex-col items-center justify-center min-h-[60vh] border-t border-white/5">
      <div className="text-center mb-8">
        <span className="text-xs uppercase tracking-[0.3em] font-bold text-white/50">{t("case.upnext")}</span>
      </div>
      <div ref={boxRef} className="w-full flex justify-center">
      <a
        ref={linkRef}
        href={href}
        aria-label={`${t("case.aria.viewnextproject")} ${projectName}`}
        className="group relative inline-flex max-w-full items-center justify-center px-4 sm:px-8 py-6 md:py-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:ring-offset-[#111111] rounded-lg"
        style={{
          ["--next-color" as string]: brand ?? "#FFFFFF",
          ["--title-hover-color" as string]: brand ?? "#FFFFFF",
        } as React.CSSProperties}
      >
        {/*
          Same SvgOutlineTitle technique as ProjectRow on the homepage
          (src/app/page.tsx / src/components/ui/SvgOutlineTitle.tsx) — read
          the comment there before touching this. paint-order="stroke"
          strokes and fills the same SVG path in one pass, so there's no
          seam to hide and no separate covering layer needed. Fill/stroke
          color on hover is gated behind @media(hover:hover): touch devices
          can't match it, so they stay permanently on the resting outlined
          state — the same mobile behavior as ProjectRow.
        */}
        <span className="sr-only">{projectName}</span>
        {/*
          The clamp() is only the pre-JS fallback: it is deliberately
          conservative so the title cannot overflow even in the one frame
          before useLayoutEffect solves the real size (and if JS never runs).
        */}
        <SvgOutlineTitle
          ref={titleRef}
          lines={titleLines ?? [projectName]}
          fillColor="#111111"
          className="font-sans font-black tracking-[0.01em] [font-size:var(--upnext-title-size,clamp(1.75rem,7vw,8rem))]"
          strokeWidthClassName="[stroke-width:3px]"
        />
      </a>
      </div>
    </section>
  );
}
