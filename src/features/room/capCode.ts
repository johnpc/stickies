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

/** Inline (on-pad) render limits — small, since every viewer renders every card. */
export const CODE_MAX_LINES = 400;
/** Max characters to render inline (guards a single monster/minified line). */
export const CODE_MAX_CHARS = 40_000;

/** EXPANDED (lightbox) limits — much higher, because only one snippet renders at
 * a time (not the whole pad), so the "freeze every viewer" risk doesn't apply.
 * Still bounded so a pathological minified blob can't lock the tab. This makes
 * Expand actually reveal more instead of showing the same capped preview. */
export const CODE_EXPANDED_MAX_LINES = 5000;
export const CODE_EXPANDED_MAX_CHARS = 500_000;

export interface CappedCode {
  /** The slice to highlight + render. */
  code: string;
  /** True when the source was longer than the cap (drives a "truncated" note). */
  truncated: boolean;
}

/** Cap `code` for rendering. Pass the higher expanded limits for the lightbox so
 * Expand shows far more than the inline preview. */
export function capCode(
  code: string,
  maxLines = CODE_MAX_LINES,
  maxChars = CODE_MAX_CHARS,
): CappedCode {
  let sliced = code;
  let truncated = false;

  const nl = indexOfNthNewline(sliced, maxLines);
  if (nl !== -1) {
    sliced = sliced.slice(0, nl);
    truncated = true;
  }
  if (sliced.length > maxChars) {
    sliced = sliced.slice(0, maxChars);
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
