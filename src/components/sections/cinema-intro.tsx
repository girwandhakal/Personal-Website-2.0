"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * The opening film now plays as a permanent, looping backdrop directly behind the
 * hero — the hero's name and copy sit on top of it from the first paint, the same
 * way every section below has its own background. There's no hand-off moment to
 * choreograph any more: the film just runs, muted, for as long as it's in view.
 *
 * Playback notes:
 * - `muted` + `playsinline` are what make autoplay legal on mobile Safari. React
 *   doesn't reliably reflect `muted` into the server-rendered markup, so it's also
 *   set imperatively before play().
 * - Playback starts from an effect rather than the `autoplay` attribute. That keeps
 *   the server and client markup identical (branching markup on a client-only
 *   preference is a hydration mismatch), and it lets reduced-motion and Save-Data
 *   opt out cleanly — both simply leave the poster frame showing.
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

  // Start playback, unless the visitor has opted out of motion or is saving data.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const connection = (navigator as { connection?: { saveData?: boolean } }).connection;
    if (reduced || connection?.saveData) {
      video.pause(); // the poster frame stands in
      return;
    }
    video.muted = true; // React may not reliably reflect this into markup, so set it here too
    attemptPlay(video);
  }, [reduced]);

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
    </div>
  );
}
