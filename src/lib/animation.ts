export const revealTransition = {
  duration: 0.72,
  ease: [0.2, 0.8, 0.2, 1]
} as const;

export const navItems = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Resume", href: "#resume" },
  { label: "Contact", href: "#contact" }
] as const;
