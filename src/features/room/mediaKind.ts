/** Media sticky kinds (a subset of StickyKind) — the ones backed by an S3 upload. */
export type MediaKind = 'IMAGE' | 'PDF' | 'VIDEO' | 'DOC' | 'FILE';

// Text/code file extensions that get an inline text preview (expand + copy).
const DOC_EXTS = new Set([
  'txt',
  'md',
  'markdown',
  'log',
  'csv',
  'tsv',
  'json',
  'yaml',
  'yml',
  'xml',
  'html',
  'css',
  'scss',
  'js',
  'jsx',
  'ts',
  'tsx',
  'py',
  'rb',
  'go',
  'rs',
  'java',
  'c',
  'h',
  'cpp',
  'sh',
  'bash',
  'sql',
  'toml',
  'ini',
  'env',
]);

// Image formats an <img> tag decodes across ALL major browsers. HEIC/HEIF (the
// iPhone default) and TIFF are DELIBERATELY excluded: only Apple browsers decode
// them, so on a cross-device shared pad an iPhone photo classified IMAGE renders
// as a broken "Couldn't load" for every Android/Chrome/Firefox viewer. Left out
// of the allowlist, those fall through to FILE — a download card that works
// everywhere — instead of a dead preview.
const WEB_IMAGE_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/avif',
]);
const WEB_IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'];

/**
 * Classify an uploaded file into a sticky kind by MIME type (falling back to the
 * filename extension). Previewable types get a bespoke renderer: IMAGE/PDF/VIDEO,
 * or DOC for text/code files (inline preview + expand + copy). Everything else —
 * zips, binaries, HEIC/TIFF, unknown — is a generic downloadable FILE. Pure + unit-tested.
 */
export function mediaKind(mimeType: string | null | undefined, fileName = ''): MediaKind {
  const mime = (mimeType ?? '').toLowerCase();
  const ext = fileName.toLowerCase().split('.').pop() ?? '';

  // Only IMAGE for formats a browser can actually render inline (see allowlist);
  // non-web images (HEIC/HEIF/TIFF) fall through to FILE so they're downloadable
  // rather than a broken <img> on non-Apple devices.
  if (WEB_IMAGE_MIMES.has(mime) || WEB_IMAGE_EXTS.includes(ext)) {
    return 'IMAGE';
  }
  if (mime === 'application/pdf' || ext === 'pdf') return 'PDF';
  if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v'].includes(ext)) return 'VIDEO';
  if (mime.startsWith('text/') || DOC_EXTS.has(ext)) return 'DOC';
  return 'FILE';
}
