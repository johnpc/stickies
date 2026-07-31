import { describe, expect, it } from 'vitest';
import { unwrap, unwrapWrite } from './dataClient';

describe('unwrap', () => {
  it('returns data when there are no errors', () => {
    expect(unwrap({ data: [1, 2, 3] })).toEqual([1, 2, 3]);
  });

  it('throws (joined) when the result has GraphQL errors', () => {
    expect(() => unwrap({ data: null, errors: [{ message: 'a' }, { message: 'b' }] })).toThrow(
      'a; b',
    );
  });

  it('returns null data without throwing (a genuinely-empty read)', () => {
    expect(unwrap({ data: null })).toBeNull();
  });
});

describe('unwrapWrite', () => {
  it('returns the created/updated row', () => {
    expect(unwrapWrite({ data: { id: 'x' } })).toEqual({ id: 'x' });
  });

  it('throws on GraphQL errors', () => {
    expect(() => unwrapWrite({ data: null, errors: [{ message: 'boom' }] })).toThrow('boom');
  });

  it('throws on null data (offline write that resolved with no row)', () => {
    expect(() => unwrapWrite({ data: null })).toThrow(/offline/i);
  });
});
