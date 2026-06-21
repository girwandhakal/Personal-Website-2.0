import { Reveal } from "@/components/motion/reveal";
import { profile } from "@/content/profile";
import { Download } from "lucide-react";

export function About() {
  return (
    <section className="about-section section-band border-t border-[var(--grey)]/20" id="about" aria-labelledby="about-title">
      <div className="section-inner flex flex-col items-center text-center gap-12">
        <Reveal>
          <h2 id="about-title" className="text-5xl md:text-7xl font-extrabold tracking-tighter">About Me</h2>
        </Reveal>
        <Reveal className="about-copy max-w-3xl" delay={0.1}>
          <p>
            I am a Computer Science researcher and engineer specializing in <strong>Agentic Engineering, Artificial Intelligence, and Data Science</strong>. Drawing from my experience across high-growth tech internships and academic research, I love taking ambiguous problems and architecting intelligent, agentic software systems. 
          </p>
          <div className="mt-12 flex flex-col gap-8 text-left w-full mx-auto max-w-2xl">
            {profile.proof.map((item, i) => (
              <div key={i} className="pl-6 border-l-[3px] border-white/10 hover:border-accent/60 transition-colors duration-300">
                <span className="text-white/70 hover:text-white transition-colors duration-300 leading-relaxed text-[17px] md:text-lg block">
                  {item}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <a className="button button-primary" href={profile.secondaryCta.href} target="_blank" rel="noopener noreferrer">
              Get Resume
              <Download aria-hidden="true" size={20} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
