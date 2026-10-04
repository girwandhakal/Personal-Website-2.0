"use client";

import { ArrowUpRight } from "lucide-react";

import { ContactForm } from "./contact-form";
import { HolographicCard } from "@/components/layouts/holographic-card";
import { StackedOutlineText } from "@/components/layouts/stacked-outline-text";
import { profile } from "@/content/profile";

export function Contact() {
  return <section className="contact-section section-space" id="contact" aria-labelledby="contact-title">
    <h2 id="contact-title" className="sr-only">Let&apos;s talk</h2>
    <StackedOutlineText text="LET'S TALK" className="contact-outline" />

    <div className="section-inner contact-grid">
      <div className="contact-card-col">
        <HolographicCard
          image="/media/portrait-tall.jpg"
          imageAlt="Portrait of Girwan Dhakal"
          ariaLabel="Girwan Dhakal — contact card"
          topLeft={<span className="contact-card-mark">GD</span>}
          topRight={<span className="font-serif text-base leading-none text-white/50">’27</span>}
          bottomLeft={<span className="truncate uppercase tracking-wide">Girwan Dhakal</span>}
          bottomRight={<span className="truncate font-serif text-base leading-none text-white/50">AI / ML</span>}
        />
        <div className="contact-links">
          <a className="contact-email text-link" href={`mailto:${profile.email}`}>{profile.email}<ArrowUpRight size={20} aria-hidden="true" /></a>
          <div className="contact-socials">
            {profile.socials.filter((s) => s.icon !== "mail").map((s) => (
              <a className="text-link" key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">{s.label}<ArrowUpRight size={16} aria-hidden="true" /></a>
            ))}
            <a className="text-link" href={profile.resumeHref} target="_blank" rel="noopener noreferrer">Résumé<ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
        </div>
      </div>

      <div className="contact-form-col">
        <p className="contact-lede">Have a role, a research idea, or a problem that needs an AI system? Send a note — it lands straight in my inbox.</p>
        <ContactForm />
      </div>
    </div>
  </section>;
}
