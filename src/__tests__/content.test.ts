import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { siteMetadata } from "@/lib/metadata";

describe("portfolio content", () => {
  it("contains hiring-focused core profile details", () => {
    expect(profile.name).toBe("Girwan Dhakal");
    expect(profile.primaryCta.href).toBe("#projects");
    expect(profile.secondaryCta.href).toBe("https://drive.google.com/file/d/19ZlE3TBH60342uetNyYsDHVeINJYsBdf/view?usp=sharing");
    expect(profile.email).toContain("@");
  });

  it("defines selected projects with useful recruiter context", () => {
    expect(projects.length).toBeGreaterThanOrEqual(3);

    for (const project of projects) {
      expect(project.title.length).toBeGreaterThan(2);
      expect(project.summary.length).toBeGreaterThan(30);
      expect(project.impact.length).toBeGreaterThan(20);
      expect(project.tech.length).toBeGreaterThanOrEqual(3);
      expect(project.links.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("exports metadata for search and social previews", () => {
    expect(siteMetadata.title).toContain("Girwan Dhakal");
    expect(siteMetadata.description.length).toBeGreaterThan(80);
    expect(siteMetadata.openGraph.images[0].url).toBe("/opengraph-image");
  });

  it("ships a real resume asset for the recruiter CTA", () => {
    expect(existsSync(join(process.cwd(), "public/Girwan-Dhakal-Resume.docx"))).toBe(true);
  });
});
