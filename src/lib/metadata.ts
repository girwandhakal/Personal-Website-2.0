import type { Metadata } from "next";

export const siteMetadata: Metadata = {
  metadataBase: new URL("https://girwandhakal.dev"),
  title: "Girwan Dhakal | Playful Software Engineer",
  description:
    "Girwan Dhakal is a software engineer building playful, fast, and polished web experiences with React, Next.js, TypeScript, and product-minded execution.",
  openGraph: {
    title: "Girwan Dhakal | Playful Software Engineer",
    description:
      "A kinetic personal portfolio built to showcase software projects, product taste, and front-end craft.",
    url: "https://girwandhakal.dev",
    siteName: "Girwan Dhakal",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Girwan Dhakal kinetic portfolio preview"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Girwan Dhakal | Playful Software Engineer",
    description:
      "A kinetic personal portfolio built to showcase software projects, product taste, and front-end craft.",
    images: ["/opengraph-image"]
  }
};
