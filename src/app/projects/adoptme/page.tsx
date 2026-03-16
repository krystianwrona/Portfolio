"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

const BRAND = "#F97316";

export default function AdoptMeCaseStudy() {
  const router = useRouter();
  const containerRef = useRef<HTMLElement>(null);
  const [isExiting, setIsExiting] = useState(false);
  const { t } = useLanguage();

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const bentoParallax1 = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const bentoParallax2 = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => router.push("/"), 250);
  };

  const features = [
    { title: t('adoptme.feature1.title'), desc: t('adoptme.feature1.desc') },
    { title: t('adoptme.feature2.title'), desc: t('adoptme.feature2.desc') },
    { title: t('adoptme.feature3.title'), desc: t('adoptme.feature3.desc') },
    { title: t('adoptme.feature4.title'), desc: t('adoptme.feature4.desc') },
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
          className="fixed top-8 right-[4vw] z-50 mix-blend-difference text-white font-bold uppercase tracking-widest text-xs hover:opacity-50 transition-opacity magnetic-target min-h-[44px] min-w-[44px] inline-flex items-center justify-end focus-visible:outline-none focus-visible:opacity-70"
        >
          {t('case.close')}
        </button>

        {/* 1. HERO — dark colored, bottom-aligned */}
        <section className="relative w-full min-h-screen flex flex-col justify-end pb-[12vh] px-[4vw] overflow-hidden bg-[#111111]">
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, #fff 0px, transparent 1px, transparent 80px)",
            }}
          />

          {/* Radial glow */}
          <div className="absolute top-0 left-0 w-[60vw] h-[60vh] bg-[radial-gradient(ellipse_at_0%_0%,_rgba(217,119,6,0.12),_transparent_60%)] pointer-events-none" />

          <Link
            href="/#projects"
            aria-label="Back to projects"
            className="absolute top-[calc(7vh+2rem)] left-[4vw] z-20 text-[0.7rem] font-bold uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors min-h-[44px] inline-flex items-center"
          >
            {t('case.back')}
          </Link>

          <div className="relative z-10">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-white/30 mb-6"
            >
              {t('adoptme.subtitle')}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="font-sans font-black leading-none tracking-tighter mb-8"
              style={{ fontSize: "clamp(3.5rem, 10vw, 11rem)", color: BRAND }}
            >
              Adopt.me
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="flex flex-col gap-4 md:gap-6"
            >
              <p className="font-sans font-black text-2xl md:text-3xl text-white/80 tracking-tight max-w-xl leading-tight whitespace-pre-line">
                {t('adoptme.headline')}
              </p>
              <p className="text-base leading-[1.65] text-white/60 font-medium max-w-lg">
                {t('adoptme.desc')}
              </p>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-10 right-[4vw] flex flex-col items-center gap-2"
          >
            <div className="w-[1px] h-12 bg-white/20 overflow-hidden">
              <motion.div animate={{ y: [0, 48] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="w-full h-1/2 bg-white/60" />
            </div>
            <span className="text-[0.6rem] uppercase tracking-widest font-bold text-white/20 [writing-mode:vertical-lr]">{t('case.scrolldown')}</span>
          </motion.div>
        </section>

        {/* 2. META — light theme */}
        <section className="py-[15vh] px-[4vw] bg-[#F5F5F4] border-t border-[#111]/5">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10"
          >
            {/* Left — roles */}
            <div className="lg:col-span-4 flex flex-col gap-10">
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}>
                <h4 className="text-[0.6rem] uppercase tracking-widest font-bold text-[#111]/40 mb-4">{t('case.roles')}</h4>
                <ul className="space-y-2">
                  {[t('adoptme.roles.1'), t('adoptme.roles.2'), t('adoptme.roles.3')].map((r) => (
                    <li key={r} className="text-base font-bold text-[#111]/80">{r}</li>
                  ))}
                </ul>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}>
                <h4 className="text-[0.6rem] uppercase tracking-widest font-bold text-[#111]/40 mb-4">{t('case.status')}</h4>
                <p className="text-base font-bold text-[#111]/80 leading-relaxed whitespace-pre-line">{t('adoptme.status')}</p>
              </motion.div>
            </div>

            {/* Center divider */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="w-[1px] h-full bg-[#111]/5 mx-auto" />
            </div>

            {/* Right — tech stack */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
              className="lg:col-span-7"
            >
              <h4 className="text-[0.6rem] uppercase tracking-widest font-bold text-[#111]/40 mb-6">{t('case.techstack')}</h4>
              <ul className="flex flex-col gap-3">
                {[
                  "Next.js 15 (React)",
                  "Supabase (PostgreSQL, Auth, Storage)",
                  "Tailwind CSS & Framer Motion",
                  "TypeScript",
                  "Google Gemini 3.0 Pro Integration",
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

        {/* 3. PROBLEM / SOLUTION / RESULT — light theme */}
        <section className="py-[10vh] px-[4vw] bg-[#F5F5F4]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { labelKey: 'adoptme.problem.label', textKey: 'adoptme.problem', bg: "#E4E4E7", color: "#111" },
              { labelKey: 'adoptme.solution.label', textKey: 'adoptme.solution', bg: BRAND, color: "#fff" },
              { labelKey: 'adoptme.result.label', textKey: 'adoptme.result', bg: "#111", color: "#F8F8F8" },
            ].map(({ labelKey, textKey, bg, color }, i) => (
              <motion.div
                key={labelKey}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="p-10 rounded-[32px] flex flex-col gap-6"
                style={{ backgroundColor: bg, color }}
              >
                <span className="text-[0.65rem] font-bold uppercase tracking-widest opacity-50">{t(labelKey)}</span>
                <p className="text-[0.95rem] leading-[1.7] font-medium opacity-80">{t(textKey)}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 4. CORE FEATURES — light theme, 2x2 grid */}
        <section className="py-[10vh] px-[4vw] bg-[#F5F5F4]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <span className="text-[0.6rem] uppercase tracking-widest font-bold text-[#111]/30">{t('case.corefeatures')}</span>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(({ title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group p-8 md:p-10 rounded-[28px] border border-[#111]/8 bg-white flex flex-col gap-4 transition-colors duration-500 hover:border-[#F97316]/30"
              >
                <span
                  className="font-sans font-black text-5xl leading-none"
                  style={{ color: BRAND }}
                >
                  0{i + 1}
                </span>
                <h3 className="font-sans font-black text-xl text-[#111] tracking-tight leading-tight group-hover:text-[#F97316] transition-colors duration-300">
                  {title}
                </h3>
                <p className="text-sm leading-[1.65] text-[#111]/50 font-medium">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 5. MEDIA BENTO GRID — light bg context */}
        <section className="py-[10vh] px-[4vw] bg-[#F5F5F4]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5" style={{ gridTemplateRows: "auto" }}>
            {/* Large left card */}
            <div className="relative overflow-hidden rounded-[32px] bg-[#E4E4E7] md:row-span-2" style={{ minHeight: "480px" }}>
              <motion.div
                style={{ y: bentoParallax1 }}
                className="absolute -inset-[15%] w-[130%] h-[130%] flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
              >
                <span className="font-sans font-black text-3xl md:text-4xl text-[#111]/10 text-center leading-tight select-none">
                  [ VIDEO:<br />QUIZ / MATCHING ]
                </span>
              </motion.div>
              <div
                className="absolute top-6 left-6 backdrop-blur-md border px-4 py-2 rounded-full text-[0.65rem] font-bold uppercase tracking-widest z-10"
                style={{ backgroundColor: `${BRAND}20`, borderColor: `${BRAND}40`, color: BRAND }}
              >
                Smart Matching
              </div>
            </div>

            {/* Top-right card */}
            <div className="relative overflow-hidden rounded-[32px] bg-[#E4E4E7] group" style={{ minHeight: "230px" }}>
              <motion.div
                style={{ y: bentoParallax2 }}
                className="absolute -inset-[15%] w-[130%] h-[130%] flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
              >
                <span className="font-sans font-black text-2xl text-[#111]/10 text-center select-none">
                  [ IMG: MAP / GEOLOCATION ]
                </span>
              </motion.div>
              <div className="absolute top-6 left-6 bg-white/60 backdrop-blur-md border border-[#111]/10 px-4 py-2 rounded-full text-[0.65rem] font-bold uppercase tracking-widest text-[#111]/60 z-10">
                Interactive Map
              </div>
            </div>

            {/* Bottom-right card */}
            <div className="relative overflow-hidden rounded-[32px] bg-[#E4E4E7] group" style={{ minHeight: "230px" }}>
              <motion.div
                style={{ y: bentoParallax1 }}
                className="absolute -inset-[15%] w-[130%] h-[130%] flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
              >
                <span className="font-sans font-black text-2xl text-[#111]/10 text-center select-none">
                  [ IMG: MOBILE UI ]
                </span>
              </motion.div>
              <div className="absolute top-6 left-6 bg-white/60 backdrop-blur-md border border-[#111]/10 px-4 py-2 rounded-full text-[0.65rem] font-bold uppercase tracking-widest text-[#111]/60 z-10">
                App Experience
              </div>
            </div>
          </div>
        </section>

        {/* 6. VISIT WEBSITE */}
        <section className="py-[12vh] px-[4vw] bg-[#F5F5F4] flex items-center justify-center">
          <a
            href="#"
            className="group inline-flex items-center gap-4"
          >
            <span className="font-sans font-black text-[4vw] md:text-[3vw] tracking-tighter text-[#111] transition-colors duration-300 group-hover:text-[#F97316]">
              {t('case.visitwebsite')}
            </span>
            <span className="text-[2vw] text-[#111] group-hover:translate-x-2 transition-transform duration-300">→</span>
          </a>
        </section>

        {/* 7. MARQUEE */}
        <section className="py-[6vh] bg-[#F5F5F4] overflow-hidden select-none" aria-hidden="true">
          {([
            { keys: ['adoptme.marquee.row1.1', 'adoptme.marquee.row1.2', 'adoptme.marquee.row1.3'], dir: 'left',  color: '#111', opacity: 0.08 },
            { keys: ['adoptme.marquee.row2.1', 'adoptme.marquee.row2.2', 'adoptme.marquee.row2.3'], dir: 'right', color: BRAND,  opacity: 0.25 },
            { keys: ['adoptme.marquee.row3.1', 'adoptme.marquee.row3.2', 'adoptme.marquee.row3.3'], dir: 'left',  color: '#111', opacity: 0.08 },
          ] as const).map(({ keys, dir, color, opacity }, i) => {
            const words = keys.map(k => t(k));
            const repeated = [...words, ...words, ...words, ...words].join(' • ') + ' • ';
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
            <span className="text-[0.65rem] uppercase tracking-widest font-bold text-white/20">{t('case.upnext')}</span>
          </div>
          <a
            href="/projects/classified"
            aria-label="View next project: Classified"
            className="group relative w-full max-w-5xl h-[40vh] rounded-[40px] overflow-hidden flex items-center justify-center cursor-pointer"
          >
            <div className="absolute inset-0 bg-[#1A1A1A] z-0 transition-transform duration-1000 group-hover:scale-105 border border-white/5" />
            <div className="relative z-10 text-center">
              <h2 className="font-sans font-black text-6xl md:text-9xl text-white/10 tracking-tighter">???</h2>
            </div>
          </a>
        </section>

      </motion.main>
    </>
  );
}
