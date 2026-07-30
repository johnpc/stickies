/** Media sticky kinds (a subset of StickyKind) — the ones backed by an S3 upload. */
export type MediaKind = 'IMAGE' | 'PDF' | 'VIDEO' | 'FILE';

/**
 * Classify an uploaded file into a sticky kind by MIME type (falling back to the
 * filename extension). Previewable types get a bespoke renderer (IMAGE/PDF/VIDEO);
 * everything else — zips, docs, unknown — is a generic downloadable FILE. Pure so
 * it's unit-testable and used both at upload time and (defensively) on render.
 */
export function mediaKind(mimeType: string | null | undefined, fileName = ''): MediaKind {
  const mime = (mimeType ?? '').toLowerCase();
  const ext = fileName.toLowerCase().split('.').pop() ?? '';

  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    return 'IMAGE';
  }
  if (mime === 'application/pdf' || ext === 'pdf') return 'PDF';
  if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v'].includes(ext)) return 'VIDEO';
  return 'FILE';
}
