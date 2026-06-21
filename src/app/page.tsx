import { SiteNav } from "@/components/layout/site-nav";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Hero } from "@/components/sections/hero";
import { Projects } from "@/components/sections/projects";
import { Resume } from "@/components/sections/resume";
import { Skills } from "@/components/sections/skills";
import { PhoneMessenger } from "@/components/layout/phone-messenger";
import { IntroPreloader } from "@/components/layout/intro-preloader";

export default function HomePage() {
  return (
    <IntroPreloader>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteNav />
      <main id="main-content">
        <Hero />
        <About />
        <Projects />
        <Skills />
        <Resume />
        <Contact />
      </main>
      <footer className="w-full py-8 flex items-center justify-center text-white/40 text-sm font-medium bg-[var(--black)] border-t border-[var(--grey)]/20">
        &copy; 2026 Girwan Dhakal
      </footer>
      <PhoneMessenger />
    </IntroPreloader>
  );
}

