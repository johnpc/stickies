/**
 * S3 upload + URL resolution for media (image/file) stickies. Uploads go under
 * `rooms/<slug>/<file>` as the guest identity (guest write is granted on that
 * prefix in the storage resource). Uses the Gen2 `path` API (NOT the legacy
 * `key` API, which prepends `public/` and would 403 against our `rooms/*`
 * grant). The sticky stores the returned S3 path in `content`; getUrl() resolves
 * it to a signed URL for preview/download.
 */
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import { withTimeout } from '../../lib/withTimeout';

/** Largest file we accept for a media sticky (25 MB). A shared pad is for quick
 * notes/snapshots, not hosting big media; a giant file uploads slowly (bad UX
 * for everyone on the pad) and runs up storage. Checked before the upload starts
 * so the user gets an instant, clear rejection. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** How long to allow an upload before treating it as stalled (60s — generous vs
 * the 12s metadata-write bound, since a real transfer legitimately takes longer,
 * but finite so a dead connection can't spin "Uploading…" forever). */
export const UPLOAD_TIMEOUT_MS = 60_000;

/** A human size for the too-big error (e.g. "25 MB"). */
export function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
}

/** A user-facing reason a file can't be uploaded, or null if it's fine. Pure, so
 * the UI can reject an over-cap file up front (instant, specific message — not a
 * misleading "check your connection") before it ever enters the upload flow. */
export function uploadSizeError(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That file is too large (max ${formatBytes(MAX_UPLOAD_BYTES)}). Try a smaller one.`;
  }
  return null;
}

/** A stable-ish S3 path for a room upload. `seed` (e.g. a timestamp passed by
 * the caller) keeps paths unique without Math.random here. */
export function mediaKey(room: string, fileName: string, seed: number): string {
  const safeName = fileName.replace(/[^\w.-]+/g, '_').slice(-80);
  return `rooms/${room}/${seed}-${safeName}`;
}

/** Upload a file to S3 and return its stored path. Rejects an over-cap file up
 * front, and races the transfer against a timeout so a stalled/dead connection
 * surfaces a real error (retryable toast) instead of an endless "Uploading…"
 * spinner — matching the withTimeout discipline on every other write. */
export async function uploadMedia(path: string, file: File): Promise<string> {
  const tooBig = uploadSizeError(file);
  if (tooBig) throw new Error(tooBig); // belt-and-suspenders: UI also checks up front
  const result = await withTimeout(
    uploadData({ path, data: file, options: { contentType: file.type } }).result,
    UPLOAD_TIMEOUT_MS,
  );
  return result.path;
}

/** Resolve a stored S3 path to a temporary signed URL for preview/download. */
export async function resolveMediaUrl(path: string): Promise<string> {
  const { url } = await getUrl({ path });
  return url.toString();
}

/** Delete an uploaded object (when its sticky is removed). Best-effort. */
export async function removeMedia(path: string): Promise<void> {
  await remove({ path });
}
