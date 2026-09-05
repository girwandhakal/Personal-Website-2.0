import { Plus } from "lucide-react";
import { profile } from "@/content/profile";

export function Resume() {
  return <>
    <section className="experience-section section-inner section-space" id="resume" aria-labelledby="experience-title">
      <h2 id="experience-title">Experience</h2>
      <div className="experience-list">{profile.experience.map(exp => <details className="experience-item" key={exp.company}>
        <summary><span><strong>{exp.company}</strong><span className="experience-role">{exp.role}</span></span><span className="experience-period">{exp.period}</span><Plus size={20} aria-hidden="true" /></summary>
        <div className="experience-detail"><p>{exp.description}</p><span>{exp.location}</span></div>
      </details>)}</div>
    </section>
    <section className="education-section section-inner section-space" id="education" aria-labelledby="education-title">
      <h2 id="education-title">Education</h2>
      <div className="education-list">{profile.education.map(edu => <div className="education-item" key={edu.degree}>
        <h3>{edu.degree.startsWith("Master") ? "M.S. Computer Science" : "B.S. Computer Science"}</h3><p>{edu.institution}</p><span>{edu.period}</span>
      </div>)}</div>
    </section>
  </>;
}
