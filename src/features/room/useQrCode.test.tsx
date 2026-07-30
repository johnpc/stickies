import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { toDataURL } = vi.hoisted(() => ({ toDataURL: vi.fn() }));
vi.mock('qrcode', () => ({ default: { toDataURL } }));

import { useQrCode } from './useQrCode';

describe('useQrCode', () => {
  it('resolves a data URL for the text', async () => {
    toDataURL.mockResolvedValue('data:image/png;base64,ZZ');
    const { result } = renderHook(() => useQrCode('https://stickies.jpc.io/x'));
    await waitFor(() => expect(result.current).toBe('data:image/png;base64,ZZ'));
    expect(toDataURL).toHaveBeenCalledWith('https://stickies.jpc.io/x', expect.any(Object));
  });

  it('stays null when generation fails', async () => {
    toDataURL.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useQrCode('x'));
    await waitFor(() => expect(toDataURL).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });
});
