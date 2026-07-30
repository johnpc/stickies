import { beforeEach, describe, expect, it, vi } from 'vitest';

const { uploadData, getUrl, remove } = vi.hoisted(() => ({
  uploadData: vi.fn(),
  getUrl: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('aws-amplify/storage', () => ({ uploadData, getUrl, remove }));

import { mediaKey, uploadMedia, resolveMediaUrl, removeMedia } from './mediaApi';

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

describe('uploadMedia', () => {
  it('uploads to the S3 path with the file content type and returns the stored path', async () => {
    uploadData.mockReturnValue({ result: Promise.resolve({ path: 'rooms/r/1-a.png' }) });
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    expect(await uploadMedia('rooms/r/1-a.png', file)).toBe('rooms/r/1-a.png');
    expect(uploadData).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'rooms/r/1-a.png', options: { contentType: 'image/png' } }),
    );
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
