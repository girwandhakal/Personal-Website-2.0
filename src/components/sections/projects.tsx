"use client";

import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
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

/** The desktop sheet's zoom, anchored to the tile that was clicked.
 *
 * This replaced a Motion shared-layout (`layoutId`) morph. The morph looked
 * right in principle but was structurally fragile: it is driven from JS on
 * the main thread, re-measuring boxes every frame, and its lead/follower
 * handoff meant the *close* leg belonged to the tile rather than the sheet.
 * That handoff produced a sheet that sat frozen on screen while the tile flew
 * home behind it, and made the whole animation sensitive to any stray
 * re-render of the grid. It also applied a non-uniform scale, which visibly
 * squashed the sheet's text on the way in.
 *
 * A zoom needs one measurement, at open, and then animates nothing but
 * `transform` and `opacity` — compositor-only properties, so the GPU runs it
 * independently of whatever the main thread is doing. The sheet owns both
 * legs, so close is the exact reverse of open by construction. */
const ZOOM_IN = { duration: 0.34, ease: [0.22, 1, 0.36, 1] } as const;
/** Slightly quicker on the way out — a close that matches the open's duration
 * reads as sluggish, since there's nothing new to look at. */
const ZOOM_OUT = { duration: 0.24, ease: [0.4, 0, 0.2, 1] } as const;
/** Floor on the zoom's starting scale. A tile much narrower than the sheet
 * would otherwise start the sheet small enough that the zoom reads as a
 * flying speck rather than an expansion. */
const MIN_ZOOM_SCALE = 0.55;

/** The mobile sheet's transition. Pure translate + fade, so it runs on the
 * compositor and can't be starved by main-thread work — see `useCompact`. */
const SHEET_TRANSITION = { duration: 0.3, ease: [0.16, 1, 0.3, 1] } as const;

/** Swipe-down-to-dismiss thresholds for the mobile sheet. Either a far enough
 * drag or a fast enough flick closes it; anything less springs back. The
 * velocity escape hatch is what makes a short, quick flick feel right — with
 * distance alone you'd have to drag a third of the screen every time. */
const DISMISS_DISTANCE = 120;
/** px/sec. */
const DISMISS_VELOCITY = 600;
/** A velocity reading older than this is treated as a standstill. */
const VELOCITY_STALE_MS = 100;
/** How far the sheet is thrown on a swipe dismiss, so it carries on downward
 * out of frame instead of drifting back up to the gentler default exit. */
const DISMISS_EXIT_Y = 340;
const DEFAULT_EXIT_Y = 20;
/** Releasing short of the threshold returns the sheet home. */
const SNAP_BACK = { type: "spring", stiffness: 500, damping: 40 } as const;

/**
 * True on phones and touch devices, which get a bottom sheet that slides up
 * and can be swiped away, rather than the desktop zoom.
 *
 * Both are compositor-only (transform + opacity); the split is about what the
 * gesture should be, not about cost. A bottom sheet is the native-feeling
 * shape on a phone and it's what swipe-to-dismiss is built around, while a
 * zoom anchored to the clicked tile only makes sense with a pointer and a
 * grid wide enough for the tile's position to mean something.
 *
 * Defaults to the desktop path so SSR and the first paint are unchanged; the
 * media query resolves on mount, long before anyone can tap a tile.
 */
function useCompact() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px), (hover: none)");
    const apply = () => setCompact(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return compact;
}

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
        className={`font-semibold underline decoration-2 underline-offset-4 cursor-pointer relative z-10 ${accentClass}`}
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
  onOpen: (project: Project, origin: DOMRect) => void;
}) {
  const accent = ACCENT_FILLS[project.accent];
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <motion.button
      ref={ref}
      type="button"
      // The sheet zooms out of wherever this tile happens to be, so hand its
      // box over at click time. One `getBoundingClientRect` per open — the
      // whole reason this is cheaper than the shared-layout morph it
      // replaced, which re-measured every tile on every frame.
      onClick={() => {
        const origin = ref.current?.getBoundingClientRect();
        if (origin) onOpen(project, origin);
      }}
      style={{ "--tile-accent": accent } as React.CSSProperties}
      className={`project-tile ${SPAN_PATTERN[index % SPAN_PATTERN.length]}`}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.6,
        delay: (index % SPAN_PATTERN.length) * 0.08,
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      <div className="relative z-10 flex flex-col h-full gap-5 text-left">
        <div className="flex items-start justify-between gap-4">
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold shrink-0"
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
          <h3 className="text-2xl md:text-3xl font-medium tracking-tighter leading-[1.05] text-ink">
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

function ProjectDetail({
  project,
  origin,
  onClose,
  compact,
  onSettled
}: {
  project: Project;
  /** Viewport box of the tile that was clicked — the zoom's anchor. */
  origin: DOMRect;
  onClose: () => void;
  compact: boolean;
  onSettled: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("context");
  const reactId = useId();
  const accent = ACCENT_FILLS[project.accent];
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  // Drives the compact sheet's y directly, so the swipe gesture and the
  // entrance animation write to the same value without fighting each other.
  const sheetControls = useAnimationControls();
  // Swapped to a much larger value the moment a swipe actually dismisses, so
  // the exit continues the gesture downward rather than animating back up to
  // the subtle default the X button uses.
  const [exitY, setExitY] = useState(DEFAULT_EXIT_Y);
  // The transform that puts this sheet back over the tile it came from.
  // Computed once, on mount, and reused verbatim as the exit target so the
  // close is the exact reverse of the open.
  const [zoomFrom, setZoomFrom] = useState<{ x: number; y: number; scale: number } | null>(null);
  // NOTE: don't try deferring the tabs/panel/footer to a later commit to
  // shrink the tap's synchronous mount cost — that was tried and made things
  // visibly worse. The sheet's content is what determines its final box, and
  // the zoom is measured from that box, so mounting it a frame late measures
  // the wrong thing. The whole sheet mounts in one commit, on purpose.

  // `useLayoutEffect`, not `useEffect`: this has to land *before* the browser
  // paints the first frame of the open transition. `useEffect` fires after
  // paint, so for a frame or two the page was still a normal scrollable
  // document — any native scroll-into-view (e.g. the focus() call below,
  // previously issued even earlier with nothing pinned yet) could nudge real
  // page scroll, which reads as the background "scrolling" behind the tile
  // as it expands. Locking first removes that window entirely.
  useLayoutEffect(() => {
    // Lock by intercepting the *inputs* that cause scrolling (wheel,
    // touch-drag, keyboard) rather than by changing any CSS `overflow`.
    // Two things that both change `overflow` were tried and both leave a
    // visible artifact:
    //  - `position: fixed` on <body> with a negative `top` (the old
    //    technique here) makes `window.scrollY` itself go to 0 while locked
    //    and jump back on unlock — and since every project tile carries a
    //    Motion `layoutId`, Motion's layout-projection system (which caches
    //    its own idea of the scroll offset, resynced only opportunistically)
    //    could miss both of those changes, leaving its cache stale by
    //    roughly the page's scroll distance — producing a large, spring-
    //    driven "flight" of every other tile on the *second* open.
    //  - `overflow: hidden` on <html> avoids that, but still makes the
    //    browser's real scrollbar (thumb + track) disappear the instant it's
    //    set and reappear on cleanup — `scrollbar-gutter: stable` keeps the
    //    *space* reserved so nothing reflows, but the scrollbar graphic
    //    itself still pops in and out, which read as its own small jitter.
    // Never touching `overflow`, `window.scrollY`, or `<body>`'s position at
    // all — just swallowing the events that would otherwise scroll the
    // page — leaves both untouched: the scrollbar stays exactly as drawn
    // the whole time, and there's nothing for Motion's cache to miss.
    const scrollPane = () => document.querySelector(".project-modal-scroll");
    const isInsideScrollPane = (node: EventTarget | null) =>
      node instanceof Node && (scrollPane()?.contains(node) ?? false);

    const onWheel = (e: WheelEvent) => {
      if (!isInsideScrollPane(e.target)) e.preventDefault();
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    const onTouchMove = (e: TouchEvent) => {
      if (!isInsideScrollPane(e.target)) e.preventDefault();
    };
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    // Focusing a newly-mounted node forces the browser to lay it out early
    // to know it's focusable — a synchronous reflow, right here inside a
    // `useLayoutEffect` that's already blocking the first paint. Deferring
    // one frame lets that first paint happen on schedule. (Profiling showed
    // this isn't on its own what made mobile smooth — dropping the morph
    // there was — but there's no reason to leave an avoidable forced reflow
    // in the critical path either.)
    // `preventScroll` stops the browser from scrolling any ancestor to bring
    // the (already fully on-screen, fixed-position) close button into view —
    // without it that scroll-into-view could itself move the real page.
    const focusFrame = requestAnimationFrame(() => {
      closeRef.current?.focus({ preventScroll: true });
    });

    const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Only swallow a scroll key when focus has somehow landed outside the
      // sheet — while it's inside, these should behave normally (Space on a
      // focused button, arrow keys in a scrollable panel, etc).
      if (SCROLL_KEYS.has(e.key) && !isInsideScrollPane(document.activeElement)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [onClose]);

  // The compact sheet's entrance. Driven imperatively rather than through the
  // `animate` prop because the swipe gesture below writes to the same `y`, and
  // only one of them can own it.
  useEffect(() => {
    if (!compact) return;
    sheetControls
      .start({
        opacity: 1,
        y: 0,
        transition: prefersReducedMotion ? { duration: 0.001 } : SHEET_TRANSITION
      })
      .then(onSettled);
  }, [compact, onSettled, prefersReducedMotion, sheetControls]);

  // The desktop entrance: zoom out of the tile that was clicked.
  //
  // `useLayoutEffect` because the measurement and the jump to the start of the
  // zoom both have to happen before the browser paints. React flushes state
  // updates made in a layout effect before paint, so the sheet is never
  // painted at full size for even one frame.
  //
  // The sheet is measured *after* mount rather than predicted from CSS: its
  // resting box depends on its content and the viewport, and a wrong guess
  // would show up as the zoom landing slightly off-centre.
  useLayoutEffect(() => {
    if (compact) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    const box = sheet.getBoundingClientRect();
    if (!box.width || !box.height) return; // jsdom, or a display:none ancestor

    // Uniform, so nothing in the sheet squashes on the way in — the shared
    // layout morph's non-uniform scale is exactly what used to distort the
    // text here.
    const scale = Math.max(MIN_ZOOM_SCALE, Math.min(1, origin.width / box.width));
    const from = {
      x: origin.left + origin.width / 2 - (box.left + box.width / 2),
      y: origin.top + origin.height / 2 - (box.top + box.height / 2),
      scale
    };

    setZoomFrom(from);
    sheetControls.set({ ...from, opacity: 0 });
    sheetControls
      .start({
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        transition: prefersReducedMotion ? { duration: 0.001 } : ZOOM_IN
      })
      .then(onSettled);
  }, [compact, onSettled, origin, prefersReducedMotion, sheetControls]);

  // Swipe-down-to-dismiss (touch only).
  //
  // Hand-rolled on touch events rather than built on Motion's `drag`, because
  // Motion's drag can't survive this particular gesture: the browser decides
  // within a frame or two that a downward touch is a scroll, and once it does
  // it CANCELS the pointer-event stream — Motion's drag stops getting moves
  // and the sheet freezes mid-swipe. (Verified: exactly one `pointermove`
  // arrives, then only raw `touchmove`.) The usual cure is `touch-action:
  // none`, but that would also disable the sheet content's own scrolling.
  // Owning a non-passive `touchmove` and calling `preventDefault()` the
  // instant we claim the gesture keeps it ours without giving up scrolling.
  //
  // The rule for claiming it: the gesture must be heading DOWN *and* the
  // content must already be scrolled to the very top. Otherwise it stays a
  // normal scroll, so a long project can still be read without the sheet
  // closing out from under you. That decision is deferred to the first few px
  // of movement, since that's the earliest the direction is actually known.
  useEffect(() => {
    if (!compact) return; // the desktop zoom has no gesture, just the X button
    const sheet = sheetRef.current;
    const pane = scrollRef.current;
    if (!sheet || !pane) return;

    let startY = 0;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0;
    let decided = true;
    let dragging = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startY = lastY = e.touches[0].clientY;
      lastT = performance.now();
      velocity = 0;
      decided = false;
      dragging = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const y = e.touches[0].clientY;
      const dy = y - startY;

      if (!decided) {
        if (Math.abs(dy) < 6) return; // too small to read a direction yet
        decided = true;
        dragging = dy > 0 && pane.scrollTop <= 0;
      }
      if (!dragging) return; // it's a scroll — leave it alone

      // `performance.now()`, not `e.timeStamp`: consecutive touch events can
      // carry the same stamp, which would leave dt at 0 and strand the
      // velocity at its last value — a fast flick would then read as slow.
      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0) velocity = ((y - lastY) / dt) * 1000; // px/sec
      lastY = y;
      lastT = now;

      e.preventDefault(); // keep the gesture ours rather than the pane's
      sheetControls.set({ y: Math.max(0, dy) });
    };

    const onTouchEnd = () => {
      if (!dragging) return;
      dragging = false;
      // A finger that stopped moving stops firing touchmove, which would
      // otherwise leave `velocity` frozen at whatever it was when the drag was
      // still in motion — so dragging down, pausing, then lifting would read
      // as a flick and dismiss against the user's intent. Treat a stale
      // reading as a standstill and judge that release on distance alone.
      if (performance.now() - lastT > VELOCITY_STALE_MS) velocity = 0;
      if (lastY - startY > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) {
        setExitY(DISMISS_EXIT_Y);
        onClose();
      } else {
        sheetControls.start({ y: 0, transition: SNAP_BACK });
      }
    };

    sheet.addEventListener("touchstart", onTouchStart, { passive: true });
    sheet.addEventListener("touchmove", onTouchMove, { passive: false });
    sheet.addEventListener("touchend", onTouchEnd, { passive: true });
    sheet.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      sheet.removeEventListener("touchstart", onTouchStart);
      sheet.removeEventListener("touchmove", onTouchMove);
      sheet.removeEventListener("touchend", onTouchEnd);
      sheet.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [compact, onClose, sheetControls]);

  return (
    <div className="project-modal-layer">
      <motion.div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${reactId}-title`}
        className="project-modal"
        style={{ "--tile-accent": accent } as React.CSSProperties}
        // Both paths are transform + opacity only, and both are driven
        // through `sheetControls` rather than an `animate` target: compact
        // because the swipe gesture writes to the same `y`, desktop because
        // the zoom's start can only be known after measuring. See the
        // entrance effects above.
        //
        // `opacity: 0` up front matters — the desktop path overwrites the
        // whole transform in a layout effect, and this guarantees nothing is
        // visible even if that measurement bails out.
        initial={{ opacity: 0, y: compact ? 28 : 0 }}
        animate={sheetControls}
        // The exit is the open's own numbers, run backwards, so close mirrors
        // open exactly. Critically it belongs to *this* element: the sheet
        // animates itself out instead of handing off to the tile, which is
        // what the shared-layout morph did and what made close feel detached.
        exit={
          compact
            ? { opacity: 0, y: exitY }
            : prefersReducedMotion
              ? { opacity: 0, transition: { duration: 0.001 } }
              : // An inline transition, because the close is quicker than the
                // open and the element-level `transition` below can only
                // carry one of the two.
                { ...(zoomFrom ?? {}), opacity: 0, transition: ZOOM_OUT }
        }
        transition={
          prefersReducedMotion ? { duration: 0.001 } : compact ? SHEET_TRANSITION : ZOOM_OUT
        }
      >
        <div className="project-modal-scroll" ref={scrollRef}>
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
            <h2 id={`${reactId}-title`} className="text-3xl md:text-5xl font-medium tracking-tighter leading-[1.02] text-ink">
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
  // The clicked tile's box is captured with the project, because the sheet's
  // zoom is anchored to wherever that tile was at the moment of the click.
  const [opened, setOpened] = useState<{ project: Project; origin: DOMRect } | null>(null);
  const compact = useCompact();

  // The scrim's blur, toggled by writing the attribute rather than through
  // React state — a state update here would re-render the whole grid in the
  // middle of the sheet's animation for a purely decorative effect.
  const backdropRef = useRef<HTMLDivElement>(null);
  const setScrimBlur = useCallback((on: boolean) => {
    backdropRef.current?.setAttribute("data-settled", on ? "true" : "false");
  }, []);

  const openDetail = useCallback((project: Project, origin: DOMRect) => {
    setOpened({ project, origin });
  }, []);

  const closeDetail = useCallback(() => {
    // Drop the blur before the sheet starts moving again, for the same reason
    // it's off during the open: a full-viewport backdrop-filter re-samples
    // every frame that anything repaints on top of it, which is the single
    // most expensive thing in this transition.
    setScrimBlur(false);
    setOpened(null);
  }, [setScrimBlur]);

  const onSettled = useCallback(() => setScrimBlur(true), [setScrimBlur]);

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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          {projects.map((project, index) => (
            <ProjectTile
              key={project.slug}
              project={project}
              index={index}
              onOpen={openDetail}
            />
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

      {/*
        Two AnimatePresences, deliberately — the scrim must NOT share the
        sheet's.

        AnimatePresence only unmounts an exiting child once *every* `motion`
        element registered against its presence context has finished exiting
        (see PresenceChild's `presenceChildren` bookkeeping in framer-motion:
        each one registers on mount, and one incomplete entry holds back the
        whole removal). The scrim was one of those, with a 0.28s fade.

        Keeping them together meant the scrim's 0.28s fade held the dismissed
        sheet on screen for its whole duration, long after the sheet itself
        had finished. Apart, each leaves on its own clock and the sheet's
        close is only ever as long as the sheet's own animation.

        (The tab panel's nested AnimatePresence is not a third gate: nested
        AnimatePresences default to `propagate: false`, so its children
        register against it rather than against this one.)
      */}
      <AnimatePresence>
        {opened && (
          <motion.div
            ref={backdropRef}
            className="project-modal-backdrop"
            // Initial value only — `setScrimBlur` owns it from here on. The
            // blur starts off and fades in once the sheet has landed.
            data-settled="false"
            onClick={closeDetail}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {opened && (
          <ProjectDetail
            key={opened.project.slug}
            project={opened.project}
            origin={opened.origin}
            onClose={closeDetail}
            compact={compact}
            onSettled={onSettled}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
