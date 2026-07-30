import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { copyCurrentUrl } = vi.hoisted(() => ({ copyCurrentUrl: vi.fn() }));
vi.mock('./copyCurrentUrl', () => ({ copyCurrentUrl }));

import { ShareRoomButton } from './ShareRoomButton';

beforeEach(() => copyCurrentUrl.mockReset());

describe('ShareRoomButton', () => {
  it('confirms after a successful copy', async () => {
    copyCurrentUrl.mockResolvedValue(true);
    const onCopied = vi.fn();
    render(<ShareRoomButton onCopied={onCopied} />);
    fireEvent.click(screen.getByTestId('room-share'));
    await waitFor(() => expect(onCopied).toHaveBeenCalledOnce());
  });

  it('does not confirm when the copy fails', async () => {
    copyCurrentUrl.mockResolvedValue(false);
    const onCopied = vi.fn();
    render(<ShareRoomButton onCopied={onCopied} />);
    fireEvent.click(screen.getByTestId('room-share'));
    await waitFor(() => expect(copyCurrentUrl).toHaveBeenCalled());
    expect(onCopied).not.toHaveBeenCalled();
  });
});
