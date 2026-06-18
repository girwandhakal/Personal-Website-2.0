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
      <motion.div
        className="stage-piece stage-piece-one"
        style={prefersReducedMotion ? undefined : { y: ySlow, rotate }}
      />
      <motion.div
        className="stage-piece stage-piece-two"
        style={prefersReducedMotion ? undefined : { y: yFast }}
      />
      <motion.div
        className="stage-piece stage-piece-three"
        style={prefersReducedMotion ? undefined : { y: ySlow }}
      />
      <div className="raster-noise" />
    </div>
  );
}
