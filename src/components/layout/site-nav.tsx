"use client";

import { useState, useEffect } from "react";
import { navItems } from "@/lib/animation";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export function SiteNav() {
  const [isOpen, setIsOpen] = useState(false);

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
        className={`md:hidden fixed top-6 right-6 z-50 p-2.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange)] shadow-xl rounded-full border-2 backdrop-blur-md ${
          isOpen 
            ? "bg-[var(--black)] border-[var(--white)] text-[var(--orange)] opacity-100" 
            : "bg-[var(--black)]/60 border-white/20 text-white/50 hover:text-white hover:border-white/50 opacity-80"
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X size={26} /> : <Menu size={26} />}
      </button>

      {/* Mobile Off-Canvas Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-[var(--black)]/95 backdrop-blur-xl pt-32 px-6 flex flex-col md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <nav className="flex flex-col gap-8 text-left mt-8">
              {navItems.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 + 0.1 }}
                  className="text-4xl font-extrabold tracking-tight text-white hover:text-[var(--orange)] transition-colors py-2 border-b border-white/10"
                  onClick={() => setIsOpen(false)}
                  target={item.href.endsWith(".docx") ? "_blank" : undefined}
                  rel={item.href.endsWith(".docx") ? "noopener noreferrer" : undefined}
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>
            
            {/* Click outside / empty space dismiss layer */}
            <div className="flex-1 mt-8" onClick={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
