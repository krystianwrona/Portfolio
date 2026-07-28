"use client";

import { useLanguage } from "@/context/LanguageContext";
import { SvgOutlineTitle } from "@/components/ui/SvgOutlineTitle";

interface UpNextCardProps {
  href: string;
  projectName: string;
  /** Explicit line breaks, top to bottom. Defaults to [projectName] on one line. */
  titleLines?: string[];
  /** Brand color revealed on hover. Defaults to white when the destination has no distinct accent. */
  brand?: string;
  titleClassName?: string;
}

export function UpNextCard({
  href,
  projectName,
  titleLines,
  brand,
  titleClassName = "text-6xl md:text-9xl",
}: UpNextCardProps) {
  const { t } = useLanguage();

  return (
    <section className="py-[15vh] px-[4vw] bg-[#111111] flex flex-col items-center justify-center min-h-[60vh] border-t border-white/5">
      <div className="text-center mb-8">
        <span className="text-xs uppercase tracking-[0.3em] font-bold text-white/50">{t("case.upnext")}</span>
      </div>
      <a
        href={href}
        aria-label={`${t("case.aria.viewnextproject")} ${projectName}`}
        className="group relative inline-flex items-center justify-center px-8 py-6 md:py-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:ring-offset-[#111111] rounded-lg"
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
        <SvgOutlineTitle
          lines={titleLines ?? [projectName]}
          fillColor="#111111"
          className={`font-sans font-black tracking-[0.01em] ${titleClassName}`}
          strokeWidthClassName="[stroke-width:3px]"
        />
      </a>
    </section>
  );
}
