import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";

import { siteMetadata } from "@/lib/metadata";
import "@/styles/globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-primary"
});

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: "#f6f4f3",
  colorScheme: "light"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>{children}</body>
    </html>
  );
}
