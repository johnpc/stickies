import { isLinkLike } from './safeHref';
import type { StickyKind } from './stickiesApi';

/**
 * Classify a sticky's content as a LINK or plain TEXT. A single-token value that
 * resolves to a safe URL (via safeHref) is a LINK; anything with whitespace or a
 * non-URL shape is TEXT. Keeps link detection in one tested place. Pure.
 */
export function detectKind(content: string): StickyKind {
  const trimmed = content.trim();
  if (!trimmed || /\s/.test(trimmed)) return 'TEXT';
  return isLinkLike(trimmed) ? 'LINK' : 'TEXT';
}
