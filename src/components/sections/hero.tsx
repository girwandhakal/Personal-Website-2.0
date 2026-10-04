"use client";

import { ArrowDown } from "lucide-react";
import { motion } from "motion/react";

import { GetInTouch } from "@/components/layouts/get-in-touch";

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
      <p className="hero-eyebrow"><span className="hero-eyebrow-dot" aria-hidden="true" />Computer Science · The University of Alabama</p>
      <h1 id="hero-title"><span>Girwan</span> <span>Dhakal</span></h1>
      <p className="hero-subtitle">Aspiring AI/ML Engineer</p>
      <div className="hero-actions">
        <GetInTouch href="#contact" imageSrc="/media/portrait.jpg" />
        <a className="hero-work-link" href="#projects">See the work <ArrowDown size={18} aria-hidden="true" /></a>
      </div>
    </motion.div>
  </section>;
}
