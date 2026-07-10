"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

const BRAND = "#E11D48";

export default function FashionHeroPage() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState<{ x: number; y: number } | null>(null);
  const { t } = useLanguage();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting({ x: e.clientX, y: e.clientY });
    setTimeout(() => router.push("/"), 800);
  };

  return (
    <>
      <main className="w-full min-h-screen bg-[#111111] flex flex-col items-center justify-center relative overflow-hidden">
        <button
          onClick={handleBack}
          className="fixed top-8 right-[4vw] z-50 mix-blend-difference text-white font-bold uppercase tracking-widest text-xs hover:opacity-50 transition-opacity magnetic-target"
        >
          {t('case.close')}
        </button>

        <Link
          href="/#projects"
          className="absolute top-[calc(7vh+2rem)] left-[4vw] z-20 text-[0.7rem] font-bold uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors"
        >
          {t('case.back')}
        </Link>

        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, #fff 0px, transparent 1px, transparent 80px)" }} />

        <div className="relative z-10 flex flex-col items-center text-center px-[4vw]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/30 block mb-8">Fashion Tech</span>
            <h1
              className="font-sans font-black leading-none tracking-tighter select-none"
              style={{ fontSize: "clamp(4rem, 15vw, 14rem)", color: BRAND, opacity: 0.15 }}
            >
              FH
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 flex flex-col items-center gap-4"
          >
            <p className="font-sans font-black text-2xl md:text-4xl text-white tracking-tighter">
              {t('confidential.text')}
            </p>
            <p className="text-white/40 font-medium text-sm tracking-widest uppercase">
              {t('confidential.subtext')}
            </p>
          </motion.div>

          <motion.div
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="mt-16 w-[2px] h-10"
            style={{ backgroundColor: BRAND, opacity: 0.4 }}
          />
        </div>

        <div className="absolute bottom-[5vh] left-1/2 -translate-x-1/2">
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/20">FashionHero</span>
        </div>
      </main>

      {/* Up Next */}
      <section className="py-[15vh] px-[4vw] bg-[#111111] flex flex-col items-center justify-center min-h-[60vh] border-t border-white/5">
        <div className="text-center mb-10">
          <span className="text-[0.65rem] uppercase tracking-widest font-bold text-white/20">{t('case.upnext')}</span>
        </div>
        <a
          href="/projects/ania-kampania"
          aria-label="View next project: Ania Kampania"
          className="group relative w-full max-w-5xl h-[40vh] rounded-[var(--radius-lg)] overflow-hidden flex items-center justify-center cursor-pointer"
        >
          <div className="absolute inset-0 bg-[#B25818] z-0 transition-transform duration-1000 group-hover:scale-105">
            <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.15),_transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl mix-blend-overlay" />
          </div>
          <div className="relative z-10 text-center">
            <h2 className="font-sans font-black text-5xl md:text-9xl text-white tracking-tighter">Ania Kampania</h2>
          </div>
        </a>
      </section>

      <AnimatePresence>
        {isExiting && (
          <motion.div
            initial={{ clipPath: `circle(0px at ${isExiting.x}px ${isExiting.y}px)` }}
            animate={{ clipPath: `circle(150vw at ${isExiting.x}px ${isExiting.y}px)` }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[100] pointer-events-none bg-[#111111]"
          />
        )}
      </AnimatePresence>
    </>
  );
}
