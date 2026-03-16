"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { useLenis } from "lenis/react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

const NAV_LINKS_CONFIG = [
  { key: "nav.home",     href: "#",        sectionId: "home"    },
  { key: "nav.projects", href: "#projects", sectionId: "projects" },
  { key: "nav.about",    href: "#about",    sectionId: "about"   },
  { key: "nav.contact",  href: "#contact",  sectionId: "contact" },
];

const NAV_OFFSET = -80;

export function Navbar() {
  const [menuOpen, setMenuOpen]       = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const [showCrow, setShowCrow]       = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const lenis = useLenis();
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";
  const { lang, setLang, t } = useLanguage();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Auto-toggle WRONA ↔ CROW every 15s
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    if (logoHovered) return;

    const interval = setInterval(() => {
      setShowCrow(true);
      setTimeout(() => setShowCrow(false), 2000);
    }, 15000);
    return () => clearInterval(interval);
  }, [logoHovered]);

  const displayCrow = showCrow || logoHovered;

  // Active section via IntersectionObserver
  useEffect(() => {
    const sectionIds = ["home", "projects", "about", "contact"];
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.3 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    if (isHomePage) {
      if (href === "#" || href === "/") {
        lenis?.scrollTo(0, { duration: 1.2 });
      } else {
        lenis?.scrollTo(href, { duration: 1.2, offset: NAV_OFFSET });
      }
    } else {
      if (href === "#" || href === "/") {
        router.push("/");
      } else {
        router.push(href.startsWith("#") ? `/${href}` : href);
      }
    }
  };

  const handleMobileNavClick = (e: React.MouseEvent, href: string) => {
    handleNavClick(e, href);
    setMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-[7vh] flex items-center fixed top-0 left-0 z-[200] px-[4vw] bg-[#F8F8F8]/80 backdrop-blur-[16px] border-b border-[#111111]/[0.05]"
      >
        {/* SCROLL PROGRESS — black */}
        <motion.div
          className="absolute bottom-0 left-0 h-[2px] bg-[#111111] origin-left"
          style={{ scaleX, width: "100%" }}
        />

        {/* LOGO — WRONA → CROW on hover */}
        <button
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
          onClick={(e) => handleNavClick(e, "#")}
          className="font-serif font-black text-2xl tracking-tighter text-[#111111] flex items-baseline gap-0"
          style={{ letterSpacing: "-0.05em" }}
          aria-label="Go to top"
        >
          <span>KRYSTIAN.</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={displayCrow ? "crow" : "wrona"}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {displayCrow ? "CROW" : "WRONA"}
            </motion.span>
          </AnimatePresence>
        </button>

        {/* DESKTOP LINKS — centered, yellow on hover/active */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-10 text-[0.75rem] uppercase tracking-widest font-bold text-[#111111]/70">
          {NAV_LINKS_CONFIG.map((link) => (
            <a
              key={link.key}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={`transition-colors duration-300 magnetic-target focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4 focus-visible:decoration-[#111111] ${
                activeSection === link.sectionId
                  ? "text-[#111111] font-black"
                  : "hover:text-[#111111] hover:opacity-100"
              }`}
            >
              {t(link.key)}
            </a>
          ))}
        </div>

        {/* RIGHT SIDE — Language toggle + mobile menu button */}
        <div className="ml-auto flex items-center gap-4">
          {/* LANGUAGE TOGGLE */}
          <button
            onClick={() => setLang(lang === 'en' ? 'pl' : 'en')}
            className="hidden md:block text-[0.7rem] font-bold tracking-widest uppercase text-[#111]/50 hover:text-[#111] transition-colors duration-300 focus-visible:outline-none focus-visible:text-[#111]"
            aria-label="Switch language"
          >
            {lang === 'en' ? 'PL' : 'EN'}
          </button>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden text-[0.75rem] font-black uppercase tracking-widest text-[#111111] hover:opacity-60 transition-opacity"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? "CLOSE" : "MENU"}
          </button>
        </div>
      </motion.nav>

      {/* MOBILE FULL-SCREEN OVERLAY */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            id="mobile-menu"
            key="mobile-menu"
            role="navigation"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[99] bg-[#F8F8F8] flex flex-col items-center justify-center gap-10"
          >
            {NAV_LINKS_CONFIG.map((link, i) => (
              <motion.div
                key={link.key}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <a
                  href={link.href}
                  onClick={(e) => handleMobileNavClick(e, link.href)}
                  className="font-black text-[12vw] uppercase tracking-tighter text-[#111111] hover:text-[#FACC15] transition-colors duration-300"
                >
                  {t(link.key)}
                </a>
              </motion.div>
            ))}

            {/* Mobile language toggle */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: NAV_LINKS_CONFIG.length * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <button
                onClick={() => setLang(lang === 'en' ? 'pl' : 'en')}
                className="text-[0.8rem] font-bold tracking-widest uppercase text-[#111]/40 hover:text-[#111] transition-colors duration-300"
                aria-label="Switch language"
              >
                {lang === 'en' ? '🌐 PL' : '🌐 EN'}
              </button>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
