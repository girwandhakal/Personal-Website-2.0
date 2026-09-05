"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { PortraitPlate, type PlateTiming } from "@/components/ui/portrait-plate";

/**
 * The portrait behind the hero — the resting state the intro hands off to. It
 * carries the same graded plate, masked down to a presence behind the name and
 * the AI panel, and recedes as the visitor scrolls on toward the work.
 *
 * Reduced motion is handled two ways on purpose: the scan layers are dropped in
 * CSS (a media query the browser resolves at first paint), and the scroll
 * parallax only after mount. Branching the markup on `useReducedMotion()`
 * directly is a hydration mismatch waiting to happen — the server can't know the
 * preference, so it always renders the motion variant.
 */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Mirrors the --portrait-w breakpoints in portfolio.css so Next picks a source
// close to the rendered size rather than the full-viewport default.
const IMAGE_SIZES = "(max-width: 720px) 58vw, (max-width: 1099px) 31vw, 380px";

// Quicker and quieter than the intro: by the time this is on screen the face has
// already had its moment, so it just settles in behind the name.
const HERO_TIMING: PlateTiming = {
  focus: 1.5,
  focusDelay: 0.15,
  pushFrom: 1.07,
  push: 1.5,
  scan: 1.7,
  sweep: 1.65
};

export function HeroPortrait() {
  const anchorRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // False through SSR and the first client render, so the two agree; the parallax
  // is dropped on the tick after mount, while nothing has scrolled yet anyway.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const noParallax = mounted && reduced;

  // Progress through the hero itself: 0 at rest, 1 once the hero has scrolled by.
  const { scrollYProgress } = useScroll({ target: anchorRef, offset: ["start start", "end start"] });

  // Fades out, drifts down against the scroll (so it lags the foreground like a
  // background plate would), and pushes in slightly as it goes.
  //
  // These map through explicit functions rather than input/output ranges: with a
  // range, progress past the final stop reset the value to its start instead of
  // holding the end, so the portrait popped back to full opacity once the hero was
  // scrolled clear. Clamping the input ourselves is unambiguous at every position.
  const scrollOpacity = useTransform(scrollYProgress, (p) => {
    const t = clamp01(p) / 0.85; // gone by 85% of the way through the hero
    return t >= 1 ? 0 : 1 - t * t; // holds while the hero is on screen, then falls away
  });
  const scrollY = useTransform(scrollYProgress, (p) => clamp01(p) * 110);
  const scrollScale = useTransform(scrollYProgress, (p) => 1 + clamp01(p) * 0.09);

  return (
    <div ref={anchorRef} className="hero-portrait" aria-hidden="true">
      <div className="hero-portrait-anchor">
        {/* Fade and movement are deliberately on separate layers. Driving both from
            one element's style left the opacity pinned to its server-rendered value
            while only the transform tracked scroll — split, both update reliably. */}
        <motion.div className="hero-portrait-fade" style={{ opacity: scrollOpacity }}>
          <motion.div
            className="hero-portrait-scroll"
            style={noParallax ? undefined : { y: scrollY, scale: scrollScale }}
          >
            <PortraitPlate className="hero-portrait-media" sizes={IMAGE_SIZES} timing={HERO_TIMING} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
