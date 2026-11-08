# Retro website

The portfolio is plain HTML and CSS in `retro/`, independent of the Next.js application.

Run from the project root: `node scripts/serve-retro.cjs`, then visit http://localhost:3000.

Pages: Home, Experience, Projects, Education & skills, Contact, plus seven project case studies. All share `retro/site.css` and a Home link in the navigation. The homepage contains a personal greeting and introduction. The portfolio requires no client framework, build step, external font services, or package dependencies.

Manrope is self-hosted in `assets/fonts/` with its OFL license and preloaded on every page. Optional font loading prevents a late font swap. The shared stylesheet reserves scrollbar space and keeps navigation font weights stable. Supported browsers use an atomic native page swap without fading old and new text over one another, respecting reduced motion. The mobile navbar stays fixed at the bottom, reveals the active tab when its links overflow horizontally, and uses border-only tap feedback while retaining keyboard focus outlines. `navigation.js` prevents ordinary clicks on the current URL from reloading the page, while preserving modified clicks and navigation from case studies to the project directory.

The existing Vercel project publishes `retro/` from `retro-site` to `girwan.com`. `retro/vercel.json` deploys the contact API, which uses the platform fetch API to send messages through EmailJS. Run `node scripts/test-retro-contact.mjs` to check contact validation and handling, and `node scripts/test-retro-navigation.cjs` to check navigation behavior and font loading markup.

Content was reconciled against the recent root HTML and project case studies on October 27, 2026. These contain updates missing from the older TypeScript profile, including the resumed credit-union role and research evaluation caveats. No new employment or performance claims were invented.

The arcade, leaderboard endpoint, and related setup and test scripts were removed at the owner's request. Previously stored leaderboard records are left untouched; the site no longer reads or writes them.
