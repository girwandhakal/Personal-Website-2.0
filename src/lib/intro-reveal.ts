"use client";

import { useEffect, useState } from "react";

/**
 * The opening film owns the first screen on its own. Everything that would
 * otherwise sit on top of it — the hero, the chat launcher — waits for this
 * signal, which the intro broadcasts when the film ends or when the visitor takes
 * over by scrolling.
 */
export const INTRO_REVEAL_EVENT = "intro:reveal";

export function signalIntroReveal() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(INTRO_REVEAL_EVENT));
}

/**
 * False while the film has the screen to itself, true once it has handed off.
 *
 * Starts false on the server and on the first client render so hydration matches,
 * then resolves immediately for anyone who never saw the intro in the first place:
 * an already-applied deep link, a restored scroll position, or a page with no intro
 * on it. Scrolling counts too, so this can't get stuck if the film never reaches
 * its end. The hash alone is not enough because it can be stale after a reload.
 */
/**
 * Whether the opening film currently owns the screen.
 *
 * Unlike the reveal above this is reversible — scrolling back up to the film hides
 * whatever sits on top of it again. Coverage is measured against the viewport
 * rather than using the element's own intersection ratio: the intro is exactly a
 * screen tall, so its ratio barely moves until it has almost gone.
 */
export function useIntroOnScreen() {
  // Assume the film has the screen until an observation says otherwise, so nothing
  // flashes over it on the first paint.
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const section = document.querySelector(".intro-section");
    if (!section || typeof IntersectionObserver === "undefined") {
      setOnScreen(false);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        const covered = entry.intersectionRect.height / Math.max(1, window.innerHeight);
        setOnScreen(covered > 0.5);
      },
      { threshold: [0, 0.15, 0.3, 0.45, 0.5, 0.55, 0.7, 0.85, 1] }
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  return onScreen;
}

export function useIntroRevealed() {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Already past the intro, or there isn't one here.
    if (window.scrollY > 4 || !document.querySelector(".cinema")) {
      setRevealed(true);
      return;
    }

    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      setRevealed(true);
      cleanup();
    };
    const onScroll = () => { if (window.scrollY > 40) reveal(); };
    const cleanup = () => {
      window.removeEventListener(INTRO_REVEAL_EVENT, reveal);
      window.removeEventListener("scroll", onScroll);
    };

    window.addEventListener(INTRO_REVEAL_EVENT, reveal);
    window.addEventListener("scroll", onScroll, { passive: true });
    return cleanup;
  }, []);

  return revealed;
}
