# Retro website

The portfolio is plain HTML and CSS in `retro/`, independent of the Next.js application.

Run from the project root: `node scripts/serve-retro.cjs`, then visit http://localhost:3000.

Pages: Home, Experience, Projects, Education & skills, Contact, plus seven project case studies. All share `retro/site.css` and a compact GD home link in the navigation. The homepage contains a personal greeting and introduction. The portfolio requires no client framework, build step, external font services, or package dependencies.

Geist is self-hosted in `assets/fonts/` with its OFL license.

The existing Vercel project publishes `retro/` from `retro-site` to `girwan.com`. `retro/vercel.json` deploys the contact API, which uses the platform fetch API to send messages through EmailJS. Run `node scripts/test-retro-contact.mjs` to check contact validation and handling.

Content was reconciled against the recent root HTML and project case studies on October 27, 2026. These contain updates missing from the older TypeScript profile, including the resumed credit-union role and research evaluation caveats. No new employment or performance claims were invented.

The arcade, leaderboard endpoint, and related setup and test scripts were removed at the owner's request. Previously stored leaderboard records are left untouched; the site no longer reads or writes them.
