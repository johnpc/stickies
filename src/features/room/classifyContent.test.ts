import { describe, expect, it } from 'vitest';
import { classifyContent } from './classifyContent';

describe('classifyContent', () => {
  it('classifies a fenced block as CODE, stripping the fence + capturing language', () => {
    const out = classifyContent('```ts\nconst a = 1;\nconsole.log(a);\n```');
    expect(out.kind).toBe('CODE');
    expect(out.content).toBe('const a = 1;\nconsole.log(a);');
    expect(out.language).toBe('ts');
  });

  it('handles a fence with no language', () => {
    const out = classifyContent('```\nplain code\n```');
    expect(out.kind).toBe('CODE');
    expect(out.content).toBe('plain code');
    expect(out.language).toBeUndefined();
  });

  it('lowercases the language tag', () => {
    expect(classifyContent('```JS\nx\n```').language).toBe('js');
  });

  it('falls back to LINK for a bare URL', () => {
    const out = classifyContent('example.com');
    expect(out.kind).toBe('LINK');
    expect(out.content).toBe('example.com');
  });

  it('falls back to TEXT for prose (even prose with backticks mid-string)', () => {
    expect(classifyContent('use the `map` function').kind).toBe('TEXT');
    expect(classifyContent('buy milk').kind).toBe('TEXT');
  });
});
