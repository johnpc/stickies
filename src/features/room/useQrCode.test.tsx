import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { toDataURL } = vi.hoisted(() => ({ toDataURL: vi.fn() }));
vi.mock('qrcode', () => ({ default: { toDataURL } }));

import { useQrCode } from './useQrCode';

describe('useQrCode', () => {
  it('starts pending, then resolves to a ready data URL', async () => {
    toDataURL.mockResolvedValue('data:image/png;base64,ZZ');
    const { result } = renderHook(() => useQrCode('https://stickies.jpc.io/x'));
    expect(result.current.status).toBe('pending'); // no flash of a wrong state
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.dataUrl).toBe('data:image/png;base64,ZZ');
    expect(toDataURL).toHaveBeenCalledWith('https://stickies.jpc.io/x', expect.any(Object));
  });

  it('reports an ERROR status (distinct from pending) when generation fails', async () => {
    // Regression: pending and failure both returned null, so the panel showed an
    // eternal loading skeleton with no explanation on a genuine QR failure.
    toDataURL.mockRejectedValue(new Error('too big'));
    const { result } = renderHook(() => useQrCode('x'));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.dataUrl).toBeNull();
  });
});
