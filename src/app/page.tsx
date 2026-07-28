"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  motion, useScroll, AnimatePresence,
  useInView, useMotionValue, useSpring, useTransform, animate, useReducedMotion,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { PROJECTS, PROJECT_ORDER } from "@/lib/projects";
import { SITE_URL, PERSON_ID } from "@/lib/seo";
import { SvgOutlineTitle } from "@/components/ui/SvgOutlineTitle";

// Three.js/@react-three bundle is code-split into its own chunk and
// only fetched on the client, after first paint, instead of blocking
// the homepage's main JS bundle.
const CrowScene = dynamic(() => import("@/components/CrowScene").then((m) => m.CrowScene), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#F5F5F4]" />,
});

const CONTACT_EMAIL = "krystian.wrona@protonmail.com";

/* ─── TYPES & DATA ───────────────────────────────────────────────────────── */

interface ProjectEntry {
  id: string;
  title: string;
  titleLines: string[];
  titleLinesMobile: string[];
  categoryKey: string;
  color: string;
  titleScale?: number;
  titleScaleLg?: number;
  titleScaleMobile?: number;
}

const CATEGORY_KEYS: Record<string, string> = {
  "folk-culture-center": "works.ckl.category",
  "adoptio": "works.adoptme.category",
  "legalray": "works.legalray.category",
  "fashionhero": "works.fashionhero.category",
  "ania-kampania": "works.aniak.category",
};

const PROJECT_DATA: ProjectEntry[] = PROJECT_ORDER.map((id) => ({
  id,
  title: PROJECTS[id].title,
  titleLines: PROJECTS[id].titleLines ?? [PROJECTS[id].title],
  titleLinesMobile: PROJECTS[id].titleLinesMobile ?? PROJECTS[id].titleLines ?? [PROJECTS[id].title],
  categoryKey: CATEGORY_KEYS[id],
  color: PROJECTS[id].brand,
  titleScale: PROJECTS[id].titleScale,
  titleScaleLg: PROJECTS[id].titleScaleLg,
  titleScaleMobile: PROJECTS[id].titleScaleMobile,
}));

const TECH_GROUPS = [
  {
    labelKey: "about.stack.group.frontend",
    items: [
      { name: "React / Next.js", bg: "#0F172A", color: "#61DAFB", rotation: -2   },
      { name: "TypeScript",      bg: "#3178C6", color: "#FFFFFF", rotation:  1.5 },
      { name: "Tailwind CSS",    bg: "#0891B2", color: "#FFFFFF", rotation:  1   },
      { name: "Framer Motion",   bg: "#0055FF", color: "#FFFFFF", rotation: -1.5 },
    ],
  },
  {
    labelKey: "about.stack.group.backend",
    items: [
      { name: "Vercel",       bg: "#000000", color: "#FFFFFF", rotation:  1.5 },
      { name: "Git / GitHub", bg: "#24292F", color: "#FFFFFF", rotation: -1.5 },
    ],
  },
  {
    labelKey: "about.stack.group.ai",
    items: [
      { name: "Claude Code",   bg: "#CC785C", color: "#FFFFFF", rotation:  2   },
      { name: "Claude Design", bg: "#D97757", color: "#FFFFFF", rotation: -1   },
      { name: "Cowork",        bg: "#7C3AED", color: "#FFFFFF", rotation:  1.5 },
      { name: "Gemini",        bg: "#1A73E8", color: "#FFFFFF", rotation: -2   },
    ],
  },
  {
    labelKey: "about.stack.group.design",
    items: [
      { name: "Figma", bg: "#F24E1E", color: "#FFFFFF", rotation: 2 },
    ],
  },
];

// Mirrors the Core Stack section (TECH_GROUPS) above, condensed to the
// skills a search engine should actually associate with this Person.
const PERSON_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": PERSON_ID,
  name: "Krystian Wrona",
  url: SITE_URL,
  email: "krystian.wrona@protonmail.com",
  jobTitle: "AI Product Builder & UI/UX Designer",
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Silesian University of Technology",
  },
  knowsAbout: [
    "React & Next.js",
    "TypeScript",
    "Tailwind CSS",
    "Framer Motion",
    "Firebase",
    "AI-Assisted Development",
    "UI/UX Design",
    "Figma",
  ],
  sameAs: [
    "https://www.linkedin.com/in/krystian-wrona/",
    "https://www.behance.net/krystianwrona3",
    "https://github.com/krystianwrona",
  ],
};

const HOW_I_WORK_STEPS = [
  { number: "01", titleKey: "about.work.step1.title", textKey: "about.work.step1.text" },
  { number: "02", titleKey: "about.work.step2.title", textKey: "about.work.step2.text" },
  { number: "03", titleKey: "about.work.step3.title", textKey: "about.work.step3.text" },
  { number: "04", titleKey: "about.work.step4.title", textKey: "about.work.step4.text" },
  { number: "05", titleKey: "about.work.step5.title", textKey: "about.work.step5.text" },
  { number: "06", titleKey: "about.work.step6.title", textKey: "about.work.step6.text" },
];

const ARCHITECTS_EYE_ITEMS = [
  {
    fromKey: "about.eye.item1.from", fromMobileKey: "about.eye.item1.from.mobile",
    toKey: "about.eye.item1.to", toMobileKey: "about.eye.item1.to.mobile",
    textKey: "about.eye.item1.text",
  },
  {
    // Full wording ("Composition"/"Kompozycja") doesn't fit text-base at 320px —
    // shrunk instead of shortened, since this pair's precision is the point.
    fromKey: "about.eye.item2.from", fromMobileKey: undefined as string | undefined,
    toKey: "about.eye.item2.to", toMobileKey: undefined as string | undefined,
    textKey: "about.eye.item2.text", mobileTextClass: "text-[15px]",
  },
  {
    fromKey: "about.eye.item3.from", fromMobileKey: "about.eye.item3.from.mobile",
    toKey: "about.eye.item3.to", toMobileKey: "about.eye.item3.to.mobile",
    textKey: "about.eye.item3.text",
  },
];

/* ─── COUNT UP ───────────────────────────────────────────────────────────── */

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to]);
  return <span ref={ref}>{display}{suffix}</span>;
}

/* ─── INFINITY SYMBOL — fade-in + scale ─────────────────────────────────── */

function InfinitySymbol() {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "inline-block" }}
    >
      ∞
    </motion.span>
  );
}

/* ─── PROJECT ROW — Awwwards list style ──────────────────────────────────── */

function ProjectRow({ project, onClick, index }: {
  project: ProjectEntry;
  onClick: (e: React.MouseEvent, id: string, route: string, color: string) => void;
  index: number;
}) {
  const { t } = useLanguage();
  // Below the md breakpoint the wrapper is a stretched flex-column item
  // (fixed width, driven by the viewport) — this is the available-width
  // reference SvgOutlineTitle shrinks the title against so an unbreakable
  // word (e.g. FashionHero) can never overflow it. Self-neutralizes at md+,
  // where the row switches to flex-row and the wrapper shrinks to its own
  // content instead of being stretched, so there's nothing to overflow.
  const fitRef = useRef<HTMLDivElement>(null);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  // Drives which pre-authored line break (and matching scale) renders — kept
  // in JS rather than pure CSS so SvgOutlineTitle's own lines prop actually
  // changes at the md breakpoint, which re-triggers its getBBox() remeasure.
  // Two parallel CSS-only <SvgOutlineTitle>s (one hidden per breakpoint)
  // would measure a hidden instance against a zero-size box.
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    setIsCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobileViewport(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobileViewport(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent, project.id, `/projects/${project.id}`, project.color);
    }
  };

  // Touch/coarse-pointer devices skip the y-transform on this wrapper entirely
  // (opacity-only reveal) — the stroked title inside otherwise sits inside an
  // ancestor whose animated `transform` triggers a real Android Chrome GPU
  // rasterization bug where -webkit-text-stroke renders as a doubled, offset
  // outline. Desktop keeps the original slide + fade untouched.
  const reveal = isCoarsePointer
    ? {
        initial: { opacity: 0 },
        whileInView: { opacity: 1, transition: { duration: 0.6, delay: index * 0.1 } },
      }
    : {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0, transition: { duration: 0.6, delay: index * 0.1 } },
      };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`View project: ${project.title} — ${t(project.categoryKey)}`}
      initial={reveal.initial}
      whileInView={reveal.whileInView}
      viewport={{ once: true, margin: "-10%" }}
      onClick={(e) => onClick(e, project.id, `/projects/${project.id}`, project.color)}
      onKeyDown={handleKeyDown}
      className="group relative border-b border-gray-800 py-6 md:py-20 cursor-pointer transition-colors duration-500 hover:border-white focus-visible:outline-none focus-visible:border-white overflow-hidden"
      style={{
        ['--project-color' as string]: project.color,
        ['--title-hover-color' as string]: project.color,
        // --title-scale-mobile drives the <md tier only; --title-scale drives
        // the md-lg tablet tier. Split so a mobile-only line-break change
        // (below md) can carry its own scale without shifting the tablet
        // tier, which keeps rendering the non-mobile titleLines untouched.
        ['--title-scale-mobile' as string]: project.titleScaleMobile ?? project.titleScale ?? 1,
        ['--title-scale' as string]: project.titleScale ?? 1,
        ['--title-scale-lg' as string]: project.titleScaleLg ?? 1,
      } as React.CSSProperties}
    >
      {/* Row content */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-baseline justify-between">
        <span className="sr-only">{project.title}</span>
        <div ref={fitRef} className="relative">
          <SvgOutlineTitle
            lines={isMobileViewport ? project.titleLinesMobile : project.titleLines}
            fillColor="#111"
            fitContainerRef={fitRef}
            className="font-display font-black text-[calc(13vw*var(--title-scale-mobile,1)*var(--auto-fit,1))] md:text-[calc(6rem*var(--title-scale,1)*var(--auto-fit,1))] lg:text-[calc(8vw*var(--title-scale-lg,1))] uppercase tracking-[0.01em]"
            strokeWidthClassName="[stroke-width:calc(3px*var(--title-scale-mobile,1)*var(--auto-fit,1))] md:[stroke-width:calc(3px*var(--title-scale,1)*var(--auto-fit,1))]"
          />
        </div>
        <span className="text-xs md:text-sm tracking-[0.2em] uppercase text-gray-600 group-hover:text-white transition-colors duration-500 mt-6 md:mt-0">
          {t(project.categoryKey)}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── MAGNETIC HEADING ───────────────────────────────────────────────────── */

function MagneticHeading({ children, onClick, className, ariaLabel }: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 100, damping: 15 });
  const springY = useSpring(y, { stiffness: 100, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (reduce) return;
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width  / 2)) * 0.15);
    y.set((e.clientY - (rect.top  + rect.height / 2)) * 0.15);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      ref={ref}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── CONTACT FORM ───────────────────────────────────────────────────────── */

function ContactForm({ onClose }: { onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const { t } = useLanguage();

  const inputCls = "w-full bg-transparent border-b border-white/40 py-4 text-white placeholder-white/50 font-medium text-sm focus:outline-none focus-visible:border-white focus:border-white/80 transition-colors duration-300 invalid:border-red-500/60";

  if (submitted) {
    return (
      <motion.div
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <h3 className="font-display font-black text-4xl text-white mb-4">{t('contact.form.success.title')}</h3>
        <p className="text-white/60 font-medium mb-8">{t('contact.form.success.text')}</p>
        <button onClick={onClose} className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors magnetic-target focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          {t('contact.form.success.close')}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(false);
        try {
          const res = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
          if (!res.ok) throw new Error("failed");
          setSubmitted(true);
        } catch {
          setSubmitError(true);
        } finally {
          setSubmitting(false);
        }
      }}
      className="w-full max-w-2xl mx-auto py-10 flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="contact-name" className="sr-only">Your Name (required)</label>
          <input
            id="contact-name"
            type="text"
            placeholder={t('contact.form.name')}
            required
            aria-required="true"
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="sr-only">Email Address (required)</label>
          <input
            id="contact-email"
            type="email"
            placeholder={t('contact.form.email')}
            required
            aria-required="true"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label htmlFor="contact-subject" className="sr-only">Subject (required)</label>
        <input
          id="contact-subject"
          type="text"
          placeholder={t('contact.form.subject')}
          required
          aria-required="true"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="sr-only">Your message (required)</label>
        <textarea
          id="contact-message"
          placeholder={t('contact.form.message')}
          required
          aria-required="true"
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={`${inputCls} resize-none`}
        />
      </div>
      {submitError && (
        <p role="alert" className="text-red-400 text-xs font-bold uppercase tracking-widest text-center">
          {t('contact.form.error')}{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t('contact.email.subject'))}`}
            className="underline hover:text-white transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      )}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4">
        <button type="button" onClick={onClose} className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          {t('contact.form.cancel')}
        </button>
        <motion.button
          type="submit"
          aria-label={t('contact.aria.send')}
          disabled={submitting}
          whileHover={submitting ? undefined : { scale: 1.02 }}
          whileTap={submitting ? undefined : { scale: 0.98 }}
          className="w-full sm:w-auto px-10 py-4 min-h-[48px] bg-white text-[#111] font-black uppercase tracking-widest text-sm rounded-full magnetic-target focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? t('contact.form.sending') : t('contact.form.send')}
        </motion.button>
      </div>
    </motion.form>
  );
}

/* ─── HOME ───────────────────────────────────────────────────────────────── */

export default function Home() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const handleProjectClick = (e: React.MouseEvent, projectId: string, route: string, color: string) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => router.push(route), 250);
  };

  const emailCopiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (emailCopiedTimeoutRef.current) clearTimeout(emailCopiedTimeoutRef.current);
    };
  }, []);

  const handleCopyEmail = async () => {
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setEmailCopied(true);
      if (emailCopiedTimeoutRef.current) clearTimeout(emailCopiedTimeoutRef.current);
      emailCopiedTimeoutRef.current = setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t('contact.email.subject'))}`;
    }
  };

  // A — always start from top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    PROJECT_DATA.forEach(p => router.prefetch(`/projects/${p.id}`));
  }, [router]);

  const containerRef  = useRef<HTMLDivElement>(null);
  const scrollRef     = useRef(0);
  const mouseRef      = useRef({ x: 0, y: 0 });
  const isHoveringRef = useRef(false);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const ghostOpacity = useTransform(scrollYProgress, [0, 0.12], [0, 1]);

  useEffect(() => {
    return scrollYProgress.on("change", (v) => { scrollRef.current = v; });
  }, [scrollYProgress]);

  return (
    <main
      id="main-content"
      className={`w-full min-h-screen bg-[#F5F5F4] transition-opacity duration-[250ms] ease-in-out ${isExiting ? "opacity-0" : "opacity-100"}`}
      ref={containerRef}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSON_LD) }}
      />

      {/* 1. HERO */}
      <section
        id="home"
        aria-labelledby="hero-heading"
        className="relative w-full h-[75vh] md:h-[100vh] overflow-hidden"
        onMouseMove={(e) => { mouseRef.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: -(e.clientY / window.innerHeight) * 2 + 1 }; }}
        onMouseEnter={() => { isHoveringRef.current = true; }}
        onMouseLeave={() => { isHoveringRef.current = false; }}
      >
        {/* Main headline — ghost outline watermark, scroll-revealed */}
        <motion.div
          className="absolute inset-0 z-[5] hidden md:flex items-end justify-center pb-[15vh] pointer-events-none select-none overflow-hidden"
          style={{ opacity: ghostOpacity }}
        >
          <h1
            id="hero-heading"
            className="font-display font-black leading-[0.85] tracking-tighter text-center uppercase"
            style={{ fontSize: 'clamp(60px, 9vw, 160px)' }}
          >
            <span style={{ color: '#F5F5F4', WebkitTextStroke: '2px rgba(17, 17, 17, 0.12)', paintOrder: 'stroke fill' }}>
              {t('hero.headline.where')}
            </span>
            <br />
            <span style={{ color: '#F5F5F4', WebkitTextStroke: '2px rgba(17, 17, 17, 0.12)', paintOrder: 'stroke fill', filter: 'brightness(0.97)' }}>
              {t('hero.headline.architecture')}
            </span>
            <br />
            <span style={{ color: '#F5F5F4', WebkitTextStroke: '2px rgba(17, 17, 17, 0.12)', paintOrder: 'stroke fill' }}>
              {t('hero.headline.meets')}
            </span>
          </h1>
        </motion.div>

        {/* Canvas bird — decorative illustration */}
        <div role="img" aria-label={t('hero.aria.crow')} className="absolute inset-0 z-10">
          <CrowScene scrollRef={scrollRef} mouseRef={mouseRef} isHoveringRef={isHoveringRef} />
        </div>

        {/* Mobile hero text — variant C, scroll-revealed */}
        <motion.div
          className="absolute bottom-[10vh] left-0 right-0 z-20 pointer-events-none text-center md:hidden"
          style={{ opacity: ghostOpacity }}
        >
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#111]/40 leading-relaxed">
            {t('hero.headline.where')} {t('hero.headline.architecture')} {t('hero.headline.meets')}
          </p>
        </motion.div>

        {/* Scroll indicator — decorative */}
        <div aria-hidden="true" className="absolute bottom-[4vh] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-20">
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="w-[1px] h-[32px] bg-[#555]"
          />
        </div>
      </section>

      {/* 2. SELECTED WORKS */}
      <section id="projects" aria-labelledby="projects-heading" className="py-16 md:py-48 px-8 md:px-[4vw] relative z-20 bg-[#111] text-white overflow-hidden">
        <motion.p
          id="projects-heading"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6 }}
          className="text-xs md:text-sm uppercase tracking-[0.2em] mb-8 md:mb-20 text-gray-400"
        >
          {t('works.title')}
        </motion.p>
        <div className="flex flex-col">
          {PROJECT_DATA.map((project, index) => (
            <ProjectRow key={project.id} project={project} index={index} onClick={handleProjectClick} />
          ))}
        </div>
      </section>

      {/* 3. BEYOND THE CODE */}
      <section id="about" aria-labelledby="about-heading" className="py-[20vh] px-[4vw] bg-[#F5F5F4] relative z-20">
        <div className="flex flex-col lg:flex-row gap-[10vw] items-start">
          <div className="w-full lg:w-[45%] lg:sticky lg:top-[20vh]">
            <motion.h2
              id="about-heading"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-black text-[12vw] lg:text-[6vw] leading-[1.15] tracking-tighter"
            >
              {t('about.title.1')} <br /><span className="text-yellow-400">{t('about.title.2')}</span>
            </motion.h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } }}
            className="w-full lg:w-[55%] flex flex-col gap-8"
          >
            {/* Philosophy */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}
              className="p-10 rounded-[32px] bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] text-[#111]"
            >
              <h3 className="font-display font-black text-2xl mb-4">{t('about.philosophy.title')}</h3>
              <div className="flex flex-col gap-4 max-w-[720px]">
                <p className="text-[1rem] leading-[1.6] opacity-80 font-medium">{t('about.philosophy.text1')}</p>
                <p className="text-[1rem] leading-[1.6] opacity-80 font-medium">{t('about.philosophy.text2')}</p>
                <p className="text-[1rem] leading-[1.6] opacity-80 font-medium">{t('about.philosophy.text3')}</p>
              </div>
            </motion.div>

            {/* How I Work */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}
              className="p-10 rounded-[32px] bg-[#111111] text-white"
            >
              <h3 className="font-display font-black text-2xl mb-4">{t('about.work.title')}</h3>
              <p className="text-[1rem] leading-[1.6] opacity-80 font-medium max-w-[720px] mb-8">
                {t('about.work.intro')}
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6 list-none p-0 m-0" aria-label={t('about.work.title')}>
                {HOW_I_WORK_STEPS.map((step) => (
                  <li key={step.number}>
                    <span className="font-display font-black text-sm text-yellow-400 tracking-tighter block mb-2" aria-hidden="true">
                      {step.number}
                    </span>
                    <h4 className="font-display font-black text-lg mb-1">{t(step.titleKey)}</h4>
                    <p className="text-sm leading-[1.6] opacity-70 font-medium max-w-[640px]">{t(step.textKey)}</p>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Architect's Eye */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}
              className="p-10 rounded-[32px] bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] text-[#111]"
            >
              <h3 className="font-display font-black text-2xl mb-6">{t('about.eye.title')}</h3>
              <ul className="flex flex-col gap-6 list-none p-0 m-0">
                {ARCHITECTS_EYE_ITEMS.map((item) => (
                  <li key={item.fromKey}>
                    <p className={`font-display font-black ${item.mobileTextClass ?? "text-base"} sm:text-lg mb-1 whitespace-nowrap sm:whitespace-normal`}>
                      <span className="sm:hidden">{t(item.fromMobileKey ?? item.fromKey)}</span>
                      <span className="hidden sm:inline">{t(item.fromKey)}</span>
                      {" "}<span className="text-[#111]">→</span>{" "}
                      <span className="sm:hidden">{t(item.toMobileKey ?? item.toKey)}</span>
                      <span className="hidden sm:inline">{t(item.toKey)}</span>
                    </p>
                    <p className="text-sm leading-[1.6] opacity-70 font-medium max-w-[640px]">{t(item.textKey)}</p>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Tech Stack — brutalist stickers, grouped */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}
              className="p-10 rounded-[32px] bg-[#111111] text-white"
            >
              <p className="text-xs font-bold uppercase tracking-widest opacity-50 block mb-6">{t('about.stack')}</p>
              <div className="flex flex-col gap-6" aria-label={t('about.aria.stack')}>
                {TECH_GROUPS.map((group) => (
                  <div key={group.labelKey}>
                    <p className="text-[0.7rem] font-bold uppercase tracking-widest opacity-40 mb-3">{t(group.labelKey)}</p>
                    <ul className="flex flex-wrap gap-3 list-none p-0 m-0">
                      {group.items.map((tech) => (
                        <li key={tech.name}>
                          <motion.span
                            title={tech.name}
                            whileHover={{ rotate: 0, scale: 1.06 }}
                            style={{ rotate: tech.rotation, backgroundColor: tech.bg, color: tech.color }}
                            className="px-4 py-2 rounded-lg font-bold text-sm tracking-tight cursor-default border border-white/10 select-none inline-block"
                          >
                            {tech.name}
                          </motion.span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Stats — count up */}
            <div className="flex flex-col sm:flex-row gap-4">
              {[
                { to: 5,  suffix: "+", labelKey: "about.stats.projects", infinity: false },
                { to: 11, suffix: "+", labelKey: "about.stats.tools",    infinity: false },
                { to: 0,  suffix: "",  labelKey: "about.stats.curiosity", infinity: true  },
              ].map((stat, i) => (
                <motion.div
                  key={stat.labelKey}
                  variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] } } }}
                  className="flex-1 p-8 rounded-[32px] bg-[#111] text-[#F8F8F8] flex flex-col justify-between min-h-[160px]"
                >
                  <div
                    className="font-display font-black text-5xl tracking-tighter mb-2"
                    aria-label={stat.infinity ? t(stat.labelKey) : `${stat.to}${stat.suffix} ${t(stat.labelKey)}`}
                  >
                    <span aria-hidden="true">
                      {stat.infinity ? <InfinitySymbol /> : <CountUp to={stat.to} suffix={stat.suffix} />}
                    </span>
                  </div>
                  <p className="font-bold uppercase tracking-widest text-xs opacity-50">{t(stat.labelKey)}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. CONTACT */}
      <section id="contact" aria-labelledby="contact-heading" className="pt-[10vh] pb-[5vh] px-[4vw] bg-[#111111] text-[#F8F8F8] rounded-t-[40px] mt-[-40px] relative z-30 flex flex-col">
        <div className="flex-1 flex items-center justify-center py-[8vh]">
          <MagneticHeading
            onClick={() => setContactOpen((v) => !v)}
            ariaLabel={`${t('contact.headline.1')} ${t('contact.headline.2')} ${t('contact.headline.3')} — ${contactOpen ? "close" : "open"} contact form`}
            className="cursor-pointer select-none group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#111111]"
          >
            <h2 id="contact-heading" className="font-display font-black text-[8vw] md:text-[7vw] leading-[0.85] tracking-tighter text-center transition-colors duration-500">
              {t('contact.headline.1')}<br />{t('contact.headline.2')} <span className="group-hover:text-[#FACC15] transition-colors duration-300">{t('contact.headline.3')}</span>
            </h2>
            <motion.p
              aria-hidden="true"
              className="text-center text-xs font-bold uppercase tracking-widest text-white/60 mt-10 pointer-events-none"
              animate={shouldReduceMotion ? {} : { y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              {t('contact.cta')}
            </motion.p>
          </MagneticHeading>
        </div>

        <AnimatePresence>
          {contactOpen && (
            <motion.div
              key="contact-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t border-white/10"
            >
              <ContactForm onClose={() => setContactOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row justify-between items-end gap-10 mt-10 pt-8 border-t border-white/10">
          <p className="text-[0.85rem] opacity-60 font-medium">
            &copy; {new Date().getFullYear()} KRYSTIAN.WRONA. {t('footer.rights')}
          </p>
          <ul className="flex flex-wrap gap-x-8 text-[0.85rem] font-bold uppercase tracking-widest list-none p-0 m-0" aria-label={t('footer.aria.sociallinks')}>
            <li>
              <button
                type="button"
                onClick={handleCopyEmail}
                title={CONTACT_EMAIL}
                aria-label={`${t('footer.aria.email')}: ${CONTACT_EMAIL}`}
                className="bg-transparent border-0 p-0 cursor-pointer opacity-80 hover:opacity-100 hover:text-[#FACC15] transition-colors duration-300 min-h-[44px] inline-flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {emailCopied ? t('footer.email.copied') : t('footer.email.label')}
              </button>
              <span aria-live="polite" className="sr-only">
                {emailCopied ? t('footer.email.copied') : ''}
              </span>
            </li>
            <li>
              <a
                href="https://www.linkedin.com/in/krystian-wrona/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('footer.aria.linkedin')}
                className="opacity-80 hover:opacity-100 hover:text-[#FACC15] transition-colors duration-300 min-h-[44px] inline-flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href="https://www.behance.net/krystianwrona3"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('footer.aria.behance')}
                className="opacity-80 hover:opacity-100 hover:text-[#FACC15] transition-colors duration-300 min-h-[44px] inline-flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Behance
              </a>
            </li>
            <li>
              <a
                href="https://github.com/krystianwrona"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('footer.aria.github')}
                className="opacity-80 hover:opacity-100 hover:text-[#FACC15] transition-colors duration-300 min-h-[44px] inline-flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </section>

    </main>
  );
}
