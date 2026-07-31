import { afterEach, describe, expect, it, vi } from 'vitest';

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }));
vi.mock('../shell/toastBus', () => ({ showToast }));

import { notifyWriteError } from './notifyWriteError';

afterEach(() => {
  showToast.mockReset();
});

describe('notifyWriteError', () => {
  it("shows the error's message with a Retry action that re-runs the write", () => {
    const retry = vi.fn();
    notifyWriteError(new Error('Request timed out — check your connection and try again.'), retry);
    expect(showToast).toHaveBeenCalledWith(
      'Request timed out — check your connection and try again.',
      {
        label: 'Retry',
        run: expect.any(Function),
      },
    );
    // the action actually re-fires the write
    showToast.mock.calls[0][1].run();
    expect(retry).toHaveBeenCalledOnce();
  });

  it('falls back to a generic message for a non-Error/empty rejection', () => {
    notifyWriteError('nope', undefined);
    expect(showToast).toHaveBeenCalledWith('Something went wrong — try again.', undefined);
  });
});
