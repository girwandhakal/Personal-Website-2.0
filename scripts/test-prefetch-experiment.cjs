const fs = require('fs');

const pages = [
  { name: 'Home', file: 'retro/index.html', size: fs.statSync('retro/index.html').size },
  { name: 'Experience', file: 'retro/experience.html', size: fs.statSync('retro/experience.html').size },
  { name: 'Projects', file: 'retro/projects.html', size: fs.statSync('retro/projects.html').size },
  { name: 'Education', file: 'retro/education.html', size: fs.statSync('retro/education.html').size },
  { name: 'Contact', file: 'retro/contact.html', size: fs.statSync('retro/contact.html').size },
];

const profiles = [
  { name: 'Broadband / Wi-Fi', rttMs: 25, downloadMbps: 50 },
  { name: 'Fast 4G Mobile', rttMs: 60, downloadMbps: 15 },
  { name: 'Average 4G Mobile', rttMs: 110, downloadMbps: 4 },
  { name: 'Slow / Rural 3G', rttMs: 250, downloadMbps: 0.75 },
];

console.log('='.repeat(72));
console.log('EXPERIMENT: Navigation Latency Comparison (Standard vs. Prefetched)');
console.log('='.repeat(72));

profiles.forEach(profile => {
  console.log(`\nNetwork Condition: ${profile.name} (RTT: ${profile.rttMs}ms, Bandwidth: ${profile.downloadMbps} Mbps)`);
  console.log('-'.repeat(72));
  console.log(`${'Page'.padEnd(14)} | ${'Payload'.padEnd(10)} | ${'Without Prefetch'.padEnd(18)} | ${'With Prefetch (Cache)'.padEnd(20)} | ${'Improvement'}`);
  console.log('-'.repeat(72));

  pages.forEach(p => {
    // Transfer time in ms = (bytes * 8) / (downloadMbps * 1,000,000) * 1000
    const transferMs = (p.size * 8) / (profile.downloadMbps * 1000000) * 1000;
    // Standard navigation requires 1 RTT (request + response) + transfer time
    const withoutPrefetchMs = profile.rttMs + transferMs;
    // Prefetched load is served from browser memory/disk cache (local IPC read ~1ms)
    const withPrefetchMs = 1.0;
    const diff = withoutPrefetchMs - withPrefetchMs;
    const percent = Math.round((diff / withoutPrefetchMs) * 100);

    console.log(
      `${p.name.padEnd(14)} | ${(p.size / 1024).toFixed(1).padStart(5)} KB   | ${withoutPrefetchMs.toFixed(1).padStart(7)} ms         | ${withPrefetchMs.toFixed(1).padStart(8)} ms            | -${diff.toFixed(0)}ms (${percent}%)`
    );
  });
});
console.log('='.repeat(72));
