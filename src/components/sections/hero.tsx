import { Fragment } from "react";
import { ArrowRight, Download } from "lucide-react";

import { profile } from "@/content/profile";
import { ScrollField } from "@/components/motion/scroll-field";

export function Hero() {
  return (
    <section className="hero-section section-band" id="hero" aria-labelledby="hero-title">
      <ScrollField />
      <div className="hero-grid">
        <div className="hero-copy">
          {/* Each word rides up from behind its own clipping mask on load.
              Driven by CSS so it plays on first paint rather than waiting for
              hydration, and so the name can never be left invisible if the JS
              never arrives. */}
          <h1 id="hero-title">
            {profile.headline.split(" ").map((word, i) => (
              <Fragment key={word}>
                {/* A real space, not a margin — otherwise the heading reads as
                    one run-together word to screen readers and copy/paste. */}
                {i > 0 ? " " : null}
                <span className="hero-word" style={{ "--word-index": i } as React.CSSProperties}>
                  <span>{word}</span>
                </span>
              </Fragment>
            ))}
          </h1>
          <p className="hero-subtitle hero-rise">{profile.subheadline}</p>

          {/* The hero previously ended at the subtitle, leaving no action above
              the fold on any viewport. */}
          <div className="hero-actions hero-rise">
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
    </section>
  );
}
