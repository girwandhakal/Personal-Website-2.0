"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/content/projects";

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const accentColors = {
    orange: "var(--orange)",
    crimson: "var(--crimson)",
    white: "var(--white)"
  };
  const color = accentColors[project.accent as keyof typeof accentColors] || "var(--white)";

  return (
    <motion.a
      href={project.links[0]?.href || "#"}
      target="_blank"
      rel="noopener noreferrer"
      style={{ "--active-border": color } as React.CSSProperties}
      className="group relative flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--grey)]/20 transition-colors duration-300 active:border-[var(--active-border)] md:active:border-[var(--grey)]/20 py-12 px-4 md:px-8 cursor-pointer no-underline overflow-hidden"
      onMouseEnter={() => {
        if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => {
        if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
          setIsHovered(true);
        }
      }}
      onBlur={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Background slide effect */}
      <motion.div
        className="absolute inset-0 z-0 origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isHovered ? 1 : 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ backgroundColor: color }}
      />
      
      <div className="relative z-10 flex flex-col gap-2 md:max-w-[70%]">
        <motion.span
          className="text-sm font-bold tracking-widest uppercase"
          animate={{ color: isHovered ? "rgba(10, 9, 8, 0.7)" : "var(--grey)" }}
          transition={{ duration: 0.3 }}
        >
          {project.eyebrow}
        </motion.span>
        
        <motion.h3 
          className="text-4xl md:text-5xl font-extrabold tracking-tighter leading-tight"
          animate={{ color: isHovered ? "var(--black)" : "var(--white)" }}
          transition={{ duration: 0.3 }}
        >
          {project.title}
        </motion.h3>

        {/* Details appear only on hover (Desktop) */}
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: isHovered ? "auto" : 0, opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden hidden md:block"
        >
          <div className="flex flex-col gap-4 mt-4">
            <p className="text-lg md:text-xl font-medium max-w-2xl text-[#0a0908]/80 leading-relaxed">
              {project.summary.includes("try it here") ? (
                <>
                  {project.summary.split("try it here")[0]}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new Event("open-ai-chat"));
                      }
                    }}
                    className="text-orange-600 hover:text-orange-800 font-bold underline decoration-2 underline-offset-4 cursor-pointer relative z-20"
                  >
                    try it here
                  </button>
                  {project.summary.split("try it here")[1]}
                </>
              ) : (
                project.summary
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {project.tech.map(t => (
                <span 
                  key={t} 
                  className="text-xs uppercase tracking-widest font-bold px-3 py-1 border border-[var(--black)]/20 rounded-full"
                  style={{ color: "var(--black)" }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Details always visible (Mobile) */}
        <div className="overflow-hidden md:hidden">
          <div className="flex flex-col gap-4 mt-4">
            <p className="text-base font-medium text-[var(--white)]/80 leading-relaxed">
              {project.summary.includes("try it here") ? (
                <>
                  {project.summary.split("try it here")[0]}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new Event("open-ai-chat"));
                      }
                    }}
                    className="text-orange-400 hover:text-orange-300 font-bold underline decoration-2 underline-offset-4 cursor-pointer relative z-20"
                  >
                    try it here
                  </button>
                  {project.summary.split("try it here")[1]}
                </>
              ) : (
                project.summary
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {project.tech.map(t => (
                <span 
                  key={t} 
                  className="text-xs uppercase tracking-widest font-bold px-3 py-1 border border-[var(--white)]/20 rounded-full"
                  style={{ color: "var(--white)" }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.div 
        className="relative z-10 shrink-0 mt-6 md:mt-0 flex items-center justify-center w-14 h-14 rounded-full border-2"
        animate={{ 
          borderColor: isHovered ? "var(--black)" : "var(--grey)",
          color: isHovered ? "var(--black)" : "var(--white)",
          scale: isHovered ? 1.1 : 1,
          rotate: isHovered ? 45 : 0
        }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <ArrowUpRight size={28} />
      </motion.div>
    </motion.a>
  );
}
