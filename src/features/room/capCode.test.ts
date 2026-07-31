import { describe, expect, it } from 'vitest';
import { capCode, CODE_MAX_LINES, CODE_MAX_CHARS } from './capCode';

describe('capCode', () => {
  it('leaves a small snippet untouched', () => {
    expect(capCode('const a = 1;\nfoo(a);')).toEqual({
      code: 'const a = 1;\nfoo(a);',
      truncated: false,
    });
  });

  it('caps by line count and flags truncation', () => {
    const code = Array.from({ length: CODE_MAX_LINES + 50 }, (_, i) => `line ${i}`).join('\n');
    const out = capCode(code);
    expect(out.truncated).toBe(true);
    expect(out.code.split('\n')).toHaveLength(CODE_MAX_LINES);
  });

  it('caps a single monster/minified line by char length', () => {
    const out = capCode('x'.repeat(CODE_MAX_CHARS + 5000));
    expect(out.truncated).toBe(true);
    expect(out.code).toHaveLength(CODE_MAX_CHARS);
  });

  it('keeps a snippet exactly at the line limit un-truncated', () => {
    const code = Array.from({ length: CODE_MAX_LINES }, (_, i) => `l${i}`).join('\n');
    expect(capCode(code).truncated).toBe(false);
  });
});
