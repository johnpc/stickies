import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** Guards the social-unfurl meta tags in index.html so a shared room link keeps
 * previewing cleanly (they live in static HTML because crawlers don't run our
 * SPA's JS). If someone strips or breaks these, this fails. */
const html = readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
const doc = new DOMParser().parseFromString(html, 'text/html');

const og = (p: string) => doc.querySelector(`meta[property="${p}"]`)?.getAttribute('content');
const tw = (n: string) => doc.querySelector(`meta[name="${n}"]`)?.getAttribute('content');

describe('social meta (index.html)', () => {
  it('has the core OpenGraph tags', () => {
    expect(og('og:type')).toBe('website');
    expect(og('og:site_name')).toBe('Stickies');
    expect(og('og:title')).toMatch(/stickies/i);
    expect(og('og:description')).toMatch(/room|share/i);
  });

  it('points og:url and og:image at absolute https URLs (crawlers need absolute)', () => {
    expect(og('og:url')).toMatch(/^https:\/\/stickies\.jpc\.io\//);
    expect(og('og:image')).toMatch(/^https:\/\/stickies\.jpc\.io\/.+\.png$/);
  });

  it('has a summary_large_image Twitter card with an absolute image', () => {
    expect(tw('twitter:card')).toBe('summary_large_image');
    expect(tw('twitter:title')).toMatch(/stickies/i);
    expect(tw('twitter:image')).toMatch(/^https:\/\/stickies\.jpc\.io\/.+\.png$/);
  });

  it('declares the OG image type + 1.91:1 dimensions so crawlers render the card', () => {
    expect(og('og:image:type')).toBe('image/png');
    expect(Number(og('og:image:width'))).toBe(1200);
    expect(Number(og('og:image:height'))).toBe(630);
    expect(og('og:image:alt')).toMatch(/stickies/i);
  });

  it('ships og-image.png as a REAL PNG at the declared 1200×630 (not a mislabeled JPEG)', () => {
    // Regression: og-image.png was JPEG bytes at 3:1 served as image/png, so
    // stricter unfurlers dropped it and others cropped it. Read the actual file's
    // header + IHDR dimensions and assert they match the declared meta.
    const png = readFileSync(path.resolve(process.cwd(), 'public/og-image.png'));
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    // IHDR width/height are big-endian uint32 at byte offsets 16 and 20.
    expect(png.readUInt32BE(16)).toBe(Number(og('og:image:width')));
    expect(png.readUInt32BE(20)).toBe(Number(og('og:image:height')));
  });

  it('keeps the viewport zoomable (WCAG 1.4.4) while retaining viewport-fit=cover', () => {
    // Regression: the Ionic starter's `maximum-scale=1, user-scalable=no` disabled
    // pinch-zoom — a WCAG 2.1 AA failure that blocks low-vision users. Must NOT
    // return, and must keep viewport-fit=cover for safe-area insets.
    const vp = doc.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '';
    expect(vp).toContain('viewport-fit=cover');
    expect(vp).not.toMatch(/user-scalable\s*=\s*no/);
    expect(vp).not.toMatch(/maximum-scale/);
  });

  it('uses a translucent iOS status bar so an installed light app has no black band', () => {
    // `black` painted a solid band above the cream toolbar; translucent lets the
    // app background show through the safe-area padding.
    expect(
      doc
        .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
        ?.getAttribute('content'),
    ).toBe('black-translucent');
  });

  it('links an apple-touch-icon so iOS Add-to-Home-Screen uses the app icon', () => {
    // Without this, iOS falls back to a page screenshot for the home-screen icon.
    const icon = doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href');
    expect(icon).toBe('/apple-touch-icon.png');
    // The iOS standalone flag should be present too.
    expect(
      doc.querySelector('meta[name="apple-mobile-web-app-capable"]')?.getAttribute('content'),
    ).toBe('yes');
  });

  it('sets a per-scheme theme-color so the browser chrome matches light/dark', () => {
    const themeColors = [...doc.querySelectorAll('meta[name="theme-color"]')].map((m) => ({
      content: m.getAttribute('content'),
      media: m.getAttribute('media'),
    }));
    const light = themeColors.find((t) => t.media?.includes('light'));
    const dark = themeColors.find((t) => t.media?.includes('dark'));
    expect(light?.content).toBe('#f6f3ea'); // --sk-bg light
    expect(dark?.content).toBe('#14130f'); // --sk-bg dark
  });
});
