import { ArrowDownToLine, MapPin } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { profile } from "@/content/profile";

export function Resume() {
  return (
    <section className="resume-section section-band" id="resume" aria-labelledby="resume-title">
      <div className="section-inner">
        <Reveal className="section-heading">
          <p className="eyebrow">Resume / Credentials</p>
          <h2 id="resume-title">A timeline of research engineering and data analytics.</h2>
        </Reveal>

        <div className="resume-layout-grid">
          {/* Work Experience */}
          <div className="resume-experience-column">
            <h3 className="resume-col-title">[ EXPERIENCE ]</h3>
            <div className="experience-list">
              {profile.experience.map((exp) => (
                <Reveal className="experience-item-card" key={exp.company + exp.role}>
                  <div className="item-dot" />
                  <div className="item-header">
                    <h4>{exp.role}</h4>
                    <span className="item-company">{exp.company}</span>
                  </div>
                  <div className="item-meta">
                    <span className="item-period">{exp.period}</span>
                    <span className="item-location">
                      <MapPin aria-hidden="true" size={12} style={{ display: "inline", marginRight: "4px" }} />
                      {exp.location}
                    </span>
                  </div>
                  <ul className="item-bullets">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Education & Action Panel */}
          <div className="resume-education-column">
            <h3 className="resume-col-title">[ EDUCATION ]</h3>
            <div className="education-list">
              {profile.education.map((edu) => (
                <Reveal className="education-item-card" key={edu.degree}>
                  <div className="item-dot" />
                  <div className="item-header">
                    <h4>{edu.degree}</h4>
                    <span className="item-institution">{edu.institution}</span>
                  </div>
                  <div className="item-meta">
                    <span className="item-period">{edu.period}</span>
                    <span className="item-location">
                      <MapPin aria-hidden="true" size={12} style={{ display: "inline", marginRight: "4px" }} />
                      {edu.location}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Quick Actions Card */}
            <Reveal className="resume-actions-card">
              <div className="tile-corner top-left" />
              <div className="tile-corner top-right" />
              <div className="tile-corner bottom-left" />
              <div className="tile-corner bottom-right" />
              <h4>Download Print Version</h4>
              <p>Get the offline version of Girwan's resume for printing or indexing.</p>
              <a className="button button-primary" href={profile.resumeHref}>
                Download Resume
                <ArrowDownToLine aria-hidden="true" size={18} />
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
