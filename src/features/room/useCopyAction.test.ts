import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const { copyText, showToast } = vi.hoisted(() => ({ copyText: vi.fn(), showToast: vi.fn() }));
vi.mock('./copyText', () => ({ copyText }));
vi.mock('../shell/toastBus', () => ({ showToast }));

import { useCopyAction } from './useCopyAction';

afterEach(() => {
  copyText.mockReset();
  showToast.mockReset();
});

describe('useCopyAction', () => {
  it('copies the text and confirms with a toast on success', async () => {
    copyText.mockResolvedValue(true);
    const { result } = renderHook(() => useCopyAction());
    await result.current('hello');
    expect(copyText).toHaveBeenCalledWith('hello');
    expect(showToast).toHaveBeenCalledWith('Copied to clipboard');
  });

  it('shows a soft failure message when the clipboard write fails', async () => {
    copyText.mockResolvedValue(false);
    const { result } = renderHook(() => useCopyAction());
    await result.current('hello');
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/couldn.t copy/i));
  });
});
