"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

export function ScrollField() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const ySlow = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const yFast = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 38]);

  return (
    <div className="scroll-field" aria-hidden="true">

      <div className="raster-noise" />
    </div>
  );
}
