import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StickyRecord } from '../../lib/dataClient';

const { useMediaUrl } = vi.hoisted(() => ({ useMediaUrl: vi.fn() }));
vi.mock('./useMediaUrl', () => ({ useMediaUrl }));

import { MediaSticky } from './MediaSticky';

const make = (over: Partial<StickyRecord>): StickyRecord =>
  ({ id: '1', room: 'r', kind: 'IMAGE', content: 'rooms/r/1-a.png', ...over }) as StickyRecord;

beforeEach(() => {
  useMediaUrl.mockReturnValue({ url: 'https://s3.example/x', isLoading: false, isError: false });
});

describe('MediaSticky', () => {
  it('shows a loading state while the URL resolves', () => {
    useMediaUrl.mockReturnValue({ url: undefined, isLoading: true, isError: false });
    render(<MediaSticky sticky={make({ fileName: 'a.png', mimeType: 'image/png' })} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders an <img> for image stickies, with download + expand', () => {
    render(<MediaSticky sticky={make({ fileName: 'a.png', mimeType: 'image/png' })} />);
    expect(screen.getByTestId('media-image')).toHaveAttribute('src', 'https://s3.example/x');
    expect(screen.getByTestId('media-download')).toHaveAttribute('download', 'a.png');
    expect(screen.getByTestId('media-expand')).toBeInTheDocument();
  });

  it('pops the image out to a lightbox on expand, and closes it', () => {
    render(<MediaSticky sticky={make({ fileName: 'a.png', mimeType: 'image/png' })} />);
    expect(screen.queryByTestId('lightbox')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('media-expand'));
    expect(screen.getByTestId('lightbox')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('lightbox-close'));
    expect(screen.queryByTestId('lightbox')).not.toBeInTheDocument();
  });

  it('renders a <video> for video stickies', () => {
    render(
      <MediaSticky sticky={make({ kind: 'VIDEO', fileName: 'c.mp4', mimeType: 'video/mp4' })} />,
    );
    expect(screen.getByTestId('media-video')).toBeInTheDocument();
  });

  it('renders a PDF iframe + download link', () => {
    render(
      <MediaSticky
        sticky={make({ kind: 'PDF', fileName: 'd.pdf', mimeType: 'application/pdf' })}
      />,
    );
    expect(screen.getByTestId('media-pdf')).toBeInTheDocument();
  });

  it('renders a generic download card for opaque files', () => {
    render(
      <MediaSticky
        sticky={make({ kind: 'FILE', fileName: 'a.zip', mimeType: 'application/zip' })}
      />,
    );
    const link = screen.getByTestId('media-file');
    expect(link).toHaveAttribute('href', 'https://s3.example/x');
    expect(link).toHaveTextContent('a.zip');
  });

  it('shows a friendly error when the URL fails to resolve', () => {
    useMediaUrl.mockReturnValue({ url: undefined, isLoading: false, isError: true });
    render(<MediaSticky sticky={make({ fileName: 'a.png' })} />);
    expect(screen.getByText(/Couldn.t load a.png/)).toBeInTheDocument();
  });
});
