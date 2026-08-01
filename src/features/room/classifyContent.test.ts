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

  it('tolerates trailing whitespace after the fence language (```js␠ + newline)', () => {
    // Regression: a stray space after the language made the info line fail the
    // multi-line fence, so it fell through to the inline branch and folded "js "
    // into the code body as line 1 — losing the language tag AND highlighting.
    const out = classifyContent('```js \nconst a = 1;\n```');
    expect(out.kind).toBe('CODE');
    expect(out.language).toBe('js');
    expect(out.content).toBe('const a = 1;');
  });

  it('captures a dotted language name (```asp.net)', () => {
    // Regression: `.` was not in the language class, so `asp.net` folded into the
    // body. hljs has dotted language names, so allow them.
    const out = classifyContent('```asp.net\nx = 1\n```');
    expect(out.kind).toBe('CODE');
    expect(out.language).toBe('asp.net');
    expect(out.content).toBe('x = 1');
  });

  it('detects an INLINE fence (```code``` on one line, no newline)', () => {
    const out = classifyContent('```const a = 1;```');
    expect(out.kind).toBe('CODE');
    expect(out.content).toBe('const a = 1;');
    expect(out.language).toBeUndefined();
  });

  it('detects an inline fence with inner spaces', () => {
    expect(classifyContent('```  git status  ```').content).toBe('git status');
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
