#!/usr/bin/env node
/**
 * Generate the social/OG share card: public/og-image.png.
 *
 * A room link is the app's whole invite loop, so the card a link unfurls into
 * matters. This produces a proper 1200×630 (1.91:1) PNG — the format/ratio social
 * platforms expect — instead of the previous repurposed 3:1 README banner that
 * was ALSO JPEG bytes served with a .png extension (so strict fetchers dropped
 * it). Brand cream background + a few tilted sticky notes + the title/tagline.
 *
 * Re-run after changing the copy/palette:  node scripts/gen-og-image.mjs
 * Build script (not shipped logic) — lives outside src/ + amplify/.
 */
import sharp from 'sharp';
import { join } from 'node:path';

const ROOT = process.cwd();
const W = 1200;
const H = 630;

// Pulled from src/theme/variables.css (light theme).
const BG = '#f6f3ea';
const INK = '#1f1d16';
const MUTED = '#6a6558';
const NOTES = ['#fde68a', '#fbc7d4', '#bfe0fb', '#c3ebc9', '#ddcffb'];

/** A tilted sticky-note rect with a soft shadow. */
function note(x, y, fill, rot) {
  return `
    <g transform="translate(${x} ${y}) rotate(${rot})">
      <rect x="0" y="0" width="150" height="150" rx="10" fill="${fill}"
            filter="url(#shadow)" />
    </g>`;
}

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#00000022" />
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}" />
  <!-- A scatter of sticky notes on the right, evoking the pad. -->
  ${note(760, 120, NOTES[0], -8)}
  ${note(930, 90, NOTES[1], 6)}
  ${note(820, 300, NOTES[2], 4)}
  ${note(990, 300, NOTES[3], -6)}
  ${note(900, 470, NOTES[4], 3)}
  <!-- Wordmark + tagline on the left. -->
  <text x="90" y="290" font-family="Georgia, 'Times New Roman', serif" font-size="96"
        font-weight="700" fill="${INK}">Stickies</text>
  <text x="94" y="360" font-family="Helvetica, Arial, sans-serif" font-size="38"
        fill="${MUTED}">A shared sticky pad at any URL.</text>
  <text x="94" y="415" font-family="Helvetica, Arial, sans-serif" font-size="30"
        fill="${MUTED}">No account — pick a room name and share the link.</text>
</svg>`;

const out = join(ROOT, 'public/og-image.png');
await sharp(Buffer.from(svg)).png().toFile(out);
console.log(`Wrote ${out} (${W}×${H} PNG)`);
