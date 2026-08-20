"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/content/projects";

/**
 * Hovering slides a solid accent fill across the card. On the light theme every
 * fill is darker than the page, so the card's text inverts to white on hover —
 * the reverse of the old dark theme, where the fills were the bright colours.
 *
 * Fills are limited to navy / rose / blue: each clears 4.5:1 against white
 * label text. Red (#f03a47) is only 3.9:1 with white, so it stays a
 * large-text-and-UI accent elsewhere in the site rather than a text backdrop.
 */
const ACCENT_FILLS = {
  orange: "var(--navy)",
  crimson: "var(--rose)",
  white: "var(--blue)"
} as const;

const ON_FILL = "#ffffff";

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  const color = ACCENT_FILLS[project.accent as keyof typeof ACCENT_FILLS] || "var(--navy)";

  return (
    <motion.a
      href={project.links[0]?.href || "#"}
      target="_blank"
      rel="noopener noreferrer"
      style={{ "--active-border": color } as React.CSSProperties}
      className="group relative flex flex-col md:flex-row md:items-center justify-between border-b border-ink/15 transition-colors duration-300 active:border-[var(--active-border)] md:active:border-ink/15 py-12 px-4 md:px-8 cursor-pointer no-underline overflow-hidden"
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
          animate={{ color: isHovered ? "rgba(255, 255, 255, 0.85)" : "rgba(24, 48, 89, 0.7)" }}
          transition={{ duration: 0.3 }}
        >
          {project.eyebrow}
        </motion.span>

        <motion.h3
          className="text-4xl md:text-5xl font-extrabold tracking-tighter leading-tight"
          animate={{ color: isHovered ? ON_FILL : "var(--ink)" }}
          transition={{ duration: 0.3 }}
        >
          {project.title}
        </motion.h3>

        {/* Details appear only on hover (Desktop), so they always sit on the fill. */}
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: isHovered ? "auto" : 0, opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden hidden md:block"
        >
          <div className="flex flex-col gap-4 mt-4">
            <p className="text-lg md:text-xl font-medium max-w-2xl text-white/90 leading-relaxed">
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
                    className="text-white hover:text-white/80 font-bold underline decoration-2 underline-offset-4 cursor-pointer relative z-20"
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
                  className="text-xs uppercase tracking-widest font-bold px-3 py-1 border border-white/35 rounded-full text-white"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Details always visible (Mobile) — these sit on the page background,
            never on the fill, so they keep the ink palette. */}
        <div className="overflow-hidden md:hidden">
          <div className="flex flex-col gap-4 mt-4">
            <p className="text-base font-medium text-ink/80 leading-relaxed">
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
                    className="text-blue hover:text-ink font-bold underline decoration-2 underline-offset-4 cursor-pointer relative z-20"
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
                  className="text-xs uppercase tracking-widest font-bold px-3 py-1 border border-ink/25 rounded-full text-ink"
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
          borderColor: isHovered ? ON_FILL : "rgba(24, 48, 89, 0.4)",
          color: isHovered ? ON_FILL : "var(--ink)",
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
