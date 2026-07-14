"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useSpring, useReducedMotion } from "framer-motion";
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
  const [menuOpen, setMenuOpen]           = useState(false);
  const [logoHovered, setLogoHovered]     = useState(false);
  const [showCrow, setShowCrow]           = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const lenis            = useLenis();
  const pathname         = usePathname();
  const router           = useRouter();
  const isHomePage       = pathname === "/";
  const { lang, setLang, t } = useLanguage();
  const shouldReduceMotion   = useReducedMotion();
  const hamburgerRef         = useRef<HTMLButtonElement>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Auto-toggle WRONA ↔ CROW every 15s — disabled under reduced motion
  useEffect(() => {
    if (shouldReduceMotion) return;
    if (logoHovered) return;
    const interval = setInterval(() => {
      setShowCrow(true);
      setTimeout(() => setShowCrow(false), 2000);
    }, 15000);
    return () => clearInterval(interval);
  }, [logoHovered, shouldReduceMotion]);

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Focus management — move focus into menu on open, return to hamburger on close
  useEffect(() => {
    if (menuOpen) {
      const menu = document.getElementById("mobile-menu");
      const first = menu?.querySelector<HTMLElement>("a, button");
      // Small delay lets AnimatePresence finish mounting before focus
      const id = setTimeout(() => first?.focus(), 50);
      return () => clearTimeout(id);
    } else {
      hamburgerRef.current?.focus();
    }
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

  // Focus trap + Escape handler for mobile menu
  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setMenuOpen(false);
      return;
    }
    if (e.key !== "Tab") return;
    const menu = document.getElementById("mobile-menu");
    const focusables = menu?.querySelectorAll<HTMLElement>("a, button");
    if (!focusables?.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  };

  return (
    <>
      <motion.nav
        initial={shouldReduceMotion ? false : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-[7vh] flex items-center fixed top-0 left-0 z-[200] px-[4vw] bg-[#F8F8F8]/80 backdrop-blur-[16px] border-b border-[#111111]/[0.05]"
      >
        {/* SCROLL PROGRESS */}
        <motion.div
          className="absolute bottom-0 left-0 h-[2px] bg-[#111111] origin-left"
          style={{ scaleX, width: "100%" }}
        />

        {/* LOGO — WRONA ↔ CROW */}
        <button
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
          onClick={(e) => handleNavClick(e, "#")}
          className="font-display font-black text-2xl tracking-tighter text-[#111111] flex items-baseline gap-0 focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 focus-visible:rounded-sm focus-visible:outline-none"
          style={{ letterSpacing: "-0.05em" }}
          aria-label="Go to top"
        >
          <span>KRYSTIAN.</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={displayCrow ? "crow" : "wrona"}
              initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {displayCrow ? "CROW" : "WRONA"}
            </motion.span>
          </AnimatePresence>
        </button>

        {/* DESKTOP LINKS */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-10 text-[0.75rem] uppercase tracking-widest font-bold text-[#111111]/60">
          {NAV_LINKS_CONFIG.map((link) => (
            <a
              key={link.key}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={`transition-colors duration-300 magnetic-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 focus-visible:rounded-sm ${
                activeSection === link.sectionId
                  ? "font-black text-[#111111] opacity-100"
                  : "hover:text-[#111111]/90"
              }`}
            >
              {t(link.key)}
            </a>
          ))}
        </div>

        {/* RIGHT SIDE */}
        <div className="ml-auto flex items-center gap-4">
          {/* LANGUAGE TOGGLE */}
          <button
            onClick={() => setLang(lang === "en" ? "pl" : "en")}
            className="hidden md:block text-[0.7rem] font-bold tracking-widest uppercase text-[#111]/50 hover:text-[#111] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 focus-visible:rounded-sm"
            aria-label={lang === "en" ? "Switch to Polish" : "Switch to English"}
          >
            {lang === "en" ? "PL" : "EN"}
          </button>

          {/* MOBILE HAMBURGER */}
          <button
            ref={hamburgerRef}
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden text-[0.75rem] font-black uppercase tracking-widest text-[#111111] hover:opacity-60 focus-visible:opacity-60 focus-visible:underline underline-offset-4 transition-opacity focus-visible:outline-none"
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
            onKeyDown={handleMenuKeyDown}
            initial={shouldReduceMotion ? false : { opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -40 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[99] bg-[#F8F8F8] flex flex-col items-center justify-center gap-10"
          >
            {NAV_LINKS_CONFIG.map((link, i) => (
              <motion.div
                key={link.key}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <a
                  href={link.href}
                  onClick={(e) => handleMobileNavClick(e, link.href)}
                  className="font-black text-[12vw] uppercase tracking-tighter text-[#111111] hover:text-[#FACC15] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-4 focus-visible:rounded-sm"
                >
                  {t(link.key)}
                </a>
              </motion.div>
            ))}

            {/* Mobile language toggle */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: NAV_LINKS_CONFIG.length * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <button
                onClick={() => setLang(lang === "en" ? "pl" : "en")}
                className="text-[0.8rem] font-bold tracking-widest uppercase text-[#111]/40 hover:text-[#111] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 focus-visible:rounded-sm"
                aria-label={lang === "en" ? "Switch to Polish" : "Switch to English"}
              >
                {lang === "en" ? "🌐 PL" : "🌐 EN"}
              </button>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
