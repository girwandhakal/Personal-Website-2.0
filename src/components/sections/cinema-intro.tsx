"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";
import { signalIntroReveal } from "@/lib/intro-reveal";

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
 * - The film carries its own audio, but browsers refuse to autoplay sound without a
 *   prior gesture. So it asks for sound first and falls back to muted the moment
 *   that's refused — the film always plays either way — and offers a toggle, since
 *   the tap on it is itself the gesture that makes sound allowed.
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
  const [soundOn, setSoundOn] = useState(false);
  // Only offer the control while the film is actually running with audio to control.
  const [filmRunning, setFilmRunning] = useState(false);
  // The icon rests dim and comes to full strength on hover — but touch has no
  // hover, so a tap drives the same "prominent" state directly, then lets it fade
  // back out on its own after a couple of seconds rather than staying lit forever.
  const [justTapped, setJustTapped] = useState(false);
  const tapFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scrim only ramps up as the hero slides over the film — zero across the intro.
  const { scrollYProgress } = useScroll({ target: introRef, offset: ["start start", "end start"] });
  const scrimOpacity = useTransform(scrollYProgress, (p) => Math.min(1, Math.max(0, p)) * 0.9);

  const goToHero = useCallback(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    travelledRef.current = true;
    signalIntroReveal();
    const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-height"), 10) || 88;
    const target = hero.getBoundingClientRect().top + window.scrollY - navHeight - 8;
    cancelTravelRef.current?.();
    cancelTravelRef.current = travelTo(Math.max(0, target), reduced ? 0 : TRAVEL_MS);
  }, [reduced]);

  // Start playback, unless the visitor has opted out of motion or is saving data.
  //
  // Sound is asked for first: a visitor the browser already trusts (enough media
  // engagement, or a prior gesture this session) gets the film as it was cut. Where
  // that's refused — the common case on a cold visit — it falls back to muted so the
  // film still plays, and the toggle becomes the way in.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const connection = (navigator as { connection?: { saveData?: boolean } }).connection;
    if (reduced || connection?.saveData) {
      video.pause(); // the poster frame stands in
      return;
    }

    let cancelled = false;
    video.muted = false;
    const withSound = video.play() as Promise<void> | undefined;

    if (withSound && typeof withSound.then === "function") {
      withSound.then(() => {
        if (cancelled) return;
        setSoundOn(true);
        setFilmRunning(true);
      }).catch(() => {
        if (cancelled) return;
        video.muted = true; // React may not reflect this into markup, so set it here
        setSoundOn(false);
        setFilmRunning(true);
        attemptPlay(video);
      });
    } else {
      // No promise to inspect (older browsers): assume only muted autoplay is allowed.
      video.muted = true;
      setSoundOn(false);
      setFilmRunning(true);
      attemptPlay(video);
    }

    return () => { cancelled = true; };
  }, [reduced]);

  const toggleSound = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setSoundOn(!video.muted);
    if (video.paused && !video.ended) attemptPlay(video);

    setJustTapped(true);
    if (tapFadeRef.current) clearTimeout(tapFadeRef.current);
    tapFadeRef.current = setTimeout(() => setJustTapped(false), 1500);
  }, []);

  useEffect(() => () => { if (tapFadeRef.current) clearTimeout(tapFadeRef.current); }, []);

  // Travel when the film finishes, not on a wall clock, so the two stay in step even
  // if playback starts late. Never fires if the film isn't running at all.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduced) return;

    const onEnded = () => {
      setFilmRunning(false); // nothing left to hear; retire the sound control
      if (travelledRef.current) return;
      goToHero();
    };
    // Belt and braces: `ended` is reliable, but a stall right at the tail would
    // otherwise strand the visitor on the intro with no travel at all.
    const onTime = () => {
      if (travelledRef.current || !video.duration) return;
      if (video.currentTime >= video.duration - 0.15) goToHero();
    };
    const stop = (event: Event) => {
      const target = event.target;
      // Reaching for the film's own sound control isn't taking over the page — it
      // shouldn't cancel the pending travel or bring the rest of the page in early.
      if (target instanceof Element && target.closest(".intro-sound")) return;
      travelledRef.current = true; // visitor took over
      signalIntroReveal(); // they're on their way down; let the rest come in
      cancelTravelRef.current?.();
      cancelTravelRef.current = null;
    };

    const inputs = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    // Only the actual scroll position proves the visitor is already past the intro.
    // A stale hash can remain in the URL after reloading from an in-page link while
    // the browser still starts at the top. Treating the hash alone as proof used to
    // suppress the handoff at the end of an otherwise normally playing film.
    if (window.scrollY > 4) travelledRef.current = true;

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
            <source
              src="/media/intro-mobile.mp4"
              type="video/mp4"
              media="(max-width: 767px)"
            />
            <source
              src="/media/intro.webm"
              type="video/webm"
              media="(min-width: 768px)"
            />
            <source src="/media/intro.mp4" type="video/mp4" />
          </video>
          <motion.div className="cinema-scrim" style={{ opacity: scrimOpacity }} />
        </div>
      </div>

      <section ref={introRef} className="intro-section" aria-label="Introduction">
        {/* The mount fade-in lives on this wrapper, not the button itself: Framer
            leaves an inline opacity behind once an `animate` finishes, which would
            outrank the button's own CSS opacity (dim at rest, full on hover/active)
            forever afterward — inline style beats any stylesheet rule regardless of
            specificity. Splitting them onto separate elements avoids that outright. */}
        {filmRunning && <motion.div
          className="intro-sound-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <button
            type="button"
            className="intro-sound"
            data-active={justTapped}
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Mute the intro film" : "Play the intro film's sound"}
          >
            {soundOn ? <Volume2 size={17} aria-hidden="true" /> : <VolumeX size={17} aria-hidden="true" />}
          </button>
        </motion.div>}
      </section>
    </>
  );
}
