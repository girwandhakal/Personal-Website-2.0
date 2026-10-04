"use client";

/**
 * Scroll Stack Deck — adapted from uselayouts (MIT), https://uselayouts.com
 *
 * Folder-tabbed project cards pinned in the viewport. As the page scrolls,
 * each next card rises from below and the ones behind it step back, scale
 * down, and settle into a stack.
 *
 * Changes from the original: no Lenis (the page's own overlays lock scroll by
 * intercepting wheel/touch events, which a smooth-scroll library would fight);
 * each card is a button that reports its box so a detail view can open from
 * it; the visual slot takes any node instead of an image URL; the pinned
 * stage clips, so cards waiting below never peek into tall viewports; phones
 * get a tighter stack step; reduced motion gets a plain column.
 */

import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface StackDeckItem {
  id: string;
  tabTitle: string;
  title: string;
  description: string;
  meta?: string;
  visual: ReactNode;
  color: string;
  textColor?: string;
}

type OpenHandler = (item: StackDeckItem, origin: DOMRect) => void;

function buildCardKeyframes(index: number, total: number, stackStep: number) {
  const steps: number[] = [];
  const ys: number[] = [];
  const scales: number[] = [];
  const transitions = Math.max(total - 1, 1);

  for (let step = 0; step <= transitions; step++) {
    steps.push(step / transitions);
    if (step < index) {
      ys.push(900);
      scales.push(1);
    } else if (step === index) {
      ys.push(0);
      scales.push(1);
    } else {
      const depth = step - index;
      ys.push(-depth * stackStep);
      scales.push(1 - depth * 0.038);
    }
  }

  if (index === 0) return { steps, y: ys, scale: scales };

  // Hold the card off-stage until the previous card has landed, then bring
  // it in across exactly one step.
  const entryStart = (index - 1) / transitions;
  const entryEnd = index / transitions;
  const fullSteps: number[] = [], fullY: number[] = [], fullScale: number[] = [];
  steps.forEach((s) => { if (s < entryStart) { fullSteps.push(s); fullY.push(900); fullScale.push(1); } });
  fullSteps.push(entryStart); fullY.push(900); fullScale.push(1);
  steps.forEach((s, i) => { if (s >= entryEnd) { fullSteps.push(s); fullY.push(ys[i]); fullScale.push(scales[i]); } });
  return { steps: fullSteps, y: fullY, scale: fullScale };
}

function CardBody({ item, onOpen }: { item: StackDeckItem; onOpen: OpenHandler }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Open ${item.title}`}
      onClick={() => { const box = ref.current?.getBoundingClientRect(); if (box) onOpen(item, box); }}
      className="group block w-full cursor-pointer rounded-2xl text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      style={{ color: item.textColor ?? "#0b0d0f" }}
    >
      <article className="relative w-full pt-11 sm:pt-14">
        <div
          style={{ backgroundColor: item.color }}
          className="absolute left-0 top-0 flex h-11 w-44 items-center rounded-t-2xl px-4 text-sm font-semibold tracking-tight sm:h-14 sm:w-64 sm:px-6 sm:text-base"
        >
          <span className="truncate">{item.tabTitle}</span>
        </div>

        <div
          style={{ backgroundColor: item.color }}
          className="relative grid grid-cols-1 content-center items-center gap-5 overflow-hidden rounded-b-2xl rounded-tr-2xl p-5 shadow-[0_4px_8px_-4px_rgba(0,0,0,0.12),inset_0_-2px_4px_-2px_rgba(0,0,0,0.25)] sm:p-8 md:min-h-[31rem] md:grid-cols-[minmax(0,1.05fr)_minmax(16rem,0.95fr)] md:gap-12"
        >
          <div className="z-10 flex flex-col items-start gap-3">
            {item.meta && <span className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-55 sm:text-xs">{item.meta}</span>}
            <h3 className="text-[22px] font-medium leading-tight tracking-tight sm:text-3xl">{item.title}</h3>
            <p className="line-clamp-4 text-[15px] leading-snug opacity-65 sm:line-clamp-none sm:text-lg">{item.description}</p>
            <span className="mt-1 inline-flex items-center gap-2 rounded-full bg-black/85 px-4 py-2 text-sm font-medium text-white transition-transform duration-300 group-hover:-translate-y-0.5">
              Read the case study
              <ArrowUpRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>
          <div className="relative h-36 w-full overflow-hidden rounded-xl bg-black/10 sm:h-64 md:h-80 lg:h-[22rem] [&>*]:size-full [&>*]:transition-transform [&>*]:duration-500 group-hover:[&>*]:scale-[1.04]">
            {item.visual}
          </div>
        </div>
      </article>
    </button>
  );
}

function DeckCard({ item, index, total, progress, stackStep, onOpen }: {
  item: StackDeckItem; index: number; total: number; progress: MotionValue<number>; stackStep: number; onOpen: OpenHandler;
}) {
  const kf = buildCardKeyframes(index, total, stackStep);
  const y = useTransform(progress, kf.steps, kf.y);
  const scale = useTransform(progress, kf.steps, kf.scale);
  return (
    <motion.div
      style={{ y, scale, zIndex: 700 + index * 10, transformOrigin: "center top", willChange: "transform" }}
      className="absolute inset-x-0 top-0 w-full select-none"
    >
      <CardBody item={item} onOpen={onOpen} />
    </motion.div>
  );
}

function useIsPhone() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setPhone(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return phone;
}

export function ScrollStackDeck({ items, onOpen, className }: { items: StackDeckItem[]; onOpen: OpenHandler; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const phone = useIsPhone();
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.15, restDelta: 0.0001 });

  if (reduce) {
    return (
      <div ref={containerRef} className={cn("grid gap-10", className)}>
        {items.map((item) => <CardBody key={item.id} item={item} onOpen={onOpen} />)}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative isolate w-full", className)} style={{ height: `${items.length * 100}vh` }}>
      <div className="pointer-events-none sticky top-0 flex h-[100svh] w-full items-start justify-center overflow-clip pt-[calc(var(--nav-height)+80px)] md:items-center md:pt-0">
        <div className="pointer-events-auto relative h-[30rem] w-full md:h-[37rem]">
          {items.map((item, index) => (
            <DeckCard key={item.id} item={item} index={index} total={items.length} progress={progress} stackStep={phone ? 22 : 48} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </div>
  );
}
