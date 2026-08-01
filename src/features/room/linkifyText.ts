import { safeHref } from './safeHref';

/**
 * Split a plain-text note into text and LINK runs so a URL embedded in a
 * sentence ("Standup: https://zoom.us/j/1 at 10am") is tappable — otherwise the
 * whole note is inert text and the app's core "share a link" purpose is lost for
 * the most common paste shape (a URL WITH surrounding words; a bare-token URL is
 * already its own LINK sticky).
 *
 * Only EXPLICIT urls (http(s):// or www.) are linkified — bare "host.tld" runs in
 * prose are left alone because that's where false positives live (emails like
 * a@b.com, "node.js", version numbers "1.2.3", filenames). What you copy from a
 * browser to paste into a note is a full URL anyway. Each match is validated
 * through safeHref (the same XSS guard every anchor uses), so a javascript:/data:
 * "url" stays plain text. Pure over its input.
 */
export interface TextRun {
  text: string;
  /** A safe href when this run is a link; null for a plain-text run. */
  href: string | null;
}

const URL_RUN = /((?:https?:\/\/|www\.)[^\s]+)/gi;
// Trailing punctuation a URL picks up from prose (sentence enders, closing pairs).
// `>` is here for angle-bracket / Markdown-autolink URLs (<https://x.com>): the
// leading `<` is split off by the whitespace-bounded run, leaving a trailing `>`.
const TRAILING = /[.,;:!?)\]}'">]$/;

export function linkifyText(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_RUN)) {
    const candidate = match[0];
    const start = match.index ?? 0;
    const href = safeHref(candidate);
    if (!href) continue; // not a real/safe URL — leave it in the surrounding text
    if (start > last) runs.push({ text: text.slice(last, start), href: null });
    // Peel trailing sentence punctuation that safeHref would strip anyway, so the
    // anchor text matches the link and the "." / ")" stays as plain text — but
    // ONLY when removing it doesn't change the resolved URL (a legit "…/Foo_(bar)"
    // keeps its paren because dropping it yields a different href).
    let core = candidate;
    while (core.length > 1 && TRAILING.test(core) && safeHref(core.slice(0, -1)) === href) {
      core = core.slice(0, -1);
    }
    runs.push({ text: core, href });
    if (core.length < candidate.length)
      runs.push({ text: candidate.slice(core.length), href: null });
    last = start + candidate.length;
  }
  if (last < text.length) runs.push({ text: text.slice(last), href: null });
  return runs;
}
