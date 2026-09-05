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
 * a deep link, a restored scroll position, or a page with no intro on it. Scrolling
 * counts too, so this can't get stuck if the film never reaches its end.
 */
export function useIntroRevealed() {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Already past the intro, or there isn't one here.
    if (window.location.hash || window.scrollY > 4 || !document.querySelector(".cinema")) {
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
