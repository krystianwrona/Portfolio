"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { PROJECTS } from "@/lib/projects";

const BRAND = PROJECTS.fashionhero.brand;
const LIVE_URL = "https://fashionhero-hub.vercel.app/";

type SlideType = "macbook" | "mobile";

const SLIDES: { src: string; labelKey: string; altKey: string; type: SlideType }[] = [
  { src: "/fashionhero-dashboard.png", labelKey: "fashionhero.slide.dashboard", altKey: "fashionhero.alt.dashboard", type: "macbook" },
  { src: "/fashionhero-promote.png",   labelKey: "fashionhero.slide.promote",   altKey: "fashionhero.alt.promote",   type: "macbook" },
  { src: "/fashionhero-catalog.png",   labelKey: "fashionhero.slide.catalog",   altKey: "fashionhero.alt.catalog",   type: "macbook" },
  { src: "/fashionhero-analytics.png", labelKey: "fashionhero.slide.analytics", altKey: "fashionhero.alt.analytics", type: "macbook" },
  { src: "/fashionhero-mobile.png",    labelKey: "fashionhero.slide.mobile",    altKey: "fashionhero.alt.mobile",    type: "mobile"  },
];

export default function FashionHeroCaseStudy() {
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

  // Lightbox — carousel
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const lightboxCloseBtnRef = useRef<HTMLButtonElement>(null);

  // Lightbox — certificate
  const [certOpen, setCertOpen] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);
  const certCloseBtnRef = useRef<HTMLButtonElement>(null);

  // Shared: element that opened whichever dialog is currently active,
  // so focus returns there on close.
  const activeTriggerRef = useRef<HTMLElement | null>(null);

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
    if (!lightboxOpen && !certOpen) {
      document.body.style.overflow = "";
      activeTriggerRef.current?.focus();
      return;
    }
    document.body.style.overflow = "hidden";
    const activeDialogRef = lightboxOpen ? lightboxRef : certRef;
    const activeCloseBtnRef = lightboxOpen ? lightboxCloseBtnRef : certCloseBtnRef;
    const focusId = setTimeout(() => activeCloseBtnRef.current?.focus(), 0);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setLightboxOpen(false); setCertOpen(false); return; }
      if (lightboxOpen) {
        if (e.key === "ArrowLeft")  setLightboxIndex((i) => Math.max(0, i - 1));
        if (e.key === "ArrowRight") setLightboxIndex((i) => Math.min(SLIDES.length - 1, i + 1));
      }
      if (e.key === "Tab") {
        const focusables = activeDialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled)");
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
  }, [lightboxOpen, certOpen]);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => router.push("/"), 250);
  };

  const features = [
    { title: t("fashionhero.feature1.title"), desc: t("fashionhero.feature1.desc") },
    { title: t("fashionhero.feature2.title"), desc: t("fashionhero.feature2.desc") },
    { title: t("fashionhero.feature3.title"), desc: t("fashionhero.feature3.desc") },
    { title: t("fashionhero.feature4.title"), desc: t("fashionhero.feature4.desc") },
  ];

  const process = [
    { title: t("fashionhero.process1.title"), desc: t("fashionhero.process1.desc") },
    { title: t("fashionhero.process2.title"), desc: t("fashionhero.process2.desc") },
    { title: t("fashionhero.process3.title"), desc: t("fashionhero.process3.desc") },
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
          <div className="absolute top-0 left-0 w-[60vw] h-[60vh] bg-[radial-gradient(ellipse_at_0%_0%,_rgba(225,29,72,0.12),_transparent_60%)] pointer-events-none" />

          <Link
            href="/#projects"
            aria-label={t("case.aria.backtoprojects")}
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
              {t("fashionhero.subtitle")}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="font-display font-black leading-none tracking-tighter mb-8"
              style={{ fontSize: "clamp(3.5rem, 10vw, 11rem)", color: BRAND }}
            >
              FASHIONHERO
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="flex flex-col gap-4 md:gap-6"
            >
              <p className="font-display font-black text-2xl md:text-3xl text-white/90 tracking-tight max-w-xl leading-tight">
                {t("fashionhero.tagline")}
              </p>
              <p className="text-base leading-[1.65] text-white/70 font-medium max-w-lg">
                {t("fashionhero.desc")}
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
                  {[t("fashionhero.roles.1"), t("fashionhero.roles.2"), t("fashionhero.roles.3")].map((r) => (
                    <li key={r} className="text-base font-bold text-[#111]/80">{r}</li>
                  ))}
                </ul>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}>
                <p className="text-[0.6rem] uppercase tracking-widest font-bold text-[#111]/40 mb-4">{t("case.timeline")}</p>
                <p className="text-base font-bold text-[#111]/80 leading-relaxed whitespace-pre-line">{t("fashionhero.timeline")}</p>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}>
                <p className="text-[0.6rem] uppercase tracking-widest font-bold text-[#111]/40 mb-4">{t("case.live")}</p>
                <a
                  href={LIVE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${t("case.aria.visitwebsite")} FashionHero ${t("case.aria.liveprototype")}`}
                  className="text-base font-bold pb-1 border-b-2 inline-block transition-colors duration-300"
                  style={{ color: BRAND, borderColor: BRAND }}
                >
                  {t("case.visitwebsite")} →
                </a>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}>
                <a
                  href="/FashionHero-Pitch-KrystianWrona.pdf"
                  download="FashionHero-Pitch-KrystianWrona.pdf"
                  aria-label={t("fashionhero.aria.downloadpdf")}
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#111] border border-[#111]/15 rounded-full px-5 py-3 hover:border-[#111]/40 transition-colors duration-300"
                >
                  {t("fashionhero.download")} ↓
                </a>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}>
                <button
                  onClick={(e) => { activeTriggerRef.current = e.currentTarget; setCertOpen(true); }}
                  aria-label={t("fashionhero.aria.viewcert")}
                  className="group text-left w-full max-w-xs rounded-2xl border border-[#111]/10 bg-white p-5 hover:border-[#E11D48]/40 transition-colors duration-300"
                >
                  <p className="text-[0.6rem] uppercase tracking-widest font-bold" style={{ color: BRAND }}>
                    {t("fashionhero.credential.cta")} ↗
                  </p>
                  <p className="font-display font-black text-lg text-[#111] tracking-tight mt-2">
                    {t("fashionhero.credential.title")}
                  </p>
                  <p className="text-xs leading-relaxed text-[#111]/50 font-medium mt-2">
                    {t("fashionhero.credential.desc")}
                  </p>
                  <p className="text-xs font-bold text-[#111]/70 mt-3">{t("fashionhero.credential.completed")}</p>
                  <p className="text-[0.7rem] text-[#111]/40 font-medium mt-1">{t("fashionhero.credential.instructors")}</p>
                  <p className="text-[0.7rem] text-[#111]/40 font-medium">{t("fashionhero.credential.organizer")}</p>
                </button>
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
                {["Claude Code", "Neon (Postgres)", "Next.js", "Vercel"].map((tech) => (
                  <li key={tech} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: BRAND }} />
                    <span className="font-bold text-base text-[#111]/80">{tech}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-[#111]/40 font-medium italic mt-4">{t("fashionhero.techstack.note")}</p>
            </motion.div>
          </motion.div>
        </section>

        {/* 3. PROBLEM / SOLUTION / RESULT */}
        <section className="py-[10vh] px-[4vw] bg-[#F5F5F4]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { labelKey: "fashionhero.problem.label", textKey: "fashionhero.problem", bg: "#E4E4E7", color: "#111" },
              { labelKey: "fashionhero.solution.label", textKey: "fashionhero.solution", bg: BRAND,    color: "#fff" },
              { labelKey: "fashionhero.result.label",   textKey: "fashionhero.result",   bg: "#111",   color: "#F8F8F8" },
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

        {/* 4. STRATEGIC PROCESS */}
        <section className="py-[10vh] px-[4vw] bg-[#F5F5F4]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <span className="text-[0.6rem] uppercase tracking-widest font-bold text-[#111]/30">{t("fashionhero.process.label")}</span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-base md:text-lg leading-[1.65] text-[#111]/60 font-medium max-w-2xl mb-12"
          >
            {t("fashionhero.process.intro")}
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {process.map(({ title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="p-8 md:p-10 rounded-[28px] border border-[#111]/10 bg-white flex flex-col gap-4 transition-colors duration-500 hover:border-[#E11D48]/30"
              >
                <h2 className="font-display font-black text-xl text-[#111] tracking-tight leading-tight">
                  {title}
                </h2>
                <p className="text-sm leading-[1.65] text-[#111]/50 font-medium">{desc}</p>
              </motion.div>
            ))}
          </div>
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
                className="group p-8 md:p-10 rounded-[28px] border border-[#111]/10 bg-white hover:border-[#E11D48]/30 transition-colors duration-500 flex flex-col gap-4"
              >
                <span className="font-sans font-black text-5xl leading-none" style={{ color: BRAND }}>
                  0{i + 1}
                </span>
                <h2 className="font-display font-black text-xl text-[#111] tracking-tight leading-tight group-hover:text-[#E11D48] transition-colors duration-300">
                  {title}
                </h2>
                <p className="text-sm leading-[1.65] text-[#111]/50 font-medium">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 6. MEDIA CAROUSEL */}
        <section className="py-[10vh] bg-[#F5F5F4]">
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
                      activeTriggerRef.current = e.currentTarget;
                      setLightboxIndex(i);
                      setLightboxOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      activeTriggerRef.current = e.currentTarget;
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
                      style={{ width: "auto", height: "100%", maxWidth: "100%", objectFit: "contain", display: "block", margin: "0 auto", borderRadius: "12px" }}
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
        </section>

        {/* 7. VISIT WEBSITE */}
        <section className="py-[12vh] px-[4vw] bg-[#111] flex items-center justify-center">
          <a
            href={LIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t("case.aria.visitwebsite")} FashionHero ${t("case.aria.liveprototype")}`}
            className="group inline-flex items-center gap-4"
          >
            <span className="font-sans font-black text-[4vw] md:text-[3vw] tracking-tighter text-white transition-colors duration-300 group-hover:text-[#E11D48]">
              {t("case.visitwebsite")}
            </span>
            <span className="text-[2vw] text-white group-hover:translate-x-2 transition-transform duration-300">→</span>
          </a>
        </section>

        {/* 8. MARQUEE */}
        <section className="py-[6vh] bg-[#F5F5F4] overflow-hidden select-none" aria-hidden="true">
          {([
            { keys: ["fashionhero.marquee.row1.1", "fashionhero.marquee.row1.2", "fashionhero.marquee.row1.3"] as const, dir: "left",  color: "#111", opacity: 0.08 },
            { keys: ["fashionhero.marquee.row2.1", "fashionhero.marquee.row2.2", "fashionhero.marquee.row2.3"] as const, dir: "right", color: BRAND,  opacity: 0.25 },
            { keys: ["fashionhero.marquee.row3.1", "fashionhero.marquee.row3.2", "fashionhero.marquee.row3.3"] as const, dir: "left",  color: "#111", opacity: 0.08 },
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

        {/* 9. NEXT PROJECT */}
        <section className="py-[15vh] px-[4vw] bg-[#111111] flex flex-col items-center justify-center min-h-[60vh] border-t border-white/5">
          <div className="text-center mb-10">
            <span className="text-[0.65rem] uppercase tracking-widest font-bold text-white/20">{t("case.upnext")}</span>
          </div>
          <a
            href="/projects/ania-kampania"
            aria-label={`${t("case.aria.viewnextproject")} Ania Kampania`}
            className="group relative w-full max-w-5xl h-[40vh] rounded-[var(--radius-lg)] overflow-hidden flex items-center justify-center cursor-pointer"
          >
            <div className="absolute inset-0 z-0 transition-transform duration-1000 group-hover:scale-105" style={{ backgroundColor: PROJECTS["ania-kampania"].brand }}>
              <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.15),_transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl mix-blend-overlay" />
            </div>
            <div className="relative z-10 text-center">
              <h2 className="font-sans font-black text-5xl md:text-9xl text-white tracking-tighter">Ania Kampania</h2>
            </div>
          </a>
        </section>
      </motion.main>

      {/* CAROUSEL LIGHTBOX */}
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

      {/* CERTIFICATE LIGHTBOX */}
      <AnimatePresence>
        {certOpen && (
          <motion.div
            key="cert-lightbox"
            ref={certRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("case.aria.certificatelightbox")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
            onClick={() => setCertOpen(false)}
          >
            <button
              ref={certCloseBtnRef}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors text-xl leading-none"
              aria-label={t("fashionhero.aria.closecert")}
              onClick={(e) => { e.stopPropagation(); setCertOpen(false); }}
            >
              ✕
            </button>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src="/certyfikat-KW.png"
                alt={t("fashionhero.certificate.alt")}
                width={1600}
                height={1130}
                className="rounded-xl object-contain"
                style={{ maxWidth: "90vw", maxHeight: "82vh", width: "auto", height: "auto" }}
              />
              <span
                className="text-[11px] font-semibold uppercase"
                style={{ color: BRAND, letterSpacing: "0.15em" }}
              >
                {t("fashionhero.credential.title")}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
