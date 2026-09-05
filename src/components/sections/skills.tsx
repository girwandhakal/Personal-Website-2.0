import { profile } from "@/content/profile";
import { SkillsSphere } from "./skills-sphere";

export function Skills() {
  return <section className="skills-section section-inner section-space" id="skills" aria-labelledby="skills-title">
    <h2 id="skills-title">Toolkit</h2>
    <div className="toolkit-body"><SkillsSphere skills={profile.skills} /></div>
  </section>;
}
