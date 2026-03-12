"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false);
  const [isMagnetic, setIsMagnetic] = useState(false);
  const [injectedText, setInjectedText] = useState<string | null>(null);
  const magneticTargetRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  // Smooth springs for the cursor position
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Only show custom cursor on non-touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;
    setIsVisible(true);

    const moveCursor = (e: MouseEvent) => {
      if (isMagnetic && magneticTargetRef.current && !injectedText) {
        // If magnetic (and not text injected), move towards the center of the target element but keep some offset
        const { left, top, width, height } = magneticTargetRef.current.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        
        cursorX.set(centerX + distanceX * 0.2);
        cursorY.set(centerY + distanceY * 0.2);
      } else {
        // Normal movement
        cursorX.set(e.clientX);
        cursorY.set(e.clientY);
      }
    };

    const handleMouseEnter = (e: Event) => {
      const target = e.target as HTMLElement;
      setIsHovered(true);
      
      const cursorText = target.getAttribute('data-cursor-text') || target.closest('[data-cursor-text]')?.getAttribute('data-cursor-text');
      
      if (cursorText) {
        setInjectedText(cursorText);
      } else if (target.closest('.magnetic-target') || target.tagName.toLowerCase() === 'a' || target.tagName.toLowerCase() === 'button') {
        setIsMagnetic(true);
        magneticTargetRef.current = target;
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      setIsMagnetic(false);
      setInjectedText(null);
      magneticTargetRef.current = null;
    };

    window.addEventListener("mousemove", moveCursor);

    const attachHoverListeners = () => {
      const interactables = document.querySelectorAll(
        'a, button, input, select, textarea, .magnetic-target, [data-cursor-text]'
      );
      
      interactables.forEach((el) => {
        el.addEventListener("mouseenter", handleMouseEnter);
        el.addEventListener("mouseleave", handleMouseLeave);
      });
    };

    attachHoverListeners();
    const intervalId = setInterval(attachHoverListeners, 1000);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      clearInterval(intervalId);
      const interactables = document.querySelectorAll(
        'a, button, input, select, textarea, .magnetic-target, [data-cursor-text]'
      );
      interactables.forEach((el) => {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, [cursorX, cursorY, isMagnetic, injectedText]);

  if (!isVisible) return null;

  const cursorSize = injectedText ? 80 : 48; // Larger when showing text

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-3 h-3 bg-text-primary rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
          scale: isHovered ? 0 : 1,
          opacity: isHovered ? 0 : 1,
        }}
      />
      
      <motion.div
        className="fixed top-0 left-0 border border-text-primary rounded-full pointer-events-none z-[9998] mix-blend-difference flex items-center justify-center font-sans font-bold text-[0.6rem] tracking-widest uppercase"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
          width: cursorSize,
          height: cursorSize,
          scale: isHovered ? (injectedText ? 1 : 1.5) : 0.5,
          opacity: isHovered ? 1 : 0,
          backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          color: 'transparent',
          WebkitTextStroke: '0.4px #fff'
        }}
        animate={{
          scale: isHovered ? (injectedText ? 1 : (isMagnetic ? 1.2 : 1.5)) : 0.5,
          color: injectedText ? '#fff' : 'transparent',
          backgroundColor: injectedText ? 'transparent' : 'rgba(255, 255, 255, 0.1)'
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
          {injectedText}
      </motion.div>
    </>
  );
}
