# Cinematic Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a professional scroll-driven cinematic introduction before the existing portfolio hero.

**Architecture:** Create a client-only `CinematicIntro` component that uses Motion scroll progress from a local section ref. Add local SVG assets and scoped CSS for sticky pinning, parallax layers, responsive fallbacks, and reduced-motion behavior while preserving existing homepage sections.

**Tech Stack:** Next.js, React, TypeScript, Motion, Tailwind CSS, Vitest, Testing Library, jest-axe.

---

### Task 1: Test Coverage

**Files:**
- Modify: `src/__tests__/page-accessibility.test.tsx`

- [ ] Add assertions that the homepage renders a `Cinematic introduction` region before the existing hero.
- [ ] Add assertions for four visible intro beats: name, tagline, technical motifs, and transition cue.
- [ ] Add assertions that the existing hero/about/projects/contact sections remain available.
- [ ] Run `npm.cmd test` and confirm the new test fails because `CinematicIntro` does not exist yet.

### Task 2: Component And Assets

**Files:**
- Create: `src/components/sections/cinematic-intro.tsx`
- Create: `public/assets/shapes/cinematic-grid.svg`
- Create: `public/assets/shapes/cinematic-constellation.svg`
- Modify: `src/app/page.tsx`
- Modify: `src/styles/globals.css`

- [ ] Implement `CinematicIntro` as a client component using `useScroll`, `useTransform`, and `useReducedMotion`.
- [ ] Render a tall scroll section with a sticky stage and 5 staged content beats.
- [ ] Keep decorative layers `aria-hidden`.
- [ ] Add the component before `Hero` in `src/app/page.tsx`.
- [ ] Add scoped CSS for desktop, mobile, and reduced-motion behavior.

### Task 3: Verification

**Files:**
- Review all changed files.

- [ ] Run `npm.cmd test`.
- [ ] Run `npm.cmd run build`.
- [ ] Start or verify the local dev server.
- [ ] Summarize changed files and explain how scroll progress drives the animation.
