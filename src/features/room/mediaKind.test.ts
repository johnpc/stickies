import { describe, expect, it } from 'vitest';
import { mediaKind } from './mediaKind';

describe('mediaKind', () => {
  it('classifies images by mime or extension', () => {
    expect(mediaKind('image/png', 'a.png')).toBe('IMAGE');
    expect(mediaKind('', 'photo.JPG')).toBe('IMAGE');
    expect(mediaKind('image/svg+xml', 'i.svg')).toBe('IMAGE');
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
