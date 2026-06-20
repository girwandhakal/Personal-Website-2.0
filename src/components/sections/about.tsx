import { Reveal } from "@/components/motion/reveal";
import { profile } from "@/content/profile";
import { Download } from "lucide-react";

export function About() {
  return (
    <section className="about-section section-band" id="about" aria-labelledby="about-title">
      <div className="section-inner flex flex-col items-center text-center gap-12">
        <Reveal>
          <h2 id="about-title" className="text-5xl md:text-7xl font-extrabold tracking-tighter">About Me</h2>
        </Reveal>
        <Reveal className="about-copy max-w-3xl" delay={0.1}>
          <p>
            I enjoy building practical systems at the intersection of software engineering, machine learning, and research. I like taking ambiguous problems, shaping them into clear technical directions, and shipping polished results.
          </p>
          <div className="proof-strip mt-10 text-left w-full mx-auto flex flex-col">
            {profile.proof.map((item) => (
              <span key={item}>{item}</span>
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
