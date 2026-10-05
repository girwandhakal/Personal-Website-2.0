"use client";

/**
 * Focus Text — adapted from uselayouts' Focus Testimonials (MIT),
 * https://uselayouts.com
 *
 * Entries run together as one paragraph, each led by a small badge. One entry
 * is always in focus while the rest dim and blur. The paragraph pins in the
 * viewport and each entry holds focus for its own stretch of scroll, so the
 * page steps through them one at a time; a tag naming the focused entry is
 * parked beside its badge. Hovering an entry takes over, and the tag follows
 * the pointer.
 *
 * Changes from the original: items and badges come from props; focus follows
 * scroll, with hover as an override; a pinned stage that slides the paragraph
 * to keep the focused entry in view when it is taller than the screen; no
 * "show more" row; dark palette; the tag stays inside the paragraph's right
 * edge; each entry carries its title and meta as screen-reader text, since
 * the tag is visual only.
 */

import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useCallback, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

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
/** Scroll distance, in viewport heights, each entry holds focus for. */
const STEP_VH = 75;
/** Room kept above the paragraph for the tag parked over the first entry. */
const TAG_ROOM = 64;

export function FocusText({ items, header, className }: { items: FocusTextItem[]; header?: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  const [scrollIndex, setScrollIndex] = useState(0);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const badgeRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Each entry owns an equal share of the pinned scroll, the last one included.
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setScrollIndex(Math.min(items.length - 1, Math.max(0, Math.floor(p * items.length))));
  });

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, SPRING);
  const springY = useSpring(rawY, SPRING);
  const smoothX = reduceMotion ? rawX : springX;
  const smoothY = reduceMotion ? rawY : springY;
  // Sit just right of the pointer, but never past the paragraph's edge.
  const tagX = useTransform(smoothX, (x) => {
    const width = contentRef.current?.offsetWidth ?? Infinity;
    const tag = tagRef.current?.offsetWidth ?? 0;
    return Math.max(0, Math.min(x + 18, width - tag));
  });
  const tagY = useTransform(smoothY, (y) => y - 64);
  const slideY = useMotionValue(0);

  const track = useCallback((e: MouseEvent) => {
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set(e.clientX - rect.left);
    rawY.set(e.clientY - rect.top);
  }, [rawX, rawY]);

  useLayoutEffect(() => {
    const place = (instant: boolean) => {
      const content = contentRef.current?.getBoundingClientRect();
      const viewport = viewportRef.current?.getBoundingClientRect();
      const entry = entryRefs.current[scrollIndex]?.getBoundingClientRect();
      const badge = badgeRefs.current[scrollIndex]?.getBoundingClientRect();
      if (!content || !viewport || !entry || !badge) return;

      // When the paragraph is taller than the stage, slide it so the focused
      // entry starts a quarter of the way down, or higher if that is what it
      // takes to show all of it, never past either end of the paragraph.
      const room = viewport.height - TAG_ROOM;
      const entryTop = entry.top - content.top;
      const entryBottom = entry.bottom - content.top;
      const lowest = Math.min(0, room - content.height);
      const fitted = Math.max(-entryTop, Math.min(viewport.height * 0.25 - entryTop, room - entryBottom));
      const target = Math.max(lowest, Math.min(0, fitted));
      if (instant || reduceMotion) slideY.set(target);
      else animate(slideY, target, { type: "spring", bounce: 0, duration: 0.6 });

      // Without a pointer on the text, park the tag beside the focused badge.
      if (hoverId === null) {
        rawX.set(badge.left - content.left + badge.width / 2);
        rawY.set(badge.top - content.top + 8);
      }
    };
    place(false);
    const onResize = () => place(true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [hoverId, scrollIndex, reduceMotion, rawX, rawY, slideY]);

  const activeId = hoverId ?? items[scrollIndex]?.id ?? null;
  const active = items.find((item) => item.id === activeId);

  return (
    <div ref={trackRef} className={cn("relative", className)} style={{ height: `calc(100svh + ${items.length * STEP_VH}vh)` }}>
      <div className="focus-text-stage sticky top-0 flex h-[100svh] flex-col pt-[calc(var(--nav-height)+24px)]">
        {header}
        <div ref={viewportRef} className="relative min-h-0 flex-1 overflow-clip" style={{ paddingTop: TAG_ROOM }}>
          <motion.div
            ref={contentRef}
            style={{ y: slideY }}
            onMouseMove={track}
            onMouseLeave={() => setHoverId(null)}
            className="relative"
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

            <p className="text-[clamp(17px,min(1.8vw,2.7vh),26px)] font-medium leading-[1.55] tracking-[-0.02em]">
              {items.map((item, i) => {
                const isActive = item.id === activeId;
                return (
                  <span
                    key={item.id}
                    ref={(el) => { entryRefs.current[i] = el; }}
                    onMouseEnter={(e) => { track(e); setHoverId(item.id); }}
                    className={cn(
                      "cursor-default transition-[opacity,filter,color] duration-500",
                      EASE,
                      isActive ? "text-foreground" : "text-muted-foreground opacity-30 blur-[2.5px]"
                    )}
                  >
                    <span
                      ref={(el) => { badgeRefs.current[i] = el; }}
                      aria-hidden
                      className={cn(
                        "mr-3 inline-block size-9 overflow-hidden rounded-full align-middle transition-transform duration-500 sm:size-11",
                        EASE,
                        isActive ? "scale-110" : "scale-95"
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}
