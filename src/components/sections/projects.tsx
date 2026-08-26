"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";

import { GithubIcon } from "@/components/ui/social-icons";
import { projects, type Project } from "@/content/projects";
import { Reveal } from "@/components/motion/reveal";

/**
 * Every fill clears 4.5:1 against the white label text it sits behind, same
 * rule the rest of the site follows — see globals.css's palette comment.
 */
const ACCENT_FILLS = {
  orange: "var(--navy)",
  crimson: "var(--rose)",
  white: "var(--blue)"
} as const;

/** Bento span pattern: wide/narrow/narrow/wide, repeating — an asymmetric
 * grid reads far less like a list than a uniform one does. */
const SPAN_PATTERN = ["md:col-span-7", "md:col-span-5", "md:col-span-5", "md:col-span-7"];

/** The tile<->sheet morph's spring, shared so open and close feel identical —
 * without this the tile's own `transition` (tuned for its scroll-in reveal)
 * silently governed the *close* leg of the shared `layoutId` animation,
 * since Motion falls back to it when no `transition.layout` is given. */
const MORPH_TRANSITION = { type: "spring", stiffness: 320, damping: 32, mass: 0.9 } as const;

const TABS = [
  { key: "context", label: "The Problem" },
  { key: "approach", label: "The Build" },
  { key: "outcome", label: "The Outcome" },
  { key: "learnings", label: "What I Learned" }
] as const;

type TabKey = (typeof TABS)[number]["key"];

/** A single tab trigger, styled as its own standalone glass pill rather than
 * one of several buttons sharing a single segmented-control surface — each
 * button owns its own background, border, and active state. */
function ProjectTabButton({
  label,
  isActive,
  onSelect,
  tabId,
  panelId
}: {
  label: string;
  isActive: boolean;
  onSelect: () => void;
  tabId: string;
  panelId: string;
}) {
  return (
    <button
      id={tabId}
      role="tab"
      type="button"
      aria-selected={isActive}
      aria-controls={panelId}
      tabIndex={isActive ? 0 : -1}
      onClick={onSelect}
      className="project-tab"
      data-active={isActive}
    >
      {label}
    </button>
  );
}

/** Renders a project's `try it here` sentence with the phrase wired to open
 * the on-site chat instead of just being prose. */
function SummaryWithChatLink({ text, accentClass }: { text: string; accentClass: string }) {
  if (!text.includes("try it here")) return <>{text}</>;
  const [before, after] = text.split("try it here");
  return (
    <>
      {before}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof window !== "undefined") window.dispatchEvent(new Event("open-ai-chat"));
        }}
        className={`font-bold underline decoration-2 underline-offset-4 cursor-pointer relative z-10 ${accentClass}`}
      >
        try it here
      </button>
      {after}
    </>
  );
}

function ProjectTile({
  project,
  index,
  onOpen
}: {
  project: Project;
  index: number;
  onOpen: (project: Project) => void;
}) {
  const accent = ACCENT_FILLS[project.accent];
  const prefersReducedMotion = useReducedMotion();
  // While the shared layoutId animation is in flight (this tile closing back
  // in from the full sheet), the tile's `backdrop-filter` blur is switched
  // off — see the `data-settled` rule in globals.css for why.
  const [settled, setSettled] = useState(true);

  return (
    <motion.button
      type="button"
      layoutId={`project-tile-${project.slug}`}
      onClick={() => onOpen(project)}
      style={{ "--tile-accent": accent } as React.CSSProperties}
      className={`project-tile ${SPAN_PATTERN[index % SPAN_PATTERN.length]}`}
      data-settled={settled}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.6,
        delay: (index % SPAN_PATTERN.length) * 0.08,
        ease: [0.16, 1, 0.3, 1],
        layout: prefersReducedMotion ? { duration: 0.001 } : MORPH_TRANSITION
      }}
      onLayoutAnimationStart={() => setSettled(false)}
      onLayoutAnimationComplete={() => setSettled(true)}
    >
      <div className="relative z-10 flex flex-col h-full gap-5 text-left">
        <div className="flex items-start justify-between gap-4">
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-black shrink-0"
            style={{ background: "var(--tile-accent)", color: "#fff" }}
            aria-hidden="true"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="project-tile-open">
            <ArrowUpRight size={18} aria-hidden="true" />
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <h3 className="text-2xl md:text-3xl font-extrabold tracking-tighter leading-[1.05] text-ink">
            {project.title}
          </h3>
          <p className="text-sm md:text-base text-ink-muted leading-relaxed line-clamp-3">
            {project.summary}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {project.tech.slice(0, 3).map((t) => (
            <span key={t} className="project-tile-chip">
              {t}
            </span>
          ))}
          {project.tech.length > 3 && (
            <span className="project-tile-chip project-tile-chip--muted">+{project.tech.length - 3}</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function ProjectDetail({ project, onClose }: { project: Project; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>("context");
  const reactId = useId();
  const accent = ACCENT_FILLS[project.accent];
  const closeRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();
  // Stays false for the ~duration of the tile->sheet shared-layout transform,
  // true once it settles. See the `data-settled` CSS below for why.
  const [settled, setSettled] = useState(false);

  // `useLayoutEffect`, not `useEffect`: this has to land *before* the browser
  // paints the first frame of the open transition. `useEffect` fires after
  // paint, so for a frame or two the page was still a normal scrollable
  // document — any native scroll-into-view (e.g. the focus() call below,
  // previously issued even earlier with nothing pinned yet) could nudge real
  // page scroll, which reads as the background "scrolling" behind the tile
  // as it expands. Locking first removes that window entirely.
  useLayoutEffect(() => {
    // `overflow: hidden` alone doesn't hold on mobile Safari/Firefox, where
    // <html> — not <body> — is the real scrolling box: touch can still
    // rubber-band the page behind the sheet. Pinning <body> with
    // `position: fixed` (same technique as the mobile nav menu) removes it
    // from the scrollable flow entirely across all three engines.
    const scrollY = window.scrollY;
    const { style } = document.body;
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";

    // `preventScroll` stops the browser from scrolling any ancestor to bring
    // the (already fully on-screen, fixed-position) close button into view —
    // without it that scroll-into-view could itself move the real page.
    closeRef.current?.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      style.position = "";
      style.top = "";
      style.left = "";
      style.right = "";
      style.width = "";
      window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior });
    };
  }, [onClose]);

  return (
    <div className="project-modal-layer">
      <motion.div
        className="project-modal-backdrop"
        data-settled={settled}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        aria-hidden="true"
      />

      <motion.div
        layoutId={`project-tile-${project.slug}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${reactId}-title`}
        className="project-modal"
        data-settled={settled}
        style={{ "--tile-accent": accent } as React.CSSProperties}
        transition={prefersReducedMotion ? { duration: 0.001 } : MORPH_TRANSITION}
        onLayoutAnimationStart={() => setSettled(false)}
        onLayoutAnimationComplete={() => setSettled(true)}
      >
        <div className="project-modal-scroll">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="project-modal-close"
            aria-label="Close project details"
          >
            <X size={18} aria-hidden="true" />
          </button>

          <header className="flex flex-col gap-3 pr-12">
            <h2 id={`${reactId}-title`} className="text-3xl md:text-5xl font-extrabold tracking-tighter leading-[1.02] text-ink">
              {project.title}
            </h2>

            <p className="text-lg md:text-xl text-ink-muted leading-relaxed max-w-3xl">
              <SummaryWithChatLink text={project.summary} accentClass="text-(--tile-accent) hover:text-ink" />
            </p>
          </header>

          <div role="tablist" aria-label={`${project.title} details`} className="project-tabs mt-6">
            {TABS.map((tab) => (
              <ProjectTabButton
                key={tab.key}
                label={tab.label}
                isActive={activeTab === tab.key}
                onSelect={() => setActiveTab(tab.key)}
                tabId={`${reactId}-tab-${tab.key}`}
                panelId={`${reactId}-panel-${tab.key}`}
              />
            ))}
          </div>

          <div className="min-h-32 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                id={`${reactId}-panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`${reactId}-tab-${activeTab}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-base md:text-lg leading-relaxed text-ink-muted max-w-3xl text-pretty">
                  {project[activeTab]}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-ink/12">
            <div className="flex flex-wrap gap-2">
              {project.tech.map((t) => (
                <span key={t} className="project-tile-chip">
                  {t}
                </span>
              ))}
            </div>

            <a
              href={project.links[0]?.href || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group button button-secondary shrink-0"
            >
              <GithubIcon size={18} aria-hidden="true" />
              <span>{project.links[0]?.label ?? "View Github"}</span>
              <ArrowUpRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </a>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}

export function Projects() {
  const [selected, setSelected] = useState<Project | null>(null);
  const closeDetail = useCallback(() => setSelected(null), []);

  return (
    <section
      className="section-band bg-[var(--surface)] border-t border-ink/15"
      id="projects"
      aria-labelledby="projects-title"
    >
      <div className="section-inner flex flex-col gap-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <Reveal>
            <h2 className="text-ink" id="projects-title">
              Projects
            </h2>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="text-base md:text-lg text-ink-muted max-w-xl">
              Tap a project to open the full build — the problem, the decisions, and what shipped.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          {projects.map((project, index) => (
            <ProjectTile key={project.slug} project={project} index={index} onOpen={setSelected} />
          ))}
        </div>

        <div className="pt-6 flex flex-wrap justify-center gap-4 border-t border-ink/15">
          <Reveal>
            <a
              href="https://github.com/girwandhakal"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 text-lg font-medium text-ink/75 hover:text-ink transition-all bg-ink/5 hover:bg-ink/10 px-8 py-4 rounded-full"
            >
              <span>View more projects on GitHub</span>
              <GithubIcon aria-hidden="true" size={20} className="opacity-70 group-hover:opacity-100 transition-opacity" />
            </a>
          </Reveal>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <ProjectDetail
            key={selected.slug}
            project={selected}
            onClose={closeDetail}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
