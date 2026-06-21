"use client";

import { useState, useEffect, ReactNode } from "react";

export function IntroPreloader({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"initial" | "focus" | "reveal" | "done">("initial");

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    // Check if it's the first time in this session
    const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");

    if (prefersReducedMotion || hasSeenIntro) {
      setPhase("done");
      return;
    }

    // Lock body scroll during intro
    document.body.style.overflow = "hidden";

    // Timeline
    // 1. Initial state (set immediately)
    // 2. Focus on monogram/name (after short delay)
    const focusTimer = setTimeout(() => setPhase("focus"), 150);
    
    // 3. Reveal background (after reading focus element)
    const revealTimer = setTimeout(() => setPhase("reveal"), 2200);
    
    // 4. Done (cleanup)
    const doneTimer = setTimeout(() => {
      setPhase("done");
      document.body.style.overflow = "";
      sessionStorage.setItem("hasSeenIntro", "true");
    }, 3800); // 1600ms after reveal to ensure animations finish cleanly

    return () => {
      clearTimeout(focusTimer);
      clearTimeout(revealTimer);
      clearTimeout(doneTimer);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      {/* Intro Overlay */}
      {phase !== "done" && (
        <div 
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-[var(--black)]/60 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${phase === "reveal" ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"}
          `}
        >
          {/* Focal Element */}
          <div 
            className={`flex flex-col items-center justify-center transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]
              ${
                phase === "initial" 
                  ? "opacity-0 scale-95 translate-y-4" 
                  : phase === "reveal" 
                  ? "opacity-0 scale-105 -translate-y-4" 
                  : "opacity-100 scale-100 translate-y-0"
              }
            `}
          >
            <div className="w-16 h-16 md:w-20 md:h-20 border-2 border-[var(--white)] bg-[var(--orange)] text-[var(--black)] flex items-center justify-center font-black text-2xl md:text-3xl mb-5 shadow-2xl shadow-[var(--orange)]/10">
              GD
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[var(--white)] tracking-[0.2em] uppercase m-0 drop-shadow-md">
              Girwan Dhakal
            </h1>
          </div>
        </div>
      )}

      {/* Main Content Wrapper */}
      <div 
        inert={phase !== "done" ? true : undefined}
        className={
          phase === "done" 
            ? "" 
            : `transition-all duration-[1400ms] ease-[cubic-bezier(0.25,1,0.5,1)] origin-top
              ${
                phase === "initial" || phase === "focus" 
                  ? "blur-[12px] scale-[0.98] opacity-40 select-none pointer-events-none brightness-75" 
                  : "blur-0 scale-100 opacity-100 select-none pointer-events-none brightness-100"
              }`
        }
      >
        {children}
      </div>
    </>
  );
}
