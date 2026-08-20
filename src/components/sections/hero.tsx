import { ArrowDown, ArrowRight, Download } from "lucide-react";

import { profile } from "@/content/profile";
import { ScrollField } from "@/components/motion/scroll-field";

export function Hero() {
  return (
    <section className="hero-section section-band" id="hero" aria-labelledby="hero-title">
      <ScrollField />
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="hero-kicker">
            <span aria-hidden="true">◆</span>
            Available for 2027 new-grad roles
          </p>
          <h1 id="hero-title">{profile.headline}</h1>
          <p className="hero-subtitle">{profile.subheadline}</p>

          {/* The hero previously ended at the subtitle, leaving no action above
              the fold on any viewport. */}
          <div className="hero-actions">
            <a className="button button-primary" href={profile.primaryCta.href}>
              {profile.primaryCta.label}
              <ArrowRight aria-hidden="true" size={20} />
            </a>
            <a
              className="button button-secondary"
              href={profile.secondaryCta.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {profile.secondaryCta.label}
              <Download aria-hidden="true" size={20} />
            </a>
          </div>
        </div>
      </div>

      <a className="scroll-cue" href="#about">
        Scroll
        <ArrowDown aria-hidden="true" size={14} />
      </a>
    </section>
  );
}
