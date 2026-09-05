"use client";
import { motion, useReducedMotion } from "motion/react";
import type { PropsWithChildren } from "react";

export function Reveal({ children, className, delay = 0, as = "div" }: PropsWithChildren<{ className?: string; delay?: number; as?: "div" | "section" | "article" }>) {
  const reduced = useReducedMotion();
  const Component = motion[as];
  return <Component className={className} initial={false} whileInView={reduced ? undefined : { y: [12, 0] }} viewport={{ once: true }} transition={{ duration: .65, delay, ease: [.16, 1, .3, 1] }}>{children}</Component>;
}
