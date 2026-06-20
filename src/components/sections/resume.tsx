"use client";

import { useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { motion, useScroll, useReducedMotion, useMotionValueEvent, AnimatePresence } from "motion/react";
import { profile } from "@/content/profile";

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
    // Determine which segment of the total scroll height we are currently in
    let newIndex = Math.floor(latest * experiences.length);
    if (newIndex >= experiences.length) newIndex = experiences.length - 1;
    if (newIndex < 0) newIndex = 0;
    
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  });

  return (
    <>
      <section 
        id="resume" 
        ref={containerRef}
        className="relative w-full bg-[var(--black)]"
        // Increased height to 150vh per item to slow down progression logic
        style={prefersReducedMotion ? {} : { height: `${experiences.length * 150}vh` }}
      >
        {prefersReducedMotion ? (
          <div className="w-full py-32 px-6 border-t border-[var(--grey)]/20">
            <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-20 text-center">
              Work Experience
            </h2>
            <div className="max-w-4xl mx-auto flex flex-col gap-24">
              {experiences.map((exp, i) => (
                <div key={i} className="flex flex-col">
                  <h4 className="text-3xl md:text-5xl font-medium text-white mb-4 leading-tight">{exp.role}</h4>
                  <div className="text-xl md:text-2xl text-[var(--orange)] font-medium mb-8">{exp.company}</div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm md:text-base text-white/50 mb-10">
                    <span>{exp.period}</span>
                    <span className="flex items-center gap-2"><MapPin size={18}/> {exp.location}</span>
                  </div>
                  {exp.bullets && (
                    <ul className="text-left space-y-4 text-white/70 leading-relaxed text-base md:text-lg w-full">
                      {exp.bullets.map((bullet: string, idx: number) => (
                        <li key={idx} className="flex gap-4"><span className="text-[var(--orange)] mt-2 text-xs">■</span><span>{bullet}</span></li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="sticky top-0 h-screen w-full flex flex-col items-center overflow-hidden py-24 border-t border-[var(--grey)]/20">
            <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight z-10 mb-12 text-center px-4">
              Work Experience
            </h2>

            {/* Scroll Progress Indicator with Step Markers */}
            <div className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 flex flex-col items-center justify-between z-20 py-2" style={{ height: "50vh" }}>
               {/* Background Line */}
               <div className="absolute top-0 bottom-0 w-[2px] bg-white/10 -z-10" />
               {/* Animated Fill Line */}
               <motion.div 
                 className="absolute top-0 bottom-0 w-[2px] bg-[var(--orange)] -z-10 origin-top"
                 style={{ scaleY: scrollYProgress }}
               />
               
               {/* Circular Markers */}
               {experiences.map((_, i) => {
                 const isActive = i === activeIndex;
                 const isCompleted = i < activeIndex;
                 return (
                   <div 
                     key={i} 
                     className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300 z-10 ${
                       isCompleted ? "bg-[var(--orange)]" 
                       : isActive ? "bg-[var(--orange)] scale-125" 
                       : "bg-[var(--grey)]"
                     }`} 
                   />
                 );
               })}
            </div>

            <div className="relative flex-1 w-full max-w-4xl px-6 z-10 flex flex-col justify-center">
              {/* mode="wait" ensures the outgoing card completely disappears before the new one mounts, eliminating overlap */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="flex flex-col justify-center pb-24"
                >
                  <h4 className="text-3xl md:text-5xl font-medium text-white mb-4 leading-tight">{experiences[activeIndex].role}</h4>
                  <div className="text-xl md:text-2xl text-[var(--orange)] font-medium mb-8">{experiences[activeIndex].company}</div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm md:text-base text-white/50 mb-10">
                    <span>{experiences[activeIndex].period}</span>
                    <span className="flex items-center gap-2"><MapPin size={18}/> {experiences[activeIndex].location}</span>
                  </div>
                  {experiences[activeIndex].bullets && (
                    <ul className="text-left space-y-4 text-white/70 leading-relaxed text-base md:text-lg w-full">
                      {experiences[activeIndex].bullets.map((bullet: string, idx: number) => (
                        <li key={idx} className="flex gap-4"><span className="text-[var(--orange)] mt-2 text-xs">■</span><span>{bullet}</span></li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </section>

      <section id="education" className="w-full py-32 bg-[var(--black)] border-t border-[var(--grey)]/20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-20">
            Education
          </h2>
          <div className="flex flex-col md:flex-row justify-center text-left divide-y md:divide-y-0 md:divide-x divide-white/20">
            {profile.education.map((edu: any, i: number) => (
              <div key={i} className="flex-1 py-12 md:py-0 md:px-12 first:pt-0 last:pb-0 md:first:pl-0 md:last:pr-0">
                <h4 className="text-2xl md:text-3xl font-medium text-white mb-4 leading-tight">{edu.degree}</h4>
                <div className="text-xl text-[var(--orange)] font-medium mb-6">{edu.institution}</div>
                <div className="flex flex-wrap items-center gap-6 text-sm text-white/50">
                  <span>{edu.period}</span>
                  <span className="flex items-center gap-1.5"><MapPin size={16}/> {edu.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
