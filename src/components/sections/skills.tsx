import { Reveal } from "@/components/motion/reveal";
import { profile } from "@/content/profile";

export function Skills() {
  return (
    <section className="skills-section section-band" id="skills" aria-labelledby="skills-title">
      <div className="section-inner split-layout">
        <Reveal>
          <p className="eyebrow">Toolkit</p>
          <h2 id="skills-title">A stack for shipping beautiful things without losing the plot.</h2>
        </Reveal>
        <Reveal className="skill-cloud" delay={0.08}>
          {profile.skills.map((skill, index) => (
            <span key={skill} style={{ "--i": index } as React.CSSProperties}>
              {skill}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
