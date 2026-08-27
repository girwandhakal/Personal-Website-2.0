"use client";

import { useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { motion, useScroll, useReducedMotion, useMotionValueEvent, AnimatePresence } from "motion/react";
import { profile } from "@/content/profile";

function ExperienceList() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-16">
      {profile.experience.map((exp, i) => (
        <div key={i} className="flex flex-col">
          <h4 className="text-2xl md:text-4xl font-medium text-ink mb-2 leading-tight">{exp.role}</h4>
          <div className="text-lg md:text-2xl text-blue font-medium mb-4">{exp.company}</div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:text-base text-ink/60 mb-5">
            <span>{exp.period}</span>
            <span className="flex items-center gap-2"><MapPin size={16} aria-hidden="true" /> {exp.location}</span>
          </div>
          {exp.description && (
            <p className="text-left text-ink/75 leading-relaxed text-base md:text-xl w-full">
              {exp.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function Resume() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const experiences = profile.experience;

  // Track scroll position to update the mutually exclusive active slide
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    let newIndex = Math.floor(latest * experiences.length);
    if (newIndex >= experiences.length) newIndex = experiences.length - 1;
    if (newIndex < 0) newIndex = 0;

    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  });

  if (prefersReducedMotion) {
    return (
      <>
        <section id="resume" className="w-full bg-[var(--surface)] border-t border-ink/15">
          <div className="section-inner">
            <h2 className="font-semibold text-ink tracking-tight mb-14 text-center mx-auto">
              Work Experience
            </h2>
            <ExperienceList />
          </div>
        </section>
        <Education />
      </>
    );
  }

  return (
    <>
      <section
        id="resume"
        ref={containerRef}
        className="resume-track relative w-full bg-[var(--surface)] border-t border-ink/15"
        // Only the desktop sticky experience consumes this height; mobile falls
        // back to `height: auto` so the section scrolls at normal speed.
        style={{ "--track-height": `${experiences.length * 110}vh` } as React.CSSProperties}
      >
        {/* Mobile: a plain stacked list. The sticky version nested an
            overflow-y-auto pane inside a 100svh sticky frame, which traps
            touch scrolling and stretched 3 roles across ~4.5 screens. */}
        <div className="md:hidden section-inner">
          <h2 className="font-semibold text-ink tracking-tight mb-12 text-center mx-auto">
            Work Experience
          </h2>
          <ExperienceList />
        </div>

        {/* Desktop: scroll-driven sticky presentation. */}
        <div className="hidden md:flex sticky top-0 h-[100svh] w-full flex-col items-center py-6 pt-32 pb-8 overflow-hidden">
          <h2 className="font-semibold text-ink tracking-tight z-10 mb-8 text-center px-4 shrink-0 mx-auto">
            Work Experience
          </h2>

          {/* Scroll Progress Indicator with Step Markers */}
          <div className="absolute left-12 top-1/2 -translate-y-1/2 flex flex-col items-center justify-between z-20 py-2 h-[50%]">
            <div className="absolute top-0 bottom-0 w-[2px] bg-ink/10 -z-10" />
            <motion.div
              className="absolute top-0 bottom-0 w-[2px] bg-[var(--orange)] -z-10 origin-top"
              style={{ scaleY: scrollYProgress }}
            />

            {experiences.map((_, i) => {
              const isActive = i === activeIndex;
              const isCompleted = i < activeIndex;
              return (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 z-10 ${
                    isCompleted ? "bg-[var(--orange)]"
                    : isActive ? "bg-[var(--orange)] scale-125"
                    : "bg-ink/25"
                  }`}
                />
              );
            })}
          </div>

          <div className="relative flex-1 w-full max-w-4xl px-12 z-10 flex flex-col justify-center mx-auto pt-2 pb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col justify-start"
              >
                <h4 className="text-4xl font-medium text-ink mb-2 leading-tight">{experiences[activeIndex].role}</h4>
                <div className="text-xl text-blue font-medium mb-4">{experiences[activeIndex].company}</div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink/60 mb-6">
                  <span>{experiences[activeIndex].period}</span>
                  <span className="flex items-center gap-2"><MapPin size={16} aria-hidden="true" /> {experiences[activeIndex].location}</span>
                </div>
                {experiences[activeIndex].description && (
                  <p className="text-left text-ink/75 leading-relaxed text-xl w-full">
                    {experiences[activeIndex].description}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <Education />
    </>
  );
}

function Education() {
  return (
    <section id="education" className="w-full bg-[var(--surface)] border-t border-ink/15">
      <div className="section-inner text-center">
        <h2 className="font-semibold text-ink tracking-tight mb-14 md:mb-20 mx-auto">
          Education
        </h2>
        <div className="flex flex-col md:flex-row justify-center text-left divide-y md:divide-y-0 md:divide-x divide-ink/20">
          {profile.education.map((edu, i) => (
            <div key={i} className="flex-1 py-10 md:py-0 md:px-12 first:pt-0 last:pb-0 md:first:pl-0 md:last:pr-0">
              <h4 className="text-2xl md:text-3xl font-medium text-ink mb-3 leading-tight">{edu.degree}</h4>
              <div className="text-lg md:text-xl text-blue font-medium mb-5">{edu.institution}</div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink/60">
                <span>{edu.period}</span>
                <span className="flex items-center gap-1.5"><MapPin size={16} aria-hidden="true" /> {edu.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
