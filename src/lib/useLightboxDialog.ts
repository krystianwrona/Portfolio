"use client";

import { useEffect, useRef, type RefObject } from "react";

type LightboxDialogOptions = {
  open: boolean;
  /** The dialog the Tab key is trapped inside. */
  dialogRef: RefObject<HTMLElement | null>;
  /** Focused when the dialog opens — the close button in every case study. */
  initialFocusRef: RefObject<HTMLElement | null>;
  /** The element that opened the dialog; focus goes back to it on close. */
  returnFocusRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  /** Arrow keys. Omit both for a dialog with nothing to page through. */
  onPrev?: () => void;
  onNext?: () => void;
};

/**
 * Keyboard and focus behaviour shared by the case-study lightboxes: Escape
 * closes, arrows page, Tab stays inside the dialog, focus moves to the close
 * button on open and back to the trigger on close, and the page does not
 * scroll underneath. Each case study still owns its own dialog markup.
 *
 * The scroll lock is taken only while the dialog is open. Clearing it while
 * closed would also run on mount and could release a lock someone else holds.
 */
export function useLightboxDialog({
  open,
  dialogRef,
  initialFocusRef,
  returnFocusRef,
  onClose,
  onPrev,
  onNext,
}: LightboxDialogOptions) {
  // The handlers are fresh closures every render; the listener reads the
  // latest ones instead of re-subscribing (and re-focusing) on each render.
  const handlers = useRef({ onClose, onPrev, onNext });
  useEffect(() => {
    handlers.current = { onClose, onPrev, onNext };
  });

  useEffect(() => {
    if (!open) {
      returnFocusRef.current?.focus();
      return;
    }
    document.body.style.overflow = "hidden";
    const focusId = setTimeout(() => initialFocusRef.current?.focus(), 0);
    const onKeyDown = (e: KeyboardEvent) => {
      const { onClose, onPrev, onNext } = handlers.current;
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
      if (e.key === "Tab") {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled)");
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      clearTimeout(focusId);
    };
  }, [open, dialogRef, initialFocusRef, returnFocusRef]);
}
