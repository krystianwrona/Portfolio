"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

const BRAND = "#2563EB";

export default function LegalRayCaseStudy() {
  const router = useRouter();
  const containerRef = useRef<HTMLElement>(null);
  const [isExiting, setIsExiting] = useState(false);
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const bentoParallax1 = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const bentoParallax2 = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => router.push("/"), 250);
  };

  const features = [
    { title: t('legalray.feature1.title'), desc: t('legalray.feature1.desc') },
    { title: t('legalray.feature2.title'), desc: t('legalray.feature2.desc') },
    { title: t('legalray.feature3.title'), desc: t('legalray.feature3.desc') },
    { title: t('legalray.feature4.title'), desc: t('legalray.feature4.desc') },
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
          {t('case.close')}
        </button>

        {/* 1. HERO — dark themed, bottom-aligned like Adoptio */}
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
          <div className="absolute top-0 left-0 w-[60vw] h-[60vh] bg-[radial-gradient(ellipse_at_0%_0%,_rgba(37,99,235,0.12),_transparent_60%)] pointer-events-none" />

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
              {t('legalray.subtitle')}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="font-display font-black leading-none tracking-tighter mb-8"
              style={{ fontSize: "clamp(3.5rem, 10vw, 11rem)", color: BRAND }}
            >
              LegalRay
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="flex flex-col gap-4 md:gap-6"
            >
              <p className="font-display font-black text-2xl md:text-3xl text-white/90 tracking-tight max-w-xl leading-tight">
                {t('legalray.tagline')}
              </p>
              <p className="text-base leading-[1.65] text-white/70 font-medium max-w-lg">
                {t('legalray.desc')}
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
            <div className="w-[1px] h-12 bg-white/30 overflow-hidden">
              <motion.div animate={shouldReduceMotion ? {} : { y: [0, 48] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="w-full h-1/2 bg-white" />
            </div>
            <span className="text-[0.6rem] uppercase tracking-widest font-bold text-white/40 [writing-mode:vertical-lr]">{t('case.scrolldown')}</span>
          </motion.div>
        </section>

        {/* 2. PROJECT META — light theme */}
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
                <p className="text-[0.6rem] uppercase tracking-widest font-bold text-[#111]/40 mb-4">{t('case.roles')}</p>
                <ul className="space-y-2">
                  {[t('legalray.roles.1'), t('legalray.roles.2'), t('legalray.roles.3')].map((r) => (
                    <li key={r} className="text-base font-bold text-[#111]/80">{r}</li>
                  ))}
                </ul>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}>
                <p className="text-[0.6rem] uppercase tracking-widest font-bold text-[#111]/40 mb-4">{t('case.timeline')}</p>
                <p className="text-base font-bold text-[#111]/80 leading-relaxed whitespace-pre-line">{t('legalray.timeline')}</p>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}>
                <p className="text-[0.6rem] uppercase tracking-widest font-bold text-[#111]/40 mb-4">{t('case.live')}</p>
                <a
                  href="https://legal-saas-rosy.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit LegalRay website (opens in new tab)"
                  className="text-base font-bold pb-1 border-b-2 inline-block transition-colors duration-300"
                  style={{ color: BRAND, borderColor: BRAND }}
                >
                  {t('case.visitwebsite')} →
                </a>
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
              <p className="text-[0.6rem] uppercase tracking-widest font-bold text-[#111]/40 mb-6">{t('case.techstack')}</p>
              <ul className="flex flex-col gap-3">
                {["Google Gemini 3.0 Pro", "Supabase", "Clerk", "Stripe", "Next.js", "TypeScript", "Tailwind CSS"].map((tech) => (
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
              { labelKey: 'legalray.problem.label', textKey: 'legalray.problem', bg: "#E4E4E7", color: "#111" },
              { labelKey: 'legalray.solution.label', textKey: 'legalray.solution', bg: BRAND, color: "#fff" },
              { labelKey: 'legalray.result.label', textKey: 'legalray.result', bg: "#111", color: "#F8F8F8" },
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

        {/* 4. CORE FEATURES — light theme, numbered boxes */}
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
                className="group p-8 md:p-10 rounded-[28px] border border-[#111]/10 bg-white hover:border-[#2563EB]/30 transition-colors duration-500 flex flex-col gap-4"
              >
                <span
                  className="font-sans font-black text-5xl leading-none"
                  style={{ color: BRAND }}
                >
                  0{i + 1}
                </span>
                <h2 className="font-display font-black text-xl text-[#111] tracking-tight leading-tight group-hover:text-[#2563EB] transition-colors duration-300">
                  {title}
                </h2>
                <p className="text-sm leading-[1.65] text-[#111]/50 font-medium">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 5. APP FEATURES — Bento Grid (light bg context) */}
        <section className="py-[10vh] px-[4vw] bg-[#F5F5F4]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-5 lg:gap-6 auto-rows-[350px]">
            <div className="md:col-span-2 lg:col-span-8 relative rounded-[var(--radius-card)] overflow-hidden bg-[#E4E4E7] group">
              <motion.div style={{ y: bentoParallax1 }} className="absolute -inset-[15%] w-[130%] h-[130%] transition-transform duration-700 group-hover:scale-105">
                <video src="/legalray-audit.mp4" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
              </motion.div>
              <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full text-[0.65rem] font-bold uppercase tracking-widest text-[#111] z-10 transition-transform duration-300 group-hover:-translate-y-1">
                AI Contract Audit
              </div>
            </div>
            <div className="md:col-span-2 lg:col-span-4 relative rounded-[var(--radius-card)] overflow-hidden bg-[#111111] group">
              <motion.div style={{ y: bentoParallax2 }} className="absolute -inset-[15%] w-[130%] h-[130%] transition-transform duration-700 group-hover:scale-105">
                <Image src="/legalray-docs.jpg" alt="Legal analysis" width={800} height={600} className="absolute inset-0 w-full h-full object-cover opacity-80" />
              </motion.div>
              <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-[0.65rem] font-bold uppercase tracking-widest text-white z-10 transition-transform duration-300 group-hover:-translate-y-1">
                Deep Legal Analysis
              </div>
            </div>
            <div className="md:col-span-1 lg:col-span-6 relative rounded-[var(--radius-card)] overflow-hidden bg-[#111111] group">
              <motion.div style={{ y: bentoParallax2 }} className="absolute -inset-[15%] w-[130%] h-[130%] transition-transform duration-700 group-hover:scale-105">
                <Image src="/legalray-negotiation.jpg" alt="AI Negotiation" width={800} height={600} className="absolute inset-0 w-full h-full object-cover opacity-80" />
              </motion.div>
              <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-[0.65rem] font-bold uppercase tracking-widest text-white z-10 transition-transform duration-300 group-hover:-translate-y-1">
                Negotiation Assistant
              </div>
            </div>
            <div className="md:col-span-1 lg:col-span-6 relative rounded-[var(--radius-card)] overflow-hidden bg-[#E4E4E7] group">
              <motion.div style={{ y: bentoParallax1 }} className="absolute -inset-[15%] w-[130%] h-[130%] transition-transform duration-700 group-hover:scale-105">
                <video src="/legalray-paywall.mp4" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
              </motion.div>
              <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full text-[0.65rem] font-bold uppercase tracking-widest text-[#111] z-10 transition-transform duration-300 group-hover:-translate-y-1">
                Blurred Risk Paywall
              </div>
            </div>
          </div>
        </section>

        {/* 6. VISIT WEBSITE */}
        <section className="py-[12vh] px-[4vw] bg-[#111] flex items-center justify-center">
          <a
            href="https://legal-saas-rosy.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit LegalRay live website (opens in new tab)"
            className="group inline-flex items-center gap-4"
          >
            <span
              className="font-sans font-black text-[4vw] md:text-[3vw] tracking-tighter text-white transition-colors duration-300 group-hover:text-[#2563EB]"
            >
              {t('case.visitwebsite')}
            </span>
            <span className="text-[2vw] text-white group-hover:translate-x-2 transition-transform duration-300">→</span>
          </a>
        </section>

        {/* 7. MARQUEE */}
        <section className="py-[6vh] bg-[#F5F5F4] overflow-hidden select-none" aria-hidden="true">
          {([
            { keys: ['legalray.marquee.row1.1', 'legalray.marquee.row1.2', 'legalray.marquee.row1.3'], dir: 'left',  color: '#111', opacity: 0.08 },
            { keys: ['legalray.marquee.row2.1', 'legalray.marquee.row2.2', 'legalray.marquee.row2.3'], dir: 'right', color: BRAND,  opacity: 0.25 },
            { keys: ['legalray.marquee.row3.1', 'legalray.marquee.row3.2', 'legalray.marquee.row3.3'], dir: 'left',  color: '#111', opacity: 0.08 },
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
            aria-label="View next project: Confidential"
            className="group relative w-full max-w-5xl h-[40vh] rounded-[var(--radius-lg)] overflow-hidden flex items-center justify-center cursor-pointer"
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
