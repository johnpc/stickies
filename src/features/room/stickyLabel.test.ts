import { describe, expect, it } from 'vitest';
import { stickyLabel } from './stickyLabel';
import type { StickyRecord } from '../../lib/dataClient';

const make = (over: Partial<StickyRecord>): StickyRecord =>
  ({ id: '1', room: 'r', kind: 'TEXT', content: 'hi', ...over }) as StickyRecord;

describe('stickyLabel', () => {
  it('names the color for a plain text note (body text is read separately)', () => {
    expect(stickyLabel(make({ kind: 'TEXT' }), 'yellow')).toBe('yellow note');
    expect(stickyLabel(make({ kind: 'LINK' }), 'blue')).toBe('blue note');
  });

  it('describes a media note by kind + filename (its content is an opaque S3 key)', () => {
    expect(stickyLabel(make({ kind: 'IMAGE', fileName: 'photo.png' }), 'pink')).toBe(
      'pink note: image photo.png',
    );
    expect(stickyLabel(make({ kind: 'PDF', fileName: 'report.pdf' }), 'green')).toBe(
      'green note: PDF report.pdf',
    );
    expect(stickyLabel(make({ kind: 'CODE' }), 'purple')).toBe('purple note: code snippet');
  });

  it('omits a missing filename gracefully', () => {
    expect(stickyLabel(make({ kind: 'FILE', fileName: undefined }), 'yellow')).toBe(
      'yellow note: file',
    );
  });
});
