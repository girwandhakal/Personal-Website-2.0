# Retro website

The portfolio is plain HTML and CSS in `retro/`, independent of the Next.js site. The arcade uses vanilla JavaScript and a Vercel Function for its shared leaderboard.

Run from the project root: `node scripts/serve-retro.cjs`, then visit http://localhost:3000.

Pages: Home, Experience, Projects, Education & skills, Contact, plus seven project case studies. All share `retro/site.css`. The portfolio requires no client JavaScript, build step, or third-party fonts. The optional arcade uses vanilla JavaScript.

Content was reconciled against the recent root HTML and project case studies on October 27, 2026. These contain updates missing from the older TypeScript profile, including the resumed credit-union role and research evaluation caveats. No new employment or performance claims were invented.

The existing Vercel project publishes `retro/` from `retro-site` to `girwan.com`. `retro/vercel.json` installs the pinned server-only Postgres driver and deploys the API.

## Secret arcade

The homepage footer’s “Insert coin?” link opens `arcade/index.html`. Packet Run supports arrow keys / A and D, touch buttons, and horizontal swipes. P / Escape pauses. Best scores are saved locally when storage is available.

Run simulation checks: `node scripts/test-retro-arcade.cjs`.


## Shared leaderboard

No sign-in is required. After game over, the server verifies the run and returns its potential rank. Players can optionally submit a public nickname. The top 10 contains only named scores; ties share a rank, ordered by submission time. Repeating a submission is idempotent per signed run.

The browser uses a signed server-issued seed and a fixed 60 Hz simulation, recording lane changes by tick. The server replays the same engine and computes the score itself. It checks the signature, source identity, ticket age, elapsed time, and input limits. This blocks simple score edits and replay spam, but cannot prove a human played; automated play remains possible. The backend limits requests and rejects runs longer than one hour of simulated play or tickets older than two hours.

The backend reuses `DATABASE_URL` and `IP_SALT`. These remain server-only. Records live in the isolated `arcade.runs` and `arcade.rate_limits` tables, with RLS enabled and no grants for public, anonymous, or authenticated Data API roles. Only the server's database owner connection accesses them; existing tables are unchanged. Raw IP addresses are not stored. Unclaimed scores and expired rate counters are removed after one day when a run finishes; named entries persist.

First-time database setup: run `node scripts/setup-retro-leaderboard.mjs` from the repository root. It loads the ignored root `.env.local`, applies `scripts/sql/retro-leaderboard.sql`, and verifies RLS and grants. Deployments do not run DDL.

Local preview: `npm ci --prefix retro`, then `node scripts/serve-retro.cjs`. The local server loads `.env.local` and dispatches `/api/leaderboard` to the production handler. If the backend is unavailable, players can still play practice runs, with an explanation that scores cannot be submitted.

Checks: `node scripts/test-retro-arcade.cjs` and `node scripts/test-retro-leaderboard.mjs`. These cover simulation, signed tickets, expiry, names, movement replay, forged runs, method validation, and origin checks. Database integration and deployed endpoint checks are also required before release.
