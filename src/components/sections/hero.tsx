"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { profile } from "@/content/profile";
import { AIPreview } from "./ai-preview";

/**
 * The hero sits below the intro film, so it is off screen while the film plays.
 * Its two halves animate in when they come into view — which happens either
 * because the film ended and the page travelled down on its own, or because the
 * visitor scrolled there first. Both paths land on the same reveal.
 */

const RISE = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.35 }
} as const;

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  return <section className="hero-section section-inner" id="hero" aria-labelledby="hero-title">
    <motion.div className="hero-copy" {...RISE} transition={{ duration: 0.85, ease: EASE }}>
      <h1 id="hero-title"><span>Girwan</span><span>Dhakal</span></h1>
      <p className="hero-subtitle">ML Engineer &amp; Researcher</p>
      <div className="hero-actions">
        <a className="button button-primary" href="#projects">Work <ArrowUpRight size={20} aria-hidden="true" /></a>
        <a className="button button-secondary" href={profile.resumeHref} target="_blank" rel="noopener noreferrer">Résumé <ArrowUpRight size={20} aria-hidden="true" /></a>
      </div>
    </motion.div>
    <motion.div className="hero-preview" {...RISE} transition={{ duration: 0.95, delay: 0.18, ease: EASE }}>
      <AIPreview />
    </motion.div>
  </section>;
}
