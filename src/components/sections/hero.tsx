"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { AboutModal } from "./about-modal";
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

function useCompactAboutModal() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px), (hover: none)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return compact;
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const introRevealed = useIntroRevealed();
  const compactAboutModal = useCompactAboutModal();
  const [aboutOpen, setAboutOpen] = useState(false);
  const closeAbout = useCallback(() => setAboutOpen(false), []);
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
        <button className="button button-primary" type="button" onClick={() => setAboutOpen(true)}>
          About me <ArrowUpRight size={20} aria-hidden="true" />
        </button>
      </div>
    </motion.div>
    <AnimatePresence>{aboutOpen && <AboutModal compact={compactAboutModal} onClose={closeAbout} />}</AnimatePresence>
  </section>;
}
