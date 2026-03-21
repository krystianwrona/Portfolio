"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export function CustomCursor() {
  const [isHovered, setIsHovered]     = useState(false);
  const [isMagnetic, setIsMagnetic]   = useState(false);
  const [injectedText, setInjectedText] = useState<string | null>(null);
  const [isVisible, setIsVisible]     = useState(false);
  const [cursorSize, setCursorSize]   = useState(48);

  const magneticTargetRef = useRef<HTMLElement | null>(null);

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  const springConfig  = { damping: 25, stiffness: 200, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Only show custom cursor on non-touch, non-reduced-motion devices
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setIsVisible(true);

    const moveCursor = (e: MouseEvent) => {
      if (isMagnetic && magneticTargetRef.current && !injectedText) {
        const { left, top, width, height } = magneticTargetRef.current.getBoundingClientRect();
        const centerX   = left + width  / 2;
        const centerY   = top  + height / 2;
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        cursorX.set(centerX + distanceX * 0.2);
        cursorY.set(centerY + distanceY * 0.2);
      } else {
        cursorX.set(e.clientX);
        cursorY.set(e.clientY);
      }
    };

    const handleMouseEnter = (e: Event) => {
      const target = e.target as HTMLElement;
      setIsHovered(true);

      const cursorText =
        target.getAttribute("data-cursor-text") ||
        target.closest("[data-cursor-text]")?.getAttribute("data-cursor-text");

      if (cursorText) {
        setInjectedText(cursorText);
        setCursorSize(80);
      } else if (
        target.closest(".magnetic-target") ||
        target.tagName.toLowerCase() === "a" ||
        target.tagName.toLowerCase() === "button"
      ) {
        setIsMagnetic(true);
        magneticTargetRef.current = target;
        setCursorSize(48);
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      setIsMagnetic(false);
      setInjectedText(null);
      setCursorSize(48);
      magneticTargetRef.current = null;
    };

    window.addEventListener("mousemove", moveCursor);

    // ── Fix #7: MutationObserver replaces setInterval ──────────────────────
    // Use data-cursor-bound to prevent duplicate listeners
    const attachToElement = (el: Element) => {
      if (el.getAttribute("data-cursor-bound")) return;
      el.setAttribute("data-cursor-bound", "1");
      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseleave", handleMouseLeave);
    };

    const attachAll = () => {
      document
        .querySelectorAll('a, button, input, select, textarea, .magnetic-target, [data-cursor-text]')
        .forEach(attachToElement);
    };

    attachAll();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const el = node as Element;
          if (el.matches('a, button, input, select, textarea, .magnetic-target, [data-cursor-text]')) {
            attachToElement(el);
          }
          el.querySelectorAll?.('a, button, input, select, textarea, .magnetic-target, [data-cursor-text]')
            .forEach(attachToElement);
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      observer.disconnect();
      document
        .querySelectorAll("[data-cursor-bound]")
        .forEach((el) => {
          el.removeAttribute("data-cursor-bound");
          el.removeEventListener("mouseenter", handleMouseEnter);
          el.removeEventListener("mouseleave", handleMouseLeave);
        });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMagnetic, injectedText]);

  if (!isVisible) return null;

  return (
    <>
      {/* Dot — hides on hover */}
      <motion.div
        aria-hidden="true"
        className="fixed top-0 left-0 w-3 h-3 bg-text-primary rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{ scale: isHovered ? 0 : 1, opacity: isHovered ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />

      {/* Ring — Fix #11: borderColor instead of border shorthand
              Fix #12: width/height inside animate for smooth FM transition */}
      <motion.div
        aria-hidden="true"
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9998] mix-blend-difference flex items-center justify-center font-sans font-bold text-[0.6rem] tracking-widest uppercase"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
          WebkitTextStroke: "0.4px #fff",
        }}
        animate={{
          width:  cursorSize,
          height: cursorSize,
          scale:  isHovered ? (injectedText ? 1 : isMagnetic ? 1.2 : 1.5) : 0.5,
          opacity: isHovered ? 1 : 0,
          borderWidth: 1,
          borderStyle: "solid" as const,
          borderColor:     isHovered ? "#FACC15" : "#111111",
          color:           injectedText ? "#fff" : "transparent",
          backgroundColor: injectedText ? "transparent" : "rgba(255,255,255,0.1)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {injectedText}
      </motion.div>
    </>
  );
}
