"use client";

import { FlaskConical, House, Landmark, ShoppingBasket, type LucideIcon } from "lucide-react";

import { LiquidIndex, type LiquidIndexItem } from "@/components/layouts/liquid-index";
import { profile } from "@/content/profile";

/** Per-company badge: an icon and the palette its liquid gradient is mixed from. */
const BADGES: Record<string, { icon: LucideIcon; seed: number; colors: [number, number, number][] }> = {
  "Shipt": { icon: ShoppingBasket, seed: 648, colors: [[0, 0, 26], [41, 98, 255], [64, 188, 255]] },
  "Alabama Life Research Institute": { icon: FlaskConical, seed: 516, colors: [[18, 10, 36], [124, 58, 237], [255, 139, 209]] },
  "Alabama Credit Union": { icon: Landmark, seed: 884, colors: [[6, 19, 13], [0, 200, 83], [182, 255, 106]] },
  "RoomiCheck": { icon: House, seed: 732, colors: [[22, 11, 0], [255, 138, 0], [255, 193, 79]] }
};

const FALLBACK = { icon: Landmark, seed: 291, colors: [[11, 16, 32], [51, 65, 85], [148, 163, 184]] as [number, number, number][] };

const items: LiquidIndexItem[] = profile.experience.map((exp) => {
  const badge = BADGES[exp.company] ?? FALLBACK;
  return {
    title: exp.company,
    meta: `${exp.role} · ${exp.period}`,
    description: exp.description,
    ...badge
  };
});

export function Resume() {
  return <section className="experience-section section-inner section-space" id="experience" aria-labelledby="experience-title">
    <div className="section-label-row section-label-row--flush">
      <h2 id="experience-title" className="section-label">Experience</h2>
      <span className="section-label-hint" aria-hidden="true">Hover a role</span>
    </div>
    <LiquidIndex items={items} />
  </section>;
}
