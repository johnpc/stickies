import { describe, expect, it } from 'vitest';
import { deepLinkPath } from './deepLinkPath';

describe('deepLinkPath', () => {
  it('extracts the room path from a universal link', () => {
    expect(deepLinkPath('https://stickies.jpc.io/grocery-list')).toBe('/grocery-list');
  });

  it('maps the bare domain to the home path', () => {
    expect(deepLinkPath('https://stickies.jpc.io/')).toBe('/');
    expect(deepLinkPath('https://stickies.jpc.io')).toBe('/');
  });

  it('strips a trailing slash but preserves the query string', () => {
    expect(deepLinkPath('https://stickies.jpc.io/team/')).toBe('/team');
    expect(deepLinkPath('https://stickies.jpc.io/team?ref=x')).toBe('/team?ref=x');
  });

  it('returns null for an unparseable URL', () => {
    expect(deepLinkPath('not a url')).toBeNull();
  });
});
