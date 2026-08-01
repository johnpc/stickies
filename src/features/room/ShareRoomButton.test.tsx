import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { copy } = vi.hoisted(() => ({ copy: vi.fn() }));
vi.mock('./useCopyAction', () => ({ useCopyAction: () => copy }));
// Stub the QR generator (async canvas work) so the panel renders synchronously.
vi.mock('./useQrCode', () => ({
  useQrCode: () => ({ status: 'ready', dataUrl: 'data:image/png;base64,QR' }),
}));

import { ShareRoomButton } from './ShareRoomButton';
import { shareableRoomUrl } from './shareableRoomUrl';

beforeEach(() => copy.mockReset());

// The panel shows/copies the CANONICAL web URL (shareableRoomUrl), NOT
// window.location.href — inside the native app location.href is a
// capacitor://localhost/<room> link that opens nothing for the recipient.
const canonical = shareableRoomUrl();

describe('ShareRoomButton', () => {
  it('opens a share panel with a QR code and the canonical room URL', () => {
    render(<ShareRoomButton />);
    expect(screen.queryByTestId('share-panel')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('room-share'));
    expect(screen.getByTestId('share-panel')).toBeInTheDocument();
    expect(screen.getByTestId('share-qr')).toHaveAttribute('src', 'data:image/png;base64,QR');
    expect(screen.getByTestId('share-url')).toHaveTextContent(canonical);
    // The shared URL must be the real https web host, never a native/localhost one.
    expect(canonical).toMatch(/^https:\/\/stickies\.jpc\.io\//);
  });

  it('copies the canonical room URL via useCopyAction (which confirms success/failure)', () => {
    render(<ShareRoomButton />);
    fireEvent.click(screen.getByTestId('room-share'));
    fireEvent.click(screen.getByTestId('share-copy'));
    expect(copy).toHaveBeenCalledWith(canonical);
  });
});
