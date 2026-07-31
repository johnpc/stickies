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
});
