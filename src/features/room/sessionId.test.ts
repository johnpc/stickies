import { beforeEach, describe, expect, it } from 'vitest';
import { getSessionId } from './sessionId';

beforeEach(() => sessionStorage.clear());

describe('getSessionId', () => {
  it('creates an id once and returns the same one on repeat calls', () => {
    const a = getSessionId();
    const b = getSessionId();
    expect(a).toBe(b);
    expect(a).toMatch(/^s-/);
  });

  it('persists the id in sessionStorage', () => {
    const id = getSessionId();
    expect(sessionStorage.getItem('stickies:session')).toBe(id);
  });
});
