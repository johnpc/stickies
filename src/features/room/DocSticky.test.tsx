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
// Expose hideTruncationNote so we can assert DocSticky owns the truncation message.
vi.mock('./CodeSticky', () => ({
  CodeSticky: ({ code, hideTruncationNote }: { code: string; hideTruncationNote?: boolean }) => (
    <pre data-testid="code" data-hide-truncation={hideTruncationNote ? 'true' : 'false'}>
      {code}
    </pre>
  ),
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

  it('shows a "preview truncated — download" notice in the lightbox for a capped file', () => {
    // Regression: a file over the 256KB read cap was shown truncated with no hint
    // — the user thought the cut-off preview was the whole document.
    useDocText.mockReturnValue({ text: long, truncated: true, isLoading: false, isError: false });
    render(<DocSticky sticky={sticky} />);
    // Not shown on the inline preview…
    expect(screen.queryByTestId('doc-truncated')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('doc-expand'));
    // …but present in the expanded view, pointing at Download.
    const notice = screen.getByTestId('doc-truncated');
    expect(notice).toHaveTextContent(/truncated/i);
    expect(notice).toHaveTextContent(/download/i);
  });

  it('a capped file tells CodeSticky to hide its "use Copy" note (Download is the truth)', () => {
    // Regression: for a >256KB file, the lightbox showed BOTH "Download for the
    // full file" (correct) AND CodeSticky's "use Copy for the full snippet" — but
    // Copy only holds the 256KB prefix. DocSticky owns the message, so CodeSticky
    // must suppress its own note when the file was capped.
    useDocText.mockReturnValue({ text: long, truncated: true, isLoading: false, isError: false });
    render(<DocSticky sticky={sticky} />);
    fireEvent.click(screen.getByTestId('doc-expand'));
    const codes = screen.getAllByTestId('code');
    // The lightbox CodeSticky (full variant) is told to hide its truncation note.
    expect(codes.some((c) => c.getAttribute('data-hide-truncation') === 'true')).toBe(true);
  });

  it('does NOT show the truncated notice for a fully-loaded file', () => {
    useDocText.mockReturnValue({ text: long, truncated: false, isLoading: false, isError: false });
    render(<DocSticky sticky={sticky} />);
    fireEvent.click(screen.getByTestId('doc-expand'));
    expect(screen.queryByTestId('doc-truncated')).not.toBeInTheDocument();
  });

  it('copies the full text (not just the preview)', () => {
    useDocText.mockReturnValue({ text: long, isLoading: false, isError: false });
    render(<DocSticky sticky={sticky} />);
    fireEvent.click(screen.getByTestId('doc-copy'));
    expect(copyText).toHaveBeenCalledWith(long);
  });

  it('shows an error when the text fails to load, still offering download of the intact file', () => {
    useDocText.mockReturnValue({ text: null, isLoading: false, isError: true, retry: vi.fn() });
    render(<DocSticky sticky={sticky} />);
    expect(screen.getByText(/Couldn.t load a preview of a.txt/)).toBeInTheDocument();
    // The preview failed, but the uploaded file is intact — download must remain.
    fireEvent.click(screen.getByTestId('doc-download'));
    expect(downloadFile).toHaveBeenCalledWith('https://s3.example/x', 'a.txt');
  });

  it('offers a Retry that re-runs the preview fetch (recovers an expired signed URL)', () => {
    // Regression: a transient error/403 (expired signed URL, network blip) left the
    // preview permanently broken until a full page reload — there was no retry.
    const retry = vi.fn();
    useDocText.mockReturnValue({ text: null, isLoading: false, isError: true, retry });
    render(<DocSticky sticky={sticky} />);
    fireEvent.click(screen.getByTestId('doc-retry'));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('omits the download button in the error state when no URL is available, but keeps Retry', () => {
    useDocText.mockReturnValue({ text: null, isLoading: false, isError: true, retry: vi.fn() });
    useMediaUrl.mockReturnValue({ url: undefined });
    render(<DocSticky sticky={sticky} />);
    expect(screen.getByText(/Couldn.t load a preview/)).toBeInTheDocument();
    expect(screen.queryByTestId('doc-download')).not.toBeInTheDocument();
    // The preview is still recoverable even without a download URL.
    expect(screen.getByTestId('doc-retry')).toBeInTheDocument();
  });
});
