"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { PROJECTS } from "@/lib/projects";
import { UpNextCard } from "@/components/ui/UpNextCard";

const BRAND = PROJECTS["ania-kampania"].brand;

type SlideType = "macbook" | "flat" | "mobile";

// ─────────────────────────────────────────────────────────────────────────────
// THE FUNNEL — the only place in this case study where a price appears.
//
// Four rungs of ascending commitment, each priced on a deliberately different
// model (fixed / fixed / from / per-person-per-day) — that difference IS the
// point being made, so the rungs carry their pricing shape, not just a number.
//
// The ebook rung is a RANGE because it covers two separately priced routes —
// "Pełny dzień w sercu Neapolu" (49 zł) and "Wieczór w sercu Neapolu" (39 zł) —
// both at a premiere price that ends 2026-08-31, after which each rises by 20 zł
// (→ 69 / 59, hence the 59–69 zł in the note). That dated step-up is the whole
// reason this rung carries a note: it is a pricing decision, not a discount.
//   ⚠ AFTER 2026-08-31 this rung and its note both go stale — the amount becomes
//   59–69 zł and the note has to change or go.
//
// ⚠ These are the CLIENT's prices, and they live in a different repo. They have
// been revised downward once since launch already. Re-check them against
// aniakampania.pl (offer section) and aniakampania.pl/sklep periodically — a
// stale price here is a factual error in a portfolio piece, not a typo.
//   Last verified against the live site: 2026-08-02.
//
// `from` and `unit` are translation keys, not literals: "from"/"od" and
// "/person/day"/"/os./dzień" differ per language, while the amounts do not.
// ─────────────────────────────────────────────────────────────────────────────
const FUNNEL: {
  key: string;
  amount: string;
  from?: boolean;
  unitKey?: string;
  noteKey?: string;
}[] = [
  { key: "ebook",    amount: "39–49 zł", noteKey: "aniak.funnel.ebook.note" },
  { key: "espresso", amount: "149 zł" },
  { key: "projekt",  amount: "499 zł", from: true },
  { key: "opieka",   amount: "100 €",  from: true, unitKey: "aniak.funnel.perday" },
];

const SLIDES: { src: string; labelKey: string; altKey: string; type: SlideType }[] = [
  { src: "/ania-hero.png",       labelKey: "aniak.slide.hero",       altKey: "aniak.alt.hero",       type: "macbook" },
  { src: "/ania-manifest.png",   labelKey: "aniak.slide.brandstory", altKey: "aniak.alt.brandstory", type: "macbook" },
  { src: "/ania-gallery.png",    labelKey: "aniak.slide.gallery",    altKey: "aniak.alt.gallery",    type: "macbook" },
  { src: "/ania-packages.png",   labelKey: "aniak.slide.packages",   altKey: "aniak.alt.packages",   type: "macbook" },
  { src: "/ania-booking.png",    labelKey: "aniak.slide.booking",    altKey: "aniak.alt.booking",    type: "macbook" },
  { src: "/ania-mobile.png",     labelKey: "aniak.slide.mobile",     altKey: "aniak.alt.mobile",     type: "mobile"  },
];

export default function AniaKampaniaCaseStudy() {
  const router = useRouter();
  const containerRef = useRef<HTMLElement>(null);
  const [isExiting, setIsExiting] = useState(false);
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  // Carousel
  const [activeSlide, setActiveSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pointerDownX = useRef(0);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const lightboxCloseBtnRef = useRef<HTMLButtonElement>(null);
  const lightboxTriggerRef = useRef<HTMLElement | null>(null);

  // Media availability — checked at runtime so the carousel activates
  // automatically once real files land in /public/, no code change needed.
  const [mediaStatus, setMediaStatus] = useState<"checking" | "ok" | "missing">("checking");

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      SLIDES.map(
        (slide) =>
          new Promise<boolean>((resolve) => {
            const img = new window.Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = slide.src;
          })
      )
    ).then((results) => {
      if (!cancelled) setMediaStatus(results.every(Boolean) ? "ok" : "missing");
    });
    return () => { cancelled = true; };
  }, []);

  // Track active slide via IntersectionObserver
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const observers: IntersectionObserver[] = [];
    slideRefs.current.forEach((slide, i) => {
      if (!slide) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSlide(i); },
        { root: carousel, threshold: 0.5 }
      );
      obs.observe(slide);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollToSlide = useCallback((index: number) => {
    const slide = slideRefs.current[index];
    const carousel = carouselRef.current;
    if (slide && carousel) {
      const scrollPL = parseFloat(getComputedStyle(carousel).scrollPaddingLeft) || carousel.clientWidth * 0.04;
      const scrollTarget =
        carousel.scrollLeft +
        slide.getBoundingClientRect().left -
        carousel.getBoundingClientRect().left -
        scrollPL;
      carousel.scrollTo({ left: Math.max(0, scrollTarget), behavior: "smooth" });
    }
  }, []);

  const goPrev = useCallback(
    () => scrollToSlide(Math.max(0, activeSlide - 1)),
    [activeSlide, scrollToSlide]
  );
  const goNext = useCallback(
    () => scrollToSlide(Math.min(SLIDES.length - 1, activeSlide + 1)),
    [activeSlide, scrollToSlide]
  );

  // Lightbox: keyboard nav, focus trap, body scroll lock
  useEffect(() => {
    if (!lightboxOpen) {
      document.body.style.overflow = "";
      lightboxTriggerRef.current?.focus();
      return;
    }
    document.body.style.overflow = "hidden";
    const focusId = setTimeout(() => lightboxCloseBtnRef.current?.focus(), 0);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setLightboxOpen(false); return; }
      if (e.key === "ArrowLeft")  setLightboxIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setLightboxIndex((i) => Math.min(SLIDES.length - 1, i + 1));
      if (e.key === "Tab") {
        const focusables = lightboxRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled)");
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
      clearTimeout(focusId);
    };
  }, [lightboxOpen]);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => router.push("/"), 250);
  };

  const features = [
    { title: t("aniak.feature1.title"), desc: t("aniak.feature1.desc") },
    { title: t("aniak.feature2.title"), desc: t("aniak.feature2.desc") },
    { title: t("aniak.feature3.title"), desc: t("aniak.feature3.desc") },
    { title: t("aniak.feature4.title"), desc: t("aniak.feature4.desc") },
  ];

  return (
    <>
      <motion.main
        id="main-content"
        className="w-full min-h-screen bg-[#F5F5F4]"
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        {/* Fixed Close Button */}
        <button
          onClick={handleBack}
          aria-label={t("case.aria.closeandback")}
          className="fixed top-8 right-[4vw] z-50 mix-blend-difference text-white font-bold uppercase tracking-widest text-xs hover:opacity-50 transition-opacity magnetic-target min-h-[44px] min-w-[44px] inline-flex items-center justify-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          {t("case.close")}
        </button>

        {/* 1. HERO */}
        <section className="relative w-full min-h-screen flex flex-col justify-end pb-[12vh] px-[4vw] overflow-hidden bg-[#111111]">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, #fff 0px, transparent 1px, transparent 80px)",
            }}
          />
          <div className="absolute top-0 left-0 w-[60vw] h-[60vh] bg-[radial-gradient(ellipse_at_0%_0%,_rgba(178,88,24,0.12),_transparent_60%)] pointer-events-none" />

          <Link
            href="/#projects"
            aria-label={t("case.aria.backtoprojects")}
            className="absolute top-[calc(7vh+2rem)] left-[4vw] z-20 text-[0.7rem] font-bold uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors min-h-[44px] inline-flex items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:ring-offset-[#111111]"
          >
            {t("case.back")}
          </Link>

          <div className="relative z-10">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-white/30 mb-6"
            >
              {t("aniak.subtitle")}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="font-display font-black leading-none tracking-tighter mb-8"
              style={{ fontSize: "clamp(3.5rem, 10vw, 11rem)", color: BRAND }}
            >
              ANIA KAMPANIA
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="flex flex-col gap-4 md:gap-6"
            >
              <p className="font-display font-black text-2xl md:text-3xl text-white/90 tracking-tight max-w-xl leading-tight">
                {t("aniak.tagline")}
              </p>
              <p className="text-base leading-[1.65] text-white/70 font-medium max-w-lg">
                {t("aniak.desc")}
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-10 right-[4vw] flex flex-col items-center gap-2"
          >
            <div className="w-[1px] h-12 bg-white/30 overflow-hidden">
              <motion.div
                animate={shouldReduceMotion ? {} : { y: [0, 48] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-full h-1/2 bg-white"
              />
            </div>
            <span className="text-[0.6rem] uppercase tracking-widest font-bold text-white/40 [writing-mode:vertical-lr]">
              {t("case.scrolldown")}
            </span>
          </motion.div>
        </section>

        {/* 2. META */}
        <section className="py-[15vh] px-[4vw] bg-[#F5F5F4] border-t border-[#111]/5">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
            }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10"
          >
            <div className="lg:col-span-4 flex flex-col gap-10">
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}>
                <p className="text-[0.6rem] uppercase tracking-widest font-bold text-[#111]/40 mb-4">{t("case.roles")}</p>
                <ul className="space-y-2">
                  {[t("aniak.roles.1"), t("aniak.roles.2"), t("aniak.roles.3")].map((r) => (
                    <li key={r} className="text-base font-bold text-[#111]/80">{r}</li>
                  ))}
                </ul>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}>
                <p className="text-[0.6rem] uppercase tracking-widest font-bold text-[#111]/40 mb-4">{t("case.status")}</p>
                <p className="text-base font-bold text-[#111]/80 leading-relaxed whitespace-pre-line">{t("aniak.status")}</p>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}>
                <p className="text-[0.6rem] uppercase tracking-widest font-bold text-[#111]/40 mb-4">{t("case.live")}</p>
                <a
                  href="https://aniakampania.pl"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${t("case.aria.visitwebsite")} Ania Kampania ${t("case.aria.website")}`}
                  className="text-base font-bold pb-1 border-b-2 inline-block transition-colors duration-300"
                  style={{ color: BRAND, borderColor: BRAND }}
                >
                  {t("case.visitwebsite")} →
                </a>
              </motion.div>
            </div>

            <div className="hidden lg:block lg:col-span-1">
              <div className="w-[1px] h-full bg-[#111]/5 mx-auto" />
            </div>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
              className="lg:col-span-7"
            >
              <p className="text-[0.6rem] uppercase tracking-widest font-bold text-[#111]/40 mb-6">{t("case.techstack")}</p>
              <ul className="flex flex-col gap-3">
                {["Next.js 16 (App Router)", "TypeScript", "Tailwind CSS", "Cal.eu", "Stripe", "Sanity", "Resend", "Leaflet", "Vercel"].map((tech) => (
                  <li key={tech} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: BRAND }} />
                    <span className="font-bold text-base text-[#111]/80">{tech}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </section>

        {/* 3. PROBLEM / SOLUTION / RESULT */}
        <section className="py-[10vh] px-[4vw] bg-[#F5F5F4]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { labelKey: "aniak.problem.label", textKey: "aniak.problem", bg: "#E4E4E7", color: "#111" },
              { labelKey: "aniak.solution.label", textKey: "aniak.solution", bg: BRAND,    color: "#fff" },
              { labelKey: "aniak.result.label",   textKey: "aniak.result",   bg: "#111",   color: "#F8F8F8" },
            ].map(({ labelKey, textKey, bg, color }, i) => (
              <motion.div
                key={labelKey}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="p-10 rounded-[var(--radius-card)] flex flex-col gap-6"
                style={{ backgroundColor: bg, color }}
              >
                <span className="text-[0.65rem] font-bold uppercase tracking-widest opacity-50">{t(labelKey)}</span>
                <p className="text-[0.95rem] leading-[1.65] font-medium opacity-80">{t(textKey)}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 4. THE FUNNEL */}
        <section className="py-[12vh] px-[4vw] bg-[#111]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <span className="text-[0.6rem] uppercase tracking-widest font-bold text-white/30">
              {t("aniak.funnel.label")}
            </span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-base md:text-lg leading-[1.65] text-white/60 font-medium max-w-2xl mb-14"
          >
            {t("aniak.funnel.intro")}
          </motion.p>

          <ol className="flex flex-col">
            {FUNNEL.map(({ key, amount, from, unitKey, noteKey }, i) => (
              <motion.li
                key={key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                // Each rung steps further right than the last, so the ascending
                // commitment is visible before a single word is read. Desktop
                // only — on a phone the indent would just eat the text column.
                className="border-t border-white/10 last:border-b py-7 md:py-8 flex flex-col md:flex-row md:items-baseline gap-3 md:gap-8"
                style={{ paddingLeft: `calc(${i} * 2.5vw)` }}
              >
                <span
                  className="font-sans font-black text-sm leading-none w-8 flex-shrink-0"
                  style={{ color: BRAND }}
                >
                  0{i + 1}
                </span>

                <div className="flex-1 flex flex-col gap-2">
                  <h3 className="font-display font-black text-lg md:text-xl text-white tracking-tight leading-tight">
                    {t(`aniak.funnel.${key}.name`)}
                  </h3>
                  <p className="text-sm leading-[1.65] text-white/50 font-medium max-w-lg">
                    {t(`aniak.funnel.${key}.desc`)}
                  </p>
                  {noteKey && (
                    <p className="text-[0.7rem] uppercase tracking-widest font-bold text-white/30 mt-1">
                      {t(noteKey)}
                    </p>
                  )}
                </div>

                {/* ml-auto rather than a fixed width: the rows differ in length
                    between PL and EN ("/os./dzień" vs "/person/day"), and a fixed
                    column narrow enough to look tight in one language overflows
                    the right edge in the other. Right-aligning to the container
                    keeps the price edge true in both. */}
                <p className="font-sans font-black text-xl md:text-2xl tracking-tight text-white whitespace-nowrap md:text-right md:ml-auto flex-shrink-0">
                  {from && (
                    <span className="font-medium text-sm text-white/40 mr-1.5">
                      {t("aniak.funnel.from")}
                    </span>
                  )}
                  {amount}
                  {unitKey && (
                    <span className="font-medium text-sm text-white/40">{t(unitKey)}</span>
                  )}
                </p>
              </motion.li>
            ))}
          </ol>
        </section>

        {/* 5. CORE FEATURES */}
        <section className="py-[10vh] px-[4vw] bg-[#F5F5F4]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <span className="text-[0.6rem] uppercase tracking-widest font-bold text-[#111]/30">{t("case.corefeatures")}</span>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(({ title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group p-8 md:p-10 rounded-[28px] border border-[#111]/10 bg-white hover:border-[#B25818]/30 transition-colors duration-500 flex flex-col gap-4"
              >
                <span className="font-sans font-black text-5xl leading-none" style={{ color: BRAND }}>
                  0{i + 1}
                </span>
                <h2 className="font-display font-black text-xl text-[#111] tracking-tight leading-tight group-hover:text-[#B25818] transition-colors duration-300">
                  {title}
                </h2>
                <p className="text-sm leading-[1.65] text-[#111]/50 font-medium">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 6. MEDIA CAROUSEL */}
        <section className="py-[10vh] bg-[#F5F5F4]">
          {mediaStatus === "missing" ? (
            <div className="mx-[6vw] md:mx-[12.5vw] h-[max(280px,50vw)] md:h-[clamp(400px,60vh,700px)] rounded-[12px] bg-[#E4E4E7] flex items-center justify-center">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#111]/40">
                {t("case.mediacomingsoon")}
              </p>
            </div>
          ) : mediaStatus === "checking" ? (
            <div className="mx-[6vw] md:mx-[12.5vw] h-[max(280px,50vw)] md:h-[clamp(400px,60vh,700px)] rounded-[12px] bg-[#E4E4E7] animate-pulse" />
          ) : (
            <>
              <div className="relative">
                {/* Scroll track */}
                <div
                  ref={carouselRef}
                  tabIndex={0}
                  role="region"
                  aria-label={t("case.aria.medialabel")}
                  className="flex items-center gap-[2vw] overflow-x-auto overflow-y-hidden px-[6vw] md:px-[12.5vw] scroll-pl-[6vw] md:scroll-pl-[12.5vw] h-[max(280px,50vw)] md:h-[clamp(400px,60vh,700px)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111]/40 focus-visible:ring-offset-2"
                  style={{
                    scrollSnapType: "x mandatory",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    cursor: isDragging ? "grabbing" : "grab",
                  } as React.CSSProperties}
                  onPointerDown={(e) => { pointerDownX.current = e.clientX; setIsDragging(true); }}
                  onPointerUp={() => setIsDragging(false)}
                  onPointerLeave={() => setIsDragging(false)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
                    if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
                  }}
                >
                  {SLIDES.map((slide, i) => (
                    <div
                      key={slide.src}
                      ref={(el) => { slideRefs.current[i] = el; }}
                      className="flex-shrink-0 flex flex-col gap-3 select-none w-[88vw] md:w-[75vw] max-w-[1000px] h-full items-center justify-center"
                      style={{ scrollSnapAlign: "center" }}
                    >
                      <span
                        className="flex-shrink-0 block text-[10px] font-semibold uppercase"
                        style={{ color: BRAND, letterSpacing: "0.15em" }}
                      >
                        {t(slide.labelKey)}
                      </span>
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label={`${t(slide.labelKey)} — ${t("case.openimage")}`}
                        className="flex-1 w-full overflow-hidden rounded-[12px] bg-[#E4E4E7] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111]/40 focus-visible:ring-offset-2"
                        style={{
                          boxShadow: "0 4px 32px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.05)",
                          cursor: isDragging ? "grabbing" : "pointer",
                        }}
                        onClick={(e) => {
                          if (Math.abs(e.clientX - pointerDownX.current) > 8) return;
                          if (window.innerWidth < 768) return;
                          lightboxTriggerRef.current = e.currentTarget;
                          setLightboxIndex(i);
                          setLightboxOpen(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" && e.key !== " ") return;
                          e.preventDefault();
                          lightboxTriggerRef.current = e.currentTarget;
                          setLightboxIndex(i);
                          setLightboxOpen(true);
                        }}
                      >
                        <Image
                          src={slide.src}
                          alt={t(slide.altKey)}
                          width={1600}
                          height={1000}
                          sizes="(max-width: 768px) 95vw, (max-width: 1024px) 90vw, 80vw"
                          style={{ width: "auto", height: "100%", maxWidth: "100%", objectFit: "contain", display: "block", margin: "0 auto", borderRadius: "12px", ...(slide.type === "flat" ? { transform: "scale(1.2375)", transformOrigin: "center center" } : {}) }}
                          draggable={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Prev arrow — desktop only, hidden on first slide */}
                {activeSlide > 0 && (
                  <button
                    onClick={goPrev}
                    aria-label={t("case.aria.previousslide")}
                    className="hidden md:flex absolute z-10 w-10 h-10 items-center justify-center border-2 border-[#111] bg-white text-[#111] hover:bg-[#111] hover:text-white transition-colors duration-200"
                    style={{ left: "1.5vw", top: "50%", transform: "translateY(-50%)" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}

                {/* Next arrow — desktop only, hidden on last slide */}
                {activeSlide < SLIDES.length - 1 && (
                  <button
                    onClick={goNext}
                    aria-label={t("case.aria.nextslide")}
                    className="hidden md:flex absolute z-10 w-10 h-10 items-center justify-center border-2 border-[#111] bg-white text-[#111] hover:bg-[#111] hover:text-white transition-colors duration-200"
                    style={{ right: "1.5vw", top: "50%", transform: "translateY(-50%)" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Slide counter */}
              <div className="flex justify-end px-[4vw] mt-5">
                <span className="font-mono text-sm font-medium text-[#111111]">
                  {String(activeSlide + 1).padStart(2, "0")}&nbsp;/&nbsp;{String(SLIDES.length).padStart(2, "0")}
                </span>
              </div>
            </>
          )}
        </section>

        {/* 7. MARQUEE */}
        {/* No standalone "Visit Website" band here on purpose — it pointed at the
            same URL as the "Live" link in the meta bar above, and that screen now
            carries the funnel instead. */}
        <section className="py-[6vh] bg-[#F5F5F4] overflow-hidden select-none" aria-hidden="true">
          {([
            { keys: ["aniak.marquee.row1.1", "aniak.marquee.row1.2", "aniak.marquee.row1.3"] as const, dir: "left",  color: "#111", opacity: 0.08 },
            { keys: ["aniak.marquee.row2.1", "aniak.marquee.row2.2", "aniak.marquee.row2.3"] as const, dir: "right", color: BRAND,  opacity: 0.25 },
            { keys: ["aniak.marquee.row3.1", "aniak.marquee.row3.2", "aniak.marquee.row3.3"] as const, dir: "left",  color: "#111", opacity: 0.08 },
          ]).map(({ keys, dir, color, opacity }, i) => {
            const words = keys.map((k) => t(k));
            const repeated = [...words, ...words, ...words, ...words].join(" • ") + " • ";
            return (
              <div
                key={i}
                className="whitespace-nowrap py-2 pointer-events-none"
                style={{ animation: `marquee-${dir} 40s linear infinite` }}
              >
                <span
                  className="font-sans font-black text-[4vw] uppercase tracking-tighter"
                  style={{ color, opacity }}
                >
                  {repeated}
                </span>
              </div>
            );
          })}
        </section>

        {/* 8. NEXT PROJECT */}
        <UpNextCard
          href="/projects/folk-culture-center"
          projectName="Centrum Kultury Ludowej"
          brand={PROJECTS["folk-culture-center"].brand}
          titleLines={["Centrum Kultury", "Ludowej"]}
          maxFontPx={96}
        />
      </motion.main>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            key="lightbox"
            ref={lightboxRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("case.aria.imagelightbox")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close */}
            <button
              ref={lightboxCloseBtnRef}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors text-xl leading-none"
              aria-label={t("case.aria.closelightbox")}
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            >
              ✕
            </button>

            {/* Prev */}
            <button
              className="absolute left-4 md:left-8 w-12 h-12 flex items-center justify-center border-2 border-white/30 text-white hover:border-white hover:bg-white/10 transition-colors z-10 disabled:opacity-20 disabled:cursor-not-allowed"
              aria-label={t("case.aria.previousimage")}
              disabled={lightboxIndex === 0}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => Math.max(0, i - 1)); }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Image + label */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={SLIDES[lightboxIndex].src}
                alt={t(SLIDES[lightboxIndex].altKey)}
                width={1400}
                height={900}
                className="rounded-xl object-contain"
                style={{ maxWidth: "90vw", maxHeight: "82vh", width: "auto", height: "auto" }}
              />
              <span
                className="text-[11px] font-semibold uppercase"
                style={{ color: BRAND, letterSpacing: "0.15em" }}
              >
                {t(SLIDES[lightboxIndex].labelKey)}
              </span>
            </motion.div>

            {/* Next */}
            <button
              className="absolute right-4 md:right-8 w-12 h-12 flex items-center justify-center border-2 border-white/30 text-white hover:border-white hover:bg-white/10 transition-colors z-10 disabled:opacity-20 disabled:cursor-not-allowed"
              aria-label={t("case.aria.nextimage")}
              disabled={lightboxIndex === SLIDES.length - 1}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => Math.min(SLIDES.length - 1, i + 1)); }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
