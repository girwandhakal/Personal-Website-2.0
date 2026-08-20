import { Reveal } from "@/components/motion/reveal";
import { profile } from "@/content/profile";
import { Download } from "lucide-react";

export function About() {
  return (
    <section className="about-section section-band border-t border-ink/15" id="about" aria-labelledby="about-title">
      <div className="section-inner flex flex-col items-center text-center gap-12">
        <Reveal>
          <h2 id="about-title">About Me</h2>
        </Reveal>
        <Reveal className="about-copy max-w-3xl" delay={0.1}>
          <p>
            I am a Computer Science researcher and engineer specializing in <strong>Agentic Engineering, Artificial Intelligence, and Data Science</strong>. I build LLM systems that survive contact with production — retrieval agents, OCR data pipelines, and the evaluation tooling that keeps them honest — and I publish research on the modeling side. Across internships at Shipt and Alabama Credit Union and two years of machine learning research, that work has halved engineer onboarding time, surfaced five figures in annual savings, and reached peer review.
          </p>
          <div className="mt-12 flex flex-col gap-8 text-left w-full mx-auto max-w-2xl">
            {profile.proof.map((item, i) => (
              <div key={i} className="pl-6 border-l-[3px] border-ink/15 hover:border-accent transition-colors duration-300">
                <span className="text-ink/75 hover:text-ink transition-colors duration-300 leading-relaxed text-[17px] md:text-lg block">
                  {item}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <a className="button button-primary" href={profile.secondaryCta.href} target="_blank" rel="noopener noreferrer">
              Get my resume
              <Download aria-hidden="true" size={20} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
