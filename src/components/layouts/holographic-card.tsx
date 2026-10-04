"use client";

/**
 * Holographic Referral Card — adapted from uselayouts (MIT), https://uselayouts.com
 *
 * A dark pass that tilts toward the pointer in 3D while a soft holographic
 * glow follows it across the surface. Touch keeps it still; focus lights it.
 *
 * Changes from the original: header and footer slots take arbitrary content,
 * the centre badge is dropped (the photo carries the card), and the image is
 * a local asset with real alt text.
 */

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import type { PointerEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";

const spring = { stiffness: 260, damping: 28, mass: 0.7 };

export function HolographicCard({
  image,
  imageAlt,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  ariaLabel,
  className
}: {
  image: string;
  imageAlt: string;
  topLeft?: ReactNode;
  topRight?: ReactNode;
  bottomLeft?: ReactNode;
  bottomRight?: ReactNode;
  ariaLabel: string;
  className?: string;
}) {
  const reduce = Boolean(useReducedMotion());
  const rotateX = useSpring(useMotionValue(0), spring);
  const rotateY = useSpring(useMotionValue(0), spring);
  const translateZ = useSpring(useMotionValue(0), spring);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const glowOpacity = useSpring(useMotionValue(0), { stiffness: 260, damping: 30 });
  const transform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
  const glow = useMotionTemplate`radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.9) 10%, rgba(255,255,255,0.75) 20%, rgba(255,255,255,0) 80%)`;

  const onMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    const b = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - b.left) / b.width;
    const py = (event.clientY - b.top) / b.height;
    glowX.set(px * 100);
    glowY.set(py * 100);
    glowOpacity.set(1);
    if (reduce) return;
    rotateX.set((py - 0.5) * 20);
    rotateY.set((px - 0.5) * -20);
    translateZ.set(20);
  };

  const onLeave = () => {
    glowOpacity.set(0);
    rotateX.set(0);
    rotateY.set(0);
    translateZ.set(0);
    glowX.set(50);
    glowY.set(50);
  };

  return (
    <div className={cn("w-[min(100%,360px)] [perspective:1000px]", className)}>
      <motion.article
        aria-label={ariaLabel}
        tabIndex={0}
        className="relative flex w-full flex-col rounded-2xl bg-[#1f2121] p-2 text-left outline-none will-change-transform shadow-[0_83px_83px_rgba(0,0,0,0.26),0_21px_46px_rgba(0,0,0,0.29)] focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f2121] md:p-4"
        onPointerEnter={(e) => { if (e.pointerType !== "touch") { glowOpacity.set(1); if (!reduce) translateZ.set(20); } }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onFocus={() => glowOpacity.set(0.8)}
        onBlur={onLeave}
        style={{ transform: reduce ? "none" : transform }}
      >
        <div className="mb-2 flex shrink-0 items-center justify-between p-2 text-white">{topLeft}{topRight}</div>
        <div className="mx-2 flex-1">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={imageAlt} src={image} loading="lazy" className="absolute inset-0 size-full bg-black object-cover contrast-[.9] saturate-0" />
          </div>
        </div>
        <div className="mt-2 flex shrink-0 items-center justify-between gap-3 p-2 text-xs text-white">{bottomLeft}{bottomRight}</div>
        <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl mix-blend-overlay" style={{ background: glow, opacity: glowOpacity }} />
      </motion.article>
    </div>
  );
}
