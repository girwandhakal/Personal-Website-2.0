"use client";

import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import type { Project } from "@/content/projects";

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const prefersReducedMotion = useReducedMotion();

  // Pick an SVG color accent based on project accent name
  const accentColor = project.accent === "orange" ? "var(--orange)" : project.accent === "crimson" ? "var(--crimson)" : "var(--white)";

  return (
    <motion.article
      className={`project-folder project-card-${project.accent}`}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 40 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Folder Tab Header */}
      <div className="folder-tab">
        <span className="folder-tab-label">{project.eyebrow}</span>
      </div>

      {/* Main Folder Body */}
      <div className="folder-body">
        {/* Experimental Vector Schematic Graphic (Anti-AI) */}
        <div className="project-schematic" aria-hidden="true">
          <div className="schematic-grid-bg" />
          <svg viewBox="0 0 200 100" className="schematic-svg">
            <line x1="10" y1="50" x2="190" y2="50" stroke="var(--line)" strokeWidth="0.75" strokeDasharray="3 3" />
            <line x1="100" y1="10" x2="100" y2="90" stroke="var(--line)" strokeWidth="0.75" strokeDasharray="3 3" />
            {index % 2 === 0 ? (
              <>
                <circle cx="100" cy="50" r="32" fill="none" stroke={accentColor} strokeWidth="2" />
                <rect x="78" y="28" width="44" height="44" fill="none" stroke="var(--line)" strokeWidth="1" />
                <line x1="60" y1="10" x2="140" y2="90" stroke={accentColor} strokeWidth="1.5" />
              </>
            ) : (
              <>
                <rect x="68" y="18" width="64" height="64" fill="none" stroke={accentColor} strokeWidth="2" />
                <circle cx="100" cy="50" r="24" fill="none" stroke="var(--line)" strokeWidth="1" />
                <circle cx="100" cy="50" r="6" fill={accentColor} />
              </>
            )}
            <circle cx="10" cy="50" r="2.5" fill={accentColor} />
            <circle cx="190" cy="50" r="2.5" fill={accentColor} />
          </svg>
        </div>

        <div className="project-copy">
          <h3>{project.title}</h3>
          <p>{project.summary}</p>
          <strong className="project-impact-line">{project.impact}</strong>
        </div>

        <ul className="tech-list" aria-label={`${project.title} technology stack`}>
          {project.tech.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>

        <div className="project-links">
          {project.links.map((link) => (
            <a key={link.href + link.label} href={link.href} className="button-tactile-link">
              <span>{link.label}</span>
              <ArrowUpRight aria-hidden="true" size={17} />
            </a>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
