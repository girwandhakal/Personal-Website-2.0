"use client";

import Image from "next/image";
import { motion } from "motion/react";

/**
 * The layered portrait treatment, shared by the full-screen intro and the hero
 * background so both stay in step.
 *
 * - The focus pull is a cross-fade between a permanently-blurred copy and a sharp
 *   copy, not an animated `blur()`. Animating a blur radius repaints a large
 *   element every frame; cross-fading two already-rasterised layers is
 *   compositor-only and reads identically, since both are visible mid-transition
 *   which is exactly how a lens rack looks.
 * - The duotone is CSS (`screen` for the shadow end, `multiply` for the highlight
 *   end) rather than baked into the file, so the grade itself is animatable: the
 *   cool machine-vision pass and the settled palette are one stack at different
 *   opacities.
 * - The scan layers are always rendered so server and client markup agree. CSS
 *   drops them under `prefers-reduced-motion` — branching the markup on the
 *   preference instead would be a hydration mismatch, since the server can't know
 *   it and would always emit the motion variant.
 */

export interface PlateTiming {
  /** Blur -> sharp cross-fade. */
  focus: number;
  focusDelay: number;
  /** Slow dolly-in: starting scale, easing back to 1. */
  pushFrom: number;
  push: number;
  /** How long the cool machine-vision grade takes to resolve away. */
  scan: number;
  /** Single top-to-bottom sweep. */
  sweep: number;
}

export const PLATE_EASE = [0.16, 1, 0.3, 1] as const;

interface PortraitPlateProps {
  /** Owns size, position, mask and `isolation` — the plate only handles layers. */
  className: string;
  sizes: string;
  timing: PlateTiming;
  alt?: string;
  priority?: boolean;
}

export function PortraitPlate({ className, sizes, timing, alt = "", priority = true }: PortraitPlateProps) {
  return (
    <motion.div
      className={className}
      initial={{ scale: timing.pushFrom }}
      animate={{ scale: 1 }}
      transition={{ duration: timing.push, ease: PLATE_EASE }}
    >
      <Image className="portrait-img portrait-img-soft" src="/girwan-headshot.png" alt="" fill sizes={sizes} priority={priority} />
      <motion.div
        className="portrait-sharp"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: timing.focus, delay: timing.focusDelay, ease: PLATE_EASE }}
      >
        <Image className="portrait-img" src="/girwan-headshot.png" alt={alt} fill sizes={sizes} priority={priority} />
      </motion.div>

      {/* Palette grade — the settled look. */}
      <span className="portrait-tint portrait-tint-shadow" />
      <span className="portrait-tint portrait-tint-highlight" />
      <span className="portrait-tint portrait-tint-accent" />
      {/* Crushes the bright out-of-focus office that survives the grade as a halo
          around the head, without touching the face. */}
      <span className="portrait-tint portrait-vignette" />

      {/* Machine-vision pass — present on arrival, gone once the face resolves. */}
      <motion.span
        className="portrait-tint portrait-scan"
        initial={{ opacity: 0.55 }}
        animate={{ opacity: 0 }}
        transition={{ duration: timing.scan, ease: "easeOut" }}
      />
      <motion.span
        className="portrait-scanlines"
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 0 }}
        transition={{ duration: timing.scan * 0.88, delay: 0.15, ease: "easeOut" }}
      />
      <motion.span
        className="portrait-sweep"
        initial={{ y: "-100%", opacity: 0 }}
        animate={{ y: "100%", opacity: [0, 1, 1, 0] }}
        transition={{ duration: timing.sweep, ease: [0.33, 0, 0.2, 1], times: [0, 0.12, 0.8, 1] }}
      />
    </motion.div>
  );
}
