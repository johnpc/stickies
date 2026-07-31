/**
 * Bound what a CODE sticky RENDERS. highlight.js runs synchronously on the whole
 * string and CodeSticky builds one gutter node per line, so a large/minified
 * snippet froze the main thread for EVERY viewer on the shared pad (auto-detect
 * alone is ~1.5s at 5k lines, ~4.5s at 15k). The card is clipped to a few
 * hundred px and just scrolls, so there's no reason to highlight+lay out
 * thousands of lines. Cap the rendered slice by BOTH line count and byte length
 * (whichever hits first); the raw source is untouched, so Copy still yields the
 * full snippet. Pure + unit-testable.
 */

/** Max lines to render inline before truncating. */
export const CODE_MAX_LINES = 400;
/** Max characters to render (guards a single monster/minified line). */
export const CODE_MAX_CHARS = 40_000;

export interface CappedCode {
  /** The slice to highlight + render. */
  code: string;
  /** True when the source was longer than the cap (drives a "truncated" note). */
  truncated: boolean;
}

/** Cap `code` to CODE_MAX_LINES / CODE_MAX_CHARS for rendering. */
export function capCode(code: string): CappedCode {
  let sliced = code;
  let truncated = false;

  const nl = indexOfNthNewline(sliced, CODE_MAX_LINES);
  if (nl !== -1) {
    sliced = sliced.slice(0, nl);
    truncated = true;
  }
  if (sliced.length > CODE_MAX_CHARS) {
    sliced = sliced.slice(0, CODE_MAX_CHARS);
    truncated = true;
  }
  return { code: sliced, truncated };
}

/** Index of the `n`-th newline in `s`, or -1 if there are fewer than `n`. */
function indexOfNthNewline(s: string, n: number): number {
  let idx = -1;
  for (let i = 0; i < n; i++) {
    idx = s.indexOf('\n', idx + 1);
    if (idx === -1) return -1;
  }
  return idx;
}
