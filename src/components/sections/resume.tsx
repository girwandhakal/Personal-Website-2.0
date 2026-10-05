"use client";

import { House } from "lucide-react";

import { FocusText, type FocusTextItem } from "@/components/layouts/focus-text";
import { profile } from "@/content/profile";

// The institute sits within the university, so it carries the UA logo.
const LOGOS: Record<string, string> = {
  "Shipt": "/media/logos/shipt.svg",
  "Alabama Life Research Institute": "/media/logos/university-of-alabama.svg",
  "Alabama Credit Union": "/media/logos/alabama-credit-union.png"
};

function Badge({ company }: { company: string }) {
  const logo = LOGOS[company];
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <span className="flex size-full items-center justify-center bg-white p-[18%]"><img src={logo} alt="" draggable={false} className="max-h-full w-full object-contain" /></span>;
  }
  return <span className="flex size-full items-center justify-center bg-gradient-to-br from-[#ff8a00] to-[#ffc14f] text-[#2a1600]"><House className="size-1/2" aria-hidden="true" /></span>;
}

const items: FocusTextItem[] = profile.experience.map((exp) => ({
  id: exp.company,
  title: exp.company,
  meta: `${exp.role} · ${exp.period}`,
  text: exp.description,
  badge: <Badge company={exp.company} />
}));

export function Resume() {
  return <section className="experience-section section-inner section-space" id="experience" aria-labelledby="experience-title">
    <div className="section-label-row section-label-row--flush">
      <h2 id="experience-title" className="section-label">Experience</h2>
      <span className="section-label-hint" aria-hidden="true">Hover a role</span>
    </div>
    <FocusText items={items} />
  </section>;
}
