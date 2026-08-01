import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { useQrCode } = vi.hoisted(() => ({ useQrCode: vi.fn() }));
vi.mock('./useQrCode', () => ({ useQrCode }));
const { copy } = vi.hoisted(() => ({ copy: vi.fn() }));
vi.mock('./useCopyAction', () => ({ useCopyAction: () => copy }));
const { canShare, share } = vi.hoisted(() => ({ canShare: vi.fn(() => false), share: vi.fn() }));
vi.mock('./shareUrl', () => ({ canShare }));
vi.mock('./useShareAction', () => ({ useShareAction: () => share }));

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

  it('displays + copies a READABLE url but feeds the QR the raw (encoded) one', () => {
    // A unicode room's href is percent-encoded; show/copy the decoded form, but
    // the QR must encode the canonical raw URL that scanners expect.
    copy.mockClear();
    useQrCode.mockReturnValue({ status: 'ready', dataUrl: 'data:image/png;base64,QR' });
    const encoded = 'https://stickies.jpc.io/' + encodeURIComponent('café');
    render(<ShareRoomPanel url={encoded} onClose={vi.fn()} />);
    // Shown decoded, no %XX.
    expect(screen.getByTestId('share-url')).toHaveTextContent('https://stickies.jpc.io/café');
    // QR got the RAW encoded url.
    expect(useQrCode).toHaveBeenCalledWith(encoded);
    // Copy sends the readable form.
    fireEvent.click(screen.getByTestId('share-copy'));
    expect(copy).toHaveBeenCalledWith('https://stickies.jpc.io/café');
  });

  it('hides the native Share button where the Web Share API is unavailable', () => {
    canShare.mockReturnValue(false);
    useQrCode.mockReturnValue({ status: 'ready', dataUrl: 'data:image/png;base64,QR' });
    render(<ShareRoomPanel url={url} onClose={vi.fn()} />);
    expect(screen.queryByTestId('share-native')).not.toBeInTheDocument();
  });

  it('shows the native Share button when supported and shares the RAW url', () => {
    share.mockClear();
    canShare.mockReturnValue(true);
    useQrCode.mockReturnValue({ status: 'ready', dataUrl: 'data:image/png;base64,QR' });
    const encoded = 'https://stickies.jpc.io/' + encodeURIComponent('café');
    render(<ShareRoomPanel url={encoded} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('share-native'));
    // The native sheet gets the canonical raw URL (the OS/target apps expect it).
    expect(share).toHaveBeenCalledWith(encoded);
  });
});
