import { describe, expect, it } from 'vitest';
import type { StickyRecord } from '../../lib/dataClient';
import { editableContent } from './editableContent';
import { classifyContent } from './classifyContent';

const make = (kind: string, content: string, language?: string | null) =>
  ({ kind, content, language }) as unknown as StickyRecord;

describe('editableContent', () => {
  it('returns TEXT/LINK content unchanged', () => {
    expect(editableContent(make('TEXT', 'hello world'))).toBe('hello world');
    expect(editableContent(make('LINK', 'example.com'))).toBe('example.com');
  });

  it('re-wraps a CODE body in a fence with its language', () => {
    expect(editableContent(make('CODE', 'const a = 1;', 'ts'))).toBe('```ts\nconst a = 1;\n```');
  });

  it('re-wraps a CODE body with no language as a bare fence', () => {
    expect(editableContent(make('CODE', 'x = 1', null))).toBe('```\nx = 1\n```');
  });

  it('tolerates null content', () => {
    expect(editableContent(make('TEXT', null as unknown as string))).toBe('');
  });

  // The regression this fixes: editing a CODE sticky must round-trip back to CODE
  // (not silently degrade to TEXT), preserving body + language.
  it('round-trips CODE through classifyContent losslessly (with language)', () => {
    const sticky = make('CODE', 'function f() {\n  return 1;\n}', 'js');
    const reclassified = classifyContent(editableContent(sticky));
    expect(reclassified).toEqual({
      kind: 'CODE',
      content: 'function f() {\n  return 1;\n}',
      language: 'js',
    });
  });

  it('round-trips CODE with no language back to CODE', () => {
    const sticky = make('CODE', 'a\nb\nc', null);
    const reclassified = classifyContent(editableContent(sticky));
    expect(reclassified.kind).toBe('CODE');
    expect(reclassified.content).toBe('a\nb\nc');
  });
});
