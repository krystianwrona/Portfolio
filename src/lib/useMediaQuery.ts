"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A media query's current answer, subscribed to rather than copied into state
 * from an effect. `serverValue` is what renders before hydration, when there
 * is no window to ask.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue
  );
}
