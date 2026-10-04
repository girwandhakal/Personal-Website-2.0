import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import React from "react";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/page";

describe("homepage", () => {
  it("renders the required portfolio sections", () => {
    render(React.createElement(HomePage));

    expect(screen.getByRole("heading", { level: 1, name: /girwan dhakal/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /skip to content/i })).toHaveAttribute("href", "#main-content");
    // The looping intro film stays the hero's backdrop.
    expect(document.querySelector("video.cinema-video")).toHaveAttribute("src", "/media/intro.mp4");
    for (const name of [/selected work/i, /^about$/i, /experience/i, /toolkit/i, /let's talk/i]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: /get in touch/i })).toHaveAttribute("href", "#contact");
    expect(screen.getByRole("status", { name: /contact form status/i })).toBeInTheDocument();
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(React.createElement(HomePage));

    await expect(axe(container)).resolves.toHaveNoViolations();
  }, 30_000);

  it("keeps mobile navigation reachable and offsets anchor jumps", () => {
    // globals.css only @imports Tailwind and portfolio.css now; the actual rules
    // (and the anchor-offset one this test cares about) live in portfolio.css.
    const css = readFileSync(join(process.cwd(), "src/styles/portfolio.css"), "utf8");

    expect(css).toContain("scroll-padding-top");
    expect(css).not.toContain(".site-nav {\n    display: none;");
  });
});
