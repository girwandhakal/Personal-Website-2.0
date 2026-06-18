import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";

import { siteMetadata } from "@/lib/metadata";
import "@/styles/globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-play"
});

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: "#0a0908",
  colorScheme: "dark light"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={baloo.variable}>
      <body>{children}</body>
    </html>
  );
}
