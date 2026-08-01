import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { shareUrl } = vi.hoisted(() => ({ shareUrl: vi.fn() }));
vi.mock('./shareUrl', () => ({ shareUrl }));
const { copyText } = vi.hoisted(() => ({ copyText: vi.fn() }));
vi.mock('./copyText', () => ({ copyText }));

import { useShareAction } from './useShareAction';
import { onToast } from '../shell/toastBus';

const url = 'https://stickies.jpc.io/x';

beforeEach(() => {
  shareUrl.mockReset();
  copyText.mockReset();
});

describe('useShareAction', () => {
  it('shares natively and does NOT fall back / toast on success', async () => {
    shareUrl.mockResolvedValue('shared');
    let toasted = false;
    const off = onToast(() => (toasted = true));
    const { result } = renderHook(() => useShareAction());
    await result.current(url);
    off();
    expect(shareUrl).toHaveBeenCalledWith(url);
    expect(copyText).not.toHaveBeenCalled();
    expect(toasted).toBe(false);
  });

  it('stays silent when the user cancels the sheet', async () => {
    shareUrl.mockResolvedValue('cancelled');
    let toasted = false;
    const off = onToast(() => (toasted = true));
    const { result } = renderHook(() => useShareAction());
    await result.current(url);
    off();
    expect(copyText).not.toHaveBeenCalled();
    expect(toasted).toBe(false);
  });

  it('falls back to copying the link when sharing fails, confirming with a toast', async () => {
    shareUrl.mockResolvedValue('failed');
    copyText.mockResolvedValue(true);
    let msg = '';
    const off = onToast((t) => (msg = t.message));
    const { result } = renderHook(() => useShareAction());
    await result.current(url);
    off();
    expect(copyText).toHaveBeenCalledWith(url);
    expect(msg).toMatch(/copied/i);
  });

  it('falls back on unavailable, and reports if the copy also fails', async () => {
    shareUrl.mockResolvedValue('unavailable');
    copyText.mockResolvedValue(false);
    let msg = '';
    const off = onToast((t) => (msg = t.message));
    const { result } = renderHook(() => useShareAction());
    await result.current(url);
    off();
    expect(copyText).toHaveBeenCalledWith(url);
    expect(msg).toMatch(/manually/i);
  });
});
