import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StickyRecord } from '../../lib/dataClient';

const { useDocText, useMediaUrl, copyText, downloadFile } = vi.hoisted(() => ({
  useDocText: vi.fn(),
  useMediaUrl: vi.fn(),
  copyText: vi.fn().mockResolvedValue(true),
  downloadFile: vi.fn(),
}));
vi.mock('./useDocText', () => ({ useDocText }));
vi.mock('./useMediaUrl', () => ({ useMediaUrl }));
vi.mock('./copyText', () => ({ copyText }));
vi.mock('./downloadFile', () => ({ downloadFile }));
// CodeSticky highlights via hljs; stub it to keep this a focused DOC test.
vi.mock('./CodeSticky', () => ({
  CodeSticky: ({ code }: { code: string }) => <pre data-testid="code">{code}</pre>,
}));

import { DocSticky } from './DocSticky';

const sticky = {
  id: '1',
  room: 'r',
  kind: 'DOC',
  content: 'rooms/r/1-a.txt',
  fileName: 'a.txt',
} as StickyRecord;
const long = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join('\n');

beforeEach(() => {
  useMediaUrl.mockReturnValue({ url: 'https://s3.example/x' });
  copyText.mockClear();
});

describe('DocSticky', () => {
  it('previews the first lines and pops the full text into a lightbox on expand', () => {
    useDocText.mockReturnValue({ text: long, isLoading: false, isError: false });
    render(<DocSticky sticky={sticky} />);
    // Inline preview shows the first 8 lines; no lightbox yet.
    expect(screen.getByTestId('code').textContent?.split('\n')).toHaveLength(8);
    expect(screen.queryByTestId('lightbox')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('doc-expand'));
    // Lightbox opens with the FULL text (20 lines).
    const box = screen.getByTestId('lightbox');
    expect(box.querySelector('[data-testid="code"]')?.textContent?.split('\n')).toHaveLength(20);
  });

  it('copies the full text (not just the preview)', () => {
    useDocText.mockReturnValue({ text: long, isLoading: false, isError: false });
    render(<DocSticky sticky={sticky} />);
    fireEvent.click(screen.getByTestId('doc-copy'));
    expect(copyText).toHaveBeenCalledWith(long);
  });

  it('shows an error when the text fails to load, still offering download of the intact file', () => {
    useDocText.mockReturnValue({ text: null, isLoading: false, isError: true });
    render(<DocSticky sticky={sticky} />);
    expect(screen.getByText(/Couldn.t load a preview of a.txt/)).toBeInTheDocument();
    // The preview failed, but the uploaded file is intact — download must remain.
    fireEvent.click(screen.getByTestId('doc-download'));
    expect(downloadFile).toHaveBeenCalledWith('https://s3.example/x', 'a.txt');
  });

  it('omits the download button in the error state when no URL is available', () => {
    useDocText.mockReturnValue({ text: null, isLoading: false, isError: true });
    useMediaUrl.mockReturnValue({ url: undefined });
    render(<DocSticky sticky={sticky} />);
    expect(screen.getByText(/Couldn.t load a preview/)).toBeInTheDocument();
    expect(screen.queryByTestId('doc-download')).not.toBeInTheDocument();
  });
});
