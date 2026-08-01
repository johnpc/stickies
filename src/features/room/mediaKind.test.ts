import { describe, expect, it } from 'vitest';
import { mediaKind } from './mediaKind';

describe('mediaKind', () => {
  it('classifies web-renderable images by mime or extension', () => {
    expect(mediaKind('image/png', 'a.png')).toBe('IMAGE');
    expect(mediaKind('', 'photo.JPG')).toBe('IMAGE');
    expect(mediaKind('image/svg+xml', 'i.svg')).toBe('IMAGE');
    expect(mediaKind('image/webp', 'c.webp')).toBe('IMAGE');
    expect(mediaKind('image/avif', 'd.avif')).toBe('IMAGE');
    expect(mediaKind('', 'icon.ico')).toBe('IMAGE');
  });

  it('treats non-web images (HEIC/HEIF/TIFF) as downloadable FILE, not a broken preview', () => {
    // Regression: `mime.startsWith('image/')` classified these as IMAGE, but only
    // Apple browsers decode them — so an iPhone photo (HEIC is the default) showed
    // "Couldn't load" to every Android/Chrome/Firefox viewer of the shared pad.
    // They must be a FILE (download card) instead.
    expect(mediaKind('image/heic', 'IMG_1234.HEIC')).toBe('FILE');
    expect(mediaKind('image/heif', 'photo.heif')).toBe('FILE');
    expect(mediaKind('image/tiff', 'scan.tiff')).toBe('FILE');
    expect(mediaKind('', 'IMG_1234.heic')).toBe('FILE');
    expect(mediaKind('', 'scan.tif')).toBe('FILE');
  });

  it('classifies PDFs', () => {
    expect(mediaKind('application/pdf', 'doc.pdf')).toBe('PDF');
    expect(mediaKind('', 'report.pdf')).toBe('PDF');
  });

  it('classifies videos by mime or extension', () => {
    expect(mediaKind('video/mp4', 'clip.mp4')).toBe('VIDEO');
    expect(mediaKind('', 'movie.webm')).toBe('VIDEO');
  });

  it('classifies text/code files as DOC (previewable)', () => {
    expect(mediaKind('text/plain', 'notes.txt')).toBe('DOC');
    expect(mediaKind('', 'app.ts')).toBe('DOC');
    expect(mediaKind('', 'data.csv')).toBe('DOC');
    expect(mediaKind('application/json', 'config.json')).toBe('DOC');
  });

  it('falls back to FILE for opaque types (zip, docx, unknown)', () => {
    expect(mediaKind('application/zip', 'archive.zip')).toBe('FILE');
    expect(mediaKind('', 'notes.docx')).toBe('FILE');
    expect(mediaKind(null, '')).toBe('FILE');
  });
});
