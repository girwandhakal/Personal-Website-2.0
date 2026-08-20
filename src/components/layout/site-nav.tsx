"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const update = () => {
      const offset = 140;
      let current = "";
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

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ids]);

  return active;
}

const sectionIds = navItems.map((item) => item.href.replace("#", ""));

export function SiteNav() {
  const [isOpen, setIsOpen] = useState(false);
  const activeSection = useActiveSection(sectionIds);

  // Close menu on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
            ? "bg-[var(--black)] border-[var(--white)] text-[var(--orange)] opacity-100"
            : "bg-[var(--black)]/70 border-white/25 text-white/70 hover:text-white hover:border-white/50"
        }`}
        style={{
          top: "calc(1rem + env(safe-area-inset-top, 0px))",
          right: "calc(1rem + env(safe-area-inset-right, 0px))"
        }}
        onClick={() => setIsOpen(!isOpen)}
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
            className="fixed inset-0 z-40 bg-[var(--black)]/97 backdrop-blur-xl flex flex-col md:hidden overflow-y-auto"
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
                    className={`flex items-center justify-between text-3xl font-extrabold tracking-tight py-5 border-b border-white/10 transition-colors ${
                      isActive ? "text-[var(--orange)]" : "text-white hover:text-[var(--orange)]"
                    }`}
                    onClick={() => setIsOpen(false)}
                    target={item.href.endsWith(".docx") ? "_blank" : undefined}
                    rel={item.href.endsWith(".docx") ? "noopener noreferrer" : undefined}
                  >
                    {item.label}
                    {isActive && (
                      <span
                        className="w-2 h-2 rounded-full bg-[var(--orange)]"
                        aria-hidden="true"
                      />
                    )}
                  </motion.a>
                );
              })}
            </nav>

            {/* Click outside / empty space dismiss layer */}
            <div className="flex-1 min-h-16" onClick={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
