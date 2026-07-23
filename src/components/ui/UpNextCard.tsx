"use client";

import { useLanguage } from "@/context/LanguageContext";

interface UpNextCardProps {
  href: string;
  projectName: string;
  title: React.ReactNode;
  /** Brand color revealed on hover. Omit for destinations with no usable accent (e.g. white-branded Folk Culture Center) — card then stays neutral on hover too. */
  brand?: string;
  titleClassName?: string;
  glowOpacity?: number;
}

export function UpNextCard({
  href,
  projectName,
  title,
  brand,
  titleClassName = "text-6xl md:text-9xl",
  glowOpacity = 0.15,
}: UpNextCardProps) {
  const { t } = useLanguage();

  return (
    <section className="py-[15vh] px-[4vw] bg-[#111111] flex flex-col items-center justify-center min-h-[60vh] border-t border-white/5">
      <div className="text-center mb-10">
        <span className="text-[0.65rem] uppercase tracking-widest font-bold text-white/20">{t("case.upnext")}</span>
      </div>
      <a
        href={href}
        aria-label={`${t("case.aria.viewnextproject")} ${projectName}`}
        className="group relative w-full max-w-5xl h-[40vh] rounded-[var(--radius-lg)] overflow-hidden flex items-center justify-center cursor-pointer"
        style={brand ? ({ ["--next-color" as string]: brand } as React.CSSProperties) : undefined}
      >
        {/*
          Same hover-reveal pattern as the homepage ProjectRow: neutral by
          default, brand color only fills in on a real hover-capable pointer
          (gated behind @media(hover:hover) so touch devices — which can't
          match it — stay permanently on the resting neutral state, same as
          ProjectRow's text-fill swap).
        */}
        <div
          className={`absolute inset-0 z-0 bg-[#161616] border border-white/10 group-hover:scale-105 [transition:background-color_500ms_cubic-bezier(0,0,0.2,1),border-color_500ms_cubic-bezier(0,0,0.2,1),transform_1000ms_ease]${
            brand ? " [@media(hover:hover)]:group-hover:bg-[var(--next-color)] [@media(hover:hover)]:group-hover:border-transparent" : ""
          }`}
        >
          <div
            className="w-full h-full opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity duration-700 blur-xl mix-blend-overlay"
            style={{ backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,${glowOpacity}), transparent 60%)` }}
          />
        </div>
        <div className="relative z-10 text-center">
          <h2 className={`font-sans font-black text-white tracking-tighter ${titleClassName}`}>
            {title}
          </h2>
        </div>
      </a>
    </section>
  );
}
