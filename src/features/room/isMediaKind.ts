import type { StickyRecord } from '../../lib/dataClient';

const MEDIA_KINDS = new Set(['IMAGE', 'PDF', 'VIDEO', 'DOC', 'FILE']);

/** Whether a sticky kind is backed by an S3 upload (rendered by MediaSticky).
 * Pure; kept separate so StickyBody can branch without importing the storage
 * client eagerly. */
export function isMediaKind(kind: StickyRecord['kind']): boolean {
  return kind != null && MEDIA_KINDS.has(kind);
}
