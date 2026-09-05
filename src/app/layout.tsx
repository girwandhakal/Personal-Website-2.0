import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import { siteMetadata } from "@/lib/metadata";
import "@/styles/globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-primary"
});

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: "#111416",
  colorScheme: "dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}
