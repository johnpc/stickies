import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { copy } = vi.hoisted(() => ({ copy: vi.fn() }));
vi.mock('./useCopyAction', () => ({ useCopyAction: () => copy }));
// Stub the QR generator (async canvas work) so the panel renders synchronously.
vi.mock('./useQrCode', () => ({ useQrCode: () => 'data:image/png;base64,QR' }));

import { ShareRoomButton } from './ShareRoomButton';

beforeEach(() => copy.mockReset());

describe('ShareRoomButton', () => {
  it('opens a share panel with a QR code and the room URL', () => {
    render(<ShareRoomButton />);
    expect(screen.queryByTestId('share-panel')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('room-share'));
    expect(screen.getByTestId('share-panel')).toBeInTheDocument();
    expect(screen.getByTestId('share-qr')).toHaveAttribute('src', 'data:image/png;base64,QR');
    expect(screen.getByTestId('share-url')).toHaveTextContent(window.location.href);
  });

  it('copies the displayed room URL via useCopyAction (which confirms success/failure)', () => {
    render(<ShareRoomButton />);
    fireEvent.click(screen.getByTestId('room-share'));
    fireEvent.click(screen.getByTestId('share-copy'));
    expect(copy).toHaveBeenCalledWith(window.location.href);
  });
});
