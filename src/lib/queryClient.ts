import { QueryClient, MutationCache } from '@tanstack/react-query';
import { showToast } from '../features/shell/toastBus';

/** App-wide react-query client. Server state (Amplify data) lives here.
 *
 * The global mutation onError is a FALLBACK: it surfaces a generic toast only for
 * a mutation that doesn't handle its own errors, so a failed action can't fail
 * silently. Mutations that DO set their own `onError` (all the sticky writes use
 * notifyWriteError, which shows the real message + a Retry action) opt out — else
 * every failed write fired TWO toasts (this generic one AND the actionable one). */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
  mutationCache: new MutationCache({
    onError: (_error, _vars, _ctx, mutation) => {
      if (mutation.options.onError) return; // the mutation reports its own error
      showToast('Something went wrong. Check your connection and try again.');
    },
  }),
});
