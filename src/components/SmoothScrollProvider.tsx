"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

function ScrollRecalibrator({ pathname }: { pathname: string | null }) {
  const lenis = useLenis();
  
  useEffect(() => {
    if (lenis) {
      // Force browser layout recalculation explicitly on route change
      lenis.resize();
    }
  }, [pathname, lenis]);

  return null;
}

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ReactLenis 
      root 
      options={{ 
        lerp: 0.1, // friction: 0.1 equivalent
        duration: 1.2,
        easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
        touchMultiplier: 1.5,
        smoothWheel: true,
      }}
    >
      <ScrollRecalibrator pathname={pathname} />
      {children}
    </ReactLenis>
  );
}
