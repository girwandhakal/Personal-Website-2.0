"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * The portrait behind the hero: a duotone-graded headshot that resolves out of a
 * machine-vision "scan" as the page opens, then recedes into the background as
 * the visitor scrolls toward the work.
 *
 * Two things worth knowing about how this is built:
 *
 * - The focus pull is a cross-fade between a permanently-blurred copy and a sharp
 *   copy, not an animated `blur()`. Animating a blur radius on an element this
 *   large repaints it every frame; cross-fading two already-rasterized layers is
 *   compositor-only and reads identically (both are visible mid-transition, which
 *   is exactly how a lens rack looks).
 * - The duotone is done in CSS rather than baked into the file, so the grade
 *   itself is animatable — the cool "scanning" pass and the settled palette grade
 *   are the same stack at different opacities.
 * - Reduced motion is handled two ways on purpose. The scan layers are hidden in
 *   CSS (a media query the browser resolves at first paint), and the scroll
 *   parallax is dropped only after mount. Branching the markup on
 *   `useReducedMotion()` directly is a hydration mismatch waiting to happen: the
 *   server can't know the preference, so it always renders the motion variant.
 */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Mirrors the --portrait-w breakpoints in portfolio.css so Next picks a source
// close to the rendered size rather than the full-viewport default.
const IMAGE_SIZES = "(max-width: 720px) 58vw, (max-width: 1099px) 31vw, 380px";

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

  const settle = { duration: 1.5, ease: [0.16, 1, 0.3, 1] as const };

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
            <motion.div
              className="hero-portrait-media"
              initial={{ scale: 1.07 }}
              animate={{ scale: 1 }}
              transition={settle}
            >
              <Image
                className="hero-portrait-img hero-portrait-img-soft"
                src="/girwan-headshot.png"
                alt=""
                fill
                sizes={IMAGE_SIZES}
                priority
              />
              <motion.div
                className="hero-portrait-sharp"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...settle, delay: 0.15 }}
              >
                <Image
                  className="hero-portrait-img"
                  src="/girwan-headshot.png"
                  alt=""
                  fill
                  sizes={IMAGE_SIZES}
                  priority
                />
              </motion.div>

              {/* Palette grade — the settled look. */}
              <span className="hero-portrait-tint hero-portrait-tint-shadow" />
              <span className="hero-portrait-tint hero-portrait-tint-highlight" />
              <span className="hero-portrait-tint hero-portrait-tint-accent" />

              {/* Machine-vision pass — present on arrival, gone once it resolves.
                  Always rendered so the markup matches on hydration; CSS drops these
                  entirely when the visitor asks for reduced motion. */}
              <motion.span
                className="hero-portrait-tint hero-portrait-tint-scan"
                initial={{ opacity: 0.55 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.7, ease: "easeOut" }}
              />
              <motion.span
                className="hero-portrait-scanlines"
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.15 }}
              />
              <motion.span
                className="hero-portrait-sweep"
                initial={{ y: "-100%", opacity: 0 }}
                animate={{ y: "100%", opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.65, ease: [0.33, 0, 0.2, 1], times: [0, 0.12, 0.8, 1] }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
