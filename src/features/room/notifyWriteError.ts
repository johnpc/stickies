import { showToast } from '../shell/toastBus';

/**
 * Surface a failed write as a retryable toast. Without this a write that
 * rejects (offline → `withTimeout` fires, or a GraphQL error) would silently
 * drop the sticky with no feedback — the "offline = silent loss" bug.
 */
export function notifyWriteError(error: unknown, retry?: () => void): void {
  const message =
    error instanceof Error && error.message ? error.message : 'Something went wrong — try again.';
  showToast(message, retry ? { label: 'Retry', run: retry } : undefined);
}
