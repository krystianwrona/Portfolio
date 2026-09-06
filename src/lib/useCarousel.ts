"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * State and input handling for the case-study media carousels.
 *
 * The active index is derived from scroll position rather than from an
 * IntersectionObserver: the slides are `scroll-snap-align: center`, and on a
 * wide viewport two of them clear any fixed visibility threshold at once, so
 * an observer latches onto whichever neighbour fired last instead of the
 * centred one. Measuring distance to the container's centre is the same rule
 * the browser snaps by, so the index, the counter and the arrows always agree.
 */
export function useCarousel(slideCount: number) {
  const [carousel, setCarousel] = useState<HTMLDivElement | null>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

  const carouselRef = useCallback((el: HTMLDivElement | null) => {
    setCarousel(el);
  }, []);

  // Nearest slide centre to the container centre — the CSS snap rule, in JS.
  useEffect(() => {
    if (!carousel) return;

    const measure = () => {
      const centre = carousel.getBoundingClientRect().left + carousel.clientWidth / 2;
      let nearest = 0;
      let nearestDistance = Infinity;
      slideRefs.current.forEach((slide, i) => {
        if (!slide) return;
        const rect = slide.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - centre);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = i;
        }
      });
      setActiveSlide(nearest);
    };

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; measure(); });
    };

    measure();
    carousel.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      carousel.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [carousel, slideCount]);

  /**
   * The carousel is horizontal, so it only claims horizontal gestures. A
   * vertical wheel bubbles untouched and scrolls the page. The container also
   * carries `data-lenis-prevent-horizontal`, which makes Lenis skip exactly
   * the gestures claimed here (it splits horizontal from vertical by the same
   * `|deltaX| >= |deltaY|` test), so the two never fight over one gesture.
   */
  useEffect(() => {
    if (!carousel) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaX === 0 && e.deltaY === 0) return;
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      e.preventDefault();
      carousel.scrollLeft += e.deltaX;
    };
    carousel.addEventListener("wheel", onWheel, { passive: false });
    return () => carousel.removeEventListener("wheel", onWheel);
  }, [carousel]);

  const scrollToSlide = useCallback((index: number) => {
    const slide = slideRefs.current[index];
    if (!carousel || !slide) return;
    const carouselRect = carousel.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    // Aim for the snap position, not the scroll-padding edge, or mandatory
    // snapping drags the result back and the arrow looks dead.
    const delta =
      slideRect.left + slideRect.width / 2 - (carouselRect.left + carouselRect.width / 2);
    const max = carousel.scrollWidth - carousel.clientWidth;
    carousel.scrollTo({
      left: Math.min(max, Math.max(0, carousel.scrollLeft + delta)),
      behavior: "smooth",
    });
  }, [carousel]);

  const goPrev = useCallback(() => {
    if (activeSlide > 0) scrollToSlide(activeSlide - 1);
  }, [activeSlide, scrollToSlide]);

  const goNext = useCallback(() => {
    if (activeSlide < slideCount - 1) scrollToSlide(activeSlide + 1);
  }, [activeSlide, slideCount, scrollToSlide]);

  return { carouselRef, slideRefs, activeSlide, goPrev, goNext };
}
