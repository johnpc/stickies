import type { StickyRecord } from '../../lib/dataClient';

const EDITABLE_KINDS = new Set(['TEXT', 'LINK', 'CODE']);

/** Whether a sticky's content is user-authored text that can be edited in place.
 * Media kinds (IMAGE/PDF/VIDEO/DOC/FILE) store an S3 KEY in `content`, not text —
 * editing that as text would corrupt the reference, so they're not editable.
 * A null/unknown kind defaults to editable (it renders as plain text). Pure. */
export function isEditableKind(kind: StickyRecord['kind']): boolean {
  return kind == null || EDITABLE_KINDS.has(kind);
}
