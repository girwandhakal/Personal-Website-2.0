# Personal Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playful, hiring-focused, scroll-led personal website for Girwan Dhakal.

**Architecture:** A static-first Next.js App Router site with typed content files, isolated section components, reusable motion wrappers, generated local assets, and a minimal contact route. Animation-heavy UI is scoped to client components while metadata and content remain server-rendered.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Motion, Vitest, Testing Library, jest-axe.

---

### Task 1: Project Foundation And Tests

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Create: `src/app/api/contact/route.ts`
- Create: `src/styles/globals.css`
- Create: `src/content/profile.ts`
- Create: `src/content/projects.ts`
- Create: `src/lib/contact.ts`
- Create: `src/lib/metadata.ts`
- Create: `src/lib/animation.ts`
- Create: `src/__tests__/content.test.ts`
- Create: `src/__tests__/contact.test.ts`
- Create: `src/__tests__/page-accessibility.test.tsx`

- [ ] Write tests that assert required content, contact validation, and page accessibility.
- [ ] Run tests and confirm they fail before production implementation exists.
- [ ] Add minimal app foundation, content, validation, and metadata.
- [ ] Run tests until they pass.

### Task 2: Mindblowing Homepage UI

**Files:**
- Create: `src/components/layout/site-nav.tsx`
- Create: `src/components/motion/reveal.tsx`
- Create: `src/components/motion/scroll-field.tsx`
- Create: `src/components/sections/hero.tsx`
- Create: `src/components/sections/about.tsx`
- Create: `src/components/sections/projects.tsx`
- Create: `src/components/sections/skills.tsx`
- Create: `src/components/sections/resume.tsx`
- Create: `src/components/sections/contact.tsx`
- Create: `src/components/ui/project-card.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/styles/globals.css`

- [ ] Write section rendering and accessibility tests.
- [ ] Run tests and confirm missing sections fail.
- [ ] Build immersive sections with scroll animations, responsive layout, keyboard states, and reduced-motion fallbacks.
- [ ] Run tests and build verification.

### Task 3: Asset System And Polish

**Files:**
- Create: `public/assets/textures/grain.svg`
- Create: `public/assets/shapes/kinetic-mark.svg`
- Create: `public/assets/shapes/project-frame.svg`
- Create: `public/assets/icons/github.svg`
- Create: `public/assets/icons/linkedin.svg`
- Create: `public/assets/icons/mail.svg`
- Create: `src/app/icon.svg`
- Create: `src/app/opengraph-image.tsx`
- Modify: `src/components/sections/hero.tsx`
- Modify: `src/components/sections/projects.tsx`
- Modify: `src/styles/globals.css`

- [ ] Write tests/assertions for metadata and generated share assets.
- [ ] Run tests and confirm missing assets fail.
- [ ] Generate and integrate custom SVG assets plus dynamic Open Graph image.
- [ ] Run tests, build, and manual UI review.

### Task 4: Independent Accessibility And UI Review

**Files:**
- Review all created source files.

- [ ] Spawn a subagent to review accessibility, ease of use, responsive behavior, and visual element correctness.
- [ ] Apply any necessary fixes.
- [ ] Run final verification commands.
