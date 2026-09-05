import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";

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
      <body>
        {/* Chrome restores the previous scroll position on a plain reload, not just
            back/forward — so reloading after having scrolled past the intro landed
            straight on the hero, since the intro/reveal logic reads scrollY before
            deciding whether it's already been shown. `beforeInteractive` runs this
            ahead of hydration, correcting the position (unless the visitor followed
            an anchor link) before the app's own effects ever see it, and opts this
            history entry out of the browser doing it again on the next reload. */}
        <Script id="scroll-restoration" strategy="beforeInteractive">
          {`try {
            if ("scrollRestoration" in history) history.scrollRestoration = "manual";
            if (!location.hash) window.scrollTo(0, 0);
          } catch (e) {}`}
        </Script>
        {children}
      </body>
    </html>
  );
}
