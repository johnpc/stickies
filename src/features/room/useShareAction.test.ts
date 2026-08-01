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

  it('shares the RAW url but the copy fallback copies the readable (decoded) form', async () => {
    // Regression: the fallback copied the raw percent-encoded url, so a unicode
    // room pasted as %XX from the share-fallback but readable from the Copy button
    // (same panel, same room). The fallback now matches the Copy button.
    const encoded = 'https://stickies.jpc.io/%E6%97%A5%E6%9C%AC%E8%AA%9E'; // 日本語
    shareUrl.mockResolvedValue('failed');
    copyText.mockResolvedValue(true);
    const { result } = renderHook(() => useShareAction());
    await result.current(encoded);
    // Native share got the raw canonical url…
    expect(shareUrl).toHaveBeenCalledWith(encoded);
    // …but the copy fallback got the decoded, human-readable form.
    expect(copyText).toHaveBeenCalledWith('https://stickies.jpc.io/日本語');
  });
});
