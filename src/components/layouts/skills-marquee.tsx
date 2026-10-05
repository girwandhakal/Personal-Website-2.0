"use client";

/**
 * Skills marquee — the drifting chip rows from uselayouts' Magnified Bento
 * (MIT), https://uselayouts.com, on their own: no card, no lens. Rows drift in
 * alternating directions and fade out at both edges.
 */

import { motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";

export type MarqueeChip = { id: string; label: string; icon: LucideIcon };

export function SkillsMarquee({ rows }: { rows: MarqueeChip[][] }) {
  const reduce = useReducedMotion();
  return (
    <div className="skills-marquee" aria-hidden="true">
      {rows.map((row, rowIndex) => (
        <motion.div
          key={`row-${rowIndex}`}
          className="flex w-max gap-4"
          animate={reduce ? undefined : { x: rowIndex % 2 === 0 ? ["0%", "-33.333%"] : ["-33.333%", "0%"] }}
          transition={{ duration: 34 + rowIndex * 5, ease: "linear", repeat: Infinity }}
        >
          {[...row, ...row, ...row].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={`${item.id}-${idx}`}
                className="flex w-fit items-center gap-2 whitespace-nowrap rounded-full border border-border/70 bg-background/50 px-4 py-2.5 text-sm text-muted-foreground"
              >
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </motion.div>
      ))}
    </div>
  );
}
