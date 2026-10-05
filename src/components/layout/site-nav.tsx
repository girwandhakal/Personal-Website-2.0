"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Briefcase, FileText, GraduationCap, Layers, Mail, Menu, Sparkles, User, Wrench } from "lucide-react";

import { GooeyNavbar, type GooeyNavItem } from "@/components/layouts/gooey-navbar";
import { BottomMenu, bottomMenuRow, type BottomMenuItem } from "@/components/layouts/bottom-menu";
import { GithubIcon, LinkedinIcon } from "@/components/ui/social-icons";
import { profile } from "@/content/profile";

const links: GooeyNavItem[] = [
  { label: "Work", link: "#projects" },
  { label: "About", link: "#about" },
  { label: "Experience", link: "#experience" },
  { label: "Skills", link: "#skills" },
  { label: "Contact", link: "#contact" }
];

function scrollToSection(href: string) {
  const el = document.querySelector(href);
  if (!el) { window.location.href = `/${href}`; return; }
  el.scrollIntoView({ block: "start" });
  window.history.pushState(null, "", href);
}

const github = profile.socials.find((s) => s.icon === "github")?.href ?? "https://github.com/girwandhakal";
const linkedin = profile.socials.find((s) => s.icon === "linkedin")?.href ?? "https://www.linkedin.com/in/gdhakal";

export function SiteNav() {
  const [active, setActive] = useState(-1);
  // Over the hero the nav stays out of the way entirely so nothing covers the
  // film; it slides in once the page has scrolled past the hero.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => {
      const navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-height")) || 88;
      let next = -1;
      links.forEach((link, i) => {
        const section = document.querySelector(link.link);
        if (section && section.getBoundingClientRect().top < navHeight + 120) next = i;
      });
      // The last section may never reach the trigger line at the page bottom.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) next = links.length - 1;
      setActive(next);
      const hero = document.getElementById("hero");
      setScrolled(hero ? hero.getBoundingClientRect().bottom <= navHeight : window.scrollY > 24);
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const select = useCallback((index: number, item: GooeyNavItem) => {
    setActive(index);
    scrollToSection(item.link);
  }, []);

  const dockItems: BottomMenuItem[] = [
    { id: "work", label: "Work", icon: Briefcase, onSelect: () => scrollToSection("#projects"), active: active === 0 },
    { id: "experience", label: "Experience", icon: Layers, onSelect: () => scrollToSection("#experience"), active: active === 2 },
    { id: "ai", label: "Ask my AI", icon: Sparkles, onSelect: () => window.dispatchEvent(new Event("open-ai-chat")) },
    { id: "contact", label: "Contact", icon: Mail, onSelect: () => scrollToSection("#contact"), active: active === 4 },
    {
      id: "more",
      label: "More",
      icon: Menu,
      panel: (close) => (
        <div className="w-[236px] space-y-0.5 p-1.5">
          <button type="button" className={bottomMenuRow} onClick={() => { close(); scrollToSection("#about"); }}><User size={18} aria-hidden="true" />About</button>
          <button type="button" className={bottomMenuRow} onClick={() => { close(); scrollToSection("#skills"); }}><Wrench size={18} aria-hidden="true" />Skills</button>
          <button type="button" className={bottomMenuRow} onClick={() => { close(); scrollToSection("#education"); }}><GraduationCap size={18} aria-hidden="true" />Education</button>
          <div className="my-1 border-t border-border" />
          <a className={bottomMenuRow} href={profile.resumeHref} target="_blank" rel="noopener noreferrer" onClick={close}><FileText size={18} aria-hidden="true" />Résumé<ArrowUpRight size={15} className="ml-auto" aria-hidden="true" /></a>
          <a className={bottomMenuRow} href={github} target="_blank" rel="noopener noreferrer" onClick={close}><GithubIcon size={18} aria-hidden="true" />GitHub<ArrowUpRight size={15} className="ml-auto" aria-hidden="true" /></a>
          <a className={bottomMenuRow} href={linkedin} target="_blank" rel="noopener noreferrer" onClick={close}><LinkedinIcon size={18} aria-hidden="true" />LinkedIn<ArrowUpRight size={15} className="ml-auto" aria-hidden="true" /></a>
        </div>
      )
    }
  ];

  return <>
    <header className="site-nav-shell" data-scrolled={scrolled}>
      <a className="brand-lockup" href="#hero" aria-label="Girwan Dhakal home">GD<span className="brand-dot" aria-hidden="true" /></a>
      <div className="site-nav-center">
        <GooeyNavbar items={links} activeIndex={active} onSelect={select} ariaLabel="Primary navigation" />
      </div>
      <a className="nav-resume" href={profile.resumeHref} target="_blank" rel="noopener noreferrer">Résumé <ArrowUpRight size={16} aria-hidden="true" /></a>
    </header>
    <div className="mobile-dock" data-hidden={!scrolled}>
      <BottomMenu items={dockItems} ariaLabel="Mobile navigation" />
    </div>
  </>;
}
