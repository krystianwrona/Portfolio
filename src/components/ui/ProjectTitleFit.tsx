"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

// One shared font-size for every homepage project title, derived from the
// width the layout actually leaves for a title — not from a per-tier scale
// table.
//
// The old mechanism mixed units it could never reconcile: the title's
// font-size came from vw, the category label's from a fixed px font-size, and
// the two were talked into fitting by hand-tuned per-project multipliers
// (titleScale / titleScaleLg). A px label and a vw title only agree at the
// widths someone measured; between them the title grew into the label's space
// and the two collided.
//
// The replacement has two halves, and both are needed:
//   1. Layout (ProjectRow): the category label owns a reserved grid column, so
//      the title's column is the *remainder*. The title can no longer be
//      sized into the label's space, whatever font-size it ends up with.
//   2. Sizing (this file): each row reports how wide its widest line is per 1px
//      of font-size — a pure, font-size-independent ratio, measured from the
//      real rendered glyphs — plus the width its own title column currently
//      has. The binding row is whichever one runs out of room first, and its
//      exact-fit size becomes the size for all five. Continuous in viewport
//      width, with no breakpoint table anywhere in the calculation.
//
// Every title reads at the same size because there is literally one number:
// `--project-title-size`, written on the list container.

/**
 * Fixed gutter (px) held between the widest line and the reserved label
 * column. Also absorbs the outward half of the SVG stroke, which getBBox()
 * doesn't report.
 */
const GUTTER_PX = 12;
/** Floor, so a pathologically narrow container can never produce a 0px title. */
const MIN_FONT_PX = 12;
/** Sub-pixel churn is ignored, so a ResizeObserver pass can't chase its own tail. */
const EPSILON_PX = 0.25;

export interface TitleFitRow {
  /** Width of the widest line per 1px of font-size — independent of the size it was measured at. */
  ratio: () => number;
  /** The element whose width the title has to fit inside. */
  box: () => HTMLElement | null;
  /** Re-sync this title's own SVG box after the shared font-size changed. */
  sync: () => void;
}

interface TitleFitContextValue {
  register: (row: TitleFitRow) => () => void;
  /** Recompute the shared size now, synchronously. */
  fit: () => void;
}

const TitleFitContext = createContext<TitleFitContextValue | null>(null);

export function useTitleFit() {
  return useContext(TitleFitContext);
}

export function ProjectTitleFitProvider({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef(new Set<TitleFitRow>());
  const appliedRef = useRef(0);

  const fit = useCallback(() => {
    const host = hostRef.current;
    if (!host || rowsRef.current.size === 0) return;

    // The smallest exact-fit across the five rows wins: a size that fits the
    // binding row fits every other row by construction.
    let size = Infinity;
    for (const row of rowsRef.current) {
      const ratio = row.ratio();
      const box = row.box();
      if (!ratio || !box) continue;
      const available = box.getBoundingClientRect().width - GUTTER_PX;
      size = Math.min(size, available / ratio);
    }
    if (!Number.isFinite(size)) return;
    size = Math.max(MIN_FONT_PX, size);

    if (Math.abs(size - appliedRef.current) > EPSILON_PX) {
      appliedRef.current = size;
      host.style.setProperty("--project-title-size", `${size}px`);
    }
    // Always re-sync: a row's own viewBox can be stale (language switch,
    // line-break flip) even when the shared size didn't move.
    for (const row of rowsRef.current) row.sync();
  }, []);

  const register = useCallback((row: TitleFitRow) => {
    rowsRef.current.add(row);
    return () => {
      rowsRef.current.delete(row);
    };
  }, []);

  useLayoutEffect(() => {
    // This runs after every descendant's refs are attached and their layout
    // effects have run (React commits layout effects bottom-up), so all five
    // rows are registered and measurable here — and it runs before the
    // browser paints, which is what keeps the measure-then-size pass from
    // showing as a layout shift. See the note in ProjectRow.
    fit();

    let alive = true;
    // Glyph metrics move when the display face swaps in for the fallback, so
    // the first measurement can be against the wrong font.
    document.fonts?.ready.then(() => {
      if (alive) fit();
    });

    // Observing the title columns (not just the host) is what makes this
    // continuous: they change with viewport width AND when the category
    // labels re-wrap — e.g. on a PL/EN switch, where the host width is
    // unchanged but the reserved label column's content is not.
    const ro = new ResizeObserver(() => fit());
    if (hostRef.current) ro.observe(hostRef.current);
    for (const row of rowsRef.current) {
      const box = row.box();
      if (box) ro.observe(box);
    }
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [fit]);

  const value = useMemo(() => ({ register, fit }), [register, fit]);

  return (
    <TitleFitContext.Provider value={value}>
      <div ref={hostRef} className={className}>
        {children}
      </div>
    </TitleFitContext.Provider>
  );
}
