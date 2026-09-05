"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { profile } from "@/content/profile";
import { AIPreview } from "./ai-preview";
import { useIntroRevealed } from "@/lib/intro-reveal";

/**
 * The hero sits below the intro film, so it's off screen while the film plays and
 * only animates in once it's been sent for.
 *
 * Two triggers, deliberately: the intro broadcasts when the film ends or when the
 * visitor takes over, and an observer on the section itself covers arriving by any
 * other route. Relying on the viewport threshold alone was fragile on mobile, where
 * dynamic viewport units shift under the URL bar and the section can sit just shy of
 * the threshold. If neither mechanism is available, it reveals immediately rather
 * than risk staying invisible.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const HIDDEN = { opacity: 0, y: 26 };
const SHOWN = { opacity: 1, y: 0 };

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const introRevealed = useIntroRevealed();
  // Second route: arriving at the section by any means reveals it, so it can't be
  // left invisible if the intro's signal never comes.
  const [inView, setInView] = useState(false);
  const revealed = introRevealed || inView;

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setInView(true); }, { threshold: 0.12 });
    if (sectionRef.current) io.observe(sectionRef.current);
    return () => io.disconnect();
  }, []);

  return <section ref={sectionRef} className="hero-section section-inner" id="hero" aria-labelledby="hero-title">
    <motion.div className="hero-copy" initial={HIDDEN} animate={revealed ? SHOWN : HIDDEN} transition={{ duration: 0.85, ease: EASE }}>
      <h1 id="hero-title"><span>Girwan</span><span>Dhakal</span></h1>
      <p className="hero-subtitle">ML Engineer &amp; Researcher</p>
      <div className="hero-actions">
        <a className="button button-primary" href="#projects">Work <ArrowUpRight size={20} aria-hidden="true" /></a>
        <a className="button button-secondary" href={profile.resumeHref} target="_blank" rel="noopener noreferrer">Résumé <ArrowUpRight size={20} aria-hidden="true" /></a>
      </div>
    </motion.div>
    <motion.div className="hero-preview" initial={HIDDEN} animate={revealed ? SHOWN : HIDDEN} transition={{ duration: 0.95, delay: 0.18, ease: EASE }}>
      <AIPreview />
    </motion.div>
  </section>;
}
