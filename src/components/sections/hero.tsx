"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { AboutModal } from "./about-modal";

/**
 * The hero now sits directly on top of the looping intro film — the same film
 * plays behind it continuously rather than handing off to a static frame — so it
 * no longer waits for a reveal signal. It still fades/slides in once on mount,
 * purely as an entrance flourish, not as a gate on some other event.
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
  const compactAboutModal = useCompactAboutModal();
  const [aboutOpen, setAboutOpen] = useState(false);
  const closeAbout = useCallback(() => setAboutOpen(false), []);

  return <section className="hero-section section-inner" id="hero" aria-labelledby="hero-title">
    <motion.div className="hero-copy" initial={HIDDEN} animate={SHOWN} transition={{ duration: 0.85, ease: EASE }}>
      <h1 id="hero-title"><span>Girwan</span><span>Dhakal</span></h1>
      <p className="hero-subtitle">Aspiring AI/ML Engineer</p>
      <div className="hero-actions">
        <button className="button button-primary" type="button" onClick={() => setAboutOpen(true)}>
          About me <ArrowUpRight size={20} aria-hidden="true" />
        </button>
      </div>
    </motion.div>
    <AnimatePresence>{aboutOpen && <AboutModal compact={compactAboutModal} onClose={closeAbout} />}</AnimatePresence>
  </section>;
}
