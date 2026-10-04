"use client";

/**
 * Get In Touch — adapted from uselayouts (MIT), https://uselayouts.com
 *
 * A glossy pill. On hover or focus the label lifts away, a portrait and a
 * "YOU" chip spin in and merge, then the hover text writes itself in.
 *
 * Changes from the original: a plain anchor (it points at an on-page section),
 * the label stays the accessible name, and the gloss is tuned for a dark page.
 */

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type AnchorHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const END_STATE_DELAY_MS = 460;
const textTransition = { duration: 0.24, ease: [0.2, 0, 0, 1] } as const;
const avatarSpring = { type: "spring", stiffness: 460, damping: 26, mass: 0.8 } as const;
const mergeSpring = { type: "spring", stiffness: 540, damping: 32 } as const;
const slideSpring = { type: "spring", stiffness: 360, damping: 17, mass: 0.9 } as const;
const CLUSTER_CENTER_X = 32;
const HOVER_TEXT_DELAY = 0.2;

type Phase = "idle" | "start" | "end";

type GetInTouchProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
  href: string;
  imageSrc: string;
  defaultText?: string;
  hoverText?: string;
};

export function GetInTouch({ href, imageSrc, defaultText = "GET IN TOUCH", hoverText = "Let's talk!", className, ...rest }: GetInTouchProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hovered = useRef(false);
  const focused = useRef(false);
  const reduce = useReducedMotion();

  const update = (next: Phase) => { phaseRef.current = next; setPhase(next); };
  const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

  const start = () => {
    if (phaseRef.current !== "idle") return;
    clearTimer();
    if (reduce) { update("end"); return; }
    update("start");
    timerRef.current = setTimeout(() => { update("end"); timerRef.current = null; }, END_STATE_DELAY_MS);
  };
  const end = () => {
    if (hovered.current || focused.current) return;
    clearTimer();
    update("idle");
  };

  useEffect(() => clearTimer, []);

  const active = phase !== "idle";
  const isEnd = phase === "end";
  const t = <T extends object>(transition: T) => (reduce ? ({ duration: 0 } as const) : transition);

  return (
    <a
      href={href}
      {...rest}
      aria-label={rest["aria-label"] ?? defaultText}
      data-phase={phase}
      onMouseEnter={() => { hovered.current = true; start(); }}
      onMouseLeave={() => { hovered.current = false; end(); }}
      onFocus={() => { focused.current = true; start(); }}
      onBlur={() => { focused.current = false; end(); }}
      className={cn(
        "relative isolate inline-flex h-14 w-full max-w-52 shrink-0 items-center justify-center overflow-hidden rounded-full text-white no-underline transition-transform duration-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transform-none",
        className
      )}
      style={{
        background: "linear-gradient(rgb(36, 40, 44) 0%, rgb(6, 7, 8) 100%)",
        boxShadow:
          "rgba(255,255,255,0.3) 0px 1px 0px 0px inset, rgba(255,255,255,0.28) 0px 0px 28px 0px inset, rgba(0,0,0,0.25) 0px 10px 24px -6px, rgba(255,255,255,0.14) 0px 0px 0px 1px"
      }}
    >
      <motion.span
        initial={false}
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center text-sm font-semibold leading-none tracking-wide"
        animate={{ opacity: active ? 0 : 1, y: active ? -28 : 0, filter: active ? "blur(4px)" : "blur(0px)" }}
        transition={t(textTransition)}
      >
        {defaultText}
      </motion.span>

      <motion.span
        initial={false}
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-start pl-2 text-xs font-semibold leading-none opacity-0"
        animate={{ opacity: active ? 1 : 0 }}
        transition={t(textTransition)}
      >
        <motion.span initial={false} className="flex shrink-0 items-center justify-center" animate={{ x: isEnd ? 0 : CLUSTER_CENTER_X }} transition={t(slideSpring)}>
          <motion.span
            initial={false}
            className="relative z-0 block size-10 shrink-0 overflow-hidden rounded-full"
            animate={{ opacity: active ? 1 : 0, rotate: active ? 0 : -180, x: active ? 0 : -40 }}
            transition={t({ ...avatarSpring, delay: active ? 0.04 : 0 })}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
          </motion.span>
          <motion.span
            initial={false}
            className="block overflow-hidden text-center text-base"
            animate={{
              opacity: active && !isEnd ? 1 : 0,
              scale: active && !isEnd ? 1 : 0.6,
              width: active && !isEnd ? 18 : 0,
              marginLeft: active && !isEnd ? 8 : 0,
              marginRight: active && !isEnd ? 8 : 0
            }}
            transition={t({ ...mergeSpring, opacity: textTransition, delay: active && !isEnd ? 0.14 : 0 })}
          >
            +
          </motion.span>
          <motion.span
            initial={false}
            className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-black"
            animate={{ opacity: active ? 1 : 0, rotate: active ? 0 : 180, x: active ? 0 : 40, marginLeft: isEnd ? -12 : 0 }}
            transition={t({ ...avatarSpring, marginLeft: mergeSpring, delay: active && !isEnd ? 0.1 : 0 })}
          >
            YOU
          </motion.span>
        </motion.span>
        <motion.span
          initial={false}
          className="block overflow-hidden whitespace-nowrap text-sm"
          animate={{ width: isEnd ? "auto" : 0, marginLeft: isEnd ? 10 : 0, opacity: isEnd ? 1 : 0 }}
          transition={t({
            width: { ...textTransition, delay: isEnd ? HOVER_TEXT_DELAY : 0 },
            marginLeft: { ...textTransition, delay: isEnd ? HOVER_TEXT_DELAY : 0 },
            opacity: { ...textTransition, delay: isEnd ? HOVER_TEXT_DELAY : 0 }
          })}
        >
          {hoverText}
        </motion.span>
      </motion.span>
    </a>
  );
}
