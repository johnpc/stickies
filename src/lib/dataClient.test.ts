import { describe, expect, it } from 'vitest';
import { unwrap } from './dataClient';

describe('unwrap', () => {
  it('returns data when there are no errors', () => {
    expect(unwrap({ data: [1, 2, 3] })).toEqual([1, 2, 3]);
  });

  it('throws, joining messages, when the result carries GraphQL errors', () => {
    expect(() => unwrap({ data: null, errors: [{ message: 'a' }, { message: 'b' }] })).toThrow(
      'a; b',
    );
  });

  it('ignores an empty errors array', () => {
    expect(unwrap({ data: 'ok', errors: [] })).toBe('ok');
  });
});
