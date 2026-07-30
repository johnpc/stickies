import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { copyCurrentUrl } = vi.hoisted(() => ({ copyCurrentUrl: vi.fn() }));
vi.mock('./copyCurrentUrl', () => ({ copyCurrentUrl }));
// Stub the QR generator (async canvas work) so the panel renders synchronously.
vi.mock('./useQrCode', () => ({ useQrCode: () => 'data:image/png;base64,QR' }));

import { ShareRoomButton } from './ShareRoomButton';

beforeEach(() => copyCurrentUrl.mockReset());

describe('ShareRoomButton', () => {
  it('opens a share panel with a QR code and the room URL', () => {
    render(<ShareRoomButton onCopied={vi.fn()} />);
    expect(screen.queryByTestId('share-panel')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('room-share'));
    expect(screen.getByTestId('share-panel')).toBeInTheDocument();
    expect(screen.getByTestId('share-qr')).toHaveAttribute('src', 'data:image/png;base64,QR');
    expect(screen.getByTestId('share-url')).toHaveTextContent(window.location.href);
  });

  it('confirms after copying from the panel', async () => {
    copyCurrentUrl.mockResolvedValue(true);
    const onCopied = vi.fn();
    render(<ShareRoomButton onCopied={onCopied} />);
    fireEvent.click(screen.getByTestId('room-share'));
    fireEvent.click(screen.getByTestId('share-copy'));
    await waitFor(() => expect(onCopied).toHaveBeenCalledOnce());
  });

  it('does not confirm when the copy fails', async () => {
    copyCurrentUrl.mockResolvedValue(false);
    const onCopied = vi.fn();
    render(<ShareRoomButton onCopied={onCopied} />);
    fireEvent.click(screen.getByTestId('room-share'));
    fireEvent.click(screen.getByTestId('share-copy'));
    await waitFor(() => expect(copyCurrentUrl).toHaveBeenCalled());
    expect(onCopied).not.toHaveBeenCalled();
  });
});
