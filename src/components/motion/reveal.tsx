"use client";

import { motion, useReducedMotion } from "motion/react";
import type { PropsWithChildren } from "react";

import { revealTransition } from "@/lib/animation";

type RevealProps = PropsWithChildren<{
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article";
}>;

export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const Component = motion[as];

  return (
    <Component
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 34, scale: 0.98 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ ...revealTransition, delay }}
    >
      {children}
    </Component>
  );
}
