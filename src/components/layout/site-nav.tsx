"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { navItems } from "@/lib/animation";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Tracks which section is currently in view so the nav can show position.
 * Picks the last section whose top has passed just below the fixed nav, which
 * behaves predictably with the tall sticky Resume section.
 */
function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string>("");
  // While a click-initiated smooth scroll is in flight the spy must not run:
  // it would walk the highlight through every section being passed over and
  // could settle somewhere other than the item the user actually pressed.
  const lockedUntil = useRef(0);

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const update = () => {
      if (Date.now() < lockedUntil.current) return;

      // Tie the trigger line to the real nav height rather than a magic number,
      // so it keeps working if the nav is resized.
      const navHeight =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--nav-height")
        ) || 64;
      const offset = navHeight + 76;

      let current = sections[0].id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= offset) {
          current = section.id;
        }
      }
      // Near the bottom of the page the last section may never reach the
      // offset, so pin it explicitly.
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
        current = sections[sections.length - 1].id;
      }
      setActive(current);
    };

    const onScrollEnd = () => {
      lockedUntil.current = 0;
      update();
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("scrollend", onScrollEnd);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("scrollend", onScrollEnd);
    };
  }, [ids]);

  /** Highlight a section immediately on click, ahead of the smooth scroll. */
  const selectSection = useCallback((id: string) => {
    setActive(id);
    // Fallback release for browsers without `scrollend`.
    lockedUntil.current = Date.now() + 1500;
  }, []);

  return [active, selectSection] as const;
}

const sectionIds = navItems.map((item) => item.href.replace("#", ""));

/**
 * Scrolls to a section ourselves rather than letting the clicked <a>'s native
 * fragment-navigation do it.
 *
 * That native path turned out to be the real bug: on the mobile menu, the
 * click handler synchronously removes `position: fixed` from <body> to
 * release the scroll lock, and several mobile browsers cancel a link's
 * default action outright when the tapped element's layout shifts mid-click
 * (an anti-tapjacking heuristic — most aggressive on iOS Safari). Chrome
 * doesn't apply it, which is why this only ever "worked" there. Calling
 * scrollIntoView explicitly removes the browser's default action from the
 * picture entirely, so there's nothing left for that heuristic to cancel.
 */
function scrollToSection(id: string, href: string) {
  const el = document.getElementById(id);
  if (!el) return;
  // No explicit `behavior` here — it inherits html's `scroll-behavior`
  // (smooth, or auto under prefers-reduced-motion), matching what native
  // anchor navigation already did.
  el.scrollIntoView({ block: "start" });
  // Keep the address bar and back-button history in sync with the section,
  // same as native fragment navigation would — pushState doesn't itself
  // scroll, so it can't fight the scrollIntoView call above.
  if (typeof window !== "undefined" && "pushState" in window.history) {
    window.history.pushState(null, "", href);
  }
}

export function SiteNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, selectSection] = useActiveSection(sectionIds);
  // Which item the sliding pill sits behind: whatever's hovered, falling
  // back to whatever's active, so the pill never just vanishes.
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  // Lock body scroll while the mobile menu is open.
  //
  // `overflow: hidden` on <body> alone is not reliable outside Chrome: Safari
  // and Firefox on mobile can still scroll/rubber-band the page behind a
  // `position: fixed` overlay via touch, since <html> — not <body> — is the
  // actual scrolling box here (globals.css sets no overflow on <html>).
  // Pinning <body> with `position: fixed` removes it from the scrollable
  // flow entirely, which is the standard technique that holds across all
  // three engines.
  //
  // Unlocking is imperative (called from the click handlers below), not tied
  // to this effect's cleanup — a link tap needs the layout corrected before
  // `scrollToSection` reads the target's position, and doing that inside a
  // React-scheduled effect would leave the ordering up to each browser.
  const lockedScrollY = useRef<number | null>(null);

  const unlockScroll = useCallback((restore: boolean) => {
    if (lockedScrollY.current === null) return;
    const y = lockedScrollY.current;
    lockedScrollY.current = null;
    const { style } = document.body;
    style.position = "";
    style.top = "";
    style.left = "";
    style.right = "";
    style.width = "";
    if (restore) {
      window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
    }
  }, []);

  const closeMenu = useCallback(
    (restoreScroll: boolean) => {
      unlockScroll(restoreScroll);
      setIsOpen(false);
    },
    [unlockScroll]
  );

  useEffect(() => {
    if (!isOpen) return;

    lockedScrollY.current = window.scrollY;
    const { style } = document.body;
    style.position = "fixed";
    style.top = `-${lockedScrollY.current}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";

    // Safety net: if the component unmounts (or isOpen is flipped by some
    // path other than closeMenu) while still locked, don't leave <body>
    // pinned.
    return () => unlockScroll(false);
  }, [isOpen, unlockScroll]);

  // Close menu on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeMenu]);

  return (
    <>
      {/* Desktop Navigation Shell */}
      <header className="site-nav-shell !hidden md:!flex items-center justify-center">
        <a className="brand-lockup z-50 relative" href="#top" aria-label="Girwan Dhakal home" onClick={() => setIsOpen(false)}>
          <span className="brand-mark">GD</span>
        </a>

        <nav
          className="site-nav"
          aria-label="Primary navigation"
          onMouseLeave={() => setHoveredHref(null)}
        >
          {navItems.map((item) => {
            const isCurrent = activeSection === item.href.replace("#", "");
            // Nothing hovered yet -> the pill rests on the active section.
            const isHighlighted = hoveredHref ? hoveredHref === item.href : isCurrent;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`nav-item-link${isHighlighted ? " nav-item-link--on" : ""}`}
                aria-current={isCurrent ? "true" : undefined}
                onMouseEnter={() => setHoveredHref(item.href)}
                onFocus={() => setHoveredHref(item.href)}
                onBlur={() => setHoveredHref(null)}
                onClick={(e) => {
                  if (item.href.endsWith(".docx")) return; // real download link, not a section
                  e.preventDefault();
                  const id = item.href.replace("#", "");
                  selectSection(id);
                  scrollToSection(id, item.href);
                }}
                target={item.href.endsWith(".docx") ? "_blank" : undefined}
                rel={item.href.endsWith(".docx") ? "noopener noreferrer" : undefined}
              >
                {isHighlighted && (
                  <motion.span
                    layoutId="nav-pill"
                    className="nav-pill"
                    transition={{ type: "spring", stiffness: 500, damping: 34 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </a>
            );
          })}
        </nav>
      </header>

      {/* Mobile Floating Hamburger Trigger */}
      <button
        className={`md:hidden fixed z-50 grid place-items-center w-12 h-12 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange)] rounded-full border ${
          isOpen
            ? "bg-[var(--surface)]/90 border-ink/15 text-[var(--accent)] opacity-100"
            : "bg-[var(--surface)]/88 border-ink/10 text-ink/70 hover:text-ink hover:bg-[var(--surface)]/95"
        }`}
        style={{
          top: "calc(1rem + env(safe-area-inset-top, 0px))",
          right: "calc(1rem + env(safe-area-inset-right, 0px))",
          backdropFilter: "blur(40px) saturate(160%)",
          WebkitBackdropFilter: "blur(40px) saturate(160%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 0 0 1px rgba(255,255,255,0.35), 0 8px 24px -8px rgba(24,48,89,0.28), 0 2px 6px rgba(24,48,89,0.08)"
        }}
        onClick={() => (isOpen ? closeMenu(true) : setIsOpen(true))}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isOpen ? "close" : "open"}
            className="grid place-items-center"
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.span>
        </AnimatePresence>
      </button>

      {/* Mobile Off-Canvas Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-[var(--surface)]/97 backdrop-blur-xl flex flex-col md:hidden overflow-y-auto"
            style={{
              paddingTop: "calc(6rem + env(safe-area-inset-top, 0px))",
              paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
              paddingLeft: "1.5rem",
              paddingRight: "1.5rem"
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <nav className="flex flex-col text-left">
              {navItems.map((item, i) => {
                const isActive = activeSection === item.href.replace("#", "");
                return (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 + 0.08 }}
                    aria-current={isActive ? "true" : undefined}
                    className={`flex items-center justify-between text-3xl font-extrabold tracking-tight py-5 border-b border-ink/10 transition-colors ${
                      isActive ? "text-[var(--accent)]" : "text-ink hover:text-[var(--accent)]"
                    }`}
                    onClick={(e) => {
                      if (item.href.endsWith(".docx")) return; // real download link, not a section
                      e.preventDefault();
                      const id = item.href.replace("#", "");
                      selectSection(id);
                      // Release the scroll lock without restoring the old
                      // position, then drive the scroll ourselves — see
                      // scrollToSection for why we don't rely on the <a>'s
                      // own default action here.
                      closeMenu(false);
                      scrollToSection(id, item.href);
                    }}
                    target={item.href.endsWith(".docx") ? "_blank" : undefined}
                    rel={item.href.endsWith(".docx") ? "noopener noreferrer" : undefined}
                  >
                    {item.label}
                    {isActive && (
                      <span
                        className="w-2 h-2 rounded-full bg-[var(--accent)]"
                        aria-hidden="true"
                      />
                    )}
                  </motion.a>
                );
              })}
            </nav>

            {/* Click outside / empty space dismiss layer */}
            <div className="flex-1 min-h-16" onClick={() => closeMenu(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
