
import { profile } from "@/content/profile";
import { ScrollField } from "@/components/motion/scroll-field";

export function Hero() {
  return (
    <section className="hero-section section-band" id="hero" aria-labelledby="hero-title">
      <ScrollField />
      <div className="hero-grid">
        <div className="hero-copy">
          <h1 id="hero-title">{profile.headline}</h1>
          <p className="hero-subtitle">{profile.subheadline}</p>
        </div>
      </div>
    </section>
  );
}
