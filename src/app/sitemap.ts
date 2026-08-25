import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://girwandhakal.dev",
      lastModified: new Date("2026-08-25"),
      changeFrequency: "monthly",
      priority: 1
    }
  ];
}
