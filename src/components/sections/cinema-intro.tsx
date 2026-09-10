"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * The opening film plays as a permanent, looping backdrop directly behind the
 * hero — the hero's name and copy sit on top of it from the first paint, the same
 * way every section below has its own background. There's no hand-off moment to
 * choreograph any more: the film just runs, for as long as it's in view.
 *
 * Playback notes:
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

/**
 * `play()` only returns a promise in modern browsers — older ones (and jsdom under
 * test) return undefined, where calling `.catch` on the result would throw.
 */
function attemptPlay(video: HTMLVideoElement) {
  const played = video.play() as Promise<void> | undefined;
  if (played && typeof played.catch === "function") played.catch(() => { /* blocked by policy */ });
}

export function CinemaIntro() {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  // Only offer the control once the film is actually running with audio to control.
  const [filmRunning, setFilmRunning] = useState(false);
  // The icon rests dim and comes to full strength on hover — but touch has no
  // hover, so a tap drives the same "prominent" state directly, then lets it fade
  // back out on its own after a couple of seconds rather than staying lit forever.
  const [justTapped, setJustTapped] = useState(false);
  const tapFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        video.muted = true; // React may not reliably reflect this into markup, so set it here too
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
    if (video.paused) attemptPlay(video);

    setJustTapped(true);
    if (tapFadeRef.current) clearTimeout(tapFadeRef.current);
    tapFadeRef.current = setTimeout(() => setJustTapped(false), 1500);
  }, []);

  useEffect(() => () => { if (tapFadeRef.current) clearTimeout(tapFadeRef.current); }, []);

  // Don't decode frames once the film is off screen; resume the loop from wherever
  // it left off when it comes back.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!reduced) attemptPlay(video);
      } else {
        video.pause();
      }
    }, { threshold: 0.01 });
    io.observe(video);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div className="cinema-backdrop" aria-hidden="true">
      <video
        ref={videoRef}
        className="cinema-video"
        poster="/media/intro-poster.jpg"
        src="/media/intro.mp4"
        muted
        loop
        playsInline
        preload="auto"
        tabIndex={-1}
      />
      <div className="cinema-scrim" />
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
          aria-label={soundOn ? "Mute the background film" : "Play the background film's sound"}
        >
          {soundOn ? <Volume2 size={17} aria-hidden="true" /> : <VolumeX size={17} aria-hidden="true" />}
        </button>
      </motion.div>}
    </div>
  );
}
