/**
 * S3 upload + URL resolution for media (image/file) stickies. Uploads go under
 * `rooms/<slug>/<file>` as the guest identity (guest write is granted on that
 * prefix in the storage resource). Uses the Gen2 `path` API (NOT the legacy
 * `key` API, which prepends `public/` and would 403 against our `rooms/*`
 * grant). The sticky stores the returned S3 path in `content`; getUrl() resolves
 * it to a signed URL for preview/download.
 */
import { uploadData, getUrl, remove } from 'aws-amplify/storage';

/** A stable-ish S3 path for a room upload. `seed` (e.g. a timestamp passed by
 * the caller) keeps paths unique without Math.random here. */
export function mediaKey(room: string, fileName: string, seed: number): string {
  const safeName = fileName.replace(/[^\w.-]+/g, '_').slice(-80);
  return `rooms/${room}/${seed}-${safeName}`;
}

/** Upload a file to S3 and return its stored path. */
export async function uploadMedia(path: string, file: File): Promise<string> {
  const result = await uploadData({ path, data: file, options: { contentType: file.type } }).result;
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
