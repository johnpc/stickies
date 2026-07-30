export interface DocPreview {
  /** The lines to show (all when expanded or short; first N otherwise). */
  shown: string;
  /** True when the full text has more than `limit` lines (so an expander shows). */
  truncated: boolean;
  /** Total line count (for the "show all N lines" affordance). */
  totalLines: number;
}

/**
 * Compute a DOC sticky's preview text. When collapsed and the file is longer than
 * `limit` lines, show only the first `limit` lines and flag it truncated; when
 * expanded (or short), show everything. Pure so the component stays a renderer
 * and this is unit-testable.
 */
export function docPreview(text: string, expanded: boolean, limit = 8): DocPreview {
  const lines = text.split('\n');
  const truncated = lines.length > limit;
  const shown = !truncated || expanded ? text : lines.slice(0, limit).join('\n');
  return { shown, truncated, totalLines: lines.length };
}
