"use client";

import { useLanguage } from "@/context/LanguageContext";

interface UpNextCardProps {
  href: string;
  projectName: string;
  title: React.ReactNode;
  /** Brand color revealed on hover. Defaults to white when the destination has no distinct accent. */
  brand?: string;
  titleClassName?: string;
}

export function UpNextCard({
  href,
  projectName,
  title,
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
        style={{ ["--next-color" as string]: brand ?? "#FFFFFF" } as React.CSSProperties}
      >
        {/*
          Same two-layer stroke/fill technique as ProjectRow on the homepage
          (src/app/page.tsx) — read the comment there before touching this.
          A static stroked layer sizes the wrapper; an absolutely positioned
          layer painted in THIS section's own background color (#111111)
          sits on top to hide the stroke's rasterization seams. Do not swap
          which layer is absolute. Fill-on-hover is gated behind
          @media(hover:hover): touch devices can't match it, so they stay
          permanently on the resting outlined state — the same mobile
          behavior as ProjectRow.
        */}
        <div className="relative">
          <h2
            aria-hidden="true"
            className={`font-sans font-black tracking-tighter ${titleClassName} [-webkit-text-fill-color:transparent] [-webkit-text-stroke:2px_rgba(255,255,255,0.35)] [transition:-webkit-text-stroke-color_500ms_cubic-bezier(0,0,0.2,1)] [@media(hover:hover)]:group-hover:[-webkit-text-stroke-color:transparent]`}
          >
            {title}
          </h2>
          <h2
            className={`absolute inset-0 pointer-events-none font-sans font-black tracking-tighter ${titleClassName} [-webkit-text-stroke:0px_transparent] [-webkit-text-fill-color:#111111] [transition:-webkit-text-fill-color_500ms_cubic-bezier(0,0,0.2,1)] [@media(hover:hover)]:group-hover:[-webkit-text-fill-color:var(--next-color)]`}
          >
            {title}
          </h2>
        </div>
      </a>
    </section>
  );
}
