import { ArrowUpRight } from "lucide-react";
import { profile } from "@/content/profile";

export function About() {
  return <section className="about-section section-inner section-space" id="about" aria-label="About Girwan Dhakal">
    <div className="about-body">
      <p className="about-lead">I build AI systems.<br /><span>From research to production.</span></p>
      <div className="about-links"><a className="button button-primary" href={profile.resumeHref} target="_blank" rel="noopener noreferrer">Résumé <ArrowUpRight size={20} aria-hidden="true" /></a></div>
    </div>
  </section>;
}
