"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export default function ClassifiedPage() {
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

        {/* Back link */}
        <Link
          href="/#projects"
          className="absolute top-[calc(7vh+2rem)] left-[4vw] z-20 text-[0.7rem] font-bold uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors"
        >
          {t('case.back')}
        </Link>

        {/* Noise grid background */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, #fff 0px, transparent 1px, transparent 80px)" }} />

        <div className="relative z-10 flex flex-col items-center text-center px-[4vw]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/30 block mb-8">Classified</span>
            <h1 className="font-sans font-black text-[20vw] md:text-[15vw] leading-none tracking-tighter text-white/10 select-none">
              XX
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

          {/* Blinking cursor */}
          <motion.div
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="mt-16 w-[2px] h-10 bg-white/30"
          />
        </div>

        {/* Bottom label */}
        <div className="absolute bottom-[5vh] left-1/2 -translate-x-1/2">
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/20">Confidential</span>
        </div>
      </main>

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
