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
      <div className="section-inner contact-grid">
        <Reveal>
          <p className="eyebrow">Contact</p>
          <h2 id="contact-title">Have a role where the details matter?</h2>
          <p className="contact-lede">
            Send a note, review the work, or use the direct email path. The form is ready for email
            provider wiring when deployment details are final.
          </p>
          <div className="social-row">
            {profile.socials.map(({ label, href, icon }) => {
              return (
                <a key={label} href={href} aria-label={label}>
                  <img aria-hidden="true" src={`/assets/icons/${icon}.svg`} alt="" width="20" height="20" />
                </a>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
