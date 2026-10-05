"use client";

/**
 * Focus Text — adapted from uselayouts' Focus Testimonials (MIT),
 * https://uselayouts.com
 *
 * Entries run together as one paragraph, each led by a small badge. One entry
 * is always in focus while the rest dim and blur: scrolling moves the focus
 * down the paragraph, entry by entry, with a tag naming it parked beside its
 * badge. Hovering an entry takes over, and the tag follows the pointer.
 *
 * Changes from the original: items and badges come from props; focus follows
 * scroll, with hover as an override; no "show more" row; dark palette; the tag
 * stays inside the container's right edge; each entry carries its title and
 * meta as screen-reader text, since the tag is visual only.
 */

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type FocusTextItem = {
  id: string;
  title: string;
  meta: string;
  text: string;
  /** Square artwork for the 44px tile that leads the entry. */
  badge: ReactNode;
};

const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";
const SPRING = { damping: 30, stiffness: 320, mass: 0.45 };
/** An entry takes focus once its first line scrolls above this fraction of the viewport. */
const READING_LINE = 0.55;

export function FocusText({ items, className }: { items: FocusTextItem[]; className?: string }) {
  const reduceMotion = useReducedMotion();
  const [scrollIndex, setScrollIndex] = useState(0);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const badgeRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, SPRING);
  const springY = useSpring(rawY, SPRING);
  const smoothX = reduceMotion ? rawX : springX;
  const smoothY = reduceMotion ? rawY : springY;
  // Sit just right of the pointer, but never past the container's edge.
  const tagX = useTransform(smoothX, (x) => {
    const width = containerRef.current?.offsetWidth ?? Infinity;
    const tag = tagRef.current?.offsetWidth ?? 0;
    return Math.max(0, Math.min(x + 18, width - tag));
  });
  const tagY = useTransform(smoothY, (y) => y - 64);

  const track = useCallback((e: MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set(e.clientX - rect.left);
    rawY.set(e.clientY - rect.top);
  }, [rawX, rawY]);

  // Focus the last entry whose first line has scrolled past the reading line.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * READING_LINE;
      let index = 0;
      entryRefs.current.forEach((entry, i) => {
        if (entry && entry.getBoundingClientRect().top < line) index = i;
      });
      setScrollIndex(index);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items.length]);

  // Without a pointer on the text, park the tag beside the focused entry's badge.
  useEffect(() => {
    if (hoverId !== null) return;
    const park = () => {
      const container = containerRef.current?.getBoundingClientRect();
      const badge = badgeRefs.current[scrollIndex]?.getBoundingClientRect();
      if (!container || !badge) return;
      rawX.set(badge.left - container.left + badge.width / 2);
      rawY.set(badge.top - container.top + 8);
    };
    park();
    window.addEventListener("resize", park);
    return () => window.removeEventListener("resize", park);
  }, [hoverId, scrollIndex, rawX, rawY]);

  const activeId = hoverId ?? items[scrollIndex]?.id ?? null;
  const active = items.find((item) => item.id === activeId);

  return (
    <div
      ref={containerRef}
      onMouseMove={track}
      onMouseLeave={() => setHoverId(null)}
      className={cn("relative", className)}
    >
      <AnimatePresence>
        {active && (
          <motion.div
            ref={tagRef}
            key="tag"
            aria-hidden
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15, ease: "easeOut" } }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ x: tagX, y: tagY }}
            className="pointer-events-none absolute left-0 top-0 z-20 flex items-center gap-2.5 rounded-full border border-border bg-card/95 py-2 pl-2 pr-4 shadow-[0_12px_40px_-12px_#000c] backdrop-blur-xl"
          >
            <span className="size-7 shrink-0 overflow-hidden rounded-full">{active.badge}</span>
            <span className="flex flex-col leading-tight">
              <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-foreground">{active.title}</span>
              <span className="whitespace-nowrap text-xs text-muted-foreground">{active.meta}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[clamp(18px,1.8vw,26px)] font-medium leading-[1.55] tracking-[-0.02em]">
        {items.map((item, i) => {
          const isActive = item.id === activeId;
          const dimmed = !isActive;
          return (
            <span
              key={item.id}
              ref={(el) => { entryRefs.current[i] = el; }}
              onMouseEnter={(e) => { track(e); setHoverId(item.id); }}
              className={cn(
                "cursor-default transition-[opacity,filter,color] duration-500",
                EASE,
                isActive ? "text-foreground" : "text-muted-foreground",
                dimmed && "opacity-30 blur-[2.5px]"
              )}
            >
              <span
                ref={(el) => { badgeRefs.current[i] = el; }}
                aria-hidden
                className={cn(
                  "mr-3 inline-block size-9 overflow-hidden rounded-full align-middle transition-[transform,opacity] duration-500 sm:size-11",
                  EASE,
                  isActive && "scale-110",
                  dimmed && "scale-95"
                )}
              >
                {item.badge}
              </span>
              <span className="sr-only">{item.title}, {item.meta}: </span>
              {item.text}{" "}
            </span>
          );
        })}
      </p>
    </div>
  );
}
