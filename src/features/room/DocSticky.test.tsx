import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StickyRecord } from '../../lib/dataClient';

const { useDocText, useMediaUrl, copyText } = vi.hoisted(() => ({
  useDocText: vi.fn(),
  useMediaUrl: vi.fn(),
  copyText: vi.fn().mockResolvedValue(true),
}));
vi.mock('./useDocText', () => ({ useDocText }));
vi.mock('./useMediaUrl', () => ({ useMediaUrl }));
vi.mock('./copyText', () => ({ copyText }));
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
  it('previews the first lines and expands to full on click', () => {
    useDocText.mockReturnValue({ text: long, isLoading: false, isError: false });
    render(<DocSticky sticky={sticky} />);
    expect(screen.getByTestId('code').textContent?.split('\n')).toHaveLength(8);
    fireEvent.click(screen.getByTestId('doc-expand'));
    expect(screen.getByTestId('code').textContent?.split('\n')).toHaveLength(20);
  });

  it('copies the full text (not just the preview)', () => {
    useDocText.mockReturnValue({ text: long, isLoading: false, isError: false });
    render(<DocSticky sticky={sticky} />);
    fireEvent.click(screen.getByTestId('doc-copy'));
    expect(copyText).toHaveBeenCalledWith(long);
  });

  it('shows an error when the text fails to load', () => {
    useDocText.mockReturnValue({ text: null, isLoading: false, isError: true });
    render(<DocSticky sticky={sticky} />);
    expect(screen.getByText(/Couldn.t load a.txt/)).toBeInTheDocument();
  });
});
