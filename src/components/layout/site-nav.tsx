"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { profile } from "@/content/profile";
import { useIntroOnScreen } from "@/lib/intro-reveal";

const links = [{ label: "Work", href: "#projects" }, { label: "About", href: "#about" }, { label: "Contact", href: "#contact" }];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const filmOnScreen = useIntroOnScreen();
  // Over the intro film the bar is transparent so the film fills the whole window;
  // it only takes on a background once the page has scrolled off it.
  const [scrolled, setScrolled] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-height")) || 88;
    const update = () => {
      let next = "";
      for (const link of links) {
        const section = document.querySelector(link.href);
        if (section && section.getBoundingClientRect().top < 170) next = link.href;
      }
      setActive(next);
      const hero = document.getElementById("hero");
      setScrolled(hero ? hero.getBoundingClientRect().bottom <= navHeight : window.scrollY > 24);
    };
    const onResize = () => {
      navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-height")) || 88;
      update();
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", onResize);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); }
      if (event.key !== "Tab") return;
      const targets = [toggle.current, ...Array.from(panel.current?.querySelectorAll<HTMLAnchorElement>("a") ?? [])].filter(Boolean) as HTMLElement[];
      const first = targets[0], last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (filmOnScreen) setOpen(false);
  }, [filmOnScreen]);

  return <header className="site-nav-shell" data-scrolled={scrolled}>
    <a className="brand-lockup" href="#hero" aria-label="Girwan Dhakal home" onClick={() => setOpen(false)}>GD<span className="brand-dot" aria-hidden="true" /></a>
    <nav className="site-nav" aria-label="Primary navigation">
      {links.map(link => <a key={link.href} href={link.href} aria-current={active === link.href ? "location" : undefined}>{link.label}</a>)}
      <a className="nav-resume" href={profile.resumeHref} target="_blank" rel="noopener noreferrer">Résumé <ArrowUpRight size={16} aria-hidden="true" /></a>
    </nav>
    {!filmOnScreen && <button ref={toggle} type="button" className="mobile-nav-toggle icon-button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>}
    {open && !filmOnScreen && <div ref={panel} className="mobile-menu" id="mobile-menu">
      {links.map(link => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}<ArrowUpRight size={22} aria-hidden="true" /></a>)}
      <a href={profile.resumeHref} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>Résumé<ArrowUpRight size={22} aria-hidden="true" /></a>
    </div>}
  </header>;
}
