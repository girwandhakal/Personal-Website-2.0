"use client";

import { useRef } from "react";
import { ArrowDownToLine, MapPin } from "lucide-react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { profile } from "@/content/profile";

function ScrollSlide({ item, index, total, scrollYProgress }: any) {
  const prefersReducedMotion = useReducedMotion();
  
  // Segment the total scroll space into equal parts per slide
  const segment = 1 / total;
  const boundary = index * segment;       // Left boundary
  const nextBoundary = (index + 1) * segment; // Right boundary
  const fade = segment * 0.125;           // Cut crossfade duration in half
  
  let input = [];
  let outputOpacity = [];
  let outputY = [];
  
  if (index === 0) {
    input = [0, nextBoundary - fade, nextBoundary + fade, 1];
    outputOpacity = [1, 1, 0, 0];
    outputY = [0, 0, prefersReducedMotion ? 0 : -80, prefersReducedMotion ? 0 : -80];
  } else if (index === total - 1) {
    input = [0, boundary - fade, boundary + fade, 1];
    outputOpacity = [0, 0, 1, 1];
    outputY = [prefersReducedMotion ? 0 : 80, prefersReducedMotion ? 0 : 80, 0, 0];
  } else {
    input = [0, boundary - fade, boundary + fade, nextBoundary - fade, nextBoundary + fade, 1];
    outputOpacity = [0, 0, 1, 1, 0, 0];
    outputY = [prefersReducedMotion ? 0 : 80, prefersReducedMotion ? 0 : 80, 0, 0, prefersReducedMotion ? 0 : -80, prefersReducedMotion ? 0 : -80];
  }
  
  const opacity = useTransform(scrollYProgress, input, outputOpacity);
  const y = useTransform(scrollYProgress, input, outputY);
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? "auto" : "none"));

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col justify-center items-center text-center px-6"
      style={{ opacity, y, pointerEvents }}
    >
      {item.type === "title" ? (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center">

          <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
            {item.title}
          </h2>
        </div>
      ) : item.type === "education_combined" ? (
        <div className="w-full max-w-5xl mx-auto">

          <div className="flex flex-col md:flex-row justify-center text-left divide-y md:divide-y-0 md:divide-x divide-white/20">
            {item.degrees.map((edu: any, i: number) => (
              <div key={i} className="flex-1 py-8 md:py-0 md:px-12 first:pt-0 last:pb-0 md:first:pl-0 md:last:pr-0">
                <h4 className="text-2xl font-medium text-white mb-3 leading-tight">
                  {edu.degree}
                </h4>
                <div className="text-xl text-[#faa916] font-medium mb-6">
                  {edu.institution}
                </div>
                <div className="flex flex-wrap items-center gap-6 text-sm text-white/50">
                  <span>{edu.period}</span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={16}/> {edu.location}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      ) : (
        <div className="w-full max-w-4xl mx-auto">

          
          <h4 className="text-3xl md:text-5xl font-medium text-white mb-4 leading-tight">
            {item.role}
          </h4>
          <div className="text-xl md:text-2xl text-[#faa916] font-medium mb-8">
            {item.company}
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm md:text-base text-white/50 mb-10">
            <span>{item.period}</span>
            <span className="flex items-center gap-2">
              <MapPin size={18}/> {item.location}
            </span>
          </div>
          
          {item.bullets && (
            <ul className="text-left space-y-4 text-white/70 leading-relaxed text-base md:text-lg max-w-3xl mx-auto">
              {item.bullets.map((bullet: string, idx: number) => (
                <li key={idx} className="flex gap-4">
                  <span className="text-[#faa916] mt-2 text-xs">■</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </motion.div>
  );
}



export function Resume() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const items = [
    { type: 'title', title: 'Work Experience', eyebrow: 'Timeline' },
    ...profile.experience.map(exp => ({ type: 'experience', ...exp })),
    { type: 'title', title: 'Education', eyebrow: 'Academic Background' },
    { type: 'education_combined', degrees: profile.education }
  ];

  // The index of the Education title card
  const educationIndex = 4;

  // If the user prefers reduced motion, fallback to a standard stacked layout
  if (prefersReducedMotion) {
    return (
      <section id="resume" className="py-32 w-full">
        <div className="max-w-4xl mx-auto px-6 flex flex-col gap-32">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              {item.type === 'title' && (
                <>
                  <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight">{item.title}</h2>
                </>
              )}
              {item.type === 'experience' && (
                <>
                  <h4 className="text-3xl md:text-5xl font-medium text-white mb-4">{item.role}</h4>
                  <div className="text-xl md:text-2xl text-[#faa916] font-medium mb-8">{item.company}</div>
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm md:text-base text-white/50 mb-10">
                    <span>{item.period}</span>
                    <span className="flex items-center gap-2"><MapPin size={18}/> {item.location}</span>
                  </div>
                  <ul className="text-left space-y-4 text-white/70 leading-relaxed text-base md:text-lg max-w-3xl mx-auto">
                    {item.bullets.map((b: string, idx: number) => (
                      <li key={idx} className="flex gap-4"><span className="text-[#faa916] mt-2 text-xs">■</span><span>{b}</span></li>
                    ))}
                  </ul>
                </>
              )}
              {item.type === 'education_combined' && (
                <div className="w-full flex flex-col md:flex-row gap-12 text-left divide-y md:divide-y-0 md:divide-x divide-white/20">
                   {item.degrees.map((edu: any, idx: number) => (
                     <div key={idx} className="flex-1 pt-8 md:pt-0 md:pl-12 first:pt-0 md:first:pl-0">
                       <h4 className="text-2xl md:text-3xl font-medium text-white mb-4 leading-tight">{edu.degree}</h4>
                       <div className="text-xl text-[#faa916] font-medium mb-6">{edu.institution}</div>
                       <div className="flex flex-wrap items-center gap-6 text-sm text-white/50">
                         <span>{edu.period}</span>
                         <span className="flex items-center gap-1.5"><MapPin size={16}/> {edu.location}</span>
                       </div>
                     </div>
                   ))}
                </div>
              )}

            </div>
          ))}
        </div>
      </section>
    );
  }

  // Scrollytelling layout
  return (
    <section 
      id="resume" 
      ref={containerRef}
      style={{ height: `${items.length * 120}vh` }} 
      className="relative w-full"
    >
      {/* Anchor point for the navbar to scroll directly to Education */}
      <div id="education" className="absolute w-full" style={{ top: `${educationIndex * 120}vh` }} />
      
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#faa916]/5 via-[#0a0a0a]/0 to-transparent pointer-events-none" />

        {items.map((item, i) => (
          <ScrollSlide 
            key={i} 
            item={item} 
            index={i} 
            total={items.length} 
            scrollYProgress={scrollYProgress} 
          />
        ))}
      </div>
    </section>
  );
}
