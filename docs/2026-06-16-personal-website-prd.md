# Personal Website Product Requirements Document

**Date:** 2026-06-16

**Owner:** Girwan Dhakal

**Document Type:** Product requirements + technical specification

## 1. Product Summary

Build a visually distinctive personal website that feels playful, interactive, and highly memorable while still optimizing for hiring outcomes. The site should present Girwan as a capable builder with personality, strong project taste, and attention to detail.

The website must avoid generic portfolio patterns. It should use a bold visual system, smooth scroll-driven interactions, and custom assets so the final result feels authored rather than templated. Despite the expressive design, the site must remain easy to scan for recruiters and fast to load on both desktop and mobile.

## 2. Primary Goal

The primary goal is to help Girwan get hired.

The site should:
- Make a strong first impression within the first 5 seconds
- Lead visitors quickly to projects, resume, and contact information
- Communicate personality without reducing credibility
- Demonstrate front-end craft through interaction quality, motion, and polish

## 3. Audience

Primary audience:
- Recruiters
- Hiring managers
- Engineers or founders evaluating portfolio quality

Secondary audience:
- Peers who may share the site
- Potential collaborators

## 4. Product Positioning

This site is not just a resume on the web. It is a personal brand artifact that shows technical ability through the product itself.

Positioning statement:

"A playful, high-craft personal website that showcases software projects, design taste, and front-end engineering ability in a way that is memorable and hiring-focused."

## 5. Scope

### In Scope For V1

- Single-page portfolio website
- Scroll-driven interactive experience
- Hero, about, projects, skills, resume, and contact sections
- Reusable motion system for section reveals and hover states
- Custom visual asset system
- Responsive layout for desktop and mobile
- Minimal contact form handling
- SEO and sharing metadata

### Out Of Scope For V1

- Blog
- CMS
- Authentication
- Dashboard/admin tools
- Full case-study subpages
- Complex backend or database
- Analytics beyond simple future instrumentation hooks

## 6. Information Architecture

### Site Structure

1. Hero
2. About
3. Selected Projects
4. Skills / Toolkit
5. Resume / Proof
6. Contact

### Navigation Model

- Single-page scroll experience
- Sticky or adaptive top navigation
- Section anchor navigation
- CTA paths from hero to projects, resume, and contact

### Future Expansion

Potential phase 2 additions:
- Dedicated project detail pages
- Writing/case studies
- Experimental playground

## 7. Visual Direction

### Brand Tone

- Playful
- Expressive
- Crafted
- Bold
- Slightly experimental
- Still professional enough for recruiters

### Color Palette

Source: [color.txt](C:\Users\g_dha\OneDrive - The University of Alabama\Projects\Personal Website 2.0\docs\color.txt)

- `#0a0908` - primary background / near-black
- `#faa916` - primary accent / energy color
- `#fbfffe` - primary text / off-white
- `#6d676e` - muted neutral / secondary text
- `#96031a` - emphasis / dramatic contrast

### Font

Use one font across the entire site:

- `Baloo 2`

Reasoning:
- Playful and rounded without becoming childish
- Distinctive enough to support a memorable brand
- Readable enough for headings, buttons, and body copy when used carefully
- Easy to self-host using Next.js font optimization

### Visual Principles

- Strong silhouette and contrast
- Large display typography in hero
- Intentional asymmetry where useful
- Rich backgrounds using texture, gradients, shapes, and layering
- Distinct section identities while preserving one coherent system
- Avoid default corporate portfolio aesthetics

## 8. Interaction Design

### Core Interaction Model

The page uses scrolling as the primary interaction system. Motion should create rhythm, reveal hierarchy, and increase memorability without harming readability.

### Animation Principles

- Motion supports content, not decoration for its own sake
- Hero receives the largest animation budget
- Projects receive the second largest animation budget
- Repeated loops should be minimal
- Scroll-linked motion should feel smooth and physically coherent
- Mobile should simplify effect complexity
- Reduced-motion users must get equivalent static access to content

### Planned Motion Patterns

- Staggered text reveals
- Section fade/slide entrances
- Parallax background shapes
- Scroll progress indicators
- Hover transformations for project cards and buttons
- Masked or clipped heading reveals
- Layered depth shifts using scale, blur, and opacity

### Section-Level Motion Concepts

#### Hero

- Large headline reveal
- Animated abstract shape field in background
- Scroll cue
- CTA emphasis motion

#### About

- Soft reveal of intro content
- Subtle background motion or shape drift

#### Projects

- Card entrance choreography
- Hover transitions showing preview depth
- Optional scroll-linked featured project emphasis

#### Skills

- Playful badge/grid interaction
- Lightweight hover behavior

#### Resume / Proof

- Cleaner motion with less visual noise
- Resume CTA emphasis animation

#### Contact

- Calm, direct presentation
- Lightweight form feedback states

## 9. Functional Requirements

### FR-1: Hero

The homepage must include:
- Full-screen or near-full-screen hero
- Name
- Short positioning statement
- Primary CTA to projects
- Secondary CTA to resume
- Animated background system

### FR-2: About

The site must include:
- Short personal summary
- Clear explanation of what Girwan builds or values
- Content optimized for quick scanning

### FR-3: Projects

The site must include:
- A curated list of selected projects
- Title, summary, tech stack, and external/internal links per project
- Visual preview treatment per project
- Clear hierarchy so the best work stands out first

### FR-4: Skills

The site must include:
- Compact overview of technical skills and tools
- Presentation that avoids generic resume keyword dumping

### FR-5: Resume / Proof

The site must include:
- Downloadable resume link
- Short credibility/proof elements
- Fast access for recruiters

### FR-6: Contact

The site must include:
- Email link
- Social/profile links
- Minimal contact form with name, email, and message

### FR-7: SEO

The site must include:
- Metadata title and description
- Open Graph image
- Favicon
- Sitemap
- Robots metadata/file
- Semantic heading structure

### FR-8: Responsiveness

The site must work cleanly on:
- Mobile
- Tablet
- Desktop

### FR-9: Accessibility

The site must include:
- Keyboard-navigable controls
- Sufficient contrast
- Reduced motion fallback
- Semantic HTML landmarks
- Focus-visible states

## 10. Non-Functional Requirements

### Performance

- Fast initial load on modern mobile and desktop devices
- Keep animation work primarily on transform and opacity
- Avoid large JavaScript payloads for non-interactive sections
- Optimize all images and textures
- Avoid layout thrashing during scroll

### Reliability

- Contact form should fail gracefully
- External links and CTAs must remain functional without animation

### Maintainability

- Separate content from UI where practical
- Build reusable animation primitives instead of one-off motion code in every section
- Keep section components focused and isolated

### Scalability

- Architecture should allow easy addition of project detail pages in a future phase
- Content model should support more projects without redesigning the site structure

## 11. Technical Specification

### Recommended Stack

- `Next.js 16` with App Router
- `React 19`
- `TypeScript`
- `Tailwind CSS`
- `Motion`
- `next/font/google`
- `Vercel` deployment target

### Stack Decision Rationale

`Next.js` is the recommended framework because it provides strong performance defaults, built-in routing, metadata handling, image and font optimization, and a minimal server surface for a contact form. Its App Router structure also fits a modern componentized frontend well.

`Motion` is the recommended animation library because the site requires coordinated scroll-linked interactions, transform mapping, and reusable motion primitives that go beyond simple CSS transitions.

This stack is preferred over Astro for this specific project because the entire homepage is intended to behave like an interactive narrative rather than a mostly static site with isolated islands of interactivity.

### Documentation Basis For Stack Choice

Framework and library recommendation is based on current official documentation reviewed on 2026-06-16:

- Next.js App Router project structure: https://nextjs.org/docs/app/getting-started/project-structure
- Next.js font optimization: https://nextjs.org/docs/app/getting-started/fonts
- Next.js route handlers: https://nextjs.org/docs/app/api-reference/file-conventions/route
- Motion `useScroll`: https://motion.dev/docs/react-use-scroll
- Motion `useTransform`: https://motion.dev/docs/react-use-transform
- Astro islands architecture reference used for comparison: https://docs.astro.build/en/concepts/islands/
- Astro view transitions reference used for comparison: https://docs.astro.build/en/guides/view-transitions/
- Vite architecture reference used for comparison: https://vite.dev/guide/why

### Rendering Strategy

- Default to static rendering for the page shell and content-heavy areas
- Use client components only where interaction or animation logic requires it
- Keep scroll-based animation logic scoped to the components that need it

### Contact Handling Strategy

Initial V1 approach:
- Use `src/app/api/contact/route.ts`
- Accept `POST` submissions from the contact form
- Validate required fields
- Return success/error JSON

Delivery options after implementation:
- Temporary no-op/mock handler for UI completion
- Email provider integration such as Resend in a future phase
- Serverless forwarding workflow in a future phase if needed

### Proposed File Structure

```text
src/
  app/
    layout.tsx
    page.tsx
    api/
      contact/
        route.ts
  components/
    layout/
    motion/
    sections/
    ui/
  content/
    profile.ts
    projects.ts
    resume.ts
  lib/
    animation.ts
    validation.ts
  styles/
    globals.css
public/
  assets/
    textures/
    shapes/
    icons/
    images/
```

### Component Boundaries

- `sections/` contains major homepage sections
- `motion/` contains reusable scroll and reveal wrappers
- `ui/` contains lower-level shared visual primitives
- `content/` contains typed data for profile and projects
- `lib/` contains helpers such as validation and animation constants

### Styling Strategy

- Tailwind CSS for layout, spacing, and utility styling
- CSS variables for palette tokens and design system values
- Use a small number of custom utility classes for reusable gradients, texture overlays, and special heading treatments

### Asset Strategy

- Prefer SVG for geometric/vector assets
- Prefer WebP or AVIF for raster images where needed
- Generate custom abstract assets to support brand identity
- Keep visual system coherent across hero, project cards, and share images

## 12. Asset Inventory

The implementation should include the following asset set.

### Required Brand/System Assets

- Favicon
- App/site icon variants
- Open Graph image
- Social preview image template
- Background texture or grain overlay
- Abstract geometric shape set

### Required UI Assets

- Social icons
- Resume/download indicator graphic
- Section divider or accent motifs
- Project thumbnail frames or seed preview treatments

### Optional Enhancement Assets

- Animated decorative SVG accents
- Custom cursor treatment if it remains accessible
- Lightweight sticker-style badges

## 13. Content Requirements

The build will require the following content inputs from Girwan during implementation:

- Final name formatting
- Headline / personal positioning line
- About paragraph
- Selected project list
- Project summaries
- Project links
- Resume file
- Email address
- Social/profile URLs

If complete content is not yet available, the site should be built with clearly typed seed content that is easy to replace.

## 14. UX Success Criteria

The site is successful if:

- A recruiter can understand who Girwan is and what he builds within seconds
- Projects are easy to find and evaluate
- Resume access is obvious
- Contact path is frictionless
- The site feels more memorable than a generic portfolio
- Motion feels smooth rather than excessive

## 15. Milestones

### Milestone 1: Foundation

- Scaffold project
- Set up layout, theme tokens, font, and baseline structure

### Milestone 2: Core Sections

- Build hero, about, projects, skills, resume, and contact sections

### Milestone 3: Motion System

- Implement reusable reveals, parallax, and hover effects
- Tune mobile and reduced-motion fallbacks

### Milestone 4: Asset Pass

- Create and integrate custom textures, icons, shapes, and OG image

### Milestone 5: Final Polish

- Accessibility pass
- Performance pass
- SEO pass
- Responsive QA

## 16. Risks And Mitigations

### Risk: Too Much Motion

The site could become distracting or reduce hiring clarity.

Mitigation:
- Keep strongest effects in hero and projects
- Reduce motion density elsewhere
- Review each section against content readability

### Risk: Playfulness Undermines Professionalism

The site could feel gimmicky instead of credible.

Mitigation:
- Preserve strong typography hierarchy
- Keep copy direct and useful
- Ensure projects and resume remain easy to access

### Risk: Performance Regressions

Heavy assets and scroll logic could hurt responsiveness.

Mitigation:
- Static-first rendering
- Optimized assets
- Restrained hydration
- Transform/opacity-first animation

### Risk: Missing Content Delays Build Completion

Mitigation:
- Use typed seed content first
- Keep content separated from section components

## 17. Open Decisions For Implementation

These are implementation-time decisions, not product blockers:

- Whether the contact form ships with a live email service in v1 or a temporary mocked endpoint
- Whether project previews use screenshots, generated frames, or mixed media
- Whether the navigation is always visible or becomes visible after initial scroll

## 18. Final Recommendation

Proceed with a `Next.js 16 + React 19 + TypeScript + Tailwind CSS + Motion` implementation using `Baloo 2` as the only font and the approved palette from `docs/color.txt`.

Build V1 as a single-page, scroll-led portfolio optimized for hiring outcomes, with custom assets and a strong hero/project presentation. Keep the backend minimal and treat performance, accessibility, and interaction quality as first-class requirements.
