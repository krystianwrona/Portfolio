"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Preloader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = "";
    }, 2400);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="preloader"
          role="status"
          aria-label="Loading page"
          aria-live="polite"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.5, ease: "easeIn" } }}
          className="fixed inset-0 z-[999999] bg-[#111111] flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="flex items-baseline select-none"
          >
            <span className="font-sans font-black text-[15vw] leading-none tracking-tighter text-[#F8F8F8]">K</span>
            <div className="inline-block w-[2.2vw] h-[2.2vw] rounded-full bg-[#FACC15] ml-[3.8vw] mr-[0.4vw]" />
            <span className="font-sans font-black text-[15vw] leading-none tracking-tighter text-[#F8F8F8]">W</span>
          </motion.div>

          <div className="absolute bottom-[8vh] left-[4vw] right-[4vw] h-[1px] bg-white/10 overflow-hidden rounded-full">
            <motion.div
              className="h-full bg-white/40"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.0, ease: "linear", delay: 0.3 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
