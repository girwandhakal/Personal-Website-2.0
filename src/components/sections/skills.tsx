import { Reveal } from "@/components/motion/reveal";
import { profile } from "@/content/profile";

export function Skills() {
  return (
    <section className="skills-section section-band border-t border-[var(--grey)]/20" id="skills" aria-labelledby="skills-title">
      <div className="section-inner flex flex-col items-center text-center gap-12">
        <Reveal>
          <h2 id="skills-title" className="text-5xl md:text-7xl font-extrabold tracking-tighter">Skills & Toolkit</h2>
        </Reveal>
        <Reveal className="skill-cloud justify-center max-w-4xl" delay={0.08}>
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
