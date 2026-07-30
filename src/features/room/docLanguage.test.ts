import { describe, expect, it } from 'vitest';
import { docLanguage } from './docLanguage';

describe('docLanguage', () => {
  it('maps known code extensions to hljs languages', () => {
    expect(docLanguage('app.ts')).toBe('typescript');
    expect(docLanguage('main.py')).toBe('python');
    expect(docLanguage('data.json')).toBe('json');
    expect(docLanguage('README.md')).toBe('markdown');
  });

  it('returns null for plain-text extensions', () => {
    expect(docLanguage('notes.txt')).toBeNull();
    expect(docLanguage('server.log')).toBeNull();
    expect(docLanguage('noextension')).toBeNull();
  });
});
