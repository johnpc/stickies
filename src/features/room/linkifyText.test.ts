import { describe, expect, it } from 'vitest';
import { linkifyText } from './linkifyText';

/** Compact view of the runs for assertions: link runs as [text](href). */
const show = (t: string) =>
  linkifyText(t)
    .map((r) => (r.href ? `[${r.text}](${r.href})` : r.text))
    .join('|');

describe('linkifyText', () => {
  it('leaves a note with no URL as a single plain run', () => {
    expect(linkifyText('just a plain note')).toEqual([{ text: 'just a plain note', href: null }]);
  });

  it('links an http(s) URL embedded in a sentence, keeping the surrounding text', () => {
    expect(show('Standup: https://zoom.us/j/98765 at 10am')).toBe(
      'Standup: |[https://zoom.us/j/98765](https://zoom.us/j/98765)| at 10am',
    );
  });

  it('links a www. URL', () => {
    const runs = linkifyText('see www.example.com now');
    expect(runs[1].href).toBe('https://www.example.com/');
  });

  it('does NOT linkify bare hosts, emails, or version-like tokens (false-positive guard)', () => {
    expect(show('email me at a@b.com then')).toBe('email me at a@b.com then');
    expect(show('use node.js v1.2.3 please')).toBe('use node.js v1.2.3 please');
    expect(show('see example.com for details')).toBe('see example.com for details');
  });

  it('never linkifies a javascript: url (XSS guard via safeHref)', () => {
    expect(show('run javascript:alert(1) now')).toBe('run javascript:alert(1) now');
  });

  it('keeps trailing sentence punctuation as text, not part of the link', () => {
    expect(show('open https://x.com.')).toBe('open |[https://x.com](https://x.com/)|.');
    expect(show('(see https://x.com)')).toBe('(see |[https://x.com](https://x.com/)|)');
  });

  it('links an angle-bracket / Markdown-autolink URL, keeping the > as text', () => {
    // Regression: <https://x.com> (a very common way to write a URL) was left as
    // DEAD TEXT — the run kept a trailing > that safeHref rejected, so nothing
    // linkified. The > should peel like other trailing punctuation.
    expect(show('see <https://x.com> for info')).toBe(
      'see <|[https://x.com](https://x.com/)|>| for info',
    );
  });

  it('links multiple URLs in one note', () => {
    const runs = linkifyText('a https://one.com b https://two.com/x c');
    expect(runs.filter((r) => r.href)).toHaveLength(2);
  });
});
