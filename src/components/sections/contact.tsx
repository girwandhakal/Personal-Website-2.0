import { Reveal } from "@/components/motion/reveal";
import { ContactForm } from "@/components/sections/contact-form";
import { profile } from "@/content/profile";

export function Contact() {
  return (
    <section
      className="contact-section section-band"
      id="contact"
      aria-labelledby="contact-title"
    >
      <div className="section-inner flex flex-col items-center text-center gap-12">
        <Reveal>
          <h2 id="contact-title" className="text-5xl md:text-7xl font-extrabold tracking-tighter">Contact</h2>
          
          <div className="social-row flex justify-center gap-8 mt-10">
            {profile.socials.map(({ label, href, icon }) => {
              return (
                <a key={label} href={href} aria-label={label} className="opacity-70 hover:opacity-100 transition-all transform hover:scale-110">
                  <img aria-hidden="true" src={`/assets/icons/${icon}.svg`} alt="" width="36" height="36" />
                </a>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={0.1} className="w-full max-w-xl mx-auto">
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
