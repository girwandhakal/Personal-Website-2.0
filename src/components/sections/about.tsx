import { Reveal } from "@/components/motion/reveal";
import { profile } from "@/content/profile";

export function About() {
  return (
    <section className="about-section section-band" id="about" aria-labelledby="about-title">
      <div className="section-inner split-layout">
        <Reveal>
          <p className="eyebrow">About</p>
          <h2 id="about-title">I make software feel considered from the first tap.</h2>
        </Reveal>
        <Reveal className="about-copy" delay={0.1}>
          <p>
            I care about interfaces that are fast, useful, and unmistakably crafted. My work sits at
            the intersection of product thinking, front-end engineering, and pragmatic full-stack
            delivery.
          </p>
          <p>
            For recruiters, the short version is simple: I can take ambiguous requirements, shape
            them into a clear product direction, and ship the working software with polish.
          </p>
          <div className="proof-strip">
            {profile.proof.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
