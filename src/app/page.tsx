import { SiteNav } from "@/components/layout/site-nav";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Hero } from "@/components/sections/hero";
import { Projects } from "@/components/sections/projects";
import { Resume } from "@/components/sections/resume";
import { Skills } from "@/components/sections/skills";
import { PhoneMessenger } from "@/components/layout/phone-messenger";
import { MotionProvider } from "@/components/motion/motion-provider";
import { ArrowUpRight } from "lucide-react";

export default function HomePage() {
  return <MotionProvider>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <SiteNav />
    <main id="main-content"><Hero /><Projects /><About /><Resume /><Skills /><Contact /></main>
    <footer className="site-footer section-inner"><span>© 2026 Girwan Dhakal</span><a className="text-link" href="#hero">Back to top <ArrowUpRight size={16} aria-hidden="true" /></a></footer>
    <PhoneMessenger />
  </MotionProvider>;
}
