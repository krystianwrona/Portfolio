"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function LegalRayCaseStudy() {
  const router = useRouter();
  const containerRef = useRef<HTMLElement>(null);
  const [isExiting, setIsExiting] = useState<{ x: number, y: number } | null>(null);

  // Parallax for Bento Grid Images
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const bentoParallax1 = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const bentoParallax2 = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting({ x: e.clientX, y: e.clientY });
    setTimeout(() => {
      router.push('/');
    }, 800);
  };

  return (
    <>
      <main className="w-full min-h-screen bg-background" ref={containerRef}>

        {/* Fixed Back Button */}
        <button
          onClick={handleBack}
          className="fixed top-8 right-[4vw] z-50 mix-blend-difference text-white font-bold uppercase tracking-widest text-xs hover:opacity-50 transition-opacity magnetic-target"
        >
          [ CLOSE CASE ]
        </button>

        {/* 1. HERO SECTION (Fullscreen Project) */}
        <section id="CaseHero" className="relative w-full h-[100vh] flex items-center justify-center overflow-hidden bg-[#0F172A]">
          {/* Fullscreen Image Wrapper */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/legalray_cover.jpg" // Placeholder
              alt="LegalRay Dashboard HighRes"
              fill
              className="object-cover opacity-70 contrast-125 saturate-50"
              priority
            />
            {/* Subtle Grain Overlay (using CSS radial gradient for now as a fast approximation) */}
            <div className="absolute inset-0 bg-[#0F172A]/30 mix-blend-multiply" />
          </div>

          {/* Massive Overlay Title - Starts fully opaque so it perfectly matches the incoming transition */}
          <div className="relative z-10 w-full px-[4vw] mix-blend-difference pointer-events-none text-center">
            <motion.h1
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="font-sans font-black text-[15vw] leading-none tracking-tighter text-white"
            >
              LegalRay.
            </motion.h1>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
          >
            <span className="text-[0.65rem] uppercase tracking-widest font-bold text-white/50">Scroll Down</span>
            <div className="w-[1px] h-12 bg-white/30 overflow-hidden">
              <motion.div
                animate={{ y: [0, 48] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-full h-1/2 bg-white"
              />
            </div>
          </motion.div>
        </section>

        {/* 2. PROJECT META (Grid Details Minimal) */}
        <section id="ProjectMeta" className="py-[15vh] px-[4vw]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1, delayChildren: 0.2 }
              }
            }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10"
          >
            {/* Headline & Description */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              <motion.h2
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                }}
                className="font-sans font-black text-5xl md:text-7xl leading-[0.9] tracking-tighter text-[#111]"
              >
                Profesjonalna ochrona <br />prawna B2B.
              </motion.h2>
              <motion.p
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                }}
                className="text-[1.1rem] leading-[1.6] text-[#555] font-medium max-w-2xl"
              >
                Błyskawiczna analiza ryzyka i wykrywanie pułapek prawnych z wykorzystaniem modeli AI. LegalRay to system wspierający freelancerów, sektor MŚP i in-house działy prawne poprzez automatyzację żargonu prawnego i inteligentne generowanie bezpiecznych kontraktów.
              </motion.p>
            </div>

            {/* Metadata Columns */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-x-6 gap-y-10 border-t lg:border-t-0 lg:border-l border-[#111]/10 pt-10 lg:pt-0 lg:pl-10">
              {/* Roles */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}>
                <h4 className="text-[0.65rem] uppercase tracking-widest font-bold text-[#111]/50 mb-3">Roles</h4>
                <ul className="text-sm font-bold text-[#111] space-y-1">
                  <li>SaaS Architecture</li>
                  <li>AI Integration</li>
                  <li>UI/UX Design</li>
                </ul>
              </motion.div>

              {/* Tech Stack */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}>
                <h4 className="text-[0.65rem] uppercase tracking-widest font-bold text-[#111]/50 mb-3">Tech Stack</h4>
                <ul className="text-sm font-bold text-[#111] space-y-1">
                  <li>Next.js</li>
                  <li>Gemini 3.0 Pro</li>
                  <li>Gemini 2.5 Flash</li>
                  <li>Tailwind CSS</li>
                </ul>
              </motion.div>

              {/* Timeline */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}>
                <h4 className="text-[0.65rem] uppercase tracking-widest font-bold text-[#111]/50 mb-3">Timeline</h4>
                <p className="text-sm font-bold text-[#111]">Zakończono:<br />Marzec 2026</p>
              </motion.div>

              {/* Link */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}>
                <h4 className="text-[0.65rem] uppercase tracking-widest font-bold text-[#111]/50 mb-3">Live</h4>
                <a href="https://legal-saas-rosy.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#111] border-b-2 border-[#111] pb-1 hover:text-[#2563EB] hover:border-[#2563EB] transition-colors magnetic-target inline-block">
                  Visit Website
                </a>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* 3. APP FEATURES (Bento Grid Media) */}
        {/* 3. APP FEATURES (Bento Grid Media) */}
        <section id="AppFeatures" className="py-[5vh] px-[4vw]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-5 lg:gap-6 auto-rows-[350px]">
          {/* Dashboard Overview - Video Loop (span 8) */}
          <div className="md:col-span-2 lg:col-span-8 relative rounded-[32px] overflow-hidden bg-[#E4E4E7] group">
              <motion.div
                style={{ y: bentoParallax1 }}
                className="absolute -inset-[15%] w-[130%] h-[130%] bg-[#D4D4D8] flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
              >
                <span className="font-sans font-bold text-2xl text-[#111]/30">VIDEO: ai_contract_audit</span>
              </motion.div>
              {/* Label Overlay */}
              <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full text-[0.65rem] font-bold uppercase tracking-widest text-[#111] z-10 transition-transform duration-300 group-hover:-translate-y-1">
                Audyt Umów B2B & NDA
              </div>
            </div>

            {/* Navigation System - Image Parallax (span 4) */}
          <div className="md:col-span-2 lg:col-span-4 relative rounded-[32px] overflow-hidden bg-[#111111] group">
              <motion.div
                style={{ y: bentoParallax2 }}
                className="absolute -inset-[15%] w-[130%] h-[130%] bg-[#222222] flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
              >
                <span className="font-sans font-bold text-lg text-white/30 text-center">IMG: legalray_<br />court_docs</span>
              </motion.div>
              {/* Label Overlay */}
              <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-[0.65rem] font-bold uppercase tracking-widest text-white z-10 transition-transform duration-300 group-hover:-translate-y-1">
                Tłumaczenie Pism Sądowych
              </div>
            </div>

            {/* Document Management - Image Parallax (span 6) */}
          <div className="md:col-span-1 lg:col-span-6 relative rounded-[32px] overflow-hidden bg-[#111111] group">
              <motion.div
                style={{ y: bentoParallax2 }}
                className="absolute -inset-[15%] w-[130%] h-[130%] bg-[#222222] flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
              >
                <span className="font-sans font-bold text-2xl text-white/30">IMG: legalray_negotiation</span>
              </motion.div>
              {/* Label Overlay */}
              <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-[0.65rem] font-bold uppercase tracking-widest text-white z-10 transition-transform duration-300 group-hover:-translate-y-1">
                Asystent Negocjacji
              </div>
            </div>

            {/* Client Portal - Video Loop (span 6) */}
          <div className="md:col-span-1 lg:col-span-6 relative rounded-[32px] overflow-hidden bg-[#E4E4E7] group">
              <motion.div
                style={{ y: bentoParallax1 }}
                className="absolute -inset-[15%] w-[130%] h-[130%] bg-[#D4D4D8] flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
              >
                <span className="font-sans font-bold text-2xl text-[#111]/30">VIDEO: property_market_check</span>
              </motion.div>
              {/* Label Overlay */}
              <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full text-[0.65rem] font-bold uppercase tracking-widest text-[#111] z-10 transition-transform duration-300 group-hover:-translate-y-1">
                Rynek Nieruchomości
              </div>
            </div>
          </div>
        </section>

        {/* 4. RESULTS (Kinetic Typography Banner) */}
        <section id="Results" className="py-[15vh] bg-[#111111] overflow-hidden flex flex-col gap-[2vw]">

          {/* Row 1 (Left) */}
          <div className="flex whitespace-nowrap">
            <motion.h2
              className="font-sans font-black text-[12vw] leading-[0.85] tracking-tighter text-[#2563EB] uppercase"
              style={{ x: useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]) }}
            >
              BEZPIECZEŃSTWO ZERO-DATA • BEZPIECZEŃSTWO ZERO-DATA • BEZPIECZEŃSTWO ZERO-DATA •
            </motion.h2>
          </div>

          {/* Row 2 (Right) */}
          <div className="flex whitespace-nowrap">
            <motion.h2
              className="font-sans font-black text-[12vw] leading-[0.85] tracking-tighter text-white uppercase opacity-40"
              style={{ x: useTransform(scrollYProgress, [0, 1], ["-50%", "0%"]) }}
            >
              GEMINI 3.0 ENTERPRISE • GEMINI 3.0 ENTERPRISE • GEMINI 3.0 ENTERPRISE •
            </motion.h2>
          </div>

          {/* Row 3 (Left - Faster) */}
          <div className="flex whitespace-nowrap">
            <motion.h2
              className="font-sans font-black text-[12vw] leading-[0.85] tracking-tighter text-[#2563EB] uppercase"
              style={{ x: useTransform(scrollYProgress, [0, 1], ["0%", "-80%"]) }}
            >
              ZGODNOŚĆ Z PRAWEM UE • ZGODNOŚĆ Z PRAWEM UE • ZGODNOŚĆ Z PRAWEM UE •
            </motion.h2>
          </div>

        </section>

        {/* 5. NEXT PROJECT TEASER */}
        <section id="NextProject" className="py-[15vh] px-[4vw] bg-background flex flex-col items-center justify-center min-h-[70vh]">
          <div className="text-center mb-10">
            <span className="text-[0.65rem] uppercase tracking-widest font-bold text-[#111]/50">Up Next</span>
          </div>

          <a
            href="/projects/adoptme"
            className="group relative w-full max-w-5xl h-[50vh] rounded-[40px] overflow-hidden flex items-center justify-center cursor-pointer"
            data-cursor-text="NEXT CASE"
          >
            {/* Background Image / Color Placeholder */}
            <div className="absolute inset-0 bg-[#D97706] z-0 transition-transform duration-1000 group-hover:scale-105">
              {/* Liquid Distortion simulation */}
              <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.15),_transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl mix-blend-overlay" />
            </div>

            {/* Title */}
            <div className="relative z-10 text-center">
              <h2 className="font-sans font-black text-6xl md:text-9xl text-white tracking-tighter mix-blend-overlay">
                Adopt.me
              </h2>
            </div>
          </a>
        </section>

      </main>

      {/* EXIT TRANSITION OVERLAY */}
      <AnimatePresence>
        {isExiting && (
          <motion.div
            initial={{ clipPath: `circle(0px at ${isExiting.x}px ${isExiting.y}px)` }}
            animate={{ clipPath: `circle(150vw at ${isExiting.x}px ${isExiting.y}px)` }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[100] pointer-events-none bg-background"
          />
        )}
      </AnimatePresence>
    </>
  );
}
