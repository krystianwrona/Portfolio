"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-[10vh] flex items-center fixed top-0 left-0 z-[9999] px-[4vw] bg-[#F8F8F8]/80 backdrop-blur-[16px] border-b border-[#111111]/[0.05] pointer-events-none"
    >
      {/* LOGO */}
      <div className="flex items-center pointer-events-auto">
        <Link 
          href="/" 
          className="font-serif font-black text-2xl tracking-tighter text-[#111111]"
          style={{ letterSpacing: "-0.05em" }}
        >
          KRYSTIAN.WRONA
        </Link>
      </div>

      {/* LINKS - CENTERED */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6 md:gap-10 text-[0.65rem] md:text-[0.75rem] uppercase tracking-widest font-bold text-[#111111]/70 pointer-events-auto">
        <Link href="#" className="transition-opacity hover:opacity-70 magnetic-target">HOME</Link>
        <Link href="#projects" className="transition-opacity hover:opacity-70 magnetic-target hidden sm:block">PROJECTS</Link>
        <Link href="#about" className="transition-opacity hover:opacity-70 magnetic-target hidden sm:block">ABOUT ME</Link>
        <Link href="#contact" className="transition-opacity hover:opacity-70 magnetic-target">CONTACT</Link>
      </div>
    </motion.nav>
  );
}
