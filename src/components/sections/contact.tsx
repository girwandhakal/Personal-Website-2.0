"use client";

import { Mail } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { ContactForm } from "@/components/sections/contact-form";
import { GithubIcon, LinkedinIcon } from "@/components/ui/social-icons";
import { profile } from "@/content/profile";

// The /assets/icons SVGs were stroked with a near-white hex, which disappears on
// the light background. These render inline so they inherit `currentColor` and
// flip to white on the accent hover fill — an <img> cannot do that.
const SOCIAL_ICONS = { github: GithubIcon, linkedin: LinkedinIcon, mail: Mail } as const;

export function Contact() {
  const triggerChat = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-ai-chat"));
    }
  };

  return (
    <section
      className="contact-section section-band border-t border-ink/15"
      id="contact"
      aria-labelledby="contact-title"
    >
      <div className="section-inner flex flex-col items-center text-center gap-12">
        <Reveal>
          <h2 id="contact-title">Contact</h2>
          
          <div className="social-row flex justify-center gap-8 mt-10">
            {profile.socials.map(({ label, href, icon }) => {
              const Icon = SOCIAL_ICONS[icon as keyof typeof SOCIAL_ICONS] ?? Mail;
              return (
                <a key={label} href={href} aria-label={label}>
                  <Icon aria-hidden="true" size={24} strokeWidth={2} />
                </a>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xl mx-auto">
            <p className="text-foreground/80 text-lg font-medium m-0">Need a response right away?</p>
            
            <button 
              onClick={triggerChat}
              className="group flex items-center gap-2 px-6 py-2.5 bg-transparent text-foreground font-bold rounded-none transition-all duration-300 border border-foreground hover:bg-foreground/5 hover:-translate-y-1 hover:shadow-[4px_4px_0px_currentColor] active:translate-y-0 active:shadow-none"
              aria-label="Message AI Bot"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                <rect width="18" height="14" x="3" y="8" rx="2"/>
                <path d="M12 5a3 3 0 1 0-3 3"/>
                <line x1="9" x2="9" y1="13" y2="15"/>
                <line x1="15" x2="15" y1="13" y2="15"/>
              </svg>
              Chat
            </button>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="w-full max-w-xl mx-auto">
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
