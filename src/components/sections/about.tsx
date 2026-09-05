import { ArrowUpRight } from "lucide-react";
import { profile } from "@/content/profile";

export function About() {
  return <section className="about-section section-inner section-space" id="about" aria-labelledby="about-title">
    <h2 id="about-title">About</h2>
    <div className="about-body">
      <p className="about-lead">I build AI systems.<br /><span>From research to production.</span></p>
      <p className="about-summary">Computer Science at The University of Alabama.<br />Agentic AI, applied ML, and language research.</p>
      <div className="about-links"><a className="text-link" href={profile.resumeHref} target="_blank" rel="noopener noreferrer">Résumé <ArrowUpRight size={18} aria-hidden="true" /></a></div>
    </div>
  </section>;
}
