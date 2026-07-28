"use client";

import { useLayoutEffect, useRef } from "react";

interface SvgOutlineTitleProps {
  /** One or more lines, top to bottom. SVG <text> doesn't wrap on its own. */
  lines: string[];
  /** Exact background color behind the title — the fill covers the inner half of the stroke with this. */
  fillColor: string;
  /** Font family/weight/tracking/size classes, applied to the <text> element. May include breakpoint prefixes. */
  className: string;
  /**
   * Literal Tailwind arbitrary-value class controlling the TOTAL stroke width
   * (paint-order="stroke" + fill covering the inner half means only the outer
   * half reads as the visible outline). Caller-supplied so titleScale/auto-fit
   * calc() expressions stay next to the font-size ones they must track.
   */
  strokeWidthClassName: string;
  /**
   * Available-width container to shrink against (same role the old
   * scrollWidth/clientWidth check played) — set only where overflow is a
   * real risk. When omitted the title always renders at its natural size.
   */
  fitContainerRef?: React.RefObject<HTMLElement | null>;
  svgClassName?: string;
}

// Montserrat Black's thick strokes and tight counters exposed a structural
// hole in the old two-layer HTML trick (see page.tsx git history): a plain
// solid fill on top can only cover seams inside a glyph's own silhouette,
// never inside a counter or between two adjacent glyphs' stroke rings.
// paint-order="stroke" sidesteps the whole problem by construction — the
// browser strokes and fills the SAME path in one coherent pass (real path
// stroking, not two independently-antialiased DOM layers), so there is no
// seam to cover in the first place. stroke-width is set to double the
// intended visible width; the fill (opaque, background-colored) paints over
// the inner half, leaving only the outward half visible as the outline.
//
// SVG <text> doesn't auto-wrap or auto-size to its content the way HTML
// text does, so both are done by hand here: `lines` gives explicit
// pre-authored line breaks (see titleLines in lib/projects.ts), and this
// component measures the rendered text via getBBox() after every layout
// change and writes matching viewBox/width/height attributes directly to
// the DOM (bypassing React state — this only needs to keep the SVG's own
// box in sync with its content, never triggers a component re-render).
// This is "width-based sizing": the actual responsive sizing is CSS
// font-size (same --title-scale/--auto-fit calc() formulas as before, now
// applied to <text> instead of <h3>); viewBox is kept in lockstep with
// whatever that measures to, not used to stretch a fixed aspect ratio.
export function SvgOutlineTitle({
  lines,
  fillColor,
  className,
  strokeWidthClassName,
  fitContainerRef,
  svgClassName = "",
}: SvgOutlineTitleProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<SVGTextElement>(null);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const text = textRef.current;
    if (!svg || !text) return;

    const measure = () => {
      if (fitContainerRef?.current) {
        svg.style.setProperty("--auto-fit", "1");
      }
      let bbox = text.getBBox();

      if (fitContainerRef?.current) {
        const available = fitContainerRef.current.clientWidth;
        const scale = bbox.width > available
          ? Math.max(0.4, (available / bbox.width) * 0.98)
          : 1;
        svg.style.setProperty("--auto-fit", String(scale));
        bbox = text.getBBox();
      }

      const strokeTotal = parseFloat(getComputedStyle(text).strokeWidth) || 0;
      const outward = strokeTotal / 2;
      const x = bbox.x - outward;
      const y = bbox.y - outward;
      const w = bbox.width + outward * 2;
      const h = bbox.height + outward * 2;

      svg.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
    };

    // Deliberately NOT calling measure() synchronously here: React fires
    // layout effects bottom-up within a commit, so this (a descendant of
    // the div fitContainerRef points to) runs before that ancestor's own
    // ref is attached — fitContainerRef.current would read null at this
    // exact point. A deferred call (setTimeout 0) always runs on a later
    // task, by which point the whole commit — including the ancestor's ref
    // — has settled, so it's the one place safe to read fitContainerRef
    // for the very first measurement; it lands before the next paint in
    // practice, so there's no visible flash. ResizeObserver then takes
    // over for every measurement after that, on real size changes.
    const target = fitContainerRef?.current ?? svg.parentElement ?? svg;
    const initial = setTimeout(measure, 0);
    const ro = new ResizeObserver(measure);
    ro.observe(target);
    return () => {
      clearTimeout(initial);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.join("|")]);

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className={svgClassName}
      style={{ display: "block", overflow: "visible" }}
    >
      <text
        ref={textRef}
        x="0"
        y="0"
        style={{ paintOrder: "stroke", ["--outline-fill" as string]: fillColor }}
        className={`${className} ${strokeWidthClassName} [fill:var(--outline-fill)] [stroke:rgba(255,255,255,0.35)] [stroke-linejoin:round] [transition:fill_500ms_cubic-bezier(0,0,0.2,1),stroke_500ms_cubic-bezier(0,0,0.2,1)] [@media(hover:hover)]:group-hover:[fill:var(--title-hover-color)] [@media(hover:hover)]:group-hover:[stroke:var(--title-hover-color)]`}
      >
        {lines.map((line, i) => (
          <tspan key={i} x="0" dy={i === 0 ? "1em" : "1.2em"}>
            {line}
          </tspan>
        ))}
      </text>
    </svg>
  );
}
