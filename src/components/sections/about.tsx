import { PerspectiveText } from "@/components/layouts/perspective-text";
import { profile } from "@/content/profile";

export function About() {
  return <section className="about-section" id="about" aria-labelledby="about-title">
    <div className="section-inner section-label-row">
      <h2 id="about-title" className="section-label">About</h2>
      <span className="section-label-hint" aria-hidden="true">Keep scrolling</span>
    </div>
    <PerspectiveText height="160vh" textClassName="about-perspective">
      <p>{profile.about}</p>
    </PerspectiveText>
  </section>;
}
