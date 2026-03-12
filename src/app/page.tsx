"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, MeshDistortMaterial, Circle, Shadow } from "@react-three/drei";
import * as THREE from "three";

function GenerativeNest() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.15;
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group>
      {/* Background Yellow Circle (Receives Shadows) */}
      <Circle args={[3.2, 64]} position={[0, 0, -2]} receiveShadow>
        <meshBasicMaterial color="#FACC15" />
      </Circle>

      {/* Shadow Catcher Plane to soften shadows matching "rgba(17,17,17,0.12)" */}
      <Shadow
        color="#111111"
        colorStop={0}
        opacity={0.15}
        fog={false} // don't fade with fog
        scale={6}
        position={[0, 0, -1.99]}
      />

      {/* Interactive Generative Poly Mesh */}
      <Float speed={2} rotationIntensity={0.6} floatIntensity={1.5}>
        <mesh 
          ref={meshRef} 
          castShadow 
          receiveShadow
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          {/* Using icosahedron with flat shading for poly/sharp edge look */}
          <icosahedronGeometry args={[1.5, hovered ? 5 : 2]} />
          <MeshDistortMaterial 
            color="#111111" 
            roughness={0.85} 
            metalness={0.15} 
            flatShading={true}
            distort={hovered ? 0.6 : 0.4} 
            speed={hovered ? 3 : 1.5}
          />
        </mesh>
      </Float>
    </group>
  );
}

export default function Home() {
  const router = useRouter();
  const [transitionState, setTransitionState] = useState<{ id: string, x: number, y: number, color: string } | null>(null);

  const handleProjectClick = (e: React.MouseEvent, projectId: string, route: string, color: string) => {
    e.preventDefault();
    setTransitionState({ id: projectId, x: e.clientX, y: e.clientY, color });
    setTimeout(() => {
      router.push(route);
    }, 800); // Wait for transition animation
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Parallax values based on scroll
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);
  const circleY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);

  // Split characters for "digital\nwisdom."
  const splitText = "digital\nwisdom.";
  const chars = splitText.split("");

  // Project Parallax Titles
  const project1Y = useTransform(scrollYProgress, [0.1, 0.4], ["50%", "-50%"]);
  const project2Y = useTransform(scrollYProgress, [0.3, 0.6], ["50%", "-50%"]);
  const project3Y = useTransform(scrollYProgress, [0.6, 0.9], ["50%", "-50%"]);

  return (
    <main className="w-full min-h-screen" ref={containerRef}>
      {/* 1. HERO SECTION */}
      <section id="home" className="relative w-full h-[100vh] flex items-center overflow-hidden px-[4vw]">
        
        {/* Core Flex Container fixing the offset issue */}
        <div className="flex w-full h-full items-center justify-between z-10">
          
          {/* Left Column (45%) */}
          <div className="w-[45%] flex flex-col justify-center mt-[-10vh] pr-[4vw]">
            <p className="text-[0.85rem] leading-[1.6] text-[#555] font-medium max-w-[280px] mb-[1.5rem]">
              Crafting digital experiences that merge logic with brutalist aesthetics. Based in Europe, working globally.
            </p>
            <a href="#projects" className="text-[0.75rem] font-extrabold text-[#111] hover:opacity-70 transition-opacity border-b-2 border-[#111] w-max pb-1 magnetic-target">
              Explore Projects
            </a>
          </div>

          {/* Center Visual (55%) */}
          <div className="relative w-[55%] h-[80%] flex justify-center items-center pointer-events-auto">
            {/* 3D Generative Mesh "Feather Nest" */}
            <Canvas shadows camera={{ position: [0, 0, 6], fov: 45 }}>
              <ambientLight intensity={0.6} />
              <directionalLight 
                position={[2, 6, 8]} 
                intensity={1.5} 
                castShadow 
                shadow-mapSize={[1024, 1024]} 
                shadow-bias={-0.0001}
              />
              <Environment preset="city" />
              <GenerativeNest />
            </Canvas>
          </div>

        </div>

        {/* Right Overlay Text */}
        <div className="absolute top-1/2 right-[4vw] -translate-y-1/2 z-[3] pointer-events-none">
          <h1 className="font-sans font-black text-[12vw] leading-[0.8] tracking-tight whitespace-pre-line text-[#111]">
            {chars.map((char, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 50, rotateX: -90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  duration: 0.8,
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                  delay: 0.5 + index * 0.05,
                }}
                className="inline-block"
                style={{ 
                  whiteSpace: char === "\n" ? "pre" : "pre-wrap",
                  display: char === "\n" ? "block" : "inline-block"
                }}
              >
                {char}
              </motion.span>
            ))}
          </h1>
        </div>
      </section>

      {/* 2. PROJECTS SECTION */}
      <section id="projects" className="py-[15vh] px-[4vw] bg-background relative overflow-hidden">
        <div className="mb-[15vh]">
          <motion.h2 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8 }}
            className="font-sans font-black text-[10vw] md:text-[8vw] leading-[0.9] tracking-tighter"
          >
            Selected Works.
          </motion.h2>
        </div>
        
        <div className="flex flex-col gap-[15vh]">
          {/* Project 1 */}
          <motion.div 
            onClick={(e) => handleProjectClick(e, 'legalray', '/projects/legalray', '#0F172A')}
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="group relative w-full h-[60vh] md:h-[70vh] rounded-[32px] overflow-hidden cursor-pointer bg-[#0F172A]" 
            data-cursor-text="VIEW CASE"
          >
            {/* Parallax Background Title */}
            <motion.div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none z-0" style={{ y: project1Y }}>
              <span className="font-sans font-black text-[25vw] leading-none whitespace-nowrap text-white" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.2)', color: 'transparent' }}>LEGALRAY</span>
            </motion.div>
            
            <div className="absolute inset-0 bg-[#0F172A] z-[1] transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1 opacity-90 group-hover:opacity-100">
              <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.15),_transparent_70%)] opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl mix-blend-overlay scale-50 group-hover:scale-150" />
            </div>
            <div className="absolute inset-0 z-10 p-10 flex flex-col justify-end text-white">
              <div className="overflow-hidden mb-2">
                <span className="block text-sm font-bold uppercase tracking-widest opacity-60 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 delay-100">LawTech App</span>
              </div>
              <div className="overflow-hidden">
                <h3 className="font-sans font-black text-5xl md:text-7xl tracking-tight translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500">LegalRay</h3>
              </div>
            </div>
          </motion.div>

          {/* Project 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="group relative w-full h-[60vh] md:h-[70vh] rounded-[32px] overflow-hidden cursor-pointer bg-[#D97706]" 
            data-cursor-text="VIEW CASE"
          >
             {/* Parallax Background Title */}
             <motion.div className="absolute inset-0 flex items-center justify-end opacity-10 pointer-events-none z-0 right-[-10%]" style={{ y: project2Y }}>
              <span className="font-sans font-black text-[25vw] leading-none whitespace-nowrap text-white" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.2)', color: 'transparent' }}>ADOPT.ME</span>
            </motion.div>

            <div className="absolute inset-0 bg-[#D97706] z-[1] transition-transform duration-1000 group-hover:scale-110 group-hover:-rotate-1 opacity-90 group-hover:opacity-100">
              <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.2),_transparent_60%)] opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl mix-blend-overlay scale-50 group-hover:scale-150" />
            </div>
            <div className="absolute inset-0 z-10 p-10 flex flex-col justify-end text-white">
              <div className="overflow-hidden mb-2">
                <span className="block text-sm font-bold uppercase tracking-widest opacity-60 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 delay-100">Social Platform</span>
              </div>
              <div className="overflow-hidden">
                <h3 className="font-sans font-black text-5xl md:text-7xl tracking-tight translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500">Adopt.me</h3>
              </div>
            </div>
          </motion.div>

          {/* Project 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="group relative w-full h-[60vh] md:h-[70vh] rounded-[32px] overflow-hidden cursor-pointer bg-[#111111]" 
            data-cursor-text="CLASSIFIED"
          >
            {/* Parallax Background Title */}
            <motion.div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0" style={{ y: project3Y }}>
              <span className="font-sans font-black text-[20vw] leading-none whitespace-nowrap text-white" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.2)', color: 'transparent' }}>REDACTED</span>
            </motion.div>

            <div className="absolute inset-0 z-[1] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <div className="absolute inset-0 bg-red-500 mix-blend-screen translate-x-[-4px] group-hover:animate-pulse" />
               <div className="absolute inset-0 bg-blue-500 mix-blend-screen translate-x-[4px] group-hover:animate-pulse" style={{ animationDelay: '0.1s'}} />
            </div>
            <div className="absolute inset-0 z-10 flex items-center justify-center p-10">
              <div className="text-center overflow-hidden">
                <span className="block text-sm font-bold uppercase tracking-widest opacity-40 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 delay-100 mb-4">Confidential</span>
                <h3 className="font-sans font-black text-5xl md:text-7xl tracking-tight text-white/10 group-hover:text-white transition-all duration-500 relative translate-y-[100%] group-hover:translate-y-0">
                  Coming Soon
                </h3>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. ABOUT ME (ASYMMETRIC SPLIT LAYOUT) */}
      <section id="about" className="py-[20vh] px-[4vw] bg-background">
        <div className="flex flex-col lg:flex-row gap-[10vw] items-start">
          
          {/* Left Side: Massive Sticky Headline */}
          <div className="w-full lg:w-[45%] lg:sticky lg:top-[20vh]">
            <motion.h2 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="font-sans font-black text-[12vw] lg:text-[6vw] leading-[0.9] tracking-tighter"
            >
              Beyond the <br/><span className="text-[#555]">code.</span>
            </motion.h2>
          </div>

          {/* Right Side: Bento Content Grid */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            variants={{
              hidden: { opacity: 0 },
              visible: { 
                opacity: 1,
                transition: { staggerChildren: 0.15 }
              }
            }}
            className="w-full lg:w-[55%] flex flex-col gap-8"
          >
            {/* Bio Block */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="p-10 rounded-[32px] bg-[#E4E4E7]/40 text-[#111]"
            >
              <h3 className="font-sans font-black text-2xl mb-4">The Philosophy</h3>
              <p className="text-[1rem] leading-[1.6] opacity-80 font-medium">
                I am Krystian Wrona. A hybrid creator standing at the intersection of robust engineering and avant-garde motion design. I build digital products that don't just function—they leave a lasting impression.
              </p>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-8">
               {/* Skills Block */}
               <motion.div 
                 variants={{
                   hidden: { opacity: 0, y: 30 },
                   visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                 }}
                 className="flex-1 p-10 rounded-[32px] bg-[#111111] text-white"
               >
                 <span className="text-xs font-bold uppercase tracking-widest opacity-50 block mb-6">Core Stack</span>
                 <ul className="space-y-3 font-sans font-bold text-lg tracking-tight">
                   <li>React / Next.js</li>
                   <li>TypeScript</li>
                   <li>Framer Motion</li>
                   <li>WebGL / GLSL</li>
                 </ul>
               </motion.div>

                {/* Experience Block */}
                <motion.div 
                 variants={{
                   hidden: { opacity: 0, y: 30 },
                   visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                 }}
                 className="flex-1 p-10 rounded-[32px] bg-accent text-[#111]"
               >
                 <span className="text-xs font-bold uppercase tracking-widest opacity-50 block mb-6">Experience</span>
                 <h4 className="font-sans font-black text-6xl tracking-tighter mb-2">4+</h4>
                 <p className="font-bold uppercase tracking-widest text-sm opacity-80">Years coding digital brutalism.</p>
               </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. MINIMAL FOOTER */}
      <section id="contact" className="pt-[10vh] pb-[5vh] px-[4vw] bg-[#111111] text-[#F8F8F8] rounded-t-[40px] mt-[-40px] relative z-10 flex flex-col justify-between">
        
        {/* Massive Headline */}
        <div className="flex-1 flex items-center justify-center">
          <h2 className="font-sans font-black text-[14vw] leading-[0.8] tracking-tighter text-center magnetic-target cursor-pointer hover:text-accent transition-colors duration-500">
            let's build.
          </h2>
        </div>
        
        {/* Split Screen Bottom Layout */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-10 mt-10">
          <div className="text-[0.85rem] opacity-60 font-medium">
            &copy; {new Date().getFullYear()} KRYSTIAN.WRONA. All rights reserved.
          </div>
          <div className="flex gap-8 text-[0.85rem] font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-accent transition-colors magnetic-target">LinkedIn</a>
            <a href="#" className="hover:text-accent transition-colors magnetic-target">Behance</a>
            <a href="#" className="hover:text-accent transition-colors magnetic-target">Instagram</a>
          </div>
        </div>
      </section>

      {/* PAGE TRANSITION OVERLAY */}
      <AnimatePresence>
        {transitionState && (
          <motion.div
            initial={{ clipPath: `circle(0px at ${transitionState.x}px ${transitionState.y}px)` }}
            animate={{ clipPath: `circle(150vw at ${transitionState.x}px ${transitionState.y}px)` }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
            style={{ backgroundColor: transitionState.color }}
          >
            {/* The title stays centered and blends exactly like the CaseHero on the next page */}
            {transitionState.id === 'legalray' && (
              <motion.h1 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="font-sans font-black text-[15vw] leading-none tracking-tighter text-white mix-blend-difference"
              >
                LegalRay.
              </motion.h1>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
