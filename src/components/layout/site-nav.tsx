import { navItems } from "@/lib/animation";

export function SiteNav() {
  return (
    <header className="site-nav-shell">
      <a className="brand-lockup" href="#top" aria-label="Girwan Dhakal home">
        <span className="brand-mark">GD</span>
        <span className="brand-name">Girwan</span>
      </a>

      <nav className="site-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <a key={item.href} href={item.href} className="nav-item-link">
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
