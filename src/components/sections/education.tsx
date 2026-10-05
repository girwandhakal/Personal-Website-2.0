import { profile } from "@/content/profile";

export function Education() {
  return <section className="education-section section-inner section-space" id="education" aria-labelledby="education-title">
    <div className="section-label-row section-label-row--flush">
      <h2 id="education-title" className="section-label">Education</h2>
    </div>
    <div className="education-list">
      {profile.education.map((edu) => (
        <div className="education-item" key={edu.degree}>
          <p className="education-degree">{edu.degree}</p>
          <p className="education-meta">{edu.institution} · {edu.location}</p>
          <p className="education-meta">{edu.period}</p>
        </div>
      ))}
    </div>
  </section>;
}
