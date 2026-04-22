"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

const BRAND = "#F97316";

const SLIDES = [
  { src: "/adoptio-hero.png",       label: "SMART MATCHING",    alt: "Adoptio strona główna z algorytmem smart matching" },
  { src: "/adoptio-search.png",     label: "SEARCH & FILTERS",  alt: "Adoptio wyszukiwarka z aktywnymi filtrami" },
  { src: "/adoptio-quiz.png",       label: "LIFESTYLE QUIZ",    alt: "Quiz dopasowania stylu życia na Adoptio" },
  { src: "/adoptio-pet.png",        label: "PET PROFILE",       alt: "Profil zwierzęcia Duszek na Adoptio" },
  { src: "/adoptio-mobile.png",     label: "MOBILE EXPERIENCE", alt: "Trzy widoki mobilne aplikacji Adoptio" },
  { src: "/adoptio-dashboard.png",  label: "SHELTER DASHBOARD", alt: "Panel administracyjny schroniska z KPI" },
  { src: "/adoptio-specialist.png", label: "SPECIALISTS",       alt: "Profil specjalisty na Adoptio" },
  { src: "/adoptio-kanban.png",     label: "ADOPTION KANBAN",   alt: "Kanban zgłoszeń adopcyjnych w panelu admina" },
  { src: "/adoptio-blog.png",       label: "BLOG",              alt: "Sekcja blogowa na Adoptio" },
];

export default function AdoptMeCaseStudy() {
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

  // Lightbox: keyboard nav + body scroll lock
  useEffect(() => {
    if (!lightboxOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft")  setLightboxIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setLightboxIndex((i) => Math.min(SLIDES.length - 1, i + 1));
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => router.push("/"), 250);
  };

  const features = [
    { title: t("adoptme.feature1.title"), desc: t("adoptme.feature1.desc") },
    { title: t("adoptme.feature2.title"), desc: t("adoptme.feature2.desc") },
    { title: t("adoptme.feature3.title"), desc: t("adoptme.feature3.desc") },
    { title: t("adoptme.feature4.title"), desc: t("adoptme.feature4.desc") },
  ];

  return (
    <>
      <motion.main
        className="w-full min-h-screen bg-[#F5F5F4]"
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        {/* Fixed Close Button */}
        <button
          onClick={handleBack}
          aria-label="Close and go back to projects"
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
          <div className="absolute top-0 left-0 w-[60vw] h-[60vh] bg-[radial-gradient(ellipse_at_0%_0%,_rgba(217,119,6,0.12),_transparent_60%)] pointer-events-none" />

          <Link
            href="/#projects"
            aria-label="Back to projects"
            className="absolute top-[calc(7vh+2rem)] left-[4vw] z-20 text-[0.7rem] font-bold uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors min-h-[44px] inline-flex items-center"
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
              {t("adoptme.subtitle")}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="font-display font-black leading-none tracking-tighter mb-8"
              style={{ fontSize: "clamp(3.5rem, 10vw, 11rem)", color: BRAND }}
            >
              Adoptio
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="flex flex-col gap-4 md:gap-6"
            >
              <p className="font-display font-black text-2xl md:text-3xl text-white/80 tracking-tight max-w-xl leading-tight whitespace-pre-line">
                {t("adoptme.headline")}
              </p>
              <p className="text-base leading-[1.65] text-white/60 font-medium max-w-lg">
                {t("adoptme.desc")}
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-10 right-[4vw] flex flex-col items-center gap-2"
          >
            <div className="w-[1px] h-12 bg-white/20 overflow-hidden">
              <motion.div
                animate={shouldReduceMotion ? {} : { y: [0, 48] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-full h-1/2 bg-white/60"
              />
            </div>
            <span className="text-[0.6rem] uppercase tracking-widest font-bold text-white/20 [writing-mode:vertical-lr]">
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
                  {[t("adoptme.roles.1"), t("adoptme.roles.2"), t("adoptme.roles.3")].map((r) => (
                    <li key={r} className="text-base font-bold text-[#111]/80">{r}</li>
                  ))}
                </ul>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}>
                <p className="text-[0.6rem] uppercase tracking-widest font-bold text-[#111]/40 mb-4">{t("case.status")}</p>
                <p className="text-base font-bold text-[#111]/80 leading-relaxed whitespace-pre-line">{t("adoptme.status")}</p>
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
                {[
                  "Next.js 15 (React)",
                  "Supabase (PostgreSQL, Auth, Storage)",
                  "Tailwind CSS & Framer Motion",
                  "TypeScript",
                  "Google Gemini 2.5 Flash Integration",
                ].map((tech) => (
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
              { labelKey: "adoptme.problem.label", textKey: "adoptme.problem", bg: "#E4E4E7", color: "#111" },
              { labelKey: "adoptme.solution.label", textKey: "adoptme.solution", bg: BRAND, color: "#fff" },
              { labelKey: "adoptme.result.label",   textKey: "adoptme.result",   bg: "#111", color: "#F8F8F8" },
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
                <p className="text-[0.95rem] leading-[1.7] font-medium opacity-80">{t(textKey)}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 4. CORE FEATURES */}
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
                className="group p-8 md:p-10 rounded-[28px] border border-[#111]/10 bg-white flex flex-col gap-4 transition-colors duration-500 hover:border-[#F97316]/30"
              >
                <span className="font-sans font-black text-5xl leading-none" style={{ color: BRAND }}>
                  0{i + 1}
                </span>
                <h2 className="font-display font-black text-xl text-[#111] tracking-tight leading-tight group-hover:text-[#F97316] transition-colors duration-300">
                  {title}
                </h2>
                <p className="text-sm leading-[1.65] text-[#111]/50 font-medium">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 5. MEDIA CAROUSEL */}
        <section className="py-[10vh] bg-[#F5F5F4]">
          <div className="relative">
            {/* Scroll track */}
            <div
              ref={carouselRef}
              className="flex items-start gap-4 md:gap-5 overflow-x-auto overflow-y-hidden pl-[4vw] md:[height:clamp(480px,70vh,860px)]"
              style={{
                scrollSnapType: "x mandatory",
                scrollPaddingLeft: "4vw",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                cursor: isDragging ? "grabbing" : "grab",
              } as React.CSSProperties}
              onPointerDown={(e) => { pointerDownX.current = e.clientX; setIsDragging(true); }}
              onPointerUp={() => setIsDragging(false)}
              onPointerLeave={() => setIsDragging(false)}
            >
              {SLIDES.map((slide, i) => (
                <div
                  key={slide.src}
                  ref={(el) => { slideRefs.current[i] = el; }}
                  className="flex-shrink-0 flex flex-col gap-3 select-none w-[95vw] md:w-[90vw] lg:w-[80vw] md:h-full"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <span
                    className="flex-shrink-0 block text-[10px] font-semibold uppercase"
                    style={{ color: BRAND, letterSpacing: "0.15em" }}
                  >
                    {slide.label}
                  </span>
                  <div
                    className="overflow-hidden rounded-[12px] bg-[#E4E4E7] md:flex-1"
                    style={{
                      boxShadow: "0 4px 32px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.05)",
                      cursor: isDragging ? "grabbing" : "pointer",
                    }}
                    onClick={(e) => {
                      if (Math.abs(e.clientX - pointerDownX.current) > 8) return;
                      setLightboxIndex(i);
                      setLightboxOpen(true);
                    }}
                  >
                    <Image
                      src={slide.src}
                      alt={slide.alt}
                      width={1600}
                      height={1000}
                      sizes="(max-width: 768px) 95vw, (max-width: 1024px) 90vw, 80vw"
                      className="w-full h-auto max-h-[50vh] object-contain md:h-full md:max-h-none md:object-cover"
                      style={{ display: "block" }}
                      draggable={false}
                    />
                  </div>
                </div>
              ))}
              {/* Trailing spacer — mirrors left padding */}
              <div className="flex-shrink-0 w-[4vw]" aria-hidden="true" />
            </div>

            {/* Prev arrow — desktop only, hidden on first slide */}
            {activeSlide > 0 && (
              <button
                onClick={goPrev}
                aria-label="Previous slide"
                className="hidden md:flex absolute left-0 z-10 w-10 h-10 items-center justify-center border-2 border-[#111] bg-white text-[#111] hover:bg-[#111] hover:text-white transition-colors duration-200"
                style={{ top: "50%", transform: "translateY(-50%)" }}
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
                aria-label="Next slide"
                className="hidden md:flex absolute right-0 z-10 w-10 h-10 items-center justify-center border-2 border-[#111] bg-white text-[#111] hover:bg-[#111] hover:text-white transition-colors duration-200"
                style={{ top: "50%", transform: "translateY(-50%)" }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Slide counter */}
          <div className="flex justify-end px-[4vw] mt-5">
            <span className="font-mono text-base md:text-sm font-medium text-[#111111]">
              {String(activeSlide + 1).padStart(2, "0")}&nbsp;/&nbsp;{String(SLIDES.length).padStart(2, "0")}
            </span>
          </div>
        </section>

        {/* 6. VISIT WEBSITE */}
        <section className="py-[12vh] px-[4vw] bg-[#F5F5F4] flex items-center justify-center">
          <a
            href="https://adoptio.pl"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-4"
          >
            <span className="font-sans font-black text-[4vw] md:text-[3vw] tracking-tighter text-[#111] transition-colors duration-300 group-hover:text-[#F97316]">
              {t("case.visitwebsite")}
            </span>
            <span className="text-[2vw] text-[#111] group-hover:translate-x-2 transition-transform duration-300">→</span>
          </a>
        </section>

        {/* 7. MARQUEE */}
        <section className="py-[6vh] bg-[#F5F5F4] overflow-hidden select-none" aria-hidden="true">
          {([
            { keys: ["adoptme.marquee.row1.1", "adoptme.marquee.row1.2", "adoptme.marquee.row1.3"] as const, dir: "left",  color: "#111", opacity: 0.08 },
            { keys: ["adoptme.marquee.row2.1", "adoptme.marquee.row2.2", "adoptme.marquee.row2.3"] as const, dir: "right", color: BRAND,  opacity: 0.25 },
            { keys: ["adoptme.marquee.row3.1", "adoptme.marquee.row3.2", "adoptme.marquee.row3.3"] as const, dir: "left",  color: "#111", opacity: 0.08 },
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
        <section className="py-[15vh] px-[4vw] bg-[#111111] flex flex-col items-center justify-center min-h-[60vh] border-t border-white/5">
          <div className="text-center mb-10">
            <span className="text-[0.65rem] uppercase tracking-widest font-bold text-white/20">{t("case.upnext")}</span>
          </div>
          <a
            href="/projects/legalray"
            aria-label="View next project: LegalRay"
            className="group relative w-full max-w-5xl h-[40vh] rounded-[var(--radius-lg)] overflow-hidden flex items-center justify-center cursor-pointer"
          >
            <div className="absolute inset-0 bg-[#2563EB] z-0 transition-transform duration-1000 group-hover:scale-105">
              <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.15),_transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl mix-blend-overlay" />
            </div>
            <div className="relative z-10 text-center">
              <h2 className="font-sans font-black text-6xl md:text-9xl text-white tracking-tighter">LegalRay</h2>
            </div>
          </a>
        </section>
      </motion.main>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            key="lightbox"
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
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors text-xl leading-none"
              aria-label="Close lightbox"
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            >
              ✕
            </button>

            {/* Prev */}
            <button
              className="absolute left-4 md:left-8 w-12 h-12 flex items-center justify-center border-2 border-white/30 text-white hover:border-white hover:bg-white/10 transition-colors z-10 disabled:opacity-20 disabled:cursor-not-allowed"
              aria-label="Previous image"
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
                alt={SLIDES[lightboxIndex].alt}
                width={1400}
                height={900}
                className="rounded-xl object-contain"
                style={{ maxWidth: "90vw", maxHeight: "82vh", width: "auto", height: "auto" }}
              />
              <span
                className="text-[11px] font-semibold uppercase"
                style={{ color: BRAND, letterSpacing: "0.15em" }}
              >
                {SLIDES[lightboxIndex].label}
              </span>
            </motion.div>

            {/* Next */}
            <button
              className="absolute right-4 md:right-8 w-12 h-12 flex items-center justify-center border-2 border-white/30 text-white hover:border-white hover:bg-white/10 transition-colors z-10 disabled:opacity-20 disabled:cursor-not-allowed"
              aria-label="Next image"
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
