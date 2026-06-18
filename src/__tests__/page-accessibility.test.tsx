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

    expect(screen.getAllByRole("heading", { name: /girwan dhakal/i }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /skip to content/i })).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("region", { name: /cinematic introduction/i })).toBeInTheDocument();
    expect(screen.getByText(/^signal$/i)).toBeInTheDocument();
    expect(screen.getByText(/build\. research\. ship\./i)).toBeInTheDocument();
    expect(screen.getByText(/code/i)).toBeInTheDocument();
    expect(screen.getByText(/enter portfolio/i)).toBeInTheDocument();
    expect(screen.queryByText(/tuscaloosa \/ engineering/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/i turn ambiguous ideas/i)).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: /proof that the craft/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /have a role/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /resume/i }).some((link) => link.getAttribute("href") === "#resume")).toBe(
      true
    );
    expect(screen.getByRole("status", { name: /contact form status/i })).toBeInTheDocument();
  });

  it("uses glowing gradient treatment for the cinematic intro text", () => {
    render(React.createElement(HomePage));

    expect(screen.getByText(/build\. research\. ship\./i)).toHaveClass("cinematic-glow-gradient");
    expect(screen.getAllByRole("heading", { name: /girwan dhakal/i })[0]).toHaveClass("cinematic-name-glow");
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(React.createElement(HomePage));

    await expect(axe(container)).resolves.toHaveNoViolations();
  });

  it("keeps mobile navigation reachable and offsets anchor jumps", () => {
    const css = readFileSync(join(process.cwd(), "src/styles/globals.css"), "utf8");

    expect(css).toContain("scroll-padding-top");
    expect(css).not.toContain(".site-nav {\n    display: none;");
  });
});
