"use client";

import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import {
  motion, useScroll, AnimatePresence,
  useInView, useMotionValue, useSpring, useTransform, animate, useReducedMotion,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useLanguage } from "@/context/LanguageContext";

/* ─── TYPES & DATA ───────────────────────────────────────────────────────── */

interface ProjectEntry {
  id: string;
  title: string;
  categoryKey: string;
  logo: string;
  logoUrl?: string;
  color: string;
}

const PROJECT_DATA: ProjectEntry[] = [
  { id: "adoptme",    title: "Adoptio",      categoryKey: "works.adoptme.category",      logo: "AM", color: "#F97316" },
  { id: "legalray",   title: "LegalRay",     categoryKey: "works.legalray.category",     logo: "LR", logoUrl: "/logo-LR.png", color: "#2563EB" },
  { id: "classified", title: "Confidential", categoryKey: "works.confidential.category", logo: "XX", color: "#1A1A1A" },
];

const TECH_ITEMS = [
  { name: "React / Next.js", bg: "#0F172A", color: "#61DAFB", rotation: -2   },
  { name: "TypeScript",      bg: "#3178C6", color: "#FFFFFF", rotation:  1.5 },
  { name: "Firebase",        bg: "#1A1A1A", color: "#FFCA28", rotation: -1   },
  { name: "Figma",           bg: "#F24E1E", color: "#FFFFFF", rotation:  2   },
  { name: "Framer Motion",   bg: "#0055FF", color: "#FFFFFF", rotation: -1.5 },
  { name: "Tailwind CSS",    bg: "#0891B2", color: "#FFFFFF", rotation:  1   },
  { name: "Claude",          bg: "#CC785C", color: "#FFFFFF", rotation: -1   },
  { name: "Gemini",          bg: "#1A73E8", color: "#FFFFFF", rotation:  1.5 },
];

/* ─── GLSL — BIRD UNTOUCHED ──────────────────────────────────────────────── */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uScroll;
  uniform float uHover;
  uniform vec2 uMouseWorld;
  uniform sampler2D uTexture;
  uniform float uHeadRotationY;
  uniform vec3 uNeckPivot;
  attribute float aIsHead;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main() {
    vUv = uv;
    vec4 tex = texture2D(uTexture, uv);
    float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    if (lum > 0.45) {
      gl_Position = vec4(9999.0, 9999.0, 9999.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }
    vec3 pos = position;

    // Head rotation — smooth blend controlled by aIsHead weight
    vec3 rel = pos - uNeckPivot;
    float cosA = cos(uHeadRotationY);
    float sinA = sin(uHeadRotationY);
    vec3 rotated = vec3(
      rel.x * cosA - rel.z * sinA,
      rel.y,
      rel.x * sinA + rel.z * cosA
    );
    pos = mix(pos, rotated + uNeckPivot, aIsHead);

    float rnd = hash(uv);
    float speed = 2.0 + rnd * 2.0;
    pos.x += sin(uTime * speed + rnd * 100.0) * 0.003;
    pos.y += cos(uTime * speed * 0.8 + rnd * 100.0) * 0.003;
    pos.z += sin(uTime * speed * 1.2 + rnd * 100.0) * 0.005;
    vec2 toMouse = pos.xy - uMouseWorld;
    float dist = length(toMouse);
    float force = smoothstep(0.18, 0.0, dist) * uHover;
    vec2 dir = normalize(toMouse + 0.0001);
    pos.xy += dir * force * 0.015;
    pos.z += force * 0.03;
    float scrollEase = uScroll * uScroll * 2.5;
    vec3 explodeDir = normalize(vec3(pos.xy, (rnd - 0.5) * 0.5));
    pos += explodeDir * scrollEase * 45.0;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 2.0 * (5.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uScroll;
  void main() {
    vec2 coord = gl_PointCoord - 0.5;
    if (length(coord) > 0.5) discard;
    float alpha = clamp(1.0 - uScroll * 1.5, 0.0, 1.0);
    gl_FragColor = vec4(0.067, 0.067, 0.067, alpha);
  }
`;

/* ─── R3F MESH — UNTOUCHED ───────────────────────────────────────────────── */

// ── Head segmentation constants (tune these after visual inspection) ──────────
// HEAD_Y_THRESHOLD: local Y above which particles are "head" (range -0.5..0.5)
const HEAD_Y_THRESHOLD = 0.18;
// Blend zone half-width — smoothstep transition (0 = hard cutoff)
const HEAD_Y_BLEND = 0.05;
// Neck pivot in local object space — rotation center
const NECK_PIVOT_Y = 0.12;

function CrowShaderMesh({ scrollRef, mouseRef, isHoveringRef }: {
  scrollRef: { current: number };
  mouseRef: { current: { x: number; y: number } };
  isHoveringRef: { current: boolean };
}) {
  const { viewport, camera } = useThree();
  const texture = useTexture("/crow-particles.png");
  texture.colorSpace = THREE.SRGBColorSpace;
  const meshW = Math.min(viewport.width * 0.85, 6.0);
  const meshH = meshW / 2;

  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const headRotation = useRef(0);
  const reducedMotion = useRef(
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const uniforms = useMemo(() => ({
    uTexture:       { value: texture },
    uTime:          { value: 0 },
    uScroll:        { value: 0 },
    uHover:         { value: 0 },
    uMouseWorld:    { value: new THREE.Vector2(0, 0) },
    uHeadRotationY: { value: 0 },
    uNeckPivot:     { value: new THREE.Vector3(0.0, NECK_PIVOT_Y, 0.0) },
  }), [texture]);

  // Compute aIsHead attribute — smoothstep blend around HEAD_Y_THRESHOLD
  useEffect(() => {
    const geo = geometryRef.current;
    if (!geo) return;
    const positions = geo.attributes.position.array as Float32Array;
    const count = positions.length / 3;
    const isHead = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const y = positions[i * 3 + 1];
      const t = Math.max(0, Math.min(1,
        (y - (HEAD_Y_THRESHOLD - HEAD_Y_BLEND)) / (2 * HEAD_Y_BLEND)
      ));
      isHead[i] = t * t * (3 - 2 * t); // smoothstep
    }
    geo.setAttribute("aIsHead", new THREE.BufferAttribute(isHead, 1));
  }, []);

  const hoverTarget = useRef(0);
  const mouseWorld  = useRef(new THREE.Vector2(0, 0));
  const raycaster   = useMemo(() => new THREE.Raycaster(), []);
  const zPlane      = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const hitVec      = useMemo(() => new THREE.Vector3(), []);
  const ndcVec      = useMemo(() => new THREE.Vector2(), []);

  // Reset head rotation on tab return to avoid delta spike
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        headRotation.current = 0;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05); // cap — prevents spike after tab switch

    uniforms.uTime.value += dt;
    uniforms.uScroll.value += (scrollRef.current - uniforms.uScroll.value) * 0.14;
    hoverTarget.current = isHoveringRef.current ? 1.0 : 0.0;
    uniforms.uHover.value += (hoverTarget.current - uniforms.uHover.value) * 0.1;
    ndcVec.set(mouseRef.current.x, mouseRef.current.y);
    raycaster.setFromCamera(ndcVec, camera);
    if (raycaster.ray.intersectPlane(zPlane, hitVec)) {
      mouseWorld.current.lerp(new THREE.Vector2((hitVec.x + 0.3) / meshW, hitVec.y / meshH), 0.15);
    }
    uniforms.uMouseWorld.value.copy(mouseWorld.current);

    // Head rotation — idle sway + cursor follow (hover only)
    let target: number;
    if (reducedMotion.current) {
      target = 0.15;
    } else {
      const time = state.clock.getElapsedTime();
      const idle = Math.sin(time * 0.15) * 0.05;
      let mouseInfluence = 0;
      if (isHoveringRef.current) {
        const adjusted = mouseRef.current.x - 0.15;
        mouseInfluence = adjusted * 0.3;
      }
      target = Math.max(-0.3, Math.min(0.3, idle + mouseInfluence));
    }
    headRotation.current += (target - headRotation.current) * dt * 1.4;
    uniforms.uHeadRotationY.value = headRotation.current;
  });

  const isMobile = viewport.width < 4.0;
  const xOffset  = isMobile ? -0.05 : -0.3;
  return (
    <points scale={[meshW, meshH, 1]} position={[xOffset, 0, 0]}>
      <planeGeometry ref={geometryRef} args={[1, 1, 256, 256]} />
      <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} transparent depthWrite={false} />
    </points>
  );
}

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
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useLanguage();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent, project.id, `/projects/${project.id}`, project.color);
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`View project: ${project.title} — ${t(project.categoryKey)}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: index * 0.1 } }}
      viewport={{ once: true, margin: "-10%" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => onClick(e, project.id, `/projects/${project.id}`, project.color)}
      onKeyDown={handleKeyDown}
      className="group relative border-b border-gray-800 py-6 md:py-20 cursor-pointer transition-colors duration-500 hover:border-white focus-visible:outline-none focus-visible:border-white overflow-hidden"
    >
      {/* Row content */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-baseline justify-between">
        <h3
          className="font-display font-black text-[13vw] md:text-8xl lg:text-[8vw] uppercase tracking-tighter leading-[1.2] transition-all duration-500 ease-out group-hover:translate-x-4"
          style={{
            WebkitTextStroke: isHovered ? "0px transparent" : "1.5px rgba(255,255,255,0.35)",
            color: isHovered ? project.color : "#111111",
            paintOrder: 'stroke fill',
          }}
        >
          {project.title}
        </h3>
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
          Something went wrong. Please try again.
        </p>
      )}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4">
        <button type="button" onClick={onClose} className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          {t('contact.form.cancel')}
        </button>
        <motion.button
          type="submit"
          aria-label="Send message"
          disabled={submitting}
          whileHover={submitting ? undefined : { scale: 1.02 }}
          whileTap={submitting ? undefined : { scale: 0.98 }}
          className="w-full sm:w-auto px-10 py-4 min-h-[48px] bg-white text-[#111] font-black uppercase tracking-widest text-sm rounded-full magnetic-target focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Sending…" : t('contact.form.send')}
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
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const handleProjectClick = (e: React.MouseEvent, projectId: string, route: string, color: string) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => router.push(route), 250);
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
        <div role="img" aria-label="Animated crow illustration made of particles" className="absolute inset-0 z-10">
          <Suspense fallback={<div className="absolute inset-0 bg-[#F5F5F4]" />}>
            <Canvas
              style={{ width: "100%", height: "100%" }}
              camera={{ position: [0, 0, 5], fov: 45 }}
              dpr={[1, 2]}
              gl={{ alpha: true, antialias: true }}
            >
              <CrowShaderMesh scrollRef={scrollRef} mouseRef={mouseRef} isHoveringRef={isHoveringRef} />
            </Canvas>
          </Suspense>
        </div>

        {/* Mobile hero text — variant C, scroll-revealed */}
        <motion.div
          className="absolute bottom-[10vh] left-0 right-0 z-20 pointer-events-none text-center md:hidden"
          style={{ opacity: ghostOpacity }}
        >
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#111]/40 leading-relaxed">
            Where architecture meets code
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
              className="p-10 rounded-[32px] bg-[#E4E4E7]/40 text-[#111]"
            >
              <h3 className="font-display font-black text-2xl mb-4">{t('about.philosophy.title')}</h3>
              <p className="text-[1rem] leading-[1.6] opacity-80 font-medium max-w-[720px]">
                {t('about.philosophy.text')}
              </p>
            </motion.div>

            {/* Tech Stack — brutalist stickers */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}
              className="p-10 rounded-[32px] bg-[#111111] text-white"
            >
              <p className="text-xs font-bold uppercase tracking-widest opacity-50 block mb-6">{t('about.stack')}</p>
              <ul className="flex flex-wrap gap-3 list-none p-0 m-0" aria-label="Core technology stack">
                {TECH_ITEMS.map((tech) => (
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
            </motion.div>

            {/* Stats — count up */}
            <div className="flex flex-col sm:flex-row gap-4">
              {[
                { to: 3,  suffix: "+", labelKey: "about.stats.projects", infinity: false },
                { to: 8,  suffix: "+", labelKey: "about.stats.tools",    infinity: false },
                { to: 0,  suffix: "",  labelKey: "about.stats.curiosity", infinity: true  },
              ].map((stat, i) => (
                <motion.div
                  key={stat.labelKey}
                  variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] } } }}
                  className="flex-1 p-8 rounded-[32px] bg-[#111] text-[#F8F8F8] flex flex-col justify-between min-h-[160px]"
                >
                  <p
                    className="font-display font-black text-5xl tracking-tighter mb-2"
                    aria-label={stat.infinity ? t(stat.labelKey) : `${stat.to}${stat.suffix} ${t(stat.labelKey)}`}
                  >
                    <span aria-hidden="true">
                      {stat.infinity ? <InfinitySymbol /> : <CountUp to={stat.to} suffix={stat.suffix} />}
                    </span>
                  </p>
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
            ariaLabel={contactOpen ? "Close contact form" : "Open contact form"}
            className="cursor-pointer select-none group focus-visible:outline-none"
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
          <ul className="flex gap-8 text-[0.85rem] font-bold uppercase tracking-widest list-none p-0 m-0" aria-label="Social media links">
            <li><a href="#" aria-label="LinkedIn (coming soon)" className="opacity-50 cursor-default min-h-[44px] inline-flex items-center focus-visible:outline-none">LinkedIn</a></li>
            <li><a href="#" aria-label="Behance (coming soon)" className="opacity-50 cursor-default min-h-[44px] inline-flex items-center focus-visible:outline-none">Behance</a></li>
            <li><a href="#" aria-label="Instagram (coming soon)" className="opacity-50 cursor-default min-h-[44px] inline-flex items-center focus-visible:outline-none">Instagram</a></li>
          </ul>
        </div>
      </section>

    </main>
  );
}
