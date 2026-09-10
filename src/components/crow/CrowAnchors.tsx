"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";

/**
 * The boxes the crow is placed against.
 *
 * The scene used to receive these as props from the page, because it lived in
 * the page. It lives in the root layout now — above the router — so the page
 * hands them over instead, and the scene reads them straight out of a ref that
 * survives every route change.
 *
 *   hero      the <section id="home"> the bird belongs to. Its height is the
 *             denominator of heroProgress, and its rect turns the text block's
 *             offset* box (which is measured from the section) into viewport px.
 *   crowCell  the empty grid item that reserves the column the bird is fitted
 *             to. It draws nothing; it is only ever measured.
 *   heroText  the hero copy. The mask must not paint over it.
 *
 * `hero` being null is how every consumer knows there is no bird on this route:
 * the canvas stays mounted (one WebGL context for the whole session) and simply
 * draws nothing.
 */
export type CrowAnchorName = "hero" | "crowCell" | "heroText";
export type CrowAnchorMap = Record<CrowAnchorName, HTMLElement | null>;

type CrowAnchorsValue = {
  /** Read per frame — never a render input, so writes cost no re-render. */
  anchors: React.RefObject<CrowAnchorMap>;
  register: (name: CrowAnchorName, el: HTMLElement | null) => void;
  /** Change notification for the consumers that *do* need to re-render. */
  subscribe: (listener: () => void) => () => void;
  getVersion: () => number;
};

const CrowAnchorsContext = createContext<CrowAnchorsValue | null>(null);

export function CrowAnchorsProvider({ children }: { children: React.ReactNode }) {
  const anchors = useRef<CrowAnchorMap>({ hero: null, crowCell: null, heroText: null });
  const versionRef = useRef(0);
  const listeners = useRef(new Set<() => void>());

  // Every member of the context value is stable for the provider's lifetime,
  // so the value itself never changes identity. That matters more than it
  // looks: the anchor refs below are callback refs derived from this context,
  // and a context value that changed on every registration would detach and
  // re-attach them — register(null), register(el), forever.
  const register = useCallback((name: CrowAnchorName, el: HTMLElement | null) => {
    if (anchors.current[name] === el) return;
    anchors.current[name] = el;
    versionRef.current += 1;
    listeners.current.forEach((l) => l());
  }, []);

  const subscribe = useCallback((listener: () => void) => {
    const set = listeners.current;
    set.add(listener);
    return () => { set.delete(listener); };
  }, []);

  const getVersion = useCallback(() => versionRef.current, []);

  const value = useMemo<CrowAnchorsValue>(
    () => ({ anchors, register, subscribe, getVersion }),
    [register, subscribe, getVersion]
  );

  return <CrowAnchorsContext.Provider value={value}>{children}</CrowAnchorsContext.Provider>;
}

/** Null outside the provider, so a page can render without the crow at all. */
export function useCrowAnchors(): CrowAnchorsValue | null {
  return useContext(CrowAnchorsContext);
}

/**
 * The version counter as a render input. Re-renders the caller whenever an
 * anchor element is swapped — which is exactly when a measurement taken
 * against the old element stopped meaning anything.
 */
export function useCrowAnchorsVersion(): number {
  const ctx = useCrowAnchors();
  const subscribe = ctx?.subscribe ?? NOOP_SUBSCRIBE;
  const getVersion = ctx?.getVersion ?? ZERO;
  return useSyncExternalStore(subscribe, getVersion, ZERO);
}

/**
 * A callback ref that registers the element it is attached to. Stable for as
 * long as the provider is, so React attaches it once and never churns it.
 */
export function useCrowAnchorRef(name: CrowAnchorName) {
  const ctx = useCrowAnchors();
  const register = ctx?.register;
  return useCallback(
    (el: HTMLElement | null) => {
      register?.(name, el);
    },
    [register, name]
  );
}

const NOOP_SUBSCRIBE = () => () => {};
const ZERO = () => 0;
