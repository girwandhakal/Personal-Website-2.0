"use client";

import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { profile } from "@/content/profile";

const EASE = [0.16, 1, 0.3, 1] as const;
const SHEET_TRANSITION = { duration: 0.3, ease: EASE } as const;
const SNAP_BACK = { type: "spring", stiffness: 500, damping: 40 } as const;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 600;
const VELOCITY_STALE_MS = 100;
const DEFAULT_EXIT_Y = 20;
const DISMISS_EXIT_Y = 340;

export function AboutModal({ compact, onClose }: { compact: boolean; onClose: () => void }) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const sheetControls = useAnimationControls();
  const [exitY, setExitY] = useState(DEFAULT_EXIT_Y);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusFrame = requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (!(event.target instanceof Node) || !scrollRef.current?.contains(event.target)) event.preventDefault();
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!(event.target instanceof Node) || !scrollRef.current?.contains(event.target)) event.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [onClose]);

  useEffect(() => {
    sheetControls.start({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: prefersReducedMotion ? { duration: 0.001 } : SHEET_TRANSITION
    });
  }, [prefersReducedMotion, sheetControls]);

  useEffect(() => {
    if (!compact) return;
    const sheet = dialogRef.current;
    const pane = scrollRef.current;
    if (!sheet || !pane) return;

    let startY = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocity = 0;
    let decided = true;
    let dragging = false;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      startY = lastY = event.touches[0].clientY;
      lastTime = performance.now();
      velocity = 0;
      decided = false;
      dragging = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const y = event.touches[0].clientY;
      const distance = y - startY;

      if (!decided) {
        if (Math.abs(distance) < 6) return;
        decided = true;
        dragging = distance > 0 && pane.scrollTop <= 0;
      }
      if (!dragging) return;

      const now = performance.now();
      const elapsed = now - lastTime;
      if (elapsed > 0) velocity = ((y - lastY) / elapsed) * 1000;
      lastY = y;
      lastTime = now;
      event.preventDefault();
      sheetControls.set({ y: Math.max(0, distance) });
    };

    const onTouchEnd = () => {
      if (!dragging) return;
      dragging = false;
      if (performance.now() - lastTime > VELOCITY_STALE_MS) velocity = 0;

      if (lastY - startY > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) {
        setExitY(DISMISS_EXIT_Y);
        onClose();
      } else {
        sheetControls.start({ y: 0, transition: SNAP_BACK });
      }
    };

    sheet.addEventListener("touchstart", onTouchStart, { passive: true });
    sheet.addEventListener("touchmove", onTouchMove, { passive: false });
    sheet.addEventListener("touchend", onTouchEnd, { passive: true });
    sheet.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      sheet.removeEventListener("touchstart", onTouchStart);
      sheet.removeEventListener("touchmove", onTouchMove);
      sheet.removeEventListener("touchend", onTouchEnd);
      sheet.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [compact, onClose, sheetControls]);

  const transition = prefersReducedMotion
    ? { duration: 0.001 }
    : SHEET_TRANSITION;

  return createPortal(
    <>
      <motion.div
        className="project-modal-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0.001 : 0.2, ease: "easeOut" }}
        aria-hidden="true"
      />
      <div className="project-modal-layer">
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="project-modal about-modal"
          initial={{
            opacity: 0,
            y: prefersReducedMotion ? 0 : compact ? 28 : 18,
            scale: prefersReducedMotion || compact ? 1 : 0.97
          }}
          animate={sheetControls}
          exit={compact
            ? { opacity: 0, y: exitY, scale: 1 }
            : { opacity: 0, y: prefersReducedMotion ? 0 : 12, scale: prefersReducedMotion ? 1 : 0.98 }}
          transition={transition}
        >
          <div ref={scrollRef} className="project-modal-scroll about-modal-scroll">
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="project-modal-close"
              aria-label="Close about me"
            >
              <X size={18} aria-hidden="true" />
            </button>

            <header className="about-modal-header">
              <h2 id={titleId}>About me</h2>
              <p id={descriptionId} className="about-modal-copy">{profile.about}</p>
            </header>
          </div>
        </motion.div>
      </div>
    </>,
    document.body
  );
}
