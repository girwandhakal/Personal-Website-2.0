"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * The opening: the intro film plays full-bleed behind the first screen, and once
 * it reaches its closing beat the page travels down on its own so the hero's name
 * lands while the film resolves to camera behind it.
 *
 * The video is deliberately ungraded — no filters over it. The only overlay is a
 * scrim that fades in as the hero scrolls over the top, purely so white text stays
 * legible against a bright frame; it's at zero for the whole intro.
 *
 * Playback notes, which is where most background-video implementations go wrong:
 * - `muted` + `playsinline` are what make autoplay legal on mobile Safari. React
 *   doesn't reliably reflect `muted` into the server-rendered markup, so it's also
 *   set imperatively before play().
 * - Playback starts from an effect rather than the `autoplay` attribute. That keeps
 *   the server and client markup identical (branching markup on a client-only
 *   preference is a hydration mismatch), and it lets reduced-motion and Save-Data
 *   opt out cleanly — both simply leave the poster frame showing.
 * - The audio track is stripped from the encodes rather than just muted.
 * - Playback pauses when the film scrolls out of view, so it isn't decoding frames
 *   behind the rest of the page.
 */

// The film plays in full — the page only travels down once it has ended, so nothing
// competes with it while it runs. The hero's name and AI panel then animate in as
// they come into view (whether they got there by this travel or by the visitor
// scrolling first). The film holds its closing to-camera frame as their backdrop.
const TRAVEL_MS = 1600;

/**
 * `play()` only returns a promise in modern browsers — older ones (and jsdom under
 * test) return undefined, where calling `.catch` on the result would throw.
 */
function attemptPlay(video: HTMLVideoElement) {
  const played = video.play() as Promise<void> | undefined;
  if (played && typeof played.catch === "function") played.catch(() => { /* blocked by policy */ });
}

/**
 * The hero listens for this to run its entrance. It is broadcast when the film ends
 * and when the visitor takes over, rather than leaving the hero to rely purely on a
 * viewport threshold — on a short screen, or once dynamic viewport units shift under
 * a mobile URL bar, that threshold is easy to never quite satisfy.
 */
export const HERO_REVEAL_EVENT = "hero:reveal";
function signalHeroReveal() {
  window.dispatchEvent(new Event(HERO_REVEAL_EVENT));
}

/** Eased programmatic scroll. Returns a cancel handle. */
function travelTo(to: number, duration: number) {
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  // `html { scroll-behavior: smooth }` would fight a per-frame scrollTo.
  root.style.scrollBehavior = "auto";
  const restore = () => { root.style.scrollBehavior = previousBehavior; };

  if (duration <= 0) {
    window.scrollTo(0, to);
    restore();
    return () => {};
  }

  const from = window.scrollY;
  const distance = to - from;
  const started = performance.now();
  let frame = 0;
  const step = (now: number) => {
    const t = Math.min(1, (now - started) / duration);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    window.scrollTo(0, from + distance * eased);
    if (t < 1) frame = requestAnimationFrame(step);
    else restore();
  };
  frame = requestAnimationFrame(step);
  return () => { cancelAnimationFrame(frame); restore(); };
}

export function CinemaIntro() {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const introRef = useRef<HTMLElement>(null);
  const cancelTravelRef = useRef<(() => void) | null>(null);
  const travelledRef = useRef(false);

  // Scrim only ramps up as the hero slides over the film — zero across the intro.
  const { scrollYProgress } = useScroll({ target: introRef, offset: ["start start", "end start"] });
  const scrimOpacity = useTransform(scrollYProgress, (p) => Math.min(1, Math.max(0, p)) * 0.9);

  const goToHero = useCallback(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    travelledRef.current = true;
    signalHeroReveal();
    const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-height"), 10) || 88;
    const target = hero.getBoundingClientRect().top + window.scrollY - navHeight - 8;
    cancelTravelRef.current?.();
    cancelTravelRef.current = travelTo(Math.max(0, target), reduced ? 0 : TRAVEL_MS);
  }, [reduced]);

  // Start playback, unless the visitor has opted out of motion or is saving data.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const connection = (navigator as { connection?: { saveData?: boolean } }).connection;
    if (reduced || connection?.saveData) {
      video.pause(); // the poster frame stands in
      return;
    }
    video.muted = true; // belt and braces: React may not reflect this into the markup
    attemptPlay(video);
  }, [reduced]);

  // Travel when the film finishes, not on a wall clock, so the two stay in step even
  // if playback starts late. Never fires if the film isn't running at all.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduced) return;

    const onEnded = () => {
      if (travelledRef.current) return;
      goToHero();
    };
    // Belt and braces: `ended` is reliable, but a stall right at the tail would
    // otherwise strand the visitor on the intro with no travel at all.
    const onTime = () => {
      if (travelledRef.current || !video.duration) return;
      if (video.currentTime >= video.duration - 0.15) goToHero();
    };
    const stop = () => {
      travelledRef.current = true; // visitor took over
      signalHeroReveal(); // they're on their way down; let the hero come in
      cancelTravelRef.current?.();
      cancelTravelRef.current = null;
    };

    const inputs = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    // A deep link or a restored scroll position means they're not here for the intro.
    if (window.location.hash || window.scrollY > 4) travelledRef.current = true;

    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", onTime);
    inputs.forEach((type) => window.addEventListener(type, stop, { passive: true }));
    return () => {
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", onTime);
      inputs.forEach((type) => window.removeEventListener(type, stop));
      cancelTravelRef.current?.();
      cancelTravelRef.current = null;
    };
  }, [reduced, goToHero]);

  // Don't decode frames once the film is off screen.
  useEffect(() => {
    const video = videoRef.current;
    const section = introRef.current;
    if (!video || !section || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => {
      // Deliberately not looping: once the film ends it holds its closing to-camera
      // frame, which becomes the still backdrop behind the hero. Replaying it on
      // every scroll back to the top would undo that.
      if (entry.isIntersecting) {
        if (!reduced && !video.ended) attemptPlay(video);
      } else {
        video.pause();
      }
    }, { threshold: 0.01 });
    io.observe(section);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <>
      {/* The backdrop box spans exactly the intro + hero and clips its contents; the
          media inside is what pins to the viewport. Previously the pinned layer was
          the box itself, held in place with a negative margin — that collapses its
          margin box, so the release constraint never binds and it stayed stuck to the
          viewport over the sections below. */}
      <div className="cinema-backdrop" aria-hidden="true">
        <div className="cinema-media">
          <video
            ref={videoRef}
            className="cinema-video"
            poster="/media/intro-poster.jpg"
            muted
            playsInline
            preload="auto"
            tabIndex={-1}
          >
            <source src="/media/intro.webm" type="video/webm" />
            <source src="/media/intro.mp4" type="video/mp4" />
          </video>
          <motion.div className="cinema-scrim" style={{ opacity: scrimOpacity }} />
        </div>
      </div>

      <section ref={introRef} className="intro-section" aria-label="Introduction">
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
    </>
  );
}
