import { ArrowUpRight } from "lucide-react";
import { profile } from "@/content/profile";
import { AIPreview } from "./ai-preview";
import { HeroPortrait } from "./hero-portrait";

export function Hero() {
  return <section className="hero-section section-inner" id="hero" aria-labelledby="hero-title">
    <HeroPortrait />
    <div className="hero-copy">
      <h1 id="hero-title"><span>Girwan</span><span>Dhakal</span></h1>
      <p className="hero-subtitle">ML Engineer &amp; Researcher</p>
      <div className="hero-actions">
        <a className="button button-primary" href="#projects">Work <ArrowUpRight size={20} aria-hidden="true" /></a>
        <a className="button button-secondary" href={profile.resumeHref} target="_blank" rel="noopener noreferrer">Résumé <ArrowUpRight size={20} aria-hidden="true" /></a>
      </div>
    </div>
    <AIPreview />
  </section>;
}
