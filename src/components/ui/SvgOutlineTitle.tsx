"use client";

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";

export interface SvgOutlineTitleHandle {
  /**
   * Width of the widest line per 1px of font-size. Text advance widths scale
   * linearly with font-size, so this ratio is the same whatever size it was
   * measured at — which is what lets a caller solve for the font-size that
   * makes the title fit a known width, in one pass, without trial rendering.
   */
  ratio: () => number;
  /** Re-measure and rewrite the SVG's own box. Call after changing the font-size. */
  sync: () => void;
}

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
   * half reads as the visible outline).
   */
  strokeWidthClassName: string;
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
// SVG <text> doesn't auto-wrap or auto-size to its content the way HTML text
// does, so both are done by hand here: `lines` gives explicit pre-authored
// line breaks (see titleLines in lib/projects.ts), and this component measures
// the rendered text via getBBox() after every layout change and writes
// matching viewBox/width/height attributes directly to the DOM (bypassing
// React state — this only needs to keep the SVG's own box in sync with its
// content, never triggers a component re-render).
//
// Font-size itself is CSS, set by the caller. Where several titles have to
// agree on one size, the caller drives it through the handle above: read
// `ratio()`, solve for the size, then `sync()`. See ProjectTitleFit.tsx.
export const SvgOutlineTitle = forwardRef<SvgOutlineTitleHandle, SvgOutlineTitleProps>(
  function SvgOutlineTitle(
    { lines, fillColor, className, strokeWidthClassName, svgClassName = "" },
    handleRef,
  ) {
    const svgRef = useRef<SVGSVGElement>(null);
    const textRef = useRef<SVGTextElement>(null);

    // Both entry points share one measurement, so the handle and the internal
    // ResizeObserver can never disagree about the box.
    const measure = () => {
      const svg = svgRef.current;
      const text = textRef.current;
      if (!svg || !text) return;

      // All tspans start at x=0, so the <text> bbox width IS the widest line.
      const bbox = text.getBBox();
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

    useImperativeHandle(handleRef, () => ({
      ratio: () => {
        const text = textRef.current;
        if (!text) return 0;
        const fontSize = parseFloat(getComputedStyle(text).fontSize);
        if (!fontSize) return 0;
        return text.getBBox().width / fontSize;
      },
      sync: measure,
    }));

    useLayoutEffect(() => {
      const svg = svgRef.current;
      if (!svg) return;
      // Keeps standalone instances (no external size controller, e.g.
      // UpNextCard) self-sizing across breakpoint font-size changes. Instances
      // driven through the handle get their sync() call before paint and this
      // is then just an idempotent second opinion.
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(svg.parentElement ?? svg);
      return () => ro.disconnect();
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
  },
);
