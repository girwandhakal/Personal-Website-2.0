"use client";

import { ArrowUpRight } from "lucide-react";
import { ContactForm } from "./contact-form";
import { profile } from "@/content/profile";

export function Contact() {
  return <section className="contact-section section-inner section-space" id="contact" aria-labelledby="contact-title">
    <div className="contact-intro"><h2 id="contact-title">Let's talk.</h2>
      <a className="contact-email text-link" href={`mailto:${profile.email}`}>{profile.email}<ArrowUpRight size={22} aria-hidden="true" /></a>
      <div className="contact-socials">{profile.socials.filter(s => s.icon !== "mail").map(s => <a className="text-link" key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">{s.label}<ArrowUpRight size={16} aria-hidden="true" /></a>)}</div>
    </div>
    <ContactForm />
  </section>;
}
