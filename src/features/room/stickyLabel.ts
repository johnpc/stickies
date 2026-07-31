import type { StickyRecord } from '../../lib/dataClient';
import type { StickyColor } from './stickyPalette';

/** Human names for the kinds a screen reader benefits from hearing (media/link
 * where the body text alone is opaque, e.g. an S3 key). TEXT/LINK read their
 * content, so they don't need a kind prefix. */
const KIND_WORD: Partial<Record<NonNullable<StickyRecord['kind']>, string>> = {
  CODE: 'code snippet',
  IMAGE: 'image',
  PDF: 'PDF',
  VIDEO: 'video',
  DOC: 'document',
  FILE: 'file',
};

/**
 * An accessible label for a resting sticky card, so a screen reader announces
 * each note as a distinct, described list item — conveying the COLOR (a
 * visual-only signal on the pad) and, for media/code, the kind + filename
 * (whose stored `content` is an opaque S3 key, not readable text). A plain TEXT
 * or LINK note omits a snippet here because its body text is already read out.
 * Pure + unit-testable.
 */
export function stickyLabel(sticky: StickyRecord, color: StickyColor): string {
  const kindWord = sticky.kind ? KIND_WORD[sticky.kind] : undefined;
  if (kindWord) {
    const name = sticky.fileName?.trim();
    return `${color} note: ${kindWord}${name ? ` ${name}` : ''}`;
  }
  return `${color} note`;
}
