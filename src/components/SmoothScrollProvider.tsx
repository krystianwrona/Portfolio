"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// D — disable browser scroll restoration globally
if (typeof window !== "undefined") {
  window.history.scrollRestoration = "manual";
}

function ScrollRecalibrator({ pathname }: { pathname: string | null }) {
  const lenis = useLenis();

  // C — reset scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    lenis?.scrollTo(0, { immediate: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lenis) {
      lenis.resize();
    }
  }, [pathname, lenis]);

  return null;
}

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <ReactLenis
      root
      options={{
        lerp: prefersReducedMotion ? 1 : 0.1,
        duration: prefersReducedMotion ? 0 : 1.2,
        easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
        touchMultiplier: 1.5,
        smoothWheel: !prefersReducedMotion,
      }}
    >
      <ScrollRecalibrator pathname={pathname} />
      {children}
    </ReactLenis>
  );
}
