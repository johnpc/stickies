import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { useQrCode } = vi.hoisted(() => ({ useQrCode: vi.fn() }));
vi.mock('./useQrCode', () => ({ useQrCode }));
vi.mock('./useCopyAction', () => ({ useCopyAction: () => vi.fn() }));

import { ShareRoomPanel } from './ShareRoomPanel';

const url = 'https://stickies.jpc.io/demo';

describe('ShareRoomPanel', () => {
  it('shows the QR image when generation succeeds', () => {
    useQrCode.mockReturnValue({ status: 'ready', dataUrl: 'data:image/png;base64,QR' });
    render(<ShareRoomPanel url={url} onClose={vi.fn()} />);
    expect(screen.getByTestId('share-qr')).toHaveAttribute('src', 'data:image/png;base64,QR');
    expect(screen.queryByTestId('share-qr-error')).not.toBeInTheDocument();
  });

  it('shows a readable "unavailable" message on QR failure (not an eternal skeleton)', () => {
    // Regression: an over-capacity URL made toDataURL reject, and pending/error
    // both rendered the same gray box — a permanent fake "loading" state.
    useQrCode.mockReturnValue({ status: 'error', dataUrl: null });
    render(<ShareRoomPanel url={url} onClose={vi.fn()} />);
    expect(screen.getByTestId('share-qr-error')).toHaveTextContent(/unavailable/i);
    expect(screen.queryByTestId('share-qr')).not.toBeInTheDocument();
    // The copy-link fallback is still there.
    expect(screen.getByTestId('share-url')).toHaveTextContent(url);
    expect(screen.getByTestId('share-copy')).toBeInTheDocument();
  });

  it('shows the pending skeleton (no error message) while generating', () => {
    useQrCode.mockReturnValue({ status: 'pending', dataUrl: null });
    render(<ShareRoomPanel url={url} onClose={vi.fn()} />);
    // The panel renders in a Lightbox portal, so query the document.
    expect(document.querySelector('.share-room__qr--pending')).not.toBeNull();
    expect(screen.queryByTestId('share-qr-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('share-qr')).not.toBeInTheDocument();
  });
});
