import { describe, expect, it } from 'vitest';
import { docPreview } from './docPreview';

const tenLines = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join('\n');

describe('docPreview', () => {
  it('shows all lines and is not truncated when short', () => {
    const out = docPreview('a\nb\nc', false);
    expect(out.truncated).toBe(false);
    expect(out.shown).toBe('a\nb\nc');
    expect(out.totalLines).toBe(3);
  });

  it('truncates to the first N lines when collapsed', () => {
    const out = docPreview(tenLines, false, 8);
    expect(out.truncated).toBe(true);
    expect(out.shown.split('\n')).toHaveLength(8);
    expect(out.totalLines).toBe(10);
  });

  it('shows the full text when expanded', () => {
    const out = docPreview(tenLines, true, 8);
    expect(out.truncated).toBe(true);
    expect(out.shown).toBe(tenLines);
  });
});
