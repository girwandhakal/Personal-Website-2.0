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
        className="relative w-full bg-[var(--black)] border-t border-[var(--grey)]/20"
        // Increased height to 150vh per item to slow down progression logic
        style={prefersReducedMotion ? {} : { height: `${experiences.length * 150}vh` } as React.CSSProperties}
      >
        {/* Static View for Reduced Motion */}
        {prefersReducedMotion && (
          <div className="w-full py-24 px-6 block">
            <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tight mb-16 text-center">
              Work Experience
            </h2>
            <div className="max-w-4xl mx-auto flex flex-col gap-20">
              {experiences.map((exp, i) => (
                <div key={i} className="flex flex-col">
                  <h4 className="text-3xl md:text-5xl font-medium text-white mb-2 leading-tight">{exp.role}</h4>
                  <div className="text-xl md:text-2xl text-[var(--orange)] font-medium mb-6">{exp.company}</div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:text-base text-white/50 mb-8">
                    <span>{exp.period}</span>
                    <span className="flex items-center gap-2"><MapPin size={16}/> {exp.location}</span>
                  </div>
                  {exp.bullets && (
                    <ul className="text-left space-y-3 text-white/70 leading-relaxed text-base md:text-lg w-full">
                      {exp.bullets.map((bullet: string, idx: number) => (
                        <li key={idx} className="flex gap-4"><span className="text-[var(--orange)] mt-1.5 text-[10px]">■</span><span>{bullet}</span></li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Universal Sticky View (Mobile & Desktop) */}
        {!prefersReducedMotion && (
          <div className="flex sticky top-0 h-[100svh] w-full flex-col items-center py-6 pt-24 md:pt-32 md:pb-8 md:overflow-hidden">
            <h2 className="text-3xl md:text-6xl font-bold text-white tracking-tight z-10 mb-4 md:mb-8 text-center px-4 shrink-0">
              Work Experience
            </h2>

            {/* Scroll Progress Indicator with Step Markers */}
            <div className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 flex flex-col items-center justify-between z-20 py-2 h-[70%] md:h-[50%]">
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

            <div className="relative flex-1 w-full max-w-4xl pl-10 pr-4 md:px-12 z-10 flex flex-col justify-start md:justify-center mx-auto overflow-y-auto md:overflow-visible overflow-x-hidden md:overflow-x-visible pt-2 pb-8 md:pb-12 scrollbar-hide">
               {/* mode="wait" ensures the outgoing card completely disappears before the new one mounts, eliminating overlap */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="flex flex-col justify-start"
                >
                  <h4 className="text-2xl md:text-4xl font-medium text-white mb-1 md:mb-2 leading-tight">{experiences[activeIndex].role}</h4>
                  <div className="text-lg md:text-xl text-[var(--orange)] font-medium mb-3 md:mb-4">{experiences[activeIndex].company}</div>
                  <div className="flex flex-wrap items-center gap-x-4 md:gap-x-6 gap-y-1 md:gap-y-3 text-xs md:text-sm text-white/50 mb-4 md:mb-6">
                    <span>{experiences[activeIndex].period}</span>
                    <span className="flex items-center gap-1.5 md:gap-2"><MapPin size={14} className="md:w-[16px] md:h-[16px]" /> {experiences[activeIndex].location}</span>
                  </div>
                  {experiences[activeIndex].bullets && (
                    <ul className="text-left space-y-2.5 md:space-y-3 text-white/70 leading-snug md:leading-normal text-[13px] md:text-base w-full">
                      {experiences[activeIndex].bullets.map((bullet: string, idx: number) => (
                        <li key={idx} className="flex gap-2.5 md:gap-4"><span className="text-[var(--orange)] mt-1.5 md:mt-2 text-[8px] md:text-xs shrink-0">■</span><span>{bullet}</span></li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </section>

      <section id="education" className="w-full py-24 md:py-32 bg-[var(--black)] border-t border-[var(--grey)]/20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tight mb-16 md:mb-20">
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
