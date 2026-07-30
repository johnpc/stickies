import { describe, expect, it, vi } from 'vitest';
import { onToast, showToast } from './toastBus';

describe('toastBus', () => {
  it('delivers a message to subscribers', () => {
    const seen: string[] = [];
    const off = onToast((t) => seen.push(t.message));
    showToast('hi');
    expect(seen).toEqual(['hi']);
    off();
  });

  it('passes an optional action through', () => {
    const run = vi.fn();
    const off = onToast((t) => t.action?.run());
    showToast('do it', { label: 'Go', run });
    expect(run).toHaveBeenCalledOnce();
    off();
  });

  it('stops delivering after unsubscribe', () => {
    const fn = vi.fn();
    const off = onToast(fn);
    off();
    showToast('later');
    expect(fn).not.toHaveBeenCalled();
  });
});
