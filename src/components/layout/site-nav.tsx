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

export function SiteNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, selectSection] = useActiveSection(sectionIds);

  // Lock body scroll while the mobile menu is open.
  //
  // `overflow: hidden` on <body> alone is not reliable outside Chrome: Safari
  // and Firefox on mobile can still scroll/rubber-band the page behind a
  // `position: fixed` overlay via touch, since <html> — not <body> — is the
  // actual scrolling box here (globals.css sets no overflow on <html>). On
  // iOS Safari specifically that drag reflows the page under the user's
  // finger mid-tap, so links in the open menu can miss. Pinning <body> with
  // `position: fixed` removes it from the scrollable flow entirely, which is
  // the standard technique that holds across all three engines.
  //
  // Unlocking happens imperatively from the click handlers below rather than
  // from this effect's cleanup, and deliberately *before* `setIsOpen(false)`.
  // A nav link's native hash-jump fires synchronously right after this click
  // handler returns; if the unlock instead ran later, in an effect cleanup
  // triggered by the state update, its ordering against that native jump
  // would be up to each browser engine to decide — which is the exact kind
  // of Chrome-only-timing bug this fix exists to remove.
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

        <nav className="site-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="nav-item-link"
              aria-current={activeSection === item.href.replace("#", "") ? "true" : undefined}
              onClick={() => selectSection(item.href.replace("#", ""))}
              target={item.href.endsWith(".docx") ? "_blank" : undefined}
              rel={item.href.endsWith(".docx") ? "noopener noreferrer" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      {/* Mobile Floating Hamburger Trigger */}
      <button
        className={`md:hidden fixed z-50 grid place-items-center w-12 h-12 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange)] shadow-xl rounded-full border-2 backdrop-blur-md ${
          isOpen
            ? "bg-[var(--surface)] border-[var(--ink)] text-[var(--accent)] opacity-100"
            : "bg-[var(--surface)]/80 border-ink/25 text-ink/70 hover:text-ink hover:border-ink/60"
        }`}
        style={{
          top: "calc(1rem + env(safe-area-inset-top, 0px))",
          right: "calc(1rem + env(safe-area-inset-right, 0px))"
        }}
        onClick={() => (isOpen ? closeMenu(true) : setIsOpen(true))}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
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
                    onClick={() => {
                      selectSection(item.href.replace("#", ""));
                      // Don't restore scroll — let the browser's hash
                      // navigation to the target section win instead.
                      closeMenu(false);
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
