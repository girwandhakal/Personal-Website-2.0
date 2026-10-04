"use client";

/**
 * Perspective Text Scroll — adapted from uselayouts (MIT), https://uselayouts.com
 *
 * A paragraph pinned in the viewport that tilts up out of the floor, faces the
 * reader, then tips away overhead as the page scrolls past it. Scroll progress
 * is eased toward with a lerp each frame so the motion trails the wheel softly.
 *
 * Changes from the original: content, height and colours come from props;
 * progress starts as the block enters the viewport rather than once pinned;
 * reduced motion shows the text flat and still; the frame loop only runs while
 * the block is near the viewport.
 */

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const KEYFRAMES = [
  { p: 0.0, rotX: 42, transY: 520, transZ: -30, opacity: 0.0 },
  { p: 0.12, rotX: 38, transY: 220, transZ: -10, opacity: 1.0 },
  { p: 0.5, rotX: 0, transY: 0, transZ: 25, opacity: 1.0 },
  { p: 0.85, rotX: -24, transY: -180, transZ: 45, opacity: 1.0 },
  { p: 1.0, rotX: -36, transY: -320, transZ: 60, opacity: 0.0 }
];

const LERP = 0.06;

function interpolate(p: number) {
  const c = Math.max(0, Math.min(1, p));
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i], b = KEYFRAMES[i + 1];
    if (c >= a.p && c <= b.p) {
      const t = (c - a.p) / (b.p - a.p);
      return {
        rotX: a.rotX + (b.rotX - a.rotX) * t,
        transY: a.transY + (b.transY - a.transY) * t,
        transZ: a.transZ + (b.transZ - a.transZ) * t,
        opacity: a.opacity + (b.opacity - a.opacity) * t
      };
    }
  }
  return KEYFRAMES[KEYFRAMES.length - 1];
}

export function PerspectiveText({
  children,
  height = "320vh",
  fadeColor = "var(--surface)",
  className,
  textClassName
}: {
  children: ReactNode;
  /** Total scroll distance the text is pinned for. */
  height?: string;
  /** Matches the page behind it so the bottom fade disappears into it. */
  fadeColor?: string;
  className?: string;
  textClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    if (reduce) {
      text.style.transform = "none";
      text.style.opacity = "1";
      return;
    }

    const apply = (p: number) => {
      const v = interpolate(p);
      text.style.transform = `rotateX(${v.rotX.toFixed(4)}deg) translate3d(0px, ${v.transY.toFixed(4)}px, ${v.transZ.toFixed(4)}px)`;
      text.style.opacity = v.opacity.toFixed(4);
    };

    // 0 as the block's top enters the bottom of the viewport, 1 as the pin
    // releases — so the text is already rising into view instead of leaving
    // a blank screen while the block scrolls up to the pinned position.
    const target = () => {
      const rect = container.getBoundingClientRect();
      if (rect.height <= 0) return 0;
      return Math.max(0, Math.min(1, (window.innerHeight - rect.top) / rect.height));
    };

    const state = { current: target(), target: target(), raf: 0, visible: false };
    apply(state.current);

    const loop = () => {
      const diff = state.target - state.current;
      if (Math.abs(diff) > 0.00002) {
        state.current += diff * LERP;
        apply(state.current);
      }
      state.raf = state.visible ? requestAnimationFrame(loop) : 0;
    };

    const onScroll = () => { state.target = target(); };

    // Don't spin a frame loop for the whole page's lifetime — only while the
    // block is on (or about to come on) screen.
    const io = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      state.visible = entry.isIntersecting;
      if (state.visible && !state.raf) state.raf = requestAnimationFrame(loop);
    }, { rootMargin: "200px 0px" });
    if (io) io.observe(container);
    else { state.visible = true; state.raf = requestAnimationFrame(loop); }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      io?.disconnect();
      cancelAnimationFrame(state.raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduce]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)} style={{ height: reduce ? "auto" : height }}>
      <div
        className={cn("flex w-full items-center justify-center overflow-hidden", reduce ? "py-24" : "sticky top-0 h-screen")}
        style={{ perspective: "200px", perspectiveOrigin: "50% 50%" }}
      >
        <div
          ref={textRef}
          className={cn("relative w-full max-w-4xl px-6 text-center", textClassName)}
          style={{
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            willChange: "transform, opacity",
            transform: "rotateX(42deg) translate3d(0px, 520px, -30px)",
            opacity: 0
          }}
        >
          {children}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 h-[34%] w-full select-none"
            style={{ background: `linear-gradient(to bottom, transparent, ${fadeColor})` }}
          />
        </div>
      </div>
    </div>
  );
}
