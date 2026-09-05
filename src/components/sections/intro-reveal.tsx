"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { PortraitPlate, PLATE_EASE, type PlateTiming } from "@/components/ui/portrait-plate";

/**
 * The opening: the portrait alone on screen, resolving out of a machine-vision
 * scan behind an aperture that opens, then the page travels down to the hero on
 * its own so the same face is waiting behind the name.
 *
 * The travel is a hand-rolled eased scroll rather than `scrollTo({behavior:
 * "smooth"})`, because the native version's duration isn't controllable and lands
 * too abruptly for the pacing here. It bails out the moment the visitor takes
 * over — any wheel, touch, key or pointer input cancels it — and never runs at
 * all for a deep link, a restored scroll position, or reduced motion.
 */

const HOLD_BEFORE_TRAVEL_MS = 3200;
const TRAVEL_MS = 1500;

const INTRO_TIMING: PlateTiming = {
  focus: 1.9,
  focusDelay: 0.35,
  pushFrom: 1.16, // a long, slow dolly that keeps moving after the face resolves
  push: 4.2,
  scan: 2.1,
  sweep: 2
};

/** Eased programmatic scroll. Returns a cancel handle. */
function travelTo(to: number, duration: number) {
  const from = window.scrollY;
  const distance = to - from;
  const root = document.documentElement;
  if (duration <= 0) {
    // Reduced motion: the visitor asked for the destination, not the journey.
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, to);
    root.style.scrollBehavior = previous;
    return () => {};
  }
  // `html { scroll-behavior: smooth }` would fight a per-frame scrollTo, so this
  // owns the motion outright and restores the stylesheet's value afterwards.
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  const started = performance.now();
  let frame = 0;

  const finish = () => { root.style.scrollBehavior = previousBehavior; };
  const step = (now: number) => {
    const t = Math.min(1, (now - started) / duration);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    window.scrollTo(0, from + distance * eased);
    if (t < 1) frame = requestAnimationFrame(step);
    else finish();
  };
  frame = requestAnimationFrame(step);

  return () => { cancelAnimationFrame(frame); finish(); };
}

export function IntroReveal() {
  const reduced = useReducedMotion();
  const cancelTravelRef = useRef<(() => void) | null>(null);

  const goToHero = useCallback(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-height"), 10) || 88;
    const target = hero.getBoundingClientRect().top + window.scrollY - navHeight - 8;
    cancelTravelRef.current?.();
    cancelTravelRef.current = travelTo(Math.max(0, target), reduced ? 0 : TRAVEL_MS);
  }, [reduced]);

  useEffect(() => {
    if (reduced) return; // the visitor asked for no unprompted motion
    if (window.location.hash) return; // a deep link already says where to go
    if (window.scrollY > 4) return; // restored position, or they've already moved

    let cancelled = false;
    const stop = () => {
      cancelled = true;
      cancelTravelRef.current?.();
      cancelTravelRef.current = null;
    };

    const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    events.forEach((type) => window.addEventListener(type, stop, { passive: true }));

    const timer = setTimeout(() => { if (!cancelled) goToHero(); }, HOLD_BEFORE_TRAVEL_MS);

    return () => {
      clearTimeout(timer);
      events.forEach((type) => window.removeEventListener(type, stop));
      cancelTravelRef.current?.();
      cancelTravelRef.current = null;
    };
  }, [reduced, goToHero]);

  return (
    <section className="intro-section" aria-label="Introduction">
      <motion.div
        className="intro-aperture"
        initial={{ clipPath: "inset(50% 0% 50% 0%)" }}
        animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
        transition={{ duration: 1.3, ease: PLATE_EASE }}
      >
        <PortraitPlate
          className="intro-media"
          sizes="(max-width: 720px) 78vw, 42vh"
          timing={INTRO_TIMING}
          alt="Girwan Dhakal"
        />
      </motion.div>

      <motion.button
        type="button"
        className="intro-cue"
        onClick={goToHero}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 1.6, ease: "easeOut" }}
      >
        <span className="intro-cue-line" aria-hidden="true" />
        Enter
      </motion.button>
    </section>
  );
}
