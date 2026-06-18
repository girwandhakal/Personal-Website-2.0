# Cinematic Intro Design

## Goal

Add a scroll-driven cinematic introduction before the existing portfolio content. The intro should feel like a polished entrance to meeting Girwan without turning the entire website into an animated experience.

## Scope

- Add one dedicated `CinematicIntro` component before the existing `Hero`.
- Keep existing homepage sections intact after the intro.
- Use the existing `motion` package with `useScroll`, `useTransform`, and `useReducedMotion`.
- Add lightweight local SVG assets that match the current black, orange, white, grey, and crimson palette.
- Preserve accessibility, keyboard navigation, mobile usability, and reduced-motion support.

## Scroll Beats

1. Quiet opening screen with a cinematic dark stage and a small signal line.
2. Strong name reveal with large typography.
3. Tagline and identity statement reveal.
4. Code, data, AI, research, and engineering motifs move at separate parallax depths.
5. Smooth handoff that fades the intro into the existing normal hero/about flow.

## Architecture

`CinematicIntro` owns all scroll-linked animation logic. It renders a tall wrapper with a sticky viewport-height stage and maps section-local scroll progress to transform and opacity values. Decorative layers are `aria-hidden`; visible text uses semantic headings and readable copy.

The existing `Hero` remains the normal portfolio hero and starts after the cinematic intro. Global CSS gets scoped classes for the intro and mobile/reduced-motion rules.

## Acceptance Criteria

- The first homepage section is a scroll-driven cinematic intro.
- The animation is tied to section scroll progress.
- The intro contains 3-5 clear beats.
- Existing content remains preserved and usable after the intro.
- Reduced-motion users see a simple static intro.
- The site remains accessible and builds without errors.
