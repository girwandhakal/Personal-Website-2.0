"use client";

import { motion } from "motion/react";

/**
 * The hero sits directly on top of the looping intro film (see CinemaIntro) —
 * the same film plays behind it continuously. The copy fades/slides in once on
 * mount, purely as an entrance flourish.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const HIDDEN = { opacity: 0, y: 26 };
const SHOWN = { opacity: 1, y: 0 };

export function Hero() {
  return <section className="hero-section section-inner" id="hero" aria-labelledby="hero-title">
    <motion.div className="hero-copy" initial={HIDDEN} animate={SHOWN} transition={{ duration: 0.85, ease: EASE }}>
      <h1 id="hero-title"><span>Girwan</span> <span>Dhakal</span></h1>
      <p className="hero-subtitle">Aspiring AI/ML Engineer</p>
    </motion.div>
  </section>;
}
