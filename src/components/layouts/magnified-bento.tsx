"use client";

/**
 * Magnified Bento — adapted from uselayouts (MIT), https://uselayouts.com
 *
 * Rows of chips drifting in opposite directions, with a draggable magnifying
 * glass. Inside the lens the same rows are drawn again, larger and brighter,
 * clipped to the glass; outside it the base rows are masked out, so the lens
 * reads as real magnification rather than a sticker on top.
 *
 * Changes from the original: rows, title and description come from props;
 * lucide icons; the lens can be moved with the arrow keys; reduced motion
 * stops the drift.
 */

import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from "motion/react";
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type BentoChip = { id: string; label: string; icon: LucideIcon };

const KEY_STEP = 16;

function Rows({ rows, reveal, reduce }: { rows: BentoChip[][]; reveal?: boolean; reduce: boolean }) {
  return (
    <>
      {rows.map((row, rowIndex) => (
        <motion.div
          key={`row-${rowIndex}`}
          className="flex w-max gap-4"
          animate={reduce ? undefined : { x: rowIndex % 2 === 0 ? ["0%", "-33.333%"] : ["-33.333%", "0%"] }}
          transition={{ duration: 28 + rowIndex * 4, ease: "linear", repeat: Infinity }}
        >
          {[...row, ...row, ...row].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={`${item.id}-${idx}`}
                className={cn(
                  "flex w-fit items-center gap-2 whitespace-nowrap rounded-full border p-2 px-3 text-xs",
                  reveal
                    ? "ml-6 scale-125 border-primary/30 bg-background text-foreground shadow-sm"
                    : "border-border/70 bg-background/50 text-muted-foreground backdrop-blur-sm"
                )}
              >
                <Icon size={14} aria-hidden="true" className={reveal ? "text-primary" : undefined} />
                <span className={reveal ? "font-medium text-primary" : undefined}>{item.label}</span>
              </div>
            );
          })}
        </motion.div>
      ))}
    </>
  );
}

export function MagnifiedBento({ rows, title, description, footer, className }: {
  rows: BentoChip[][];
  title: string;
  description: string;
  footer?: ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = !!useReducedMotion();
  const lensX = useMotionValue(0);
  const lensY = useMotionValue(0);

  const clipPath = useMotionTemplate`circle(30px at calc(50% + ${lensX}px - 10px) calc(50% + ${lensY}px - 10px))`;
  const inverseMask = useMotionTemplate`radial-gradient(circle 30px at calc(50% + ${lensX}px - 10px) calc(50% + ${lensY}px - 10px), transparent 100%, black 100%)`;

  const nudge = (event: KeyboardEvent<HTMLDivElement>) => {
    const deltas: Record<string, [number, number]> = { ArrowLeft: [-KEY_STEP, 0], ArrowRight: [KEY_STEP, 0], ArrowUp: [0, -KEY_STEP], ArrowDown: [0, KEY_STEP] };
    const d = deltas[event.key];
    const box = containerRef.current?.getBoundingClientRect();
    if (!d || !box) return;
    event.preventDefault();
    const maxX = box.width / 2 - 40, maxY = box.height / 2 - 40;
    lensX.set(Math.max(-maxX, Math.min(maxX, lensX.get() + d[0])));
    lensY.set(Math.max(-maxY, Math.min(maxY, lensY.get() + d[1])));
  };

  return (
    <div className={cn("group relative w-full overflow-hidden rounded-[2rem] border border-border bg-card p-1.5 shadow-2xl shadow-black/30 transition-transform duration-500 hover:-translate-y-1 sm:rounded-[2.5rem] sm:p-2", className)}>
      <div ref={containerRef} className="relative h-[220px] w-full overflow-hidden rounded-[1.6rem] bg-[#1a2025] sm:h-[260px] sm:rounded-[2rem]">
        <div className="relative flex h-full w-full flex-col items-center justify-center">
          <motion.div style={{ WebkitMaskImage: inverseMask, maskImage: inverseMask }} className="flex h-full w-full flex-col justify-center gap-4" aria-hidden="true">
            <Rows rows={rows} reduce={reduce} />
          </motion.div>

          <motion.div className="pointer-events-none absolute inset-0 z-10 flex select-none flex-col justify-center gap-4" style={{ clipPath }} aria-hidden="true">
            <Rows rows={rows} reveal reduce={reduce} />
          </motion.div>

          <motion.div
            className="absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full drop-shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:cursor-grabbing"
            drag
            dragMomentum={false}
            dragConstraints={containerRef}
            style={{ x: lensX, y: lensY }}
            tabIndex={0}
            role="slider"
            aria-label="Magnifying glass — drag, or use the arrow keys, to inspect the toolkit"
            aria-valuetext="Movable magnifier"
            aria-valuenow={0}
            onKeyDown={nudge}
          >
            <div className="relative">
              <MagnifyingLens size={92} />
              <div className="pointer-events-none absolute left-[6px] top-[6px] size-[60px] rounded-full bg-white/10" />
            </div>
          </motion.div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-1/4 bg-gradient-to-r from-[#1a2025] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-1/4 bg-gradient-to-l from-[#1a2025] to-transparent" />
      </div>

      <div className="p-4 pb-6 sm:p-6 sm:pb-8">
        <h3 className="text-xl font-medium tracking-tight text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {footer}
      </div>
    </div>
  );
}

function MagnifyingLens({ size = 92 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M365.424 335.392L342.24 312.192L311.68 342.736L334.88 365.936L365.424 335.392Z" fill="#B0BDC6" />
      <path d="M358.08 342.736L334.88 319.552L319.04 335.392L342.24 358.584L358.08 342.736Z" fill="#DFE9EF" />
      <path d="M352.368 321.808L342.752 312.192L312.208 342.752L321.824 352.36L352.368 321.808Z" fill="#B0BDC6" />
      <path d="M332 332C260 404 142.4 404 69.6001 332C-2.3999 260 -2.3999 142.4 69.6001 69.6C141.6 -3.20003 259.2 -2.40002 332 69.6C404.8 142.4 404.8 260 332 332ZM315.2 87.2C252 24 150.4 24 88.0001 87.2C24.8001 150.4 24.8001 252 88.0001 314.4C151.2 377.6 252.8 377.6 315.2 314.4C377.6 252 377.6 150.4 315.2 87.2Z" fill="#DFE9EF" />
      <path d="M319.2 319.2C254.4 384 148.8 384 83.2001 319.2C18.4001 254.4 18.4001 148.8 83.2001 83.2C148 18.4 253.6 18.4 319.2 83.2C384 148.8 384 254.4 319.2 319.2ZM310.4 92C250.4 32 152 32 92.0001 92C32.0001 152 32.0001 250.4 92.0001 310.4C152 370.4 250.4 370.4 310.4 310.4C370.4 250.4 370.4 152 310.4 92Z" fill="#7A858C" />
      <path d="M484.104 428.784L373.8 318.472L318.36 373.912L428.672 484.216L484.104 428.784Z" fill="#333333" />
      <path d="M471.664 441.224L361.344 330.928L330.8 361.48L441.12 471.76L471.664 441.224Z" fill="#575B5E" />
      <path d="M495.2 423.2C504 432 432.8 504 423.2 495.2L417.6 489.6C408.8 480.8 480 408.8 489.6 417.6L495.2 423.2Z" fill="#B0BDC6" />
      <path d="M483.2 435.2C492 444 444.8 492 435.2 483.2L429.6 477.6C420.8 468.8 468 420.8 477.6 429.6L483.2 435.2Z" fill="#DFE9EF" />
    </svg>
  );
}
