import { beforeEach, describe, expect, it, vi } from 'vitest';

const { uploadData, getUrl, remove } = vi.hoisted(() => ({
  uploadData: vi.fn(),
  getUrl: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('aws-amplify/storage', () => ({ uploadData, getUrl, remove }));

import {
  mediaKey,
  uploadMedia,
  resolveMediaUrl,
  removeMedia,
  uploadSizeError,
  formatBytes,
  MAX_UPLOAD_BYTES,
} from './mediaApi';

/** A File that reports `bytes` as its size without allocating that much memory. */
function fileOfSize(bytes: number, name = 'f.bin', type = 'application/octet-stream'): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: bytes });
  return file;
}

beforeEach(() => {
  uploadData.mockReset();
  getUrl.mockReset();
  remove.mockReset();
});

describe('mediaKey', () => {
  it('namespaces by room and sanitizes the filename', () => {
    expect(mediaKey('grocery', 'my file (1).png', 42)).toBe('rooms/grocery/42-my_file_1_.png');
  });

  it('truncates very long names to the last 80 chars', () => {
    const key = mediaKey('r', `${'a'.repeat(200)}.png`, 1);
    expect(key.startsWith('rooms/r/1-')).toBe(true);
    expect(key.length).toBeLessThan('rooms/r/1-'.length + 81);
  });
});

describe('uploadSizeError', () => {
  it('returns null for a file within the cap', () => {
    expect(uploadSizeError(fileOfSize(MAX_UPLOAD_BYTES))).toBeNull();
    expect(uploadSizeError(fileOfSize(1024))).toBeNull();
  });

  it('returns a specific message for a file over the cap', () => {
    const msg = uploadSizeError(fileOfSize(MAX_UPLOAD_BYTES + 1));
    expect(msg).toContain('too large');
    expect(msg).toContain('25 MB');
  });
});

describe('formatBytes', () => {
  it('formats large sizes as whole MB and small ones with a decimal', () => {
    expect(formatBytes(25 * 1024 * 1024)).toBe('25 MB');
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });
});

describe('uploadMedia', () => {
  it('uploads to the S3 path with the file content type and returns the stored path', async () => {
    uploadData.mockReturnValue({ result: Promise.resolve({ path: 'rooms/r/1-a.png' }) });
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    expect(await uploadMedia('rooms/r/1-a.png', file)).toBe('rooms/r/1-a.png');
    expect(uploadData).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'rooms/r/1-a.png', options: { contentType: 'image/png' } }),
    );
  });

  it('rejects an over-cap file WITHOUT starting the upload', async () => {
    await expect(
      uploadMedia('rooms/r/1-big.png', fileOfSize(MAX_UPLOAD_BYTES + 1)),
    ).rejects.toThrow(/too large/);
    expect(uploadData).not.toHaveBeenCalled();
  });

  it('rejects (does not hang) when the upload stalls past the timeout', async () => {
    // A never-settling upload result — the withTimeout race must reject.
    uploadData.mockReturnValue({ result: new Promise(() => {}) });
    vi.useFakeTimers();
    try {
      const p = uploadMedia('rooms/r/1-a.png', new File(['x'], 'a.png', { type: 'image/png' }));
      const assertion = expect(p).rejects.toThrow(/timed out/);
      await vi.advanceTimersByTimeAsync(60_001);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('resolveMediaUrl', () => {
  it('resolves a path to a URL string', async () => {
    getUrl.mockResolvedValue({ url: new URL('https://s3.example/x?sig=1') });
    expect(await resolveMediaUrl('rooms/r/1-a.png')).toBe('https://s3.example/x?sig=1');
  });
});

describe('removeMedia', () => {
  it('removes the object by path', async () => {
    remove.mockResolvedValue(undefined);
    await removeMedia('rooms/r/1-a.png');
    expect(remove).toHaveBeenCalledWith({ path: 'rooms/r/1-a.png' });
  });
});
