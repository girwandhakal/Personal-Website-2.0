"use client";

/**
 * Liquid Index — adapted from uselayouts (MIT), https://uselayouts.com
 *
 * A list of large titles. The hovered row slides in a touch, the others dim,
 * and a badge carrying a live WebGL liquid gradient glides down the left rail
 * to sit beside it, while that row's detail fades in underneath the list.
 * Phones get an accordion instead: the detail opens inline under its row.
 *
 * Changes from the original: items come from props with an optional meta
 * line; the badge is the gradient itself (no photo underneath); the first row
 * starts active and the last one hovered stays active, so the detail is never
 * blank; keyboard focus drives the same state as hover; an item may carry a
 * logo, which replaces the gradient with the logo on a white tile.
 */

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

import { LiquidGradientCanvas } from "./liquid-gradient-canvas";

const SPRING = { type: "spring" as const, bounce: 0, duration: 0.36 };
const COLOR_EASE = [0.25, 0.1, 0.25, 1] as const;

export type LiquidIndexItem = {
  title: string;
  meta?: string;
  description: string;
  icon: LucideIcon;
  seed: number;
  colors: [number, number, number][];
  /** Shown on a white tile in place of the gradient badge. */
  logo?: { src: string; alt: string };
};

function useIsPhone() {
  const [isPhone, setIsPhone] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 809px)");
    const update = () => setIsPhone(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return isPhone;
}

export function LiquidIndex({ items }: { items: LiquidIndexItem[] }) {
  const isPhone = useIsPhone();
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<number>(0);
  const [offsetY, setOffsetY] = useState(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const current = items[active] ?? items[0];
  const Icon = current.icon;
  const transition = reduceMotion ? { duration: 0 } : SPRING;
  const fade = { duration: reduceMotion ? 0 : 0.18, ease: COLOR_EASE };

  useLayoutEffect(() => {
    if (isPhone) { setOffsetY(0); return; }
    const first = itemRefs.current[0];
    const item = itemRefs.current[active];
    if (!first || !item) return;
    setOffsetY(item.offsetTop - first.offsetTop);
  }, [active, isPhone]);

  return (
    <div className={isPhone ? "flex w-full flex-col items-start gap-6" : "flex w-full flex-row items-stretch gap-12"}>
      <div className={isPhone ? "relative flex w-[104px] shrink-0 flex-col items-center" : "relative flex w-[200px] shrink-0 flex-col items-center"}>
        <motion.div
          aria-hidden="true"
          className={
            isPhone
              ? "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[24px] bg-muted"
              : "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[32px] bg-muted"
          }
          initial={false}
          animate={{ y: isPhone ? 0 : offsetY }}
          transition={transition}
        >
          <div className="absolute inset-0">
            <LiquidGradientCanvas colors={current.colors} seed={current.seed} paused={!!reduceMotion} />
          </div>
          <div className={isPhone ? "relative z-[2] flex size-9 items-center justify-center text-white" : "relative z-[2] flex size-14 items-center justify-center text-white"}>
            <AnimatePresence initial={false} mode="sync">
              <motion.span
                key={current.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fade}
                className="absolute inset-0 flex items-center justify-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
              >
                <Icon className={isPhone ? "size-7" : "size-10"} strokeWidth={1.6} aria-hidden="true" />
              </motion.span>
            </AnimatePresence>
          </div>
          <AnimatePresence initial={false} mode="sync">
            {current.logo && (
              <motion.div
                key={current.logo.src}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fade}
                className={isPhone ? "absolute inset-0 z-[3] flex items-center justify-center bg-white p-3" : "absolute inset-0 z-[3] flex items-center justify-center bg-white p-6"}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current.logo.src} alt={current.logo.alt} draggable={false} className="max-h-full w-full object-contain" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className={isPhone ? "flex min-w-0 flex-1 flex-col items-start gap-5" : "flex min-w-0 flex-1 flex-col items-start gap-7 pb-4"}>
        <div className="flex w-full flex-col items-start">
          {items.map((item, index) => {
            const isActive = active === index;
            return (
              <motion.button
                key={item.title}
                ref={(node) => { itemRefs.current[index] = node; }}
                type="button"
                aria-expanded={isActive}
                onMouseEnter={() => { if (!isPhone) setActive(index); }}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                className={isPhone ? "flex w-full cursor-pointer flex-col items-start gap-1 py-2 text-left" : "flex w-full cursor-pointer flex-col items-start py-2 text-left"}
                animate={{ paddingLeft: isActive ? 8 : 0 }}
                transition={transition}
              >
                <motion.span
                  className={
                    isPhone
                      ? "w-full select-none text-[25px] font-semibold leading-[1.14em] tracking-[-0.03em]"
                      : "w-full select-none text-[clamp(28px,3.1vw,44px)] font-semibold leading-[1.1em] tracking-[-0.04em]"
                  }
                  initial={false}
                  animate={{ color: isActive ? "var(--ink)" : "var(--ink-dim)" }}
                  transition={fade}
                >
                  {item.title}
                </motion.span>
                {item.meta && (
                  <span className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{item.meta}</span>
                )}
                <AnimatePresence initial={false}>
                  {isPhone && isActive ? (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={transition}
                      className="max-w-[520px] overflow-hidden pt-2 text-[15px] leading-[1.55em] text-pretty text-muted-foreground"
                    >
                      {item.description}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        <div className={isPhone ? "hidden" : "min-h-[150px] w-full max-w-[640px]"}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={current.title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={transition}
              className="text-[17px] leading-[1.6em] tracking-[-0.01em] text-pretty text-muted-foreground"
            >
              {current.description}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
