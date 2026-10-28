# Retro website

Pure HTML and CSS in `retro/`, independent of the Next.js site.

Run from the project root: `node scripts/serve-retro.cjs`, then visit http://localhost:3000.

Pages: Home, Experience, Projects, Education & skills, Contact, plus seven project case studies. All share `retro/site.css`. The portfolio requires no client JavaScript, build step, or third-party fonts. The optional arcade uses vanilla JavaScript.

Content was reconciled against the recent root HTML and project case studies on October 27, 2026. These contain updates missing from the older TypeScript profile, including the resumed credit-union role and research evaluation caveats. No new employment or performance claims were invented.

For a future static deployment, use `retro/` as the publish directory. Production hosting has not been changed.

## Secret arcade

The homepage footer’s “Insert coin?” link opens `arcade/index.html`. Packet Run supports arrow keys / A and D, touch buttons, and horizontal swipes. P / Escape pauses. Best scores are saved locally when storage is available.

Run simulation checks: `node scripts/test-retro-arcade.cjs`.
