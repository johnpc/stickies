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

/**
 * Classify an uploaded file into a sticky kind by MIME type (falling back to the
 * filename extension). Previewable types get a bespoke renderer: IMAGE/PDF/VIDEO,
 * or DOC for text/code files (inline preview + expand + copy). Everything else —
 * zips, binaries, unknown — is a generic downloadable FILE. Pure + unit-tested.
 */
export function mediaKind(mimeType: string | null | undefined, fileName = ''): MediaKind {
  const mime = (mimeType ?? '').toLowerCase();
  const ext = fileName.toLowerCase().split('.').pop() ?? '';

  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    return 'IMAGE';
  }
  if (mime === 'application/pdf' || ext === 'pdf') return 'PDF';
  if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v'].includes(ext)) return 'VIDEO';
  if (mime.startsWith('text/') || DOC_EXTS.has(ext)) return 'DOC';
  return 'FILE';
}
